import { cn } from '../../lib/utils';

interface Segment {
  value: number;
  color: string;
  label?: string;
}

interface UtilizationBarProps {
  segments: Segment[];
  total: number;
  height?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export default function UtilizationBar({
  segments,
  total,
  height = 'sm',
  showLabels = false,
  className,
}: UtilizationBarProps) {
  if (total === 0) {
    return (
      <div className={cn('w-full rounded-full bg-muted/50', height === 'sm' ? 'h-1.5' : 'h-2.5', className)} />
    );
  }

  return (
    <div className={className}>
      <div className={cn('flex w-full overflow-hidden rounded-full bg-muted/50', height === 'sm' ? 'h-1.5' : 'h-2.5')}>
        {segments.map((seg, i) => {
          const pct = Math.max(0, (seg.value / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className={cn('transition-all', seg.color)}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {segments.filter((s) => s.label).map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', seg.color)} />
              <span className="text-[11px] text-muted-foreground">
                {seg.label} ({seg.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
