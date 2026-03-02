/**
 * Read-only mini floor plan viewer.
 * Highlights specific zone(s) to show where a product is stored.
 * Used in ProductDetail sidebar.
 */
import { useEffect, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { getTemplate } from './floorplan/ElementPalette';
import api from '../../services/api';
import type { FloorPlanElement } from '../../types';

interface FloorPlan {
  width: number;
  height: number;
  unit?: string;
  elements: FloorPlanElement[];
}

interface Warehouse {
  id: number;
  name: string;
  floorPlan: FloorPlan | null;
}

interface FloorPlanMiniProps {
  /** Zone IDs to highlight on the floor plan */
  highlightZoneIds: number[];
  className?: string;
}

export default function FloorPlanMini({ highlightZoneIds, className }: FloorPlanMiniProps) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/warehouse');
        const warehouses: Warehouse[] = data.data;
        // Use first warehouse that has a floor plan
        const wh = warehouses.find((w) => w.floorPlan && w.floorPlan.elements?.length > 0);
        if (wh) setWarehouse(wh);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !warehouse?.floorPlan || highlightZoneIds.length === 0) return null;

  const fp = warehouse.floorPlan;
  const placedElements = fp.elements.filter((el) => el.x >= 0 && el.y >= 0);
  if (placedElements.length === 0) return null;

  // Scale to fit container (max ~240px wide)
  const MAX_W = 240;
  const MAX_H = 160;
  const scaleX = MAX_W / fp.width;
  const scaleY = MAX_H / fp.height;
  const scale = Math.min(scaleX, scaleY, 20); // cap at 20px per unit
  const pxW = fp.width * scale;
  const pxH = fp.height * scale;

  return (
    <div className={cn('rounded-lg border border-border/40 bg-muted/10 p-2', className)}>
      <div
        className="relative mx-auto overflow-hidden rounded-md bg-white"
        style={{
          width: pxW,
          height: pxH,
          backgroundSize: `${scale}px ${scale}px`,
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)',
        }}
      >
        {placedElements.map((el) => {
          const template = getTemplate(el.type);
          const ew = el.rotation === 90 ? el.h : el.w;
          const eh = el.rotation === 90 ? el.w : el.h;
          const isHighlighted = el.zoneId != null && highlightZoneIds.includes(el.zoneId);

          return (
            <div
              key={el.id}
              className={cn(
                'absolute flex items-center justify-center rounded-[2px] transition-all',
                isHighlighted
                  ? 'z-20 ring-2 ring-orange-500 ring-offset-1'
                  : 'z-10 opacity-40'
              )}
              style={{
                left: el.x * scale,
                top: el.y * scale,
                width: ew * scale,
                height: eh * scale,
                backgroundColor: isHighlighted ? '#f97316' : (el.color || template.color),
              }}
            >
              {isHighlighted && ew * scale >= 16 && eh * scale >= 16 && (
                <MapPin size={Math.min(ew * scale * 0.5, 14)} weight="fill" className="text-white" />
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="mt-1.5 flex items-center justify-center gap-1">
        <div className="h-2 w-2 rounded-[2px] bg-orange-500" />
        <span className="text-[9px] font-semibold text-muted-foreground">Product location</span>
      </div>
    </div>
  );
}
