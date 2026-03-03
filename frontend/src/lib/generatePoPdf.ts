import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PurchaseOrder } from '../types';

export type PoTemplate = 'modern' | 'classic' | 'minimal';

interface PdfOptions {
  template?: PoTemplate;
  companyName?: string;
  logoDataUrl?: string | null;
}

// ─── Color palettes ────────────────────────────────────

const PALETTES: Record<PoTemplate, {
  primary: [number, number, number];
  headerBg: [number, number, number];
  headerText: [number, number, number];
  accent: [number, number, number];
  lightBg: [number, number, number];
  muted: [number, number, number];
}> = {
  modern: {
    primary: [15, 23, 42],       // slate-900
    headerBg: [15, 23, 42],
    headerText: [255, 255, 255],
    accent: [99, 102, 241],      // indigo-500
    lightBg: [248, 250, 252],    // slate-50
    muted: [100, 116, 139],      // slate-500
  },
  classic: {
    primary: [30, 30, 30],
    headerBg: [55, 65, 81],      // gray-700
    headerText: [255, 255, 255],
    accent: [30, 30, 30],
    lightBg: [249, 250, 251],    // gray-50
    muted: [107, 114, 128],      // gray-500
  },
  minimal: {
    primary: [23, 23, 23],
    headerBg: [245, 245, 245],   // neutral-100
    headerText: [23, 23, 23],
    accent: [23, 23, 23],
    lightBg: [250, 250, 250],
    muted: [115, 115, 115],      // neutral-500
  },
};

// ─── Main export ───────────────────────────────────────

export function generatePoPdf(po: PurchaseOrder, opts: PdfOptions = {}) {
  const template = opts.template || 'modern';
  const companyName = opts.companyName || '';
  const logoDataUrl = opts.logoDataUrl || null;
  const palette = PALETTES[template];

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;

  const items = po.items || [];
  const totalCost = items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + parseFloat(item.unitCost) * item.orderedQty;
  }, 0);

  if (template === 'modern') drawModern(doc, po, items, totalCost, palette, companyName, logoDataUrl, margin, contentW, pageW);
  else if (template === 'classic') drawClassic(doc, po, items, totalCost, palette, companyName, logoDataUrl, margin, contentW, pageW);
  else drawMinimal(doc, po, items, totalCost, palette, companyName, logoDataUrl, margin, contentW, pageW);

  doc.save(`${po.poNumber}.pdf`);
}

// ─── Helpers ───────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(v: number) {
  return v > 0 ? `$${v.toFixed(2)}` : '—';
}

function addLogo(doc: jsPDF, logoDataUrl: string | null, x: number, y: number, maxH: number): number {
  if (!logoDataUrl) return 0;
  try {
    doc.addImage(logoDataUrl, 'WEBP', x, y, maxH, maxH, undefined, 'FAST');
    return maxH + 4;
  } catch {
    return 0;
  }
}

// ─── MODERN template ──────────────────────────────────

function drawModern(
  doc: jsPDF, po: PurchaseOrder, items: PurchaseOrder['items'] & any[], totalCost: number,
  p: typeof PALETTES.modern, companyName: string, logoDataUrl: string | null,
  margin: number, contentW: number, pageW: number
) {
  // Top accent bar
  doc.setFillColor(...p.accent);
  doc.rect(0, 0, pageW, 4, 'F');

  let y = 18;

  // Logo + company on left, PO info on right
  const logoOffset = addLogo(doc, logoDataUrl, margin, y, 14);
  const labelX = margin + logoOffset;

  if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...p.primary);
    doc.text(companyName, labelX, y + 5);
  }

  // PO number — right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...p.accent);
  doc.text('PURCHASE ORDER', pageW - margin, y + 3, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...p.muted);
  doc.text(po.poNumber, pageW - margin, y + 11, { align: 'right' });

  y = 42;

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Info grid — 2 columns
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...p.muted);
  doc.text('SUPPLIER', margin, y);
  doc.text('DETAILS', pageW / 2, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...p.primary);
  doc.text(po.supplier, margin, y);

  // Details column
  const detailLines = [
    `Status: ${po.status.replace(/_/g, ' ')}`,
    `Created: ${fmtDate(po.createdAt)}`,
  ];
  if (po.expectedDate) detailLines.push(`Expected: ${fmtDate(po.expectedDate)}`);

  detailLines.forEach((line, i) => {
    doc.setFontSize(9);
    doc.setTextColor(...p.muted);
    doc.text(line, pageW / 2, y + (i * 5));
  });

  y += Math.max(5, detailLines.length * 5) + 8;

  // Items table
  const tableBody = items.map((item: any) => [
    item.sku || '—',
    item.productName,
    String(item.orderedQty),
    String(item.receivedQty),
    item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '—',
    item.unitCost ? `$${(parseFloat(item.unitCost) * item.orderedQty).toFixed(2)}` : '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['SKU', 'Product', 'Ordered', 'Received', 'Unit Cost', 'Total']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [...p.headerBg] as any,
      textColor: [...p.headerText] as any,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    bodyStyles: { fontSize: 9, cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 }, textColor: [...p.primary] as any },
    alternateRowStyles: { fillColor: [...p.lightBg] as any },
    columnStyles: {
      0: { cellWidth: 30 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

  // Total row
  if (totalCost > 0) {
    const totalY = finalY + 6;
    doc.setFillColor(...p.lightBg);
    doc.roundedRect(pageW - margin - 60, totalY - 5, 60, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...p.primary);
    doc.text('Total', pageW - margin - 55, totalY + 2);
    doc.text(fmtMoney(totalCost), pageW - margin - 3, totalY + 2, { align: 'right' });
  }

  // Notes
  if (po.notes) {
    const notesY = finalY + 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...p.muted);
    doc.text('NOTES', margin, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...p.primary);
    const lines = doc.splitTextToSize(po.notes, contentW);
    doc.text(lines, margin, notesY + 5);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, 287);
  if (companyName) doc.text(companyName, pageW - margin, 287, { align: 'right' });
}

// ─── CLASSIC template ─────────────────────────────────

function drawClassic(
  doc: jsPDF, po: PurchaseOrder, items: PurchaseOrder['items'] & any[], totalCost: number,
  p: typeof PALETTES.classic, companyName: string, logoDataUrl: string | null,
  margin: number, contentW: number, pageW: number
) {
  let y = 16;

  // Header with border box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, y - 4, contentW, 28, 'S');

  const logoOffset = addLogo(doc, logoDataUrl, margin + 4, y, 12);
  const nameX = margin + 4 + logoOffset;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...p.primary);
  doc.text('Purchase Order', nameX, y + 6);

  if (companyName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...p.muted);
    doc.text(companyName, nameX, y + 13);
  }

  // PO number right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...p.primary);
  doc.text(po.poNumber, pageW - margin - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...p.muted);
  doc.text(fmtDate(po.createdAt), pageW - margin - 4, y + 13, { align: 'right' });

  y = 48;

  // Supplier + details in side-by-side boxes
  const halfW = (contentW - 4) / 2;

  // Supplier box
  doc.setFillColor(...p.lightBg);
  doc.rect(margin, y, halfW, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, y, halfW, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...p.muted);
  doc.text('SUPPLIER', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...p.primary);
  doc.text(po.supplier, margin + 4, y + 13);

  // Details box
  const detailX = margin + halfW + 4;
  doc.setFillColor(...p.lightBg);
  doc.rect(detailX, y, halfW, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(detailX, y, halfW, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...p.muted);
  doc.text('ORDER DETAILS', detailX + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...p.primary);
  doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, detailX + 4, y + 12);
  if (po.expectedDate) {
    doc.text(`Expected: ${fmtDate(po.expectedDate)}`, detailX + 4, y + 18);
  }

  y += 30;

  // Table
  const tableBody = items.map((item: any) => [
    item.sku || '—',
    item.productName,
    String(item.orderedQty),
    String(item.receivedQty),
    item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '—',
    item.unitCost ? `$${(parseFloat(item.unitCost) * item.orderedQty).toFixed(2)}` : '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['SKU', 'Product', 'Qty', 'Rcvd', 'Unit Cost', 'Line Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [...p.headerBg] as any,
      textColor: [...p.headerText] as any,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3.5,
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 3, textColor: [...p.primary] as any },
    alternateRowStyles: { fillColor: [...p.lightBg] as any },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 26 },
    },
    margin: { left: margin, right: margin },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.3,
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

  // Total
  if (totalCost > 0) {
    doc.setDrawColor(220, 220, 220);
    doc.line(pageW - margin - 52, finalY + 3, pageW - margin, finalY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...p.primary);
    doc.text('Total:', pageW - margin - 52, finalY + 10);
    doc.text(fmtMoney(totalCost), pageW - margin, finalY + 10, { align: 'right' });
  }

  // Notes
  if (po.notes) {
    const notesY = finalY + 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...p.muted);
    doc.text('Notes:', margin, notesY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(po.notes, contentW);
    doc.text(lines, margin, notesY + 5);
  }

  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 283, pageW - margin, 283);
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(companyName || 'Purchase Order', margin, 288);
  doc.text(`Page 1 · ${fmtDate(new Date().toISOString())}`, pageW - margin, 288, { align: 'right' });
}

// ─── MINIMAL template ─────────────────────────────────

function drawMinimal(
  doc: jsPDF, po: PurchaseOrder, items: PurchaseOrder['items'] & any[], totalCost: number,
  p: typeof PALETTES.minimal, companyName: string, logoDataUrl: string | null,
  margin: number, contentW: number, pageW: number
) {
  let y = 20;

  // Logo + company
  const logoOffset = addLogo(doc, logoDataUrl, margin, y - 2, 12);
  const nameX = margin + logoOffset;

  if (companyName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...p.muted);
    doc.text(companyName, nameX, y + 4);
  }

  y += 16;

  // Big PO number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...p.primary);
  doc.text(po.poNumber, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...p.muted);

  const meta = [po.supplier, fmtDate(po.createdAt), po.status.replace(/_/g, ' ')];
  if (po.expectedDate) meta.push(`Expected ${fmtDate(po.expectedDate)}`);
  doc.text(meta.join('  ·  '), margin, y + 7);

  y += 18;

  // Thin divider
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Table — very clean
  const tableBody = items.map((item: any) => [
    item.productName,
    item.sku || '',
    String(item.orderedQty),
    String(item.receivedQty),
    item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '',
    item.unitCost ? `$${(parseFloat(item.unitCost) * item.orderedQty).toFixed(2)}` : '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Product', 'SKU', 'Ord', 'Rcvd', 'Cost', 'Total']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [...p.headerBg] as any,
      textColor: [...p.headerText] as any,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [...p.primary] as any,
      lineColor: [240, 240, 240],
      lineWidth: { bottom: 0.2 },
    },
    columnStyles: {
      1: { textColor: [...p.muted] as any, cellWidth: 28 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

  // Total — simple right-aligned
  if (totalCost > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...p.primary);
    doc.text(`Total  ${fmtMoney(totalCost)}`, pageW - margin, finalY + 8, { align: 'right' });
  }

  // Notes
  if (po.notes) {
    const notesY = finalY + 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...p.muted);
    const lines = doc.splitTextToSize(po.notes, contentW);
    doc.text(lines, margin, notesY);
  }

  // Footer — minimal
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text(companyName || '', margin, 290);
}
