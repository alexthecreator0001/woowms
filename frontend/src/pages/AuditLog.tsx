import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockCounterClockwise,
  ShoppingBag,
  Cube,
  Package,
  UsersThree,
  GearSix,
  CaretLeft,
  CaretRight,
  FunnelSimple,
  UserCircle,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';

interface AuditEntry {
  id: number;
  user_name: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const resourceIcons: Record<string, typeof ShoppingBag> = {
  order: ShoppingBag,
  product: Cube,
  purchase_order: Package,
  supplier: UsersThree,
  settings: GearSix,
};

const resourceLabels: Record<string, string> = {
  order: 'Order',
  product: 'Product',
  purchase_order: 'Purchase Order',
  supplier: 'Supplier',
  settings: 'Settings',
};

function formatAction(action: string, details: Record<string, unknown> | null): string {
  switch (action) {
    case 'order.status_changed':
      return `changed order status from ${details?.from || '?'} to ${details?.to || '?'}`;
    case 'inventory.stock_adjusted':
      return `adjusted stock${details?.sku ? ` for ${details.sku}` : ''} by ${details?.quantity || '?'} units`;
    case 'po.created':
      return `created purchase order ${details?.poNumber || ''}`;
    case 'po.status_changed':
      return `changed PO status from ${details?.from || '?'} to ${details?.to || '?'}`;
    case 'po.items_received':
      return `received items (${details?.status || ''})`;
    case 'supplier.created':
      return `created supplier ${details?.name || ''}`;
    default:
      return action.replace(/\./g, ' ');
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${time}`;
}

const resourceOptions = ['all', 'order', 'product', 'purchase_order', 'supplier', 'settings'];

export default function AuditLog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('all');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (resource !== 'all') params.resource = resource;
      const { data } = await api.get('/audit', { params });
      setEntries(data.data);
      setMeta(data.meta);
    } catch {}
    setLoading(false);
  }, [page, resource]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleResourceClick = (entry: AuditEntry) => {
    if (!entry.resource_id) return;
    const routes: Record<string, string> = {
      order: '/orders',
      product: '/inventory',
      purchase_order: '/receiving',
      supplier: '/suppliers',
    };
    const base = routes[entry.resource];
    if (base) navigate(`${base}/${entry.resource_id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit log of all changes across your workspace.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FunnelSimple size={14} />
          <span className="text-[12px] font-medium">Filter:</span>
        </div>
        <div className="flex gap-1.5">
          {resourceOptions.map((r) => (
            <button
              key={r}
              onClick={() => { setResource(r); setPage(1); }}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                resource === r
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {r === 'all' ? 'All' : resourceLabels[r] || r}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClockCounterClockwise size={36} weight="light" className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Actions like status changes and stock adjustments will appear here.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Resource</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const Icon = resourceIcons[entry.resource] || ClockCounterClockwise;
                return (
                  <tr key={entry.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                      {formatTime(entry.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserCircle size={20} weight="fill" className="text-muted-foreground/40 flex-shrink-0" />
                        <span className="text-[13px] font-medium truncate max-w-[120px]">
                          {entry.user_name || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {formatAction(entry.action, entry.details)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleResourceClick(entry)}
                        disabled={!entry.resource_id}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium',
                          entry.resource_id
                            ? 'text-primary hover:bg-primary/10 transition-colors cursor-pointer'
                            : 'text-muted-foreground cursor-default'
                        )}
                      >
                        <Icon size={14} />
                        {resourceLabels[entry.resource] || entry.resource}
                        {entry.resource_id && ` #${entry.resource_id}`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <p className="text-[12px] text-muted-foreground">
              Page {meta.page} of {meta.pages} ({meta.total} entries)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <CaretLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
