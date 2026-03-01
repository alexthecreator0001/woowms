import { useState } from 'react';
import { GridFour, Ruler } from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';

interface FloorPlanSetupProps {
  onCreate: (width: number, height: number) => void;
}

export default function FloorPlanSetup({ onCreate }: FloorPlanSetupProps) {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);

  const inputClasses = cn(
    'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm',
    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
  );

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
        <GridFour size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Create Floor Plan</h3>
      <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-md">
        Set your warehouse dimensions in meters to create a visual grid. You can then place shelves, racks, tables, and other elements on the floor plan.
      </p>

      <div className="mt-6 flex items-end gap-3">
        <div>
          <label htmlFor="fp-width" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Width (m)
          </label>
          <input
            id="fp-width"
            type="number"
            min={3}
            max={100}
            value={width}
            onChange={(e) => setWidth(Math.max(3, Math.min(100, parseInt(e.target.value) || 3)))}
            className={cn(inputClasses, 'w-24 text-center')}
          />
        </div>
        <span className="pb-2 text-lg font-medium text-muted-foreground">&times;</span>
        <div>
          <label htmlFor="fp-height" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Height (m)
          </label>
          <input
            id="fp-height"
            type="number"
            min={3}
            max={100}
            value={height}
            onChange={(e) => setHeight(Math.max(3, Math.min(100, parseInt(e.target.value) || 3)))}
            className={cn(inputClasses, 'w-24 text-center')}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Ruler size={14} />
        <span>{width} &times; {height} = {width * height}m&sup2; floor plan</span>
      </div>

      <button
        type="button"
        onClick={() => onCreate(width, height)}
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
