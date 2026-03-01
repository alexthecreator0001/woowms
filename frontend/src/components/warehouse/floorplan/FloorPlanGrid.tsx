import { useRef, useCallback } from 'react';
import { LinkSimple } from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import { getTemplate } from './ElementPalette';
import type { FloorPlanElement, FloorPlanElementType } from '../../../types';

const CELL_SIZE = 40;

interface FloorPlanGridProps {
  width: number;
  height: number;
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
  elements,
  selectedId,
  activeTool,
  onCellClick,
  onElementClick,
  onElementMove,
}: FloorPlanGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ elementId: string; offsetX: number; offsetY: number } | null>(null);

  // Build occupancy grid (for collision display)
  const occupied = useCallback(() => {
    const grid: Record<string, string> = {};
    for (const el of elements) {
      const ew = el.rotation === 90 ? el.h : el.w;
      const eh = el.rotation === 90 ? el.w : el.h;
      for (let dx = 0; dx < ew; dx++) {
        for (let dy = 0; dy < eh; dy++) {
          grid[`${el.x + dx},${el.y + dy}`] = el.id;
        }
      }
    }
    return grid;
  }, [elements]);

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollLeft = gridRef.current.scrollLeft;
    const scrollTop = gridRef.current.scrollTop;
    const x = Math.floor((e.clientX - rect.left + scrollLeft) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top + scrollTop) / CELL_SIZE);
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    // Check if clicking on an element
    const occ = occupied();
    const elId = occ[`${x},${y}`];
    if (elId) {
      onElementClick(elId);
      return;
    }

    onCellClick(x, y);
  };

  // Drag handlers for moving elements
  const handleElementMouseDown = (e: React.MouseEvent, element: FloorPlanElement) => {
    e.stopPropagation();
    if (activeTool) {
      // In placement mode, don't start drag — just select
      onElementClick(element.id);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      elementId: element.id,
      offsetX: Math.floor((e.clientX - rect.left) / CELL_SIZE),
      offsetY: Math.floor((e.clientY - rect.top) / CELL_SIZE),
    };
    onElementClick(element.id);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const scrollLeft = gridRef.current.scrollLeft;
      const scrollTop = gridRef.current.scrollTop;
      const cellX = Math.floor((ev.clientX - gridRect.left + scrollLeft) / CELL_SIZE) - dragRef.current.offsetX;
      const cellY = Math.floor((ev.clientY - gridRect.top + scrollTop) / CELL_SIZE) - dragRef.current.offsetY;
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

  return (
    <div
      ref={gridRef}
      className="overflow-auto rounded-lg border border-border/60 bg-card"
      style={{ maxHeight: 'calc(100vh - 240px)' }}
    >
      <div
        className="relative"
        style={{
          width: width * CELL_SIZE,
          height: height * CELL_SIZE,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border) / 0.25) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.25) 1px, transparent 1px)',
          cursor: activeTool ? 'crosshair' : 'default',
        }}
        onClick={handleGridClick}
      >
        {/* Row/Column labels */}
        {Array.from({ length: width }).map((_, i) => (
          <div
            key={`col-${i}`}
            className="absolute text-[9px] text-muted-foreground/40 font-mono select-none pointer-events-none"
            style={{ left: i * CELL_SIZE + 2, top: 1 }}
          >
            {i}
          </div>
        ))}
        {Array.from({ length: height }).map((_, i) => (
          <div
            key={`row-${i}`}
            className="absolute text-[9px] text-muted-foreground/40 font-mono select-none pointer-events-none"
            style={{ left: 2, top: i * CELL_SIZE + 1 }}
          >
            {i}
          </div>
        ))}

        {/* Placed elements */}
        {elements.map((el) => {
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
