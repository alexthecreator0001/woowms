import { useState, useEffect, useMemo } from 'react';
import { X, CircleNotch, Rows, Stack, GridFour, MapPin } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface GenerateBinsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  zoneId: number;
}

type AisleNaming = 'letters' | 'numbers';

export default function GenerateBinsModal({
  open,
  onClose,
  onSaved,
  zoneId,
}: GenerateBinsModalProps) {
  const [aisles, setAisles] = useState(3);
  const [aisleNaming, setAisleNaming] = useState<AisleNaming>('letters');
  const [racks, setRacks] = useState(2);
  const [shelves, setShelves] = useState(4);
  const [positions, setPositions] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAisles(3);
      setAisleNaming('letters');
      setRacks(2);
      setShelves(4);
      setPositions(3);
      setError(null);
    }
  }, [open]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const totalLocations = aisles * racks * shelves * positions;

  // Generate preview labels
  const preview = useMemo(() => {
    if (aisles < 1 || racks < 1 || shelves < 1 || positions < 1) return { first: '', last: '', aisleLabels: [] as string[] };
    const firstAisle = aisleNaming === 'letters' ? 'A' : '01';
    const lastAisle = aisleNaming === 'letters' ? String.fromCharCode(64 + Math.min(aisles, 26)) : pad(aisles);
    const aisleLabels = [];
    for (let i = 1; i <= Math.min(aisles, 26); i++) {
      aisleLabels.push(aisleNaming === 'letters' ? String.fromCharCode(64 + i) : pad(i));
    }
    return {
      first: `${firstAisle}-${pad(1)}-${pad(1)}-${pad(1)}`,
      last: `${lastAisle}-${pad(racks)}-${pad(shelves)}-${pad(positions)}`,
      aisleLabels,
    };
  }, [aisles, aisleNaming, racks, shelves, positions]);

  // Mini rack preview for first aisle
  const rackPreview = useMemo(() => {
    const aisle = aisleNaming === 'letters' ? 'A' : '01';
    const rack = pad(1);
    const rows: { shelf: string; bins: string[] }[] = [];
    for (let s = Math.min(shelves, 6); s >= 1; s--) {
      const bins: string[] = [];
      for (let p = 1; p <= Math.min(positions, 6); p++) {
        bins.push(`${aisle}-${rack}-${pad(s)}-${pad(p)}`);
      }
      rows.push({ shelf: pad(s), bins });
    }
    return rows;
  }, [aisleNaming, shelves, positions, racks]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (totalLocations < 1) return;
    if (totalLocations > 2000) {
      setError('Cannot generate more than 2,000 locations at once. Reduce your numbers.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await api.post(`/warehouse/zones/${zoneId}/bins/generate`, {
        aisles,
        aisleNaming,
        racksPerAisle: racks,
        shelvesPerRack: shelves,
        positionsPerShelf: positions,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to generate locations. Please try again.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  if (!open) return null;

  const inputCls = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Generate Warehouse Locations</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Set up aisles, racks, shelves, and positions — we'll create all the labels for you.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="generate-form" onSubmit={handleGenerate} className="space-y-6">

            {/* Label Format Explainer */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">Location Label Format</p>
              <div className="flex items-center gap-1 text-sm font-mono font-bold">
                <span className="rounded bg-blue-500/15 px-2 py-0.5 text-blue-700">Aisle</span>
                <span className="text-muted-foreground">-</span>
                <span className="rounded bg-violet-500/15 px-2 py-0.5 text-violet-700">Rack</span>
                <span className="text-muted-foreground">-</span>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-700">Shelf</span>
                <span className="text-muted-foreground">-</span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-700">Position</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Example: <span className="font-mono font-semibold text-foreground">A-02-03-01</span> = Aisle A, Rack 02, Shelf 03 (from floor), Position 01
              </p>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">

              {/* Aisles */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Rows size={16} weight="duotone" className="text-blue-600" />
                  Aisles
                </label>
                <p className="mb-2 text-[11px] text-muted-foreground">Parallel rows in your warehouse</p>
                <input type="number" min={1} max={26} value={aisles} onChange={(e) => setAisles(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))} className={inputCls} />
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAisleNaming('letters')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      aisleNaming === 'letters' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Letters (A, B, C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAisleNaming('numbers')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      aisleNaming === 'numbers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Numbers (01, 02, 03)
                  </button>
                </div>
              </div>

              {/* Racks per Aisle */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <GridFour size={16} weight="duotone" className="text-violet-600" />
                  Racks per Aisle
                </label>
                <p className="mb-2 text-[11px] text-muted-foreground">Shelving units along each aisle</p>
                <input type="number" min={1} max={99} value={racks} onChange={(e) => setRacks(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))} className={inputCls} />
              </div>

              {/* Shelves per Rack */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Stack size={16} weight="duotone" className="text-amber-600" />
                  Shelf Levels per Rack
                </label>
                <p className="mb-2 text-[11px] text-muted-foreground">Vertical levels on each rack (counted from floor up)</p>
                <input type="number" min={1} max={20} value={shelves} onChange={(e) => setShelves(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className={inputCls} />
              </div>

              {/* Positions per Shelf */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin size={16} weight="duotone" className="text-emerald-600" />
                  Positions per Shelf
                </label>
                <p className="mb-2 text-[11px] text-muted-foreground">Bin slots on each shelf (left to right)</p>
                <input type="number" min={1} max={20} value={positions} onChange={(e) => setPositions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className={inputCls} />
              </div>
            </div>

            {/* Visual Rack Preview */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rack Preview — Aisle {preview.aisleLabels[0]}, Rack 01
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/40 bg-muted/20">
                <div className="min-w-fit">
                  {rackPreview.map((row, idx) => (
                    <div key={row.shelf} className={cn('flex items-center', idx > 0 && 'border-t border-border/20')}>
                      <div className="flex w-12 shrink-0 items-center justify-center self-stretch border-r border-border/30 bg-muted/40 py-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">Lv {row.shelf}</span>
                      </div>
                      <div className="flex gap-0 py-0.5 px-0.5">
                        {row.bins.map((label) => (
                          <div key={label} className="flex h-9 w-[72px] items-center justify-center border-r border-border/10 last:border-r-0">
                            <span className="font-mono text-[10px] font-medium text-muted-foreground">{label}</span>
                          </div>
                        ))}
                        {positions > 6 && (
                          <div className="flex h-9 w-10 items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/50">+{positions - 6}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Floor */}
                  <div className="h-2 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
                </div>
              </div>
              {shelves > 6 && (
                <p className="mt-1 text-[10px] text-muted-foreground/60">Showing first 6 of {shelves} shelves</p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">
                    {aisles} aisle{aisles !== 1 ? 's' : ''} x {racks} rack{racks !== 1 ? 's' : ''} x {shelves} shelf{shelves !== 1 ? '' : ''} x {positions} position{positions !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className={cn(
                  'text-lg font-bold',
                  totalLocations > 2000 ? 'text-red-500' : 'text-foreground',
                )}>
                  {totalLocations.toLocaleString()} locations
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Labels from <span className="font-mono font-semibold text-foreground">{preview.first}</span> to <span className="font-mono font-semibold text-foreground">{preview.last}</span>
              </p>
              {totalLocations > 2000 && (
                <p className="mt-1 text-xs text-red-500">Maximum 2,000 locations per batch. Reduce your numbers.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
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
            type="submit"
            form="generate-form"
            disabled={generating || totalLocations < 1 || totalLocations > 2000}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 disabled:opacity-50',
            )}
          >
            {generating && <CircleNotch size={16} className="animate-spin" />}
            {generating ? 'Generating...' : `Generate ${totalLocations.toLocaleString()} Locations`}
          </button>
        </div>
      </div>
    </div>
  );
}
