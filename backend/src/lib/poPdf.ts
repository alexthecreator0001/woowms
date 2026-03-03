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

interface PoItem {
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: string | null;
  supplierSku: string | null;
  ean: string | null;
  imageUrl: string | null;
}

interface PoData {
  poNumber: string;
  status: string;
  createdAt: string;
  expectedDate: string | null;
  notes: string | null;
  supplier: {
    name: string;
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  deliveryAddress: string | null;
  items: PoItem[];
}

interface PdfOptions {
  template: PoTemplate;
  companyName: string;
  logoBuffer: Buffer | null;
}

// ─── Color palettes ───────────────────────────────────

const PALETTES = {
  modern: {
    primary: '#0f172a', accent: '#6366f1', muted: '#64748b',
    headerBg: '#0f172a', headerText: '#ffffff', lightBg: '#f8fafc', border: '#e2e8f0',
    sectionBg: '#f1f5f9',
  },
  classic: {
    primary: '#1e1e1e', accent: '#374151', muted: '#6b7280',
    headerBg: '#374151', headerText: '#ffffff', lightBg: '#f9fafb', border: '#d1d5db',
    sectionBg: '#f3f4f6',
  },
  minimal: {
    primary: '#171717', accent: '#171717', muted: '#737373',
    headerBg: '#f5f5f5', headerText: '#171717', lightBg: '#fafafa', border: '#e5e5e5',
    sectionBg: '#fafafa',
  },
} as const;

type Palette = typeof PALETTES.modern;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(v: number) {
  return v > 0 ? `$${v.toFixed(2)}` : '-';
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ');
}

// ─── Font registration ────────────────────────────────

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
  const pageH = 841.89;
  const contentW = pageW - m * 2;

  const items = po.items || [];
  const totalCost = items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + parseFloat(item.unitCost) * item.orderedQty;
  }, 0);

  if (opts.template === 'modern') drawModern(doc, po, items, totalCost, p, opts, m, contentW, pageW, pageH);
  else if (opts.template === 'classic') drawClassic(doc, po, items, totalCost, p, opts, m, contentW, pageW, pageH);
  else drawMinimal(doc, po, items, totalCost, p, opts, m, contentW, pageW, pageH);

  doc.end();
  return doc;
}

// ─── Shared drawing helpers ───────────────────────────

function drawInfoBox(
  doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number,
  title: string, lines: string[], p: Palette
) {
  doc.save().rect(x, y, w, h).fill(p.sectionBg).restore();
  doc.save().strokeColor(p.border).lineWidth(0.3).rect(x, y, w, h).stroke().restore();
  doc.font('Bold').fontSize(6.5).fillColor(p.muted).text(title, x + 8, y + 6);
  doc.font('Regular').fontSize(8).fillColor(p.primary);
  let ly = y + 16;
  for (const line of lines) {
    if (!line) continue;
    doc.text(line, x + 8, ly, { width: w - 16 });
    ly += 10;
  }
}

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
  gridLines: boolean = false
): number {
  const rowH = 20;
  const headerH = 22;
  const fontSize = 7.5;
  const headerFontSize = 7;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Header
  doc.save();
  doc.rect(m, y, tableW, headerH).fill(p.headerBg);
  let x = m;
  doc.fontSize(headerFontSize).font('Bold').fillColor(p.headerText);
  for (const col of cols) {
    const pad = 5;
    if (col.align === 'center') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width, align: 'center' });
    } else if (col.align === 'right') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width - pad, align: 'right' });
    } else {
      doc.text(col.label, x + pad, y + (headerH - headerFontSize) / 2);
    }
    x += col.width;
  }
  doc.restore();
  y += headerH;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (r % 2 === 1) {
      doc.save().rect(m, y, tableW, rowH).fill(p.lightBg).restore();
    }
    if (gridLines) {
      doc.save().strokeColor(p.border).lineWidth(0.3)
        .moveTo(m, y + rowH).lineTo(m + tableW, y + rowH).stroke().restore();
    }

    x = m;
    const pad = 5;
    doc.fontSize(fontSize).font('Regular').fillColor(p.primary);
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const val = row[c] || '';
      if (col.align === 'center') {
        doc.text(val, x, y + (rowH - fontSize) / 2, { width: col.width, align: 'center' });
      } else if (col.align === 'right') {
        doc.text(val, x, y + (rowH - fontSize) / 2, { width: col.width - pad, align: 'right' });
      } else {
        doc.text(val, x + pad, y + (rowH - fontSize) / 2, { width: col.width - pad * 2, ellipsis: true });
      }
      x += col.width;
    }
    y += rowH;
  }

  return y;
}

function drawFooter(doc: PDFKit.PDFDocument, companyName: string, p: Palette, m: number, contentW: number) {
  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, 800).lineTo(m + contentW, 800).stroke().restore();
  doc.font('Regular').fontSize(6.5).fillColor('#aaaaaa');
  doc.text(companyName || '', m, 805);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, m, 805, { width: contentW, align: 'right' });
}

// ─── MODERN ────────────────────────────────────────────

function drawModern(
  doc: PDFKit.PDFDocument, po: PoData, items: PoItem[], totalCost: number,
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number, pageH: number
) {
  // Top accent bar
  doc.save().rect(0, 0, pageW, 4).fill(p.accent).restore();

  let y = 20;

  // Header row: logo + company left, PO title right
  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m, y, { height: 28 }); } catch {}
  }

  const nameX = opts.logoBuffer ? m + 34 : m;
  if (opts.companyName) {
    doc.font('Bold').fontSize(13).fillColor(p.primary).text(opts.companyName, nameX, y + 2);
  }

  doc.font('Bold').fontSize(20).fillColor(p.accent);
  doc.text('PURCHASE ORDER', m, y, { width: contentW, align: 'right' });
  doc.font('Regular').fontSize(10).fillColor(p.muted);
  doc.text(po.poNumber, m, y + 22, { width: contentW, align: 'right' });

  y = 56;
  doc.save().strokeColor(p.border).lineWidth(0.5).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 10;

  // Info boxes row
  const boxW = (contentW - 12) / 3;
  const boxH = 52;

  // Supplier box
  const supplierLines = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);
  drawInfoBox(doc, m, y, boxW, boxH, 'SUPPLIER', supplierLines, p);

  // Delivery address box
  const deliveryLines = po.deliveryAddress ? [po.deliveryAddress] : ['Not specified'];
  drawInfoBox(doc, m + boxW + 6, y, boxW, boxH, 'DELIVER TO', deliveryLines, p);

  // Order details box
  const detailLines = [
    `Status: ${fmtStatus(po.status)}`,
    `Date: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);
  drawInfoBox(doc, m + (boxW + 6) * 2, y, boxW, boxH, 'ORDER DETAILS', detailLines, p);

  y += boxH + 12;

  // Table
  const hasSupplierSku = items.some(i => i.supplierSku);
  const hasEan = items.some(i => i.ean);

  const cols: ColDef[] = [];
  let remainW = contentW;

  // Fixed-width columns
  const qtyW = 36;
  const costW = 54;
  const totalW = 58;
  const skuW = 62;
  const supplierSkuW = hasSupplierSku ? 62 : 0;
  const eanW = hasEan ? 72 : 0;

  remainW -= (qtyW + costW + totalW + skuW + supplierSkuW + eanW);

  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supplier SKU', width: supplierSkuW, align: 'left' });
  cols.push({ label: 'Product', width: remainW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalW, align: 'right' });

  const rows = items.map(i => {
    const row: string[] = [];
    row.push(i.sku || '-');
    if (hasSupplierSku) row.push(i.supplierSku || '-');
    row.push(i.productName);
    if (hasEan) row.push(i.ean || '-');
    row.push(String(i.orderedQty));
    row.push(i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '-');
    row.push(i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '-');
    return row;
  });

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Totals summary
  if (totalCost > 0) {
    const ty = tableEnd + 6;
    const summaryW = 140;
    const sx = pageW - m - summaryW;
    doc.save().rect(sx, ty, summaryW, 22).fill(p.sectionBg).restore();
    doc.save().strokeColor(p.border).lineWidth(0.3).rect(sx, ty, summaryW, 22).stroke().restore();
    doc.font('Bold').fontSize(9).fillColor(p.primary);
    doc.text('TOTAL', sx + 8, ty + 6);
    doc.text(fmtMoney(totalCost), sx + 8, ty + 6, { width: summaryW - 16, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 36;
    doc.font('Bold').fontSize(7).fillColor(p.muted).text('NOTES', m, ny);
    doc.font('Regular').fontSize(8).fillColor(p.primary).text(po.notes, m, ny + 10, { width: contentW });
  }

  drawFooter(doc, opts.companyName, p, m, contentW);
}

// ─── CLASSIC ───────────────────────────────────────────

function drawClassic(
  doc: PDFKit.PDFDocument, po: PoData, items: PoItem[], totalCost: number,
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number, pageH: number
) {
  let y = 22;

  // Header box
  doc.save().strokeColor(p.border).lineWidth(0.5).rect(m, y - 4, contentW, 40).stroke().restore();

  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m + 8, y + 2, { height: 22 }); } catch {}
  }

  const nameX = opts.logoBuffer ? m + 36 : m + 8;
  doc.font('Bold').fontSize(15).fillColor(p.primary).text('Purchase Order', nameX, y);
  if (opts.companyName) {
    doc.font('Regular').fontSize(8).fillColor(p.muted).text(opts.companyName, nameX, y + 16);
  }

  doc.font('Bold').fontSize(11).fillColor(p.primary);
  doc.text(po.poNumber, m + 8, y, { width: contentW - 16, align: 'right' });
  doc.font('Regular').fontSize(7.5).fillColor(p.muted);
  doc.text(fmtDate(po.createdAt), m + 8, y + 14, { width: contentW - 16, align: 'right' });

  y += 46;

  // Three info boxes
  const boxW = (contentW - 12) / 3;
  const boxH = 50;

  const supplierLines = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);
  drawInfoBox(doc, m, y, boxW, boxH, 'SUPPLIER', supplierLines, p);

  const deliveryLines = po.deliveryAddress ? [po.deliveryAddress] : ['Not specified'];
  drawInfoBox(doc, m + boxW + 6, y, boxW, boxH, 'DELIVER TO', deliveryLines, p);

  const detailLines = [`Status: ${fmtStatus(po.status)}`, `Date: ${fmtDate(po.createdAt)}`];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);
  drawInfoBox(doc, m + (boxW + 6) * 2, y, boxW, boxH, 'ORDER DETAILS', detailLines, p);

  y += boxH + 10;

  // Table
  const hasSupplierSku = items.some(i => i.supplierSku);
  const hasEan = items.some(i => i.ean);

  const cols: ColDef[] = [];
  let remainW = contentW;
  const qtyW = 34;
  const costW = 52;
  const totalW = 56;
  const skuW = 58;
  const supplierSkuW = hasSupplierSku ? 58 : 0;
  const eanW = hasEan ? 68 : 0;
  remainW -= (qtyW + costW + totalW + skuW + supplierSkuW + eanW);

  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supp. SKU', width: supplierSkuW, align: 'left' });
  cols.push({ label: 'Product', width: remainW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Line Total', width: totalW, align: 'right' });

  const rows = items.map(i => {
    const row: string[] = [];
    row.push(i.sku || '-');
    if (hasSupplierSku) row.push(i.supplierSku || '-');
    row.push(i.productName);
    if (hasEan) row.push(i.ean || '-');
    row.push(String(i.orderedQty));
    row.push(i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '-');
    row.push(i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '-');
    return row;
  });

  const tableEnd = drawTable(doc, y, rows, cols, p, m, true);

  // Total
  if (totalCost > 0) {
    const ty = tableEnd + 4;
    doc.save().strokeColor(p.border).moveTo(pageW - m - 120, ty).lineTo(pageW - m, ty).stroke().restore();
    doc.font('Bold').fontSize(9).fillColor(p.primary);
    doc.text('Total:', pageW - m - 120, ty + 6);
    doc.text(fmtMoney(totalCost), pageW - m - 120, ty + 6, { width: 114, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 24;
    doc.font('Italic').fontSize(7.5).fillColor(p.muted).text('Notes:', m, ny);
    doc.font('Regular').text(po.notes, m, ny + 10, { width: contentW });
  }

  drawFooter(doc, opts.companyName, p, m, contentW);
}

// ─── MINIMAL ───────────────────────────────────────────

function drawMinimal(
  doc: PDFKit.PDFDocument, po: PoData, items: PoItem[], totalCost: number,
  p: Palette, opts: PdfOptions, m: number, contentW: number, pageW: number, pageH: number
) {
  let y = 22;

  // Logo + company
  if (opts.logoBuffer) {
    try { doc.image(opts.logoBuffer, m, y, { height: 18 }); } catch {}
  }
  if (opts.companyName) {
    const nameX = opts.logoBuffer ? m + 24 : m;
    doc.font('Regular').fontSize(9).fillColor(p.muted).text(opts.companyName, nameX, y + 3);
  }

  y += 26;

  // Big PO number
  doc.font('Bold').fontSize(18).fillColor(p.primary).text(po.poNumber, m, y);
  y += 20;

  // Meta line
  const meta = [fmtDate(po.createdAt), fmtStatus(po.status)];
  if (po.expectedDate) meta.push(`Expected ${fmtDate(po.expectedDate)}`);
  doc.font('Regular').fontSize(8).fillColor(p.muted).text(meta.join('  \u00B7  '), m, y);
  y += 14;

  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 10;

  // Info: supplier + delivery side by side
  const halfW = (contentW - 10) / 2;

  // Supplier
  doc.font('Bold').fontSize(6.5).fillColor(p.muted).text('SUPPLIER', m, y);
  doc.font('Regular').fontSize(8.5).fillColor(p.primary).text(po.supplier.name, m, y + 9);
  let sy = y + 19;
  if (po.supplier.address) { doc.font('Regular').fontSize(7.5).fillColor(p.muted).text(po.supplier.address, m, sy); sy += 9; }
  if (po.supplier.email) { doc.text(po.supplier.email, m, sy); sy += 9; }
  if (po.supplier.phone) { doc.text(po.supplier.phone, m, sy); sy += 9; }

  // Delivery
  const dx = m + halfW + 10;
  doc.font('Bold').fontSize(6.5).fillColor(p.muted).text('DELIVER TO', dx, y);
  doc.font('Regular').fontSize(8.5).fillColor(p.primary).text(po.deliveryAddress || 'Not specified', dx, y + 9);

  y = Math.max(sy, y + 30) + 8;
  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, y).lineTo(pageW - m, y).stroke().restore();
  y += 8;

  // Table
  const hasSupplierSku = items.some(i => i.supplierSku);
  const hasEan = items.some(i => i.ean);

  const cols: ColDef[] = [];
  let remainW = contentW;
  const qtyW = 34;
  const costW = 50;
  const totalW = 54;
  const skuW = 55;
  const supplierSkuW = hasSupplierSku ? 55 : 0;
  const eanW = hasEan ? 68 : 0;
  remainW -= (qtyW + costW + totalW + skuW + supplierSkuW + eanW);

  cols.push({ label: 'Product', width: remainW, align: 'left' });
  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supp. SKU', width: supplierSkuW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalW, align: 'right' });

  const rows = items.map(i => {
    const row: string[] = [];
    row.push(i.productName);
    row.push(i.sku || '');
    if (hasSupplierSku) row.push(i.supplierSku || '');
    if (hasEan) row.push(i.ean || '');
    row.push(String(i.orderedQty));
    row.push(i.unitCost ? `$${parseFloat(i.unitCost).toFixed(2)}` : '');
    row.push(i.unitCost ? `$${(parseFloat(i.unitCost) * i.orderedQty).toFixed(2)}` : '');
    return row;
  });

  const tableEnd = drawTable(doc, y, rows, cols, p, m);

  // Total
  if (totalCost > 0) {
    doc.font('Bold').fontSize(9.5).fillColor(p.primary);
    doc.text(`Total  ${fmtMoney(totalCost)}`, m, tableEnd + 8, { width: contentW, align: 'right' });
  }

  // Notes
  if (po.notes) {
    const ny = tableEnd + 26;
    doc.font('Regular').fontSize(8).fillColor(p.muted).text(po.notes, m, ny, { width: contentW });
  }

  drawFooter(doc, opts.companyName, p, m, contentW);
}
