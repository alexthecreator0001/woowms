import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  PencilSimple,
  Trash,
  Star,
  MapPin,
  ListBullets,
  GridFour,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useSidebar } from '../contexts/SidebarContext';
import type { Warehouse, Zone, ZoneType, FloorPlanElement } from '../types';
import ZoneSummaryCard from '../components/warehouse/ZoneSummaryCard';
import UtilizationBar from '../components/warehouse/UtilizationBar';
import SlideOver from '../components/warehouse/SlideOver';
import ZoneModal from '../components/warehouse/ZoneModal';
import PrintLabelsModal from '../components/warehouse/PrintLabelsModal';
import FloorPlanEditor from '../components/warehouse/floorplan/FloorPlanEditor';
import { getTemplate } from '../components/warehouse/floorplan/ElementPalette';

const ZONE_TYPES: ZoneType[] = ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'RETURNS'];

const zoneBarColor: Record<string, string> = {
  STORAGE: 'bg-blue-500',
  PICKING: 'bg-violet-500',
  RECEIVING: 'bg-amber-500',
  PACKING: 'bg-orange-500',
  SHIPPING: 'bg-emerald-500',
  RETURNS: 'bg-red-500',
};

export default function WarehouseDetail() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ZoneType | 'ALL'>('ALL');

  // Edit warehouse slide-over
  const [editSlideOpen, setEditSlideOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Element editing slide-over
  const [editZoneSlideOpen, setEditZoneSlideOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingElement, setEditingElement] = useState<FloorPlanElement | null>(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [editShelves, setEditShelves] = useState(4);
  const [editPositions, setEditPositions] = useState(3);
  const [editZoneSaving, setEditZoneSaving] = useState(false);
  const [editZoneError, setEditZoneError] = useState<string | null>(null);

  // Create zone modal
  const [createZoneOpen, setCreateZoneOpen] = useState(false);

  // Print labels modal
  const [printZone, setPrintZone] = useState<Zone | null>(null);

  // Tab: 'zones' or 'floorplan'
  const [activeTab, setActiveTab] = useState<'zones' | 'floorplan'>('zones');

  // Cross-tab navigation: highlight element linked to a zone
  const [highlightZoneId, setHighlightZoneId] = useState<number | null>(null);

  // Auto-collapse sidebar on floor plan tab for more editing space
  const { collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed } = useSidebar();
  useEffect(() => {
    if (activeTab === 'floorplan') {
      const wasCollapsed = sidebarCollapsed;
      setSidebarCollapsed(true);
      return () => { setSidebarCollapsed(wasCollapsed); };
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWarehouse = useCallback(() => {
    if (!warehouseId) return;
    setLoading(true);
    api.get('/warehouse')
      .then(({ data }) => {
        const wh = (data.data as Warehouse[]).find((w) => w.id === Number(warehouseId));
        setWarehouse(wh || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [warehouseId]);

  useEffect(() => {
    fetchWarehouse();
  }, [fetchWarehouse]);

  const zones = warehouse?.zones || [];

  // Zone type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const z of zones) {
      counts[z.type] = (counts[z.type] || 0) + 1;
    }
    return counts;
  }, [zones]);

  // Filtered zones
  const filteredZones = typeFilter === 'ALL' ? zones : zones.filter((z) => z.type === typeFilter);

  // Aggregate utilization
  const totalBins = zones.reduce((sum, z) => sum + (z.bins?.length || 0), 0);
  const occupiedBins = zones.reduce(
    (sum, z) => sum + (z.bins?.filter((b) => (b._stockCount ?? 0) > 0).length || 0),
    0,
  );

  // Utilization segments per zone type
  const utilizationSegments = useMemo(() => {
    return zones.reduce<{ type: string; occupied: number }[]>((acc, z) => {
      const occ = z.bins?.filter((b) => (b._stockCount ?? 0) > 0).length || 0;
      if (occ > 0) {
        const existing = acc.find((s) => s.type === z.type);
        if (existing) existing.occupied += occ;
        else acc.push({ type: z.type, occupied: occ });
      }
      return acc;
    }, []).map((s) => ({
      value: s.occupied,
      color: zoneBarColor[s.type] || 'bg-gray-500',
      label: s.type.charAt(0) + s.type.slice(1).toLowerCase(),
    }));
  }, [zones]);

  // Map zone IDs to their floor plan element
  const floorPlanZoneMap = useMemo(() => {
    const map = new Map<number, FloorPlanElement>();
    const elements = warehouse?.floorPlan?.elements || [];
    for (const el of elements) {
      if (el.zoneId) map.set(el.zoneId, el);
    }
    return map;
  }, [warehouse]);

  // Cross-tab navigation handlers
  const handleViewZoneFromFloorPlan = (zoneId: number) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      setTypeFilter(zone.type);
    }
    setHighlightZoneId(null);
    setActiveTab('zones');
  };

  // When a zone is created from floor plan, switch to zones tab to show it
  const handleZoneCreatedFromFloorPlan = (zoneId: number) => {
    setTypeFilter('ALL');
    setActiveTab('zones');
  };

  // Edit warehouse handlers
  const openEditWarehouse = () => {
    if (!warehouse) return;
    setEditName(warehouse.name);
    setEditAddress(warehouse.address ?? '');
    setEditIsDefault(warehouse.isDefault);
    setEditSlideOpen(true);
  };

  const handleEditWarehouseSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse || !editName.trim()) return;
    setEditSaving(true);
    try {
      await api.patch(`/warehouse/${warehouse.id}`, {
        name: editName.trim(),
        address: editAddress.trim() || null,
        isDefault: editIsDefault,
      });
      setEditSlideOpen(false);
      fetchWarehouse();
    } catch {
      // handled by interceptor
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!warehouse) return;
    const hasStock = zones.some((z) => z.bins?.some((b) => (b._stockCount ?? 0) > 0));
    if (hasStock) {
      alert('Cannot delete warehouse with stocked bins. Move or clear all inventory first.');
      return;
    }
    if (!confirm(`Delete "${warehouse.name}" and all its zones and locations? This cannot be undone.`)) return;
    try {
      await api.delete(`/warehouse/${warehouse.id}`);
      navigate('/warehouse');
    } catch {
      // handled by interceptor
    }
  };

  // Element edit handlers
  const handleEditZone = (zone: Zone) => {
    const el = floorPlanZoneMap.get(zone.id) || null;
    setEditingZone(zone);
    setEditingElement(el);
    setEditZoneName(zone.name);
    setEditPrefix(el?.prefix ?? '');
    setEditShelves(el?.shelvesCount ?? 4);
    setEditPositions(el?.positionsPerShelf ?? 3);
    setEditZoneError(null);
    setEditZoneSlideOpen(true);
  };

  const handleEditZoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !editZoneName.trim()) {
      setEditZoneError('Name is required.');
      return;
    }
    setEditZoneSaving(true);
    setEditZoneError(null);
    try {
      // Update zone name
      await api.patch(`/warehouse/zones/${editingZone.id}`, {
        name: editZoneName.trim(),
      });

      // Update floor plan element (label + config) if linked
      if (editingElement && warehouse?.floorPlan) {
        const updatedElements = warehouse.floorPlan.elements.map((el) =>
          el.id === editingElement.id
            ? { ...el, label: editZoneName.trim(), prefix: editPrefix.trim() || undefined, shelvesCount: editShelves, positionsPerShelf: editPositions }
            : el,
        );
        await api.put(`/warehouse/${warehouse.id}/floor-plan`, {
          ...warehouse.floorPlan,
          elements: updatedElements,
        });
      }

      setEditZoneSlideOpen(false);
      fetchWarehouse();
    } catch (err: any) {
      setEditZoneError(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setEditZoneSaving(false);
    }
  };

  const handleDeleteZone = async (zone: Zone) => {
    const bins = zone.bins || [];
    const hasStock = bins.some((b) => (b._stockCount ?? 0) > 0);
    if (hasStock) {
      alert('Cannot delete zone with stocked bins. Move or clear all inventory first.');
      return;
    }
    if (!confirm(`Delete zone "${zone.name}" and all ${bins.length} locations? This cannot be undone.`)) return;
    try {
      await api.delete(`/warehouse/zones/${zone.id}`);
      fetchWarehouse();
    } catch {
      // handled by interceptor
    }
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/warehouse')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Warehouses
        </button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16">
          <p className="text-sm text-muted-foreground">Warehouse not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/warehouse')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Warehouses
      </button>

      {/* Warehouse header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{warehouse.name}</h2>
            {warehouse.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                <Star size={13} weight="fill" />
                Default
              </span>
            )}
          </div>
          {warehouse.address && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={15} />
              {warehouse.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openEditWarehouse}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Edit warehouse"
          >
            <PencilSimple size={18} />
          </button>
          <button
            type="button"
            onClick={handleDeleteWarehouse}
            className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete warehouse"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {/* Utilization Bar */}
      {totalBins > 0 && (
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Utilization</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{occupiedBins}</span> / {totalBins} locations occupied
              ({totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0}%)
            </span>
          </div>
          <UtilizationBar
            segments={utilizationSegments}
            total={totalBins}
            height="md"
            showLabels={utilizationSegments.length > 1}
          />
        </div>
      )}

      {/* Zones / Floor Plan Tab Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => { setActiveTab('zones'); setHighlightZoneId(null); }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'zones'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ListBullets size={15} />
          Zones
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('floorplan')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'floorplan'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <GridFour size={15} />
          Floor Plan
        </button>
      </div>

      {/* ===== Zones Tab ===== */}
      {activeTab === 'zones' && (
        <>
          {/* Zone Type Filter */}
          {zones.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                    typeFilter === 'ALL'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  All ({zones.length})
                </button>
                {ZONE_TYPES.filter((t) => typeCounts[t]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                      typeFilter === t
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()} ({typeCounts[t]})
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCreateZoneOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground',
                  'hover:bg-primary/90 shadow-sm transition-colors shrink-0',
                )}
              >
                <Plus size={16} weight="bold" />
                Add Element
              </button>
            </div>
          )}

          {/* Zone Cards */}
          {filteredZones.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredZones.map((zone) => (
                <ZoneSummaryCard
                  key={zone.id}
                  zone={zone}
                  onEdit={handleEditZone}
                  onDelete={handleDeleteZone}
                  onPrint={(z) => setPrintZone(z)}
                  elementType={floorPlanZoneMap.get(zone.id)?.type}
                />
              ))}
            </div>
          )}

          {/* Empty zones */}
          {zones.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-12">
              <p className="text-sm text-muted-foreground">No zones in this warehouse yet.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Add zones like Storage, Picking, or Receiving to organize locations.</p>
              <button
                type="button"
                onClick={() => setCreateZoneOpen(true)}
                className={cn(
                  'mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                  'hover:bg-primary/90 shadow-sm transition-colors',
                )}
              >
                <Plus size={16} weight="bold" />
                Add Element
              </button>
            </div>
          )}

          {/* No matches for filter */}
          {zones.length > 0 && filteredZones.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-card py-10 text-center">
              <p className="text-sm text-muted-foreground">No zones match the selected filter.</p>
            </div>
          )}
        </>
      )}

      {/* ===== Floor Plan Tab ===== */}
      {activeTab === 'floorplan' && (
        <FloorPlanEditor
          warehouse={warehouse}
          onSaved={fetchWarehouse}
          highlightZoneId={highlightZoneId}
          onViewZone={handleViewZoneFromFloorPlan}
          onZoneCreated={handleZoneCreatedFromFloorPlan}
        />
      )}

      {/* Create Zone Modal */}
      <ZoneModal
        open={createZoneOpen}
        onClose={() => setCreateZoneOpen(false)}
        onSaved={() => { setCreateZoneOpen(false); fetchWarehouse(); }}
        warehouseId={warehouse.id}
      />

      {/* Edit Warehouse Slide-Over */}
      <SlideOver
        open={editSlideOpen}
        onClose={() => setEditSlideOpen(false)}
        title="Edit Warehouse"
        subtitle={warehouse.name}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditSlideOpen(false)}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-wh-detail-form"
              disabled={editSaving || !editName.trim()}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="edit-wh-detail-form" onSubmit={handleEditWarehouseSave} className="space-y-4">
          <div>
            <label htmlFor="edit-whd-name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input id="edit-whd-name" type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="edit-whd-address" className="mb-1.5 block text-sm font-medium">Address</label>
            <input id="edit-whd-address" type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Optional" className={inputClasses} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editIsDefault} onChange={(e) => setEditIsDefault(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
            <span className="text-sm">Set as default warehouse</span>
          </label>
        </form>
      </SlideOver>

      {/* Edit Element Slide-Over */}
      <SlideOver
        open={editZoneSlideOpen}
        onClose={() => setEditZoneSlideOpen(false)}
        title="Edit Element"
        subtitle={editingZone?.name}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditZoneSlideOpen(false)}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-zone-detail-form"
              disabled={editZoneSaving || !editZoneName.trim()}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {editZoneSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="edit-zone-detail-form" onSubmit={handleEditZoneSave} className="space-y-5">
          {/* Element type indicator */}
          {editingElement && (() => {
            const tpl = getTemplate(editingElement.type);
            return (
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tpl.bgClass, tpl.textClass)}>
                  {tpl.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{tpl.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {editingZone?.type ? editingZone.type.charAt(0) + editingZone.type.slice(1).toLowerCase() : ''} zone
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Name */}
          <div>
            <label htmlFor="edit-zd-name" className="mb-1.5 block text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-zd-name"
              type="text"
              value={editZoneName}
              onChange={(e) => setEditZoneName(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Prefix */}
          <div>
            <label htmlFor="edit-zd-prefix" className="mb-1.5 block text-sm font-medium">Prefix</label>
            <input
              id="edit-zd-prefix"
              type="text"
              value={editPrefix}
              onChange={(e) => setEditPrefix(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 5))}
              maxLength={5}
              placeholder="e.g. SHE"
              className={inputClasses}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Location codes will look like: <span className="font-mono font-medium text-foreground">{editPrefix || 'LOC'}-01-01</span>
            </p>
          </div>

          {/* Shelves + Positions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-zd-shelves" className="mb-1.5 block text-sm font-medium">Shelves</label>
              <input
                id="edit-zd-shelves"
                type="number"
                min={1}
                max={20}
                value={editShelves}
                onChange={(e) => setEditShelves(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="edit-zd-positions" className="mb-1.5 block text-sm font-medium">Positions / shelf</label>
              <input
                id="edit-zd-positions"
                type="number"
                min={1}
                max={20}
                value={editPositions}
                onChange={(e) => setEditPositions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm">
            <span className="font-semibold">{editShelves * editPositions}</span>
            <span className="text-muted-foreground"> locations configured</span>
          </div>

          {/* Current locations info */}
          {editingZone?.bins && editingZone.bins.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Currently has <span className="font-semibold text-foreground">{editingZone.bins.length}</span> locations.
              Changing shelves/positions updates the config for future reference — existing locations are not deleted.
            </p>
          )}

          {editZoneError && <p className="text-sm text-destructive">{editZoneError}</p>}
        </form>
      </SlideOver>

      {/* Print Labels Modal */}
      <PrintLabelsModal
        open={!!printZone}
        onClose={() => setPrintZone(null)}
        bins={printZone?.bins || []}
        zoneName={printZone?.name || ''}
        warehouseName={warehouse.name}
        zoneType={printZone ? (zones.find((z) => z.id === printZone.id)?.type || '') : ''}
      />
    </div>
  );
}
