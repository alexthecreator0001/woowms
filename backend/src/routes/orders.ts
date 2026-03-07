import { Router, Request, Response, NextFunction } from 'express';
import { pushOrderStatus } from '../woocommerce/fetch.js';
import { buildCsv, sendCsv, resolveDelimiter, formatDate, filterColumns, type ColumnDef } from '../lib/csv.js';

const router = Router();

// GET /api/v1/orders/export — CSV export
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { status, columns: colParam, delimiter: delimParam, dateFormat } = req.query as Record<string, string | undefined>;
    const delim = resolveDelimiter(delimParam);
    const dateFmt = dateFormat || 'YYYY-MM-DD';

    const where: any = { store: { tenantId: req.tenantId } };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, store: { select: { name: true } } },
      orderBy: { wooCreatedAt: 'desc' },
    });

    const registry: ColumnDef<(typeof orders)[0]>[] = [
      { key: 'orderNumber', header: 'Order #', accessor: (o) => o.orderNumber },
      { key: 'status', header: 'Status', accessor: (o) => o.status },
      { key: 'customerName', header: 'Customer Name', accessor: (o) => o.customerName || '' },
      { key: 'customerEmail', header: 'Customer Email', accessor: (o) => o.customerEmail || '' },
      { key: 'total', header: 'Total', accessor: (o) => o.total ? String(o.total) : '' },
      { key: 'currency', header: 'Currency', accessor: (o) => o.currency || '' },
      { key: 'paymentMethod', header: 'Payment Method', accessor: (o) => o.paymentMethodTitle || o.paymentMethod || '' },
      { key: 'shippingMethod', header: 'Shipping Method', accessor: (o) => o.shippingMethodTitle || o.shippingMethod || '' },
      { key: 'itemsCount', header: 'Items Count', accessor: (o) => o.items?.length || 0 },
      { key: 'createdAt', header: 'Created At', accessor: (o) => formatDate(o.wooCreatedAt, dateFmt) },
      { key: 'store', header: 'Store', accessor: (o) => (o.store as any)?.name || '' },
    ];

    const cols = filterColumns(registry, colParam);
    const headers = cols.map((c) => c.header);
    const rows = orders.map((o) => cols.map((c) => c.accessor(o)));

    sendCsv(res, 'orders-export.csv', buildCsv(headers, rows, delim));
  } catch (err) {
    next(err);
  }
});

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
        include: { items: { include: { product: { select: { imageUrl: true } } } }, _count: { select: { shipments: true } } },
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
    let customerStats: { orderCount: number; totalRevenue: number; labels: { label: string; color: string }[]; manualTags: { label: string; color: string }[] } | undefined;
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

      // Manual customer tags from tenant settings
      const manualTags = ((tenant?.settings as any)?.customerTags?.[order.customerEmail!] || []) as { label: string; color: string }[];
      customerStats = { orderCount, totalRevenue, labels, manualTags };
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

// PATCH /api/v1/orders/:id — update order fields (tags, packingNote)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    let existing = await prisma.order.findFirst({ where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } }, include: { store: true } });
    if (!existing && /^\d+$/.test(req.params.id)) {
      existing = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { store: true } });
    }
    if (!existing || existing.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    const { tags, packingNote } = req.body as { tags?: unknown; packingNote?: string | null };
    const data: Record<string, unknown> = {};
    if (tags !== undefined) data.tags = tags;
    if (packingNote !== undefined) data.packingNote = packingNote;

    const order = await prisma.order.update({
      where: { id: existing.id },
      data,
    });

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/orders/:id/customer-tags — update manual customer tags in tenant settings
router.put('/:id/customer-tags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    let order = await prisma.order.findFirst({ where: { orderNumber: req.params.id, store: { tenantId: req.tenantId } }, include: { store: true } });
    if (!order && /^\d+$/.test(req.params.id)) {
      order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { store: true } });
    }
    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }
    if (!order.customerEmail) {
      return res.status(400).json({ error: true, message: 'Order has no customer email', code: 'VALIDATION_ERROR' });
    }

    const { tags } = req.body as { tags: { label: string; color: string }[] };
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId }, select: { settings: true } });
    const settings = ((tenant?.settings as Record<string, any>) || {});
    const customerTags = settings.customerTags || {};

    if (tags && tags.length > 0) {
      customerTags[order.customerEmail] = tags;
    } else {
      delete customerTags[order.customerEmail];
    }

    await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { settings: { ...settings, customerTags } },
    });

    res.json({ data: { tags: tags || [] } });
  } catch (err) {
    next(err);
  }
});

export default router;
