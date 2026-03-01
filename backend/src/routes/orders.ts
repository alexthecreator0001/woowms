import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '25', search } = req.query as Record<string, string | undefined>;
    const prisma = req.prisma!;

    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '25');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Scope orders to tenant's stores
    where.store = { tenantId: req.tenantId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, _count: { select: { shipments: true } } },
        orderBy: { wooCreatedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: { include: { product: true } }, shipments: true, pickLists: { include: { items: true } }, store: true },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { status } = req.body as { status: string };

    // Verify ownership
    const existing = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { store: true },
    });
    if (!existing || existing.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

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
