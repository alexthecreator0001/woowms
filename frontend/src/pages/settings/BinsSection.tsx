import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
  CaretDown,
  Info,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import type { BinSize } from '../../types';
import { BIN_SIZE_LABELS } from '../../types';

type LabelSize = 'zebra-4x6' | 'zebra-2x1' | 'sheet-small' | 'sheet-medium' | 'sheet-large';

const LABEL_SIZE_OPTIONS: { key: LabelSize; title: string; description: string }[] = [
  { key: 'zebra-4x6', title: 'Zebra 4×6"', description: 'Standard shipping label — 1 per page' },
  { key: 'zebra-2x1', title: 'Zebra 2×1"', description: 'Small shelf label — 1 per page' },
  { key: 'sheet-small', title: 'Small (2.63×1")', description: '30 per page — shelf edges' },
  { key: 'sheet-medium', title: 'Medium (4×2")', description: '10 per page — rack labels' },
  { key: 'sheet-large', title: 'Large (4×3.33")', description: '6 per page — aisle signs' },
];

export default function BinsSection() {
  // Label printing defaults
  const [labelSize, setLabelSize] = useState<LabelSize>('sheet-medium');
  const [showWarehouse, setShowWarehouse] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Bin defaults
  const [defaultBinSize, setDefaultBinSize] = useState<BinSize>('MEDIUM');
  const [defaultPickable, setDefaultPickable] = useState(true);
  const [defaultSellable, setDefaultSellable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const s = data.data || {};
        if (LABEL_SIZE_OPTIONS.some((o) => o.key === s.binLabelDefaultSize)) setLabelSize(s.binLabelDefaultSize);
        if (typeof s.binLabelShowWarehouse === 'boolean') setShowWarehouse(s.binLabelShowWarehouse);
        if (typeof s.binLabelShowBreakdown === 'boolean') setShowBreakdown(s.binLabelShowBreakdown);
        if (s.binDefaultSize && Object.keys(BIN_SIZE_LABELS).includes(s.binDefaultSize)) setDefaultBinSize(s.binDefaultSize);
        if (typeof s.binDefaultPickable === 'boolean') setDefaultPickable(s.binDefaultPickable);
        if (typeof s.binDefaultSellable === 'boolean') setDefaultSellable(s.binDefaultSellable);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', {
        binLabelDefaultSize: labelSize,
        binLabelShowWarehouse: showWarehouse,
        binLabelShowBreakdown: showBreakdown,
        binDefaultSize: defaultBinSize,
        binDefaultPickable: defaultPickable,
        binDefaultSellable: defaultSellable,
      });
      setMsg('Bin settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save bin settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Label Printing Defaults */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Label Printing</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Default label size and content when printing bin labels.
          </p>
        </div>
        <div className="p-6 space-y-5">
          {/* Label size selector */}
          <div>
            <label className="mb-2 block text-sm font-medium">Default Label Size</label>
            <div className="relative">
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as LabelSize)}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {LABEL_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {LABEL_SIZE_OPTIONS.find((o) => o.key === labelSize)?.description}
            </p>
          </div>

          {/* Label content toggles */}
          <div className="space-y-1">
            <p className="text-sm font-medium mb-2">Label Content</p>
            <button
              type="button"
              onClick={() => setShowWarehouse(!showWarehouse)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">Show warehouse name</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Display the warehouse name alongside the zone name on each label
                </p>
              </div>
              <div
                className={cn(
                  'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                  showWarehouse ? 'bg-primary' : 'bg-border'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    showWarehouse ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">Show location breakdown</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Display the parsed breakdown (e.g. "Aisle A · Rack 01 · Shelf 02 · Pos 03") below the label code
                </p>
              </div>
              <div
                className={cn(
                  'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                  showBreakdown ? 'bg-primary' : 'bg-border'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    showBreakdown ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              These are defaults — you can still change the label size each time you print from a zone.
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Default Bin Properties */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Default Bin Properties</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Default values used when creating or generating new bin locations.
          </p>
        </div>
        <div className="p-6 space-y-5">
          {/* Default bin size */}
          <div>
            <label className="mb-2 block text-sm font-medium">Default Size</label>
            <div className="relative">
              <select
                value={defaultBinSize}
                onChange={(e) => setDefaultBinSize(e.target.value as BinSize)}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {(Object.keys(BIN_SIZE_LABELS) as BinSize[]).map((size) => (
                  <option key={size} value={size}>{BIN_SIZE_LABELS[size]}</option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              The capacity number is the max item count per bin location.
            </p>
          </div>

          {/* Default toggles */}
          <div className="space-y-1">
            <p className="text-sm font-medium mb-2">Default Flags</p>
            <button
              type="button"
              onClick={() => setDefaultPickable(!defaultPickable)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">Pickable</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  New bins are available for order picking by default
                </p>
              </div>
              <div
                className={cn(
                  'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                  defaultPickable ? 'bg-primary' : 'bg-border'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    defaultPickable ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDefaultSellable(!defaultSellable)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">Sellable</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Stock in new bins counts toward available inventory by default
                </p>
              </div>
              <div
                className={cn(
                  'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                  defaultSellable ? 'bg-primary' : 'bg-border'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    defaultSellable ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {msg && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <Check className="h-4 w-4" weight="bold" />
          {msg}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <CircleNotch className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
