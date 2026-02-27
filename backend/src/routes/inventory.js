import { Router } from 'express';

const router = Router();

// GET /api/v1/inventory
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, lowStock } = req.query;
    const prisma = req.prisma;

    const where = { isActive: true, store: { tenantId: req.tenantId } };
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
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      meta: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/inventory/:id/adjust
router.patch('/:id/adjust', async (req, res, next) => {
  try {
    const { quantity, reason, binId } = req.body;
    const productId = parseInt(req.params.id);
    const prisma = req.prisma;

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
router.get('/low-stock', async (req, res, next) => {
  try {
    const prisma = req.prisma;

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
