import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUUpLeft,
  CircleNotch,
  Cube,
  DotsThreeVertical,
  Check,
  Package,
  Recycle,
  Trash,
  Warning,
  CurrencyDollar,
  CaretDown,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import type { ReturnOrder, ReturnOrderItem, RMAStatus } from '../types';

const rmaStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  REQUESTED: { label: 'Requested', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  AUTHORIZED: { label: 'Authorized', bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  RECEIVING: { label: 'Receiving', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const conditionLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'text-emerald-600' },
  OPENED: { label: 'Opened', color: 'text-blue-600' },
  DAMAGED: { label: 'Damaged', color: 'text-red-600' },
  DEFECTIVE: { label: 'Defective', color: 'text-orange-600' },
};

const resolutionConfig: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  RESTOCK: { label: 'Restocked', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  DISPOSE: { label: 'Disposed', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  DAMAGED: { label: 'Damaged', bg: 'bg-red-500/10', text: 'text-red-600' },
};

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rma, setRma] = useState<ReturnOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Receive mode state
  const [receiveMode, setReceiveMode] = useState(false);
  const [receiveItems, setReceiveItems] = useState<
    { itemId: number; receivedQty: number; condition: string; resolution: string; notes: string }[]
  >([]);

  // Notes editing
  const [editNotes, setEditNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadRMA();
  }, [id]);

  async function loadRMA() {
    try {
      setLoading(true);
      const { data } = await api.get(`/returns/${id}`);
      setRma(data.data);
      setEditNotes(data.data.notes || '');
    } catch {
      navigate('/returns', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  function enterReceiveMode() {
    if (!rma?.items) return;
    setReceiveItems(
      rma.items.map((item) => ({
        itemId: item.id,
        receivedQty: item.receivedQty || item.quantity,
        condition: item.condition || 'NEW',
        resolution: item.resolution === 'PENDING' ? 'RESTOCK' : item.resolution,
        notes: item.notes || '',
      }))
    );
    setReceiveMode(true);
  }

  function updateReceiveItem(idx: number, field: string, value: any) {
    setReceiveItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function saveReceive() {
    try {
      setActionLoading(true);
      await api.patch(`/returns/${id}/receive`, { items: receiveItems });
      setReceiveMode(false);
      await loadRMA();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save received items');
    } finally {
      setActionLoading(false);
    }
  }

  async function transitionStatus(newStatus: string) {
    const confirmMessages: Record<string, string> = {
      AUTHORIZED: 'Authorize this return? The customer can ship items back.',
      RECEIVING: 'Start receiving? This marks items as arriving at the warehouse.',
      REJECTED: 'Reject this return request?',
      CANCELLED: 'Cancel this return?',
    };
    if (confirmMessages[newStatus] && !confirm(confirmMessages[newStatus])) return;

    try {
      setActionLoading(true);
      setShowMenu(false);
      await api.patch(`/returns/${id}/status`, { status: newStatus });
      await loadRMA();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  async function completeReturn() {
    if (!confirm('Complete this return? Stock adjustments will be applied for restocked items.')) return;
    try {
      setActionLoading(true);
      await api.patch(`/returns/${id}/complete`);
      await loadRMA();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete return');
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteReturn() {
    if (!confirm('Delete this return? This cannot be undone.')) return;
    try {
      await api.delete(`/returns/${id}`);
      navigate('/returns');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete return');
    }
  }

  async function saveNotes() {
    try {
      setSavingNotes(true);
      await api.patch(`/returns/${id}`, { notes: editNotes });
      setRma((prev) => prev ? { ...prev, notes: editNotes } : prev);
    } catch {
      // silent
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading || !rma) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const status = rmaStatusConfig[rma.status] || rmaStatusConfig.REQUESTED;
  const items = rma.items || [];
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const receivedQty = items.reduce((s, i) => s + i.receivedQty, 0);
  const restockedCount = items.filter((i) => i.resolution === 'RESTOCK').length;
  const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(rma.status);
  const allResolved = items.every((i) => i.resolution !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/returns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          Returns
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{rma.rmaNumber}</h1>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {receiveMode ? (
              <>
                <button
                  onClick={saveReceive}
                  disabled={actionLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionLoading ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} weight="bold" />}
                  Save
                </button>
                <button
                  onClick={() => setReceiveMode(false)}
                  className="inline-flex h-9 items-center rounded-lg border border-border/60 bg-card px-3.5 text-sm font-medium shadow-sm hover:bg-muted/60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {rma.status === 'REQUESTED' && (
                  <button
                    onClick={() => transitionStatus('AUTHORIZED')}
                    disabled={actionLoading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    Authorize
                  </button>
                )}
                {rma.status === 'AUTHORIZED' && (
                  <button
                    onClick={() => transitionStatus('RECEIVING')}
                    disabled={actionLoading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    Receive Items
                  </button>
                )}
                {rma.status === 'RECEIVING' && !receiveMode && (
                  <>
                    <button
                      onClick={enterReceiveMode}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 text-sm font-medium shadow-sm hover:bg-muted/60"
                    >
                      Inspect Items
                    </button>
                    <button
                      onClick={completeReturn}
                      disabled={actionLoading || !allResolved}
                      title={!allResolved ? 'All items must have a resolution before completing' : ''}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      Complete Return
                    </button>
                  </>
                )}
                {!isTerminal && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card shadow-sm hover:bg-muted/60"
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 z-40 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                          {rma.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => transitionStatus('REJECTED')}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-500/5"
                              >
                                Reject Return
                              </button>
                              <button
                                onClick={deleteReturn}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-500/5"
                              >
                                Delete Return
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => transitionStatus('CANCELLED')}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-500/5"
                          >
                            Cancel Return
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Items', value: `${totalQty} pcs`, sub: `${items.length} line item${items.length !== 1 ? 's' : ''}`, icon: Package },
          { label: 'Received', value: `${receivedQty}/${totalQty}`, sub: totalQty > 0 ? `${Math.round((receivedQty / totalQty) * 100)}%` : '0%', icon: ArrowUUpLeft },
          { label: 'Restocked', value: String(restockedCount), sub: `of ${items.length} items`, icon: Recycle },
          { label: 'Refund', value: rma.refundAmount ? `$${parseFloat(rma.refundAmount).toFixed(2)}` : '—', sub: rma.refundAmount ? 'Tracked amount' : 'Not set', icon: CurrencyDollar },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <card.icon size={14} weight="duotone" />
              {card.label}
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground/70">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-5 py-3">
              <h3 className="text-sm font-semibold">Items</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">SKU</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Qty</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Received</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Condition</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {items.map((item, idx) => {
                  const cond = conditionLabels[item.condition] || conditionLabels.NEW;
                  const resol = resolutionConfig[item.resolution] || resolutionConfig.PENDING;

                  if (receiveMode) {
                    const ri = receiveItems[idx];
                    if (!ri) return null;
                    return (
                      <tr key={item.id} className="bg-amber-500/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl ? (
                              <img src={proxyUrl(item.imageUrl, 64) || ''} alt="" className="h-8 w-8 rounded-md border border-border/40 object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50"><Cube size={14} className="text-muted-foreground/30" /></div>
                            )}
                            <span className="text-sm font-medium">{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku || '—'}</td>
                        <td className="px-4 py-3 text-sm tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={ri.receivedQty}
                            onChange={(e) => updateReceiveItem(idx, 'receivedQty', Math.min(parseInt(e.target.value) || 0, item.quantity))}
                            className="h-8 w-16 rounded-md border border-border/60 bg-background px-2 text-sm text-center tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={ri.condition}
                              onChange={(e) => updateReceiveItem(idx, 'condition', e.target.value)}
                              className="h-8 appearance-none rounded-md border border-border/60 bg-background pl-2 pr-6 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              <option value="NEW">New</option>
                              <option value="OPENED">Opened</option>
                              <option value="DAMAGED">Damaged</option>
                              <option value="DEFECTIVE">Defective</option>
                            </select>
                            <CaretDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={ri.resolution}
                              onChange={(e) => updateReceiveItem(idx, 'resolution', e.target.value)}
                              className="h-8 appearance-none rounded-md border border-border/60 bg-background pl-2 pr-6 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              <option value="RESTOCK">Restock</option>
                              <option value="DISPOSE">Dispose</option>
                              <option value="DAMAGED">Damaged</option>
                            </select>
                            <CaretDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={proxyUrl(item.imageUrl, 64) || ''} alt="" className="h-8 w-8 rounded-md border border-border/40 object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50"><Cube size={14} className="text-muted-foreground/30" /></div>
                          )}
                          {item.productId ? (
                            <Link to={`/inventory/${item.productId}`} className="text-sm font-medium hover:text-primary">{item.productName}</Link>
                          ) : (
                            <span className="text-sm font-medium">{item.productName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">{item.receivedQty}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium', cond.color)}>{cond.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', resol.bg, resol.text)}>
                          {resol.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* RMA Info */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold">Return Info</h3>
            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Order</span>
                {rma.orderId ? (
                  <Link to={`/orders/${rma.orderNumber}`} className="block font-medium hover:text-primary">#{rma.orderNumber}</Link>
                ) : (
                  <p className="font-medium">#{rma.orderNumber}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Customer</span>
                <p className="font-medium">{rma.customerName}</p>
                {rma.customerEmail && <p className="text-xs text-muted-foreground">{rma.customerEmail}</p>}
              </div>
              {rma.reason && (
                <div>
                  <span className="text-xs text-muted-foreground">Reason</span>
                  <p className="text-sm">{rma.reason}</p>
                </div>
              )}
              {rma.createdByName && (
                <div>
                  <span className="text-xs text-muted-foreground">Created by</span>
                  <p className="text-sm">{rma.createdByName}</p>
                </div>
              )}
            </div>
            <div className="border-t border-border/50 pt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Requested</span>
                <span>{new Date(rma.requestedAt).toLocaleDateString()}</span>
              </div>
              {rma.authorizedAt && (
                <div className="flex justify-between">
                  <span>Authorized</span>
                  <span>{new Date(rma.authorizedAt).toLocaleDateString()}</span>
                </div>
              )}
              {rma.receivedAt && (
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>{new Date(rma.receivedAt).toLocaleDateString()}</span>
                </div>
              )}
              {rma.completedAt && (
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span>{new Date(rma.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            {isTerminal ? (
              <p className="text-sm text-muted-foreground">{rma.notes || 'No notes'}</p>
            ) : (
              <>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  onBlur={saveNotes}
                  rows={3}
                  placeholder="Internal notes..."
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                {savingNotes && <p className="text-xs text-muted-foreground mt-1">Saving...</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
