import { useState, useEffect, useMemo } from 'react';
import { X, Printer } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';
import { cn } from '../../lib/utils';

interface PrintLabelsModalProps {
  open: boolean;
  onClose: () => void;
  bins: Array<{
    id: number;
    label: string;
    row: string | null;
    shelf: string | null;
    position: string | null;
    isActive: boolean;
  }>;
  zoneName: string;
  warehouseName: string;
  zoneType?: string;
}

type LabelSize = 'zebra-4x6' | 'zebra-2x1' | 'sheet-small' | 'sheet-medium' | 'sheet-large';

interface LabelSizeOption {
  key: LabelSize;
  title: string;
  dimensions: string;
  perPage: number;
  description: string;
}

const ZEBRA_SIZES: LabelSizeOption[] = [
  {
    key: 'zebra-4x6',
    title: '4×6"',
    dimensions: '4" × 6"',
    perPage: 1,
    description: 'Standard shipping label',
  },
  {
    key: 'zebra-2x1',
    title: '2×1"',
    dimensions: '2" × 1"',
    perPage: 1,
    description: 'Small shelf label',
  },
];

const SHEET_SIZES: LabelSizeOption[] = [
  {
    key: 'sheet-small',
    title: 'Small',
    dimensions: '2.63" × 1"',
    perPage: 30,
    description: '30/page — shelf edges',
  },
  {
    key: 'sheet-medium',
    title: 'Medium',
    dimensions: '4" × 2"',
    perPage: 10,
    description: '10/page — rack labels',
  },
  {
    key: 'sheet-large',
    title: 'Large',
    dimensions: '4" × 3.33"',
    perPage: 6,
    description: '6/page — aisle signs',
  },
];

const ZONE_COLORS: Record<string, [number, number, number]> = {
  STORAGE:   [59, 130, 246],
  PICKING:   [139, 92, 246],
  RECEIVING: [245, 158, 11],
  PACKING:   [249, 115, 22],
  SHIPPING:  [16, 185, 129],
  RETURNS:   [239, 68, 68],
};

function parseLabel(label: string): string {
  const parts = label.split('-');
  if (parts.length === 4) {
    return `Aisle ${parts[0]} \u00b7 Rack ${parts[1]} \u00b7 Shelf ${parts[2]} \u00b7 Pos ${parts[3]}`;
  }
  if (parts.length === 3) {
    return `Row ${parts[0]} \u00b7 Shelf ${parts[1]} \u00b7 Pos ${parts[2]}`;
  }
  return label;
}

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

export default function PrintLabelsModal({
  open,
  onClose,
  bins,
  zoneName,
  warehouseName,
  zoneType = '',
}: PrintLabelsModalProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('sheet-medium');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setLabelSize('sheet-medium');
      setSelectedIds(new Set(bins.map((b) => b.id)));
    }
  }, [open, bins]);

  const groupedBins = useMemo(() => {
    const groups = new Map<string, typeof bins>();
    for (const bin of bins) {
      const aisle = bin.row || 'Ungrouped';
      if (!groups.has(aisle)) {
        groups.set(aisle, []);
      }
      groups.get(aisle)!.push(bin);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bins]);

  const hasAisles = groupedBins.length > 1 || (groupedBins.length === 1 && groupedBins[0][0] !== 'Ungrouped');

  const allSelected = selectedIds.size === bins.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bins.map((b) => b.id)));
    }
  }

  function toggleBin(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function generatePdf() {
    const selected = bins.filter((b) => selectedIds.has(b.id));
    if (selected.length === 0) return;

    const color = ZONE_COLORS[zoneType] || [107, 114, 128];
    const isZebra = labelSize === 'zebra-4x6' || labelSize === 'zebra-2x1';

    let doc: jsPDF;
    let cols: number;
    let rows: number;
    let labelW: number;
    let labelH: number;
    let marginLeft: number;
    let marginTop: number;
    let fontLocation: number;
    let fontZone: number;
    let fontBreakdown: number;
    let barcodeH: number;
    let showBreakdown: boolean;

    if (labelSize === 'zebra-4x6') {
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [4, 6] });
      cols = 1; rows = 1;
      labelW = 4; labelH = 6;
      marginLeft = 0; marginTop = 0;
      fontLocation = 28; fontZone = 12; fontBreakdown = 10;
      barcodeH = 0.6; showBreakdown = true;
    } else if (labelSize === 'zebra-2x1') {
      doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [1, 2] });
      cols = 1; rows = 1;
      labelW = 2; labelH = 1;
      marginLeft = 0; marginTop = 0;
      fontLocation = 10; fontZone = 5; fontBreakdown = 0;
      barcodeH = 0.25; showBreakdown = false;
    } else if (labelSize === 'sheet-small') {
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      cols = 3; rows = 10;
      labelW = 2.63; labelH = 1;
      marginLeft = 0.19; marginTop = 0.5;
      fontLocation = 10; fontZone = 5; fontBreakdown = 0;
      barcodeH = 0.2; showBreakdown = false;
    } else if (labelSize === 'sheet-medium') {
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      cols = 2; rows = 5;
      labelW = 4; labelH = 2;
      marginLeft = 0.16; marginTop = 0.5;
      fontLocation = 16; fontZone = 8; fontBreakdown = 6;
      barcodeH = 0.35; showBreakdown = true;
    } else {
      // sheet-large
      doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      cols = 2; rows = 3;
      labelW = 4; labelH = 3.33;
      marginLeft = 0.25; marginTop = 0.25;
      fontLocation = 22; fontZone = 10; fontBreakdown = 8;
      barcodeH = 0.5; showBreakdown = true;
    }

    const perPage = cols * rows;

    selected.forEach((bin, index) => {
      const pageIndex = Math.floor(index / perPage);
      const posOnPage = index % perPage;

      if (posOnPage === 0 && pageIndex > 0) {
        doc.addPage();
      }

      const col = posOnPage % cols;
      const row = Math.floor(posOnPage / cols);

      const x = marginLeft + col * labelW;
      const y = marginTop + row * labelH;

      const pad = 0.05;
      const innerX = x + pad;
      const innerY = y + pad;
      const innerW = labelW - pad * 2;
      const innerH = labelH - pad * 2;

      // Border
      if (!isZebra) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.008);
        doc.roundedRect(innerX, innerY, innerW, innerH, 0.06, 0.06, 'S');
      }

      // Color stripe (left edge)
      const stripeW = isZebra ? 0.06 : 0.04;
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(innerX, innerY, stripeW, innerH, 'F');

      const contentX = innerX + stripeW + (isZebra ? 0.15 : 0.08);
      const contentW = innerW - stripeW - (isZebra ? 0.3 : 0.16);
      const centerX = contentX + contentW / 2;

      // Layout vertical spacing
      let cursorY: number;

      if (isZebra && labelSize === 'zebra-4x6') {
        // Large Zebra: generous spacing
        cursorY = innerY + 0.6;

        // Barcode
        try {
          const dataUrl = barcodeDataUrl(bin.label);
          const barcodeW = contentW * 0.85;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip barcode on error */ }
        cursorY += barcodeH + 0.4;

        // Location code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontLocation);
        doc.setTextColor(25, 25, 25);
        doc.text(bin.label, centerX, cursorY, { align: 'center' });
        cursorY += 0.5;

        // Zone + warehouse
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontZone);
        doc.setTextColor(100, 100, 100);
        doc.text(`${zoneName} — ${warehouseName}`, centerX, cursorY, { align: 'center' });
        cursorY += 0.35;

        // Breakdown
        if (showBreakdown) {
          const breakdown = parseLabel(bin.label);
          doc.setFontSize(fontBreakdown);
          doc.setTextColor(140, 140, 140);
          doc.text(breakdown, centerX, cursorY, { align: 'center' });
        }
      } else if (isZebra && labelSize === 'zebra-2x1') {
        // Small Zebra: compact
        cursorY = innerY + 0.15;

        // Barcode
        try {
          const dataUrl = barcodeDataUrl(bin.label);
          const barcodeW = contentW * 0.8;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip */ }
        cursorY += barcodeH + 0.08;

        // Location code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontLocation);
        doc.setTextColor(25, 25, 25);
        doc.text(bin.label, centerX, cursorY + 0.08, { align: 'center' });
        cursorY += 0.2;

        // Zone line
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontZone);
        doc.setTextColor(120, 120, 120);
        doc.text(`${zoneName}`, centerX, cursorY + 0.06, { align: 'center' });
      } else {
        // Sheet labels
        const topPad = labelH * 0.1;
        cursorY = innerY + topPad;

        // Barcode
        try {
          const dataUrl = barcodeDataUrl(bin.label);
          const barcodeW = contentW * 0.75;
          doc.addImage(dataUrl, 'PNG', centerX - barcodeW / 2, cursorY, barcodeW, barcodeH);
        } catch { /* skip */ }
        cursorY += barcodeH + labelH * 0.08;

        // Location code
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontLocation);
        doc.setTextColor(25, 25, 25);
        doc.text(bin.label, centerX, cursorY + fontLocation / 72, { align: 'center' });
        cursorY += fontLocation / 72 + labelH * 0.08;

        // Zone + warehouse
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontZone);
        doc.setTextColor(100, 100, 100);
        doc.text(`${zoneName} — ${warehouseName}`, centerX, cursorY + fontZone / 72, { align: 'center' });
        cursorY += fontZone / 72 + labelH * 0.06;

        // Breakdown
        if (showBreakdown) {
          const breakdown = parseLabel(bin.label);
          doc.setFontSize(fontBreakdown);
          doc.setTextColor(150, 150, 150);
          doc.text(breakdown, centerX, cursorY + fontBreakdown / 72, { align: 'center' });
        }
      }
    });

    window.open(doc.output('bloburl').toString(), '_blank');
  }

  if (!open) return null;

  const sizeColor = ZONE_COLORS[zoneType];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            {sizeColor && (
              <div
                className="h-8 w-1 rounded-full"
                style={{ backgroundColor: `rgb(${sizeColor[0]}, ${sizeColor[1]}, ${sizeColor[2]})` }}
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">Print Location Labels</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {zoneName} — {warehouseName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Label Size Selector */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Print (Zebra)
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ZEBRA_SIZES.map((size) => (
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
                  <span className="mt-0.5 block text-xs text-muted-foreground">{size.description}</span>
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sheet Labels (Letter)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SHEET_SIZES.map((size) => (
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
                  <span className="mt-0.5 block text-xs text-muted-foreground">{size.perPage}/page</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{size.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Select Labels */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Select Labels{' '}
                <span className="font-normal text-muted-foreground">
                  ({selectedIds.size} of {bins.length} selected)
                </span>
              </p>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-border/40 bg-muted/10">
              {groupedBins.map(([aisle, aisleBins]) => (
                <div key={aisle}>
                  {hasAisles && (
                    <div className="sticky top-0 z-10 border-b border-border/20 bg-muted/40 px-3 py-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Aisle {aisle}
                      </span>
                    </div>
                  )}
                  {aisleBins.map((bin) => (
                    <label
                      key={bin.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/30',
                        !bin.isActive && 'opacity-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(bin.id)}
                        onChange={() => toggleBin(bin.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span className="text-sm font-mono font-medium text-foreground">
                        {bin.label}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
              {bins.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No locations available in this zone.
                </div>
              )}
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
            disabled={selectedIds.size === 0}
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
