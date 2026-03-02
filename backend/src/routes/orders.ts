import { Router, Request, Response, NextFunction } from 'express';
import { pushOrderStatus } from '../woocommerce/fetch.js';

const router = Router();

// GET /api/v1/orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '25', search } = req.query as Record<string, string | undefined>;
    const prisma = req.prisma!;

    const pageNum = parseInt(page || '1');
    const limitNum = Math.min(parseInt(limit || '25'), 100);

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
    // Try numeric ID first (internal), then orderNumber (user-facing URL)
    const isNumeric = /^\d+$/.test(req.params.id);
    const order = isNumeric
      ? await prisma.order.findUnique({
          where: { id: parseInt(req.params.id) },
          include: { items: { include: { product: true } }, shipments: true, pickLists: { include: { items: true } }, store: true },
        })
      : await prisma.order.findFirst({
          where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } },
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
    const isNumeric = /^\d+$/.test(req.params.id);
    const existing = isNumeric
      ? await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { store: true } })
      : await prisma.order.findFirst({ where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } }, include: { store: true } });
    if (!existing || existing.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    const order = await prisma.order.update({
      where: { id: existing!.id },
      data: { status },
    });

    // Push status back to WooCommerce if auto-push is enabled
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
      const settings = (tenant?.settings as Record<string, any>) || {};
      if (settings.autoStatusPush && settings.statusMapping) {
        const wooStatus = settings.statusMapping[status];
        if (wooStatus && existing!.store) {
          await pushOrderStatus(existing!.store as any, existing!.wooId, wooStatus);
        }
      }
    } catch (pushErr) {
      console.error(`[STATUS] Failed to push status to WooCommerce:`, (pushErr as Error).message);
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
