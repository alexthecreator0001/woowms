import { useState, useEffect, type FormEvent } from 'react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface Warehouse {
  id: number;
  name: string;
  address: string | null;
  isDefault: boolean;
}

interface WarehouseModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  warehouse?: Warehouse | null;
}

export default function WarehouseModal({
  open,
  onClose,
  onSaved,
  warehouse,
}: WarehouseModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!warehouse;

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setAddress(warehouse.address ?? '');
      setIsDefault(warehouse.isDefault);
    } else {
      setName('');
      setAddress('');
      setIsDefault(false);
    }
  }, [warehouse]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        isDefault,
      };

      if (isEdit) {
        await api.patch(`/warehouse/${warehouse.id}`, payload);
      } else {
        await api.post('/warehouse', payload);
      }

      onSaved();
      onClose();
    } catch {
      // errors handled by axios interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          {isEdit ? 'Edit Warehouse' : 'New Warehouse'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="wh-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Name
            </label>
            <input
              id="wh-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Warehouse"
              className={cn(
                'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
              )}
            />
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="wh-address"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Address
            </label>
            <input
              id="wh-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              className={cn(
                'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
              )}
            />
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Set as default warehouse</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              disabled={saving || !name.trim()}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
