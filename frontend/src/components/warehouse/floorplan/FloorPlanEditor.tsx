import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FloppyDisk,
  ArrowCounterClockwise,
  Ruler,
  Cursor,
  Spinner,
} from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import api from '../../../services/api';
import type { Warehouse, FloorPlan, FloorPlanElement, FloorPlanElementType, Zone } from '../../../types';
import FloorPlanSetup from './FloorPlanSetup';
import FloorPlanGrid from './FloorPlanGrid';
import ElementPalette, { getTemplate } from './ElementPalette';
import ElementProperties from './ElementProperties';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface FloorPlanEditorProps {
  warehouse: Warehouse;
  onSaved: () => void;
}

export default function FloorPlanEditor({ warehouse, onSaved }: FloorPlanEditorProps) {
  const navigate = useNavigate();
  const zones = warehouse.zones || [];

  // Floor plan state
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(warehouse.floorPlan || null);
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
  const handleCreate = (width: number, height: number) => {
    const newPlan: FloorPlan = { width, height, elements: [] };
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
    if (x + ew > floorPlan.width || y + eh > floorPlan.height) return;

    // Check overlap
    const wouldOverlap = floorPlan.elements.some((el) => {
      const elW = el.rotation === 90 ? el.h : el.w;
      const elH = el.rotation === 90 ? el.w : el.h;
      return !(x + ew <= el.x || x >= el.x + elW || y + eh <= el.y || y >= el.y + elH);
    });
    if (wouldOverlap) return;

    const newElement: FloorPlanElement = {
      id: generateId(),
      type: activeTool,
      label: `${template.label} ${floorPlan.elements.filter((e) => e.type === activeTool).length + 1}`,
      x,
      y,
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

    // Bounds check
    const cx = Math.max(0, Math.min(floorPlan.width - ew, x));
    const cy = Math.max(0, Math.min(floorPlan.height - eh, y));
    if (cx === el.x && cy === el.y) return;

    // Overlap check
    const wouldOverlap = floorPlan.elements.some((other) => {
      if (other.id === id) return false;
      const oW = other.rotation === 90 ? other.h : other.w;
      const oH = other.rotation === 90 ? other.w : other.h;
      return !(cx + ew <= other.x || cx >= other.x + oW || cy + eh <= other.y || cy >= other.y + oH);
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

  // Auto-create zone for selected element
  const handleCreateZone = async () => {
    if (!selectedId || !floorPlan) return;
    const element = floorPlan.elements.find((e) => e.id === selectedId);
    if (!element) return;

    setCreatingZone(true);
    try {
      const { data } = await api.post(`/warehouse/${warehouse.id}/floor-plan/auto-zone`, {
        elementType: element.type,
        label: element.label,
        shelvesCount: 4,
        positionsPerShelf: 3,
      });
      const zone = data.data.zone;
      // Link the zone to the element
      handleUpdateElement({ ...element, zoneId: zone.id });
      onSaved(); // Refresh warehouse data to pick up new zone
    } catch {
      // handled by interceptor
    } finally {
      setCreatingZone(false);
    }
  };

  // Save floor plan
  const handleSave = async () => {
    if (!floorPlan) return;
    setSaving(true);
    try {
      await api.put(`/warehouse/${warehouse.id}/floor-plan`, floorPlan);
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
            <span>m</span>
          </div>
          <span className="h-4 w-px bg-border/60" />
          <span className="text-xs text-muted-foreground">
            {floorPlan.elements.length} element{floorPlan.elements.length !== 1 ? 's' : ''}
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
              onUpdate={handleUpdateElement}
              onDelete={handleDeleteElement}
              onCreateZone={handleCreateZone}
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
