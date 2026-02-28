import { Router, Request, Response, NextFunction } from 'express';
import type { Prisma, ShipmentStatus } from '@prisma/client';

const router = Router();

// POST /api/v1/shipping
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, carrier, trackingNumber, trackingUrl, weight } = req.body as {
      orderId: number;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      weight?: number;
    };
    const prisma = req.prisma!;

    // Verify order belongs to tenant
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });
    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    const shipment = await prisma.shipment.create({
      data: { orderId, carrier, trackingNumber, trackingUrl, weight },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    res.status(201).json({ data: shipment });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipping
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const shipments = await prisma.shipment.findMany({
      where: { order: { store: { tenantId: req.tenantId } } },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: shipments });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/shipping/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, trackingNumber, trackingUrl } = req.body as {
      status?: ShipmentStatus;
      trackingNumber?: string;
      trackingUrl?: string;
    };
    const prisma = req.prisma!;

    const data: Prisma.ShipmentUpdateInput = {};
    if (status) data.status = status;
    if (trackingNumber) data.trackingNumber = trackingNumber;
    if (trackingUrl) data.trackingUrl = trackingUrl;
    if (status === 'SHIPPED') data.shippedAt = new Date();
    if (status === 'DELIVERED') data.deliveredAt = new Date();

    const shipment = await prisma.shipment.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json({ data: shipment });
  } catch (err) {
    next(err);
  }
});

export default router;
