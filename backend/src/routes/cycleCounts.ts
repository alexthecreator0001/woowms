import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { pushStockToWoo, shouldPushStock } from '../woocommerce/sync.js';
import { createNotification } from '../services/notifications.js';
import { logActivity } from '../services/auditLog.js';
import { notifyLowStock } from '../services/slack.js';

const router = Router();

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

async function generateCcNumber(tenantId: number): Promise<string> {
  const last = await prisma.cycleCount.findFirst({
    where: { tenantId },
    orderBy: { id: 'desc' },
    select: { ccNumber: true },
  });

  let nextNum = 1;
  if (last?.ccNumber) {
    const match = last.ccNumber.match(/CC-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return `CC-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/v1/cycle-counts — list
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const tenantId = req.tenantId!;
    const { status, warehouse, search, page = '1', limit = '25' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (warehouse) where.warehouseId = parseInt(warehouse);
    if (search) {
      where.OR = [
        { ccNumber: { contains: search, mode: 'insensitive' } },
        { assignedToName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [counts, total] = await Promise.all([
      db.cycleCount.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      db.cycleCount.count({ where }),
    ]);

    res.json({
      data: counts,
      meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cycle-counts — create
router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const tenantId = req.tenantId!;
    const { type, warehouseId, zoneId, binIds, productIds, blindCount, plannedDate, assignedToId, assignedToName, notes } = req.body;

    if (!type || !warehouseId) {
      return res.status(400).json({ error: true, message: 'type and warehouseId are required', code: 'VALIDATION' });
    }

    // Generate items based on type
    let stockLocations: Array<{ productId: number; binId: number; quantity: number; product: { name: string; sku: string | null }; bin: { label: string } }> = [];

    if (type === 'ZONE') {
      if (!zoneId) return res.status(400).json({ error: true, message: 'zoneId is required for ZONE type', code: 'VALIDATION' });
      stockLocations = await prisma.stockLocation.findMany({
        where: { bin: { rack: { zone: { id: zoneId, warehouse: { id: warehouseId, tenantId } } } } },
        include: { product: { select: { name: true, sku: true } }, bin: { select: { label: true } } },
      });
    } else if (type === 'LOCATION') {
      if (!binIds?.length) return res.status(400).json({ error: true, message: 'binIds are required for LOCATION type', code: 'VALIDATION' });
      stockLocations = await prisma.stockLocation.findMany({
        where: { binId: { in: binIds }, bin: { rack: { zone: { warehouse: { id: warehouseId, tenantId } } } } },
        include: { product: { select: { name: true, sku: true } }, bin: { select: { label: true } } },
      });
    } else if (type === 'PRODUCT') {
      if (!productIds?.length) return res.status(400).json({ error: true, message: 'productIds are required for PRODUCT type', code: 'VALIDATION' });
      stockLocations = await prisma.stockLocation.findMany({
        where: { productId: { in: productIds }, bin: { rack: { zone: { warehouse: { id: warehouseId, tenantId } } } } },
        include: { product: { select: { name: true, sku: true } }, bin: { select: { label: true } } },
      });
    }

    if (stockLocations.length === 0) {
      return res.status(400).json({ error: true, message: 'No stock locations found for the given criteria', code: 'NO_ITEMS' });
    }

    const ccNumber = await generateCcNumber(tenantId);

    const cycleCount = await db.cycleCount.create({
      data: {
        tenantId,
        ccNumber,
        type,
        warehouseId: parseInt(warehouseId),
        zoneId: zoneId ? parseInt(zoneId) : null,
        blindCount: blindCount || false,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        assignedToName: assignedToName || null,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        notes: notes || null,
        createdById: req.user!.id,
        createdByName: req.user!.name,
        items: {
          create: stockLocations.map((sl) => ({
            productId: sl.productId,
            binId: sl.binId,
            productName: sl.product.name,
            sku: sl.product.sku,
            binLabel: sl.bin.label,
            expectedQty: sl.quantity,
          })),
        },
      },
      include: { items: true, _count: { select: { items: true } } },
    });

    logActivity({
      tenantId,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'cycle_count.created',
      resource: 'cycle_count',
      resourceId: ccNumber,
      details: { type, itemCount: stockLocations.length },
    });

    res.status(201).json({ data: cycleCount });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/cycle-counts/:id — detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);

    const cycleCount = await db.cycleCount.findFirst({
      where: { id, tenantId: req.tenantId },
      include: {
        items: { orderBy: { binLabel: 'asc' } },
        _count: { select: { items: true } },
      },
    });

    if (!cycleCount) {
      return res.status(404).json({ error: true, message: 'Cycle count not found', code: 'NOT_FOUND' });
    }

    res.json({ data: cycleCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/start — PLANNED → IN_PROGRESS
router.patch('/:id/start', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });

    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'PLANNED') return res.status(400).json({ error: true, message: 'Can only start PLANNED counts', code: 'INVALID_STATUS' });

    const updated = await db.cycleCount.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: { items: { orderBy: { binLabel: 'asc' } }, _count: { select: { items: true } } },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'cycle_count.started',
      resource: 'cycle_count',
      resourceId: cc.ccNumber,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/items/:itemId/count — record count
router.patch('/:id/items/:itemId/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const { countedQty, notes } = req.body;

    if (countedQty === undefined || countedQty === null || countedQty < 0) {
      return res.status(400).json({ error: true, message: 'countedQty is required and must be >= 0', code: 'VALIDATION' });
    }

    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'IN_PROGRESS') return res.status(400).json({ error: true, message: 'Count must be IN_PROGRESS', code: 'INVALID_STATUS' });

    const item = await prisma.cycleCountItem.findFirst({ where: { id: itemId, cycleCountId: id } });
    if (!item) return res.status(404).json({ error: true, message: 'Item not found', code: 'NOT_FOUND' });

    const qty = parseInt(countedQty);
    const updated = await prisma.cycleCountItem.update({
      where: { id: itemId },
      data: {
        countedQty: qty,
        variance: qty - item.expectedQty,
        countedAt: new Date(),
        countedById: req.user!.id,
        countedByName: req.user!.name,
        notes: notes !== undefined ? notes : item.notes,
      },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/submit — IN_PROGRESS → REVIEW
router.patch('/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);

    const cc = await db.cycleCount.findFirst({
      where: { id, tenantId: req.tenantId },
      include: { items: true },
    });

    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'IN_PROGRESS') return res.status(400).json({ error: true, message: 'Count must be IN_PROGRESS', code: 'INVALID_STATUS' });

    const uncounted = cc.items.filter((i) => i.countedQty === null);
    if (uncounted.length > 0) {
      return res.status(400).json({ error: true, message: `${uncounted.length} items have not been counted yet`, code: 'INCOMPLETE' });
    }

    const updated = await db.cycleCount.update({
      where: { id },
      data: { status: 'REVIEW' },
      include: { items: { orderBy: { binLabel: 'asc' } }, _count: { select: { items: true } } },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'cycle_count.submitted',
      resource: 'cycle_count',
      resourceId: cc.ccNumber,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/items/:itemId/resolve — set resolution
router.patch('/:id/items/:itemId/resolve', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const { resolution } = req.body;

    if (!['ACCEPTED', 'DISMISSED'].includes(resolution)) {
      return res.status(400).json({ error: true, message: 'resolution must be ACCEPTED or DISMISSED', code: 'VALIDATION' });
    }

    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'REVIEW') return res.status(400).json({ error: true, message: 'Count must be in REVIEW', code: 'INVALID_STATUS' });

    const item = await prisma.cycleCountItem.findFirst({ where: { id: itemId, cycleCountId: id } });
    if (!item) return res.status(404).json({ error: true, message: 'Item not found', code: 'NOT_FOUND' });

    const updated = await prisma.cycleCountItem.update({
      where: { id: itemId },
      data: { resolution },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/resolve-all — batch resolve
router.patch('/:id/resolve-all', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const { resolution } = req.body;

    if (!['ACCEPTED', 'DISMISSED'].includes(resolution)) {
      return res.status(400).json({ error: true, message: 'resolution must be ACCEPTED or DISMISSED', code: 'VALIDATION' });
    }

    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'REVIEW') return res.status(400).json({ error: true, message: 'Count must be in REVIEW', code: 'INVALID_STATUS' });

    await prisma.cycleCountItem.updateMany({
      where: { cycleCountId: id, variance: { not: 0 } },
      data: { resolution },
    });

    // Also set items with 0 variance to ACCEPTED
    await prisma.cycleCountItem.updateMany({
      where: { cycleCountId: id, variance: 0, resolution: 'PENDING' },
      data: { resolution: 'ACCEPTED' },
    });

    const updated = await db.cycleCount.findFirst({
      where: { id },
      include: { items: { orderBy: { binLabel: 'asc' } }, _count: { select: { items: true } } },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cycle-counts/:id/reconcile — REVIEW → COMPLETED, apply stock
router.post('/:id/reconcile', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const tenantId = req.tenantId!;
    const id = parseInt(req.params.id);

    const cc = await db.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status !== 'REVIEW') return res.status(400).json({ error: true, message: 'Count must be in REVIEW', code: 'INVALID_STATUS' });

    // Check all variance items are resolved
    const pendingVariance = cc.items.filter((i) => i.variance !== 0 && i.resolution === 'PENDING');
    if (pendingVariance.length > 0) {
      return res.status(400).json({ error: true, message: `${pendingVariance.length} variance items are still pending resolution`, code: 'UNRESOLVED' });
    }

    const tenantSettings = await getTenantSettings(tenantId);
    const adjustedProducts = new Set<number>();

    // Apply stock adjustments for accepted items with variance
    for (const item of cc.items) {
      if (item.resolution !== 'ACCEPTED' || item.countedQty === null) continue;

      // Read CURRENT stock (not snapshot) to handle changes since count
      const currentSL = await prisma.stockLocation.findUnique({
        where: { productId_binId: { productId: item.productId, binId: item.binId } },
      });

      const currentQty = currentSL?.quantity ?? 0;
      const actualDelta = item.countedQty - currentQty;

      if (actualDelta === 0) continue;

      // Update StockLocation
      if (currentSL) {
        await prisma.stockLocation.update({
          where: { id: currentSL.id },
          data: { quantity: item.countedQty },
        });
      } else {
        await prisma.stockLocation.create({
          data: { productId: item.productId, binId: item.binId, quantity: item.countedQty },
        });
      }

      // Update Product.stockQty
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: actualDelta } },
      });

      // Create StockMovement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'ADJUSTED',
          quantity: actualDelta,
          toBin: item.binLabel,
          reason: `Cycle count ${cc.ccNumber}`,
          reference: cc.ccNumber,
        },
      });

      adjustedProducts.add(item.productId);

      // Check low stock
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stockQty: true, lowStockThreshold: true, name: true, sku: true, store: { select: { tenantId: true } } },
      });

      if (product && product.stockQty <= product.lowStockThreshold) {
        createNotification({
          tenantId,
          type: 'low_stock',
          title: 'Low stock alert',
          message: `${product.name} (${product.sku || 'no SKU'}) is at ${product.stockQty} units after cycle count ${cc.ccNumber}`,
          link: `/inventory/${product.sku || item.productId}`,
        });
        notifyLowStock(tenantId, product.name, product.sku || '', product.stockQty, product.lowStockThreshold);
      }
    }

    // Push adjusted products to WooCommerce
    for (const productId of adjustedProducts) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { store: true },
        });
        if (product) {
          const productSyncSettings = product.syncSettings as Record<string, unknown> | null;
          if (shouldPushStock(tenantSettings, productSyncSettings)) {
            await pushStockToWoo(product.store as any, productId);
          }
        }
      } catch (pushErr) {
        console.error(`[CycleCount] Failed to push stock for product ${productId}:`, pushErr);
      }
    }

    // Mark as completed
    const updated = await db.cycleCount.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { items: { orderBy: { binLabel: 'asc' } }, _count: { select: { items: true } } },
    });

    logActivity({
      tenantId,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'cycle_count.reconciled',
      resource: 'cycle_count',
      resourceId: cc.ccNumber,
      details: { adjustedProducts: adjustedProducts.size },
    });

    createNotification({
      tenantId,
      type: 'system',
      title: 'Cycle count completed',
      message: `${cc.ccNumber} has been reconciled. ${adjustedProducts.size} product(s) adjusted.`,
      link: `/cycle-counts/${id}`,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cycle-counts/:id/cancel
router.patch('/:id/cancel', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });

    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (cc.status === 'COMPLETED' || cc.status === 'CANCELLED') {
      return res.status(400).json({ error: true, message: 'Cannot cancel a completed or already cancelled count', code: 'INVALID_STATUS' });
    }

    const updated = await db.cycleCount.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { orderBy: { binLabel: 'asc' } }, _count: { select: { items: true } } },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'cycle_count.cancelled',
      resource: 'cycle_count',
      resourceId: cc.ccNumber,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cycle-counts/:id — only PLANNED or CANCELLED
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.prisma!;
    const id = parseInt(req.params.id);
    const cc = await db.cycleCount.findFirst({ where: { id, tenantId: req.tenantId } });

    if (!cc) return res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
    if (!['PLANNED', 'CANCELLED'].includes(cc.status)) {
      return res.status(400).json({ error: true, message: 'Can only delete PLANNED or CANCELLED counts', code: 'INVALID_STATUS' });
    }

    await prisma.cycleCount.delete({ where: { id } });

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
