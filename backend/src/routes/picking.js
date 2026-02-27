import { Router } from 'express';

const router = Router();

// POST /api/v1/picking/generate — Generate pick list for an order
router.post('/generate', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const prisma = req.prisma;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, items: { include: { product: { include: { stockLocations: { include: { bin: true } } } } } } },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    const pickListItems = [];
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
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const prisma = req.prisma;

    const where = { order: { store: { tenantId: req.tenantId } } };
    if (status) where.status = status;

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
router.patch('/:id/pick-item', async (req, res, next) => {
  try {
    const { itemId, pickedQty } = req.body;
    const prisma = req.prisma;

    const item = await prisma.pickListItem.update({
      where: { id: itemId },
      data: { pickedQty, isPicked: true },
    });

    // Check if all items picked
    const pickList = await prisma.pickList.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    const allPicked = pickList.items.every((i) => i.isPicked);
    if (allPicked) {
      await prisma.pickList.update({
        where: { id: pickList.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await prisma.order.update({
        where: { id: pickList.orderId },
        data: { status: 'PICKED' },
      });
    }

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
