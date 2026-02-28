import { useState } from 'react';
import { PencilSimple, Trash, Plus, GridNine } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Zone, Bin, ZoneType } from '../../types';
import BinGrid from './BinGrid';
import ZoneModal from './ZoneModal';
import BinModal from './BinModal';
import GenerateBinsModal from './GenerateBinsModal';
import api from '../../services/api';

const zoneTypeBadge: Record<string, { bg: string; text: string }> = {
  STORAGE: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PICKING: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  RECEIVING: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  PACKING: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
  SHIPPING: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  RETURNS: { bg: 'bg-red-500/10', text: 'text-red-600' },
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

  const badge = zoneTypeBadge[zone.type] || { bg: 'bg-gray-500/10', text: 'text-gray-500' };
  const bins = zone.bins || [];

  const handleDelete = async () => {
    const hasStock = bins.some((b) => (b._stockCount ?? 0) > 0);
    if (hasStock) return;

    if (!confirm(`Delete zone "${zone.name}" and all its bins? This cannot be undone.`)) return;

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

  const handleAddBin = async () => {
    const label = prompt('Bin label (e.g. A-01-01):');
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
      <div className="rounded-lg border border-border/40 bg-card/50">
        {/* Zone Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm font-semibold">{zone.name}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', badge.bg, badge.text)}>
            {zone.type}
          </span>
          {zone.description && (
            <span className="text-xs text-muted-foreground">{zone.description}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleAddBin}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus size={14} weight="bold" />
              Add Bin
            </button>
            <button
              type="button"
              onClick={() => setGenerateModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <GridNine size={14} weight="bold" />
              Generate
            </button>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <PencilSimple size={14} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        {/* Bin Grid */}
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
