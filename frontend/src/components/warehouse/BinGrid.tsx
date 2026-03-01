import { useMemo, useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
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
  shelves: Map<string, Bin[]>;
  rackKeys: string[]; // unique rack identifiers (from bin labels)
}

const INITIAL_RACKS_SHOWN = 5;

export default function BinGrid({ bins, zoneType, onBinClick }: BinGridProps) {
  const colors = zoneColorMap[zoneType] || zoneColorMap.STORAGE;

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
      for (const [, shelfBins] of shelfMap) {
        shelfBins.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      }
    }

    // Convert to sorted array (aisles sorted alphabetically, shelves descending = top shelf first)
    const aisles: AisleGroup[] = Array.from(aisleMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([aisle, shelfMap]) => {
        // Detect unique rack groupings from labels (Aisle-Rack-Shelf-Position pattern)
        const rackKeys = new Set<string>();
        for (const shelfBins of shelfMap.values()) {
          for (const bin of shelfBins) {
            const parts = bin.label.split('-');
            if (parts.length >= 2) rackKeys.add(parts[1]);
          }
        }
        return {
          aisle,
          shelves: new Map([...shelfMap.entries()].sort(([a], [b]) => b.localeCompare(a))),
          rackKeys: Array.from(rackKeys).sort(),
        };
      });

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
    <div className="space-y-5">
      {aisles.map(({ aisle, shelves, rackKeys }) => (
        <AisleSection
          key={aisle}
          aisle={aisle}
          shelves={shelves}
          rackKeys={rackKeys}
          colors={colors}
          onBinClick={onBinClick}
        />
      ))}

      {/* Ungrouped bins */}
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

/** Collapsible aisle with rack limit */
function AisleSection({
  aisle,
  shelves,
  rackKeys,
  colors,
  onBinClick,
}: {
  aisle: string;
  shelves: Map<string, Bin[]>;
  rackKeys: string[];
  colors: { bg: string; border: string; hoverBorder: string; text: string; shelfBg: string };
  onBinClick: (bin: Bin) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // If there are multiple racks, group shelves by rack
  const hasMultipleRacks = rackKeys.length > 1;
  const visibleRacks = showAll ? rackKeys : rackKeys.slice(0, INITIAL_RACKS_SHOWN);
  const hiddenRackCount = rackKeys.length - INITIAL_RACKS_SHOWN;

  // Filter bins to visible racks only (when multi-rack)
  const filterByRack = (shelfBins: Bin[], rack: string) =>
    shelfBins.filter((b) => {
      const parts = b.label.split('-');
      return parts.length >= 2 && parts[1] === rack;
    });

  return (
    <div>
      {/* Aisle header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="mb-1.5 flex w-full items-center gap-2"
      >
        {collapsed ? (
          <CaretRight size={14} weight="bold" className={colors.text} />
        ) : (
          <CaretDown size={14} weight="bold" className={colors.text} />
        )}
        <span className={cn('text-xs font-bold uppercase tracking-wider', colors.text)}>
          Aisle {aisle}
        </span>
        <span className="text-[10px] text-muted-foreground">
          ({Array.from(shelves.values()).reduce((s, bins) => s + bins.length, 0)} locations)
        </span>
        <div className="h-px flex-1 bg-border/40" />
      </button>

      {!collapsed && (
        <div className="flex flex-wrap gap-4">
          {hasMultipleRacks ? (
            // Render each rack separately
            visibleRacks.map((rack) => {
              // Build rack shelves
              const rackShelves = new Map<string, Bin[]>();
              for (const [shelf, shelfBins] of shelves) {
                const filtered = filterByRack(shelfBins, rack);
                if (filtered.length > 0) rackShelves.set(shelf, filtered);
              }
              if (rackShelves.size === 0) return null;

              return (
                <div key={rack} className="min-w-[200px]">
                  <p className="mb-1 text-[10px] font-medium text-muted-foreground">Rack {rack}</p>
                  <RackView shelves={rackShelves} colors={colors} onBinClick={onBinClick} />
                </div>
              );
            })
          ) : (
            // Single rack: render all shelves together
            <div className="min-w-[200px] flex-1">
              <RackView shelves={shelves} colors={colors} onBinClick={onBinClick} />
            </div>
          )}
        </div>
      )}

      {!collapsed && hasMultipleRacks && hiddenRackCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Show {hiddenRackCount} more rack{hiddenRackCount !== 1 ? 's' : ''}
        </button>
      )}

      {!collapsed && showAll && hiddenRackCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

/** Rack visualization */
function RackView({
  shelves,
  colors,
  onBinClick,
}: {
  shelves: Map<string, Bin[]>;
  colors: { bg: string; border: string; hoverBorder: string; text: string; shelfBg: string };
  onBinClick: (bin: Bin) => void;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', colors.border)}>
      {Array.from(shelves.entries()).map(([shelf, shelfBins], idx) => (
        <div
          key={shelf}
          className={cn(
            'flex items-center gap-0',
            idx > 0 && 'border-t border-border/30',
          )}
        >
          <div className={cn('flex w-8 shrink-0 items-center justify-center self-stretch border-r border-border/30 text-[10px] font-semibold text-muted-foreground', colors.shelfBg)}>
            {shelf}
          </div>
          <div className="flex flex-1 flex-wrap gap-0">
            {shelfBins.map((bin) => (
              <BinCell key={bin.id} bin={bin} colors={colors} onClick={() => onBinClick(bin)} />
            ))}
          </div>
        </div>
      ))}
      <div className={cn('h-1.5 w-full', colors.shelfBg)} style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(var(--border)/0.3) 4px, hsl(var(--border)/0.3) 5px)' }} />
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
  const capacity = bin.capacity;
  const isOverCapacity = capacity != null && capacity > 0 && stockCount > capacity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[60px] w-[68px] flex-col items-center justify-center border-r border-border/20 transition-all last:border-r-0',
        colors.bg,
        'hover:brightness-95 hover:shadow-sm cursor-pointer',
        inactive && 'opacity-35 grayscale',
        isOverCapacity && 'ring-1 ring-red-400/60',
      )}
    >
      <span className={cn('text-[10px] font-semibold leading-tight', inactive ? 'text-muted-foreground' : colors.text)}>
        {bin.label.length > 11 ? bin.label.slice(-5) : bin.label}
      </span>
      <span className={cn(
        'mt-0.5 text-base font-bold leading-tight',
        isEmpty ? 'text-muted-foreground/30' : isOverCapacity ? 'text-red-600' : 'text-foreground',
      )}>
        {isEmpty ? '—' : stockCount}
      </span>
      {capacity != null && capacity > 0 && (
        <span className={cn(
          'text-[8px] leading-tight',
          isOverCapacity ? 'text-red-500 font-semibold' : 'text-muted-foreground/50',
        )}>
          /{capacity}
        </span>
      )}
    </button>
  );
}
