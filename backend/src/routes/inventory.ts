import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import { syncProducts, pushStockToWoo, pushProductToWoo, shouldPushStock } from '../woocommerce/sync.js';
import prisma from '../lib/prisma.js';

const router = Router();

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

async function getLowStockThreshold(tenantId: number): Promise<number> {
  const settings = await getTenantSettings(tenantId);
  return typeof settings.lowStockThreshold === 'number' ? settings.lowStockThreshold : 5;
}

// GET /api/v1/inventory/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantWhere = { isActive: true, store: { tenantId: req.tenantId } };

    const aggregation = await prisma.product.aggregate({
      where: tenantWhere,
      _sum: { stockQty: true, reservedQty: true },
    });

    const inStock = aggregation._sum.stockQty || 0;
    const reserved = aggregation._sum.reservedQty || 0;

    // Incoming: sum of (orderedQty - receivedQty) from PO items where PO is ORDERED or PARTIALLY_RECEIVED
    const incomingResult = await prisma.purchaseOrderItem.aggregate({
      where: {
        purchaseOrder: {
          status: { in: ['ORDERED', 'PARTIALLY_RECEIVED'] },
          tenantId: req.tenantId,
        },
      },
      _sum: { orderedQty: true, receivedQty: true },
    });

    const totalOrdered = incomingResult._sum.orderedQty || 0;
    const totalReceived = incomingResult._sum.receivedQty || 0;
    const incoming = totalOrdered - totalReceived;

    res.json({
      data: {
        inStock,
        reserved,
        incoming: incoming > 0 ? incoming : 0,
        freeToSell: inStock - reserved,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/inventory/sync (ADMIN/MANAGER only)
router.post('/sync', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;

    const stores = await prisma.store.findMany({
      where: { tenantId: req.tenantId, isActive: true },
    });

    for (const store of stores) {
      await syncProducts(store as any);
    }

    res.json({
      data: { message: 'Product sync completed', storeCount: stores.length },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '25', search, lowStock } = req.query as Record<string, string | undefined>;
    const prisma = req.prisma!;

    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '25');

    const where: any = { isActive: true, store: { tenantId: req.tenantId } };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (lowStock === 'true') {
      const threshold = await getLowStockThreshold(req.tenantId!);
      where.stockQty = { lte: threshold };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { stockLocations: { include: { bin: { include: { zone: true } } } } },
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        store: true,
        stockLocations: { include: { bin: { include: { zone: true } } } },
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
        barcodes: true,
        supplierProducts: { include: { supplier: true } },
        bundleComponents: { include: { componentProduct: true } },
        bundleParents: { include: { bundleProduct: true } },
      },
    });

    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/inventory/:id/adjust
router.patch('/:id/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, reason, binId } = req.body as { quantity: number; reason?: string; binId?: number };
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;

    // Verify product belongs to tenant's store
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!existing || existing.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantity } },
    });

    await prisma.stockMovement.create({
      data: {
        productId,
        type: 'ADJUSTED',
        quantity,
        reason: reason || 'Manual adjustment',
        toBin: binId ? String(binId) : null,
      },
    });

    // Push stock to WooCommerce if enabled
    try {
      const tenantSettings = await getTenantSettings(req.tenantId!);
      const productSyncSettings = product.syncSettings as Record<string, unknown> | null;
      if (shouldPushStock(tenantSettings, productSyncSettings)) {
        await pushStockToWoo(existing.store as any, productId);
      }
    } catch (pushErr) {
      console.error('[SYNC] Failed to push stock after adjust:', pushErr);
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/inventory/push-stock-all (ADMIN/MANAGER only)
router.post('/push-stock-all', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantSettings = await getTenantSettings(req.tenantId!);

    if (!tenantSettings.pushStockToWoo) {
      return res.status(400).json({ error: true, message: 'Stock push is not enabled', code: 'PUSH_DISABLED' });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, store: { tenantId: req.tenantId } },
      include: { store: true },
    });

    const results: Array<{ productId: number; sku: string | null; success: boolean; error?: string }> = [];

    for (const product of products) {
      try {
        const productSyncSettings = product.syncSettings as Record<string, unknown> | null;
        if (!shouldPushStock(tenantSettings, productSyncSettings)) {
          continue; // Skip products with push explicitly disabled
        }
        const result = await pushStockToWoo(product.store as any, product.id);
        results.push({ productId: result.productId, sku: result.sku, success: true });
      } catch (err: unknown) {
        results.push({
          productId: product.id,
          sku: product.sku,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const pushed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      data: { message: `Pushed ${pushed} products, ${failed} failed`, pushed, failed, results },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/low-stock
router.get('/low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;

    const threshold = await getLowStockThreshold(req.tenantId!);

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: threshold },
        store: { tenantId: req.tenantId },
      },
      orderBy: { stockQty: 'asc' },
    });

    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/inventory/:id/push-stock (ADMIN/MANAGER only)
router.post('/:id/push-stock', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const result = await pushStockToWoo(product.store as any, productId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/:id/sync-settings
router.get('/:id/sync-settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    res.json({ data: product.syncSettings || {} });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/inventory/:id/sync-settings (ADMIN/MANAGER only)
router.patch('/:id/sync-settings', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const { pushEnabled, outOfStockBehavior, lowStockThreshold } = req.body as {
      pushEnabled?: boolean;
      outOfStockBehavior?: string;
      lowStockThreshold?: number;
    };

    const syncSettings: Record<string, unknown> = {};
    if (pushEnabled !== undefined) syncSettings.pushEnabled = pushEnabled;
    if (outOfStockBehavior !== undefined) syncSettings.outOfStockBehavior = outOfStockBehavior;
    if (lowStockThreshold !== undefined) syncSettings.lowStockThreshold = lowStockThreshold;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { syncSettings },
    });

    res.json({ data: updated.syncSettings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/inventory/:id — update product fields (ADMIN/MANAGER only)
router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!existing || existing.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const { description, price, weight, length, width, height, lowStockThreshold, packageQty, isBundle } = req.body as {
      description?: string;
      price?: string;
      weight?: string | null;
      length?: string | null;
      width?: string | null;
      height?: string | null;
      lowStockThreshold?: number;
      packageQty?: number | null;
      isBundle?: boolean;
    };

    const data: Record<string, unknown> = {};
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price) || 0;
    if (weight !== undefined) data.weight = weight ? parseFloat(weight) : null;
    if (length !== undefined) data.length = length ? parseFloat(length) : null;
    if (width !== undefined) data.width = width ? parseFloat(width) : null;
    if (height !== undefined) data.height = height ? parseFloat(height) : null;
    if (lowStockThreshold !== undefined) data.lowStockThreshold = lowStockThreshold;
    if (packageQty !== undefined) data.packageQty = packageQty;
    if (isBundle !== undefined) data.isBundle = isBundle;

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        store: true,
        stockLocations: { include: { bin: { include: { zone: true } } } },
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    // Push product edits to WooCommerce if enabled
    try {
      const tenantSettings = await getTenantSettings(req.tenantId!);
      if (tenantSettings.pushProductEditsToWoo === true) {
        await pushProductToWoo(existing.store as any, productId);
      }
    } catch (pushErr) {
      console.error('[SYNC] Failed to push product edit to WooCommerce:', pushErr);
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/:id/orders — orders containing this product
router.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 10, 1), 50);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    // Find orders that have order items referencing this product (by productId or SKU)
    const where: any = {
      store: { tenantId: req.tenantId },
      items: {
        some: {
          OR: [
            { productId },
            ...(product.sku ? [{ sku: product.sku }] : []),
          ],
        },
      },
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            where: {
              OR: [
                { productId },
                ...(product.sku ? [{ sku: product.sku }] : []),
              ],
            },
          },
        },
        orderBy: { wooCreatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/:id/purchase-orders — POs containing this product's SKU
router.get('/:id/purchase-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 10, 1), 50);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    if (!product.sku) {
      return res.json({ data: [], meta: { page, limit, total: 0, pages: 0 } });
    }

    const where = {
      tenantId: req.tenantId!,
      items: { some: { sku: product.sku } },
    };

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          items: { where: { sku: product.sku } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      data: purchaseOrders,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/:id/stock-movements — paginated stock movements
router.get('/:id/stock-movements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prisma = req.prisma!;
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 20, 1), 100);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const where = { productId };
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({
      data: movements,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Barcode Endpoints ────────────────────────────────

// GET /api/v1/inventory/:id/barcodes — list barcodes for a product
router.get('/:id/barcodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prismaClient = req.prisma!;
    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }
    const barcodes = await prismaClient.productBarcode.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
    res.json({ data: barcodes });
  } catch (err) { next(err); }
});

// POST /api/v1/inventory/:id/barcodes — add barcode (ADMIN/MANAGER)
router.post('/:id/barcodes', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prismaClient = req.prisma!;
    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const { barcode, type, isPrimary } = req.body as { barcode: string; type?: string; isPrimary?: boolean };
    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ error: true, message: 'Barcode value is required', code: 'VALIDATION_ERROR' });
    }

    // If setting as primary, unset all existing primary barcodes for this product
    if (isPrimary) {
      await prismaClient.productBarcode.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const created = await prismaClient.productBarcode.create({
      data: {
        productId,
        barcode: barcode.trim(),
        type: type || 'EAN13',
        isPrimary: isPrimary || false,
      },
    });

    res.status(201).json({ data: created });
  } catch (err) { next(err); }
});

// PATCH /api/v1/inventory/:id/barcodes/:barcodeId — update barcode (ADMIN/MANAGER)
router.patch('/:id/barcodes/:barcodeId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const barcodeId = parseInt(req.params.barcodeId);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const existing = await prismaClient.productBarcode.findFirst({ where: { id: barcodeId, productId } });
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Barcode not found', code: 'NOT_FOUND' });
    }

    const { isPrimary, type } = req.body as { isPrimary?: boolean; type?: string };
    const data: Record<string, unknown> = {};

    if (isPrimary !== undefined) {
      // If setting as primary, unset all others first
      if (isPrimary) {
        await prismaClient.productBarcode.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      data.isPrimary = isPrimary;
    }
    if (type !== undefined) data.type = type;

    const updated = await prismaClient.productBarcode.update({
      where: { id: barcodeId },
      data,
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/v1/inventory/:id/barcodes/:barcodeId — delete barcode (ADMIN/MANAGER)
router.delete('/:id/barcodes/:barcodeId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const barcodeId = parseInt(req.params.barcodeId);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const existing = await prismaClient.productBarcode.findFirst({ where: { id: barcodeId, productId } });
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Barcode not found', code: 'NOT_FOUND' });
    }

    await prismaClient.productBarcode.delete({ where: { id: barcodeId } });
    res.json({ data: { message: 'Barcode deleted' } });
  } catch (err) { next(err); }
});

// ─── Bundle Endpoints ─────────────────────────────────

// GET /api/v1/inventory/:id/bundle — get bundle components
router.get('/:id/bundle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const components = await prismaClient.bundleItem.findMany({
      where: { bundleProductId: productId },
      include: {
        componentProduct: {
          select: { id: true, name: true, sku: true, stockQty: true, reservedQty: true, imageUrl: true },
        },
      },
    });

    res.json({ data: components });
  } catch (err) { next(err); }
});

// POST /api/v1/inventory/:id/bundle — add component to bundle (ADMIN/MANAGER)
router.post('/:id/bundle', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const { componentProductId, quantity } = req.body as { componentProductId: number; quantity?: number };
    if (!componentProductId) {
      return res.status(400).json({ error: true, message: 'componentProductId is required', code: 'VALIDATION_ERROR' });
    }

    // Auto-set isBundle on the product if not already
    if (!product.isBundle) {
      await prismaClient.product.update({ where: { id: productId }, data: { isBundle: true } });
    }

    const item = await prismaClient.bundleItem.create({
      data: {
        bundleProductId: productId,
        componentProductId,
        quantity: quantity || 1,
      },
      include: {
        componentProduct: {
          select: { id: true, name: true, sku: true, stockQty: true, reservedQty: true, imageUrl: true },
        },
      },
    });

    res.status(201).json({ data: item });
  } catch (err) { next(err); }
});

// PATCH /api/v1/inventory/:id/bundle/:itemId — update bundle component quantity (ADMIN/MANAGER)
router.patch('/:id/bundle/:itemId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const existing = await prismaClient.bundleItem.findFirst({ where: { id: itemId, bundleProductId: productId } });
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Bundle item not found', code: 'NOT_FOUND' });
    }

    const { quantity } = req.body as { quantity: number };
    const updated = await prismaClient.bundleItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        componentProduct: {
          select: { id: true, name: true, sku: true, stockQty: true, reservedQty: true, imageUrl: true },
        },
      },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/v1/inventory/:id/bundle/:itemId — remove component from bundle (ADMIN/MANAGER)
router.delete('/:id/bundle/:itemId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    const existing = await prismaClient.bundleItem.findFirst({ where: { id: itemId, bundleProductId: productId } });
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Bundle item not found', code: 'NOT_FOUND' });
    }

    await prismaClient.bundleItem.delete({ where: { id: itemId } });
    res.json({ data: { message: 'Bundle component removed' } });
  } catch (err) { next(err); }
});

// ─── Incoming Stock Endpoint ──────────────────────────

// GET /api/v1/inventory/:id/incoming — get incoming stock from purchase orders
router.get('/:id/incoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.id);
    const prismaClient = req.prisma!;

    const product = await prismaClient.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product || product.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Product not found', code: 'NOT_FOUND' });
    }

    if (!product.sku) {
      return res.json({ data: { incoming: 0, purchaseOrders: [] } });
    }

    const items = await prismaClient.purchaseOrderItem.findMany({
      where: {
        sku: product.sku,
        purchaseOrder: {
          tenantId: req.tenantId!,
          status: { in: ['ORDERED', 'PARTIALLY_RECEIVED'] },
        },
      },
      include: {
        purchaseOrder: true,
      },
    });

    const incoming = items.reduce((sum, i) => sum + Math.max(i.orderedQty - i.receivedQty, 0), 0);

    const purchaseOrders = items
      .filter((i) => i.orderedQty - i.receivedQty > 0)
      .map((i) => ({
        id: i.purchaseOrder.id,
        poNumber: i.purchaseOrder.poNumber,
        supplier: i.purchaseOrder.supplier,
        expectedDate: i.purchaseOrder.expectedDate,
        incoming: i.orderedQty - i.receivedQty,
      }));

    res.json({ data: { incoming, purchaseOrders } });
  } catch (err) { next(err); }
});

export default router;
