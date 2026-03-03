import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
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
  brandColor: string;
}

// ─── Helpers ──────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtMoney(v: number) {
  return `$${v.toFixed(2)}`;
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').toUpperCase();
}

// Lighten a hex color (mix with white)
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

async function generateBarcode(text: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 10,
    includetext: false,
  });
}

// ─── Main ─────────────────────────────────────────────

export async function generatePoPdf(po: PoData, opts: PdfOptions): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({ size: 'A4', margin: 45 });

  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold', FONT_BOLD);
  doc.registerFont('Italic', FONT_ITALIC);

  const m = 45;        // margin
  const pageW = 595.28; // A4 width
  const contentW = pageW - m * 2;
  const accent = opts.brandColor || '#6366f1';
  const accentLight = lighten(accent, 0.92);
  const accentMid = lighten(accent, 0.8);

  const items = po.items || [];
  const totalCost = items.reduce((sum, it) => {
    if (!it.unitCost) return sum;
    return sum + parseFloat(it.unitCost) * it.orderedQty;
  }, 0);

  // Generate barcode for PO number
  let barcodeBuffer: Buffer | null = null;
  try {
    barcodeBuffer = await generateBarcode(po.poNumber);
  } catch { /* skip if barcode fails */ }

  // ═══════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════

  // Top accent bar
  doc.save().rect(0, 0, pageW, 5).fill(accent).restore();

  let y = 22;

  // Logo (left side)
  let logoEndX = m;
  if (opts.logoBuffer) {
    try {
      doc.image(opts.logoBuffer, m, y, { height: 42 });
      logoEndX = m + 50;
    } catch { /* skip broken logo */ }
  }

  // Company name below/beside logo
  if (opts.companyName) {
    doc.font('Bold').fontSize(15).fillColor('#1a1a1a');
    doc.text(opts.companyName, logoEndX, y + 6);
  }

  // PURCHASE ORDER title — right aligned
  doc.font('Bold').fontSize(26).fillColor(accent);
  doc.text('PURCHASE ORDER', m, y, { width: contentW, align: 'right' });

  // PO number + barcode
  y += 32;
  doc.font('Regular').fontSize(12).fillColor('#555555');
  doc.text(po.poNumber, m, y, { width: contentW, align: 'right' });

  // Barcode below PO number
  if (barcodeBuffer) {
    y += 16;
    try {
      doc.image(barcodeBuffer, pageW - m - 130, y, { width: 130, height: 28 });
    } catch {}
    y += 32;
  } else {
    y += 18;
  }

  // Divider
  doc.save().strokeColor(accent).lineWidth(1).moveTo(m, y).lineTo(m + contentW, y).stroke().restore();
  y += 14;

  // ═══════════════════════════════════════════════════
  // INFO BOXES
  // ═══════════════════════════════════════════════════

  const gap = 10;
  const boxW = (contentW - gap * 2) / 3;
  const boxPad = 10;

  // Collect lines for each box
  const supplierLines = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);

  const deliveryLines = po.deliveryAddress ? po.deliveryAddress.split(', ') : ['Not specified'];

  const detailLines = [
    `Status: ${fmtStatus(po.status)}`,
    `Date: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);

  // Box height: tallest content
  const lineH = 14;
  const labelH = 16;
  const maxLines = Math.max(supplierLines.length, deliveryLines.length, detailLines.length);
  const boxH = boxPad + labelH + maxLines * lineH + boxPad;

  const boxDefs = [
    { x: m, title: 'SUPPLIER', lines: supplierLines },
    { x: m + boxW + gap, title: 'DELIVER TO', lines: deliveryLines },
    { x: m + (boxW + gap) * 2, title: 'ORDER DETAILS', lines: detailLines },
  ];

  for (const box of boxDefs) {
    // Accent-tinted background
    doc.save().rect(box.x, y, boxW, boxH).fill(accentLight).restore();
    // Left accent stripe
    doc.save().rect(box.x, y, 3, boxH).fill(accentMid).restore();

    // Title
    doc.font('Bold').fontSize(8.5).fillColor(accent);
    doc.text(box.title, box.x + boxPad + 4, y + boxPad);

    // Content lines
    doc.font('Regular').fontSize(10.5).fillColor('#1a1a1a');
    let ly = y + boxPad + labelH;
    for (let i = 0; i < box.lines.length; i++) {
      if (i === 0) {
        doc.font('Bold').fontSize(10.5).fillColor('#1a1a1a');
      } else {
        doc.font('Regular').fontSize(9.5).fillColor('#555555');
      }
      doc.text(box.lines[i], box.x + boxPad + 4, ly, { width: boxW - boxPad * 2 - 4 });
      ly += lineH;
    }
  }

  y += boxH + 16;

  // ═══════════════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════════════

  const hasSupplierSku = items.some(i => i.supplierSku);
  const hasEan = items.some(i => i.ean);

  // Column definitions
  interface Col { label: string; width: number; align: 'left' | 'center' | 'right'; }
  const cols: Col[] = [];

  const qtyW = 38;
  const costW = 60;
  const totalW = 65;
  const skuW = hasSupplierSku ? 60 : 72;
  const supSkuW = hasSupplierSku ? 60 : 0;
  const eanW = hasEan ? 78 : 0;
  const productW = contentW - skuW - supSkuW - eanW - qtyW - costW - totalW;

  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supplier SKU', width: supSkuW, align: 'left' });
  cols.push({ label: 'Product', width: productW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalW, align: 'right' });

  const headerH = 30;
  const rowH = 28;
  const tableFontSize = 9.5;
  const headerFontSize = 9;
  const pad = 7;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Table header
  doc.save().rect(m, y, tableW, headerH).fill(accent).restore();
  let x = m;
  doc.font('Bold').fontSize(headerFontSize).fillColor('#ffffff');
  for (const col of cols) {
    const textY = y + (headerH - headerFontSize) / 2;
    if (col.align === 'center') {
      doc.text(col.label, x, textY, { width: col.width, align: 'center' });
    } else if (col.align === 'right') {
      doc.text(col.label, x, textY, { width: col.width - pad, align: 'right' });
    } else {
      doc.text(col.label, x + pad, textY);
    }
    x += col.width;
  }
  y += headerH;

  // Table rows
  for (let r = 0; r < items.length; r++) {
    // Page break check
    if (y + rowH > 760) {
      doc.addPage();
      y = 45;
    }

    const it = items[r];

    // Alternating rows
    if (r % 2 === 0) {
      doc.save().rect(m, y, tableW, rowH).fill(accentLight).restore();
    }

    // Bottom border
    doc.save().strokeColor(lighten(accent, 0.7)).lineWidth(0.3)
      .moveTo(m, y + rowH).lineTo(m + tableW, y + rowH).stroke().restore();

    // Build cell values matching column order
    const cells: string[] = [];
    cells.push(it.sku || '-');
    if (hasSupplierSku) cells.push(it.supplierSku || '-');
    cells.push(it.productName);
    if (hasEan) cells.push(it.ean || '-');
    cells.push(String(it.orderedQty));
    cells.push(it.unitCost ? `$${parseFloat(it.unitCost).toFixed(2)}` : '-');
    cells.push(it.unitCost ? `$${(parseFloat(it.unitCost) * it.orderedQty).toFixed(2)}` : '-');

    x = m;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const val = cells[c] || '';
      const textY = y + (rowH - tableFontSize) / 2;

      // Bold for product name, regular for rest
      const isProductCol = col.label === 'Product';
      doc.font(isProductCol ? 'Bold' : 'Regular').fontSize(tableFontSize).fillColor('#1a1a1a');

      if (col.align === 'center') {
        doc.text(val, x, textY, { width: col.width, align: 'center', lineBreak: false });
      } else if (col.align === 'right') {
        doc.text(val, x, textY, { width: col.width - pad, align: 'right', lineBreak: false });
      } else {
        doc.text(val, x + pad, textY, { width: col.width - pad * 2, lineBreak: false, ellipsis: true });
      }
      x += col.width;
    }
    y += rowH;
  }

  // ═══════════════════════════════════════════════════
  // TOTAL
  // ═══════════════════════════════════════════════════

  y += 10;
  if (totalCost > 0) {
    const totalBoxW = 170;
    const totalBoxH = 34;
    const tx = m + contentW - totalBoxW;
    doc.save().rect(tx, y, totalBoxW, totalBoxH).fill(accent).restore();
    doc.font('Bold').fontSize(13).fillColor('#ffffff');
    doc.text('TOTAL', tx + 14, y + 9);
    doc.text(fmtMoney(totalCost), tx + 14, y + 9, { width: totalBoxW - 28, align: 'right' });
    y += totalBoxH + 16;
  }

  // ═══════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════

  if (po.notes) {
    if (y + 60 > 760) { doc.addPage(); y = 45; }
    doc.font('Bold').fontSize(9.5).fillColor(accent).text('NOTES', m, y);
    y += 14;
    doc.font('Regular').fontSize(10).fillColor('#333333');
    doc.text(po.notes, m, y, { width: contentW });
    y += doc.heightOfString(po.notes, { width: contentW, fontSize: 10 }) + 16;
  }

  // ═══════════════════════════════════════════════════
  // SIGNATURE
  // ═══════════════════════════════════════════════════

  if (y + 80 > 760) { doc.addPage(); y = 45; }

  const sigW = (contentW - 40) / 2;

  // Authorized by
  doc.save().strokeColor('#cccccc').lineWidth(0.5)
    .moveTo(m, y + 40).lineTo(m + sigW, y + 40).stroke().restore();
  doc.font('Regular').fontSize(9).fillColor('#888888');
  doc.text('Authorized Signature', m, y + 44);
  doc.text('Date: _______________', m, y + 56);

  // Received by
  doc.save().strokeColor('#cccccc').lineWidth(0.5)
    .moveTo(m + sigW + 40, y + 40).lineTo(m + contentW, y + 40).stroke().restore();
  doc.font('Regular').fontSize(9).fillColor('#888888');
  doc.text('Received By (Supplier)', m + sigW + 40, y + 44);
  doc.text('Date: _______________', m + sigW + 40, y + 56);

  // ═══════════════════════════════════════════════════
  // FOOTER — at bottom of current page
  // ═══════════════════════════════════════════════════

  const footerY = 815;
  doc.save().strokeColor('#dddddd').lineWidth(0.3)
    .moveTo(m, footerY - 6).lineTo(m + contentW, footerY - 6).stroke().restore();
  doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
  doc.text(opts.companyName || '', m, footerY);
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    m, footerY, { width: contentW, align: 'right' }
  );

  doc.end();
  return doc;
}
