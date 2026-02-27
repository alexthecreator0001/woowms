import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/shipping
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { orderId, carrier, trackingNumber, trackingUrl, weight } = req.body;

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
router.get('/', authenticate, async (req, res, next) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: shipments });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/shipping/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { status, trackingNumber, trackingUrl } = req.body;
    const data = {};
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
