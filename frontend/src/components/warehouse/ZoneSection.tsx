import { useState } from 'react';
import { PencilSimple, Trash, Plus, MapTrifold } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Zone, Bin, ZoneType } from '../../types';
import BinGrid from './BinGrid';
import ZoneModal from './ZoneModal';
import BinModal from './BinModal';
import GenerateBinsModal from './GenerateBinsModal';
import api from '../../services/api';

const zoneTypeBadge: Record<string, { bg: string; text: string; accent: string }> = {
  STORAGE:   { bg: 'bg-blue-500/10',    text: 'text-blue-600',    accent: 'border-l-blue-500' },
  PICKING:   { bg: 'bg-violet-500/10',  text: 'text-violet-600',  accent: 'border-l-violet-500' },
  RECEIVING: { bg: 'bg-amber-500/10',   text: 'text-amber-600',   accent: 'border-l-amber-500' },
  PACKING:   { bg: 'bg-orange-500/10',  text: 'text-orange-600',  accent: 'border-l-orange-500' },
  SHIPPING:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600', accent: 'border-l-emerald-500' },
  RETURNS:   { bg: 'bg-red-500/10',     text: 'text-red-600',     accent: 'border-l-red-500' },
};

interface ZoneSectionProps {
  zone: Zone;
  warehouseId: number;
  onRefresh: () => void;
}

export default function ZoneSection({ zone, warehouseId, onRefresh }: ZoneSectionProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [binModalOpen, setBinModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const badge = zoneTypeBadge[zone.type] || { bg: 'bg-gray-500/10', text: 'text-gray-500', accent: 'border-l-gray-500' };
  const bins = zone.bins || [];
  const totalStock = bins.reduce((sum, b) => sum + (b._stockCount ?? 0), 0);

  // Derive aisle/rack/shelf counts from bin metadata
  const aisles = new Set(bins.filter((b) => b.row).map((b) => b.row!)).size;

  const handleDelete = async () => {
    const hasStock = bins.some((b) => (b._stockCount ?? 0) > 0);
    if (hasStock) {
      alert('Cannot delete zone with stocked bins. Move or clear all inventory first.');
      return;
    }

    if (!confirm(`Delete zone "${zone.name}" and all ${bins.length} locations? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await api.delete(`/warehouse/zones/${zone.id}`);
      onRefresh();
    } catch {
      // handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  const handleAddLocation = async () => {
    const label = prompt('Location label (e.g. A-01-02-03):');
    if (!label?.trim()) return;

    try {
      await api.post(`/warehouse/zones/${zone.id}/bins`, { label: label.trim() });
      onRefresh();
    } catch {
      // handled by interceptor
    }
  };

  const handleBinClick = (bin: Bin) => {
    setSelectedBin(bin);
    setBinModalOpen(true);
  };

  return (
    <>
      <div className={cn('rounded-lg border border-border/40 border-l-4 bg-card/50', badge.accent)}>
        {/* Zone Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold">{zone.name}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', badge.bg, badge.text)}>
                {zone.type}
              </span>
              <span className="text-xs text-muted-foreground/60">
                {bins.length} location{bins.length !== 1 ? 's' : ''}
                {aisles > 0 && <> · {aisles} aisle{aisles !== 1 ? 's' : ''}</>}
                {totalStock > 0 && <> · {totalStock} items</>}
              </span>
            </div>
            {zone.description && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{zone.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleAddLocation}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Add a single location manually"
            >
              <Plus size={14} weight="bold" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setGenerateModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                bins.length === 0
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title="Generate locations with aisle/rack/shelf structure"
            >
              <MapTrifold size={14} weight="bold" />
              Generate Locations
            </button>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit zone"
            >
              <PencilSimple size={14} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
              title="Delete zone"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        {/* Bin / Rack Grid */}
        <div className="px-4 pb-4">
          <BinGrid bins={bins} zoneType={zone.type as ZoneType} onBinClick={handleBinClick} />
        </div>
      </div>

      {/* Modals */}
      <ZoneModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={onRefresh}
        warehouseId={warehouseId}
        zone={zone}
      />
      <BinModal
        open={binModalOpen}
        onClose={() => { setBinModalOpen(false); setSelectedBin(null); }}
        onSaved={onRefresh}
        bin={selectedBin}
      />
      <GenerateBinsModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSaved={onRefresh}
        zoneId={zone.id}
      />
    </>
  );
}
