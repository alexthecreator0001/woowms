import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_DIR = path.join(__dirname, 'fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'Roboto-Regular.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'Roboto-Bold.ttf');
const FONT_ITALIC = path.join(FONT_DIR, 'Roboto-Italic.ttf');

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

// ─── Color palettes (hex strings for PDFKit) ──────────

const PALETTES = {
  modern: {
    primary: '#0f172a', accent: '#6366f1', muted: '#64748b',
    headerBg: '#0f172a', headerText: '#ffffff', lightBg: '#f8fafc', border: '#e2e8f0',
  },
  classic: {
    primary: '#1e1e1e', accent: '#374151', muted: '#6b7280',
    headerBg: '#374151', headerText: '#ffffff', lightBg: '#f9fafb', border: '#d1d5db',
  },
  minimal: {
    primary: '#171717', accent: '#171717', muted: '#737373',
    headerBg: '#f5f5f5', headerText: '#171717', lightBg: '#fafafa', border: '#e5e5e5',
  },
} as const;

type Palette = typeof PALETTES.modern;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(v: number) {
  return v > 0 ? `$${v.toFixed(2)}` : '\u2014';
}

// ─── Font registration helper ─────────────────────────

function registerFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold', FONT_BOLD);
  doc.registerFont('Italic', FONT_ITALIC);
}

// ─── Main generator ────────────────────────────────────

export function generatePoPdf(po: PoData, opts: PdfOptions): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  registerFonts(doc);

  const p = PALETTES[opts.template];
  const m = 40;
  const pageW = 595.28;
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
}

function drawTable(
  doc: PDFKit.PDFDocument,
  y: number,
  rows: string[][],
  cols: ColDef[],
  p: Palette,
  m: number,
  opts: { gridLines?: boolean } = {}
): number {
  const rowH = 22;
  const headerH = 24;
  const fontSize = 8;
  const headerFontSize = 7.5;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Header row
  doc.save();
  doc.rect(m, y, tableW, headerH).fill(p.headerBg);
  let x = m;
  doc.fontSize(headerFontSize).font('Bold').fillColor(p.headerText);
  for (const col of cols) {
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
      doc.rect(m, y, tableW, rowH).fill(p.lightBg);
      doc.restore();
    }

    if (opts.gridLines) {
      doc.save();
      doc.strokeColor(p.border).lineWidth(0.3);
      doc.moveTo(m, y + rowH).lineTo(m + tableW, y + rowH).stroke();
      doc.restore();
    }

    x = m;
    doc.fontSize(fontSize).font('Regular').fillColor(p.primary);
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
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number
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
    doc.font('Bold').fontSize(12).fillColor(p.primary).text(opts.companyName, nameX, y + 2);
  }

  // PO title — right
  doc.font('Bold').fontSize(18).fillColor(p.accent);
  doc.text('PURCHASE ORDER', m, y, { width: contentW, align: 'right' });
  doc.font('Regular').fontSize(10).fillColor(p.muted);
  doc.text(po.poNumber, m, y + 18, { width: contentW, align: 'right' });

  y = 58;
  doc.save().strokeColor(p.border).lineWidth(0.5).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 12;

  // Info
  doc.font('Bold').fontSize(7).fillColor(p.muted).text('SUPPLIER', m, y);
  doc.text('DETAILS', pageW / 2, y);
  y += 10;

  doc.font('Regular').fontSize(10).fillColor(p.primary).text(po.supplier, m, y);

  doc.font('Regular').fontSize(8.5).fillColor(p.muted);
  doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, pageW / 2, y);
  doc.text(`Created: ${fmtDate(po.createdAt)}`, pageW / 2, y + 11);
  if (po.expectedDate) doc.text(`Expected: ${fmtDate(po.expectedDate)}`, pageW / 2, y + 22);

  y += (po.expectedDate ? 38 : 28);

  // Table
  const cols: ColDef[] = [
    { label: 'SKU', width: 70, align: 'left' },
    { label: 'Product', width: contentW - 70 - 50 - 50 - 60 - 60, align: 'left' },
    { label: 'Ordered', width: 50, align: 'center' },
    { label: 'Received', width: 50, align: 'center' },
    { label: 'Unit Cost', width: 60, align: 'right' },
    { label: 'Total', width: 60, align: 'right' },
  ];

  const rows = items.map(i => [
    i.sku || '\u2014',
    i.productName,
    String(i.orderedQty),
    String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '\u2014',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '\u2014',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Total
  if (totalCost > 0) {
    const ty = tableEnd + 8;
    doc.save().rect(pageW - m - 100, ty - 4, 100, 20).fill(p.lightBg).restore();
    doc.font('Bold').fontSize(9).fillColor(p.primary);
    doc.text('Total', pageW - m - 94, ty + 1);
    doc.text(fmtMoney(totalCost), pageW - m - 94, ty + 1, { width: 88, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 36;
    doc.font('Bold').fontSize(7).fillColor(p.muted).text('NOTES', m, ny);
    doc.font('Regular').fontSize(8.5).fillColor(p.primary).text(po.notes, m, ny + 10, { width: contentW });
  }

  // Footer
  doc.font('Regular').fontSize(7).fillColor('#b4b4b4');
  doc.text(`Generated ${new Date().toLocaleDateString()}`, m, 800);
  if (opts.companyName) doc.text(opts.companyName, m, 800, { width: contentW, align: 'right' });
}

// ─── CLASSIC ───────────────────────────────────────────

function drawClassic(
  doc: PDFKit.PDFDocument, po: PoData, items: PoData['items'], totalCost: number,
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number
) {
  let y = 28;

  // Header box
  doc.save().strokeColor(p.border).lineWidth(0.5).rect(m, y - 6, contentW, 36).stroke().restore();

  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m + 6, y, { height: 18 }); } catch {}
  }

  const nameX = opts.logoBuffer ? m + 30 : m + 8;
  doc.font('Bold').fontSize(14).fillColor(p.primary).text('Purchase Order', nameX, y + 2);
  if (opts.companyName) {
    doc.font('Regular').fontSize(8).fillColor(p.muted).text(opts.companyName, nameX, y + 16);
  }

  // PO number right
  doc.font('Bold').fontSize(11).fillColor(p.primary);
  doc.text(po.poNumber, m + 8, y + 2, { width: contentW - 16, align: 'right' });
  doc.font('Regular').fontSize(7.5).fillColor(p.muted);
  doc.text(fmtDate(po.createdAt), m + 8, y + 16, { width: contentW - 16, align: 'right' });

  y += 40;

  // Two info boxes
  const halfW = (contentW - 8) / 2;

  // Supplier box
  doc.save().rect(m, y, halfW, 28).fill(p.lightBg).restore();
  doc.save().strokeColor(p.border).lineWidth(0.3).rect(m, y, halfW, 28).stroke().restore();
  doc.font('Bold').fontSize(6.5).fillColor(p.muted).text('SUPPLIER', m + 6, y + 5);
  doc.font('Regular').fontSize(9).fillColor(p.primary).text(po.supplier, m + 6, y + 15);

  // Details box
  const dx = m + halfW + 8;
  doc.save().rect(dx, y, halfW, 28).fill(p.lightBg).restore();
  doc.save().strokeColor(p.border).lineWidth(0.3).rect(dx, y, halfW, 28).stroke().restore();
  doc.font('Bold').fontSize(6.5).fillColor(p.muted).text('ORDER DETAILS', dx + 6, y + 5);
  doc.font('Regular').fontSize(8).fillColor(p.primary);
  doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, dx + 6, y + 14);
  if (po.expectedDate) doc.text(`Expected: ${fmtDate(po.expectedDate)}`, dx + 6, y + 23);

  y += 38;

  // Table with grid
  const cols: ColDef[] = [
    { label: 'SKU', width: 65, align: 'left' },
    { label: 'Product', width: contentW - 65 - 44 - 44 - 58 - 62, align: 'left' },
    { label: 'Qty', width: 44, align: 'center' },
    { label: 'Rcvd', width: 44, align: 'center' },
    { label: 'Unit Cost', width: 58, align: 'right' },
    { label: 'Line Total', width: 62, align: 'right' },
  ];

  const rows = items.map(i => [
    i.sku || '\u2014', i.productName, String(i.orderedQty), String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '\u2014',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '\u2014',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m, { gridLines: true });

  // Total
  if (totalCost > 0) {
    doc.save().strokeColor(p.border).moveTo(pageW - m - 80, tableEnd + 4).lineTo(pageW - m, tableEnd + 4).stroke().restore();
    doc.font('Bold').fontSize(9).fillColor(p.primary);
    doc.text('Total:', pageW - m - 80, tableEnd + 10);
    doc.text(fmtMoney(totalCost), pageW - m - 80, tableEnd + 10, { width: 74, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 28;
    doc.font('Italic').fontSize(7.5).fillColor(p.muted).text('Notes:', m, ny);
    doc.font('Regular').text(po.notes, m, ny + 10, { width: contentW });
  }

  // Footer
  doc.save().strokeColor(p.border).moveTo(m, 795).lineTo(pageW - m, 795).stroke().restore();
  doc.font('Regular').fontSize(7).fillColor('#a0a0a0');
  doc.text(opts.companyName || 'Purchase Order', m, 800);
  doc.text(`Page 1 \u00B7 ${fmtDate(new Date().toISOString())}`, m, 800, { width: contentW, align: 'right' });
}

// ─── MINIMAL ───────────────────────────────────────────

function drawMinimal(
  doc: PDFKit.PDFDocument, po: PoData, items: PoData['items'], totalCost: number,
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number
) {
  let y = 28;

  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m, y - 2, { height: 16 }); } catch {}
  }

  if (opts.companyName) {
    const nameX = opts.logoBuffer ? m + 22 : m;
    doc.font('Regular').fontSize(9).fillColor(p.muted).text(opts.companyName, nameX, y + 1);
  }

  y += 22;

  // Big PO number
  doc.font('Bold').fontSize(16).fillColor(p.primary).text(po.poNumber, m, y);

  const meta = [po.supplier, fmtDate(po.createdAt), po.status.replace(/_/g, ' ')];
  if (po.expectedDate) meta.push(`Expected ${fmtDate(po.expectedDate)}`);
  doc.font('Regular').fontSize(8).fillColor(p.muted).text(meta.join('  \u00B7  '), m, y + 18);

  y += 38;

  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 8;

  // Table
  const cols: ColDef[] = [
    { label: 'Product', width: contentW - 55 - 40 - 40 - 55 - 55, align: 'left' },
    { label: 'SKU', width: 55, align: 'left' },
    { label: 'Ord', width: 40, align: 'center' },
    { label: 'Rcvd', width: 40, align: 'center' },
    { label: 'Cost', width: 55, align: 'right' },
    { label: 'Total', width: 55, align: 'right' },
  ];

  const rows = items.map(i => [
    i.productName, i.sku || '', String(i.orderedQty), String(i.receivedQty),
    i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '',
    i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '',
  ]);

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Total
  if (totalCost > 0) {
    doc.font('Bold').fontSize(9.5).fillColor(p.primary);
    doc.text(`Total  ${fmtMoney(totalCost)}`, m, tableEnd + 10, { width: contentW, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 28;
    doc.font('Regular').fontSize(8).fillColor(p.muted).text(po.notes, m, ny, { width: contentW });
  }

  // Footer
  doc.font('Regular').fontSize(7).fillColor('#c8c8c8');
  doc.text(opts.companyName || '', m, 805);
}
