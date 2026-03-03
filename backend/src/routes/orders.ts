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

// GET /api/v1/orders/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const storeWhere = { store: { tenantId: req.tenantId } };

    const counts = await prisma.order.groupBy({
      by: ['status'],
      where: storeWhere,
      _count: { id: true },
    });

    const total = counts.reduce((sum, c) => sum + c._count.id, 0);
    const byStatus: Record<string, number> = {};
    for (const c of counts) {
      byStatus[c.status] = c._count.id;
    }

    res.json({ data: { total, byStatus } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const includeRels = { items: { include: { product: true } }, shipments: true, pickLists: { include: { items: true } }, store: true };
    // Try orderNumber first (frontend sends order numbers), fall back to internal ID
    let order = await prisma.order.findFirst({
      where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } },
      include: includeRels,
    });
    if (!order && /^\d+$/.test(req.params.id)) {
      order = await prisma.order.findUnique({
        where: { id: parseInt(req.params.id) },
        include: includeRels,
      });
    }

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    // Customer stats: aggregate order count + total revenue for this customer
    let customerStats: { orderCount: number; totalRevenue: number; labels: { label: string; color: string }[] } | undefined;
    if (order.customerEmail) {
      const agg = await prisma.order.aggregate({
        where: { customerEmail: order.customerEmail, store: { tenantId: req.tenantId } },
        _count: { id: true },
        _sum: { total: true },
      });
      const orderCount = agg._count.id;
      const totalRevenue = agg._sum.total?.toNumber() || 0;

      // Compute labels from tenant order rules (backward compat: fall back to customerRules)
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { settings: true } });
      const allRules = ((tenant?.settings as any)?.orderRules || (tenant?.settings as any)?.customerRules || []) as { type?: string; condition: string; threshold: number; label?: string; color?: string }[];
      // Filter to customer_tag rules only (or legacy rules without a type)
      const tagRules = allRules.filter((r) => !r.type || r.type === 'customer_tag');
      const labels: { label: string; color: string }[] = [];
      for (const rule of tagRules) {
        if (!rule.label || !rule.color) continue;
        if (rule.condition === 'revenue_gt' && totalRevenue > rule.threshold) {
          labels.push({ label: rule.label, color: rule.color });
        } else if (rule.condition === 'orders_gt' && orderCount > rule.threshold) {
          labels.push({ label: rule.label, color: rule.color });
        } else if (rule.condition === 'order_total_gt' && order.total && order.total.toNumber() > rule.threshold) {
          labels.push({ label: rule.label, color: rule.color });
        }
      }

      customerStats = { orderCount, totalRevenue, labels };
    }

    res.json({ data: { ...order, customerStats } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { status } = req.body as { status: string };

    // Verify ownership — try orderNumber first, fall back to internal ID
    let existing = await prisma.order.findFirst({ where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } }, include: { store: true } });
    if (!existing && /^\d+$/.test(req.params.id)) {
      existing = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { store: true } });
    }
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
