import { useState } from 'react';
import {
  Trash,
  ArrowsClockwise,
  LinkSimple,
  Plus,
  MapPin,
  CopySimple,
  Stack,
  ArrowRight,
} from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import { getTemplate } from './ElementPalette';
import type { FloorPlanElement, Zone, BinSize } from '../../../types';
import { BIN_SIZE_LABELS } from '../../../types';

interface ElementPropertiesProps {
  element: FloorPlanElement;
  zones: Zone[];
  gridWidth: number;
  gridHeight: number;
  unit: string;
  onUpdate: (updated: FloorPlanElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCreateZone: () => void;
  onViewZone?: (zoneId: number) => void;
}

export default function ElementProperties({
  element,
  zones,
  gridWidth,
  gridHeight,
  unit,
  onUpdate,
  onDelete,
  onDuplicate,
  onCreateZone,
  onViewZone,
}: ElementPropertiesProps) {
  const template = getTemplate(element.type);
  const linkedZone = zones.find((z) => z.id === element.zoneId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  const effectiveW = element.rotation === 90 ? element.h : element.w;
  const effectiveH = element.rotation === 90 ? element.w : element.h;
  const maxW = Math.round((gridWidth - element.x) * 10) / 10;
  const maxH = Math.round((gridHeight - element.y) * 10) / 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', template.bgClass, template.textClass)}>
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{element.label}</p>
          <p className="text-[11px] text-muted-foreground">{template.label}</p>
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Label</label>
        <input
          type="text"
          value={element.label}
          onChange={(e) => onUpdate({ ...element, label: e.target.value })}
          className={inputClasses}
        />
      </div>

      {/* Dimensions */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Size (w &times; h {unit})
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0.1}
            max={maxW}
            step="0.1"
            value={effectiveW}
            onChange={(e) => {
              const v = Math.max(0.1, Math.min(maxW, parseFloat(e.target.value) || 0.1));
              onUpdate({
                ...element,
                w: element.rotation === 90 ? element.w : v,
                h: element.rotation === 90 ? v : element.h,
              });
            }}
            className={cn(inputClasses, 'w-16 text-center')}
          />
          <span className="text-xs text-muted-foreground">&times;</span>
          <input
            type="number"
            min={0.1}
            max={maxH}
            step="0.1"
            value={effectiveH}
            onChange={(e) => {
              const v = Math.max(0.1, Math.min(maxH, parseFloat(e.target.value) || 0.1));
              onUpdate({
                ...element,
                w: element.rotation === 90 ? v : element.w,
                h: element.rotation === 90 ? element.h : v,
              });
            }}
            className={cn(inputClasses, 'w-16 text-center')}
          />
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Rotation</label>
        <button
          type="button"
          onClick={() => {
            const newRotation = element.rotation === 0 ? 90 : 0;
            const newEffW = newRotation === 90 ? element.h : element.w;
            const newEffH = newRotation === 90 ? element.w : element.h;
            if (element.x + newEffW <= gridWidth && element.y + newEffH <= gridHeight) {
              onUpdate({ ...element, rotation: newRotation as 0 | 90 });
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <ArrowsClockwise size={14} />
          {element.rotation === 0 ? '0°' : '90°'} — Click to rotate
        </button>
      </div>

      {/* Zone Link */}
      {template.hasZone && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Linked Zone</label>
          {/* Storage Setup — always shown */}
          <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Stack size={13} className="text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">Storage Setup</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-muted-foreground">Shelves</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={element.shelvesCount ?? 4}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                    onUpdate({ ...element, shelvesCount: v });
                  }}
                  className={cn(inputClasses, 'text-center !py-1')}
                />
                <p className="mt-0.5 text-[9px] text-muted-foreground/70">Levels (floor→top)</p>
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-muted-foreground">Positions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={element.positionsPerShelf ?? 3}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                    onUpdate({ ...element, positionsPerShelf: v });
                  }}
                  className={cn(inputClasses, 'text-center !py-1')}
                />
                <p className="mt-0.5 text-[9px] text-muted-foreground/70">Slots (left→right)</p>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
              {(element.shelvesCount ?? 4) * (element.positionsPerShelf ?? 3)} locations
              {linkedZone ? '' : ' will be created'}
            </p>
            <div className="mt-2 pt-2 border-t border-border/30">
              <label className="mb-0.5 block text-[10px] text-muted-foreground">Location Size</label>
              <select
                value={element.binSize || 'MEDIUM'}
                onChange={(e) => onUpdate({ ...element, binSize: e.target.value as BinSize })}
                className={cn(inputClasses, '!py-1 text-[11px]')}
              >
                {(Object.keys(BIN_SIZE_LABELS) as BinSize[]).map((size) => (
                  <option key={size} value={size}>{BIN_SIZE_LABELS[size]}</option>
                ))}
              </select>
            </div>
          </div>

          {linkedZone ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                <LinkSimple size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{linkedZone.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {linkedZone.type} — {linkedZone.bins?.length || 0} locations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...element, zoneId: null })}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Unlink
                </button>
              </div>
              {onViewZone && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onViewZone(linkedZone.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View zone
                    <ArrowRight size={11} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value=""
                onChange={(e) => {
                  const zoneId = parseInt(e.target.value);
                  if (zoneId) onUpdate({ ...element, zoneId });
                }}
                className={inputClasses}
              >
                <option value="">Link existing zone...</option>
                {zones.filter((z) => z.id !== element.zoneId).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.type})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onCreateZone}
                className={cn(
                  'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60',
                  'px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors',
                )}
              >
                <Plus size={14} />
                Create Zone
              </button>
            </div>
          )}
        </div>
      )}

      {/* Position */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin size={12} />
        Position: ({element.x}, {element.y})
      </div>

      {/* Duplicate */}
      <button
        type="button"
        onClick={onDuplicate}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Duplicate (Ctrl+D)"
      >
        <CopySimple size={14} />
        Duplicate
      </button>

      {/* Delete */}
      <div className="pt-2 border-t border-border/40">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive">Delete this element?</span>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-border/60 px-2.5 py-1 text-xs hover:bg-muted"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash size={14} />
            Delete Element
          </button>
        )}
      </div>
    </div>
  );
}
