import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/analytics?period=30d
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const period = (req.query.period as string) || '30d';

    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, year: 365 };
    const days = daysMap[period] || 30;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 86400000);
    const prevStart = new Date(startDate.getTime() - days * 86400000);

    const storeFilter = { store: { tenantId: req.tenantId } };

    // Current + previous period aggregates (parallel)
    const [currentAgg, prevAgg, currentItemsAgg, prevItemsAgg, statusCounts, topProducts] = await Promise.all([
      prisma.order.aggregate({
        where: { ...storeFilter, wooCreatedAt: { gte: startDate } },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      }),
      prisma.order.aggregate({
        where: { ...storeFilter, wooCreatedAt: { gte: prevStart, lt: startDate } },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      }),
      prisma.orderItem.aggregate({
        where: { order: { ...storeFilter, wooCreatedAt: { gte: startDate } } },
        _sum: { quantity: true },
      }),
      prisma.orderItem.aggregate({
        where: { order: { ...storeFilter, wooCreatedAt: { gte: prevStart, lt: startDate } } },
        _sum: { quantity: true },
      }),
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: { ...storeFilter, wooCreatedAt: { gte: startDate } },
        _count: { id: true },
      }),
      // Top products by quantity sold
      prisma.orderItem.groupBy({
        by: ['sku', 'name'],
        where: { order: { ...storeFilter, wooCreatedAt: { gte: startDate } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    // Daily breakdown + country + payment data
    const orders = await prisma.order.findMany({
      where: { ...storeFilter, wooCreatedAt: { gte: startDate } },
      select: { total: true, currency: true, wooCreatedAt: true, shippingAddress: true, paymentMethodTitle: true, status: true },
      orderBy: { wooCreatedAt: 'asc' },
    });

    const currency = orders[0]?.currency || 'EUR';

    const byDay: Record<string, { total: number; orders: number }> = {};
    const byCountry: Record<string, { count: number; total: number }> = {};
    const byPayment: Record<string, { count: number; total: number }> = {};

    for (const o of orders) {
      const day = o.wooCreatedAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { total: 0, orders: 0 };
      byDay[day].total += o.total?.toNumber() || 0;
      byDay[day].orders += 1;

      const country = (o.shippingAddress as any)?.country || '';
      if (country) {
        if (!byCountry[country]) byCountry[country] = { count: 0, total: 0 };
        byCountry[country].count += 1;
        byCountry[country].total += o.total?.toNumber() || 0;
      }

      const pm = o.paymentMethodTitle || 'Unknown';
      if (!byPayment[pm]) byPayment[pm] = { count: 0, total: 0 };
      byPayment[pm].count += 1;
      byPayment[pm].total += o.total?.toNumber() || 0;
    }

    // Fill missing dates
    const salesOverTime: { date: string; total: number; orders: number }[] = [];
    for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + 86400000)) {
      const ds = d.toISOString().slice(0, 10);
      salesOverTime.push({ date: ds, total: byDay[ds]?.total || 0, orders: byDay[ds]?.orders || 0 });
    }

    const ordersByCountry = Object.entries(byCountry)
      .map(([country, d]) => ({ country, count: d.count, total: d.total }))
      .sort((a, b) => b.count - a.count);

    const ordersByStatus = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    })).sort((a, b) => b.count - a.count);

    const ordersByPayment = Object.entries(byPayment)
      .map(([method, d]) => ({ method, count: d.count, total: d.total }))
      .sort((a, b) => b.count - a.count);

    const topProductsList = topProducts.map((p) => ({
      sku: p.sku || '—',
      name: p.name,
      quantity: p._sum.quantity || 0,
    }));

    res.json({
      data: {
        metrics: {
          totalSales: { value: currentAgg._sum.total?.toNumber() || 0, previous: prevAgg._sum.total?.toNumber() || 0, currency },
          totalOrders: { value: currentAgg._count.id, previous: prevAgg._count.id },
          avgOrderValue: { value: currentAgg._avg.total?.toNumber() || 0, previous: prevAgg._avg.total?.toNumber() || 0, currency },
          itemsSold: { value: currentItemsAgg._sum.quantity || 0, previous: prevItemsAgg._sum.quantity || 0 },
        },
        salesOverTime,
        ordersByCountry,
        ordersByStatus,
        ordersByPayment,
        topProducts: topProductsList,
        currency,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
