import { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import api from '../services/api.js';

const shippingStatusConfig = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  LABEL_CREATED: { label: 'Label Created', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  SHIPPED: { label: 'Shipped', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  IN_TRANSIT: { label: 'In Transit', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

export default function Shipping() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shipping')
      .then(({ data }) => setShipments(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track shipments and manage deliveries.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carrier</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipped</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {shipments.map((s) => {
              const status = shippingStatusConfig[s.status] || shippingStatusConfig.PENDING;
              return (
                <tr key={s.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5 text-sm font-semibold">#{s.order?.orderNumber}</td>
                  <td className="px-5 py-3.5">
                    {s.carrier ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.carrier}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {s.trackingNumber ? (
                      <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium">{s.trackingNumber}</code>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {s.shippedAt ? new Date(s.shippedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              );
            })}
            {shipments.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-5 py-16 text-center">
                  <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground">No shipments yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Shipments will appear here after orders are packed.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
