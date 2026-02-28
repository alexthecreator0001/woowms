import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PurchaseOrder } from '../types';

export function generatePoPdf(po: PurchaseOrder) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Purchase Order', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('PickNPack Warehouse Management', 14, 30);

  // PO Info
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`PO #: ${po.poNumber}`, 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`Supplier: ${po.supplier}`, 14, 52);
  doc.text(`Status: ${po.status.replace('_', ' ')}`, 14, 60);
  doc.text(`Created: ${new Date(po.createdAt).toLocaleDateString()}`, 14, 68);
  if (po.expectedDate) {
    doc.text(`Expected: ${new Date(po.expectedDate).toLocaleDateString()}`, 14, 76);
  }

  // Items table
  const startY = po.expectedDate ? 86 : 78;
  const items = po.items || [];
  const tableBody = items.map((item) => [
    item.sku,
    item.productName,
    String(item.orderedQty),
    String(item.receivedQty),
    item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '—',
    item.unitCost ? `$${(parseFloat(item.unitCost) * item.orderedQty).toFixed(2)}` : '—',
  ]);

  autoTable(doc, {
    startY,
    head: [['SKU', 'Product', 'Ordered', 'Received', 'Unit Cost', 'Line Total']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [51, 51, 51], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
    },
  });

  // Total
  const totalCost = items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + parseFloat(item.unitCost) * item.orderedQty;
  }, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || startY + 40;

  if (totalCost > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total: $${totalCost.toFixed(2)}`, 186, finalY + 12, { align: 'right' });
  }

  // Notes
  if (po.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Notes: ${po.notes}`, 14, finalY + 24);
  }

  doc.save(`${po.poNumber}.pdf`);
}
