import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import type { TableColumnDef } from '../types';

interface Props {
  columns: TableColumnDef[];
  visibleIds: string[];
  onToggle: (id: string) => void;
}

export default function TableConfigDropdown({ columns, visibleIds, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
          open
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border/60 bg-card text-muted-foreground hover:text-foreground shadow-sm'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-card p-1.5 shadow-lg">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Toggle Columns
          </p>
          {columns.map((col) => {
            const checked = visibleIds.includes(col.id);
            const disabled = checked && visibleIds.length <= 2;
            return (
              <button
                key={col.id}
                onClick={() => !disabled && onToggle(col.id)}
                disabled={disabled}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-muted/60'
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    checked
                      ? 'border-primary bg-primary text-white'
                      : 'border-border/80 bg-background'
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </div>
                <span className="font-medium">{col.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
