import { Router, Request, Response, NextFunction } from 'express';
import { pushStockToWoo, shouldPushStock } from '../woocommerce/sync.js';
import prisma from '../lib/prisma.js';

const router = Router();

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

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

// GET /api/v1/receiving — list POs with pagination, status filter, search
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = { tenantId: req.tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      req.prisma!.purchaseOrder.findMany({
        where,
        include: { items: true, supplierRef: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      req.prisma!.purchaseOrder.count({ where }),
    ]);

    res.json({
      data: purchaseOrders,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/receiving/product-info — Get product package qty and supplier info for PO creation
router.get('/product-info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sku = req.query.sku as string;
    if (!sku) {
      return res.status(400).json({ error: true, message: 'SKU is required', code: 'VALIDATION_ERROR' });
    }

    const product = await req.prisma!.product.findFirst({
      where: { sku, store: { tenantId: req.tenantId } },
      select: {
        id: true,
        name: true,
        sku: true,
        packageQty: true,
        supplierProducts: {
          include: { supplier: true },
        },
      },
    });

    if (!product) {
      return res.json({ data: null });
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/receiving/:id — single PO with items
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = parseInt(req.params.id);
    const po = await req.prisma!.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
      include: { items: true, supplierRef: true },
    });

    if (!po) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving — create PO
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poNumber, supplier, expectedDate, notes, items, supplierId, trackingNumber, trackingUrl } = req.body as {
      poNumber: string;
      supplier: string;
      expectedDate?: string;
      notes?: string;
      items: CreatePOItem[];
      supplierId?: number;
      trackingNumber?: string;
      trackingUrl?: string;
    };

    if (!poNumber || !supplier) {
      return res.status(400).json({ error: true, message: 'PO number and supplier are required', code: 'VALIDATION_ERROR' });
    }

    const po = await req.prisma!.purchaseOrder.create({
      data: {
        tenantId: req.tenantId!,
        poNumber,
        supplier,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        supplierId: supplierId || undefined,
        trackingNumber: trackingNumber?.trim() || undefined,
        trackingUrl: trackingUrl?.trim() || undefined,
        items: { create: items || [] },
      },
      include: { items: true, supplierRef: true },
    });

    res.status(201).json({ data: po });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: true, message: 'PO number already exists', code: 'DUPLICATE' });
    }
    next(err);
  }
});

// PATCH /api/v1/receiving/:id — update PO (only DRAFT)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    const { supplier, expectedDate, notes, items, trackingNumber, trackingUrl, supplierId } = req.body as {
      supplier?: string;
      expectedDate?: string | null;
      notes?: string | null;
      items?: CreatePOItem[];
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      supplierId?: number | null;
    };

    // Split: tracking fields can be edited for DRAFT and ORDERED, other fields only in DRAFT
    const isDraft = existing.status === 'DRAFT';
    const canEditTracking = ['DRAFT', 'ORDERED'].includes(existing.status);

    if (!isDraft && (supplier !== undefined || items !== undefined || expectedDate !== undefined || notes !== undefined || supplierId !== undefined)) {
      return res.status(400).json({ error: true, message: 'Only DRAFT purchase orders can be fully edited', code: 'INVALID_STATUS' });
    }
    if (!canEditTracking && (trackingNumber !== undefined || trackingUrl !== undefined)) {
      return res.status(400).json({ error: true, message: 'Tracking can only be edited for DRAFT or ORDERED POs', code: 'INVALID_STATUS' });
    }

    // If items provided, replace all items
    if (items) {
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        ...(supplier !== undefined && { supplier }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber?.trim() || null }),
        ...(trackingUrl !== undefined && { trackingUrl: trackingUrl?.trim() || null }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(items && { items: { create: items } }),
      },
      include: { items: true },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/receiving/:id/status — transition PO status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = parseInt(req.params.id);
    const { status } = req.body as { status: string };
    const prisma = req.prisma!;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    // Validate transitions
    const allowed: Record<string, string[]> = {
      DRAFT: ['ORDERED', 'CANCELLED'],
      ORDERED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
      PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
    };

    if (!allowed[existing.status]?.includes(status)) {
      return res.status(400).json({
        error: true,
        message: `Cannot transition from ${existing.status} to ${status}`,
        code: 'INVALID_TRANSITION',
      });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: status as 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED',
        ...(status === 'RECEIVED' && { receivedDate: new Date() }),
      },
      include: { items: true },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/receiving/:id/receive — receive items against a PO
router.patch('/:id/receive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items: ReceiveItem[] };
    const poId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const existingPo = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });
    if (!existingPo) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    for (const item of items) {
      await prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: { receivedQty: { increment: item.receivedQty } },
      });

      const poItem = await prisma.purchaseOrderItem.findUnique({ where: { id: item.itemId } });
      const product = await prisma.product.findFirst({
        where: { sku: poItem!.sku, store: { tenantId: req.tenantId } },
      });

      if (product) {
        await req.prisma!.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: item.receivedQty } },
        });

        // Resolve bin label for stock movement
        let binLabel: string | null = null;
        if (item.binId) {
          const bin = await req.prisma!.bin.findUnique({ where: { id: item.binId } });
          binLabel = bin?.label || null;

          // Create/update StockLocation record — this is the key link between inventory and bins
          if (bin) {
            await req.prisma!.stockLocation.upsert({
              where: { productId_binId: { productId: product.id, binId: item.binId } },
              update: { quantity: { increment: item.receivedQty } },
              create: { productId: product.id, binId: item.binId, quantity: item.receivedQty },
            });
          }
        }

        await req.prisma!.stockMovement.create({
          data: {
            productId: product.id,
            type: 'RECEIVED',
            quantity: item.receivedQty,
            toBin: binLabel,
            reference: `PO-${poId}`,
          },
        });

        // Push stock to WooCommerce if enabled
        try {
          const tenantSettings = await getTenantSettings(req.tenantId!);
          const productWithStore = await req.prisma!.product.findUnique({
            where: { id: product.id },
            include: { store: true },
          });
          if (productWithStore) {
            const productSyncSettings = productWithStore.syncSettings as Record<string, unknown> | null;
            if (shouldPushStock(tenantSettings, productSyncSettings)) {
              await pushStockToWoo(productWithStore.store as any, product.id);
            }
          }
        } catch (pushErr) {
          console.error('[SYNC] Failed to push stock after receive:', pushErr);
        }
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

// DELETE /api/v1/receiving/:id — delete PO (only DRAFT)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = parseInt(req.params.id);
    const prisma = req.prisma!;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: true, message: 'Only DRAFT purchase orders can be deleted', code: 'INVALID_STATUS' });
    }

    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } });
    await prisma.purchaseOrder.delete({ where: { id: poId } });

    res.json({ data: { message: 'Purchase order deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
