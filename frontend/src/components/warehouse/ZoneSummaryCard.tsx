import {
  PencilSimple,
  Trash,
  Printer,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Zone, FloorPlanElementType } from '../../types';
import { getTemplate } from './floorplan/ElementPalette';
import UtilizationBar from './UtilizationBar';

const zoneTypeBadge: Record<string, { bg: string; text: string; accent: string; barColor: string }> = {
  STORAGE:   { bg: 'bg-blue-500/10',    text: 'text-blue-600',    accent: 'border-l-blue-500',    barColor: 'bg-blue-500' },
  PICKING:   { bg: 'bg-violet-500/10',  text: 'text-violet-600',  accent: 'border-l-violet-500',  barColor: 'bg-violet-500' },
  RECEIVING: { bg: 'bg-amber-500/10',   text: 'text-amber-600',   accent: 'border-l-amber-500',   barColor: 'bg-amber-500' },
  PACKING:   { bg: 'bg-orange-500/10',  text: 'text-orange-600',  accent: 'border-l-orange-500',  barColor: 'bg-orange-500' },
  SHIPPING:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600', accent: 'border-l-emerald-500', barColor: 'bg-emerald-500' },
  RETURNS:   { bg: 'bg-red-500/10',     text: 'text-red-600',     accent: 'border-l-red-500',     barColor: 'bg-red-500' },
};

interface ZoneSummaryCardProps {
  zone: Zone;
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  onPrint: (zone: Zone) => void;
  elementType?: FloorPlanElementType;
}

export default function ZoneSummaryCard({
  zone,
  onEdit,
  onDelete,
  onPrint,
  elementType,
}: ZoneSummaryCardProps) {
  const badge = zoneTypeBadge[zone.type] || { bg: 'bg-gray-500/10', text: 'text-gray-500', accent: 'border-l-gray-500', barColor: 'bg-gray-500' };
  const elTemplate = elementType ? getTemplate(elementType) : null;

  const bins = zone.bins || [];
  const totalBins = bins.length;
  const occupiedBins = bins.filter((b) => (b._stockCount ?? 0) > 0).length;
  const totalItems = bins.reduce((sum, b) => sum + (b._stockCount ?? 0), 0);
  const utilPct = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border border-border/40 border-l-4 bg-card/50 cursor-pointer transition-colors hover:bg-card/80',
        badge.accent,
      )}
      onClick={() => onEdit(zone)}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* Title + Badge */}
            <div className="flex items-center gap-2.5">
              {elTemplate && (
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', elTemplate.bgClass, elTemplate.textClass)}>
                  {elTemplate.icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{zone.name}</span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', badge.bg, badge.text)}>
                    {zone.type}
                  </span>
                </div>
                {elTemplate && (
                  <p className="text-[11px] text-muted-foreground">{elTemplate.label}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{totalBins}</span> location{totalBins !== 1 ? 's' : ''}
              </span>
              {totalItems > 0 && (
                <span>
                  <span className="font-semibold text-foreground">{totalItems}</span> item{totalItems !== 1 ? 's' : ''}
                </span>
              )}
              <span>
                <span className={cn('font-semibold', utilPct > 0 ? 'text-foreground' : '')}>{utilPct}%</span> occupied
              </span>
            </div>

            {/* Utilization bar */}
            <UtilizationBar
              segments={[{ value: occupiedBins, color: badge.barColor }]}
              total={totalBins}
              className="mt-2"
            />
          </div>

          {/* Action icons (hover) */}
          <div className="ml-3 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(zone); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit"
            >
              <PencilSimple size={14} />
            </button>
            {totalBins > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPrint(zone); }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Print labels"
              >
                <Printer size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(zone); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
