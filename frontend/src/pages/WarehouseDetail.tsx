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
import type { Warehouse, Zone, ZoneType } from '../types';
import ZoneSummaryCard from '../components/warehouse/ZoneSummaryCard';
import UtilizationBar from '../components/warehouse/UtilizationBar';
import SlideOver from '../components/warehouse/SlideOver';
import ZoneModal from '../components/warehouse/ZoneModal';
import GenerateBinsModal from '../components/warehouse/GenerateBinsModal';
import PrintLabelsModal from '../components/warehouse/PrintLabelsModal';
import FloorPlanEditor from '../components/warehouse/floorplan/FloorPlanEditor';

const ZONE_TYPES: ZoneType[] = ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'RETURNS'];

const ZONE_TYPE_HINTS: Record<ZoneType, string> = {
  STORAGE: 'Main area where products live on shelves',
  PICKING: 'Where workers grab items to fulfill orders',
  RECEIVING: 'Where incoming deliveries are unloaded',
  PACKING: 'Where picked items get boxed for shipping',
  SHIPPING: 'Packed orders waiting for carrier pickup',
  RETURNS: 'Where returned items are inspected and sorted',
};

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

  // Zone editing slide-over
  const [editZoneSlideOpen, setEditZoneSlideOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneType, setEditZoneType] = useState<ZoneType>('STORAGE');
  const [editZoneDesc, setEditZoneDesc] = useState('');
  const [editZoneSaving, setEditZoneSaving] = useState(false);
  const [editZoneError, setEditZoneError] = useState<string | null>(null);

  // Create zone modal
  const [createZoneOpen, setCreateZoneOpen] = useState(false);

  // Generate bins modal
  const [generateZone, setGenerateZone] = useState<Zone | null>(null);

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

  // Map zone IDs to their floor plan element info
  const floorPlanZoneMap = useMemo(() => {
    const map = new Map<number, { label: string }>();
    const elements = warehouse?.floorPlan?.elements || [];
    for (const el of elements) {
      if (el.zoneId) map.set(el.zoneId, { label: el.label });
    }
    return map;
  }, [warehouse]);

  const linkedZoneIds = useMemo(() => {
    return new Set(floorPlanZoneMap.keys());
  }, [floorPlanZoneMap]);

  // Cross-tab navigation handlers
  const handleShowOnFloorPlan = (zone: Zone) => {
    setHighlightZoneId(zone.id);
    setActiveTab('floorplan');
  };

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

  // Zone handlers
  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setEditZoneName(zone.name);
    setEditZoneType(zone.type);
    setEditZoneDesc(zone.description ?? '');
    setEditZoneError(null);
    setEditZoneSlideOpen(true);
  };

  const handleEditZoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !editZoneName.trim()) {
      setEditZoneError('Zone name is required.');
      return;
    }
    setEditZoneSaving(true);
    setEditZoneError(null);
    try {
      await api.patch(`/warehouse/zones/${editingZone.id}`, {
        name: editZoneName.trim(),
        type: editZoneType,
        description: editZoneDesc.trim() || null,
      });
      setEditZoneSlideOpen(false);
      fetchWarehouse();
    } catch (err: any) {
      setEditZoneError(err?.response?.data?.message || 'Failed to save zone.');
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
                Add Zone
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
                  warehouseId={warehouse.id}
                  onEdit={handleEditZone}
                  onDelete={handleDeleteZone}
                  onGenerate={(z) => setGenerateZone(z)}
                  onPrint={(z) => setPrintZone(z)}
                  onShowOnFloorPlan={handleShowOnFloorPlan}
                  hasFloorPlanLink={linkedZoneIds.has(zone.id)}
                  floorPlanElementLabel={floorPlanZoneMap.get(zone.id)?.label}
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
                Add Zone
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
        zone={null}
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

      {/* Edit Zone Slide-Over */}
      <SlideOver
        open={editZoneSlideOpen}
        onClose={() => setEditZoneSlideOpen(false)}
        title="Edit Zone"
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
              disabled={editZoneSaving}
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
        <form id="edit-zone-detail-form" onSubmit={handleEditZoneSave} className="space-y-4">
          <div>
            <label htmlFor="edit-zd-name" className="mb-1.5 block text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <input id="edit-zd-name" type="text" value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="edit-zd-type" className="mb-1.5 block text-sm font-medium">Type</label>
            <select
              id="edit-zd-type"
              value={editZoneType}
              onChange={(e) => setEditZoneType(e.target.value as ZoneType)}
              className={inputClasses}
            >
              {ZONE_TYPES.map((zt) => (
                <option key={zt} value={zt}>
                  {zt.charAt(0) + zt.slice(1).toLowerCase()} — {ZONE_TYPE_HINTS[zt]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{ZONE_TYPE_HINTS[editZoneType]}</p>
          </div>
          <div>
            <label htmlFor="edit-zd-desc" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              id="edit-zd-desc"
              value={editZoneDesc}
              onChange={(e) => setEditZoneDesc(e.target.value)}
              placeholder="Optional"
              rows={3}
              className={cn(inputClasses, 'min-h-[80px] resize-none')}
            />
          </div>
          {editZoneError && <p className="text-sm text-destructive">{editZoneError}</p>}
        </form>
      </SlideOver>

      {/* Generate Bins Modal */}
      <GenerateBinsModal
        open={!!generateZone}
        onClose={() => setGenerateZone(null)}
        onSaved={() => { setGenerateZone(null); fetchWarehouse(); }}
        zoneId={generateZone?.id ?? 0}
      />

      {/* Print Labels Modal */}
      <PrintLabelsModal
        open={!!printZone}
        onClose={() => setPrintZone(null)}
        bins={printZone?.bins || []}
        zoneName={printZone?.name || ''}
        warehouseName={warehouse.name}
      />
    </div>
  );
}
