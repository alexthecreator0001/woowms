import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

interface ReceiveItem {
  itemId: number;
  receivedQty: number;
  binId?: number;
}

interface CreatePOItem {
  sku: string;
  productName: string;
  orderedQty: number;
  unitCost?: number;
}

// GET /api/v1/receiving
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchaseOrders = await req.prisma!.purchaseOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: purchaseOrders });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poNumber, supplier, expectedDate, notes, items } = req.body as {
      poNumber: string;
      supplier: string;
      expectedDate?: string;
      notes?: string;
      items: CreatePOItem[];
    };

    const po = await req.prisma!.purchaseOrder.create({
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
router.patch('/:id/receive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items: ReceiveItem[] };
    const poId = parseInt(req.params.id);
    const prisma = req.prisma!;

    // Verify PO belongs to tenant
    const existingPo = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!existingPo) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    for (const item of items) {
      await prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: { receivedQty: { increment: item.receivedQty } },
      });

      // Find product by SKU and update stock
      const poItem = await prisma.purchaseOrderItem.findUnique({ where: { id: item.itemId } });
      const product = await prisma.product.findFirst({
        where: { sku: poItem!.sku, store: { tenantId: req.tenantId } },
      });

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

    const allReceived = po!.items.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = po!.items.some((i) => i.receivedQty > 0);

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po!.status,
        receivedDate: allReceived ? new Date() : null,
      },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

export default router;
