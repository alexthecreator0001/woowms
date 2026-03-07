import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pushStockToWoo, shouldPushStock } from '../woocommerce/sync.js';
import { sendPurchaseOrderEmail } from '../services/email.js';
import prisma from '../lib/prisma.js';
import { buildCsv, sendCsv, resolveDelimiter, formatDate, filterColumns, type ColumnDef } from '../lib/csv.js';
import { generatePoPdf, type PoTemplate } from '../lib/poPdf.js';
import { notifyPOReceived } from '../services/slack.js';
import { createNotification } from '../services/notifications.js';
import { logActivity } from '../services/auditLog.js';
import sharp from 'sharp';

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// ── Multer setup for invoice uploads ────────────────────
const uploadsDir = resolve(__dirname, '../../uploads/invoices');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, and WEBP files are allowed'));
    }
  },
});

async function getTenantSettings(tenantId: number): Promise<Record<string, unknown>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) || {};
}

/**
 * Resolve :id param to a numeric PO ID.
 * Accepts: numeric ID (e.g. "5") or poNumber string (e.g. "PO-2024-001").
 */
async function resolvePOId(param: string, tenantId: number): Promise<number | null> {
  const isNumeric = /^\d+$/.test(param);
  if (isNumeric) return parseInt(param);
  const po = await prisma.purchaseOrder.findFirst({
    where: { poNumber: param, tenantId },
    select: { id: true },
  });
  return po?.id ?? null;
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

// GET /api/v1/receiving/export — CSV export
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columns: colParam, delimiter: delimParam, dateFormat } = req.query as Record<string, string | undefined>;
    const delim = resolveDelimiter(delimParam);
    const dateFmt = dateFormat || 'YYYY-MM-DD';

    const purchaseOrders = await req.prisma!.purchaseOrder.findMany({
      where: { tenantId: req.tenantId },
      include: { items: true, supplierRef: true },
      orderBy: { createdAt: 'desc' },
    });

    const registry: ColumnDef<(typeof purchaseOrders)[0]>[] = [
      { key: 'poNumber', header: 'PO #', accessor: (po) => po.poNumber },
      { key: 'status', header: 'Status', accessor: (po) => po.status },
      { key: 'supplier', header: 'Supplier', accessor: (po) => po.supplierRef?.name || po.supplier || '' },
      { key: 'itemsCount', header: 'Items Count', accessor: (po) => po.items?.length || 0 },
      { key: 'totalQty', header: 'Total Qty', accessor: (po) => (po.items || []).reduce((s, i) => s + i.orderedQty, 0) },
      { key: 'receivedQty', header: 'Received Qty', accessor: (po) => (po.items || []).reduce((s, i) => s + i.receivedQty, 0) },
      { key: 'expectedDate', header: 'Expected Date', accessor: (po) => formatDate(po.expectedDate, dateFmt) },
      { key: 'createdAt', header: 'Created At', accessor: (po) => formatDate(po.createdAt, dateFmt) },
      { key: 'notes', header: 'Notes', accessor: (po) => po.notes || '' },
    ];

    const cols = filterColumns(registry, colParam);
    const headers = cols.map((c) => c.header);
    const rows = purchaseOrders.map((po) => cols.map((c) => c.accessor(po)));

    sendCsv(res, 'purchase-orders-export.csv', buildCsv(headers, rows, delim));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving/import — CSV import for creating POs
router.post('/import', csvUpload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded', code: 'VALIDATION_ERROR' });
    }

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Record<string, string>[];
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Group rows by supplier
    const supplierGroups = new Map<string, { sku: string; qty: number; expectedDate?: string; notes?: string; rowNum: number }[]>();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const supplierName = row['Supplier Name']?.trim();
      const sku = row['SKU']?.trim();
      const qtyRaw = row['Quantity']?.trim();

      if (!supplierName) {
        errors.push(`Row ${i + 2}: Missing Supplier Name`);
        skipped++;
        continue;
      }
      if (!sku) {
        errors.push(`Row ${i + 2}: Missing SKU`);
        skipped++;
        continue;
      }
      if (!qtyRaw || isNaN(Number(qtyRaw)) || parseInt(qtyRaw) <= 0) {
        errors.push(`Row ${i + 2}: Invalid Quantity for SKU "${sku}"`);
        skipped++;
        continue;
      }

      const group = supplierGroups.get(supplierName) || [];
      group.push({
        sku,
        qty: parseInt(qtyRaw),
        expectedDate: row['Expected Date']?.trim(),
        notes: row['Notes']?.trim(),
        rowNum: i + 2,
      });
      supplierGroups.set(supplierName, group);
    }

    // Create one PO per supplier
    for (const [supplierName, items] of supplierGroups) {
      const supplier = await req.prisma!.supplier.findFirst({
        where: { name: { equals: supplierName, mode: 'insensitive' }, tenantId: req.tenantId },
      });

      if (!supplier) {
        for (const item of items) {
          errors.push(`Row ${item.rowNum}: Supplier "${supplierName}" not found`);
          skipped++;
        }
        continue;
      }

      // Look up products by SKU
      const poItems: { sku: string; productName: string; orderedQty: number }[] = [];
      for (const item of items) {
        const product = await req.prisma!.product.findFirst({
          where: { sku: item.sku, store: { tenantId: req.tenantId } },
        });
        if (!product) {
          errors.push(`Row ${item.rowNum}: SKU "${item.sku}" not found`);
          skipped++;
          continue;
        }
        poItems.push({ sku: item.sku, productName: product.name, orderedQty: item.qty });
      }

      if (poItems.length === 0) continue;

      // Generate PO number
      const count = await req.prisma!.purchaseOrder.count({ where: { tenantId: req.tenantId } });
      const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const firstItem = items[0];
      await req.prisma!.purchaseOrder.create({
        data: {
          tenantId: req.tenantId!,
          poNumber,
          supplier: supplierName,
          supplierId: supplier.id,
          expectedDate: firstItem.expectedDate ? new Date(firstItem.expectedDate) : null,
          notes: firstItem.notes || null,
          items: { create: poItems },
        },
      });

      imported += poItems.length;
    }

    res.json({ data: { imported, skipped, errors } });
  } catch (err) {
    next(err);
  }
});

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

    // Enrich items with product images
    const allSkus = [...new Set(purchaseOrders.flatMap((po: any) => po.items?.map((i: any) => i.sku) || []))];
    if (allSkus.length > 0) {
      const products = await req.prisma!.product.findMany({
        where: { sku: { in: allSkus }, store: { tenantId: req.tenantId } },
        select: { sku: true, imageUrl: true },
      });
      const skuImageMap = new Map(products.map((p) => [p.sku, p.imageUrl]));
      for (const po of purchaseOrders as any[]) {
        if (po.items) {
          for (const item of po.items) {
            item.imageUrl = skuImageMap.get(item.sku) || null;
          }
        }
      }
    }

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
        imageUrl: true,
        price: true,
        stockQty: true,
        reservedQty: true,
        packageQty: true,
        weight: true,
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

// GET /api/v1/receiving/:id/pdf — generate PO PDF server-side
router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId);
    if (!poId) return res.status(404).json({ error: true, message: 'PO not found', code: 'NOT_FOUND' });

    const po = await req.prisma!.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true, supplierRef: true },
    });
    if (!po || po.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'PO not found', code: 'NOT_FOUND' });
    }

    // Get tenant branding + default warehouse
    const [tenant, warehouse] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: req.tenantId },
        select: { name: true, settings: true },
      }),
      prisma.warehouse.findFirst({
        where: { tenantId: req.tenantId, isDefault: true },
        select: { name: true, address: true },
      }),
    ]);
    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const template = (['modern', 'classic', 'minimal'].includes(settings.poTemplate as string) ? settings.poTemplate : 'modern') as PoTemplate;
    const companyName = tenant?.name || '';
    const logoUrl = (settings.logoUrl as string) || null;
    const stampUrl = (settings.stampUrl as string) || null;
    const companyAddress = (settings.companyAddress as string) || null;
    const companyEmail = (settings.companyEmail as string) || null;
    const companyPhone = (settings.companyPhone as string) || null;
    const companyVatId = (settings.companyVatId as string) || null;
    const companyWebsite = (settings.companyWebsite as string) || null;

    // Decode logo data URL to PNG buffer (PDFKit doesn't support WebP)
    let logoBuffer: Buffer | null = null;
    if (logoUrl && logoUrl.startsWith('data:')) {
      const match = logoUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match) {
        try {
          logoBuffer = await sharp(Buffer.from(match[1], 'base64')).png().toBuffer();
        } catch { /* skip broken logo */ }
      }
    }

    // Decode stamp data URL to PNG buffer
    let stampBuffer: Buffer | null = null;
    if (stampUrl && stampUrl.startsWith('data:')) {
      const match = stampUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match) {
        try {
          stampBuffer = await sharp(Buffer.from(match[1], 'base64')).png().toBuffer();
        } catch { /* skip broken stamp */ }
      }
    }

    // Enrich items with supplier SKU, EAN, and image
    const allSkus = po.items.map((i: any) => i.sku).filter(Boolean);
    const products = allSkus.length > 0
      ? await prisma.product.findMany({
          where: { sku: { in: allSkus }, store: { tenantId: req.tenantId } },
          select: { id: true, sku: true, imageUrl: true },
        })
      : [];
    const productMap = new Map(products.map(p => [p.sku, p]));
    const productIds = products.map(p => p.id);

    // Get supplier SKUs from SupplierProduct
    const supplierProducts = (po.supplierId && productIds.length > 0)
      ? await prisma.supplierProduct.findMany({
          where: { supplierId: po.supplierId, productId: { in: productIds } },
          select: { productId: true, supplierSku: true },
        })
      : [];
    const supplierSkuMap = new Map(supplierProducts.map(sp => [sp.productId, sp.supplierSku]));

    // Get barcodes (primary or first) for products
    const barcodes = productIds.length > 0
      ? await prisma.productBarcode.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, barcode: true, isPrimary: true },
          orderBy: { isPrimary: 'desc' },
        })
      : [];
    const barcodeMap = new Map<number, string>();
    for (const bc of barcodes) {
      if (!barcodeMap.has(bc.productId)) barcodeMap.set(bc.productId, bc.barcode);
    }

    const supplier = po.supplierRef;

    // Merge PO notes with default PO note from settings
    const defaultPoNote = (settings.defaultPoNote as string) || '';
    const combinedNotes = [po.notes, defaultPoNote].filter(Boolean).join('\n');
    const brandColor = (settings.brandColor as string) || '#6366f1';

    const poData = {
      poNumber: po.poNumber,
      status: po.status,
      createdAt: po.createdAt.toISOString(),
      expectedDate: po.expectedDate?.toISOString() || null,
      notes: combinedNotes || null,
      supplier: {
        name: supplier?.name || po.supplier,
        address: supplier?.address || null,
        email: supplier?.email || null,
        phone: supplier?.phone || null,
      },
      deliveryAddress: warehouse ? `${warehouse.name}${warehouse.address ? ', ' + warehouse.address : ''}` : null,
      items: po.items.map((i: any) => {
        const prod = productMap.get(i.sku);
        const prodId = prod?.id;
        return {
          sku: i.sku,
          productName: i.productName,
          orderedQty: i.orderedQty,
          receivedQty: i.receivedQty,
          unitCost: i.unitCost ? String(i.unitCost) : null,
          supplierSku: prodId ? (supplierSkuMap.get(prodId) || null) : null,
          ean: prodId ? (barcodeMap.get(prodId) || null) : null,
          imageUrl: prod?.imageUrl || null,
        };
      }),
    };

    const pdfDoc = await generatePoPdf(poData, {
      template,
      companyName,
      logoBuffer,
      stampBuffer,
      brandColor,
      companyAddress,
      companyEmail,
      companyPhone,
      companyVatId,
      companyWebsite,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${po.poNumber}.pdf"`);
    pdfDoc.pipe(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/receiving/:id — single PO with items
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    const po = await req.prisma!.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
      include: { items: true, supplierRef: true },
    });

    if (!po) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    // Enrich items with product images, supplier SKU, and EAN
    const allSkus = po.items.map((i: any) => i.sku).filter(Boolean);
    const products = allSkus.length > 0
      ? await req.prisma!.product.findMany({
          where: { sku: { in: allSkus }, store: { tenantId: req.tenantId } },
          select: { id: true, sku: true, imageUrl: true },
        })
      : [];
    const productMap = new Map(products.map(p => [p.sku, p]));
    const productIds = products.map(p => p.id);

    // Get supplier SKUs from SupplierProduct
    const supplierProducts = (po.supplierId && productIds.length > 0)
      ? await req.prisma!.supplierProduct.findMany({
          where: { supplierId: po.supplierId, productId: { in: productIds } },
          select: { productId: true, supplierSku: true },
        })
      : [];
    const supplierSkuMap = new Map(supplierProducts.map(sp => [sp.productId, sp.supplierSku]));

    // Get barcodes (primary or first) for products
    const barcodes = productIds.length > 0
      ? await req.prisma!.productBarcode.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, barcode: true, isPrimary: true },
          orderBy: { isPrimary: 'desc' },
        })
      : [];
    const barcodeMap = new Map<number, string>();
    for (const bc of barcodes) {
      if (!barcodeMap.has(bc.productId)) barcodeMap.set(bc.productId, bc.barcode);
    }

    // Attach enriched fields to each item
    const enrichedItems = po.items.map((i: any) => {
      const prod = productMap.get(i.sku);
      const prodId = prod?.id;
      return {
        ...i,
        productId: prodId || null,
        imageUrl: prod?.imageUrl || null,
        supplierSku: prodId ? (supplierSkuMap.get(prodId) || null) : null,
        ean: prodId ? (barcodeMap.get(prodId) || null) : null,
      };
    });

    res.json({ data: { ...po, items: enrichedItems } });
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

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'po.created',
      resource: 'purchase_order',
      resourceId: String(po.id),
      details: { poNumber, supplier },
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
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    const prisma = req.prisma!;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    const { supplier, expectedDate, notes, items, trackingNumber, trackingUrl, supplierId, invoiceNumber, invoiceDate, invoiceAmount } = req.body as {
      supplier?: string;
      expectedDate?: string | null;
      notes?: string | null;
      items?: CreatePOItem[];
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      supplierId?: number | null;
      invoiceNumber?: string | null;
      invoiceDate?: string | null;
      invoiceAmount?: number | null;
    };

    // Split: tracking/expectedDate/notes can be edited for DRAFT, ORDERED, and SHIPPED,
    // supplier/items/supplierId only in DRAFT
    const isDraft = existing.status === 'DRAFT';
    const canEditDraftOrOrdered = ['DRAFT', 'ORDERED', 'SHIPPED'].includes(existing.status);
    const canEditInvoice = !['RECEIVED', 'CANCELLED'].includes(existing.status);

    if (!isDraft && (supplier !== undefined || items !== undefined || supplierId !== undefined)) {
      return res.status(400).json({ error: true, message: 'Supplier and items can only be edited for DRAFT purchase orders', code: 'INVALID_STATUS' });
    }
    if (!canEditDraftOrOrdered && (expectedDate !== undefined || notes !== undefined)) {
      return res.status(400).json({ error: true, message: 'Expected date and notes can only be edited for DRAFT, ORDERED, or SHIPPED POs', code: 'INVALID_STATUS' });
    }
    if (!canEditDraftOrOrdered && (trackingNumber !== undefined || trackingUrl !== undefined)) {
      return res.status(400).json({ error: true, message: 'Tracking can only be edited for DRAFT, ORDERED, or SHIPPED POs', code: 'INVALID_STATUS' });
    }
    if (!canEditInvoice && (invoiceNumber !== undefined || invoiceDate !== undefined || invoiceAmount !== undefined)) {
      return res.status(400).json({ error: true, message: 'Invoice fields cannot be edited for completed or cancelled POs', code: 'INVALID_STATUS' });
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
        ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber?.trim() || null }),
        ...(invoiceDate !== undefined && { invoiceDate: invoiceDate ? new Date(invoiceDate) : null }),
        ...(invoiceAmount !== undefined && { invoiceAmount: invoiceAmount }),
        ...(items && { items: { create: items } }),
      },
      include: { items: true, supplierRef: true },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/receiving/:id/status — transition PO status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
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
      ORDERED: ['SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'RECEIVED_WITH_RESERVATIONS', 'CANCELLED'],
      SHIPPED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'RECEIVED_WITH_RESERVATIONS', 'CANCELLED'],
      PARTIALLY_RECEIVED: ['RECEIVED', 'RECEIVED_WITH_RESERVATIONS', 'CANCELLED'],
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
        status: status as any,
        ...((status === 'RECEIVED' || status === 'RECEIVED_WITH_RESERVATIONS') && { receivedDate: new Date() }),
      },
      include: { items: true },
    });

    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'po.status_changed',
      resource: 'purchase_order',
      resourceId: String(poId),
      details: { from: existing.status, to: status },
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
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
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
            reference: existingPo.poNumber,
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

    // Slack: PO fully received notification
    if (allReceived) {
      notifyPOReceived(req.tenantId!, {
        poNumber: po!.poNumber || `PO-${po!.id}`,
        supplier: po!.supplier,
        itemCount: po!.items.length,
        totalQty: po!.items.reduce((sum: number, i: any) => sum + i.receivedQty, 0),
      });
      createNotification({
        tenantId: req.tenantId!,
        type: 'po_received',
        title: 'PO fully received',
        message: `${po!.poNumber || `PO-${po!.id}`} from ${po!.supplier} — ${po!.items.length} items received`,
        link: `/receiving/${po!.id}`,
      });
    }

    // Audit log
    logActivity({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'po.items_received',
      resource: 'purchase_order',
      resourceId: String(poId),
      details: { status: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED' },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving/:id/send-to-supplier — send PO email with PDF attachment
router.post('/:id/send-to-supplier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });

    const po = await req.prisma!.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
      include: { items: true, supplierRef: true },
    });

    if (!po) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    if (!po.supplierRef?.email) {
      return res.status(400).json({ error: true, message: 'Supplier has no email address', code: 'NO_EMAIL' });
    }

    // Get tenant branding + default warehouse for PDF generation
    const [tenant, warehouse] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { name: true, settings: true },
      }),
      prisma.warehouse.findFirst({
        where: { tenantId: req.tenantId!, isDefault: true },
        select: { name: true, address: true },
      }),
    ]);
    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const template = (['modern', 'classic', 'minimal'].includes(settings.poTemplate as string) ? settings.poTemplate : 'modern') as PoTemplate;
    const companyName = tenant?.name || 'PickNPack';

    // Decode logo/stamp for PDF
    let logoBuffer: Buffer | null = null;
    const logoUrl = (settings.logoUrl as string) || null;
    if (logoUrl && logoUrl.startsWith('data:')) {
      const match = logoUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match) {
        try { logoBuffer = await sharp(Buffer.from(match[1], 'base64')).png().toBuffer(); } catch { /* skip */ }
      }
    }
    let stampBuffer: Buffer | null = null;
    const stampUrl = (settings.stampUrl as string) || null;
    if (stampUrl && stampUrl.startsWith('data:')) {
      const match = stampUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match) {
        try { stampBuffer = await sharp(Buffer.from(match[1], 'base64')).png().toBuffer(); } catch { /* skip */ }
      }
    }

    // Enrich items for PDF
    const allSkus = po.items.map((i: any) => i.sku).filter(Boolean);
    const products = allSkus.length > 0
      ? await prisma.product.findMany({
          where: { sku: { in: allSkus }, store: { tenantId: req.tenantId! } },
          select: { id: true, sku: true, imageUrl: true },
        })
      : [];
    const productMap = new Map(products.map(p => [p.sku, p]));
    const productIds = products.map(p => p.id);
    const supplierProducts = (po.supplierId && productIds.length > 0)
      ? await prisma.supplierProduct.findMany({
          where: { supplierId: po.supplierId, productId: { in: productIds } },
          select: { productId: true, supplierSku: true },
        })
      : [];
    const supplierSkuMap = new Map(supplierProducts.map(sp => [sp.productId, sp.supplierSku]));
    const barcodes = productIds.length > 0
      ? await prisma.productBarcode.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, barcode: true, isPrimary: true },
          orderBy: { isPrimary: 'desc' },
        })
      : [];
    const barcodeMap = new Map<number, string>();
    for (const bc of barcodes) {
      if (!barcodeMap.has(bc.productId)) barcodeMap.set(bc.productId, bc.barcode);
    }

    const defaultPoNote = (settings.defaultPoNote as string) || '';
    const combinedNotes = [po.notes, defaultPoNote].filter(Boolean).join('\n');

    const poData = {
      poNumber: po.poNumber,
      status: po.status,
      createdAt: po.createdAt.toISOString(),
      expectedDate: po.expectedDate?.toISOString() || null,
      notes: combinedNotes || null,
      supplier: {
        name: po.supplierRef?.name || po.supplier,
        address: po.supplierRef?.address || null,
        email: po.supplierRef?.email || null,
        phone: po.supplierRef?.phone || null,
      },
      deliveryAddress: warehouse ? `${warehouse.name}${warehouse.address ? ', ' + warehouse.address : ''}` : null,
      items: po.items.map((i: any) => {
        const prod = productMap.get(i.sku);
        const prodId = prod?.id;
        return {
          sku: i.sku,
          productName: i.productName,
          orderedQty: i.orderedQty,
          receivedQty: i.receivedQty,
          unitCost: i.unitCost ? String(i.unitCost) : null,
          supplierSku: prodId ? (supplierSkuMap.get(prodId) || null) : null,
          ean: prodId ? (barcodeMap.get(prodId) || null) : null,
          imageUrl: prod?.imageUrl || null,
        };
      }),
    };

    // Generate PDF as buffer
    const pdfDoc = await generatePoPdf(poData, {
      template,
      companyName,
      logoBuffer,
      stampBuffer,
      brandColor: (settings.brandColor as string) || '#6366f1',
      companyAddress: (settings.companyAddress as string) || null,
      companyEmail: (settings.companyEmail as string) || null,
      companyPhone: (settings.companyPhone as string) || null,
      companyVatId: (settings.companyVatId as string) || null,
      companyWebsite: (settings.companyWebsite as string) || null,
    });

    // Collect PDF stream into buffer
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => {
      pdfDoc.on('end', resolve);
      pdfDoc.on('error', reject);
    });
    const pdfBuffer = Buffer.concat(chunks);

    const companyEmail = (settings.companyEmail as string) || null;

    await sendPurchaseOrderEmail(
      po.supplierRef.email,
      {
        poNumber: po.poNumber,
        supplier: po.supplier,
        expectedDate: po.expectedDate?.toISOString() || null,
        notes: po.notes,
        items: po.items.map((i) => ({
          sku: i.sku,
          productName: i.productName,
          orderedQty: i.orderedQty,
          unitCost: i.unitCost?.toString() || null,
        })),
      },
      pdfBuffer,
      companyName,
      companyEmail
    );

    // Update sentAt
    const updated = await req.prisma!.purchaseOrder.update({
      where: { id: poId },
      data: { sentAt: new Date() },
      include: { items: true, supplierRef: true },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/receiving/:id/invoice-upload — upload invoice file
router.post('/:id/invoice-upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded', code: 'VALIDATION_ERROR' });
    }

    const invoiceFileUrl = `/api/uploads/invoices/${req.file.filename}`;

    // Delete old file if exists
    if (existing.invoiceFileUrl) {
      try {
        const oldPath = resolve(__dirname, '../..', existing.invoiceFileUrl.replace(/^\/api\//, ''));
        if (existsSync(oldPath)) unlinkSync(oldPath);
      } catch { /* ignore */ }
    }

    const po = await req.prisma!.purchaseOrder.update({
      where: { id: poId },
      data: { invoiceFileUrl },
      include: { items: true, supplierRef: true },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/receiving/:id/invoice-file — remove invoice file
router.delete('/:id/invoice-file', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });

    const existing = await req.prisma!.purchaseOrder.findFirst({
      where: { id: poId, tenantId: req.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
    }

    if (existing.invoiceFileUrl) {
      try {
        const filePath = resolve(__dirname, '../..', existing.invoiceFileUrl.replace(/^\/api\//, ''));
        if (existsSync(filePath)) unlinkSync(filePath);
      } catch { /* ignore */ }
    }

    const po = await req.prisma!.purchaseOrder.update({
      where: { id: poId },
      data: { invoiceFileUrl: null },
      include: { items: true, supplierRef: true },
    });

    res.json({ data: po });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/receiving/:id — delete PO (only DRAFT)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poId = await resolvePOId(req.params.id, req.tenantId!);
    if (!poId) return res.status(404).json({ error: true, message: 'Purchase order not found', code: 'NOT_FOUND' });
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
