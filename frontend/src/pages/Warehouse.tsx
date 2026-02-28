import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Question,
  ArrowRight,
  Rows,
  GridFour,
  Stack,
  MapPin,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse as WarehouseType } from '../types';
import WarehouseCard from '../components/warehouse/WarehouseCard';
import WarehouseModal from '../components/warehouse/WarehouseModal';

export default function Warehouse() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(() => {
    return localStorage.getItem('warehouse-help-dismissed') !== 'true';
  });

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

  const dismissHelp = () => {
    setShowHelp(false);
    localStorage.setItem('warehouse-help-dismissed', 'true');
  };

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
              Manage zones, aisles, racks, and shelf locations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/warehouse/guide')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="How warehouse locations work"
          >
            <Question size={16} weight="bold" />
            Guide
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

      {/* Inline How It Works */}
      {showHelp && (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <button
            type="button"
            onClick={dismissHelp}
            className="absolute right-3 top-3 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
          <div className="px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-blue-500/5">
            <h3 className="text-sm font-semibold">How Warehouse Locations Work</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Warehouse → Zone → Aisle → Rack → Shelf → Position</p>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-border/30 sm:grid-cols-4">
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Rows size={14} weight="duotone" className="text-blue-600" />
                <span className="text-xs font-semibold">Aisle</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The rows you walk down (A, B, C). Like supermarket aisles.
              </p>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <GridFour size={14} weight="duotone" className="text-violet-600" />
                <span className="text-xs font-semibold">Rack</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A shelving unit in the aisle. How far down the aisle to walk.
              </p>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Stack size={14} weight="duotone" className="text-amber-600" />
                <span className="text-xs font-semibold">Shelf</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The height level — 01 is floor, goes up. Like floors in a building.
              </p>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={14} weight="duotone" className="text-emerald-600" />
                <span className="text-xs font-semibold">Position</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The exact spot on a shelf, left to right. This is where the product sits.
              </p>
            </div>
          </div>
          <div className="border-t border-border/30 px-6 py-2.5 bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Label example: <span className="font-mono font-semibold text-foreground">A-02-03-01</span> = Aisle A, Rack 02, Shelf 03, Position 01
            </p>
            <button
              type="button"
              onClick={() => navigate('/warehouse/guide')}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Full guide with examples
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

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

      {/* Bottom Help Banner */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-r from-primary/5 via-card to-blue-500/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Question size={18} weight="duotone" className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Not sure what zones, aisles, or racks mean?</p>
            <p className="text-xs text-muted-foreground">Our guide explains everything with real examples and visual diagrams.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/warehouse/guide')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'hover:bg-primary/90 shadow-sm transition-colors whitespace-nowrap',
          )}
        >
          View Setup Guide
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Create Warehouse Modal */}
      <WarehouseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={fetchWarehouses}
      />
    </div>
  );
}
