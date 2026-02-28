import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import { syncProducts } from '../woocommerce/sync.js';

const router = Router();

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
      where.stockQty = { lte: 5 };
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

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/inventory/low-stock
router.get('/low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: 5 },
        store: { tenantId: req.tenantId },
      },
      orderBy: { stockQty: 'asc' },
    });

    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

export default router;
