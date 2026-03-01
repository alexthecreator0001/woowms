import { useState } from 'react';
import { GridFour, Ruler } from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';

interface FloorPlanSetupProps {
  onCreate: (width: number, height: number, unit: 'm' | 'ft') => void;
}

export default function FloorPlanSetup({ onCreate }: FloorPlanSetupProps) {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [unit, setUnit] = useState<'m' | 'ft'>('ft');

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  const unitLabel = unit === 'ft' ? 'ft' : 'm';
  const areaLabel = unit === 'ft' ? 'ft\u00B2' : 'm\u00B2';
  const area = Math.round(width * height * 10) / 10;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
        <GridFour size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Create Floor Plan</h3>
      <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-md">
        Set your warehouse dimensions to create a visual grid. You can then place shelves, racks, tables, and other elements on the floor plan.
      </p>

      {/* Unit toggle */}
      <div className="mt-6 flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setUnit('ft')}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            unit === 'ft'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          ft
        </button>
        <button
          type="button"
          onClick={() => setUnit('m')}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            unit === 'm'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          m
        </button>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <div>
          <label htmlFor="fp-width" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Width ({unitLabel})
          </label>
          <input
            id="fp-width"
            type="number"
            min={3}
            max={100}
            step="0.1"
            value={width}
            onChange={(e) => setWidth(Math.max(3, Math.min(100, parseFloat(e.target.value) || 3)))}
            className={cn(inputClasses, 'w-24 text-center')}
          />
        </div>
        <span className="pb-2 text-lg font-medium text-muted-foreground">&times;</span>
        <div>
          <label htmlFor="fp-height" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Height ({unitLabel})
          </label>
          <input
            id="fp-height"
            type="number"
            min={3}
            max={100}
            step="0.1"
            value={height}
            onChange={(e) => setHeight(Math.max(3, Math.min(100, parseFloat(e.target.value) || 3)))}
            className={cn(inputClasses, 'w-24 text-center')}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Ruler size={14} />
        <span>{width} &times; {height} = {area}{areaLabel} floor plan</span>
      </div>

      <button
        type="button"
        onClick={() => onCreate(width, height, unit)}
        className={cn(
          'mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground',
          'hover:bg-primary/90 shadow-sm transition-colors',
        )}
      >
        <GridFour size={16} weight="bold" />
        Create Floor Plan
      </button>
    </div>
  );
}
