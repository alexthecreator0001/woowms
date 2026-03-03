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

// ─── Colors ───────────────────────────────────────────

const PALETTES = {
  modern: {
    primary: '#0f172a', accent: '#6366f1', muted: '#64748b',
    headerBg: '#0f172a', headerText: '#ffffff', altRow: '#f8fafc', border: '#e2e8f0',
    boxBg: '#f1f5f9',
  },
  classic: {
    primary: '#1f2937', accent: '#374151', muted: '#6b7280',
    headerBg: '#374151', headerText: '#ffffff', altRow: '#f9fafb', border: '#d1d5db',
    boxBg: '#f3f4f6',
  },
  minimal: {
    primary: '#171717', accent: '#404040', muted: '#737373',
    headerBg: '#f5f5f5', headerText: '#171717', altRow: '#fafafa', border: '#e5e5e5',
    boxBg: '#fafafa',
  },
} as const;

type Palette = typeof PALETTES.modern;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtMoney(v: number) {
  return `$${v.toFixed(2)}`;
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').toUpperCase();
}

// ─── Main ─────────────────────────────────────────────

export function generatePoPdf(po: PoData, opts: PdfOptions): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold', FONT_BOLD);
  doc.registerFont('Italic', FONT_ITALIC);

  const p = PALETTES[opts.template];
  const m = 50;
  const pageW = 595.28;
  const contentW = pageW - m * 2;

  const items = po.items || [];
  const totalCost = items.reduce((sum, it) => {
    if (!it.unitCost) return sum;
    return sum + parseFloat(it.unitCost) * it.orderedQty;
  }, 0);

  // ─── Header ──────────────────────────────────────

  if (opts.template === 'modern') {
    // Accent bar across top
    doc.save().rect(0, 0, pageW, 6).fill(p.accent).restore();
  }

  let y = opts.template === 'modern' ? 24 : 30;

  // Logo + Company name (left)
  if (opts.logoBuffer) {
    try {
      doc.image(opts.logoBuffer, m, y, { height: 36 });
    } catch { /* skip broken logo */ }
  }

  const companyX = opts.logoBuffer ? m + 44 : m;
  if (opts.companyName) {
    doc.font('Bold').fontSize(14).fillColor(p.primary);
    doc.text(opts.companyName, companyX, y + 4);
  }

  // PO title (right)
  doc.font('Bold').fontSize(24).fillColor(p.accent);
  doc.text('PURCHASE ORDER', m, y, { width: contentW, align: 'right' });

  y += 30;
  doc.font('Regular').fontSize(11).fillColor(p.muted);
  doc.text(po.poNumber, m, y, { width: contentW, align: 'right' });

  y += 20;

  // Divider
  doc.save().strokeColor(p.border).lineWidth(0.5).moveTo(m, y).lineTo(m + contentW, y).stroke().restore();
  y += 16;

  // ─── Info boxes ──────────────────────────────────

  const boxPad = 10;
  const gap = 10;
  const boxW = (contentW - gap * 2) / 3;

  // Supplier box
  const supplierLines: string[] = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);

  // Delivery box
  const deliveryLines: string[] = po.deliveryAddress ? [po.deliveryAddress] : ['Not specified'];

  // Details box
  const detailLines: string[] = [
    `Status: ${fmtStatus(po.status)}`,
    `Date: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);

  // Calculate box heights — all same height based on tallest
  const lineH = 13;
  const boxHeaderH = 18;
  const boxContentH = Math.max(supplierLines.length, deliveryLines.length, detailLines.length) * lineH;
  const boxH = boxHeaderH + boxContentH + boxPad * 2;

  // Draw the 3 boxes
  const boxes = [
    { x: m, title: 'SUPPLIER', lines: supplierLines },
    { x: m + boxW + gap, title: 'DELIVER TO', lines: deliveryLines },
    { x: m + (boxW + gap) * 2, title: 'ORDER DETAILS', lines: detailLines },
  ];

  for (const box of boxes) {
    // Background
    doc.save().rect(box.x, y, boxW, boxH).fill(p.boxBg).restore();
    // Border
    doc.save().strokeColor(p.border).lineWidth(0.5).rect(box.x, y, boxW, boxH).stroke().restore();
    // Title
    doc.font('Bold').fontSize(8).fillColor(p.muted);
    doc.text(box.title, box.x + boxPad, y + boxPad);
    // Lines
    doc.font('Regular').fontSize(10).fillColor(p.primary);
    let ly = y + boxPad + boxHeaderH;
    for (const line of box.lines) {
      doc.text(line, box.x + boxPad, ly, { width: boxW - boxPad * 2 });
      ly += lineH;
    }
  }

  y += boxH + 18;

  // ─── Items table ─────────────────────────────────

  const hasSupplierSku = items.some(i => i.supplierSku);
  const hasEan = items.some(i => i.ean);

  // Build columns dynamically
  interface Col { label: string; width: number; align: 'left' | 'center' | 'right'; }
  const cols: Col[] = [];

  const qtyW = 40;
  const costW = 60;
  const totalW = 65;
  const skuW = 68;
  const supSkuW = hasSupplierSku ? 68 : 0;
  const eanW = hasEan ? 80 : 0;
  const productW = contentW - skuW - supSkuW - eanW - qtyW - costW - totalW;

  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supplier SKU', width: supSkuW, align: 'left' });
  cols.push({ label: 'Product', width: productW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalW, align: 'right' });

  const headerH = 28;
  const rowH = 26;
  const tableFontSize = 9;
  const headerFontSize = 8.5;
  const pad = 6;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Header row
  doc.save().rect(m, y, tableW, headerH).fill(p.headerBg).restore();
  let x = m;
  doc.font('Bold').fontSize(headerFontSize).fillColor(p.headerText);
  for (const col of cols) {
    if (col.align === 'center') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width, align: 'center' });
    } else if (col.align === 'right') {
      doc.text(col.label, x, y + (headerH - headerFontSize) / 2, { width: col.width - pad, align: 'right' });
    } else {
      doc.text(col.label, x + pad, y + (headerH - headerFontSize) / 2);
    }
    x += col.width;
  }
  y += headerH;

  // Data rows
  for (let r = 0; r < items.length; r++) {
    const it = items[r];

    // Check if we need a new page
    if (y + rowH > 780) {
      doc.addPage();
      y = 50;
    }

    // Alternating row bg
    if (r % 2 === 1) {
      doc.save().rect(m, y, tableW, rowH).fill(p.altRow).restore();
    }

    // Bottom border
    doc.save().strokeColor(p.border).lineWidth(0.3)
      .moveTo(m, y + rowH).lineTo(m + tableW, y + rowH).stroke().restore();

    // Cell values
    const cells: string[] = [];
    cells.push(it.sku || '-');
    if (hasSupplierSku) cells.push(it.supplierSku || '-');
    cells.push(it.productName);
    if (hasEan) cells.push(it.ean || '-');
    cells.push(String(it.orderedQty));
    cells.push(it.unitCost ? `$${parseFloat(it.unitCost).toFixed(2)}` : '-');
    cells.push(it.unitCost ? `$${(parseFloat(it.unitCost) * it.orderedQty).toFixed(2)}` : '-');

    x = m;
    doc.font('Regular').fontSize(tableFontSize).fillColor(p.primary);
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const val = cells[c] || '';
      const textY = y + (rowH - tableFontSize) / 2;
      if (col.align === 'center') {
        doc.text(val, x, textY, { width: col.width, align: 'center' });
      } else if (col.align === 'right') {
        doc.text(val, x, textY, { width: col.width - pad, align: 'right' });
      } else {
        doc.text(val, x + pad, textY, { width: col.width - pad * 2, ellipsis: true });
      }
      x += col.width;
    }
    y += rowH;
  }

  // ─── Total ───────────────────────────────────────

  y += 8;
  if (totalCost > 0) {
    const totalBoxW = 160;
    const totalBoxH = 30;
    const tx = m + contentW - totalBoxW;
    doc.save().rect(tx, y, totalBoxW, totalBoxH).fill(p.boxBg).restore();
    doc.save().strokeColor(p.border).lineWidth(0.5).rect(tx, y, totalBoxW, totalBoxH).stroke().restore();
    doc.font('Bold').fontSize(12).fillColor(p.primary);
    doc.text('TOTAL', tx + 12, y + 8);
    doc.text(fmtMoney(totalCost), tx + 12, y + 8, { width: totalBoxW - 24, align: 'right' });
    y += totalBoxH + 12;
  }

  // ─── Notes ───────────────────────────────────────

  if (po.notes) {
    if (y + 50 > 780) { doc.addPage(); y = 50; }
    doc.font('Bold').fontSize(9).fillColor(p.muted).text('NOTES', m, y);
    y += 14;
    doc.font('Regular').fontSize(10).fillColor(p.primary).text(po.notes, m, y, { width: contentW });
    y += doc.heightOfString(po.notes, { width: contentW, fontSize: 10 }) + 8;
  }

  // ─── Footer ──────────────────────────────────────

  // Always at bottom of last page
  const footerY = 810;
  doc.save().strokeColor(p.border).lineWidth(0.3).moveTo(m, footerY).lineTo(m + contentW, footerY).stroke().restore();
  doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
  doc.text(opts.companyName || '', m, footerY + 5);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, m, footerY + 5, { width: contentW, align: 'right' });

  doc.end();
  return doc;
}
