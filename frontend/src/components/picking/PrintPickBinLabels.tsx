import { useState } from 'react';
import { X, Printer, Minus, Plus } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';
import { cn } from '../../lib/utils';

interface PrintPickBinLabelsProps {
  open: boolean;
  onClose: () => void;
}

type LabelSize = 'zebra-4x6' | 'zebra-2x1' | 'sheet-medium' | 'sheet-large';

const LABEL_SIZES: { key: LabelSize; title: string; desc: string }[] = [
  { key: 'zebra-4x6', title: 'Zebra 4×6"', desc: 'Large — 1 per page' },
  { key: 'zebra-2x1', title: 'Zebra 2×1"', desc: 'Small — 1 per page' },
  { key: 'sheet-medium', title: 'Medium', desc: '10 per letter page' },
  { key: 'sheet-large', title: 'Large', desc: '6 per letter page' },
];

function barcodeDataUrl(text: string): string {
  const canvas = document.createElement('canvas');
  bwipjs.toCanvas(canvas, {
    bcid: 'code128',
    text,
    scale: 3,
    height: 10,
    includetext: false,
  });
  return canvas.toDataURL('image/png');
}

export default function PrintPickBinLabels({ open, onClose }: PrintPickBinLabelsProps) {
  const [count, setCount] = useState(10);
  const [startFrom, setStartFrom] = useState(1);
  const [prefix, setPrefix] = useState('BIN');
  const [labelSize, setLabelSize] = useState<LabelSize>('sheet-medium');

  function pad(n: number) {
    return String(n).padStart(3, '0');
  }

  function generatePdf() {
    if (count < 1) return;

    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(`${prefix}-${pad(startFrom + i)}`);
    }

    const isZebra = labelSize === 'zebra-4x6' || labelSize === 'zebra-2x1';
    let doc: jsPDF;
    let cols: number;
    let rows: number;
    let labelW: number;
    let labelH: number;
    let marginLeft: number;
    let marginTop: number;
    let fontMain: number;
    let fontSub: number;
    let barcodeH: number;

    if (labelSize === 'zebra-4x6') {
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [4, 6] });
      cols = 1; rows = 1;
      labelW = 4; labelH = 6;
      marginLeft = 0; marginTop = 0;
      fontMain = 36; fontSub = 14; barcodeH = 0.7;
    } else if (labelSize === 'zebra-2x1') {
      doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [1, 2] });
      cols = 1; rows = 1;
      labelW = 2; labelH = 1;
      marginLeft = 0; marginTop = 0;
      fontMain = 12; fontSub = 0; barcodeH = 0.25;
    } else if (labelSize === 'sheet-medium') {
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      cols = 2; rows = 5;
      labelW = 4; labelH = 2;
      marginLeft = 0.16; marginTop = 0.5;
      fontMain = 18; fontSub = 8; barcodeH = 0.4;
    } else {
      // sheet-large
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      cols = 2; rows = 3;
      labelW = 4; labelH = 3.33;
      marginLeft = 0.25; marginTop = 0.25;
      fontMain = 26; fontSub = 10; barcodeH = 0.55;
    }

    const perPage = cols * rows;
    const accentColor: [number, number, number] = [139, 92, 246]; // violet

    labels.forEach((label, index) => {
      const pageIndex = Math.floor(index / perPage);
      const posOnPage = index % perPage;

      if (posOnPage === 0 && pageIndex > 0) {
        doc.addPage();
      }

      const col = posOnPage % cols;
      const row = Math.floor(posOnPage / cols);

      const x = marginLeft + col * labelW;
      const y = marginTop + row * labelH;

      const padV = 0.05;
      const innerX = x + padV;
      const innerY = y + padV;
      const innerW = labelW - padV * 2;
      const innerH = labelH - padV * 2;

      // Border
      if (!isZebra) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.008);
        doc.roundedRect(innerX, innerY, innerW, innerH, 0.06, 0.06, 'S');
      }

      // Violet accent stripe
      const stripeW = isZebra ? 0.06 : 0.04;
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(innerX, innerY, stripeW, innerH, 'F');

      const contentX = innerX + stripeW + (isZebra ? 0.15 : 0.08);
      const contentW = innerW - stripeW - (isZebra ? 0.3 : 0.16);
      const centerX = contentX + contentW / 2;

      if (labelSize === 'zebra-4x6') {
        // Large Zebra
        let cursorY = innerY + 0.8;

        // "PICK BIN" header
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSub);
        doc.setTextColor(130, 130, 130);
        doc.text('PICK BIN', centerX, cursorY, { align: 'center' });
        cursorY += 0.6;

        // Barcode
        try {
          const dataUrl = barcodeDataUrl(label);
          const barcodeW = contentW * 0.85;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip */ }
        cursorY += barcodeH + 0.5;

        // Bin code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontMain);
        doc.setTextColor(25, 25, 25);
        doc.text(label, centerX, cursorY, { align: 'center' });

      } else if (labelSize === 'zebra-2x1') {
        // Small Zebra — barcode + code only
        let cursorY = innerY + 0.12;

        try {
          const dataUrl = barcodeDataUrl(label);
          const barcodeW = contentW * 0.8;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip */ }
        cursorY += barcodeH + 0.06;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontMain);
        doc.setTextColor(25, 25, 25);
        doc.text(label, centerX, cursorY + 0.1, { align: 'center' });

      } else {
        // Sheet labels (medium + large)
        const topPad = labelH * 0.08;
        let cursorY = innerY + topPad;

        // "PICK BIN" header
        if (fontSub > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSub);
          doc.setTextColor(140, 140, 140);
          doc.text('PICK BIN', centerX, cursorY + fontSub / 72, { align: 'center' });
          cursorY += fontSub / 72 + labelH * 0.06;
        }

        // Barcode
        try {
          const dataUrl = barcodeDataUrl(label);
          const barcodeW = contentW * 0.75;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip */ }
        cursorY += barcodeH + labelH * 0.08;

        // Bin code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontMain);
        doc.setTextColor(25, 25, 25);
        doc.text(label, centerX, cursorY + fontMain / 72, { align: 'center' });
      }
    });

    window.open(doc.output('bloburl').toString(), '_blank');
  }

  if (!open) return null;

  // Preview labels
  const previewFirst = `${prefix}-${pad(startFrom)}`;
  const previewLast = count > 1 ? `${prefix}-${pad(startFrom + count - 1)}` : previewFirst;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Print Pick Bin Labels</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Static labels for reusable pick bins
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Prefix */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              className="h-10 w-32 rounded-lg border border-border/60 bg-background px-3 text-sm font-mono font-semibold shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">e.g. BIN, TOTE, CART</p>
          </div>

          {/* Start from + Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Start from</label>
              <input
                type="number"
                min={1}
                max={999}
                value={startFrom}
                onChange={(e) => setStartFrom(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Count</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Minus size={14} weight="bold" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={count}
                  onChange={(e) => setCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="h-10 w-full flex-1 rounded-lg border border-border/60 bg-background px-3 text-center text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(200, c + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-2 text-sm font-mono font-semibold">
              <span className="rounded-md bg-violet-500/10 px-2 py-1 text-violet-600">{previewFirst}</span>
              {count > 1 && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-md bg-violet-500/10 px-2 py-1 text-violet-600">{previewLast}</span>
                  <span className="text-xs font-normal text-muted-foreground ml-1">({count} labels)</span>
                </>
              )}
            </div>
          </div>

          {/* Label Size */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Label Size
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LABEL_SIZES.map((size) => (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => setLabelSize(size.key)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    labelSize === size.key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 hover:border-border hover:bg-muted/30',
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">{size.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{size.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={generatePdf}
            disabled={count < 1 || !prefix}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 disabled:opacity-50',
            )}
          >
            <Printer size={16} weight="bold" />
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
