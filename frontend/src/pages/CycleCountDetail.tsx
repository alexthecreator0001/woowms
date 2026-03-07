import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ListMagnifyingGlass,
  Play,
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Checks,
  Trash,
  Prohibit,
  CircleNotch,
  Warning,
  Eye,
  EyeSlash,
  User,
  CalendarBlank,
  Buildings,
  Note,
  CaretDown,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { CycleCount, CycleCountItem, TokenPayload } from '../types';

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PLANNED: { label: 'Planned', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'Counting', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  REVIEW: { label: 'Review', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
};

const typeLabels: Record<string, string> = { ZONE: 'Zone', LOCATION: 'Location', PRODUCT: 'Product' };

const resolutionConfig: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  DISMISSED: { label: 'Dismissed', bg: 'bg-red-500/10', text: 'text-red-500' },
};

export default function CycleCountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cc, setCc] = useState<CycleCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const payload = getTokenPayload();
  const isManager = payload?.role === 'ADMIN' || payload?.role === 'MANAGER';

  useEffect(() => { loadDetail(); }, [id]);

  async function loadDetail() {
    try {
      setLoading(true);
      const { data } = await api.get(`/cycle-counts/${id}`);
      setCc(data.data);
    } catch {
      navigate('/cycle-counts');
    } finally {
      setLoading(false);
    }
  }

  async function doAction(action: string, method = 'patch', body?: any) {
    try {
      setActionLoading(action);
      if (method === 'post') {
        await api.post(`/cycle-counts/${id}/${action}`, body || {});
      } else if (method === 'delete') {
        await api.delete(`/cycle-counts/${id}`);
        navigate('/cycle-counts');
        return;
      } else {
        await api.patch(`/cycle-counts/${id}/${action}`, body || {});
      }
      await loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
      setShowMenu(false);
    }
  }

  async function countItem(itemId: number, countedQty: number, notes?: string) {
    try {
      await api.patch(`/cycle-counts/${id}/items/${itemId}/count`, { countedQty, notes });
      await loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save count');
    }
  }

  async function resolveItem(itemId: number, resolution: string) {
    try {
      await api.patch(`/cycle-counts/${id}/items/${itemId}/resolve`, { resolution });
      await loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  }

  if (loading || !cc) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = cc.items || [];
  const counted = items.filter((i) => i.countedQty !== null).length;
  const withVariance = items.filter((i) => i.variance !== null && i.variance !== 0).length;
  const netVariance = items.reduce((sum, i) => sum + (i.variance ?? 0), 0);
  const allCounted = counted === items.length;
  const pendingVariance = items.filter((i) => i.variance !== 0 && i.resolution === 'PENDING').length;
  const allResolved = pendingVariance === 0;
  const status = statusConfig[cc.status] || statusConfig.PLANNED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/cycle-counts"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Cycle Counts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{cc.ccNumber}</h1>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
            <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {typeLabels[cc.type] || cc.type}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {cc.status === 'PLANNED' && isManager && (
            <>
              <button
                onClick={() => doAction('start')}
                disabled={!!actionLoading}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading === 'start' ? <CircleNotch size={14} className="animate-spin" /> : <Play size={14} weight="fill" />}
                Start Counting
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
                >
                  More <CaretDown size={12} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-xl border border-border/60 bg-card py-1 shadow-lg">
                    <button
                      onClick={() => doAction('cancel')}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    >
                      <Prohibit size={14} /> Cancel
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this cycle count?')) doAction('', 'delete'); }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-red-500 hover:bg-red-500/5"
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {cc.status === 'IN_PROGRESS' && (
            <button
              onClick={() => doAction('submit')}
              disabled={!allCounted || !!actionLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {actionLoading === 'submit' ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
              Submit for Review
            </button>
          )}

          {cc.status === 'REVIEW' && isManager && (
            <button
              onClick={() => doAction('reconcile', 'post')}
              disabled={!allResolved || !!actionLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600/90 disabled:opacity-50"
            >
              {actionLoading === 'reconcile' ? <CircleNotch size={14} className="animate-spin" /> : <Checks size={14} weight="bold" />}
              Reconcile
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Total Items</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Counted</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{counted}<span className="text-sm font-normal text-muted-foreground">/{items.length}</span></p>
          {items.length > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(counted / items.length) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">With Variance</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {withVariance}
            {counted > 0 && <span className="text-sm font-normal text-muted-foreground"> ({Math.round((withVariance / counted) * 100)}%)</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Net Variance</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', netVariance > 0 ? 'text-emerald-600' : netVariance < 0 ? 'text-red-500' : '')}>
            {netVariance > 0 ? '+' : ''}{netVariance}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items section */}
        <div className="lg:col-span-2">
          {cc.status === 'PLANNED' && <PlannedItems items={items} />}
          {cc.status === 'IN_PROGRESS' && <CountingItems items={items} blindCount={cc.blindCount} onCount={countItem} />}
          {cc.status === 'REVIEW' && (
            <ReviewItems
              items={items}
              onResolve={resolveItem}
              onResolveAll={(resolution) => doAction('resolve-all', 'patch', { resolution })}
              isManager={isManager}
            />
          )}
          {(cc.status === 'COMPLETED' || cc.status === 'CANCELLED') && <CompletedItems items={items} />}
        </div>

        {/* Sidebar */}
        <div>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold">Count Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CC #</span>
                <span className="font-medium">{cc.ccNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{typeLabels[cc.type]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Blind count</span>
                <span className="font-medium">{cc.blindCount ? 'Yes' : 'No'}</span>
              </div>
              {cc.assignedToName && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><User size={14} /> Assigned to</span>
                  <span className="font-medium">{cc.assignedToName}</span>
                </div>
              )}
              {cc.plannedDate && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarBlank size={14} /> Planned</span>
                  <span className="font-medium">{new Date(cc.plannedDate).toLocaleDateString()}</span>
                </div>
              )}
              {cc.startedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">{new Date(cc.startedAt).toLocaleString()}</span>
                </div>
              )}
              {cc.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{new Date(cc.completedAt).toLocaleString()}</span>
                </div>
              )}
              {cc.createdByName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created by</span>
                  <span className="font-medium">{cc.createdByName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(cc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {cc.notes && (
              <div className="border-t border-border/50 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1"><Note size={13} /> Notes</p>
                <p className="text-sm text-muted-foreground">{cc.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status-specific item components ──────────────────

function PlannedItems({ items }: { items: CycleCountItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-muted/40 px-5 py-3">
        <h3 className="text-sm font-semibold">Items to Count</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/30">
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">SKU</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Bin</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-2.5 text-sm font-medium">{item.productName}</td>
              <td className="px-5 py-2.5 text-sm text-muted-foreground">{item.sku || '—'}</td>
              <td className="px-5 py-2.5"><code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-medium">{item.binLabel}</code></td>
              <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums">{item.expectedQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountingItems({ items, blindCount, onCount }: { items: CycleCountItem[]; blindCount: boolean; onCount: (id: number, qty: number, notes?: string) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editNotes, setEditNotes] = useState('');

  function startEdit(item: CycleCountItem) {
    setEditingId(item.id);
    setEditQty(item.countedQty !== null ? String(item.countedQty) : '');
    setEditNotes(item.notes || '');
  }

  function saveEdit(itemId: number) {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) return;
    onCount(itemId, qty, editNotes || undefined);
    setEditingId(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-muted/40 px-5 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Count Items</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {blindCount ? <EyeSlash size={14} /> : <Eye size={14} />}
          {blindCount ? 'Blind count' : 'Expected visible'}
        </div>
      </div>
      <div className="divide-y divide-border/20">
        {items.map((item) => {
          const isEditing = editingId === item.id;
          const isCounted = item.countedQty !== null;

          return (
            <div
              key={item.id}
              className={cn(
                'px-5 py-3.5 transition-colors',
                isCounted && !isEditing ? 'bg-emerald-500/[0.02]' : ''
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted/50 px-1.5 py-0.5 font-medium">{item.binLabel}</code>
                    {item.sku && <span>{item.sku}</span>}
                    {!blindCount && <span className="text-muted-foreground/50">Expected: {item.expectedQty}</span>}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                      autoFocus
                      className="h-9 w-20 rounded-lg border border-primary bg-background px-3 text-center text-sm font-medium tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <CheckCircle size={14} weight="fill" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-9 items-center rounded-lg border border-border/60 px-3 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : isCounted ? (
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-lg font-bold tabular-nums',
                      item.variance !== 0 ? (item.variance! > 0 ? 'text-emerald-600' : 'text-red-500') : 'text-foreground'
                    )}>
                      {item.countedQty}
                    </span>
                    {item.variance !== 0 && (
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        item.variance! > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                      )}>
                        {item.variance! > 0 ? '+' : ''}{item.variance}
                      </span>
                    )}
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(item)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
                  >
                    Count
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewItems({ items, onResolve, onResolveAll, isManager }: {
  items: CycleCountItem[];
  onResolve: (id: number, res: string) => void;
  onResolveAll: (res: string) => void;
  isManager: boolean;
}) {
  const varianceItems = items.filter((i) => i.variance !== null && i.variance !== 0);
  const noVarianceItems = items.filter((i) => i.variance === 0);
  const pendingCount = varianceItems.filter((i) => i.resolution === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Variance items */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/40 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Warning size={16} className="text-amber-500" />
            Variance Items ({varianceItems.length})
          </h3>
          {isManager && pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onResolveAll('ACCEPTED')}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600/90"
              >
                <CheckCircle size={13} weight="fill" /> Accept All
              </button>
              <button
                onClick={() => onResolveAll('DISMISSED')}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:bg-muted/60"
              >
                <XCircle size={13} /> Dismiss All
              </button>
            </div>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Bin</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expected</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Counted</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Variance</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {varianceItems.map((item) => {
              const res = resolutionConfig[item.resolution] || resolutionConfig.PENDING;
              return (
                <tr key={item.id} className={cn(item.resolution === 'PENDING' ? 'bg-amber-500/[0.02]' : '')}>
                  <td className="px-5 py-2.5">
                    <p className="text-sm font-medium">{item.productName}</p>
                    {item.sku && <p className="text-[11px] text-muted-foreground">{item.sku}</p>}
                  </td>
                  <td className="px-5 py-2.5"><code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-medium">{item.binLabel}</code></td>
                  <td className="px-5 py-2.5 text-right text-sm tabular-nums">{item.expectedQty}</td>
                  <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums">{item.countedQty}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={cn(
                      'font-bold tabular-nums text-sm',
                      item.variance! > 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {item.variance! > 0 ? '+' : ''}{item.variance}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {item.resolution === 'PENDING' && isManager ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onResolve(item.id, 'ACCEPTED')}
                          className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-medium text-white hover:bg-emerald-600/90"
                        >
                          <CheckCircle size={12} weight="fill" /> Accept
                        </button>
                        <button
                          onClick={() => onResolve(item.id, 'DISMISSED')}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted/60"
                        >
                          <XCircle size={12} /> Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', res.bg, res.text)}>
                        {res.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {varianceItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground/50">
                  No variance items — all counts match expected quantities.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* No-variance items (collapsed) */}
      {noVarianceItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-muted/40 px-5 py-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              <CheckCircle size={14} weight="fill" className="inline mr-1.5 text-emerald-500" />
              Matching Items ({noVarianceItems.length})
            </h3>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-border/20">
              {noVarianceItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-2 text-sm text-muted-foreground">{item.productName}</td>
                  <td className="px-5 py-2"><code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{item.binLabel}</code></td>
                  <td className="px-5 py-2 text-right text-sm text-muted-foreground tabular-nums">{item.expectedQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompletedItems({ items }: { items: CycleCountItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-muted/40 px-5 py-3">
        <h3 className="text-sm font-semibold">Final Results</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/30">
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Bin</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expected</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Counted</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Variance</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Resolution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((item) => {
            const res = resolutionConfig[item.resolution] || resolutionConfig.PENDING;
            return (
              <tr key={item.id}>
                <td className="px-5 py-2.5">
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.sku && <p className="text-[11px] text-muted-foreground">{item.sku}</p>}
                </td>
                <td className="px-5 py-2.5"><code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-medium">{item.binLabel}</code></td>
                <td className="px-5 py-2.5 text-right text-sm tabular-nums">{item.expectedQty}</td>
                <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums">{item.countedQty ?? '—'}</td>
                <td className="px-5 py-2.5 text-right">
                  {item.variance !== null && item.variance !== 0 ? (
                    <span className={cn('font-bold tabular-nums text-sm', item.variance > 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {item.variance > 0 ? '+' : ''}{item.variance}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/40">0</span>
                  )}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', res.bg, res.text)}>
                    {res.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
