import { cn } from '../../lib/utils';
import type { Bin, ZoneType } from '../../types';

const zoneColorMap: Record<ZoneType, { bg: string; border: string; hoverBorder: string; text: string }> = {
  STORAGE: { bg: 'bg-blue-500/8', border: 'border-blue-200/60', hoverBorder: 'hover:border-blue-400', text: 'text-blue-700' },
  PICKING: { bg: 'bg-violet-500/8', border: 'border-violet-200/60', hoverBorder: 'hover:border-violet-400', text: 'text-violet-700' },
  RECEIVING: { bg: 'bg-amber-500/8', border: 'border-amber-200/60', hoverBorder: 'hover:border-amber-400', text: 'text-amber-700' },
  PACKING: { bg: 'bg-orange-500/8', border: 'border-orange-200/60', hoverBorder: 'hover:border-orange-400', text: 'text-orange-700' },
  SHIPPING: { bg: 'bg-emerald-500/8', border: 'border-emerald-200/60', hoverBorder: 'hover:border-emerald-400', text: 'text-emerald-700' },
  RETURNS: { bg: 'bg-red-500/8', border: 'border-red-200/60', hoverBorder: 'hover:border-red-400', text: 'text-red-700' },
};

interface BinGridProps {
  bins: Bin[];
  zoneType: ZoneType;
  onBinClick: (bin: Bin) => void;
}

export default function BinGrid({ bins, zoneType, onBinClick }: BinGridProps) {
  const colors = zoneColorMap[zoneType] || zoneColorMap.STORAGE;

  if (bins.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground/60">
        No bins in this zone yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {bins.map((bin) => {
        const stockCount = bin._stockCount ?? 0;
        const isEmpty = stockCount === 0;
        const inactive = !bin.isActive;

        return (
          <button
            key={bin.id}
            type="button"
            onClick={() => onBinClick(bin)}
            className={cn(
              'flex h-[76px] w-[76px] flex-col items-center justify-center rounded-xl border transition-all',
              colors.bg, colors.border, colors.hoverBorder,
              'hover:shadow-md cursor-pointer',
              inactive && 'opacity-40 grayscale',
            )}
          >
            <span className={cn('text-[11px] font-semibold leading-tight', inactive ? 'text-muted-foreground' : colors.text)}>
              {bin.label}
            </span>
            <span className={cn(
              'mt-0.5 text-lg font-bold leading-tight',
              isEmpty ? 'text-muted-foreground/40' : 'text-foreground',
            )}>
              {isEmpty ? '—' : stockCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
