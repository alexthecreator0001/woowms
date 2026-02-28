import { useEffect, useState } from 'react';
import {
  PackageOpen,
  Calendar,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { PurchaseOrder } from '../types';

const poStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  PARTIAL: { label: 'Partial', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
};

export default function Receiving() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/receiving')
      .then(({ data }) => setPurchaseOrders(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
          <PackageOpen className="h-5.5 w-5.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Receiving</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track inbound shipments and purchase orders.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO #</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {purchaseOrders.map((po) => {
              const status = poStatusConfig[po.status] || poStatusConfig.PENDING;
              return (
                <tr key={po.id} className="border-l-4 border-l-transparent transition-all hover:border-l-amber-500 hover:bg-amber-500/[0.03]">
                  <td className="px-5 py-3.5 text-sm font-semibold">{po.poNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{po.supplier}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{po.items?.length || 0}</td>
                  <td className="px-5 py-3.5">
                    {po.expectedDate ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(po.expectedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {purchaseOrders.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-xl" />
                    <PackageOpen className="relative h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No purchase orders yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Purchase orders will appear here once created.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
