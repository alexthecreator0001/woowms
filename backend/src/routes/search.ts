import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/search?q=<query>
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) {
      return res.json({ data: { orders: [], products: [], purchaseOrders: [], suppliers: [] } });
    }

    const tenantId = req.tenantId;
    const prisma = req.prisma!;

    const [orders, products, purchaseOrders, suppliers] = await Promise.all([
      prisma.order.findMany({
        where: {
          store: { tenantId },
          OR: [
            { orderNumber: { contains: q } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerEmail: { contains: q, mode: 'insensitive' } },
            { shipments: { some: { trackingNumber: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        include: { shipments: true },
        take: 25,
        orderBy: { wooCreatedAt: 'desc' },
      }),
      prisma.product.findMany({
        where: {
          store: { tenantId },
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { barcodes: { some: { barcode: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        take: 25,
        orderBy: { name: 'asc' },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          OR: [
            { poNumber: { contains: q, mode: 'insensitive' } },
            { supplier: { contains: q, mode: 'insensitive' } },
            { trackingNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { supplierRef: true },
        take: 25,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 25,
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({ data: { orders, products, purchaseOrders, suppliers } });
  } catch (err) {
    next(err);
  }
});

export default router;
