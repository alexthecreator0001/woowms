import { useState, useEffect, useMemo } from 'react';
import { X, Printer } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';
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
}

type LabelSize = 'small' | 'medium' | 'large';

interface LabelSizeOption {
  key: LabelSize;
  title: string;
  dimensions: string;
  perPage: number;
  description: string;
}

const LABEL_SIZES: LabelSizeOption[] = [
  {
    key: 'small',
    title: 'Small',
    dimensions: '1" × 2.63"',
    perPage: 30,
    description: 'Best for shelf edges',
  },
  {
    key: 'medium',
    title: 'Medium',
    dimensions: '2" × 4"',
    perPage: 10,
    description: 'Best for rack labels',
  },
  {
    key: 'large',
    title: 'Large',
    dimensions: '4" × 3"',
    perPage: 6,
    description: 'Best for aisle signs',
  },
];

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

export default function PrintLabelsModal({
  open,
  onClose,
  bins,
  zoneName,
  warehouseName,
}: PrintLabelsModalProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setLabelSize('medium');
      setSelectedIds(new Set(bins.map((b) => b.id)));
    }
  }, [open, bins]);

  // Group bins by aisle (row)
  const groupedBins = useMemo(() => {
    const groups = new Map<string, typeof bins>();
    for (const bin of bins) {
      const aisle = bin.row || 'Ungrouped';
      if (!groups.has(aisle)) {
        groups.set(aisle, []);
      }
      groups.get(aisle)!.push(bin);
    }
    // Sort groups alphabetically
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

    const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

    let cols: number;
    let rows: number;
    let labelW: number;
    let labelH: number;
    let marginLeft: number;
    let marginTop: number;
    let fontLocation: number;
    let fontZone: number;
    let fontBreakdown: number;

    if (labelSize === 'small') {
      cols = 3;
      rows = 10;
      labelW = 2.63;
      labelH = 1;
      marginLeft = 0.19;
      marginTop = 0.5;
      fontLocation = 11;
      fontZone = 6;
      fontBreakdown = 5;
    } else if (labelSize === 'medium') {
      cols = 2;
      rows = 5;
      labelW = 4;
      labelH = 2;
      marginLeft = 0.16;
      marginTop = 0.5;
      fontLocation = 18;
      fontZone = 9;
      fontBreakdown = 7;
    } else {
      cols = 2;
      rows = 3;
      labelW = 4;
      labelH = 3.33;
      marginLeft = 0.25;
      marginTop = 0.25;
      fontLocation = 24;
      fontZone = 11;
      fontBreakdown = 8;
    }

    const perPage = cols * rows;
    const radius = 0.08;

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

      // Draw rounded border
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.01);
      doc.roundedRect(x + 0.05, y + 0.05, labelW - 0.1, labelH - 0.1, radius, radius, 'S');

      const centerX = x + labelW / 2;
      const centerY = y + labelH / 2;

      // Location code — large bold text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontLocation);
      doc.setTextColor(30, 30, 30);
      doc.text(bin.label, centerX, centerY - labelH * 0.1, { align: 'center' });

      // Zone and warehouse name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontZone);
      doc.setTextColor(120, 120, 120);
      const zoneLine = `${zoneName} — ${warehouseName}`;
      doc.text(zoneLine, centerX, centerY + labelH * 0.1, { align: 'center' });

      // Breakdown
      const breakdown = parseLabel(bin.label);
      doc.setFontSize(fontBreakdown);
      doc.setTextColor(160, 160, 160);
      doc.text(breakdown, centerX, centerY + labelH * 0.22, { align: 'center' });
    });

    window.open(doc.output('bloburl').toString(), '_blank');
  }

  if (!open) return null;

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
          <div>
            <h2 className="text-lg font-semibold">Print Location Labels</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Generate printable PDF labels for your warehouse locations.
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Label Size Selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Label Size</p>
            <div className="grid grid-cols-3 gap-3">
              {LABEL_SIZES.map((size) => (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => setLabelSize(size.key)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    labelSize === size.key
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-border hover:bg-muted/30',
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">{size.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{size.dimensions}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{size.perPage}/page</span>
                  <span className="mt-1.5 block text-[11px] text-muted-foreground/80">{size.description}</span>
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
