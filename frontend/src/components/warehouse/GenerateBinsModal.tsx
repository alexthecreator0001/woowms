import { useState, useEffect, useMemo } from 'react';
import { X, CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface GenerateBinsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  zoneId: number;
}

export default function GenerateBinsModal({
  open,
  onClose,
  onSaved,
  zoneId,
}: GenerateBinsModalProps) {
  const [prefix, setPrefix] = useState('A');
  const [rows, setRows] = useState(4);
  const [positions, setPositions] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPrefix('A');
      setRows(4);
      setPositions(6);
      setError(null);
    }
  }, [open]);

  // Generate preview labels
  const labels = useMemo(() => {
    const result: string[] = [];
    const trimmedPrefix = prefix.trim();
    if (!trimmedPrefix || rows <= 0 || positions <= 0) return result;

    for (let r = 1; r <= rows; r++) {
      for (let p = 1; p <= positions; p++) {
        const row = String(r).padStart(2, '0');
        const pos = String(p).padStart(2, '0');
        result.push(`${trimmedPrefix}-${row}-${pos}`);
      }
    }
    return result;
  }, [prefix, rows, positions]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    const trimmedPrefix = prefix.trim();
    if (!trimmedPrefix) {
      setError('Prefix is required.');
      return;
    }
    if (rows <= 0 || positions <= 0) {
      setError('Rows and positions must be greater than 0.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await api.post(`/warehouse/zones/${zoneId}/bins/generate`, {
        prefix: trimmedPrefix,
        rows,
        positions,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const message =
          err?.response?.data?.message ||
          'Some bin labels already exist in this zone. Please use a different prefix.';
        setError(message);
      } else {
        const message =
          err?.response?.data?.message || 'Failed to generate bins. Please try again.';
        setError(message);
      }
    } finally {
      setGenerating(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generate Bins</h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-lg p-1.5 text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-foreground'
            )}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Prefix */}
          <div>
            <label
              htmlFor="bin-prefix"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Prefix <span className="text-destructive">*</span>
            </label>
            <input
              id="bin-prefix"
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. A"
              className={cn(
                'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
              )}
            />
          </div>

          {/* Rows + Positions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bin-rows"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Number of Rows
              </label>
              <input
                id="bin-rows"
                type="number"
                min={1}
                max={99}
                value={rows}
                onChange={(e) => setRows(Math.max(0, parseInt(e.target.value) || 0))}
                className={cn(
                  'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
                )}
              />
            </div>
            <div>
              <label
                htmlFor="bin-positions"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Positions per Row
              </label>
              <input
                id="bin-positions"
                type="number"
                min={1}
                max={99}
                value={positions}
                onChange={(e) => setPositions(Math.max(0, parseInt(e.target.value) || 0))}
                className={cn(
                  'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
                )}
              />
            </div>
          </div>

          {/* Preview */}
          {labels.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Preview
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {labels.length} bin{labels.length !== 1 ? 's' : ''} will be created
              </p>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-lg border border-border/60 px-4 py-2 text-sm font-medium',
                'hover:bg-muted'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || labels.length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50'
              )}
            >
              {generating && <CircleNotch size={16} className="animate-spin" />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
