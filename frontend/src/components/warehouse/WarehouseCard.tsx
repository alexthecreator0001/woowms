import { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  CaretDown,
  CaretUp,
  PencilSimple,
  Trash,
  Plus,
  Star,
  MapPin,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Warehouse } from '../../types';
import ZoneSection from './ZoneSection';
import WarehouseModal from './WarehouseModal';
import ZoneModal from './ZoneModal';
import api from '../../services/api';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onRefresh: () => void;
}

export default function WarehouseCard({ warehouse, onRefresh }: WarehouseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const zones = warehouse.zones || [];
  const totalBins = zones.reduce((acc, z) => acc + (z.bins?.length || 0), 0);

  const handleDelete = async () => {
    const hasStock = zones.some((z) =>
      z.bins?.some((b) => (b._stockCount ?? 0) > 0)
    );
    if (hasStock) {
      alert('Cannot delete warehouse with stocked bins. Move or clear all inventory first.');
      return;
    }

    if (!confirm(`Delete "${warehouse.name}" and all its zones and bins? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await api.delete(`/warehouse/${warehouse.id}`);
      onRefresh();
    } catch {
      // handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {/* Warehouse Header */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <WarehouseIcon size={22} weight="duotone" className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">{warehouse.name}</h3>
              {warehouse.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                  <Star size={12} weight="fill" />
                  Default
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
              {warehouse.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {warehouse.address}
                </span>
              )}
              <span>{zones.length} zone{zones.length !== 1 ? 's' : ''}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{totalBins} location{totalBins !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <PencilSimple size={16} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              <Trash size={16} />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {expanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Expandable Content */}
        {expanded && (
          <div className="border-t border-border/40 px-6 py-4 space-y-4">
            {zones.map((zone) => (
              <ZoneSection
                key={zone.id}
                zone={zone}
                warehouseId={warehouse.id}
                warehouseName={warehouse.name}
                onRefresh={onRefresh}
              />
            ))}

            {zones.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground/60">
                No zones configured. Add a zone (e.g. Storage, Picking, Receiving) then generate locations.
              </p>
            )}

            {/* Add Zone button */}
            <button
              type="button"
              onClick={() => setZoneModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground',
                'hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors',
              )}
            >
              <Plus size={16} weight="bold" />
              Add Zone
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <WarehouseModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={onRefresh}
        warehouse={warehouse}
      />
      <ZoneModal
        open={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        onSaved={() => { setZoneModalOpen(false); onRefresh(); }}
        warehouseId={warehouse.id}
        zone={null}
      />
    </>
  );
}
