import { useEffect, useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Grid3x3,
  Star,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse as WarehouseType } from '../types';

const zoneTypeConfig: Record<string, { bg: string; text: string }> = {
  STORAGE: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PICKING: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  RECEIVING: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  SHIPPING: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  STAGING: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
};

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/warehouse')
      .then(({ data }) => setWarehouses(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <WarehouseIcon className="h-5.5 w-5.5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Warehouse</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your warehouse zones, bins, and locations.
          </p>
        </div>
      </div>

      {/* Warehouse Cards */}
      {warehouses.map((wh) => (
        <div
          key={wh.id}
          className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
        >
          {/* Warehouse Header */}
          <div className="flex items-center gap-4 border-b border-border/50 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <WarehouseIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{wh.name}</h3>
                {wh.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                    <Star className="h-3 w-3" />
                    Default
                  </span>
                )}
              </div>
              {wh.address && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {wh.address}
                </p>
              )}
            </div>
          </div>

          {/* Zones */}
          <div className="divide-y divide-border/40">
            {wh.zones?.map((zone) => {
              const typeStyle = zoneTypeConfig[zone.type] || { bg: 'bg-gray-500/10', text: 'text-gray-500' };
              return (
                <div key={zone.id} className="border-l-4 border-l-transparent px-6 py-4 transition-all hover:border-l-primary hover:bg-primary/[0.02]">
                  <div className="flex items-center gap-3 mb-2.5">
                    <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{zone.name}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', typeStyle.bg, typeStyle.text)}>
                      {zone.type}
                    </span>
                  </div>
                  {zone.bins && zone.bins.length > 0 && (
                    <div className="ml-7 flex flex-wrap gap-1.5">
                      {zone.bins.map((bin) => (
                        <span
                          key={bin.id}
                          className="rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {bin.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {(!wh.zones || wh.zones.length === 0) && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No zones configured for this warehouse.
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {warehouses.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 blur-xl" />
            <WarehouseIcon className="relative h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No warehouses configured</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Run the database seed to create a default warehouse.</p>
        </div>
      )}
    </div>
  );
}
