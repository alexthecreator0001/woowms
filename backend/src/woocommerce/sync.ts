import { PrismaClient } from '@prisma/client';
import type { Store } from '@prisma/client';
import { getWooClient } from './client.js';
import { notifyNewOrder } from '../services/slack.js';

const prisma = new PrismaClient();

// WooCommerce API response shapes
interface WooBilling {
  first_name: string;
  last_name: string;
  email: string;
  [key: string]: unknown;
}

interface WooLineItem {
  product_id: number;
  sku: string | null;
  name: string;
  quantity: number;
  price: string;
}

interface WooOrder {
  id: number;
  number: string;
  status: string;
  billing: WooBilling;
  shipping: Record<string, unknown>;
  total: string;
  currency: string;
  date_created: string;
  line_items: WooLineItem[];
  payment_method?: string;
  payment_method_title?: string;
  shipping_lines?: Array<{ method_id: string; method_title: string; instance_id?: string }>;
}

interface WooProduct {
  id: number;
  name: string;
  sku: string | null;
  short_description: string | null;
  price: string;
  stock_quantity: number | null;
  weight: string | null;
  dimensions: {
    length: string;
    width: string;
    height: string;
  } | null;
  images: { src: string }[];
  status: string;
  type: string;
  virtual: boolean;
  downloadable: boolean;
}

interface WooVariation {
  id: number;
  sku: string | null;
  price: string;
  stock_quantity: number | null;
  weight: string | null;
  dimensions: { length: string; width: string; height: string } | null;
  image: { src: string } | null;
  attributes: { name: string; option: string }[];
  status: string;
}

interface WooSetting {
  id: string;
  value: string;
}

function calculateProductSize(length: number | null, width: number | null, height: number | null): string | null {
  if (!length || !width || !height) return null;
  const volume = length * width * height;
  if (volume <= 500) return 'SMALL';
  if (volume <= 3000) return 'MEDIUM';
  if (volume <= 15000) return 'LARGE';
  if (volume <= 50000) return 'XLARGE';
  return 'OVERSIZED';
}

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

export async function syncOrders(store: Store): Promise<void> {
  if (!store.syncOrders) {
    console.log(`[SYNC] Order sync disabled for store: ${store.name}`);
    return;
  }

  const woo = getWooClient(store);
  const tenantSettings = await getTenantSettings(store.tenantId);
  let page = 1;
  let hasMore = true;

  console.log(`[SYNC] Starting order sync for store: ${store.name}`);

  // Determine the earliest date to fetch orders from
  const daysBackDate = new Date(Date.now() - store.syncDaysBack * 24 * 60 * 60 * 1000);
  const cutoffDate = store.syncSinceDate && store.syncSinceDate > daysBackDate
    ? store.syncSinceDate
    : daysBackDate;
  // Use the later of cutoffDate and lastSyncAt for incremental sync
  const afterDate = store.lastSyncAt && store.lastSyncAt > cutoffDate
    ? store.lastSyncAt
    : cutoffDate;

  // Build status filter
  const statusFilter = store.orderStatusFilter.length > 0
    ? store.orderStatusFilter.join(',')
    : undefined;

  while (hasMore) {
    const { data: orders } = await woo.get<WooOrder[]>('orders', {
      page,
      per_page: 50,
      after: afterDate.toISOString(),
      status: statusFilter,
      orderby: 'date',
      order: 'asc',
    });

    if (orders.length === 0) {
      hasMore = false;
      break;
    }

    for (const order of orders) {
      // Check if order already exists (for new-order rule detection)
      const existingOrder = await prisma.order.findUnique({
        where: { wooId_storeId: { wooId: order.id, storeId: store.id } },
      });

      await prisma.order.upsert({
        where: {
          wooId_storeId: { wooId: order.id, storeId: store.id },
        },
        update: {
          wooStatus: order.status,
          customerName: `${order.billing.first_name} ${order.billing.last_name}`,
          customerEmail: order.billing.email,
          shippingAddress: order.shipping,
          billingAddress: order.billing,
          total: order.total,
          currency: order.currency,
          paymentMethod: order.payment_method || null,
          paymentMethodTitle: order.payment_method_title || null,
          shippingMethod: order.shipping_lines?.[0] ? `${order.shipping_lines[0].method_id}:${order.shipping_lines[0].instance_id || '0'}` : null,
          shippingMethodTitle: order.shipping_lines?.[0]?.method_title || null,
          updatedAt: new Date(),
        },
        create: {
          wooId: order.id,
          storeId: store.id,
          orderNumber: order.number,
          wooStatus: order.status,
          status: mapWooStatus(order.status, tenantSettings),
          customerName: `${order.billing.first_name} ${order.billing.last_name}`,
          customerEmail: order.billing.email,
          shippingAddress: order.shipping,
          billingAddress: order.billing,
          total: order.total,
          currency: order.currency,
          paymentMethod: order.payment_method || null,
          paymentMethodTitle: order.payment_method_title || null,
          isPaid: order.payment_method !== 'cod',
          shippingMethod: order.shipping_lines?.[0] ? `${order.shipping_lines[0].method_id}:${order.shipping_lines[0].instance_id || '0'}` : null,
          shippingMethodTitle: order.shipping_lines?.[0]?.method_title || null,
          wooCreatedAt: new Date(order.date_created),
        },
      });

      // Sync order items
      for (const item of order.line_items) {
        const product = await prisma.product.findUnique({
          where: { wooId_storeId: { wooId: item.product_id, storeId: store.id } },
        });

        await prisma.orderItem.upsert({
          where: { id: -1 }, // force create — upsert by composite not available
          update: {},
          create: {
            orderId: (await prisma.order.findUnique({
              where: { wooId_storeId: { wooId: order.id, storeId: store.id } },
            }))!.id,
            wooProductId: item.product_id,
            productId: product?.id || null,
            sku: item.sku || null,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      // Apply order rules for NEW orders only
      if (!existingOrder) {
        const dbOrder = await prisma.order.findUnique({
          where: { wooId_storeId: { wooId: order.id, storeId: store.id } },
        });
        if (dbOrder) {
          await applyOrderRules(dbOrder.id, store.tenantId);
        }

        // Slack notification (fire-and-forget)
        notifyNewOrder(store.tenantId, {
          orderNumber: order.number,
          customerName: `${order.billing.first_name} ${order.billing.last_name}`,
          total: order.total,
          currency: order.currency,
          itemCount: order.line_items.length,
          isPaid: order.payment_method !== 'cod',
        });
      }
    }

    console.log(`[SYNC] Processed page ${page} (${orders.length} orders)`);
    page++;
  }

  await prisma.store.update({
    where: { id: store.id },
    data: { lastSyncAt: new Date() },
  });

  console.log(`[SYNC] Order sync complete for store: ${store.name}`);
}

export interface SyncOptions {
  mode?: 'add_only' | 'update_only' | 'add_and_update';
  importStock?: boolean;
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped: number;
}

export async function syncProducts(store: Store, options?: SyncOptions): Promise<SyncResult> {
  const mode = options?.mode || 'add_and_update';
  const importStock = options?.importStock ?? false;
  const result: SyncResult = { added: 0, updated: 0, skipped: 0 };

  if (!store.syncProducts) {
    console.log(`[SYNC] Product sync disabled for store: ${store.name}`);
    return result;
  }

  const woo = getWooClient(store);
  const tenantSettings = await getTenantSettings(store.tenantId);
  const lowStockThreshold = typeof tenantSettings.lowStockThreshold === 'number' ? tenantSettings.lowStockThreshold : 5;
  let page = 1;
  let hasMore = true;

  console.log(`[SYNC] Starting product sync for store: ${store.name} (mode: ${mode}, importStock: ${importStock})`);

  // Fetch store currency from WooCommerce settings
  let currency = 'USD';
  try {
    const { data: settings } = await woo.get<WooSetting[]>('settings/general');
    const currencySetting = settings.find((s: WooSetting) => s.id === 'woocommerce_currency');
    if (currencySetting?.value) currency = currencySetting.value;
  } catch {
    console.log(`[SYNC] Could not fetch currency setting, defaulting to USD`);
  }

  while (hasMore) {
    const { data: products } = await woo.get<WooProduct[]>('products', {
      page,
      per_page: 50,
    });

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    for (const product of products) {
      // Skip grouped and external products entirely
      if (product.type === 'grouped' || product.type === 'external') {
        result.skipped++;
        continue;
      }

      // Variable products: skip parent, import each variation instead
      if (product.type === 'variable') {
        // Deactivate any previously imported parent product
        const existingParent = await prisma.product.findUnique({
          where: { wooId_storeId: { wooId: product.id, storeId: store.id } },
        });
        if (existingParent) {
          await prisma.product.update({
            where: { id: existingParent.id },
            data: { isActive: false, productType: 'variable' },
          });
        }

        // Fetch all variations for this variable product
        let varPage = 1;
        let hasMoreVars = true;
        while (hasMoreVars) {
          const { data: variations } = await woo.get<WooVariation[]>(
            `products/${product.id}/variations`,
            { page: varPage, per_page: 100 }
          );

          if (variations.length === 0) {
            hasMoreVars = false;
            break;
          }

          for (const variation of variations) {
            const existing = await prisma.product.findUnique({
              where: { wooId_storeId: { wooId: variation.id, storeId: store.id } },
            });

            if (existing && mode === 'add_only') {
              result.skipped++;
              continue;
            }
            if (!existing && mode === 'update_only') {
              result.skipped++;
              continue;
            }

            // Build variation name: "Parent Name - Attr1 / Attr2"
            const attrString = variation.attributes.map(a => a.option).join(' / ');
            const varName = attrString ? `${product.name} - ${attrString}` : product.name;

            // Build variant attributes JSON: { "Size": "Large", "Color": "Red" }
            const variantAttributes: Record<string, string> = {};
            for (const attr of variation.attributes) {
              variantAttributes[attr.name] = attr.option;
            }

            const vLength = variation.dimensions?.length ? parseFloat(variation.dimensions.length) : (product.dimensions?.length ? parseFloat(product.dimensions.length) : null);
            const vWidth = variation.dimensions?.width ? parseFloat(variation.dimensions.width) : (product.dimensions?.width ? parseFloat(product.dimensions.width) : null);
            const vHeight = variation.dimensions?.height ? parseFloat(variation.dimensions.height) : (product.dimensions?.height ? parseFloat(product.dimensions.height) : null);

            const updateData: Record<string, unknown> = {
              name: varName,
              sku: variation.sku || null,
              description: product.short_description || null,
              price: variation.price || product.price || '0',
              currency,
              weight: variation.weight ? parseFloat(variation.weight) : (product.weight ? parseFloat(product.weight) : null),
              length: vLength,
              width: vWidth,
              height: vHeight,
              imageUrl: variation.image?.src || product.images?.[0]?.src || null,
              isActive: variation.status === 'publish' || product.status === 'publish',
              productType: 'variation',
              wooParentId: product.id,
              variantAttributes,
              sizeCategory: calculateProductSize(vLength, vWidth, vHeight),
              isDigital: product.virtual === true || product.downloadable === true,
            };

            if (importStock) {
              updateData.stockQty = variation.stock_quantity || 0;
            }

            if (existing) {
              await prisma.product.update({
                where: { id: existing.id },
                data: updateData,
              });
              result.updated++;
            } else {
              await prisma.product.create({
                data: {
                  wooId: variation.id,
                  storeId: store.id,
                  ...updateData,
                  stockQty: (importStock ? variation.stock_quantity : 0) || 0,
                  lowStockThreshold,
                } as any,
              });
              result.added++;
            }
          }

          varPage++;
        }
        continue;
      }

      // Simple products: import as before
      const existing = await prisma.product.findUnique({
        where: { wooId_storeId: { wooId: product.id, storeId: store.id } },
      });

      if (existing && mode === 'add_only') {
        result.skipped++;
        continue;
      }
      if (!existing && mode === 'update_only') {
        result.skipped++;
        continue;
      }

      const pLength = product.dimensions?.length ? parseFloat(product.dimensions.length) : null;
      const pWidth = product.dimensions?.width ? parseFloat(product.dimensions.width) : null;
      const pHeight = product.dimensions?.height ? parseFloat(product.dimensions.height) : null;

      const updateData: Record<string, unknown> = {
        name: product.name,
        sku: product.sku || null,
        description: product.short_description || null,
        price: product.price || '0',
        currency,
        weight: product.weight ? parseFloat(product.weight) : null,
        length: pLength,
        width: pWidth,
        height: pHeight,
        imageUrl: product.images?.[0]?.src || null,
        isActive: product.status === 'publish',
        productType: 'simple',
        sizeCategory: calculateProductSize(pLength, pWidth, pHeight),
        isDigital: product.virtual === true || product.downloadable === true,
      };

      if (importStock) {
        updateData.stockQty = product.stock_quantity || 0;
      }

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: updateData,
        });
        result.updated++;
      } else {
        await prisma.product.create({
          data: {
            wooId: product.id,
            storeId: store.id,
            ...updateData,
            stockQty: (importStock ? product.stock_quantity : 0) || 0,
            lowStockThreshold,
          } as any,
        });
        result.added++;
      }
    }

    console.log(`[SYNC] Processed page ${page} (${products.length} products)`);
    page++;
  }

  console.log(`[SYNC] Product sync complete for store: ${store.name} — added: ${result.added}, updated: ${result.updated}, skipped: ${result.skipped}`);
  return result;
}

// ─── Stock Push Types ─────────────────────────────────

interface ProductSyncSettings {
  pushEnabled?: boolean;
  outOfStockBehavior?: 'hide' | 'show_sold_out' | 'allow_backorders' | 'allow_backorders_notify';
  lowStockThreshold?: number;
}

interface PushStockResult {
  productId: number;
  sku: string | null;
  stockQuantity: number;
  stockStatus: string;
  backorders: string;
}

// ─── Helpers ──────────────────────────────────────────

export function shouldPushStock(
  tenantSettings: Record<string, unknown>,
  productSyncSettings?: ProductSyncSettings | null
): boolean {
  // Per-product override takes priority
  if (productSyncSettings?.pushEnabled !== undefined && productSyncSettings.pushEnabled !== null) {
    return productSyncSettings.pushEnabled;
  }
  // Fall back to tenant-level setting
  return tenantSettings.pushStockToWoo === true;
}

function getEffectiveBehavior(
  tenantSettings: Record<string, unknown>,
  productSyncSettings?: ProductSyncSettings | null
): string {
  if (productSyncSettings?.outOfStockBehavior) {
    return productSyncSettings.outOfStockBehavior;
  }
  return (tenantSettings.outOfStockBehavior as string) || 'show_sold_out';
}

function buildWooStockPayload(availableQty: number, behavior: string) {
  const isInStock = availableQty > 0;

  let stockStatus: string;
  let backorders: string;

  if (isInStock) {
    stockStatus = 'instock';
  } else {
    // Out of stock — behavior determines status
    switch (behavior) {
      case 'allow_backorders':
        stockStatus = 'onbackorder';
        break;
      case 'allow_backorders_notify':
        stockStatus = 'onbackorder';
        break;
      default: // 'hide' or 'show_sold_out'
        stockStatus = 'outofstock';
        break;
    }
  }

  switch (behavior) {
    case 'allow_backorders':
      backorders = 'yes';
      break;
    case 'allow_backorders_notify':
      backorders = 'notify';
      break;
    default:
      backorders = 'no';
      break;
  }

  return {
    stock_quantity: availableQty,
    manage_stock: true,
    stock_status: stockStatus,
    backorders,
  };
}

// ─── Push Stock to WooCommerce ────────────────────────

export async function pushStockToWoo(store: Store, productId: number): Promise<PushStockResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const tenantSettings = await getTenantSettings(store.tenantId);
  const productSyncSettings = product.syncSettings as ProductSyncSettings | null;

  const behavior = getEffectiveBehavior(tenantSettings, productSyncSettings);
  const availableQty = product.stockQty - product.reservedQty;
  const payload = buildWooStockPayload(availableQty, behavior);

  const woo = getWooClient(store);

  // Variations use a different API endpoint
  if (product.productType === 'variation' && product.wooParentId) {
    await woo.put(`products/${product.wooParentId}/variations/${product.wooId}`, payload);
  } else {
    await woo.put(`products/${product.wooId}`, payload);
  }

  console.log(`[SYNC] Pushed stock for ${product.sku}: qty=${availableQty}, status=${payload.stock_status}, backorders=${payload.backorders}`);

  return {
    productId: product.id,
    sku: product.sku,
    stockQuantity: availableQty,
    stockStatus: payload.stock_status,
    backorders: payload.backorders,
  };
}

// ─── Push Product Details to WooCommerce ──────────────

export async function pushProductToWoo(store: Store, productId: number): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const woo = getWooClient(store);
  const payload: Record<string, unknown> = {
    description: product.description || '',
    short_description: product.description || '',
    regular_price: String(product.price),
    weight: product.weight ? String(product.weight) : '',
    dimensions: {
      length: product.length ? String(product.length) : '',
      width: product.width ? String(product.width) : '',
      height: product.height ? String(product.height) : '',
    },
  };

  // Variations use a different API endpoint
  if (product.productType === 'variation' && product.wooParentId) {
    await woo.put(`products/${product.wooParentId}/variations/${product.wooId}`, payload);
  } else {
    await woo.put(`products/${product.wooId}`, payload);
  }
  console.log(`[SYNC] Pushed product details for ${product.sku} to WooCommerce`);
}

// ─── Order Rules Engine ──────────────────────────────

interface OrderRule {
  type?: string;
  condition: string;
  threshold: number;
  label?: string;
  color?: string;
  sku?: string;
  giftName?: string;
  priority?: number;
  note?: string;
}

function evaluateRuleCondition(
  rule: OrderRule,
  orderTotal: number,
  itemCount: number,
  paymentMethod: string | null
): boolean {
  switch (rule.condition) {
    case 'order_total_gt':
      return orderTotal > rule.threshold;
    case 'item_count_gt':
      return itemCount > rule.threshold;
    case 'is_cod':
      return paymentMethod === 'cod';
    default:
      return false;
  }
}

async function applyOrderRules(orderId: number, tenantId: number): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const settings = (tenant?.settings as Record<string, unknown>) || {};
  const rules = (settings.orderRules || settings.customerRules || []) as OrderRule[];

  // Only process sync-time rules (not customer_tag — those are read-time)
  const syncRules = rules.filter((r) => r.type && r.type !== 'customer_tag');
  if (syncRules.length === 0) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const orderTotal = order.total?.toNumber() || 0;
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const paymentMethod = order.paymentMethod;

  let highestPriority: number | null = null;
  const notes: string[] = [];

  for (const rule of syncRules) {
    if (!evaluateRuleCondition(rule, orderTotal, itemCount, paymentMethod)) continue;

    switch (rule.type) {
      case 'free_gift': {
        if (!rule.sku) break;
        // Dedup: check if gift item already exists
        const existing = await prisma.orderItem.findFirst({
          where: { orderId: order.id, sku: rule.sku },
        });
        if (!existing) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              wooProductId: 0,
              sku: rule.sku,
              name: rule.giftName || `Free Gift (${rule.sku})`,
              quantity: 1,
              price: '0',
            },
          });
          console.log(`[RULES] Added free gift ${rule.sku} to order ${order.orderNumber}`);
        }
        break;
      }
      case 'auto_priority': {
        const p = rule.priority || 1;
        if (highestPriority === null || p > highestPriority) {
          highestPriority = p;
        }
        break;
      }
      case 'auto_note': {
        if (rule.note) notes.push(rule.note);
        break;
      }
    }
  }

  // Apply priority + notes in a single update
  const updateData: Record<string, unknown> = {};
  if (highestPriority !== null) {
    updateData.priority = highestPriority;
    console.log(`[RULES] Set priority ${highestPriority} on order ${order.orderNumber}`);
  }
  if (notes.length > 0) {
    const existing = order.notes || '';
    updateData.notes = existing ? `${existing}\n${notes.join('\n')}` : notes.join('\n');
    console.log(`[RULES] Added ${notes.length} auto-note(s) to order ${order.orderNumber}`);
  }
  if (Object.keys(updateData).length > 0) {
    await prisma.order.update({ where: { id: order.id }, data: updateData });
  }
}

function mapWooStatus(wooStatus: string, tenantSettings?: Record<string, unknown>): string {
  const defaults: Record<string, string> = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    'on-hold': 'ON_HOLD',
    completed: 'DELIVERED',
    cancelled: 'CANCELLED',
    refunded: 'CANCELLED',
    failed: 'CANCELLED',
  };

  const customMapping = tenantSettings?.statusMapping as Record<string, string> | undefined;
  if (customMapping && customMapping[wooStatus]) {
    return customMapping[wooStatus];
  }

  const defaultNewOrderStatus = tenantSettings?.defaultNewOrderStatus as string | undefined;
  return defaults[wooStatus] || defaultNewOrderStatus || 'PENDING';
}
