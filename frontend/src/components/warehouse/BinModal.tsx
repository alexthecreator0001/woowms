import { useState, useEffect, type FormEvent } from 'react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface Bin {
  id: number;
  label: string;
  row: string | null;
  shelf: string | null;
  position: string | null;
  capacity: number | null;
  isActive: boolean;
  _stockCount?: number;
}

interface BinModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  bin: Bin | null;
}

export default function BinModal({ open, onClose, onSaved, bin }: BinModalProps) {
  const [label, setLabel] = useState('');
  const [row, setRow] = useState('');
  const [shelf, setShelf] = useState('');
  const [position, setPosition] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stockCount = bin?._stockCount ?? 0;
  const hasStock = stockCount > 0;

  useEffect(() => {
    if (bin) {
      setLabel(bin.label);
      setRow(bin.row ?? '');
      setShelf(bin.shelf ?? '');
      setPosition(bin.position ?? '');
      setCapacity(bin.capacity != null ? String(bin.capacity) : '');
      setIsActive(bin.isActive);
    }
  }, [bin]);

  if (!open || !bin) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setSaving(true);

    try {
      await api.patch(`/warehouse/bins/${bin.id}`, {
        label: label.trim(),
        row: row.trim() || null,
        shelf: shelf.trim() || null,
        position: position.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        isActive,
      });

      onSaved();
      onClose();
    } catch {
      // errors handled by axios interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (hasStock) return;

    setDeleting(true);

    try {
      await api.delete(`/warehouse/bins/${bin.id}`);
      onSaved();
      onClose();
    } catch {
      // errors handled by axios interceptor
    } finally {
      setDeleting(false);
    }
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Edit Location</h2>

        {/* Stock count info */}
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{bin.label}</span> — {stockCount} item{stockCount !== 1 ? 's' : ''} stored
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Label */}
          <div>
            <label
              htmlFor="bin-label"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Label
            </label>
            <input
              id="bin-label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. A-01-03"
              className={inputClasses}
            />
          </div>

          {/* Row / Shelf / Position — 3-column grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="bin-row"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Row
              </label>
              <input
                id="bin-row"
                type="text"
                value={row}
                onChange={(e) => setRow(e.target.value)}
                placeholder="A"
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="bin-shelf"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Shelf
              </label>
              <input
                id="bin-shelf"
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="01"
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="bin-position"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Position
              </label>
              <input
                id="bin-position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="03"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label
              htmlFor="bin-capacity"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Capacity
            </label>
            <input
              id="bin-capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Optional"
              className={inputClasses}
            />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Active</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Delete button — left side */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleDelete}
                disabled={hasStock || deleting}
                className={cn(
                  'rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600',
                  'hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {deleting ? 'Deleting\u2026' : 'Delete'}
              </button>
              {hasStock && (
                <span
                  className={cn(
                    'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                    'whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground',
                    'border border-border/60 shadow-md opacity-0 group-hover:opacity-100 transition-opacity',
                  )}
                >
                  Cannot delete bin with stock
                </span>
              )}
            </div>

            {/* Cancel + Save — right side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'rounded-lg border border-border/60 px-4 py-2 text-sm font-medium',
                  'hover:bg-muted',
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !label.trim()}
                className={cn(
                  'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                  'hover:bg-primary/90 disabled:opacity-50',
                )}
              >
                {saving ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
