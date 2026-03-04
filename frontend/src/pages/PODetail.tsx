import { useEffect, useState, useCallback, useRef } from 'react';
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
  Copy,
  ExternalLink,
  Link2,
  Send,
  MoreHorizontal,
  FileText,
  Upload,
  DollarSign,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { PurchaseOrder, PurchaseOrderItem, Bin } from '../types';

const poStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  SHIPPED: { label: 'Shipped', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  RECEIVED_WITH_RESERVATIONS: { label: 'Issues', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
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
  const [receiveQtys, setReceiveQtys] = useState<Record<number, { qty: number; binId?: number }>>({});
  const [availableBins, setAvailableBins] = useState<Bin[]>([]);

  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/receiving/${id}`)
      .then(({ data }) => setPo(data.data))
      .catch(() => navigate('/receiving'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!po) return;
    setPdfDownloading(true);
    try {
      const { data } = await api.get(`/receiving/${po.poNumber}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po.poNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleSendToSupplier = async () => {
    if (!po) return;
    const supplierEmail = po.supplierRef?.email;
    if (!supplierEmail) return;
    if (!confirm(`Send PO ${po.poNumber} to ${supplierEmail}?`)) return;
    try {
      setSending(true);
      const { data } = await api.post(`/receiving/${po.id}/send-to-supplier`);
      setPo(data.data);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleInvoiceUpload = async (file: File) => {
    if (!po) return;
    try {
      setInvoiceUploading(true);
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(`/receiving/${po.id}/invoice-upload`, form);
      setPo(data.data);
    } catch (err) {
      console.error('Invoice upload failed:', err);
    } finally {
      setInvoiceUploading(false);
    }
  };

  const handleInvoiceDelete = async () => {
    if (!po || !confirm('Remove the uploaded invoice file?')) return;
    try {
      const { data } = await api.delete(`/receiving/${po.id}/invoice-file`);
      setPo(data.data);
    } catch (err) {
      console.error('Invoice delete failed:', err);
    }
  };

  const handleInvoiceFieldSave = async (field: string, value: string | null) => {
    if (!po) return;
    try {
      const { data } = await api.patch(`/receiving/${po.id}`, { [field]: value });
      setPo(data.data);
    } catch { /* ignore */ }
  };

  // Fetch active bins when entering receive mode
  useEffect(() => {
    if (!receiving) return;
    api.get('/warehouse')
      .then(({ data }) => {
        const bins: Bin[] = [];
        for (const wh of data.data || []) {
          for (const zone of wh.zones || []) {
            for (const bin of zone.bins || []) {
              if (bin.isActive) bins.push(bin);
            }
          }
        }
        bins.sort((a, b) => a.label.localeCompare(b.label));
        setAvailableBins(bins);
      })
      .catch(() => setAvailableBins([]));
  }, [receiving]);

  // Click-outside handler for more dropdown
  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

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
      .filter(([, val]) => val.qty > 0)
      .map(([itemId, val]) => ({
        itemId: parseInt(itemId),
        receivedQty: val.qty,
        ...(val.binId ? { binId: val.binId } : {}),
      }));

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
  const canReceive = ['ORDERED', 'SHIPPED', 'PARTIALLY_RECEIVED'].includes(po.status);
  const hasSupplierSku = items.some((i) => i.supplierSku);
  const hasEan = items.some((i) => i.ean);
  const progressPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/receiving')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
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

          {/* Action Buttons */}
          {receiving ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReceive}
                disabled={statusUpdating}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
              <button
                onClick={() => { setReceiving(false); setReceiveQtys({}); setAvailableBins([]); }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary status transition */}
              {po.status === 'DRAFT' && (
                <button
                  onClick={() => updateStatus('ORDERED')}
                  disabled={statusUpdating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                  Mark as Ordered
                </button>
              )}
              {po.status === 'ORDERED' && (
                <button
                  onClick={() => updateStatus('SHIPPED')}
                  disabled={statusUpdating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                  Mark as Shipped
                </button>
              )}
              {canReceive && (
                <button
                  onClick={() => setReceiving(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Receive Items
                </button>
              )}
              {po.status === 'PARTIALLY_RECEIVED' && (
                <button
                  onClick={() => updateStatus('RECEIVED_WITH_RESERVATIONS')}
                  disabled={statusUpdating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-orange-500/30 px-4 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
                >
                  {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Received with Issues
                </button>
              )}

              {/* Send to Supplier */}
              {['ORDERED', 'SHIPPED'].includes(po.status) && (
                <button
                  onClick={handleSendToSupplier}
                  disabled={sending || !po.supplierRef?.email}
                  title={!po.supplierRef?.email ? 'Supplier has no email address' : po.sentAt ? `Sent ${new Date(po.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Send PO to supplier via email'}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {po.sentAt ? 'Resend' : 'Send'}
                </button>
              )}

              {/* Download PDF — icon only */}
              <button
                onClick={handleDownloadPdf}
                disabled={pdfDownloading}
                title="Download PDF"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
              >
                {pdfDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              </button>

              {/* More dropdown — Cancel / Delete */}
              {['DRAFT', 'ORDERED', 'SHIPPED', 'PARTIALLY_RECEIVED'].includes(po.status) && (
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                      moreOpen && 'bg-muted/60 text-foreground'
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-border/60 bg-popover p-1 shadow-lg">
                      <button
                        onClick={() => { setMoreOpen(false); updateStatus('CANCELLED'); }}
                        disabled={statusUpdating}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel Order
                      </button>
                      {po.status === 'DRAFT' && (
                        <button
                          onClick={() => { setMoreOpen(false); handleDelete(); }}
                          disabled={deleting}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Purchase Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Package className="h-[18px] w-[18px] text-blue-500" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Items</p>
            <p className="text-lg font-bold tracking-tight">{items.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <DollarSign className="h-[18px] w-[18px] text-emerald-500" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Cost</p>
            <p className="text-lg font-bold tracking-tight">{totalCost > 0 ? `$${totalCost.toFixed(2)}` : '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <CheckCircle className="h-[18px] w-[18px] text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Received</p>
            <p className="text-lg font-bold tracking-tight">{totalReceived}/{totalOrdered} <span className="text-xs font-medium text-muted-foreground">({progressPct}%)</span></p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progressPct >= 100 ? 'bg-emerald-500' : progressPct > 0 ? 'bg-amber-500' : 'bg-muted-foreground/20'
                )}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Calendar className="h-[18px] w-[18px] text-violet-500" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expected</p>
            <p className="text-lg font-bold tracking-tight">
              {po.expectedDate
                ? new Date(po.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
            </p>
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
                    onClick={() => { setReceiving(false); setReceiveQtys({}); setAvailableBins([]); }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-border/30">
                  {items.map((item: PurchaseOrderItem) => {
                    const fullyReceived = item.receivedQty >= item.orderedQty;
                    const lineTotal = item.unitCost ? parseFloat(item.unitCost) * item.orderedQty : 0;
                    const remaining = item.orderedQty - item.receivedQty;
                    return (
                      <div key={item.id} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
                        {/* Image — fixed 40x40 square */}
                        <div className="flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={`/api/v1/images/proxy?url=${encodeURIComponent(item.imageUrl)}&w=80`}
                              alt={item.productName}
                              className="h-10 w-10 rounded-lg border border-border/40 object-cover"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = 'none';
                                el.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted/30',
                            item.imageUrl ? 'hidden' : ''
                          )}>
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        </div>

                        {/* Main content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug truncate">{item.productName}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[11px]">{item.sku}</code>
                                {item.supplierSku && (
                                  <span>Sup: <code className="text-[11px]">{item.supplierSku}</code></span>
                                )}
                                {item.ean && (
                                  <span>EAN: <code className="text-[11px]">{item.ean}</code></span>
                                )}
                              </div>
                            </div>

                            {/* Qty + Cost right side */}
                            <div className="flex-shrink-0 text-right">
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Ord.</span>
                                  <p className="text-sm font-bold">{item.orderedQty}</p>
                                </div>
                                <div className="text-center">
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Rcvd.</span>
                                  <p className={cn(
                                    'text-sm font-bold',
                                    fullyReceived ? 'text-emerald-600' : item.receivedQty > 0 ? 'text-amber-600' : 'text-muted-foreground'
                                  )}>
                                    {fullyReceived && <CheckCircle className="inline h-3.5 w-3.5 mr-0.5" />}
                                    {item.receivedQty}
                                  </p>
                                </div>
                                {item.unitCost && (
                                  <div className="text-right pl-2 border-l border-border/40">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Total</span>
                                    <p className="text-sm font-semibold">{lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '—'}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Receive mode inputs */}
                          {receiving && (
                            <div className="mt-3 flex items-center gap-3">
                              <div>
                                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Qty to Receive</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={remaining > 0 ? remaining : 0}
                                  value={receiveQtys[item.id]?.qty || ''}
                                  onChange={(e) => setReceiveQtys((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      qty: Math.min(parseInt(e.target.value) || 0, Math.max(remaining, 0)),
                                    },
                                  }))}
                                  disabled={remaining <= 0}
                                  className="mt-0.5 h-8 w-24 rounded-lg border border-border/60 bg-background px-2 text-center text-sm font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
                                  placeholder={remaining > 0 ? String(remaining) : '0'}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Put to Bin</label>
                                <select
                                  value={receiveQtys[item.id]?.binId || ''}
                                  onChange={(e) => setReceiveQtys((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      qty: prev[item.id]?.qty || 0,
                                      binId: e.target.value ? parseInt(e.target.value) : undefined,
                                    },
                                  }))}
                                  disabled={remaining <= 0}
                                  className="mt-0.5 h-8 w-40 rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
                                >
                                  <option value="">No bin</option>
                                  {availableBins.map((bin) => (
                                    <option key={bin.id} value={bin.id}>{bin.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                {po.supplierId ? (
                  <button
                    onClick={() => navigate(`/suppliers/${po.supplierId}`)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {po.supplier}
                  </button>
                ) : (
                  <span className="text-sm font-semibold">{po.supplier}</span>
                )}
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Expected
                </span>
                {['DRAFT', 'ORDERED', 'SHIPPED'].includes(po.status) ? (
                  <input
                    type="date"
                    defaultValue={po.expectedDate ? new Date(po.expectedDate).toISOString().split('T')[0] : ''}
                    onBlur={async (e) => {
                      const val = e.target.value;
                      const current = po.expectedDate ? new Date(po.expectedDate).toISOString().split('T')[0] : '';
                      if (val !== current) {
                        try {
                          const { data } = await api.patch(`/receiving/${po.id}`, { expectedDate: val || null });
                          setPo(data.data);
                        } catch { /* ignore */ }
                      }
                    }}
                    className="h-8 w-36 rounded-lg border border-border/60 bg-background px-2 text-sm font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {po.expectedDate
                      ? new Date(po.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span className="text-muted-foreground/50">Not set</span>}
                  </span>
                )}
              </div>
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
              {!['DRAFT', 'ORDERED', 'SHIPPED'].includes(po.status) && po.trackingNumber && (
                <div className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    Tracking #
                  </span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-sm font-medium">{po.trackingNumber}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(po.trackingNumber!)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      title="Copy tracking number"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {!['DRAFT', 'ORDERED', 'SHIPPED'].includes(po.status) && po.trackingUrl && (
                <div className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Tracking Link
                  </span>
                  <a
                    href={po.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Track Shipment
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {['DRAFT', 'ORDERED', 'SHIPPED'].includes(po.status) && (
                <div className="space-y-3 py-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Tracking Number</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={po.trackingNumber || ''}
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val !== (po.trackingNumber || '')) {
                            try {
                              const { data } = await api.patch(`/receiving/${po.id}`, { trackingNumber: val || null });
                              setPo(data.data);
                            } catch { /* ignore */ }
                          }
                        }}
                        placeholder="Enter tracking number..."
                        className="h-8 flex-1 rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Tracking URL</label>
                    <input
                      type="url"
                      defaultValue={po.trackingUrl || ''}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        if (val !== (po.trackingUrl || '')) {
                          try {
                            const { data } = await api.patch(`/receiving/${po.id}`, { trackingUrl: val || null });
                            setPo(data.data);
                          } catch { /* ignore */ }
                        }
                      }}
                      placeholder="https://tracking-url.com/..."
                      className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Invoice
              </h3>
            </div>
            <div className="space-y-3 px-6 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice Number</label>
                <input
                  type="text"
                  defaultValue={po.invoiceNumber || ''}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (po.invoiceNumber || '')) {
                      handleInvoiceFieldSave('invoiceNumber', val || null);
                    }
                  }}
                  placeholder="INV-001"
                  className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice Date</label>
                <input
                  type="date"
                  defaultValue={po.invoiceDate ? new Date(po.invoiceDate).toISOString().split('T')[0] : ''}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const current = po.invoiceDate ? new Date(po.invoiceDate).toISOString().split('T')[0] : '';
                    if (val !== current) {
                      handleInvoiceFieldSave('invoiceDate', val || null);
                    }
                  }}
                  className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={po.invoiceAmount || ''}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      const current = po.invoiceAmount || '';
                      if (val !== current) {
                        handleInvoiceFieldSave('invoiceAmount', val || null);
                      }
                    }}
                    placeholder="0.00"
                    className="h-8 w-full rounded-lg border border-border/60 bg-background pl-7 pr-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Invoice File</label>
                {po.invoiceFileUrl ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={po.invoiceFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-sm font-medium text-primary hover:underline"
                    >
                      View Invoice
                    </a>
                    <button
                      onClick={handleInvoiceDelete}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={invoiceFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleInvoiceUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => invoiceFileRef.current?.click()}
                      disabled={invoiceUploading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
                    >
                      {invoiceUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {invoiceUploading ? 'Uploading...' : 'Upload Invoice'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
