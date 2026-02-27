import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/inventory
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, lowStock } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (lowStock === 'true') {
      where.stockQty = { lte: prisma.product.fields?.lowStockThreshold ?? 5 };
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
router.patch('/:id/adjust', authenticate, async (req, res, next) => {
  try {
    const { quantity, reason, binId } = req.body;
    const productId = parseInt(req.params.id);

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
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT * FROM products
      WHERE stock_qty <= low_stock_threshold AND is_active = true
      ORDER BY stock_qty ASC
    `;
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

export default router;
