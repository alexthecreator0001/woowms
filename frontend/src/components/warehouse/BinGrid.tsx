import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import type { Bin, ZoneType } from '../../types';

const zoneColorMap: Record<ZoneType, { bg: string; border: string; hoverBorder: string; text: string; shelfBg: string }> = {
  STORAGE:   { bg: 'bg-blue-500/8',    border: 'border-blue-200/60',    hoverBorder: 'hover:border-blue-400',    text: 'text-blue-700',    shelfBg: 'bg-blue-500/5' },
  PICKING:   { bg: 'bg-violet-500/8',  border: 'border-violet-200/60',  hoverBorder: 'hover:border-violet-400',  text: 'text-violet-700',  shelfBg: 'bg-violet-500/5' },
  RECEIVING: { bg: 'bg-amber-500/8',   border: 'border-amber-200/60',   hoverBorder: 'hover:border-amber-400',   text: 'text-amber-700',   shelfBg: 'bg-amber-500/5' },
  PACKING:   { bg: 'bg-orange-500/8',  border: 'border-orange-200/60',  hoverBorder: 'hover:border-orange-400',  text: 'text-orange-700',  shelfBg: 'bg-orange-500/5' },
  SHIPPING:  { bg: 'bg-emerald-500/8', border: 'border-emerald-200/60', hoverBorder: 'hover:border-emerald-400', text: 'text-emerald-700', shelfBg: 'bg-emerald-500/5' },
  RETURNS:   { bg: 'bg-red-500/8',     border: 'border-red-200/60',     hoverBorder: 'hover:border-red-400',     text: 'text-red-700',     shelfBg: 'bg-red-500/5' },
};

interface BinGridProps {
  bins: Bin[];
  zoneType: ZoneType;
  onBinClick: (bin: Bin) => void;
}

interface AisleGroup {
  aisle: string;
  shelves: Map<string, Bin[]>; // shelf number → bins sorted by position
}

export default function BinGrid({ bins, zoneType, onBinClick }: BinGridProps) {
  const colors = zoneColorMap[zoneType] || zoneColorMap.STORAGE;

  // Group bins into aisle → shelf → position hierarchy
  const { aisles, ungrouped } = useMemo(() => {
    const grouped: Bin[] = [];
    const ungrouped: Bin[] = [];

    for (const bin of bins) {
      if (bin.row && bin.shelf) {
        grouped.push(bin);
      } else {
        ungrouped.push(bin);
      }
    }

    // Build aisle groups
    const aisleMap = new Map<string, Map<string, Bin[]>>();
    for (const bin of grouped) {
      const aisle = bin.row!;
      const shelf = bin.shelf!;
      if (!aisleMap.has(aisle)) aisleMap.set(aisle, new Map());
      const shelfMap = aisleMap.get(aisle)!;
      if (!shelfMap.has(shelf)) shelfMap.set(shelf, []);
      shelfMap.get(shelf)!.push(bin);
    }

    // Sort positions within each shelf
    for (const shelfMap of aisleMap.values()) {
      for (const [shelf, shelfBins] of shelfMap) {
        shelfBins.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      }
    }

    // Convert to sorted array (aisles sorted alphabetically, shelves descending = top shelf first)
    const aisles: AisleGroup[] = Array.from(aisleMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([aisle, shelfMap]) => ({ aisle, shelves: new Map([...shelfMap.entries()].sort(([a], [b]) => b.localeCompare(a))) }));

    return { aisles, ungrouped };
  }, [bins]);

  if (bins.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground/60">
        No locations in this zone yet. Use "Generate Locations" to create your shelf layout.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rack view — grouped by aisle */}
      <div className="flex flex-wrap gap-4">
        {aisles.map(({ aisle, shelves }) => (
          <div key={aisle} className="min-w-[200px] flex-1">
            {/* Aisle label */}
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn('text-xs font-bold uppercase tracking-wider', colors.text)}>
                Aisle {aisle}
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            {/* Rack — shelves stacked top to bottom */}
            <div className={cn('overflow-hidden rounded-lg border', colors.border)}>
              {Array.from(shelves.entries()).map(([shelf, shelfBins], idx) => (
                <div
                  key={shelf}
                  className={cn(
                    'flex items-center gap-0',
                    idx > 0 && 'border-t border-border/30',
                  )}
                >
                  {/* Shelf label on left */}
                  <div className={cn('flex w-8 shrink-0 items-center justify-center self-stretch border-r border-border/30 text-[10px] font-semibold text-muted-foreground', colors.shelfBg)}>
                    {shelf}
                  </div>

                  {/* Position bins */}
                  <div className="flex flex-1 flex-wrap gap-0">
                    {shelfBins.map((bin) => (
                      <BinCell key={bin.id} bin={bin} colors={colors} onClick={() => onBinClick(bin)} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Floor indicator */}
              <div className={cn('h-1.5 w-full', colors.shelfBg)} style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(var(--border)/0.3) 4px, hsl(var(--border)/0.3) 5px)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Ungrouped bins (manually added without row/shelf) */}
      {ungrouped.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Unassigned Locations</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ungrouped.map((bin) => (
              <BinCell key={bin.id} bin={bin} colors={colors} onClick={() => onBinClick(bin)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BinCell({
  bin,
  colors,
  onClick,
}: {
  bin: Bin;
  colors: { bg: string; border: string; hoverBorder: string; text: string };
  onClick: () => void;
}) {
  const stockCount = bin._stockCount ?? 0;
  const isEmpty = stockCount === 0;
  const inactive = !bin.isActive;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[60px] w-[68px] flex-col items-center justify-center border-r border-border/20 transition-all last:border-r-0',
        colors.bg,
        'hover:brightness-95 hover:shadow-sm cursor-pointer',
        inactive && 'opacity-35 grayscale',
      )}
    >
      <span className={cn('text-[10px] font-semibold leading-tight', inactive ? 'text-muted-foreground' : colors.text)}>
        {bin.label.length > 11 ? bin.label.slice(-5) : bin.label}
      </span>
      <span className={cn(
        'mt-0.5 text-base font-bold leading-tight',
        isEmpty ? 'text-muted-foreground/30' : 'text-foreground',
      )}>
        {isEmpty ? '—' : stockCount}
      </span>
    </button>
  );
}
