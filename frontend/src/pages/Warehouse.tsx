import { useEffect, useState, useCallback } from 'react';
import { Warehouse as WarehouseIcon, Plus } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse as WarehouseType } from '../types';
import WarehouseCard from '../components/warehouse/WarehouseCard';
import WarehouseModal from '../components/warehouse/WarehouseModal';

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <WarehouseIcon size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Warehouse Locations</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your warehouse layout and shelf bins.
            </p>
          </div>
        </div>
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

      {/* Loading */}
      {loading && warehouses.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Warehouse Cards */}
      {warehouses.map((wh) => (
        <WarehouseCard key={wh.id} warehouse={wh} onRefresh={fetchWarehouses} />
      ))}

      {/* Empty State */}
      {warehouses.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 blur-xl" />
            <WarehouseIcon size={36} weight="duotone" className="relative text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No warehouses configured</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Create your first warehouse to start building zones and bins.</p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 shadow-sm transition-colors',
            )}
          >
            <Plus size={16} weight="bold" />
            Create Warehouse
          </button>
        </div>
      )}

      {/* Create Warehouse Modal */}
      <WarehouseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={fetchWarehouses}
      />
    </div>
  );
}
