import PDFDocument from 'pdfkit';
import type { PassThrough } from 'stream';

export type PoTemplate = 'modern' | 'classic' | 'minimal';

interface PoData {
  poNumber: string;
  supplier: string;
  status: string;
  createdAt: string;
  expectedDate: string | null;
  notes: string | null;
  items: Array<{
    sku: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    unitCost: string | null;
  }>;
}

interface PdfOptions {
  template: PoTemplate;
  companyName: string;
  logoBuffer: Buffer | null;
}

// ─── Color helpers ─────────────────────────────────────

type RGB = [number, number, number];

const PALETTES: Record<PoTemplate, {
  primary: RGB; accent: RGB; muted: RGB; headerBg: RGB; headerText: RGB; lightBg: RGB; border: RGB;
}> = {
  modern: {
    primary: [15, 23, 42], accent: [99, 102, 241], muted: [100, 116, 139],
    headerBg: [15, 23, 42], headerText: [255, 255, 255], lightBg: [248, 250, 252], border: [226, 232, 240],
  },
  classic: {
    primary: [30, 30, 30], accent: [55, 65, 81], muted: [107, 114, 128],
    headerBg: [55, 65, 81], headerText: [255, 255, 255], lightBg: [249, 250, 251], border: [209, 213, 219],
  },
  minimal: {
    primary: [23, 23, 23], accent: [23, 23, 23], muted: [115, 115, 115],
    headerBg: [245, 245, 245], headerText: [23, 23, 23], lightBg: [250, 250, 250], border: [229, 229, 229],
  },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(v: number) {
  return v > 0 ? `$${v.toFixed(2)}` : '—';
}

// ─── Main generator ────────────────────────────────────

export function generatePoPdf(po: PoData, opts: PdfOptions): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const p = PALETTES[opts.template];
  const m = 40; // margin
  const pageW = 595.28; // A4 width
  const contentW = pageW - m * 2;

  const items = po.items || [];
  const totalCost = items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + parseFloat(item.unitCost) * item.orderedQty;
  }, 0);

  if (opts.template === 'modern') drawModern(doc, po, items, totalCost, p, opts, m, contentW, pageW);
  else if (opts.template === 'classic') drawClassic(doc, po, items, totalCost, p, opts, m, contentW, pageW);
  else drawMinimal(doc, po, items, totalCost, p, opts, m, contentW, pageW);

  doc.end();
  return doc;
}

// ─── Table helper ──────────────────────────────────────

interface ColDef {
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
  key: string;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  y: number,
  rows: string[][],
  cols: ColDef[],
  p: typeof PALETTES.modern,
  m: number,
  opts: { gridLines?: boolean } = {}
): number {
  const rowH = 22;
  const headerH = 24;
  const fontSize = 8;
  const headerFontSize = 7.5;

  // Header row
  doc.save();
  doc.rect(m, y, cols.reduce((s, c) => s + c.width, 0), headerH).fill(p.headerBg);
  let x = m;
  doc.fontSize(headerFontSize).font('Helvetica-Bold').fillColor(p.headerText);
  for (const col of cols) {
    const textX = col.align === 'right' ? x + col.width - 6 : col.align === 'center' ? x + col.width / 2 : x + 6;
    const alignOpt = col.align === 'right' ? { width: 0, align: 'right' as const } : col.align === 'center' ? { width: col.width, align: 'center' as const } : {};
    if (col.align === 'center') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width, align: 'center' });
    } else if (col.align === 'right') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width - 6, align: 'right' });
    } else {
      doc.text(col.label, x + 6, y + (headerH - headerFontSize) / 2);
    }
    x += col.width;
  }
  doc.restore();

  y += headerH;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isAlt = r % 2 === 1;

    if (isAlt) {
      doc.save();
      doc.rect(m, y, cols.reduce((s, c) => s + c.width, 0), rowH).fill(p.lightBg);
      doc.restore();
    }

    if (opts.gridLines) {
      doc.save();
      doc.strokeColor(p.border).lineWidth(0.3);
      doc.moveTo(m, y + rowH).lineTo(m + cols.reduce((s, c) => s + c.width, 0), y + rowH).stroke();
      doc.restore();
    }

    x = m;
    doc.fontSize(fontSize).font('Helvetica').fillColor(p.primary);
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const val = row[c] || '';
      if (col.align === 'center') {
        doc.text(val, x, y + (rowH - fontSize) / 2, { width: col.width, align: 'center' });
      } else if (col.align === 'right') {
        doc.text(val, x, y + (rowH - fontSize) / 2, { width: col.width - 6, align: 'right' });
      } else {
        doc.text(val, x + 6, y + (rowH - fontSize) / 2, { width: col.width - 12, ellipsis: true });
      }
      x += col.width;
    }
    y += rowH;
  }

  return y;
}

// ─── MODERN ────────────────────────────────────────────

function drawModern(
  doc: PDFKit.PDFDocument, po: PoData, items: PoData['items'], totalCost: number,
  p: typeof PALETTES.modern, opts: PdfOptions, m: number, contentW: number, pageW: number
) {
  // Top accent bar
  doc.save().rect(0, 0, pageW, 5).fill(p.accent).restore();

  let y = 28;

  // Logo
  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m, y - 2, { height: 20 }); } catch {}
  }

  // Company name
  if (opts.companyName) {
    const nameX = opts.logoBuffer ? m + 26 : m;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(p.primary).text(opts.companyName, nameX, y + 2);
  }

  // PO title — right
  doc.font('Helvetica-Bold').fontSize(18).fillColor(p.accent);
  doc.text('PURCHASE ORDER', m, y, { width: contentW, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor(p.muted);
  doc.text(po.poNumber, m, y + 18, { width: contentW, align: 'right' });

  y = 58;
  doc.save().strokeColor(p.border).lineWidth(0.5).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 12;

  // Info
  doc.font('Helvetica-Bold').fontSize(7).fillColor(p.muted).text('SUPPLIER', m, y);
  doc.text('DETAILS', pageW / 2, y);
  y += 10;

  doc.font('Helvetica').fontSize(10).fillColor(p.primary).text(po.supplier, m, y);

  doc.font('Helvetica').fontSize(8.5).fillColor(p.muted);
  doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, pageW / 2, y);
  doc.text(`Created: ${fmtDate(po.createdAt)}`, pageW / 2, y + 11);
  if (po.expectedDate) doc.text(`Expected: ${fmtDate(po.expectedDate)}`, pageW / 2, y + 22);

  y += (po.expectedDate ? 38 : 28);

  // Table
  const cols: ColDef[] = [
    { label: 'SKU', width: 70, align: 'left', key: 'sku' },
    { label: 'Product', width: contentW - 70 - 50 - 50 - 60 - 60, align: 'left', key: 'product' },
    { label: 'Ordered', width: 50, align: 'center', key: 'ordered' },
    { label: 'Received', width: 50, align: 'center', key: 'received' },
    { label: 'Unit Cost', width: 60, align: 'right', key: 'unitCost' },
    { label: 'Total', width: 60, align: 'right', key: 'total' },
  ];

  const rows = items.map(i => [
    i.sku || '—',
    i.productName,
    String(i.orderedQty),
    String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '—',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '—',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Total
  if (totalCost > 0) {
    const ty = tableEnd + 8;
    doc.save().rect(pageW - m - 100, ty - 4, 100, 20).fill(p.lightBg).restore();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(p.primary);
    doc.text('Total', pageW - m - 94, ty + 1);
    doc.text(fmtMoney(totalCost), pageW - m - 94, ty + 1, { width: 88, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 36;
    doc.font('Helvetica-Bold').fontSize(7).fillColor(p.muted).text('NOTES', m, ny);
    doc.font('Helvetica').fontSize(8.5).fillColor(p.primary).text(po.notes, m, ny + 10, { width: contentW });
  }

  // Footer
  doc.font('Helvetica').fontSize(7).fillColor([180, 180, 180]);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, m, 800);
  if (opts.companyName) doc.text(opts.companyName, m, 800, { width: contentW, align: 'right' });
}

// ─── CLASSIC ───────────────────────────────────────────

function drawClassic(
  doc: PDFKit.PDFDocument, po: PoData, items: PoData['items'], totalCost: number,
  p: typeof PALETTES.classic, opts: PdfOptions, m: number, contentW: number, pageW: number
) {
  let y = 28;

  // Header box
  doc.save().strokeColor(p.border).lineWidth(0.5).rect(m, y - 6, contentW, 36).stroke().restore();

  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m + 6, y, { height: 18 }); } catch {}
  }

  const nameX = opts.logoBuffer ? m + 30 : m + 8;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(p.primary).text('Purchase Order', nameX, y + 2);
  if (opts.companyName) {
    doc.font('Helvetica').fontSize(8).fillColor(p.muted).text(opts.companyName, nameX, y + 16);
  }

  // PO number right
  doc.font('Helvetica-Bold').fontSize(11).fillColor(p.primary);
  doc.text(po.poNumber, m + 8, y + 2, { width: contentW - 16, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(p.muted);
  doc.text(fmtDate(po.createdAt), m + 8, y + 16, { width: contentW - 16, align: 'right' });

  y += 40;

  // Two info boxes
  const halfW = (contentW - 8) / 2;

  // Supplier box
  doc.save().rect(m, y, halfW, 28).fill(p.lightBg).restore();
  doc.save().strokeColor(p.border).lineWidth(0.3).rect(m, y, halfW, 28).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(p.muted).text('SUPPLIER', m + 6, y + 5);
  doc.font('Helvetica').fontSize(9).fillColor(p.primary).text(po.supplier, m + 6, y + 15);

  // Details box
  const dx = m + halfW + 8;
  doc.save().rect(dx, y, halfW, 28).fill(p.lightBg).restore();
  doc.save().strokeColor(p.border).lineWidth(0.3).rect(dx, y, halfW, 28).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(p.muted).text('ORDER DETAILS', dx + 6, y + 5);
  doc.font('Helvetica').fontSize(8).fillColor(p.primary);
  doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, dx + 6, y + 14);
  if (po.expectedDate) doc.text(`Expected: ${fmtDate(po.expectedDate)}`, dx + 6, y + 23);

  y += 38;

  // Table with grid
  const cols: ColDef[] = [
    { label: 'SKU', width: 65, align: 'left', key: 'sku' },
    { label: 'Product', width: contentW - 65 - 44 - 44 - 58 - 62, align: 'left', key: 'product' },
    { label: 'Qty', width: 44, align: 'center', key: 'ordered' },
    { label: 'Rcvd', width: 44, align: 'center', key: 'received' },
    { label: 'Unit Cost', width: 58, align: 'right', key: 'unitCost' },
    { label: 'Line Total', width: 62, align: 'right', key: 'total' },
  ];

  const rows = items.map(i => [
    i.sku || '—', i.productName, String(i.orderedQty), String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '—',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '—',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m, { gridLines: true });

  // Total
  if (totalCost > 0) {
    doc.save().strokeColor(p.border).moveTo(pageW - m - 80, tableEnd + 4).lineTo(pageW - m, tableEnd + 4).stroke().restore();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(p.primary);
    doc.text('Total:', pageW - m - 80, tableEnd + 10);
    doc.text(fmtMoney(totalCost), pageW - m - 80, tableEnd + 10, { width: 74, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 28;
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(p.muted).text('Notes:', m, ny);
    doc.font('Helvetica').text(po.notes, m, ny + 10, { width: contentW });
  }

  // Footer
  doc.save().strokeColor(p.border).moveTo(m, 795).lineTo(pageW - m, 795).stroke().restore();
  doc.font('Helvetica').fontSize(7).fillColor([160, 160, 160]);
  doc.text(opts.companyName || 'Purchase Order', m, 800);
  doc.text(`Page 1 · ${fmtDate(new Date().toISOString())}`, m, 800, { width: contentW, align: 'right' });
}

// ─── MINIMAL ───────────────────────────────────────────

function drawMinimal(
  doc: PDFKit.PDFDocument, po: PoData, items: PoData['items'], totalCost: number,
  p: typeof PALETTES.minimal, opts: PdfOptions, m: number, contentW: number, pageW: number
) {
  let y = 28;

  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m, y - 2, { height: 16 }); } catch {}
  }

  if (opts.companyName) {
    const nameX = opts.logoBuffer ? m + 22 : m;
    doc.font('Helvetica').fontSize(9).fillColor(p.muted).text(opts.companyName, nameX, y + 1);
  }

  y += 22;

  // Big PO number
  doc.font('Helvetica-Bold').fontSize(16).fillColor(p.primary).text(po.poNumber, m, y);

  const meta = [po.supplier, fmtDate(po.createdAt), po.status.replace(/_/g, ' ')];
  if (po.expectedDate) meta.push(`Expected ${fmtDate(po.expectedDate)}`);
  doc.font('Helvetica').fontSize(8).fillColor(p.muted).text(meta.join('  ·  '), m, y + 18);

  y += 38;

  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 8;

  // Table
  const cols: ColDef[] = [
    { label: 'Product', width: contentW - 55 - 40 - 40 - 55 - 55, align: 'left', key: 'product' },
    { label: 'SKU', width: 55, align: 'left', key: 'sku' },
    { label: 'Ord', width: 40, align: 'center', key: 'ordered' },
    { label: 'Rcvd', width: 40, align: 'center', key: 'received' },
    { label: 'Cost', width: 55, align: 'right', key: 'unitCost' },
    { label: 'Total', width: 55, align: 'right', key: 'total' },
  ];

  const rows = items.map(i => [
    i.productName, i.sku || '', String(i.orderedQty), String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Total
  if (totalCost > 0) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(p.primary);
    doc.text(`Total  ${fmtMoney(totalCost)}`, m, tableEnd + 10, { width: contentW, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 28;
    doc.font('Helvetica').fontSize(8).fillColor(p.muted).text(po.notes, m, ny, { width: contentW });
  }

  // Footer
  doc.font('Helvetica').fontSize(7).fillColor([200, 200, 200]);
  doc.text(opts.companyName || '', m, 805);
}
