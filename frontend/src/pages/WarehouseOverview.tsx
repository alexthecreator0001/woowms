import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Question,
  MapPin,
  Package,
  CubeTransparent,
  ChartBar,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse } from '../types';
import WarehouseSummaryCard from '../components/warehouse/WarehouseSummaryCard';
import WarehouseModal from '../components/warehouse/WarehouseModal';
import SlideOver from '../components/warehouse/SlideOver';

export default function WarehouseOverview() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editSlideOpen, setEditSlideOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const fetchWarehouses = useCallback(() => {
    setLoading(true);
    api.get('/warehouse')
      .then(({ data }) => setWarehouses(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Aggregate stats
  const totalLocations = warehouses.reduce(
    (sum, wh) => sum + (wh.zones?.reduce((zs, z) => zs + (z.bins?.length || 0), 0) || 0),
    0,
  );
  const occupiedLocations = warehouses.reduce(
    (sum, wh) =>
      sum + (wh.zones?.reduce((zs, z) => zs + (z.bins?.filter((b) => (b._stockCount ?? 0) > 0).length || 0), 0) || 0),
    0,
  );
  const emptyLocations = totalLocations - occupiedLocations;
  const utilPct = totalLocations > 0 ? Math.round((occupiedLocations / totalLocations) * 100) : 0;

  const stats = [
    { label: 'Total Locations', value: totalLocations.toLocaleString(), icon: MapPin, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Occupied', value: occupiedLocations.toLocaleString(), icon: Package, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Empty', value: emptyLocations.toLocaleString(), icon: CubeTransparent, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Utilization', value: `${utilPct}%`, icon: ChartBar, color: 'text-violet-600 bg-violet-500/10' },
  ];

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setEditName(warehouse.name);
    setEditAddress(warehouse.address ?? '');
    setEditIsDefault(warehouse.isDefault);
    setEditSlideOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse || !editName.trim()) return;
    setEditSaving(true);
    try {
      await api.patch(`/warehouse/${editingWarehouse.id}`, {
        name: editName.trim(),
        address: editAddress.trim() || null,
        isDefault: editIsDefault,
      });
      setEditSlideOpen(false);
      fetchWarehouses();
    } catch {
      // handled by interceptor
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    const zones = warehouse.zones || [];
    const hasStock = zones.some((z) => z.bins?.some((b) => (b._stockCount ?? 0) > 0));
    if (hasStock) {
      alert('Cannot delete warehouse with stocked bins. Move or clear all inventory first.');
      return;
    }
    const totalBins = zones.reduce((acc, z) => acc + (z.bins?.length || 0), 0);
    if (!confirm(`Delete "${warehouse.name}" and all its ${zones.length} zones and ${totalBins} locations? This cannot be undone.`)) return;
    try {
      await api.delete(`/warehouse/${warehouse.id}`);
      fetchWarehouses();
    } catch {
      // handled by interceptor
    }
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <WarehouseIcon size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Warehouse</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage warehouses, zones, and shelf locations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/warehouse/guide')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Warehouse setup guide"
          >
            <Question size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 shadow-sm transition-colors',
            )}
          >
            <Plus size={18} weight="bold" />
            Warehouse
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && warehouses.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Stat Cards */}
      {!loading && warehouses.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', stat.color)}>
                  <stat.icon size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Cards */}
      {!loading && warehouses.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {warehouses.map((wh) => (
            <WarehouseSummaryCard
              key={wh.id}
              warehouse={wh}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {warehouses.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 blur-xl" />
            <WarehouseIcon size={36} weight="duotone" className="relative text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No warehouses configured</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Create a warehouse, add zones, then generate aisle and shelf locations.</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 shadow-sm transition-colors',
              )}
            >
              <Plus size={16} weight="bold" />
              Create Warehouse
            </button>
            <button
              type="button"
              onClick={() => navigate('/warehouse/guide')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Question size={16} />
              Read the Guide First
            </button>
          </div>
        </div>
      )}

      {/* Create Warehouse Modal */}
      <WarehouseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={fetchWarehouses}
      />

      {/* Edit Warehouse Slide-Over */}
      <SlideOver
        open={editSlideOpen}
        onClose={() => setEditSlideOpen(false)}
        title="Edit Warehouse"
        subtitle={editingWarehouse?.name}
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
              form="edit-warehouse-form"
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
        <form id="edit-warehouse-form" onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label htmlFor="edit-wh-name" className="mb-1.5 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="edit-wh-name"
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Main Warehouse"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="edit-wh-address" className="mb-1.5 block text-sm font-medium text-foreground">
              Address
            </label>
            <input
              id="edit-wh-address"
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Optional"
              className={inputClasses}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editIsDefault}
              onChange={(e) => setEditIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Set as default warehouse</span>
          </label>
        </form>
      </SlideOver>
    </div>
  );
}
