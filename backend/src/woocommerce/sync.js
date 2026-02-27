import { PrismaClient } from '@prisma/client';
import { getWooClient } from './client.js';

const prisma = new PrismaClient();

export async function syncOrders(store) {
  const woo = getWooClient(store);
  let page = 1;
  let hasMore = true;

  console.log(`[SYNC] Starting order sync for store: ${store.name}`);

  while (hasMore) {
    const { data: orders } = await woo.get('orders', {
      page,
      per_page: 50,
      after: store.lastSyncAt?.toISOString(),
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
          status: mapWooStatus(order.status),
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
            })).id,
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

export async function syncProducts(store) {
  const woo = getWooClient(store);
  let page = 1;
  let hasMore = true;

  console.log(`[SYNC] Starting product sync for store: ${store.name}`);

  while (hasMore) {
    const { data: products } = await woo.get('products', {
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
          price: product.price || 0,
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
          price: product.price || 0,
          stockQty: product.stock_quantity || 0,
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

export async function pushStockToWoo(store, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const woo = getWooClient(store);
  await woo.put(`products/${product.wooId}`, {
    stock_quantity: product.stockQty - product.reservedQty,
  });

  console.log(`[SYNC] Pushed stock for ${product.sku}: ${product.stockQty - product.reservedQty}`);
}

function mapWooStatus(wooStatus) {
  const map = {
    pending: 'PENDING',
    processing: 'PENDING',
    'on-hold': 'ON_HOLD',
    completed: 'DELIVERED',
    cancelled: 'CANCELLED',
    refunded: 'CANCELLED',
    failed: 'CANCELLED',
  };
  return map[wooStatus] || 'PENDING';
}
