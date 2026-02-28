import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const ZONE_TYPES = [
  'RECEIVING',
  'STORAGE',
  'PICKING',
  'PACKING',
  'SHIPPING',
  'RETURNS',
] as const;

type ZoneType = (typeof ZONE_TYPES)[number];

interface ZoneData {
  id: number;
  name: string;
  type: string;
  description: string | null;
}

interface ZoneModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  warehouseId: number;
  zone?: ZoneData | null;
}

export default function ZoneModal({
  open,
  onClose,
  onSaved,
  warehouseId,
  zone,
}: ZoneModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('STORAGE');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!zone;

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (open) {
      if (zone) {
        setName(zone.name);
        setType(zone.type as ZoneType);
        setDescription(zone.description ?? '');
      } else {
        setName('');
        setType('STORAGE');
        setDescription('');
      }
      setError(null);
    }
  }, [open, zone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Zone name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: trimmedName,
        type,
        description: description.trim() || null,
      };

      if (isEdit) {
        await api.patch(`/warehouse/zones/${zone!.id}`, payload);
      } else {
        await api.post(`/warehouse/${warehouseId}/zones`, payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to save zone. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Zone' : 'Create Zone'}
          </h2>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="zone-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="zone-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zone A - Main Storage"
              className={cn(
                'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
              )}
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="zone-type"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Type
            </label>
            <select
              id="zone-type"
              value={type}
              onChange={(e) => setType(e.target.value as ZoneType)}
              className={cn(
                'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
              )}
            >
              {ZONE_TYPES.map((zt) => (
                <option key={zt} value={zt}>
                  {zt.charAt(0) + zt.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="zone-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="zone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this zone"
              rows={3}
              className={cn(
                'min-h-[80px] w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
              disabled={saving}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50'
              )}
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
