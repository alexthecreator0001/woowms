import { useState, useCallback, useEffect } from 'react';
import {
  FloppyDisk,
  ArrowCounterClockwise,
  Ruler,
  Cursor,
  Spinner,
} from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import api from '../../../services/api';
import type { Warehouse, FloorPlan, FloorPlanElement, FloorPlanElementType } from '../../../types';
import FloorPlanSetup from './FloorPlanSetup';
import FloorPlanGrid, { snap, rectsOverlap } from './FloorPlanGrid';
import ElementPalette, { getTemplate } from './ElementPalette';
import ElementProperties from './ElementProperties';

const EPS = 0.001;

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface FloorPlanEditorProps {
  warehouse: Warehouse;
  onSaved: () => void;
  highlightZoneId?: number | null;
  onViewZone?: (zoneId: number) => void;
  onZoneCreated?: (zoneId: number) => void;
}

export default function FloorPlanEditor({ warehouse, onSaved, highlightZoneId, onViewZone, onZoneCreated }: FloorPlanEditorProps) {
  const zones = warehouse.zones || [];

  // Floor plan state — on load, default missing unit to 'm' and filter out legacy aisle elements
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(() => {
    const raw = warehouse.floorPlan;
    if (!raw) return null;
    return {
      ...raw,
      unit: raw.unit || 'm',
      elements: raw.elements.filter((e) => e.type !== 'aisle' as string),
    };
  });
  const [history, setHistory] = useState<FloorPlan[]>([]);

  // Tool / selection state
  const [activeTool, setActiveTool] = useState<FloorPlanElementType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Create zone loading
  const [creatingZone, setCreatingZone] = useState(false);

  const pushHistory = useCallback((current: FloorPlan) => {
    setHistory((prev) => [...prev.slice(-20), current]);
  }, []);

  const updatePlan = useCallback(
    (updater: (plan: FloorPlan) => FloorPlan) => {
      setFloorPlan((prev) => {
        if (!prev) return prev;
        pushHistory(prev);
        setDirty(true);
        return updater(prev);
      });
    },
    [pushHistory],
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFloorPlan(prev);
    setDirty(true);
  };

  // Create floor plan
  const handleCreate = (width: number, height: number, unit: 'm' | 'ft') => {
    const newPlan: FloorPlan = { width, height, unit, elements: [] };
    setFloorPlan(newPlan);
    setDirty(true);
  };

  // Place element on grid
  const handleCellClick = (x: number, y: number) => {
    if (!activeTool || !floorPlan) return;
    const template = getTemplate(activeTool);
    const ew = template.defaultW;
    const eh = template.defaultH;

    // Check bounds
    if (x + ew > floorPlan.width + EPS || y + eh > floorPlan.height + EPS) return;

    // Check overlap using AABB (skip unplaced elements)
    const newRect = { x, y, w: ew, h: eh };
    const wouldOverlap = floorPlan.elements.some((el) => {
      if (el.x < 0 || el.y < 0) return false;
      const elW = el.rotation === 90 ? el.h : el.w;
      const elH = el.rotation === 90 ? el.w : el.h;
      return rectsOverlap(newRect, { x: el.x, y: el.y, w: elW, h: elH });
    });
    if (wouldOverlap) return;

    const newElement: FloorPlanElement = {
      id: generateId(),
      type: activeTool,
      label: `${template.label} ${floorPlan.elements.filter((e) => e.type === activeTool).length + 1}`,
      x: snap(x),
      y: snap(y),
      w: ew,
      h: eh,
      rotation: 0,
      zoneId: null,
    };

    updatePlan((plan) => ({
      ...plan,
      elements: [...plan.elements, newElement],
    }));
    setSelectedId(newElement.id);
    setActiveTool(null);
  };

  // Select element
  const handleElementClick = (id: string) => {
    setSelectedId(id);
    setActiveTool(null);
  };

  // Move element
  const handleElementMove = (id: string, x: number, y: number) => {
    if (!floorPlan) return;
    const el = floorPlan.elements.find((e) => e.id === id);
    if (!el) return;
    const ew = el.rotation === 90 ? el.h : el.w;
    const eh = el.rotation === 90 ? el.w : el.h;

    // Bounds check with snap
    const cx = snap(Math.max(0, Math.min(floorPlan.width - ew, x)));
    const cy = snap(Math.max(0, Math.min(floorPlan.height - eh, y)));
    if (Math.abs(cx - el.x) < 0.01 && Math.abs(cy - el.y) < 0.01) return;

    // Overlap check using AABB (skip unplaced elements)
    const movedRect = { x: cx, y: cy, w: ew, h: eh };
    const wouldOverlap = floorPlan.elements.some((other) => {
      if (other.id === id || other.x < 0 || other.y < 0) return false;
      const oW = other.rotation === 90 ? other.h : other.w;
      const oH = other.rotation === 90 ? other.w : other.h;
      return rectsOverlap(movedRect, { x: other.x, y: other.y, w: oW, h: oH });
    });
    if (wouldOverlap) return;

    setFloorPlan((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return {
        ...prev,
        elements: prev.elements.map((e) => (e.id === id ? { ...e, x: cx, y: cy } : e)),
      };
    });
  };

  // Update selected element
  const handleUpdateElement = (updated: FloorPlanElement) => {
    updatePlan((plan) => ({
      ...plan,
      elements: plan.elements.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  // Delete selected element
  const handleDeleteElement = () => {
    if (!selectedId) return;
    updatePlan((plan) => ({
      ...plan,
      elements: plan.elements.filter((e) => e.id !== selectedId),
    }));
    setSelectedId(null);
  };

  // Duplicate selected element
  const handleDuplicateElement = useCallback(() => {
    if (!selectedId || !floorPlan) return;
    const el = floorPlan.elements.find((e) => e.id === selectedId);
    if (!el) return;

    const ew = el.rotation === 90 ? el.h : el.w;
    const eh = el.rotation === 90 ? el.w : el.h;

    // Try offset +1 on x, then +1 on y
    let nx = snap(el.x + ew);
    let ny = el.y;
    if (nx + ew > floorPlan.width) {
      nx = el.x;
      ny = snap(el.y + eh);
    }
    if (ny + eh > floorPlan.height) return;

    const newRect = { x: nx, y: ny, w: ew, h: eh };
    const wouldOverlap = floorPlan.elements.some((other) => {
      if (other.x < 0 || other.y < 0) return false;
      const oW = other.rotation === 90 ? other.h : other.w;
      const oH = other.rotation === 90 ? other.w : other.h;
      return rectsOverlap(newRect, { x: other.x, y: other.y, w: oW, h: oH });
    });
    if (wouldOverlap) return;

    const newEl: FloorPlanElement = {
      ...el,
      id: generateId(),
      x: nx,
      y: ny,
      zoneId: null,
      label: el.label + ' (copy)',
    };

    updatePlan((plan) => ({
      ...plan,
      elements: [...plan.elements, newEl],
    }));
    setSelectedId(newEl.id);
  }, [selectedId, floorPlan, updatePlan]);

  // Ctrl/Cmd+D keyboard shortcut for duplicate
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateElement();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDuplicateElement]);

  // Highlight element linked to a zone (cross-tab navigation)
  useEffect(() => {
    if (highlightZoneId && floorPlan) {
      const el = floorPlan.elements.find((e) => e.zoneId === highlightZoneId);
      if (el) {
        setSelectedId(el.id);
        setActiveTool(null);
      }
    }
  }, [highlightZoneId, floorPlan]);

  // Auto-create zone for selected element, then auto-save the floor plan
  const handleCreateZone = async () => {
    if (!selectedId || !floorPlan) return;
    const element = floorPlan.elements.find((e) => e.id === selectedId);
    if (!element) return;

    setCreatingZone(true);
    try {
      const { data } = await api.post(`/warehouse/${warehouse.id}/floor-plan/auto-zone`, {
        elementType: element.type,
        label: element.label,
        shelvesCount: element.shelvesCount ?? 4,
        positionsPerShelf: element.positionsPerShelf ?? 3,
      });
      const zone = data.data.zone;

      // Update element with zone link and auto-save floor plan so link persists
      const updatedElements = floorPlan.elements.map((e) =>
        e.id === element.id ? { ...e, zoneId: zone.id } : e,
      );
      const updatedPlan = { ...floorPlan, elements: updatedElements };
      await api.put(`/warehouse/${warehouse.id}/floor-plan`, updatedPlan);
      setFloorPlan(updatedPlan);
      setDirty(false);
      onSaved();
      onZoneCreated?.(zone.id);
    } catch {
      // handled by interceptor
    } finally {
      setCreatingZone(false);
    }
  };

  // Save floor plan — auto-create zones for any unlinked elements
  const handleSave = async () => {
    if (!floorPlan) return;
    setSaving(true);
    try {
      // Find elements that should have zones but don't yet
      let updatedElements = [...floorPlan.elements];
      const unlinked = updatedElements.filter(
        (e) => !e.zoneId && getTemplate(e.type).hasZone,
      );

      // Auto-create zones for unlinked elements
      for (const element of unlinked) {
        try {
          const { data } = await api.post(`/warehouse/${warehouse.id}/floor-plan/auto-zone`, {
            elementType: element.type,
            label: element.label,
            shelvesCount: element.shelvesCount ?? 4,
            positionsPerShelf: element.positionsPerShelf ?? 3,
          });
          const zone = data.data.zone;
          updatedElements = updatedElements.map((e) =>
            e.id === element.id ? { ...e, zoneId: zone.id } : e,
          );
        } catch {
          // skip this element if zone creation fails, save the rest
        }
      }

      const planToSave = { ...floorPlan, elements: updatedElements };
      await api.put(`/warehouse/${warehouse.id}/floor-plan`, planToSave);
      setFloorPlan(planToSave);
      setDirty(false);
      onSaved();
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  // No floor plan yet — show setup
  if (!floorPlan) {
    return <FloorPlanSetup onCreate={handleCreate} />;
  }

  const selectedElement = floorPlan.elements.find((e) => e.id === selectedId) || null;
  const unitLabel = floorPlan.unit || 'm';

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Ruler size={15} />
            <span className="font-medium text-foreground">{floorPlan.width}</span>
            <span>&times;</span>
            <span className="font-medium text-foreground">{floorPlan.height}</span>
            <span>{unitLabel}</span>
          </div>
          <span className="h-4 w-px bg-border/60" />
          <span className="text-xs text-muted-foreground">
            {floorPlan.elements.filter((e) => e.x >= 0 && e.y >= 0).length} element{floorPlan.elements.filter((e) => e.x >= 0 && e.y >= 0).length !== 1 ? 's' : ''}
            {floorPlan.elements.some((e) => e.x < 0 || e.y < 0) && (
              <span className="ml-1 text-amber-500">
                ({floorPlan.elements.filter((e) => e.x < 0 || e.y < 0).length} unplaced)
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => { setActiveTool(null); setSelectedId(null); }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
              !activeTool && !selectedId
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Cursor size={13} />
            Select
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <ArrowCounterClockwise size={16} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              dirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {saving ? (
              <Spinner size={14} className="animate-spin" />
            ) : (
              <FloppyDisk size={14} />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main layout: palette | grid | properties */}
      <div className="flex gap-3" style={{ minHeight: 500 }}>
        {/* Left sidebar — palette */}
        <div className="w-44 shrink-0 rounded-xl border border-border/60 bg-card p-3 shadow-sm overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <ElementPalette activeTool={activeTool} onSelect={setActiveTool} />
        </div>

        {/* Center — grid */}
        <div className="flex-1 min-w-0">
          <FloorPlanGrid
            width={floorPlan.width}
            height={floorPlan.height}
            unit={unitLabel}
            elements={floorPlan.elements}
            selectedId={selectedId}
            activeTool={activeTool}
            onCellClick={handleCellClick}
            onElementClick={handleElementClick}
            onElementMove={handleElementMove}
          />
        </div>

        {/* Right sidebar — properties */}
        <div className="w-56 shrink-0 rounded-xl border border-border/60 bg-card p-3 shadow-sm overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {selectedElement ? (
            <ElementProperties
              element={selectedElement}
              zones={zones}
              gridWidth={floorPlan.width}
              gridHeight={floorPlan.height}
              unit={unitLabel}
              onUpdate={handleUpdateElement}
              onDelete={handleDeleteElement}
              onDuplicate={handleDuplicateElement}
              onCreateZone={handleCreateZone}
              onViewZone={onViewZone}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Cursor size={20} className="text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Select an element to edit its properties, or pick a tool from the palette to place new elements.
              </p>
            </div>
          )}
        </div>
      </div>

      {creatingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 shadow-lg border border-border/60">
            <Spinner size={16} className="animate-spin text-primary" />
            <span className="text-sm">Creating zone...</span>
          </div>
        </div>
      )}
    </div>
  );
}
