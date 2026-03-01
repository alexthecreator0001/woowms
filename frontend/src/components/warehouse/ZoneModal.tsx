import { useState, useEffect } from 'react';
import { X, ArrowLeft } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { ELEMENT_TEMPLATES, getTemplate } from './floorplan/ElementPalette';
import type { FloorPlanElementType } from '../../types';

interface ZoneModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  warehouseId: number;
}

export default function ZoneModal({
  open,
  onClose,
  onSaved,
  warehouseId,
}: ZoneModalProps) {
  const [selectedType, setSelectedType] = useState<FloorPlanElementType | null>(null);
  const [label, setLabel] = useState('');
  const [prefix, setPrefix] = useState('');
  const [shelves, setShelves] = useState(4);
  const [positions, setPositions] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setLabel('');
      setPrefix('');
      setShelves(4);
      setPositions(3);
      setError(null);
    }
  }, [open]);

  // Auto-set label when type is selected
  const handleSelectType = (type: FloorPlanElementType) => {
    setSelectedType(type);
    const tpl = getTemplate(type);
    setLabel(tpl.label);
    setPrefix(tpl.label.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase());
  };

  const handleCreate = async () => {
    if (!selectedType || !label.trim()) {
      setError('Label is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create zone + bins via auto-zone API
      const { data } = await api.post(`/warehouse/${warehouseId}/floor-plan/auto-zone`, {
        elementType: selectedType,
        label: label.trim(),
        prefix: prefix.trim() || undefined,
        shelvesCount: shelves,
        positionsPerShelf: positions,
      });
      const zone = data.data.zone;

      // Add element to floor plan JSONB (unplaced — user positions it in Floor Plan tab)
      try {
        const whRes = await api.get('/warehouse');
        const wh = (whRes.data.data as any[]).find((w: any) => w.id === warehouseId);
        const floorPlan = wh?.floorPlan;
        if (floorPlan) {
          const newElement = {
            id: Math.random().toString(36).substring(2) + Date.now().toString(36),
            type: selectedType,
            label: label.trim(),
            x: -1,
            y: -1,
            w: getTemplate(selectedType).defaultW,
            h: getTemplate(selectedType).defaultH,
            rotation: 0,
            zoneId: zone.id,
            prefix: prefix.trim() || undefined,
            shelvesCount: shelves,
            positionsPerShelf: positions,
          };
          await api.put(`/warehouse/${warehouseId}/floor-plan`, {
            ...floorPlan,
            elements: [...floorPlan.elements, newElement],
          });
        }
      } catch {
        // Floor plan save is best-effort — zone was already created
      }

      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const zonableTemplates = ELEMENT_TEMPLATES.filter((t) => t.hasZone);
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
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedType && (
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {selectedType ? 'Configure' : 'Add Element'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {!selectedType ? (
          /* Step 1: Pick element type */
          <div className="grid grid-cols-2 gap-2">
            {zonableTemplates.map((tpl) => (
              <button
                key={tpl.type}
                type="button"
                onClick={() => handleSelectType(tpl.type)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border/40 px-3 py-3 text-left transition-all',
                  'hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tpl.bgClass, tpl.textClass)}>
                  {tpl.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{tpl.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tpl.defaultW}&times;{tpl.defaultH} {tpl.type === 'dock_door' ? '' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Configure */
          <div className="space-y-4">
            {/* Type preview */}
            {(() => {
              const tpl = getTemplate(selectedType);
              return (
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tpl.bgClass, tpl.textClass)}>
                    {tpl.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tpl.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {shelves} shelves &times; {positions} positions = {shelves * positions} locations
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Label */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (!prefix || prefix === label.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase()) {
                    setPrefix(e.target.value.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase());
                  }
                }}
                placeholder="e.g. Shelving Rack A"
                className={inputClasses}
              />
            </div>

            {/* Prefix */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 5))}
                maxLength={5}
                placeholder="e.g. SHE"
                className={inputClasses}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Location codes will look like: <span className="font-mono font-medium text-foreground">{prefix || 'LOC'}-01-01</span>
              </p>
            </div>

            {/* Shelves + Positions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Shelves</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={shelves}
                  onChange={(e) => setShelves(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Positions / shelf</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={positions}
                  onChange={(e) => setPositions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm">
              <span className="font-semibold">{shelves * positions}</span>
              <span className="text-muted-foreground"> locations will be created</span>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !label.trim()}
                className={cn(
                  'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                  'hover:bg-primary/90 disabled:opacity-50',
                )}
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
