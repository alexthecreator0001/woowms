import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Check,
  Printer,
  ArrowRight,
  User,
  MapPin,
  Truck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { Package as PhPackage } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import type { Order, OrderItem } from '../types';

interface PackingStationProps {
  standalone?: boolean;
}

export default function PackingStation({ standalone = false }: PackingStationProps) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [packing, setPacking] = useState(false);
  const [labelResult, setLabelResult] = useState<{ trackingNumber: string; labelUrl: string } | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeOrder = queue.find((o) => o.id === activeOrderId) || null;

  // Fetch the pack queue
  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/packing/queue');
      const orders: Order[] = data.data;
      setQueue(orders);

      // Auto-select first order if none is active or active no longer in queue
      setActiveOrderId((prev) => {
        if (prev && orders.some((o) => o.id === prev)) return prev;
        return orders.length > 0 ? orders[0].id : null;
      });
    } catch (err) {
      console.error('Failed to fetch packing queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 15 seconds
  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQueue]);

  // Pre-check all items when active order changes
  useEffect(() => {
    if (activeOrder?.items) {
      const checks: Record<number, boolean> = {};
      activeOrder.items.forEach((item) => {
        checks[item.id] = true;
      });
      setCheckedItems(checks);
    } else {
      setCheckedItems({});
    }
    setLabelResult(null);
  }, [activeOrderId]);

  // Select an order from the queue
  const handleSelectOrder = async (orderId: number) => {
    setActiveOrderId(orderId);
    setLabelResult(null);
    setError('');
    try {
      await api.post('/packing/start', { orderId });
    } catch (err) {
      // Non-critical: order may already be in PACKING state
      console.error('Failed to start packing:', err);
    }
  };

  // Toggle a checklist item
  const toggleItem = (itemId: number) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Complete packing + print label
  const handlePrintAndShip = async () => {
    if (!activeOrderId) return;
    setPacking(true);
    setLabelResult(null);
    setError('');
    try {
      const { data } = await api.post('/packing/complete', { orderId: activeOrderId });
      const label = data.data?.label;
      if (label) {
        setLabelResult({ trackingNumber: label.trackingNumber, labelUrl: label.labelUrl });
      }
      // Remove from queue and auto-select next
      setQueue((prev) => {
        const updated = prev.filter((o) => o.id !== activeOrderId);
        setActiveOrderId(updated.length > 0 ? updated[0].id : null);
        return updated;
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create label. Check Settings > Shipping.';
      setError(msg);
    } finally {
      setPacking(false);
    }
  };

  // Ship without label
  const handleSkip = async () => {
    if (!activeOrderId) return;
    setSkipLoading(true);
    try {
      await api.post('/packing/skip', { orderId: activeOrderId });
      // Remove from queue and auto-select next
      setQueue((prev) => {
        const updated = prev.filter((o) => o.id !== activeOrderId);
        setActiveOrderId(updated.length > 0 ? updated[0].id : null);
        return updated;
      });
    } catch (err) {
      console.error('Failed to skip packing:', err);
    } finally {
      setSkipLoading(false);
    }
  };

  // Status dot color
  const statusDot = (status: string) => {
    if (status === 'PACKING') return 'bg-orange-500';
    if (status === 'PICKED') return 'bg-violet-500';
    return 'bg-muted-foreground/40';
  };

  // Status badge
  const statusBadge = (status: string) => {
    if (status === 'PACKING')
      return { bg: 'bg-orange-500/10', text: 'text-orange-600' };
    if (status === 'PICKED')
      return { bg: 'bg-violet-500/10', text: 'text-violet-600' };
    return { bg: 'bg-muted/40', text: 'text-muted-foreground' };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', standalone ? 'min-h-screen' : 'min-h-[60vh]')}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const content = (
    <div className={cn(standalone ? 'space-y-4' : 'space-y-6')}>
      {/* Page Header — only shown in embedded mode (standalone has its own top bar) */}
      {!standalone && (
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
            <PhPackage size={22} weight="duotone" className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Packing Station</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Verify items, print labels, and ship orders.
            </p>
          </div>
        </div>
      )}

      {/* Two-panel Layout */}
      <div className="flex gap-6" style={{ minHeight: standalone ? 'calc(100vh - 72px)' : 'calc(100vh - 220px)' }}>
        {/* Left Panel - Order Queue */}
        <div className="w-80 flex-shrink-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            {/* Queue Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <h3 className="text-sm font-semibold">Pack Queue</h3>
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {queue.length}
              </span>
            </div>

            {/* Queue List */}
            <div className="max-h-[calc(100vh-320px)] divide-y divide-border/30 overflow-y-auto">
              {queue.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl" />
                    <Package className="relative h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Queue is empty</p>
                  <p className="mt-1 text-center text-xs text-muted-foreground/60">
                    Orders will appear here once they are picked.
                  </p>
                </div>
              )}

              {queue.map((order) => {
                const isActive = order.id === activeOrderId;
                const badge = statusBadge(order.status);
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={cn(
                      'w-full px-5 py-3.5 text-left transition-all hover:bg-muted/30',
                      isActive && 'border-l-[3px] border-l-primary bg-primary/[0.04]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">#{order.orderNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', statusDot(order.status))} />
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', badge.bg, badge.text)}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">{order.customerName}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/60">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      {order.shippingMethodTitle && (
                        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {order.shippingMethodTitle}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Active Order */}
        <div className="min-w-0 flex-1">
          {!activeOrder ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-20 shadow-sm">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl" />
                <Package className="relative h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No order selected</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Select an order from the queue to start packing.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              {/* Order Header */}
              <div className="border-b border-border/50 px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold">Order #{activeOrder.orderNumber}</h3>
                        {activeOrder.isPaid === false && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            COD
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activeOrder.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activeOrder.customerEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {activeOrder.currency === 'USD' ? '$' : activeOrder.currency}{activeOrder.total}
                    </p>
                    <p className="text-xs text-muted-foreground">{activeOrder.paymentMethodTitle || activeOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Info Bar */}
              {activeOrder.shippingMethodTitle && (
                <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-6 py-2.5">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {activeOrder.shippingMethodTitle}
                  </span>
                  {activeOrder.shippingMethod && (
                    <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                      {activeOrder.shippingMethod}
                    </span>
                  )}
                </div>
              )}

              {/* Items Checklist Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="w-10 px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" />
                    <th className="w-14 px-2 py-2.5" />
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {activeOrder.items?.map((item) => {
                    const isChecked = checkedItems[item.id] ?? true;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          'cursor-pointer transition-all hover:bg-muted/20',
                          isChecked && 'bg-emerald-500/[0.02]'
                        )}
                      >
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(item.id);
                            }}
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
                              isChecked
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-muted-foreground/30 bg-background'
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                            {item.product?.imageUrl ? (
                              <img
                                src={proxyUrl(item.product.imageUrl, 80)!}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-5 py-3">
                          {item.sku ? (
                            <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium">{item.sku}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">--</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold">{item.quantity}</td>
                        <td className="px-5 py-3">
                          {item.product?.stockLocations?.[0]?.bin?.label ? (
                            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.product.stockLocations[0].bin.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-border/50 px-6 py-4">
                <button
                  onClick={handlePrintAndShip}
                  disabled={packing}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {packing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Print Label & Ship
                </button>

                <button
                  onClick={handleSkip}
                  disabled={skipLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {skipLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Ship Without Label
                </button>

                {/* Error feedback */}
                {error && (
                  <div className="ml-auto flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">{error}</span>
                  </div>
                )}

                {/* Label success feedback */}
                {labelResult && !error && (
                  <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      Label created: {labelResult.trackingNumber}
                    </span>
                    {labelResult.labelUrl && (
                      <a
                        href={labelResult.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 underline hover:text-emerald-700"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Standalone mode: wrap in fullscreen shell with top bar
  if (standalone) {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-b border-[#ebebeb] bg-white px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <PhPackage size={18} weight="duotone" className="text-orange-600" />
            </div>
            <span className="text-sm font-bold tracking-tight">Packing Station</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {queue.length} in queue
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#6b6b6b] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>

        {/* Packing Content — full width, no sidebar margins */}
        <div className="px-6 py-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
