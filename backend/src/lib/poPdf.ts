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

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function fmtMoney(v: number): string {
  return `$${v.toFixed(2)}`;
}

function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ').toUpperCase();
}

/** Mix a hex color toward white by `amount` (0 = original, 1 = white). */
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

// ─── Layout constants ─────────────────────────────────

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 50; // footer at 50pt from bottom
const MAX_CONTENT_Y = FOOTER_Y - 20; // stop content 20pt above footer

/**
 * Truncate text to fit within maxWidth at current font/size.
 * Appends "…" if truncated.
 */
function truncateText(doc: PDFKit.PDFDocument, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.widthOfString(text) <= maxWidth) return text;
  const ellipsis = '…';
  const ellipsisW = doc.widthOfString(ellipsis);
  let truncated = text;
  while (truncated.length > 0 && doc.widthOfString(truncated) + ellipsisW > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

// ─── Main ─────────────────────────────────────────────

export async function generatePoPdf(po: PoData, opts: PdfOptions): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: 60, left: MARGIN, right: MARGIN },
    autoFirstPage: false, // we manage pages ourselves
  });

  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold', FONT_BOLD);
  doc.registerFont('Italic', FONT_ITALIC);

  const accent = opts.brandColor || '#6366f1';
  const accentLight = lighten(accent, 0.92);
  const accentMid = lighten(accent, 0.8);
  const accentBorder = lighten(accent, 0.7);

  const items = po.items || [];
  const totalCost = items.reduce((sum, it) => {
    if (!it.unitCost) return sum;
    return sum + parseFloat(it.unitCost) * it.orderedQty;
  }, 0);

  // Pre-generate barcode
  let barcodeBuffer: Buffer | null = null;
  try {
    barcodeBuffer = await generateBarcode(po.poNumber);
  } catch {
    /* skip if barcode generation fails */
  }

  // Footer info (precomputed)
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let currentPage = 0;

  /** Add a new page and draw footer placeholder area + accent bar */
  function addNewPage(): void {
    doc.addPage();
    currentPage++;
    // Top accent bar
    doc.save().rect(0, 0, PAGE_W, 4).fill(accent).restore();
  }

  /** Draw footer on the current page. Temporarily removes bottom margin to prevent auto-pagination. */
  function drawFooter(pageNum: number, totalPages: number): void {
    // CRITICAL: Remove bottom margin so text at FOOTER_Y doesn't trigger auto-page-creation
    const savedBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // Thin line above footer
    doc.save()
      .strokeColor('#dddddd')
      .lineWidth(0.3)
      .moveTo(MARGIN, FOOTER_Y - 8)
      .lineTo(MARGIN + CONTENT_W, FOOTER_Y - 8)
      .stroke()
      .restore();

    doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');

    // Company name (left)
    doc.text(opts.companyName || '', MARGIN, FOOTER_Y, { lineBreak: false });

    // Page number (right)
    const pageLabel = `Page ${pageNum} of ${totalPages}`;
    const pageLabelW = doc.widthOfString(pageLabel);
    doc.text(pageLabel, MARGIN + CONTENT_W - pageLabelW, FOOTER_Y, { lineBreak: false });

    // Generated date (center)
    const dateStr = `Generated ${generatedDate}`;
    const dateW = doc.widthOfString(dateStr);
    doc.text(dateStr, MARGIN + (CONTENT_W - dateW) / 2, FOOTER_Y, { lineBreak: false });

    // Restore margin
    doc.page.margins.bottom = savedBottomMargin;
  }

  /** Check if we need a page break. If y + needed > MAX_CONTENT_Y, add new page. Returns y. */
  function checkPageBreak(y: number, neededHeight: number): number {
    if (y + neededHeight > MAX_CONTENT_Y) {
      addNewPage();
      return 50;
    }
    return y;
  }

  // ═══════════════════════════════════════════════════
  // START FIRST PAGE
  // ═══════════════════════════════════════════════════

  addNewPage();

  let y = 20;

  // Logo (left side)
  let logoEndX = MARGIN;
  if (opts.logoBuffer) {
    try {
      doc.image(opts.logoBuffer, MARGIN, y, { height: 42 });
      logoEndX = MARGIN + 50;
    } catch {
      /* skip broken logo */
    }
  }

  // Company name beside/below logo
  if (opts.companyName) {
    doc.font('Bold').fontSize(15).fillColor('#1a1a1a');
    doc.text(opts.companyName, logoEndX, y + 6, { lineBreak: false });
  }

  // "PURCHASE ORDER" title - right aligned
  doc.font('Bold').fontSize(24).fillColor(accent);
  const titleStr = 'PURCHASE ORDER';
  const titleW = doc.widthOfString(titleStr);
  doc.text(titleStr, MARGIN + CONTENT_W - titleW, y, { lineBreak: false });

  // PO number - right aligned
  y += 30;
  doc.font('Regular').fontSize(13).fillColor('#555555');
  const poNumW = doc.widthOfString(po.poNumber);
  doc.text(po.poNumber, MARGIN + CONTENT_W - poNumW, y, { lineBreak: false });

  // Barcode under PO number
  if (barcodeBuffer) {
    y += 18;
    try {
      doc.image(barcodeBuffer, PAGE_W - MARGIN - 130, y, { width: 130, height: 28 });
    } catch {
      /* skip if image fails */
    }
    y += 32;
  } else {
    y += 18;
  }

  // Divider line
  doc.save()
    .strokeColor(accent)
    .lineWidth(1)
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_W, y)
    .stroke()
    .restore();
  y += 14;

  // ═══════════════════════════════════════════════════
  // INFO BOXES (3 side-by-side)
  // ═══════════════════════════════════════════════════

  const boxGap = 10;
  const boxW = (CONTENT_W - boxGap * 2) / 3;
  const boxPad = 10;
  const boxLineH = 14;
  const boxLabelH = 16;

  const supplierLines = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);

  const deliveryLines = po.deliveryAddress
    ? po.deliveryAddress.split(', ')
    : ['Not specified'];

  const detailLines = [
    `Status: ${fmtStatus(po.status)}`,
    `Date: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);

  const maxLines = Math.max(supplierLines.length, deliveryLines.length, detailLines.length);
  const boxH = boxPad + boxLabelH + maxLines * boxLineH + boxPad;

  const boxDefs = [
    { x: MARGIN, title: 'SUPPLIER', lines: supplierLines },
    { x: MARGIN + boxW + boxGap, title: 'DELIVER TO', lines: deliveryLines },
    { x: MARGIN + (boxW + boxGap) * 2, title: 'ORDER DETAILS', lines: detailLines },
  ];

  for (const box of boxDefs) {
    doc.save().rect(box.x, y, boxW, boxH).fill(accentLight).restore();
    doc.save().rect(box.x, y, 3, boxH).fill(accentMid).restore();

    doc.font('Bold').fontSize(8.5).fillColor(accent);
    doc.text(box.title, box.x + boxPad + 4, y + boxPad, { lineBreak: false });

    let ly = y + boxPad + boxLabelH;
    const maxTextW = boxW - boxPad * 2 - 4;
    for (let i = 0; i < box.lines.length; i++) {
      if (i === 0) {
        doc.font('Bold').fontSize(10.5).fillColor('#1a1a1a');
      } else {
        doc.font('Regular').fontSize(9.5).fillColor('#555555');
      }
      const line = truncateText(doc, box.lines[i], maxTextW);
      doc.text(line, box.x + boxPad + 4, ly, { lineBreak: false });
      ly += boxLineH;
    }
  }

  y += boxH + 16;

  // ═══════════════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════════════

  const hasSupplierSku = items.some((i) => i.supplierSku);
  const hasEan = items.some((i) => i.ean);

  interface Col {
    label: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  const qtyW = 40;
  const costW = 65;
  const totalColW = 70;
  const skuW = 70;
  const supSkuW = hasSupplierSku ? 70 : 0;
  const eanW = hasEan ? 85 : 0;
  const productW = CONTENT_W - skuW - supSkuW - eanW - qtyW - costW - totalColW;

  const cols: Col[] = [];
  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Sup. SKU', width: supSkuW, align: 'left' });
  cols.push({ label: 'Product', width: productW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalColW, align: 'right' });

  const headerH = 26;
  const rowH = 24;
  const tableFontSize = 9;
  const headerFontSize = 8.5;
  const cellPad = 6;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  function drawTableHeader(atY: number): void {
    doc.save().rect(MARGIN, atY, tableW, headerH).fill(accent).restore();
    let hx = MARGIN;
    doc.font('Bold').fontSize(headerFontSize).fillColor('#ffffff');
    for (const col of cols) {
      const textY = atY + (headerH - headerFontSize) / 2;
      const maxW = col.width - cellPad * 2;
      const label = truncateText(doc, col.label, maxW);
      if (col.align === 'center') {
        const lw = doc.widthOfString(label);
        doc.text(label, hx + (col.width - lw) / 2, textY, { lineBreak: false });
      } else if (col.align === 'right') {
        const lw = doc.widthOfString(label);
        doc.text(label, hx + col.width - cellPad - lw, textY, { lineBreak: false });
      } else {
        doc.text(label, hx + cellPad, textY, { lineBreak: false });
      }
      hx += col.width;
    }
  }

  // Draw initial table header
  y = checkPageBreak(y, headerH + rowH);
  drawTableHeader(y);
  y += headerH;

  // Table rows
  for (let r = 0; r < items.length; r++) {
    if (y + rowH > MAX_CONTENT_Y) {
      addNewPage();
      y = 50;
      drawTableHeader(y);
      y += headerH;
    }

    const it = items[r];

    // Alternating row background
    if (r % 2 === 0) {
      doc.save().rect(MARGIN, y, tableW, rowH).fill(accentLight).restore();
    }

    // Bottom border
    doc.save()
      .strokeColor(accentBorder)
      .lineWidth(0.3)
      .moveTo(MARGIN, y + rowH)
      .lineTo(MARGIN + tableW, y + rowH)
      .stroke()
      .restore();

    // Build cell values matching column order
    const cells: string[] = [];
    cells.push(it.sku || '-');
    if (hasSupplierSku) cells.push(it.supplierSku || '-');
    cells.push(it.productName);
    if (hasEan) cells.push(it.ean || '-');
    cells.push(String(it.orderedQty));
    cells.push(it.unitCost ? `$${parseFloat(it.unitCost).toFixed(2)}` : '-');
    cells.push(
      it.unitCost
        ? `$${(parseFloat(it.unitCost) * it.orderedQty).toFixed(2)}`
        : '-',
    );

    let rx = MARGIN;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const val = cells[c] || '';
      const textY = y + (rowH - tableFontSize) / 2;
      const maxW = col.width - cellPad * 2;

      const isProductCol = col.label === 'Product';
      doc
        .font(isProductCol ? 'Bold' : 'Regular')
        .fontSize(tableFontSize)
        .fillColor('#1a1a1a');

      // Truncate text to fit column — NO width param to doc.text()
      const truncated = truncateText(doc, val, maxW);

      if (col.align === 'center') {
        const tw = doc.widthOfString(truncated);
        doc.text(truncated, rx + (col.width - tw) / 2, textY, { lineBreak: false });
      } else if (col.align === 'right') {
        const tw = doc.widthOfString(truncated);
        doc.text(truncated, rx + col.width - cellPad - tw, textY, { lineBreak: false });
      } else {
        doc.text(truncated, rx + cellPad, textY, { lineBreak: false });
      }
      rx += col.width;
    }

    y += rowH;
  }

  // ═══════════════════════════════════════════════════
  // TOTAL BOX
  // ═══════════════════════════════════════════════════

  y += 10;
  if (totalCost > 0) {
    y = checkPageBreak(y, 36);
    const totalBoxW = 170;
    const totalBoxH = 34;
    const tx = MARGIN + CONTENT_W - totalBoxW;
    doc.save().rect(tx, y, totalBoxW, totalBoxH).fill(accent).restore();
    doc.font('Bold').fontSize(13).fillColor('#ffffff');
    doc.text('TOTAL', tx + 14, y + 9, { lineBreak: false });
    const totalStr = fmtMoney(totalCost);
    const totalStrW = doc.widthOfString(totalStr);
    doc.text(totalStr, tx + totalBoxW - 14 - totalStrW, y + 9, { lineBreak: false });
    y += totalBoxH + 16;
  }

  // ═══════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════

  if (po.notes) {
    y = checkPageBreak(y, 60);
    doc.font('Bold').fontSize(9.5).fillColor(accent);
    doc.text('NOTES', MARGIN, y, { lineBreak: false });
    y += 14;
    doc.font('Regular').fontSize(10).fillColor('#333333');
    // Notes is the ONE place we allow lineBreak for proper wrapping
    const notesH = doc.heightOfString(po.notes, { width: CONTENT_W });
    doc.text(po.notes, MARGIN, y, { width: CONTENT_W });
    y += notesH + 16;
  }

  // ═══════════════════════════════════════════════════
  // SIGNATURE LINES
  // ═══════════════════════════════════════════════════

  y = checkPageBreak(y, 80);

  const sigW = (CONTENT_W - 40) / 2;

  // Authorized Signature
  doc.save()
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .moveTo(MARGIN, y + 40)
    .lineTo(MARGIN + sigW, y + 40)
    .stroke()
    .restore();
  doc.font('Regular').fontSize(9).fillColor('#888888');
  doc.text('Authorized Signature', MARGIN, y + 44, { lineBreak: false });
  doc.text('Date: _______________', MARGIN, y + 56, { lineBreak: false });

  // Received By
  const sigRightX = MARGIN + sigW + 40;
  doc.save()
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .moveTo(sigRightX, y + 40)
    .lineTo(MARGIN + CONTENT_W, y + 40)
    .stroke()
    .restore();
  doc.font('Regular').fontSize(9).fillColor('#888888');
  doc.text('Received By (Supplier)', sigRightX, y + 44, { lineBreak: false });
  doc.text('Date: _______________', sigRightX, y + 56, { lineBreak: false });

  // ═══════════════════════════════════════════════════
  // FOOTERS — draw on every page AFTER all content
  // ═══════════════════════════════════════════════════

  // We know exactly how many content pages we created.
  // Draw footer on each page by switching to it.
  // CRITICAL: After drawing footers, we must NOT let PDFKit
  // auto-create any new pages. We use manual x,y positioning
  // without width constraints, so cursor movement is minimal.

  const totalPages = currentPage;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawFooter(i + 1, totalPages);
  }

  // CRITICAL FIX: After switchToPage + text calls, PDFKit may have
  // auto-added blank pages. We need to flush the doc without those.
  // The simplest fix: switch back to the last content page so any
  // accidental cursor advancement stays on that page.
  doc.switchToPage(totalPages - 1);

  doc.end();
  return doc;
}
