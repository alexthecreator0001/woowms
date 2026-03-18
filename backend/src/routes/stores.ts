import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import { syncOrders, syncProducts } from '../woocommerce/sync.js';
import { encrypt } from '../lib/crypto.js';
import { fetchShippingMethods, fetchPaymentGateways, fetchOrderStatuses } from '../woocommerce/fetch.js';
import type { Prisma } from '@prisma/client';

const router = Router();

// GET /api/v1/stores — list tenant's stores
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stores = await req.prisma!.store.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        lastSyncAt: true,
        syncOrders: true,
        syncProducts: true,
        syncInventory: true,
        autoSync: true,
        syncIntervalMin: true,
        orderStatusFilter: true,
        syncDaysBack: true,
        syncSinceDate: true,
        shippingProvider: true,
        shippingApiKey: true,
        createdAt: true,
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Never expose the encrypted API key — only return a boolean indicator
    // Also check TenantPlugin fallback for shipping provider (survives store reconnects)
    let pluginProvider: string | null = null;
    if (stores.some((s) => s.isActive && !s.shippingProvider)) {
      const shippingPlugin = await req.prisma!.tenantPlugin.findFirst({
        where: {
          tenantId: req.tenantId,
          isEnabled: true,
          pluginKey: { in: ['shippo', 'easypost'] },
        },
      });
      if (shippingPlugin) {
        pluginProvider = shippingPlugin.pluginKey;
      }
    }

    const data = stores.map(({ shippingApiKey, ...store }) => ({
      ...store,
      shippingProvider: store.shippingProvider || (store.isActive ? pluginProvider : null),
      hasShippingApiKey: !!shippingApiKey || (store.isActive && !!pluginProvider),
    }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stores — connect a new WooCommerce store
router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, url, consumerKey, consumerSecret, webhookSecret } = req.body;

    if (!name || !url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: true, message: 'name, url, consumerKey, and consumerSecret are required', code: 'VALIDATION_ERROR' });
    }

    const store = await req.prisma!.store.create({
      data: {
        name,
        url,
        consumerKey: encrypt(consumerKey),
        consumerSecret: encrypt(consumerSecret),
        webhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
      },
    });

    res.status(201).json({
      data: {
        id: store.id,
        name: store.name,
        url: store.url,
        isActive: store.isActive,
        createdAt: store.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:id — update store settings
router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, url, consumerKey, consumerSecret, webhookSecret, isActive } = req.body;
    const data: Prisma.StoreUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (consumerKey !== undefined) data.consumerKey = encrypt(consumerKey);
    if (consumerSecret !== undefined) data.consumerSecret = encrypt(consumerSecret);
    if (webhookSecret !== undefined) data.webhookSecret = webhookSecret ? encrypt(webhookSecret) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const store = await req.prisma!.store.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    res.json({
      data: {
        id: store.id,
        name: store.name,
        url: store.url,
        isActive: store.isActive,
        lastSyncAt: store.lastSyncAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/stores/:id — disconnect a store
// ?purge=1 to also delete all products, orders, stock locations, shipments, etc.
router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const storeId = parseInt(req.params.id);
    const purge = req.query.purge === '1';

    // Always mark store as inactive
    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: false },
    });

    if (purge) {
      // Delete in correct order to respect FK constraints
      // 1. Stock movements (reference product + bins)
      await prisma.stockMovement.deleteMany({ where: { product: { storeId } } });
      // 2. Stock locations (reference product + bins)
      await prisma.stockLocation.deleteMany({ where: { product: { storeId } } });
      // 3. Pick list items → pick lists
      await prisma.pickListItem.deleteMany({ where: { pickList: { order: { storeId } } } });
      await prisma.pickList.deleteMany({ where: { order: { storeId } } });
      // 4. Shipments
      await prisma.shipment.deleteMany({ where: { order: { storeId } } });
      // 5. Orders
      await prisma.order.deleteMany({ where: { storeId } });
      // 6. Supplier products
      await prisma.supplierProduct.deleteMany({ where: { product: { storeId } } });
      // 7. Product barcodes
      await prisma.productBarcode.deleteMany({ where: { product: { storeId } } });
      // 8. Bundle components
      await prisma.bundleComponent.deleteMany({ where: { bundleProduct: { storeId } } });
      // 9. Shipping mappings
      await prisma.shippingMapping.deleteMany({ where: { storeId } });
      // 10. Products
      await prisma.product.deleteMany({ where: { storeId } });

      return res.json({ data: { message: 'Store disconnected and all data deleted' } });
    }

    res.json({ data: { message: 'Store disconnected' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:id/sync-settings — update sync preferences
router.patch('/:id/sync-settings', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = parseInt(req.params.id);
    const { syncOrders, syncProducts, syncInventory, autoSync, syncIntervalMin, orderStatusFilter, syncDaysBack, syncSinceDate } = req.body;

    const data: Prisma.StoreUpdateInput = {};
    if (syncOrders !== undefined) data.syncOrders = syncOrders;
    if (syncProducts !== undefined) data.syncProducts = syncProducts;
    if (syncInventory !== undefined) data.syncInventory = syncInventory;
    if (autoSync !== undefined) data.autoSync = autoSync;
    if (syncIntervalMin !== undefined) data.syncIntervalMin = syncIntervalMin;
    if (orderStatusFilter !== undefined) data.orderStatusFilter = orderStatusFilter;
    if (syncDaysBack !== undefined) data.syncDaysBack = syncDaysBack;
    if (syncSinceDate !== undefined) data.syncSinceDate = syncSinceDate ? new Date(syncSinceDate) : null;

    const store = await req.prisma!.store.update({
      where: { id: storeId },
      data,
      select: {
        id: true,
        syncOrders: true,
        syncProducts: true,
        syncInventory: true,
        autoSync: true,
        syncIntervalMin: true,
        orderStatusFilter: true,
        syncDaysBack: true,
        syncSinceDate: true,
      },
    });

    res.json({ data: store });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stores/:id/sync — trigger manual sync
router.post('/:id/sync', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await req.prisma!.store.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!store) {
      return res.status(404).json({ error: true, message: 'Store not found', code: 'NOT_FOUND' });
    }

    await syncOrders(store);
    await syncProducts(store);

    await req.prisma!.store.update({
      where: { id: store.id },
      data: { lastSyncAt: new Date() },
    });

    res.json({ data: { message: 'Sync complete' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/stores/:id/woo-config — fetch WooCommerce configuration
router.get('/:id/woo-config', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await req.prisma!.store.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!store) {
      return res.status(404).json({ error: true, message: 'Store not found', code: 'NOT_FOUND' });
    }

    const [shippingMethods, paymentGateways, orderStatuses] = await Promise.all([
      fetchShippingMethods(store),
      fetchPaymentGateways(store),
      fetchOrderStatuses(store),
    ]);

    res.json({ data: { shippingMethods, paymentGateways, orderStatuses } });
  } catch (err) {
    next(err);
  }
});

export default router;
