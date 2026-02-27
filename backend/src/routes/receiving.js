import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/receiving
router.get('/', authenticate, async (req, res, next) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: purchaseOrders });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { poNumber, supplier, expectedDate, notes, items } = req.body;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplier,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        items: { create: items },
      },
      include: { items: true },
    });

    res.status(201).json({ data: po });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/receiving/:id/receive — Receive items against a PO
router.patch('/:id/receive', authenticate, async (req, res, next) => {
  try {
    const { items } = req.body; // [{ itemId, receivedQty, binId }]
    const poId = parseInt(req.params.id);

    for (const item of items) {
      await prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: { receivedQty: { increment: item.receivedQty } },
      });

      // Find product by SKU and update stock
      const poItem = await prisma.purchaseOrderItem.findUnique({ where: { id: item.itemId } });
      const product = await prisma.product.findFirst({ where: { sku: poItem.sku } });

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: item.receivedQty } },
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'RECEIVED',
            quantity: item.receivedQty,
            toBin: item.binId ? String(item.binId) : null,
            reference: `PO-${poId}`,
          },
        });
      }
    }

    // Check if fully received
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    const allReceived = po.items.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = po.items.some((i) => i.receivedQty > 0);

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status,
        receivedDate: allReceived ? new Date() : null,
      },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

export default router;
