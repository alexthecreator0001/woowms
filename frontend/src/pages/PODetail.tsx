import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PackageOpen,
  Package,
  Truck,
  Calendar,
  Clock,
  FileDown,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { generatePoPdf } from '../lib/generatePoPdf';
import type { PurchaseOrder, PurchaseOrderItem } from '../types';

const poStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
};

export default function PODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/receiving/${id}`)
      .then(({ data }) => setPo(data.data))
      .catch(() => navigate('/receiving'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = useCallback(async (newStatus: string) => {
    if (!po) return;
    try {
      setStatusUpdating(true);
      const { data } = await api.patch(`/receiving/${po.id}/status`, { status: newStatus });
      setPo(data.data);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  }, [po]);

  const handleDelete = useCallback(async () => {
    if (!po || !confirm('Delete this purchase order? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await api.delete(`/receiving/${po.id}`);
      navigate('/receiving');
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
    }
  }, [po, navigate]);

  const handleReceive = useCallback(async () => {
    if (!po) return;
    const items = Object.entries(receiveQtys)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, receivedQty]) => ({ itemId: parseInt(itemId), receivedQty }));

    if (items.length === 0) return;

    try {
      setStatusUpdating(true);
      await api.patch(`/receiving/${po.id}/receive`, { items });
      const { data } = await api.get(`/receiving/${po.id}`);
      setPo(data.data);
      setReceiving(false);
      setReceiveQtys({});
    } catch (err) {
      console.error('Receive failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  }, [po, receiveQtys]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!po) return null;

  const status = poStatusConfig[po.status] || poStatusConfig.DRAFT;
  const items = po.items || [];
  const totalCost = items.reduce((sum, i) => {
    if (!i.unitCost) return sum;
    return sum + parseFloat(i.unitCost) * i.orderedQty;
  }, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.receivedQty, 0);
  const totalOrdered = items.reduce((sum, i) => sum + i.orderedQty, 0);
  const canReceive = ['ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/receiving')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receiving
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <PackageOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{po.poNumber}</h2>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {po.supplier} &middot; Created {new Date(po.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </h3>
              {canReceive && !receiving && (
                <button
                  onClick={() => setReceiving(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Receive Items
                </button>
              )}
              {receiving && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReceive}
                    disabled={statusUpdating}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {statusUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setReceiving(false); setReceiveQtys({}); }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordered</th>
                    <th className="px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Received</th>
                    {receiving && <th className="px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty to Receive</th>}
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Cost</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {items.map((item: PurchaseOrderItem) => {
                    const fullyReceived = item.receivedQty >= item.orderedQty;
                    const lineTotal = item.unitCost ? parseFloat(item.unitCost) * item.orderedQty : 0;
                    const remaining = item.orderedQty - item.receivedQty;
                    return (
                      <tr key={item.id} className="border-l-4 border-l-transparent transition-all hover:border-l-amber-500 hover:bg-amber-500/[0.02]">
                        <td className="px-6 py-3">
                          <code className="text-xs text-muted-foreground">{item.sku}</code>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">{item.productName}</td>
                        <td className="px-6 py-3 text-center text-sm font-semibold">{item.orderedQty}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-sm font-bold',
                            fullyReceived ? 'text-emerald-600' : item.receivedQty > 0 ? 'text-amber-600' : 'text-muted-foreground'
                          )}>
                            {fullyReceived && <CheckCircle className="h-3.5 w-3.5" />}
                            {item.receivedQty}
                          </span>
                        </td>
                        {receiving && (
                          <td className="px-6 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={remaining > 0 ? remaining : 0}
                              value={receiveQtys[item.id] || ''}
                              onChange={(e) => setReceiveQtys((prev) => ({
                                ...prev,
                                [item.id]: Math.min(parseInt(e.target.value) || 0, Math.max(remaining, 0)),
                              }))}
                              disabled={remaining <= 0}
                              className="h-8 w-20 rounded-lg border border-border/60 bg-background px-2 text-center text-sm font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
                              placeholder={remaining > 0 ? String(remaining) : '0'}
                            />
                          </td>
                        )}
                        <td className="px-6 py-3 text-right text-sm">
                          {item.unitCost ? `$${parseFloat(item.unitCost).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium">
                          {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cost Summary */}
            {totalCost > 0 && (
              <div className="border-t border-border/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Cost</span>
                  <span className="text-lg font-bold">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes Card */}
          {po.notes && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="text-sm font-semibold">Notes</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{po.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — 1 col */}
        <div className="space-y-6">
          {/* PO Info Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <PackageOpen className="h-4 w-4 text-muted-foreground" />
                Purchase Order Info
              </h3>
            </div>
            <div className="divide-y divide-border/40 px-6">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Supplier</span>
                <span className="text-sm font-semibold">{po.supplier}</span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {totalReceived}/{totalOrdered} items
                </span>
              </div>
              {po.expectedDate && (
                <div className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Expected
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(po.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {po.receivedDate && (
                <div className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Received
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(po.receivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Created
                </span>
                <span className="text-sm font-medium">
                  {new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="text-sm font-semibold">Actions</h3>
            </div>
            <div className="space-y-2 p-4">
              {po.status === 'DRAFT' && (
                <button
                  onClick={() => updateStatus('ORDERED')}
                  disabled={statusUpdating}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-blue-500/5 hover:border-blue-500/30 disabled:opacity-50"
                >
                  <Truck className="h-4 w-4 text-blue-600" />
                  Mark as Ordered
                </button>
              )}
              {canReceive && !receiving && (
                <button
                  onClick={() => setReceiving(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-emerald-500/5 hover:border-emerald-500/30"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Receive Items
                </button>
              )}
              <button
                onClick={() => generatePoPdf(po)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
              >
                <FileDown className="h-4 w-4 text-muted-foreground" />
                Download PDF
              </button>
              {po.status === 'DRAFT' && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete Purchase Order
                </button>
              )}
              {['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status) && (
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  disabled={statusUpdating}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/5 hover:text-red-600 hover:border-red-500/20 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
