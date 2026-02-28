import { Router, Request, Response, NextFunction } from 'express';
import type { PickStatus } from '@prisma/client';

const router = Router();

// POST /api/v1/picking/generate — Generate pick list for an order
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body as { orderId: number };
    const prisma = req.prisma!;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, items: { include: { product: { include: { stockLocations: { include: { bin: true } } } } } } },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    const pickListItems: { sku: string; productName: string; binLabel: string; quantity: number }[] = [];
    for (const item of order.items) {
      const location = item.product?.stockLocations?.[0];
      pickListItems.push({
        sku: item.sku || item.product?.sku || 'N/A',
        productName: item.name,
        binLabel: location?.bin?.label || 'UNASSIGNED',
        quantity: item.quantity,
      });
    }

    const pickList = await prisma.pickList.create({
      data: {
        orderId,
        items: { create: pickListItems },
      },
      include: { items: true },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'AWAITING_PICK' },
    });

    res.status(201).json({ data: pickList });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/picking
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const prisma = req.prisma!;

    const where: any = { order: { store: { tenantId: req.tenantId } } };
    if (status) where.status = status as PickStatus;

    const pickLists = await prisma.pickList.findMany({
      where,
      include: { items: true, order: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: pickLists });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/picking/:id/pick-item
router.patch('/:id/pick-item', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId, pickedQty } = req.body as { itemId: number; pickedQty: number };
    const prisma = req.prisma!;

    const item = await prisma.pickListItem.update({
      where: { id: itemId },
      data: { pickedQty, isPicked: true },
    });

    // Check if all items picked
    const pickList = await prisma.pickList.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    const allPicked = pickList!.items.every((i) => i.isPicked);
    if (allPicked) {
      await prisma.pickList.update({
        where: { id: pickList!.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await prisma.order.update({
        where: { id: pickList!.orderId },
        data: { status: 'PICKED' },
      });
    }

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
