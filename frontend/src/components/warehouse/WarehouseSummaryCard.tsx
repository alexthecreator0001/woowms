import { useNavigate } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  Star,
  MapPin,
  ArrowRight,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Warehouse } from '../../types';
import UtilizationBar from './UtilizationBar';

interface WarehouseSummaryCardProps {
  warehouse: Warehouse;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
}

export default function WarehouseSummaryCard({ warehouse, onEdit, onDelete }: WarehouseSummaryCardProps) {
  const navigate = useNavigate();

  const zones = warehouse.zones || [];
  const totalBins = zones.reduce((acc, z) => acc + (z.bins?.length || 0), 0);
  const occupiedBins = zones.reduce(
    (acc, z) => acc + (z.bins?.filter((b) => (b._stockCount ?? 0) > 0).length || 0),
    0,
  );
  const utilPct = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;

  return (
    <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <WarehouseIcon size={22} weight="duotone" className="text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">{warehouse.name}</h3>
              {warehouse.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 shrink-0">
                  <Star size={12} weight="fill" />
                  Default
                </span>
              )}
            </div>
            {warehouse.address && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground truncate">
                <MapPin size={14} className="shrink-0" />
                {warehouse.address}
              </p>
            )}

            {/* Stats */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{zones.length}</span> zone{zones.length !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{totalBins}</span> location{totalBins !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-muted-foreground">
                <span className={cn('font-semibold', utilPct > 0 ? 'text-foreground' : 'text-muted-foreground')}>{utilPct}%</span> used
              </span>
            </div>

            {/* Utilization Bar */}
            <UtilizationBar
              segments={[{ value: occupiedBins, color: 'bg-primary' }]}
              total={totalBins}
              className="mt-2"
            />
          </div>

          {/* Action icons */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(warehouse); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit warehouse"
            >
              <PencilSimple size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(warehouse); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete warehouse"
            >
              <Trash size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <button
        type="button"
        onClick={() => navigate(`/warehouse/${warehouse.id}`)}
        className={cn(
          'flex w-full items-center justify-between border-t border-border/40 px-5 py-2.5',
          'text-sm font-medium text-primary hover:bg-primary/5 transition-colors',
        )}
      >
        <span>View Details</span>
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  );
}
