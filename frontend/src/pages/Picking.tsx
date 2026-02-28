import { useEffect, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { PickList } from '../types';

const pickStatusConfig: Record<string, { label: string; bg: string; text: string; icon: LucideIcon }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Loader2 },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle2 },
};

export default function Picking() {
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/picking')
      .then(({ data }) => setPickLists(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
          <ClipboardList className="h-5.5 w-5.5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Picking</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage pick lists and track picking progress.
          </p>
        </div>
      </div>

      {/* Pick Lists */}
      <div className="space-y-4">
        {pickLists.map((pl) => {
          const status = pickStatusConfig[pl.status] || pickStatusConfig.PENDING;
          const StatusIcon = status.icon;
          const pickedCount = pl.items?.filter((i) => i.isPicked).length || 0;
          const totalItems = pl.items?.length || 0;
          const progress = totalItems > 0 ? (pickedCount / totalItems) * 100 : 0;

          return (
            <div
              key={pl.id}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
            >
              {/* Pick List Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                    <ClipboardList className="h-[18px] w-[18px] text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Pick List #{pl.id}</p>
                    <p className="text-xs text-muted-foreground">Order #{pl.order?.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{pickedCount}/{totalItems} items</p>
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {totalItems > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bin</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Picked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {pl.items?.map((item) => (
                      <tr key={item.id} className="border-l-4 border-l-transparent transition-all hover:border-l-violet-500 hover:bg-violet-500/[0.03]">
                        <td className="px-5 py-2.5">
                          <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium">{item.sku}</code>
                        </td>
                        <td className="px-5 py-2.5 text-sm">{item.productName}</td>
                        <td className="px-5 py-2.5">
                          <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{item.binLabel}</span>
                        </td>
                        <td className="px-5 py-2.5 text-sm font-medium">{item.quantity}</td>
                        <td className="px-5 py-2.5">
                          {item.isPicked ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/30" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {pickLists.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-xl" />
            <ClipboardList className="relative h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No pick lists yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Generate a pick list from an order to get started.</p>
        </div>
      )}
    </div>
  );
}
