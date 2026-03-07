import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import { pushStockToWoo, shouldPushStock } from '../woocommerce/sync.js';
import prisma from '../lib/prisma.js';
import { buildCsv, sendCsv, resolveDelimiter, formatDate, filterColumns, type ColumnDef } from '../lib/csv.js';
import { createNotification } from '../services/notifications.js';
import { logActivity } from '../services/auditLog.js';

const router = Router();

// ── Helpers ────────────────────────────────────────

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

async function resolveRMAId(param: string, tenantId: number): Promise<number | null> {
  const isNumeric = /^\d+$/.test(param);
  if (isNumeric) return parseInt(param);
  const rma = await prisma.returnOrder.findFirst({
    where: { rmaNumber: param, tenantId },
    select: { id: true },
  });
  return rma?.id ?? null;
}

async function generateRMANumber(tenantId: number): Promise<string> {
  const count = await prisma.returnOrder.count({ where: { tenantId } });
  return `RMA-${String(count + 1).padStart(4, '0')}`;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['AUTHORIZED', 'REJECTED', 'CANCELLED'],
  AUTHORIZED: ['RECEIVING', 'CANCELLED'],
  RECEIVING: ['COMPLETED', 'CANCELLED'],
};

// ── GET / — List returns ───────────────────────────

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columns: colParam, delimiter: delimParam, dateFormat } = req.query as Record<string, string | undefined>;
    const delim = resolveDelimiter(delimParam);
    const dateFmt = dateFormat || 'YYYY-MM-DD';

    const returns = await req.prisma!.returnOrder.findMany({
      where: { tenantId: req.tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const registry: ColumnDef<(typeof returns)[0]>[] = [
      { key: 'rmaNumber', header: 'RMA #', accessor: (r) => r.rmaNumber },
      { key: 'status', header: 'Status', accessor: (r) => r.status },
      { key: 'orderNumber', header: 'Order #', accessor: (r) => r.orderNumber },
      { key: 'customerName', header: 'Customer', accessor: (r) => r.customerName },
      { key: 'itemsCount', header: 'Items Count', accessor: (r) => r.items?.length || 0 },
      { key: 'totalQty', header: 'Total Qty', accessor: (r) => (r.items || []).reduce((s, i) => s + i.quantity, 0) },
      { key: 'receivedQty', header: 'Received Qty', accessor: (r) => (r.items || []).reduce((s, i) => s + i.receivedQty, 0) },
      { key: 'refundAmount', header: 'Refund Amount', accessor: (r) => r.refundAmount?.toString() || '' },
      { key: 'reason', header: 'Reason', accessor: (r) => r.reason || '' },
      { key: 'createdAt', header: 'Created At', accessor: (r) => formatDate(r.createdAt, dateFmt) },
    ];

    const cols = filterColumns(registry, colParam);
    const headers = cols.map((c) => c.header);
    const rows = returns.map((r) => cols.map((c) => c.accessor(r)));

    sendCsv(res, 'returns-export.csv', buildCsv(headers, rows, delim));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '25', status, search } = req.query as Record<string, string | undefined>;
    const prismaClient = req.prisma!;
    const take = Math.min(parseInt(limit) || 25, 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where: any = { tenantId: req.tenantId };
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { rmaNumber: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prismaClient.returnOrder.findMany({
        where,
        include: { items: true, _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prismaClient.returnOrder.count({ where }),
    ]);

    res.json({ data, meta: { page: parseInt(page) || 1, limit: take, total, pages: Math.ceil(total / take) } });
  } catch (err) {
    next(err);
  }
});

// ── POST / — Create return ─────────────────────────

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber, orderId, customerName, customerEmail, reason, notes, refundAmount, items } = req.body as {
      orderNumber: string;
      orderId?: number;
      customerName: string;
      customerEmail?: string;
      reason?: string;
      notes?: string;
      refundAmount?: number;
      items: { productId?: number; productName: string; sku?: string; quantity: number; condition?: string }[];
    };

    if (!orderNumber || !customerName) {
      return res.status(400).json({ error: true, message: 'Order number and customer name are required', code: 'VALIDATION_ERROR' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: true, message: 'At least one item is required', code: 'VALIDATION_ERROR' });
    }
    if (items.some((i) => !i.quantity || i.quantity <= 0)) {
      return res.status(400).json({ error: true, message: 'All items must have a quantity greater than 0', code: 'VALIDATION_ERROR' });
    }

    const rmaNumber = await generateRMANumber(req.tenantId!);

    const rma = await req.prisma!.returnOrder.create({
      data: {
        tenantId: req.tenantId!,
        rmaNumber,
        orderId: orderId || null,
        orderNumber,
        customerName,
        customerEmail: customerEmail || null,
        reason: reason || null,
        notes: notes || null,
        refundAmount: refundAmount || null,
        createdById: req.user?.id || null,
        createdByName: req.user?.name || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            sku: item.sku || null,
            quantity: item.quantity,
            condition: (item.condition as any) || 'NEW',
          })),
        },
      },
      include: { items: true },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'rma.created',
      resource: 'return_order',
      resourceId: String(rma.id),
      details: { rmaNumber, orderNumber, itemCount: items.length },
    });

    createNotification({
      tenantId: req.tenantId!,
      type: 'rma_created',
      title: 'New return request',
      message: `${rmaNumber} for order ${orderNumber} — ${items.length} item(s)`,
      link: `/returns/${rma.id}`,
    });

    res.status(201).json({ data: rma });
  } catch (err: any) {
    // Handle duplicate rmaNumber (race condition)
    if (err?.code === 'P2002') {
      const rmaNumber = await generateRMANumber(req.tenantId!);
      req.body.rmaNumber = rmaNumber;
      return router.handle(req, res, next);
    }
    next(err);
  }
});

// ── GET /:id — Return detail ───────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const rma = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
      include: { items: true },
    });
    if (!rma) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    // Enrich items with product images
    const enrichedItems = await Promise.all(
      rma.items.map(async (item) => {
        let imageUrl: string | null = null;
        if (item.productId) {
          const product = await req.prisma!.product.findUnique({
            where: { id: item.productId },
            select: { imageUrl: true },
          });
          imageUrl = product?.imageUrl || null;
        }
        return { ...item, imageUrl };
      })
    );

    res.json({ data: { ...rma, items: enrichedItems } });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /:id — Update return ─────────────────────

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
    });
    if (!existing) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: true, message: 'Cannot edit a completed, rejected, or cancelled return', code: 'INVALID_STATUS' });
    }

    const { notes, reason, refundAmount } = req.body as { notes?: string; reason?: string; refundAmount?: number };
    const data: any = {};
    if (notes !== undefined) data.notes = notes;
    if (reason !== undefined) data.reason = reason;
    if (refundAmount !== undefined) data.refundAmount = refundAmount;

    const rma = await req.prisma!.returnOrder.update({
      where: { id: rmaId },
      data,
      include: { items: true },
    });

    res.json({ data: rma });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /:id/status — Status transition ──────────

router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const { status } = req.body as { status: string };
    if (!status) return res.status(400).json({ error: true, message: 'Status is required', code: 'VALIDATION_ERROR' });

    const existing = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
    });
    if (!existing) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const allowed = STATUS_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ error: true, message: `Cannot transition from ${existing.status} to ${status}`, code: 'INVALID_TRANSITION' });
    }

    const data: any = { status };
    if (status === 'AUTHORIZED') data.authorizedAt = new Date();
    if (status === 'RECEIVING') data.receivedAt = new Date();

    const rma = await req.prisma!.returnOrder.update({
      where: { id: rmaId },
      data,
      include: { items: true },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'rma.status_changed',
      resource: 'return_order',
      resourceId: String(rmaId),
      details: { from: existing.status, to: status },
    });

    res.json({ data: rma });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /:id/receive — Receive items ─────────────

router.patch('/:id/receive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
    });
    if (!existing) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    if (existing.status !== 'RECEIVING') {
      return res.status(400).json({ error: true, message: 'Return must be in RECEIVING status to receive items', code: 'INVALID_STATUS' });
    }

    const { items } = req.body as {
      items: { itemId: number; receivedQty: number; condition?: string; resolution?: string; notes?: string }[];
    };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: true, message: 'Items are required', code: 'VALIDATION_ERROR' });
    }

    for (const item of items) {
      const data: any = {};
      if (item.receivedQty !== undefined) data.receivedQty = item.receivedQty;
      if (item.condition) data.condition = item.condition;
      if (item.resolution) data.resolution = item.resolution;
      if (item.notes !== undefined) data.notes = item.notes;

      await req.prisma!.returnOrderItem.update({
        where: { id: item.itemId },
        data,
      });
    }

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'rma.items_received',
      resource: 'return_order',
      resourceId: String(rmaId),
      details: { itemCount: items.length },
    });

    const rma = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId },
      include: { items: true },
    });

    res.json({ data: rma });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /:id/complete — Complete return + stock adjustments ──

router.patch('/:id/complete', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
      include: { items: true },
    });
    if (!existing) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    if (existing.status !== 'RECEIVING') {
      return res.status(400).json({ error: true, message: 'Return must be in RECEIVING status to complete', code: 'INVALID_STATUS' });
    }

    // Check all items have a resolution
    const pendingItems = existing.items.filter((i) => i.resolution === 'PENDING');
    if (pendingItems.length > 0) {
      return res.status(400).json({ error: true, message: `${pendingItems.length} item(s) still have PENDING resolution`, code: 'PENDING_ITEMS' });
    }

    // Apply stock adjustments
    for (const item of existing.items) {
      if (!item.productId) continue;

      const product = await req.prisma!.product.findUnique({
        where: { id: item.productId },
        include: { store: true },
      });
      if (!product) continue;

      if (item.resolution === 'RESTOCK') {
        // Add stock back
        await req.prisma!.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: item.receivedQty } },
        });

        await req.prisma!.stockMovement.create({
          data: {
            productId: product.id,
            type: 'RETURNED',
            quantity: item.receivedQty,
            reason: `Return ${existing.rmaNumber} — restocked`,
            reference: existing.rmaNumber,
          },
        });

        // Push to WooCommerce
        try {
          const tenantSettings = await getTenantSettings(req.tenantId!);
          const productSyncSettings = product.syncSettings as Record<string, unknown> | null;
          if (shouldPushStock(tenantSettings, productSyncSettings)) {
            await pushStockToWoo(product.store as any, product.id);
          }
        } catch (pushErr) {
          console.error('[SYNC] Failed to push stock after return restock:', pushErr);
        }
      } else if (item.resolution === 'DAMAGED') {
        await req.prisma!.stockMovement.create({
          data: {
            productId: product.id,
            type: 'DAMAGED',
            quantity: item.receivedQty,
            reason: `Return ${existing.rmaNumber} — damaged`,
            reference: existing.rmaNumber,
          },
        });
      }
      // DISPOSE: no stock movement
    }

    // Mark as completed
    const rma = await req.prisma!.returnOrder.update({
      where: { id: rmaId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { items: true },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'rma.completed',
      resource: 'return_order',
      resourceId: String(rmaId),
      details: {
        rmaNumber: rma.rmaNumber,
        restocked: existing.items.filter((i) => i.resolution === 'RESTOCK').length,
        damaged: existing.items.filter((i) => i.resolution === 'DAMAGED').length,
        disposed: existing.items.filter((i) => i.resolution === 'DISPOSE').length,
      },
    });

    createNotification({
      tenantId: req.tenantId!,
      type: 'rma_completed',
      title: 'Return completed',
      message: `${rma.rmaNumber} for order ${rma.orderNumber} — ${existing.items.filter((i) => i.resolution === 'RESTOCK').length} item(s) restocked`,
      link: `/returns/${rma.id}`,
    });

    res.json({ data: rma });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /:id — Delete return ────────────────────

router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rmaId = await resolveRMAId(req.params.id, req.tenantId!);
    if (!rmaId) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.returnOrder.findFirst({
      where: { id: rmaId, tenantId: req.tenantId },
    });
    if (!existing) return res.status(404).json({ error: true, message: 'Return not found', code: 'NOT_FOUND' });

    if (existing.status !== 'REQUESTED') {
      return res.status(400).json({ error: true, message: 'Only returns in REQUESTED status can be deleted', code: 'INVALID_STATUS' });
    }

    await req.prisma!.returnOrder.delete({ where: { id: rmaId } });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'rma.deleted',
      resource: 'return_order',
      resourceId: String(rmaId),
    });

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
