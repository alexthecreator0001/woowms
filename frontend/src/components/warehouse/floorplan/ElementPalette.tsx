import {
  Rows,
  Package,
  Table as TableIcon,
  TruckTrailer,
  Export,
  Path,
  Wall,
} from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import type { FloorPlanElementType } from '../../../types';

export interface ElementTemplate {
  type: FloorPlanElementType;
  label: string;
  icon: React.ReactNode;
  defaultW: number;
  defaultH: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hasZone: boolean;
}

export const ELEMENT_TEMPLATES: ElementTemplate[] = [
  {
    type: 'shelf',
    label: 'Shelving Rack',
    icon: <Rows size={18} />,
    defaultW: 1,
    defaultH: 4,
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-600',
    hasZone: true,
  },
  {
    type: 'pallet_rack',
    label: 'Pallet Rack',
    icon: <Package size={18} />,
    defaultW: 2,
    defaultH: 3,
    color: '#6366f1',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
    textClass: 'text-indigo-600',
    hasZone: true,
  },
  {
    type: 'packing_table',
    label: 'Packing Table',
    icon: <TableIcon size={18} />,
    defaultW: 2,
    defaultH: 2,
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-600',
    hasZone: true,
  },
  {
    type: 'receiving_area',
    label: 'Receiving Area',
    icon: <TruckTrailer size={18} />,
    defaultW: 3,
    defaultH: 3,
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-600',
    hasZone: true,
  },
  {
    type: 'shipping_area',
    label: 'Shipping Area',
    icon: <Export size={18} />,
    defaultW: 3,
    defaultH: 3,
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-600',
    hasZone: true,
  },
  {
    type: 'aisle',
    label: 'Aisle',
    icon: <Path size={18} />,
    defaultW: 1,
    defaultH: 4,
    color: '#6b7280',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/30',
    textClass: 'text-gray-500',
    hasZone: false,
  },
  {
    type: 'wall',
    label: 'Wall',
    icon: <Wall size={18} />,
    defaultW: 1,
    defaultH: 1,
    color: '#475569',
    bgClass: 'bg-slate-500/15',
    borderClass: 'border-slate-500/30',
    textClass: 'text-slate-600',
    hasZone: false,
  },
];

export function getTemplate(type: FloorPlanElementType): ElementTemplate {
  return ELEMENT_TEMPLATES.find((t) => t.type === type) || ELEMENT_TEMPLATES[0];
}

interface ElementPaletteProps {
  activeTool: FloorPlanElementType | null;
  onSelect: (type: FloorPlanElementType | null) => void;
}

export default function ElementPalette({ activeTool, onSelect }: ElementPaletteProps) {
  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Elements
      </p>
      {ELEMENT_TEMPLATES.map((tpl) => {
        const isActive = activeTool === tpl.type;
        return (
          <button
            key={tpl.type}
            type="button"
            onClick={() => onSelect(isActive ? null : tpl.type)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-all',
              isActive
                ? cn(tpl.bgClass, 'border', tpl.borderClass, tpl.textClass, 'font-medium')
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className={cn('shrink-0', isActive ? tpl.textClass : '')}>{tpl.icon}</span>
            <span className="flex-1 truncate">{tpl.label}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground/60">
              {tpl.defaultW}&times;{tpl.defaultH}
            </span>
          </button>
        );
      })}

      {activeTool && (
        <p className="mt-2 px-1 text-[11px] text-muted-foreground/70">
          Click on the grid to place
        </p>
      )}
    </div>
  );
}
