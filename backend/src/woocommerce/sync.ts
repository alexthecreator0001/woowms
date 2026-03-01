import { PrismaClient } from '@prisma/client';
import type { Store } from '@prisma/client';
import { getWooClient } from './client.js';

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
}

interface WooSetting {
  id: string;
  value: string;
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

export async function syncProducts(store: Store): Promise<void> {
  if (!store.syncProducts) {
    console.log(`[SYNC] Product sync disabled for store: ${store.name}`);
    return;
  }

  const woo = getWooClient(store);
  const tenantSettings = await getTenantSettings(store.tenantId);
  const lowStockThreshold = typeof tenantSettings.lowStockThreshold === 'number' ? tenantSettings.lowStockThreshold : 5;
  let page = 1;
  let hasMore = true;

  console.log(`[SYNC] Starting product sync for store: ${store.name}`);

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
      await prisma.product.upsert({
        where: {
          wooId_storeId: { wooId: product.id, storeId: store.id },
        },
        update: {
          name: product.name,
          sku: product.sku || null,
          description: product.short_description || null,
          price: product.price || '0',
          currency,
          stockQty: product.stock_quantity || 0,
          weight: product.weight ? parseFloat(product.weight) : null,
          length: product.dimensions?.length ? parseFloat(product.dimensions.length) : null,
          width: product.dimensions?.width ? parseFloat(product.dimensions.width) : null,
          height: product.dimensions?.height ? parseFloat(product.dimensions.height) : null,
          imageUrl: product.images?.[0]?.src || null,
          isActive: product.status === 'publish',
        },
        create: {
          wooId: product.id,
          storeId: store.id,
          name: product.name,
          sku: product.sku || null,
          description: product.short_description || null,
          price: product.price || '0',
          currency,
          stockQty: product.stock_quantity || 0,
          lowStockThreshold,
          weight: product.weight ? parseFloat(product.weight) : null,
          length: product.dimensions?.length ? parseFloat(product.dimensions.length) : null,
          width: product.dimensions?.width ? parseFloat(product.dimensions.width) : null,
          height: product.dimensions?.height ? parseFloat(product.dimensions.height) : null,
          imageUrl: product.images?.[0]?.src || null,
          isActive: product.status === 'publish',
        },
      });
    }

    console.log(`[SYNC] Processed page ${page} (${products.length} products)`);
    page++;
  }

  console.log(`[SYNC] Product sync complete for store: ${store.name}`);
}

export async function pushStockToWoo(store: Store, productId: number): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const woo = getWooClient(store);
  await woo.put(`products/${product.wooId}`, {
    stock_quantity: product.stockQty - product.reservedQty,
  });

  console.log(`[SYNC] Pushed stock for ${product.sku}: ${product.stockQty - product.reservedQty}`);
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
