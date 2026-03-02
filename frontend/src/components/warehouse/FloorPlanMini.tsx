/**
 * Read-only mini floor plan viewer.
 * All elements gray, highlighted zone(s) in emerald green with qty badge.
 */
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
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
  /** Zone IDs to highlight with optional qty labels */
  highlightZoneIds: number[];
  /** Qty per zone for badge display */
  zoneQty?: Record<number, number>;
  className?: string;
}

export default function FloorPlanMini({ highlightZoneIds, zoneQty, className }: FloorPlanMiniProps) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/warehouse');
        const warehouses: Warehouse[] = data.data;
        const wh = warehouses.find((w) => w.floorPlan && w.floorPlan.elements?.length > 0);
        if (wh) setWarehouse(wh);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !warehouse?.floorPlan || highlightZoneIds.length === 0) return null;

  const fp = warehouse.floorPlan;
  const placed = fp.elements.filter((el) => el.x >= 0 && el.y >= 0);
  if (placed.length === 0) return null;

  // Scale to fit
  const MAX_W = 220;
  const MAX_H = 140;
  const scale = Math.min(MAX_W / fp.width, MAX_H / fp.height, 18);
  const pxW = fp.width * scale;
  const pxH = fp.height * scale;

  return (
    <div className={cn('rounded-lg border border-border/30 bg-[#fafafa] p-2.5', className)}>
      <div
        className="relative mx-auto overflow-hidden rounded"
        style={{ width: pxW, height: pxH, backgroundColor: '#f5f5f5' }}
      >
        {placed.map((el) => {
          const ew = el.rotation === 90 ? el.h : el.w;
          const eh = el.rotation === 90 ? el.w : el.h;
          const isHit = el.zoneId != null && highlightZoneIds.includes(el.zoneId);
          const qty = isHit && el.zoneId && zoneQty ? zoneQty[el.zoneId] : null;
          const elW = ew * scale;
          const elH = eh * scale;

          return (
            <div
              key={el.id}
              className={cn(
                'absolute flex items-center justify-center rounded-[2px]',
                isHit ? 'z-20' : 'z-10'
              )}
              style={{
                left: el.x * scale,
                top: el.y * scale,
                width: elW,
                height: elH,
                backgroundColor: isHit ? '#10b981' : '#e0e0e0',
              }}
            >
              {isHit && qty != null && elW >= 14 && elH >= 14 && (
                <span
                  className="font-bold text-white drop-shadow-sm"
                  style={{ fontSize: Math.min(elW * 0.4, elH * 0.4, 13) }}
                >
                  {qty}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
