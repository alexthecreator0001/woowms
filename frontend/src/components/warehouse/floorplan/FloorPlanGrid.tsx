import { useRef } from 'react';
import { LinkSimple } from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import { getTemplate } from './ElementPalette';
import type { FloorPlanElement, FloorPlanElementType } from '../../../types';

const CELL_SIZE = 40;
const EPS = 0.001;

function snap(v: number): number {
  return Math.round(v * 10) / 10;
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return !(
    a.x + a.w <= b.x + EPS ||
    a.x >= b.x + b.w - EPS ||
    a.y + a.h <= b.y + EPS ||
    a.y >= b.y + b.h - EPS
  );
}

function pointInRect(px: number, py: number, r: { x: number; y: number; w: number; h: number }): boolean {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

interface FloorPlanGridProps {
  width: number;
  height: number;
  unit?: string;
  elements: FloorPlanElement[];
  selectedId: string | null;
  activeTool: FloorPlanElementType | null;
  onCellClick: (x: number, y: number) => void;
  onElementClick: (id: string) => void;
  onElementMove: (id: string, x: number, y: number) => void;
}

export default function FloorPlanGrid({
  width,
  height,
  unit,
  elements,
  selectedId,
  activeTool,
  onCellClick,
  onElementClick,
  onElementMove,
}: FloorPlanGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ elementId: string; offsetX: number; offsetY: number } | null>(null);

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollLeft = gridRef.current.scrollLeft;
    const scrollTop = gridRef.current.scrollTop;
    const rawX = (e.clientX - rect.left + scrollLeft) / CELL_SIZE;
    const rawY = (e.clientY - rect.top + scrollTop) / CELL_SIZE;

    if (rawX < 0 || rawX >= width || rawY < 0 || rawY >= height) return;

    // Check if clicking on an element (iterate in reverse for z-order)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.x < 0 || el.y < 0) continue; // skip unplaced
      const ew = el.rotation === 90 ? el.h : el.w;
      const eh = el.rotation === 90 ? el.w : el.h;
      if (pointInRect(rawX, rawY, { x: el.x, y: el.y, w: ew, h: eh })) {
        onElementClick(el.id);
        return;
      }
    }

    // Snap to 0.1 grid
    const sx = snap(Math.floor(rawX * 10) / 10);
    const sy = snap(Math.floor(rawY * 10) / 10);
    onCellClick(sx, sy);
  };

  // Drag handlers for moving elements
  const handleElementMouseDown = (e: React.MouseEvent, element: FloorPlanElement) => {
    e.stopPropagation();
    if (activeTool) {
      onElementClick(element.id);
      return;
    }
    const elRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      elementId: element.id,
      offsetX: snap((e.clientX - elRect.left) / CELL_SIZE),
      offsetY: snap((e.clientY - elRect.top) / CELL_SIZE),
    };
    onElementClick(element.id);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const scrollLeft = gridRef.current.scrollLeft;
      const scrollTop = gridRef.current.scrollTop;
      const cellX = snap((ev.clientX - gridRect.left + scrollLeft) / CELL_SIZE - dragRef.current.offsetX);
      const cellY = snap((ev.clientY - gridRect.top + scrollTop) / CELL_SIZE - dragRef.current.offsetY);
      onElementMove(dragRef.current.elementId, cellX, cellY);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const gridPxW = Math.ceil(width) * CELL_SIZE;
  const gridPxH = Math.ceil(height) * CELL_SIZE;
  const colCount = Math.ceil(width);
  const rowCount = Math.ceil(height);

  return (
    <div
      ref={gridRef}
      className="overflow-auto rounded-lg border border-border/60 bg-card"
      style={{ maxHeight: 'calc(100vh - 240px)' }}
    >
      <div
        className="relative"
        style={{
          width: gridPxW,
          height: gridPxH,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border) / 0.25) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.25) 1px, transparent 1px)',
          cursor: activeTool ? 'crosshair' : 'default',
        }}
        onClick={handleGridClick}
      >
        {/* Row/Column labels */}
        {Array.from({ length: colCount }).map((_, i) => (
          <div
            key={`col-${i}`}
            className="absolute text-[9px] text-muted-foreground/40 font-mono select-none pointer-events-none"
            style={{ left: i * CELL_SIZE + 2, top: 1 }}
          >
            {i}
          </div>
        ))}
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={`row-${i}`}
            className="absolute text-[9px] text-muted-foreground/40 font-mono select-none pointer-events-none"
            style={{ left: 2, top: i * CELL_SIZE + 1 }}
          >
            {i}
          </div>
        ))}

        {/* Scale legend */}
        {unit && (
          <div
            className="absolute flex items-center gap-1.5 pointer-events-none select-none z-30"
            style={{ bottom: 6, left: 6 }}
          >
            <div className="flex items-center gap-1 rounded bg-background/80 backdrop-blur-sm border border-border/40 px-2 py-1">
              <div className="h-px bg-foreground/50" style={{ width: CELL_SIZE }} />
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                = 1 {unit}
              </span>
            </div>
          </div>
        )}

        {/* Placed elements (skip unplaced ones created from Zones tab) */}
        {elements.filter((el) => el.x >= 0 && el.y >= 0).map((el) => {
          const template = getTemplate(el.type);
          const ew = el.rotation === 90 ? el.h : el.w;
          const eh = el.rotation === 90 ? el.w : el.h;
          const isSelected = el.id === selectedId;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              className={cn(
                'absolute flex flex-col items-center justify-center rounded-md border-2 transition-shadow select-none',
                isSelected
                  ? 'border-primary shadow-lg ring-2 ring-primary/20 z-20'
                  : cn('border-transparent hover:border-foreground/20 z-10', template.borderClass),
                activeTool ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                left: el.x * CELL_SIZE + 1,
                top: el.y * CELL_SIZE + 1,
                width: ew * CELL_SIZE - 2,
                height: eh * CELL_SIZE - 2,
                backgroundColor: el.color || template.color,
                opacity: 0.85,
              }}
              title={`${el.label} (${template.label})`}
            >
              <span className="text-white/90 drop-shadow-sm" style={{ fontSize: Math.min(ew, eh) >= 2 ? 16 : 12 }}>
                {template.icon}
              </span>
              {(ew >= 2 || eh >= 2) && (
                <span
                  className="mt-0.5 max-w-full truncate px-1 text-center font-medium text-white drop-shadow-sm"
                  style={{ fontSize: ew >= 3 ? 11 : 9, lineHeight: '1.2' }}
                >
                  {el.label}
                </span>
              )}
              {el.zoneId && (
                <span className="absolute top-0.5 right-0.5">
                  <LinkSimple size={10} className="text-white/70" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { snap, rectsOverlap };
