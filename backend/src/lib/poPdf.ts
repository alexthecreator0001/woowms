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
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 790; // y position for footer content
const MAX_CONTENT_Y = 720; // when y exceeds this, add a new page

// ─── Main ─────────────────────────────────────────────

export async function generatePoPdf(po: PoData, opts: PdfOptions): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true, // CRITICAL: buffer pages so we can add footers after all content
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

  // Helper: check if we need a page break and add one if so.
  // Returns the current y (reset to top if new page was added).
  function checkPageBreak(y: number, neededHeight: number): number {
    if (y + neededHeight > MAX_CONTENT_Y) {
      doc.addPage();
      // Accent bar on new pages
      doc.save().rect(0, 0, PAGE_W, 4).fill(accent).restore();
      return 50;
    }
    return y;
  }

  // ═══════════════════════════════════════════════════
  // PAGE 1 HEADER
  // ═══════════════════════════════════════════════════

  // Top accent bar (4pt)
  doc.save().rect(0, 0, PAGE_W, 4).fill(accent).restore();

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
  doc.text('PURCHASE ORDER', MARGIN, y, {
    width: CONTENT_W,
    align: 'right',
    lineBreak: false,
  });

  // PO number - right aligned
  y += 30;
  doc.font('Regular').fontSize(13).fillColor('#555555');
  doc.text(po.poNumber, MARGIN, y, {
    width: CONTENT_W,
    align: 'right',
    lineBreak: false,
  });

  // Barcode under PO number
  if (barcodeBuffer) {
    y += 18;
    try {
      doc.image(barcodeBuffer, PAGE_W - MARGIN - 130, y, {
        width: 130,
        height: 28,
      });
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

  // Build content for each box
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

  // Uniform box height based on tallest content
  const maxLines = Math.max(
    supplierLines.length,
    deliveryLines.length,
    detailLines.length,
  );
  const boxH = boxPad + boxLabelH + maxLines * boxLineH + boxPad;

  const boxDefs = [
    { x: MARGIN, title: 'SUPPLIER', lines: supplierLines },
    { x: MARGIN + boxW + boxGap, title: 'DELIVER TO', lines: deliveryLines },
    { x: MARGIN + (boxW + boxGap) * 2, title: 'ORDER DETAILS', lines: detailLines },
  ];

  for (const box of boxDefs) {
    // Tinted background
    doc.save().rect(box.x, y, boxW, boxH).fill(accentLight).restore();
    // Left accent stripe
    doc.save().rect(box.x, y, 3, boxH).fill(accentMid).restore();

    // Title
    doc.font('Bold').fontSize(8.5).fillColor(accent);
    doc.text(box.title, box.x + boxPad + 4, y + boxPad, {
      lineBreak: false,
    });

    // Content lines
    let ly = y + boxPad + boxLabelH;
    for (let i = 0; i < box.lines.length; i++) {
      if (i === 0) {
        doc.font('Bold').fontSize(10.5).fillColor('#1a1a1a');
      } else {
        doc.font('Regular').fontSize(9.5).fillColor('#555555');
      }
      doc.text(box.lines[i], box.x + boxPad + 4, ly, {
        width: boxW - boxPad * 2 - 4,
        lineBreak: false,
      });
      ly += boxLineH;
    }
  }

  y += boxH + 16;

  // ═══════════════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════════════

  const hasSupplierSku = items.some((i) => i.supplierSku);
  const hasEan = items.some((i) => i.ean);

  // Column layout
  interface Col {
    label: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  const qtyW = 38;
  const costW = 60;
  const totalColW = 65;
  const skuW = hasSupplierSku ? 60 : 72;
  const supSkuW = hasSupplierSku ? 60 : 0;
  const eanW = hasEan ? 78 : 0;
  const productW = CONTENT_W - skuW - supSkuW - eanW - qtyW - costW - totalColW;

  const cols: Col[] = [];
  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Supplier SKU', width: supSkuW, align: 'left' });
  cols.push({ label: 'Product', width: productW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalColW, align: 'right' });

  const headerH = 28;
  const rowH = 26;
  const tableFontSize = 9.5;
  const headerFontSize = 9;
  const cellPad = 7;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Function to draw table header row
  function drawTableHeader(atY: number): void {
    doc.save().rect(MARGIN, atY, tableW, headerH).fill(accent).restore();
    let hx = MARGIN;
    doc.font('Bold').fontSize(headerFontSize).fillColor('#ffffff');
    for (const col of cols) {
      const textY = atY + (headerH - headerFontSize) / 2;
      if (col.align === 'center') {
        doc.text(col.label, hx, textY, {
          width: col.width,
          align: 'center',
          lineBreak: false,
        });
      } else if (col.align === 'right') {
        doc.text(col.label, hx, textY, {
          width: col.width - cellPad,
          align: 'right',
          lineBreak: false,
        });
      } else {
        doc.text(col.label, hx + cellPad, textY, {
          width: col.width - cellPad * 2,
          lineBreak: false,
        });
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
    // Page break: if this row won't fit, start a new page with header
    if (y + rowH > MAX_CONTENT_Y) {
      doc.addPage();
      doc.save().rect(0, 0, PAGE_W, 4).fill(accent).restore();
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

      // Bold for product name column, regular for everything else
      const isProductCol = col.label === 'Product';
      doc
        .font(isProductCol ? 'Bold' : 'Regular')
        .fontSize(tableFontSize)
        .fillColor('#1a1a1a');

      if (col.align === 'center') {
        doc.text(val, rx, textY, {
          width: col.width,
          align: 'center',
          lineBreak: false,
        });
      } else if (col.align === 'right') {
        doc.text(val, rx, textY, {
          width: col.width - cellPad,
          align: 'right',
          lineBreak: false,
        });
      } else {
        doc.text(val, rx + cellPad, textY, {
          width: col.width - cellPad * 2,
          lineBreak: false,
          ellipsis: true,
        });
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
    doc.text(fmtMoney(totalCost), tx + 14, y + 9, {
      width: totalBoxW - 28,
      align: 'right',
      lineBreak: false,
    });
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
    // Notes is the ONE place we allow lineBreak so the text wraps properly
    doc.text(po.notes, MARGIN, y, { width: CONTENT_W });
    y += doc.heightOfString(po.notes, { width: CONTENT_W, fontSize: 10 }) + 16;
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
  // FOOTER — on EVERY page using bufferedPageRange
  // ═══════════════════════════════════════════════════

  const pages = doc.bufferedPageRange();
  const totalPages = pages.count;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  for (let i = pages.start; i < pages.start + totalPages; i++) {
    doc.switchToPage(i);

    // Thin line above footer
    doc.save()
      .strokeColor('#dddddd')
      .lineWidth(0.3)
      .moveTo(MARGIN, FOOTER_Y - 8)
      .lineTo(MARGIN + CONTENT_W, FOOTER_Y - 8)
      .stroke()
      .restore();

    // Company name (left)
    doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
    doc.text(opts.companyName || '', MARGIN, FOOTER_Y, { lineBreak: false });

    // Page X of Y (right)
    const pageLabel = `Page ${i - pages.start + 1} of ${totalPages}`;
    doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
    doc.text(pageLabel, MARGIN, FOOTER_Y, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    });

    // Generated date (center)
    doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
    doc.text(`Generated ${generatedDate}`, MARGIN, FOOTER_Y, {
      width: CONTENT_W,
      align: 'center',
      lineBreak: false,
    });
  }

  doc.end();
  return doc;
}
