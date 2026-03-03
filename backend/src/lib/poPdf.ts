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

// ─── Types ───────────────────────────────────────────

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
  stampBuffer: Buffer | null;
  brandColor: string;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyVatId: string | null;
  companyWebsite: string | null;
}

// ─── Layout Constants ────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 50;
const MAX_CONTENT_Y = FOOTER_Y - 20;

// ─── Helpers ─────────────────────────────────────────

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

function truncateText(doc: PDFKit.PDFDocument, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.widthOfString(text) <= maxWidth) return text;
  const ellipsis = '\u2026';
  const ellipsisW = doc.widthOfString(ellipsis);
  let truncated = text;
  while (truncated.length > 0 && doc.widthOfString(truncated) + ellipsisW > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

// ─── Shared Types / Interfaces ───────────────────────

interface Col {
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

interface SharedContext {
  doc: PDFKit.PDFDocument;
  po: PoData;
  opts: PdfOptions;
  accent: string;
  accentLight: string;
  accentMid: string;
  accentBorder: string;
  items: PoItem[];
  totalCost: number;
  barcodeBuffer: Buffer | null;
  generatedDate: string;
  currentPage: number;
}

// ─── Shared Drawing Helpers ──────────────────────────

function buildColumns(items: PoItem[]): Col[] {
  const hasSupplierSku = items.some((i) => i.supplierSku);
  const hasEan = items.some((i) => i.ean);

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
  return cols;
}

/** Build columns for minimal template: Product first, SKU secondary */
function buildColumnsMinimal(items: PoItem[]): Col[] {
  const hasSupplierSku = items.some((i) => i.supplierSku);
  const hasEan = items.some((i) => i.ean);

  const qtyW = 40;
  const costW = 65;
  const totalColW = 70;
  const skuW = 70;
  const supSkuW = hasSupplierSku ? 70 : 0;
  const eanW = hasEan ? 85 : 0;
  const productW = CONTENT_W - skuW - supSkuW - eanW - qtyW - costW - totalColW;

  const cols: Col[] = [];
  cols.push({ label: 'Product', width: productW, align: 'left' });
  cols.push({ label: 'SKU', width: skuW, align: 'left' });
  if (hasSupplierSku) cols.push({ label: 'Sup. SKU', width: supSkuW, align: 'left' });
  if (hasEan) cols.push({ label: 'EAN', width: eanW, align: 'left' });
  cols.push({ label: 'Qty', width: qtyW, align: 'center' });
  cols.push({ label: 'Unit Cost', width: costW, align: 'right' });
  cols.push({ label: 'Total', width: totalColW, align: 'right' });
  return cols;
}

function buildCellValues(item: PoItem, cols: Col[]): string[] {
  const hasSupplierSku = cols.some((c) => c.label === 'Sup. SKU');
  const hasEan = cols.some((c) => c.label === 'EAN');
  const isMinimalOrder = cols[0].label === 'Product';

  const lineTotal = item.unitCost
    ? `$${(parseFloat(item.unitCost) * item.orderedQty).toFixed(2)}`
    : '-';
  const unitCostStr = item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '-';

  if (isMinimalOrder) {
    const cells: string[] = [];
    cells.push(item.productName);
    cells.push(item.sku || '-');
    if (hasSupplierSku) cells.push(item.supplierSku || '-');
    if (hasEan) cells.push(item.ean || '-');
    cells.push(String(item.orderedQty));
    cells.push(unitCostStr);
    cells.push(lineTotal);
    return cells;
  }

  const cells: string[] = [];
  cells.push(item.sku || '-');
  if (hasSupplierSku) cells.push(item.supplierSku || '-');
  cells.push(item.productName);
  if (hasEan) cells.push(item.ean || '-');
  cells.push(String(item.orderedQty));
  cells.push(unitCostStr);
  cells.push(lineTotal);
  return cells;
}

function addNewPage(ctx: SharedContext): void {
  ctx.doc.addPage();
  ctx.currentPage++;
}

function checkPageBreak(ctx: SharedContext, y: number, neededHeight: number): number {
  if (y + neededHeight > MAX_CONTENT_Y) {
    addNewPage(ctx);
    return 50;
  }
  return y;
}

function drawStampAndSignatures(ctx: SharedContext, y: number): number {
  const { doc, opts } = ctx;
  const sigW = (CONTENT_W - 40) / 2;
  const stampSize = 80;

  // If stamp provided, render it above the signature line
  if (opts.stampBuffer) {
    y = checkPageBreak(ctx, y, stampSize + 70);
    try {
      doc.image(opts.stampBuffer, MARGIN, y, { width: stampSize, height: stampSize });
    } catch { /* skip broken stamp */ }
    y += stampSize + 8;
  } else {
    y = checkPageBreak(ctx, y, 80);
  }

  // Authorized Signature line
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

  // Received By line
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

  return y + 70;
}

function drawNotes(ctx: SharedContext, y: number, labelColor: string): number {
  const { doc, po } = ctx;
  if (!po.notes) return y;

  y = checkPageBreak(ctx, y, 60);
  doc.font('Bold').fontSize(9.5).fillColor(labelColor);
  doc.text('NOTES', MARGIN, y, { lineBreak: false });
  y += 14;
  doc.font('Regular').fontSize(10).fillColor('#333333');
  const notesH = doc.heightOfString(po.notes, { width: CONTENT_W });
  doc.text(po.notes, MARGIN, y, { width: CONTENT_W });
  y += notesH + 16;
  return y;
}

/** Helper to draw a text cell at x, y for a given column definition. */
function drawCell(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  col: Col,
  cellPad: number,
  fontSize: number,
  fontName: string,
  color: string,
): void {
  const maxW = col.width - cellPad * 2;
  doc.font(fontName).fontSize(fontSize).fillColor(color);
  const truncated = truncateText(doc, text, maxW);

  if (col.align === 'center') {
    const tw = doc.widthOfString(truncated);
    doc.text(truncated, x + (col.width - tw) / 2, y, { lineBreak: false });
  } else if (col.align === 'right') {
    const tw = doc.widthOfString(truncated);
    doc.text(truncated, x + col.width - cellPad - tw, y, { lineBreak: false });
  } else {
    doc.text(truncated, x + cellPad, y, { lineBreak: false });
  }
}

/** Build company detail lines from opts. */
function companyDetailLines(opts: PdfOptions): string[] {
  const lines: string[] = [];
  if (opts.companyAddress) lines.push(opts.companyAddress);
  if (opts.companyEmail) lines.push(opts.companyEmail);
  if (opts.companyPhone) lines.push(opts.companyPhone);
  if (opts.companyVatId) lines.push(`VAT: ${opts.companyVatId}`);
  if (opts.companyWebsite) lines.push(opts.companyWebsite);
  return lines;
}

// ═════════════════════════════════════════════════════
// MODERN TEMPLATE
// ═════════════════════════════════════════════════════

function renderModern(ctx: SharedContext): void {
  const { doc, po, opts, accent, accentLight, accentMid, accentBorder, items, totalCost, barcodeBuffer } = ctx;

  // ── First page ──
  addNewPage(ctx);

  // Top accent bar
  doc.save().rect(0, 0, PAGE_W, 4).fill(accent).restore();

  let y = 20;

  // Logo (left side)
  let logoEndX = MARGIN;
  if (opts.logoBuffer) {
    try {
      doc.image(opts.logoBuffer, MARGIN, y, { height: 42 });
      logoEndX = MARGIN + 50;
    } catch { /* skip broken logo */ }
  }

  // Company name beside logo
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
    } catch { /* skip */ }
    y += 32;
  } else {
    y += 18;
  }

  // Divider line
  doc.save().strokeColor(accent).lineWidth(1).moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).stroke().restore();
  y += 14;

  // ── 3 info boxes (Supplier, Deliver To, From) ──
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

  const fromLines = [opts.companyName || 'Your Company'];
  fromLines.push(...companyDetailLines(opts));

  const maxLines = Math.max(supplierLines.length, deliveryLines.length, fromLines.length);
  const boxH = boxPad + boxLabelH + maxLines * boxLineH + boxPad;

  const boxDefs = [
    { x: MARGIN, title: 'SUPPLIER', lines: supplierLines },
    { x: MARGIN + boxW + boxGap, title: 'DELIVER TO', lines: deliveryLines },
    { x: MARGIN + (boxW + boxGap) * 2, title: 'FROM', lines: fromLines },
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

  y += boxH + 10;

  // ── Order details inline row below boxes ──
  const detailParts: string[] = [
    `Status: ${fmtStatus(po.status)}`,
    `Date: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailParts.push(`Expected: ${fmtDate(po.expectedDate)}`);

  doc.font('Regular').fontSize(9).fillColor('#666666');
  const detailStr = detailParts.join('   |   ');
  doc.text(detailStr, MARGIN, y, { lineBreak: false });
  y += 20;

  // ── Items table ──
  const cols = buildColumns(items);
  const headerH = 26;
  const rowH = 24;
  const tableFontSize = 9;
  const headerFontSize = 8.5;
  const cellPad = 6;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  function drawTableHeader(atY: number): void {
    doc.save().rect(MARGIN, atY, tableW, headerH).fill(accent).restore();
    let hx = MARGIN;
    for (const col of cols) {
      const textY = atY + (headerH - headerFontSize) / 2;
      drawCell(doc, col.label, hx, textY, col, cellPad, headerFontSize, 'Bold', '#ffffff');
      hx += col.width;
    }
  }

  y = checkPageBreak(ctx, y, headerH + rowH);
  drawTableHeader(y);
  y += headerH;

  for (let r = 0; r < items.length; r++) {
    if (y + rowH > MAX_CONTENT_Y) {
      addNewPage(ctx);
      // Top accent bar on continuation pages
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
    doc.save().strokeColor(accentBorder).lineWidth(0.3).moveTo(MARGIN, y + rowH).lineTo(MARGIN + tableW, y + rowH).stroke().restore();

    const cells = buildCellValues(it, cols);
    let rx = MARGIN;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const textY = y + (rowH - tableFontSize) / 2;
      const isProductCol = col.label === 'Product';
      drawCell(doc, cells[c] || '', rx, textY, col, cellPad, tableFontSize, isProductCol ? 'Bold' : 'Regular', '#1a1a1a');
      rx += col.width;
    }

    y += rowH;
  }

  // ── Total box ──
  y += 10;
  if (totalCost > 0) {
    y = checkPageBreak(ctx, y, 36);
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

  // ── Notes ──
  y = drawNotes(ctx, y, accent);

  // ── Stamp + Signatures ──
  y = drawStampAndSignatures(ctx, y);
}

// ═════════════════════════════════════════════════════
// CLASSIC TEMPLATE
// ═════════════════════════════════════════════════════

function renderClassic(ctx: SharedContext): void {
  const { doc, po, opts, items, totalCost, barcodeBuffer } = ctx;

  addNewPage(ctx);

  let y = 20;

  // ── Bordered header box ──
  const headerBoxH = 80;
  doc.save()
    .strokeColor('#333333')
    .lineWidth(1)
    .rect(MARGIN, y, CONTENT_W, headerBoxH)
    .stroke()
    .restore();

  // Vertical divider in header (60% / 40%)
  const headerLeftW = CONTENT_W * 0.6;
  doc.save()
    .strokeColor('#333333')
    .lineWidth(0.5)
    .moveTo(MARGIN + headerLeftW, y)
    .lineTo(MARGIN + headerLeftW, y + headerBoxH)
    .stroke()
    .restore();

  // Left side: Logo + Company name + company details
  let leftX = MARGIN + 12;
  let leftY = y + 10;
  if (opts.logoBuffer) {
    try {
      doc.image(opts.logoBuffer, leftX, leftY, { height: 36 });
      leftX += 44;
    } catch { /* skip */ }
  }

  doc.font('Bold').fontSize(18).fillColor('#1a1a1a');
  doc.text('Purchase Order', leftX, leftY, { lineBreak: false });
  leftY += 22;

  if (opts.companyName) {
    doc.font('Bold').fontSize(10).fillColor('#333333');
    doc.text(opts.companyName, leftX, leftY, { lineBreak: false });
    leftY += 13;
  }

  // Company details in header (compact, one line each)
  const cdLines = companyDetailLines(opts);
  const maxLeftTextW = headerLeftW - (leftX - MARGIN) - 12;
  doc.font('Regular').fontSize(8).fillColor('#555555');
  for (const line of cdLines) {
    if (leftY > y + headerBoxH - 10) break;
    const tLine = truncateText(doc, line, maxLeftTextW);
    doc.text(tLine, leftX, leftY, { lineBreak: false });
    leftY += 11;
  }

  // Right side: PO details in bordered info area
  const rightX = MARGIN + headerLeftW + 10;
  let rightY = y + 12;

  doc.font('Bold').fontSize(9).fillColor('#333333');
  doc.text('PO Number:', rightX, rightY, { lineBreak: false });
  doc.font('Regular').fontSize(9).fillColor('#1a1a1a');
  const poNumLabelW = doc.widthOfString('PO Number:  ');
  doc.text(po.poNumber, rightX + poNumLabelW, rightY, { lineBreak: false });
  rightY += 14;

  doc.font('Bold').fontSize(9).fillColor('#333333');
  doc.text('Date:', rightX, rightY, { lineBreak: false });
  doc.font('Regular').fontSize(9).fillColor('#1a1a1a');
  doc.text(fmtDate(po.createdAt), rightX + doc.widthOfString('Date:  '), rightY, { lineBreak: false });
  rightY += 14;

  doc.font('Bold').fontSize(9).fillColor('#333333');
  doc.text('Status:', rightX, rightY, { lineBreak: false });
  doc.font('Regular').fontSize(9).fillColor('#1a1a1a');
  doc.text(fmtStatus(po.status), rightX + doc.widthOfString('Status:  '), rightY, { lineBreak: false });
  rightY += 14;

  if (po.expectedDate) {
    doc.font('Bold').fontSize(9).fillColor('#333333');
    doc.text('Expected:', rightX, rightY, { lineBreak: false });
    doc.font('Regular').fontSize(9).fillColor('#1a1a1a');
    doc.text(fmtDate(po.expectedDate), rightX + doc.widthOfString('Expected:  '), rightY, { lineBreak: false });
  }

  // Barcode under header box
  y += headerBoxH + 8;
  if (barcodeBuffer) {
    try {
      doc.image(barcodeBuffer, MARGIN, y, { width: 130, height: 24 });
    } catch { /* skip */ }
    y += 30;
  }

  // ── Supplier + Deliver To bordered boxes side by side ──
  const twoBoxGap = 10;
  const twoBoxW = (CONTENT_W - twoBoxGap) / 2;
  const twoBoxPad = 10;
  const twoBoxLineH = 14;
  const twoBoxLabelH = 16;

  const supplierLines = [po.supplier.name];
  if (po.supplier.address) supplierLines.push(po.supplier.address);
  if (po.supplier.email) supplierLines.push(po.supplier.email);
  if (po.supplier.phone) supplierLines.push(po.supplier.phone);

  const deliveryLines = po.deliveryAddress
    ? po.deliveryAddress.split(', ')
    : ['Not specified'];

  const maxBoxLines = Math.max(supplierLines.length, deliveryLines.length);
  const twoBoxH = twoBoxPad + twoBoxLabelH + maxBoxLines * twoBoxLineH + twoBoxPad;

  const twoBoxDefs = [
    { x: MARGIN, title: 'SUPPLIER', lines: supplierLines },
    { x: MARGIN + twoBoxW + twoBoxGap, title: 'DELIVER TO', lines: deliveryLines },
  ];

  for (const box of twoBoxDefs) {
    // Bordered box
    doc.save()
      .strokeColor('#999999')
      .lineWidth(0.5)
      .rect(box.x, y, twoBoxW, twoBoxH)
      .stroke()
      .restore();

    doc.font('Bold').fontSize(8.5).fillColor('#333333');
    doc.text(box.title, box.x + twoBoxPad, y + twoBoxPad, { lineBreak: false });

    let ly = y + twoBoxPad + twoBoxLabelH;
    const maxTextW = twoBoxW - twoBoxPad * 2;
    for (let i = 0; i < box.lines.length; i++) {
      if (i === 0) {
        doc.font('Bold').fontSize(10.5).fillColor('#1a1a1a');
      } else {
        doc.font('Regular').fontSize(9.5).fillColor('#555555');
      }
      const line = truncateText(doc, box.lines[i], maxTextW);
      doc.text(line, box.x + twoBoxPad, ly, { lineBreak: false });
      ly += twoBoxLineH;
    }
  }

  y += twoBoxH + 16;

  // ── Items table (grid style, gray header) ──
  const cols = buildColumns(items);
  const headerH = 26;
  const rowH = 24;
  const tableFontSize = 9;
  const headerFontSize = 8.5;
  const cellPad = 6;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  function drawTableHeaderClassic(atY: number): void {
    // Gray header background
    doc.save().rect(MARGIN, atY, tableW, headerH).fill('#e5e5e5').restore();
    // Header border
    doc.save().strokeColor('#999999').lineWidth(0.5).rect(MARGIN, atY, tableW, headerH).stroke().restore();

    // Vertical lines in header
    let hx = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      if (i > 0) {
        doc.save().strokeColor('#999999').lineWidth(0.3).moveTo(hx, atY).lineTo(hx, atY + headerH).stroke().restore();
      }
      const col = cols[i];
      const textY = atY + (headerH - headerFontSize) / 2;
      drawCell(doc, col.label, hx, textY, col, cellPad, headerFontSize, 'Bold', '#333333');
      hx += col.width;
    }
  }

  y = checkPageBreak(ctx, y, headerH + rowH);
  drawTableHeaderClassic(y);
  y += headerH;

  for (let r = 0; r < items.length; r++) {
    if (y + rowH > MAX_CONTENT_Y) {
      addNewPage(ctx);
      y = 50;
      drawTableHeaderClassic(y);
      y += headerH;
    }

    const it = items[r];

    // Full grid borders for each row
    doc.save().strokeColor('#cccccc').lineWidth(0.3).rect(MARGIN, y, tableW, rowH).stroke().restore();

    // Vertical cell dividers
    let rx = MARGIN;
    for (let c = 0; c < cols.length; c++) {
      if (c > 0) {
        doc.save().strokeColor('#cccccc').lineWidth(0.3).moveTo(rx, y).lineTo(rx, y + rowH).stroke().restore();
      }
      rx += cols[c].width;
    }

    // Cell values
    const cells = buildCellValues(it, cols);
    rx = MARGIN;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const textY = y + (rowH - tableFontSize) / 2;
      const isProductCol = col.label === 'Product';
      drawCell(doc, cells[c] || '', rx, textY, col, cellPad, tableFontSize, isProductCol ? 'Bold' : 'Regular', '#1a1a1a');
      rx += col.width;
    }

    y += rowH;
  }

  // ── Subtotal / Total (right-aligned text, no box) ──
  y += 12;
  if (totalCost > 0) {
    y = checkPageBreak(ctx, y, 40);

    // Subtotal line
    doc.font('Regular').fontSize(10).fillColor('#333333');
    const subtotalLabel = 'Subtotal:';
    const subtotalValue = fmtMoney(totalCost);
    const subtotalLabelW = doc.widthOfString(subtotalLabel);
    const subtotalValueW = doc.widthOfString(subtotalValue);
    doc.text(subtotalLabel, MARGIN + CONTENT_W - 140, y, { lineBreak: false });
    doc.text(subtotalValue, MARGIN + CONTENT_W - subtotalValueW, y, { lineBreak: false });
    y += 16;

    // Total line (bold)
    doc.font('Bold').fontSize(12).fillColor('#1a1a1a');
    const totalLabel = 'Total:';
    const totalValue = fmtMoney(totalCost);
    const totalValueW = doc.widthOfString(totalValue);
    doc.text(totalLabel, MARGIN + CONTENT_W - 140, y, { lineBreak: false });
    doc.text(totalValue, MARGIN + CONTENT_W - totalValueW, y, { lineBreak: false });
    y += 24;
  }

  // ── Notes ──
  y = drawNotes(ctx, y, '#333333');

  // ── Stamp + Signatures ──
  y = drawStampAndSignatures(ctx, y);
}

// ═════════════════════════════════════════════════════
// MINIMAL TEMPLATE
// ═════════════════════════════════════════════════════

function renderMinimal(ctx: SharedContext): void {
  const { doc, po, opts, items, totalCost } = ctx;

  addNewPage(ctx);

  let y = 24;

  // ── Company name small at top-left ──
  if (opts.companyName) {
    doc.font('Regular').fontSize(10).fillColor('#888888');
    doc.text(opts.companyName, MARGIN, y, { lineBreak: false });
    y += 16;
  }

  // ── PO number large and bold ──
  doc.font('Bold').fontSize(26).fillColor('#1a1a1a');
  doc.text(po.poNumber, MARGIN, y, { lineBreak: false });
  y += 34;

  // ── Date + status inline ──
  doc.font('Regular').fontSize(9).fillColor('#999999');
  const metaStr = `${fmtDate(po.createdAt)}  \u00B7  ${fmtStatus(po.status)}${po.expectedDate ? '  \u00B7  Expected ' + fmtDate(po.expectedDate) : ''}`;
  doc.text(metaStr, MARGIN, y, { lineBreak: false });
  y += 20;

  // ── Company details as small text block ──
  const cdLines = companyDetailLines(opts);
  if (cdLines.length > 0) {
    doc.font('Regular').fontSize(8).fillColor('#aaaaaa');
    for (const line of cdLines) {
      const tLine = truncateText(doc, line, CONTENT_W);
      doc.text(tLine, MARGIN, y, { lineBreak: false });
      y += 11;
    }
    y += 6;
  }

  // ── Thin separator ──
  doc.save().strokeColor('#e0e0e0').lineWidth(0.5).moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).stroke().restore();
  y += 16;

  // ── Supplier + Deliver To as simple labeled text blocks ──
  const leftBlockW = CONTENT_W * 0.48;
  const rightBlockX = MARGIN + CONTENT_W * 0.52;

  // Supplier
  doc.font('Bold').fontSize(8).fillColor('#aaaaaa');
  doc.text('SUPPLIER', MARGIN, y, { lineBreak: false });
  let sy = y + 14;
  doc.font('Bold').fontSize(10).fillColor('#1a1a1a');
  doc.text(truncateText(doc, po.supplier.name, leftBlockW), MARGIN, sy, { lineBreak: false });
  sy += 14;
  doc.font('Regular').fontSize(9).fillColor('#666666');
  if (po.supplier.address) {
    doc.text(truncateText(doc, po.supplier.address, leftBlockW), MARGIN, sy, { lineBreak: false });
    sy += 13;
  }
  if (po.supplier.email) {
    doc.text(truncateText(doc, po.supplier.email, leftBlockW), MARGIN, sy, { lineBreak: false });
    sy += 13;
  }
  if (po.supplier.phone) {
    doc.text(truncateText(doc, po.supplier.phone, leftBlockW), MARGIN, sy, { lineBreak: false });
    sy += 13;
  }

  // Deliver To
  const rightBlockW = CONTENT_W * 0.48;
  doc.font('Bold').fontSize(8).fillColor('#aaaaaa');
  doc.text('DELIVER TO', rightBlockX, y, { lineBreak: false });
  let dy = y + 14;
  const dLines = po.deliveryAddress ? po.deliveryAddress.split(', ') : ['Not specified'];
  for (let i = 0; i < dLines.length; i++) {
    if (i === 0) {
      doc.font('Bold').fontSize(10).fillColor('#1a1a1a');
    } else {
      doc.font('Regular').fontSize(9).fillColor('#666666');
    }
    doc.text(truncateText(doc, dLines[i], rightBlockW), rightBlockX, dy, { lineBreak: false });
    dy += i === 0 ? 14 : 13;
  }

  y = Math.max(sy, dy) + 10;

  // ── Thin separator ──
  doc.save().strokeColor('#e0e0e0').lineWidth(0.5).moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).stroke().restore();
  y += 16;

  // ── Items table (minimal style: Product first, light header, no cell borders) ──
  const cols = buildColumnsMinimal(items);
  const headerH = 24;
  const rowH = 24;
  const tableFontSize = 9;
  const headerFontSize = 8;
  const cellPad = 6;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  function drawTableHeaderMinimal(atY: number): void {
    // Light gray header background
    doc.save().rect(MARGIN, atY, tableW, headerH).fill('#f5f5f5').restore();
    let hx = MARGIN;
    for (const col of cols) {
      const textY = atY + (headerH - headerFontSize) / 2;
      drawCell(doc, col.label, hx, textY, col, cellPad, headerFontSize, 'Bold', '#999999');
      hx += col.width;
    }
  }

  y = checkPageBreak(ctx, y, headerH + rowH);
  drawTableHeaderMinimal(y);
  y += headerH;

  for (let r = 0; r < items.length; r++) {
    if (y + rowH > MAX_CONTENT_Y) {
      addNewPage(ctx);
      y = 50;
      drawTableHeaderMinimal(y);
      y += headerH;
    }

    const it = items[r];

    // Thin bottom border only (no cell borders)
    doc.save().strokeColor('#eeeeee').lineWidth(0.3).moveTo(MARGIN, y + rowH).lineTo(MARGIN + tableW, y + rowH).stroke().restore();

    const cells = buildCellValues(it, cols);
    let rx = MARGIN;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const textY = y + (rowH - tableFontSize) / 2;
      const isProductCol = col.label === 'Product';
      drawCell(doc, cells[c] || '', rx, textY, col, cellPad, tableFontSize, isProductCol ? 'Bold' : 'Regular', isProductCol ? '#1a1a1a' : '#444444');
      rx += col.width;
    }

    y += rowH;
  }

  // ── Total (simple right-aligned bold text) ──
  y += 12;
  if (totalCost > 0) {
    y = checkPageBreak(ctx, y, 28);
    doc.font('Bold').fontSize(12).fillColor('#1a1a1a');
    const totalStr = `Total: ${fmtMoney(totalCost)}`;
    const totalStrW = doc.widthOfString(totalStr);
    doc.text(totalStr, MARGIN + CONTENT_W - totalStrW, y, { lineBreak: false });
    y += 24;
  }

  // ── Notes ──
  y = drawNotes(ctx, y, '#999999');

  // ── Stamp + Signatures ──
  y = drawStampAndSignatures(ctx, y);
}

// ═════════════════════════════════════════════════════
// Footer Renderers (template-specific)
// ═════════════════════════════════════════════════════

function drawFooterModern(ctx: SharedContext, pageNum: number, totalPages: number): void {
  const { doc, opts, accent, generatedDate } = ctx;
  const savedBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc.save().strokeColor(accent).lineWidth(0.3).moveTo(MARGIN, FOOTER_Y - 8).lineTo(MARGIN + CONTENT_W, FOOTER_Y - 8).stroke().restore();

  doc.font('Regular').fontSize(7.5).fillColor('#aaaaaa');
  doc.text(opts.companyName || '', MARGIN, FOOTER_Y, { lineBreak: false });

  const pageLabel = `Page ${pageNum} of ${totalPages}`;
  const pageLabelW = doc.widthOfString(pageLabel);
  doc.text(pageLabel, MARGIN + CONTENT_W - pageLabelW, FOOTER_Y, { lineBreak: false });

  const dateStr = `Generated ${generatedDate}`;
  const dateW = doc.widthOfString(dateStr);
  doc.text(dateStr, MARGIN + (CONTENT_W - dateW) / 2, FOOTER_Y, { lineBreak: false });

  doc.page.margins.bottom = savedBottomMargin;
}

function drawFooterClassic(ctx: SharedContext, pageNum: number, totalPages: number): void {
  const { doc, opts, generatedDate } = ctx;
  const savedBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc.save().strokeColor('#999999').lineWidth(0.5).moveTo(MARGIN, FOOTER_Y - 8).lineTo(MARGIN + CONTENT_W, FOOTER_Y - 8).stroke().restore();

  doc.font('Regular').fontSize(7.5).fillColor('#888888');
  doc.text(opts.companyName || '', MARGIN, FOOTER_Y, { lineBreak: false });

  const pageLabel = `Page ${pageNum} of ${totalPages}`;
  const pageLabelW = doc.widthOfString(pageLabel);
  doc.text(pageLabel, MARGIN + CONTENT_W - pageLabelW, FOOTER_Y, { lineBreak: false });

  const dateStr = `Generated ${generatedDate}`;
  const dateW = doc.widthOfString(dateStr);
  doc.text(dateStr, MARGIN + (CONTENT_W - dateW) / 2, FOOTER_Y, { lineBreak: false });

  doc.page.margins.bottom = savedBottomMargin;
}

function drawFooterMinimal(ctx: SharedContext, pageNum: number, totalPages: number): void {
  const { doc } = ctx;
  const savedBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  // Very clean — just page number, right-aligned
  doc.font('Regular').fontSize(7.5).fillColor('#cccccc');
  const pageLabel = `${pageNum} / ${totalPages}`;
  const pageLabelW = doc.widthOfString(pageLabel);
  doc.text(pageLabel, MARGIN + CONTENT_W - pageLabelW, FOOTER_Y, { lineBreak: false });

  doc.page.margins.bottom = savedBottomMargin;
}

// ═════════════════════════════════════════════════════
// Main Entry Point
// ═════════════════════════════════════════════════════

export async function generatePoPdf(po: PoData, opts: PdfOptions): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: 60, left: MARGIN, right: MARGIN },
    autoFirstPage: false,
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

  let barcodeBuffer: Buffer | null = null;
  try {
    barcodeBuffer = await generateBarcode(po.poNumber);
  } catch { /* skip if barcode generation fails */ }

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ctx: SharedContext = {
    doc,
    po,
    opts,
    accent,
    accentLight,
    accentMid,
    accentBorder,
    items,
    totalCost,
    barcodeBuffer,
    generatedDate,
    currentPage: 0,
  };

  // Dispatch to template-specific renderer
  if (opts.template === 'classic') {
    renderClassic(ctx);
  } else if (opts.template === 'minimal') {
    renderMinimal(ctx);
  } else {
    renderModern(ctx);
  }

  // Draw footers on every page AFTER all content is laid out
  const totalPages = ctx.currentPage;
  const drawFooterFn =
    opts.template === 'classic' ? drawFooterClassic :
    opts.template === 'minimal' ? drawFooterMinimal :
    drawFooterModern;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawFooterFn(ctx, i + 1, totalPages);
  }

  // CRITICAL: Switch back to last content page to prevent blank trailing pages
  doc.switchToPage(totalPages - 1);

  doc.end();
  return doc;
}
