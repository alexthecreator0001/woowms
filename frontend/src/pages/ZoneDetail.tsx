import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MagnifyingGlass,
  GridFour,
  List,
  Plus,
  MapTrifold,
  Printer,
  PencilSimple,
  Trash,
  MapPin,
  Package,
  CubeTransparent,
  ChartBar,
  X,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse, Zone, Bin, ZoneType, BinSize } from '../types';
import { BIN_SIZE_LABELS } from '../types';
import BinGrid from '../components/warehouse/BinGrid';
import BinListView from '../components/warehouse/BinListView';
import SlideOver from '../components/warehouse/SlideOver';
import GenerateBinsModal from '../components/warehouse/GenerateBinsModal';
import PrintLabelsModal from '../components/warehouse/PrintLabelsModal';

const ZONE_TYPES: ZoneType[] = ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'RETURNS'];

const ZONE_TYPE_HINTS: Record<ZoneType, string> = {
  STORAGE: 'Main area where products live on shelves',
  PICKING: 'Where workers grab items to fulfill orders',
  RECEIVING: 'Where incoming deliveries are unloaded',
  PACKING: 'Where picked items get boxed for shipping',
  SHIPPING: 'Packed orders waiting for carrier pickup',
  RETURNS: 'Where returned items are inspected and sorted',
};

const zoneBadgeStyles: Record<string, { bg: string; text: string }> = {
  STORAGE:   { bg: 'bg-blue-500/10',    text: 'text-blue-600' },
  PICKING:   { bg: 'bg-violet-500/10',  text: 'text-violet-600' },
  RECEIVING: { bg: 'bg-amber-500/10',   text: 'text-amber-600' },
  PACKING:   { bg: 'bg-orange-500/10',  text: 'text-orange-600' },
  SHIPPING:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  RETURNS:   { bg: 'bg-red-500/10',     text: 'text-red-600' },
};

export default function ZoneDetail() {
  const { warehouseId, zoneId } = useParams<{ warehouseId: string; zoneId: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search + filter
  const [search, setSearch] = useState('');
  const [aisleFilter, setAisleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'EMPTY' | 'INACTIVE'>('ALL');

  // Inline add location
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addRow, setAddRow] = useState('');
  const [addShelf, setAddShelf] = useState('');
  const [addPosition, setAddPosition] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // Edit bin slide-over
  const [editBinSlideOpen, setEditBinSlideOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [editBinLabel, setEditBinLabel] = useState('');
  const [editBinRow, setEditBinRow] = useState('');
  const [editBinShelf, setEditBinShelf] = useState('');
  const [editBinPosition, setEditBinPosition] = useState('');
  const [editBinCapacity, setEditBinCapacity] = useState('');
  const [editBinSize, setEditBinSize] = useState<BinSize>('MEDIUM');
  const [editBinPickable, setEditBinPickable] = useState(true);
  const [editBinSellable, setEditBinSellable] = useState(true);
  const [editBinActive, setEditBinActive] = useState(true);
  const [editBinSaving, setEditBinSaving] = useState(false);
  const [editBinDeleting, setEditBinDeleting] = useState(false);

  // Edit zone slide-over
  const [editZoneSlideOpen, setEditZoneSlideOpen] = useState(false);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneType, setEditZoneType] = useState<ZoneType>('STORAGE');
  const [editZoneDesc, setEditZoneDesc] = useState('');
  const [editZoneSaving, setEditZoneSaving] = useState(false);
  const [editZoneError, setEditZoneError] = useState<string | null>(null);

  // Modals
  const [generateOpen, setGenerateOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const fetchData = useCallback(() => {
    if (!warehouseId) return;
    setLoading(true);
    api.get('/warehouse')
      .then(({ data }) => {
        const wh = (data.data as Warehouse[]).find((w) => w.id === Number(warehouseId));
        setWarehouse(wh || null);
        const z = wh?.zones?.find((z) => z.id === Number(zoneId));
        setZone(z || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [warehouseId, zoneId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bins = zone?.bins || [];

  // Aisle options
  const aisleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const bin of bins) {
      if (bin.row) set.add(bin.row);
    }
    return Array.from(set).sort();
  }, [bins]);

  // Filtered bins
  const filteredBins = useMemo(() => {
    let result = bins;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.label.toLowerCase().includes(q));
    }

    if (aisleFilter !== 'ALL') {
      result = result.filter((b) => b.row === aisleFilter);
    }

    if (statusFilter === 'OCCUPIED') {
      result = result.filter((b) => (b._stockCount ?? 0) > 0 && b.isActive);
    } else if (statusFilter === 'EMPTY') {
      result = result.filter((b) => (b._stockCount ?? 0) === 0 && b.isActive);
    } else if (statusFilter === 'INACTIVE') {
      result = result.filter((b) => !b.isActive);
    }

    return result;
  }, [bins, search, aisleFilter, statusFilter]);

  // Stats
  const totalBins = bins.length;
  const occupiedBins = bins.filter((b) => (b._stockCount ?? 0) > 0).length;
  const emptyBins = bins.filter((b) => (b._stockCount ?? 0) === 0 && b.isActive).length;
  const utilPct = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;

  const badge = zoneBadgeStyles[zone?.type || ''] || { bg: 'bg-gray-500/10', text: 'text-gray-500' };

  // Handlers
  const handleBinClick = (bin: Bin) => {
    setEditingBin(bin);
    setEditBinLabel(bin.label);
    setEditBinRow(bin.row ?? '');
    setEditBinShelf(bin.shelf ?? '');
    setEditBinPosition(bin.position ?? '');
    setEditBinCapacity(bin.capacity != null ? String(bin.capacity) : '');
    setEditBinSize(bin.binSize || 'MEDIUM');
    setEditBinPickable(bin.pickable ?? true);
    setEditBinSellable(bin.sellable ?? true);
    setEditBinActive(bin.isActive);
    setEditBinSlideOpen(true);
  };

  const handleEditBinSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBin || !editBinLabel.trim()) return;
    setEditBinSaving(true);
    try {
      await api.patch(`/warehouse/bins/${editingBin.id}`, {
        label: editBinLabel.trim(),
        row: editBinRow.trim() || null,
        shelf: editBinShelf.trim() || null,
        position: editBinPosition.trim() || null,
        capacity: editBinCapacity ? Number(editBinCapacity) : null,
        binSize: editBinSize,
        pickable: editBinPickable,
        sellable: editBinSellable,
        isActive: editBinActive,
      });
      setEditBinSlideOpen(false);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setEditBinSaving(false);
    }
  };

  const handleDeleteBin = async () => {
    if (!editingBin) return;
    const stockCount = editingBin._stockCount ?? 0;
    if (stockCount > 0) return;
    setEditBinDeleting(true);
    try {
      await api.delete(`/warehouse/bins/${editingBin.id}`);
      setEditBinSlideOpen(false);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setEditBinDeleting(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLabel.trim() || !zone) return;
    setAddSaving(true);
    try {
      await api.post(`/warehouse/zones/${zone.id}/bins`, {
        label: addLabel.trim(),
        row: addRow.trim() || undefined,
        shelf: addShelf.trim() || undefined,
        position: addPosition.trim() || undefined,
      });
      setAddLabel('');
      setAddRow('');
      setAddShelf('');
      setAddPosition('');
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setAddSaving(false);
    }
  };

  const openEditZone = () => {
    if (!zone) return;
    setEditZoneName(zone.name);
    setEditZoneType(zone.type);
    setEditZoneDesc(zone.description ?? '');
    setEditZoneError(null);
    setEditZoneSlideOpen(true);
  };

  const handleEditZoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone || !editZoneName.trim()) {
      setEditZoneError('Zone name is required.');
      return;
    }
    setEditZoneSaving(true);
    setEditZoneError(null);
    try {
      await api.patch(`/warehouse/zones/${zone.id}`, {
        name: editZoneName.trim(),
        type: editZoneType,
        description: editZoneDesc.trim() || null,
      });
      setEditZoneSlideOpen(false);
      fetchData();
    } catch (err: any) {
      setEditZoneError(err?.response?.data?.message || 'Failed to save zone.');
    } finally {
      setEditZoneSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!zone || !warehouse) return;
    const hasStock = bins.some((b) => (b._stockCount ?? 0) > 0);
    if (hasStock) {
      alert('Cannot delete zone with stocked bins. Move or clear all inventory first.');
      return;
    }
    if (!confirm(`Delete zone "${zone.name}" and all ${bins.length} locations? This cannot be undone.`)) return;
    try {
      await api.delete(`/warehouse/zones/${zone.id}`);
      navigate(`/warehouse/${warehouse.id}`);
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

  if (!warehouse || !zone) {
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
          <p className="text-sm text-muted-foreground">Zone not found</p>
        </div>
      </div>
    );
  }

  const editBinStockCount = editingBin?._stockCount ?? 0;
  const editBinHasStock = editBinStockCount > 0;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={() => navigate('/warehouse')}
          className="font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Warehouses
        </button>
        <span className="text-muted-foreground/40">/</span>
        <button
          type="button"
          onClick={() => navigate(`/warehouse/${warehouse.id}`)}
          className="font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
        >
          {warehouse.name}
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-medium text-foreground truncate max-w-[200px]">{zone.name}</span>
      </div>

      {/* Zone header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">{zone.name}</h2>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide', badge.bg, badge.text)}>
              {zone.type}
            </span>
          </div>
          {zone.description && (
            <p className="mt-1 text-sm text-muted-foreground">{zone.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openEditZone}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Edit zone"
          >
            <PencilSimple size={18} />
          </button>
          <button
            type="button"
            onClick={handleDeleteZone}
            className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete zone"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap items-center gap-3">
        {[
          { label: 'Total', value: totalBins, icon: MapPin, color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Occupied', value: occupiedBins, icon: Package, color: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Empty', value: emptyBins, icon: CubeTransparent, color: 'text-amber-600 bg-amber-500/10' },
          { label: 'Utilization', value: `${utilPct}%`, icon: ChartBar, color: 'text-violet-600 bg-violet-500/10' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-sm"
          >
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', stat.color)}>
              <stat.icon size={14} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClasses, 'pl-9')}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Aisle filter */}
        {aisleOptions.length > 1 && (
          <select
            value={aisleFilter}
            onChange={(e) => setAisleFilter(e.target.value)}
            className={cn(inputClasses, 'w-auto')}
          >
            <option value="ALL">All Aisles</option>
            {aisleOptions.map((a) => (
              <option key={a} value={a}>Aisle {a}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className={cn(inputClasses, 'w-auto')}
        >
          <option value="ALL">All Status</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="EMPTY">Empty</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md px-2.5 py-1.5 transition-colors',
              viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Grid view"
          >
            <GridFour size={16} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md px-2.5 py-1.5 transition-colors',
              viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            title="List view"
          >
            <List size={16} weight={viewMode === 'list' ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors',
            showAddForm
              ? 'border-primary bg-primary/5 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Plus size={16} weight="bold" />
          Add Location
        </button>
        <button
          type="button"
          onClick={() => setGenerateOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors',
            totalBins === 0
              ? 'border-primary bg-primary/5 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <MapTrifold size={16} weight="bold" />
          Generate Locations
        </button>
        {totalBins > 0 && (
          <button
            type="button"
            onClick={() => setPrintOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Printer size={16} weight="bold" />
            Print Labels
          </button>
        )}

        {/* Search result count */}
        {(search || aisleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredBins.length} of {totalBins} locations
          </span>
        )}
      </div>

      {/* Inline Add Location Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddLocation}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-foreground">Label <span className="text-destructive">*</span></label>
            <input
              type="text"
              required
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              placeholder="e.g. A-01-02-03"
              className={inputClasses}
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs font-medium text-foreground">Aisle</label>
            <input
              type="text"
              value={addRow}
              onChange={(e) => setAddRow(e.target.value)}
              placeholder="A"
              className={inputClasses}
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs font-medium text-foreground">Shelf</label>
            <input
              type="text"
              value={addShelf}
              onChange={(e) => setAddShelf(e.target.value)}
              placeholder="01"
              className={inputClasses}
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs font-medium text-foreground">Position</label>
            <input
              type="text"
              value={addPosition}
              onChange={(e) => setAddPosition(e.target.value)}
              placeholder="01"
              className={inputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={addSaving || !addLabel.trim()}
            className={cn(
              'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 disabled:opacity-50',
            )}
          >
            {addSaving ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <BinGrid bins={filteredBins} zoneType={zone.type as ZoneType} onBinClick={handleBinClick} />
      ) : (
        <BinListView bins={filteredBins} onBinClick={handleBinClick} />
      )}

      {/* Edit Bin Slide-Over */}
      <SlideOver
        open={editBinSlideOpen}
        onClose={() => setEditBinSlideOpen(false)}
        title="Edit Location"
        subtitle={editingBin ? `${editingBin.label} — ${editBinStockCount} item${editBinStockCount !== 1 ? 's' : ''} stored` : undefined}
        footer={
          <div className="flex items-center justify-between">
            <div className="relative group">
              <button
                type="button"
                onClick={handleDeleteBin}
                disabled={editBinHasStock || editBinDeleting}
                className={cn(
                  'rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600',
                  'hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {editBinDeleting ? 'Deleting...' : 'Delete'}
              </button>
              {editBinHasStock && (
                <span className={cn(
                  'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                  'whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground',
                  'border border-border/60 shadow-md opacity-0 group-hover:opacity-100 transition-opacity',
                )}>
                  Cannot delete location with stock
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditBinSlideOpen(false)}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-bin-form"
                disabled={editBinSaving || !editBinLabel.trim()}
                className={cn(
                  'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                  'hover:bg-primary/90 disabled:opacity-50',
                )}
              >
                {editBinSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <form id="edit-bin-form" onSubmit={handleEditBinSave} className="space-y-4">
          <div>
            <label htmlFor="ebl" className="mb-1.5 block text-sm font-medium">Label</label>
            <input id="ebl" type="text" required value={editBinLabel} onChange={(e) => setEditBinLabel(e.target.value)} className={inputClasses} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="ebr" className="mb-1.5 block text-sm font-medium">Row</label>
              <input id="ebr" type="text" value={editBinRow} onChange={(e) => setEditBinRow(e.target.value)} placeholder="A" className={inputClasses} />
            </div>
            <div>
              <label htmlFor="ebs" className="mb-1.5 block text-sm font-medium">Shelf</label>
              <input id="ebs" type="text" value={editBinShelf} onChange={(e) => setEditBinShelf(e.target.value)} placeholder="01" className={inputClasses} />
            </div>
            <div>
              <label htmlFor="ebp" className="mb-1.5 block text-sm font-medium">Position</label>
              <input id="ebp" type="text" value={editBinPosition} onChange={(e) => setEditBinPosition(e.target.value)} placeholder="03" className={inputClasses} />
            </div>
          </div>
          <div>
            <label htmlFor="ebc-size" className="mb-1.5 block text-sm font-medium">Location Size</label>
            <select
              id="ebc-size"
              value={editBinSize}
              onChange={(e) => setEditBinSize(e.target.value as BinSize)}
              className={inputClasses}
            >
              {(Object.keys(BIN_SIZE_LABELS) as BinSize[]).map((size) => (
                <option key={size} value={size}>{BIN_SIZE_LABELS[size]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ebc" className="mb-1.5 block text-sm font-medium">Capacity Override</label>
            <input id="ebc" type="number" min={0} value={editBinCapacity} onChange={(e) => setEditBinCapacity(e.target.value)} placeholder="From bin size" className={inputClasses} />
            <p className="mt-1 text-[10px] text-muted-foreground">Leave empty to use default from size category</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editBinPickable} onChange={(e) => setEditBinPickable(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm">Pickable</span>
              <span className="text-[10px] text-muted-foreground">— available for order picking</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editBinSellable} onChange={(e) => setEditBinSellable(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm">Sellable</span>
              <span className="text-[10px] text-muted-foreground">— counts toward available stock</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editBinActive} onChange={(e) => setEditBinActive(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm">Active</span>
            </label>
          </div>

          {/* Contents */}
          {editingBin?.stockLocations && editingBin.stockLocations.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Contents</label>
              <div className="space-y-1.5">
                {editingBin.stockLocations.map((sl, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2">
                    {sl.product?.imageUrl ? (
                      <img src={sl.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                        <Package size={14} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sl.product?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">{sl.product?.sku || '—'}</p>
                    </div>
                    <span className="text-sm font-bold">{sl.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </SlideOver>

      {/* Edit Zone Slide-Over */}
      <SlideOver
        open={editZoneSlideOpen}
        onClose={() => setEditZoneSlideOpen(false)}
        title="Edit Zone"
        subtitle={zone.name}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setEditZoneSlideOpen(false)} className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              form="edit-zone-form"
              disabled={editZoneSaving}
              className={cn('rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50')}
            >
              {editZoneSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="edit-zone-form" onSubmit={handleEditZoneSave} className="space-y-4">
          <div>
            <label htmlFor="ezn" className="mb-1.5 block text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <input id="ezn" type="text" value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="ezt" className="mb-1.5 block text-sm font-medium">Type</label>
            <select id="ezt" value={editZoneType} onChange={(e) => setEditZoneType(e.target.value as ZoneType)} className={inputClasses}>
              {ZONE_TYPES.map((zt) => (
                <option key={zt} value={zt}>
                  {zt.charAt(0) + zt.slice(1).toLowerCase()} — {ZONE_TYPE_HINTS[zt]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{ZONE_TYPE_HINTS[editZoneType]}</p>
          </div>
          <div>
            <label htmlFor="ezd" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea id="ezd" value={editZoneDesc} onChange={(e) => setEditZoneDesc(e.target.value)} placeholder="Optional" rows={3} className={cn(inputClasses, 'min-h-[80px] resize-none')} />
          </div>
          {editZoneError && <p className="text-sm text-destructive">{editZoneError}</p>}
        </form>
      </SlideOver>

      {/* Generate Bins Modal */}
      <GenerateBinsModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSaved={() => { setGenerateOpen(false); fetchData(); }}
        zoneId={zone.id}
      />

      {/* Print Labels Modal */}
      <PrintLabelsModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        bins={bins}
        zoneName={zone.name}
        warehouseName={warehouse.name}
        zoneType={zone.type}
      />
    </div>
  );
}
