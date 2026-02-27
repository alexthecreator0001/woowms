import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 25, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, _count: { select: { shipments: true } } },
        orderBy: { wooCreatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      meta: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: { include: { product: true } }, shipments: true, pickLists: { include: { items: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
