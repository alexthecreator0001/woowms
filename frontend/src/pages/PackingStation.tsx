import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Check,
  MapPin,
  Truck,
  Barcode,
  Hash,
  CreditCard,
  SignOut,
  ArrowRight,
  Printer,
  CircleNotch,
  Warning,
  CheckCircle,
  ArrowSquareOut,
  SkipForward,
  ClipboardText,
  User,
  Timer,
  CaretRight,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import type { Order, OrderItem, WooAddress } from '../types';

interface PackingStationProps {
  standalone?: boolean;
}

function formatShippingAddress(addr: WooAddress | undefined | null): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(' ');
  if (name) lines.push(name);
  if (addr.address_1) lines.push(addr.address_1);
  if (addr.address_2) lines.push(addr.address_2);
  const cityLine = [addr.city, addr.state, addr.postcode].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  return lines;
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
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeOrder = queue.find((o) => o.id === activeOrderId) || null;
  // Cast to access shippingAddress etc. from the full response
  const orderDetail = activeOrder as any;

  const allChecked = activeOrder?.items?.every((item) => checkedItems[item.id]) ?? false;
  const checkedCount = activeOrder?.items?.filter((item) => checkedItems[item.id]).length ?? 0;
  const totalItems = activeOrder?.items?.length ?? 0;

  // Fetch the pack queue
  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/packing/queue');
      const orders: Order[] = data.data;
      setQueue(orders);

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
    setError('');
  }, [activeOrderId]);

  // Focus scan input when order is active
  useEffect(() => {
    if (activeOrder && scanRef.current) {
      scanRef.current.focus();
    }
  }, [activeOrderId]);

  const handleSelectOrder = async (orderId: number) => {
    setActiveOrderId(orderId);
    setLabelResult(null);
    setError('');
    try {
      await api.post('/packing/start', { orderId });
    } catch (err) {
      console.error('Failed to start packing:', err);
    }
  };

  const toggleItem = (itemId: number) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Scan handler — match barcode/SKU to item and toggle it
  const handleScan = (value: string) => {
    if (!activeOrder?.items) return;
    const v = value.trim().toLowerCase();
    const item = activeOrder.items.find(
      (i) => i.sku?.toLowerCase() === v || i.name.toLowerCase().includes(v)
    );
    if (item) {
      setCheckedItems((prev) => ({ ...prev, [item.id]: true }));
    }
    setScanInput('');
  };

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

  const handleSkip = async () => {
    if (!activeOrderId) return;
    setSkipLoading(true);
    try {
      await api.post('/packing/skip', { orderId: activeOrderId });
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', standalone ? 'min-h-screen bg-[#f8f8f8]' : 'min-h-[60vh]')}>
        <CircleNotch size={24} className="animate-spin text-[#a0a0a0]" />
      </div>
    );
  }

  const shippingAddr = formatShippingAddress(orderDetail?.shippingAddress);

  const content = (
    <div className="flex h-full gap-0">
      {/* ──────── Left: Order Queue ──────── */}
      <div className="flex w-[300px] flex-shrink-0 flex-col border-r border-[#e8e8e8] bg-white">
        {/* Queue header */}
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardText size={16} weight="bold" className="text-[#8a8a8a]" />
            <span className="text-[13px] font-bold text-[#1a1a1a]">Pack Queue</span>
          </div>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1a1a1a] px-1.5 text-[10px] font-bold text-white">
            {queue.length}
          </span>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20">
              <Package size={32} weight="duotone" className="mb-3 text-[#d5d5d5]" />
              <p className="text-[13px] font-medium text-[#a0a0a0]">Queue empty</p>
              <p className="mt-1 text-center text-[11px] text-[#c5c5c5]">
                Picked orders appear here automatically.
              </p>
            </div>
          ) : (
            queue.map((order) => {
              const isActive = order.id === activeOrderId;
              const isPacking = order.status === 'PACKING';
              return (
                <button
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  className={cn(
                    'group w-full border-b border-[#f0f0f0] px-4 py-3 text-left transition-all',
                    isActive
                      ? 'border-l-[3px] border-l-[#1a1a1a] bg-[#f5f5f5]'
                      : 'border-l-[3px] border-l-transparent hover:bg-[#fafafa]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#1a1a1a]">
                        #{order.orderNumber}
                      </span>
                      {order.isPaid === false && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600">
                          COD
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        isPacking
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'bg-violet-500/10 text-violet-600'
                      )}
                    >
                      {isPacking ? 'Packing' : 'Picked'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[12px] text-[#8a8a8a]">{order.customerName}</span>
                    <span className="text-[12px] font-semibold text-[#6b6b6b]">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {order.shippingMethodTitle && (
                    <div className="mt-1 flex items-center gap-1">
                      <Truck size={11} className="text-[#c0c0c0]" />
                      <span className="text-[11px] text-[#b0b0b0]">{order.shippingMethodTitle}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ──────── Right: Active Order ──────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#f8f8f8]">
        {!activeOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Package size={48} weight="duotone" className="mb-4 text-[#d5d5d5]" />
            <p className="text-[15px] font-semibold text-[#a0a0a0]">No order selected</p>
            <p className="mt-1 text-[13px] text-[#c5c5c5]">
              Select an order from the queue to start packing.
            </p>
          </div>
        ) : (
          <>
            {/* ── Top bar: Order number + status ── */}
            <div className="flex items-center justify-between border-b border-[#e8e8e8] bg-white px-6 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-extrabold tracking-tight text-[#1a1a1a]">
                  #{activeOrder.orderNumber}
                </h2>
                <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-orange-600">
                  Packing
                </span>
                {activeOrder.isPaid === false && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-600">
                    <Warning size={12} weight="fill" />
                    COD
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#8a8a8a]">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-[#b0b0b0]" />
                  {activeOrder.paymentMethodTitle || activeOrder.paymentMethod || '—'}
                </span>
                <span className="font-bold text-[#1a1a1a]">
                  {activeOrder.currency === 'USD' ? '$' : activeOrder.currency}{activeOrder.total}
                </span>
              </div>
            </div>

            {/* ── Content area: two columns ── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left column: items + actions */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Scan bar */}
                <div className="border-b border-[#e8e8e8] bg-white px-6 py-2.5">
                  <div className="relative">
                    <Barcode size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0b0b0]" />
                    <input
                      ref={scanRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && scanInput.trim()) {
                          handleScan(scanInput);
                        }
                      }}
                      placeholder="Scan barcode or type SKU to verify..."
                      className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] pl-9 pr-3 text-[13px] text-[#1a1a1a] placeholder:text-[#c0c0c0] focus:border-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/5"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="border-b border-[#e8e8e8] bg-white px-6 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">
                      Items verified
                    </span>
                    <span className="text-[12px] font-bold text-[#1a1a1a]">
                      {checkedCount}/{totalItems}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        allChecked ? 'bg-emerald-500' : 'bg-[#1a1a1a]'
                      )}
                      style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                  <div className="space-y-2">
                    {activeOrder.items?.map((item) => {
                      const isChecked = checkedItems[item.id] ?? true;
                      const binLabel = (item.product as any)?.stockLocations?.[0]?.bin?.label;
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition-all',
                            isChecked
                              ? 'border-emerald-200 bg-emerald-500/[0.02]'
                              : 'border-[#e8e8e8] hover:border-[#d0d0d0]'
                          )}
                        >
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(item.id);
                            }}
                            className={cn(
                              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all',
                              isChecked
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                : 'border-[#d0d0d0] bg-white'
                            )}
                          >
                            {isChecked && <Check size={14} weight="bold" />}
                          </button>

                          {/* Product image */}
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[#e8e8e8] bg-[#f5f5f5]">
                            {item.product?.imageUrl ? (
                              <img
                                src={proxyUrl(item.product.imageUrl, 96)!}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package size={18} weight="duotone" className="text-[#d0d0d0]" />
                              </div>
                            )}
                          </div>

                          {/* Product info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">{item.name}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              {item.sku && (
                                <span className="flex items-center gap-1 text-[11px] text-[#8a8a8a]">
                                  <Hash size={10} className="text-[#b0b0b0]" />
                                  {item.sku}
                                </span>
                              )}
                              {binLabel && (
                                <span className="flex items-center gap-1 rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#6b6b6b]">
                                  <MapPin size={10} />
                                  {binLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="flex-shrink-0 text-right">
                            <span className="text-[18px] font-extrabold text-[#1a1a1a]">
                              {item.quantity}
                            </span>
                            <p className="text-[10px] font-medium uppercase text-[#a0a0a0]">QTY</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Error / Success feedback ── */}
                {error && (
                  <div className="border-t border-red-100 bg-red-50 px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Warning size={16} weight="fill" className="flex-shrink-0 text-red-500" />
                      <p className="text-[13px] font-medium text-red-700">{error}</p>
                    </div>
                  </div>
                )}
                {labelResult && !error && (
                  <div className="border-t border-emerald-100 bg-emerald-50 px-6 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} weight="fill" className="flex-shrink-0 text-emerald-500" />
                      <p className="text-[13px] font-medium text-emerald-700">
                        Label created — {labelResult.trackingNumber}
                      </p>
                      {labelResult.labelUrl && (
                        <a
                          href={labelResult.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-600 underline hover:text-emerald-700"
                        >
                          Open PDF <ArrowSquareOut size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="border-t border-[#e8e8e8] bg-white px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handlePrintAndShip}
                      disabled={packing}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] text-[14px] font-bold text-white transition-all hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {packing ? (
                        <CircleNotch size={16} className="animate-spin" />
                      ) : (
                        <Printer size={16} weight="bold" />
                      )}
                      Print Label & Ship
                    </button>
                    <button
                      onClick={handleSkip}
                      disabled={skipLoading}
                      className="flex h-11 items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-4 text-[13px] font-semibold text-[#6b6b6b] transition-all hover:border-[#c5c5c5] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {skipLoading ? (
                        <CircleNotch size={14} className="animate-spin" />
                      ) : (
                        <SkipForward size={14} weight="bold" />
                      )}
                      Skip
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Right sidebar: Ship-to + order info ── */}
              <div className="w-[280px] flex-shrink-0 overflow-y-auto border-l border-[#e8e8e8] bg-white">
                {/* Ship-to address */}
                <div className="border-b border-[#f0f0f0] px-5 py-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <MapPin size={13} weight="bold" className="text-[#8a8a8a]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                      Ship to
                    </span>
                  </div>
                  {shippingAddr.length > 0 ? (
                    <div className="space-y-0.5">
                      {shippingAddr.map((line, i) => (
                        <p
                          key={i}
                          className={cn(
                            'text-[13px]',
                            i === 0 ? 'font-bold text-[#1a1a1a]' : 'text-[#6b6b6b]'
                          )}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] italic text-[#c0c0c0]">No address on file</p>
                  )}
                </div>

                {/* Customer */}
                <div className="border-b border-[#f0f0f0] px-5 py-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <User size={13} weight="bold" className="text-[#8a8a8a]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                      Customer
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{activeOrder.customerName}</p>
                  <p className="text-[12px] text-[#8a8a8a]">{activeOrder.customerEmail}</p>
                </div>

                {/* Shipping method */}
                {activeOrder.shippingMethodTitle && (
                  <div className="border-b border-[#f0f0f0] px-5 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Truck size={13} weight="bold" className="text-[#8a8a8a]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                        Shipping
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{activeOrder.shippingMethodTitle}</p>
                    {activeOrder.shippingMethod && (
                      <p className="text-[12px] text-[#8a8a8a]">{activeOrder.shippingMethod}</p>
                    )}
                  </div>
                )}

                {/* Payment */}
                <div className="border-b border-[#f0f0f0] px-5 py-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <CreditCard size={13} weight="bold" className="text-[#8a8a8a]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                      Payment
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">
                      {activeOrder.paymentMethodTitle || activeOrder.paymentMethod || '—'}
                    </p>
                    {activeOrder.isPaid === false ? (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Unpaid
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                {/* Order notes */}
                {orderDetail?.notes && (
                  <div className="border-b border-[#f0f0f0] px-5 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <ClipboardText size={13} weight="bold" className="text-[#8a8a8a]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                        Notes
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#6b6b6b]">
                      {orderDetail.notes}
                    </p>
                  </div>
                )}

                {/* Order total */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#8a8a8a]">Total</span>
                    <span className="text-[20px] font-extrabold text-[#1a1a1a]">
                      {activeOrder.currency === 'USD' ? '$' : activeOrder.currency}{activeOrder.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Standalone mode: fullscreen with top bar
  if (standalone) {
    return (
      <div className="flex h-screen flex-col bg-[#f8f8f8]">
        {/* Top bar */}
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e8e8e8] bg-white px-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package size={18} weight="duotone" className="text-[#1a1a1a]" />
              <span className="text-[14px] font-extrabold tracking-tight text-[#1a1a1a]">Packing Station</span>
            </div>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1a1a1a] px-1.5 text-[10px] font-bold text-white">
              {queue.length}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#8a8a8a] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <SignOut size={14} />
            Log out
          </button>
        </div>

        {/* Content fills remaining space */}
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </div>
    );
  }

  // Embedded mode: just the content with a header
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f0f0]">
          <Package size={20} weight="duotone" className="text-[#1a1a1a]" />
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#1a1a1a]">Packing Station</h2>
          <p className="text-[13px] text-[#8a8a8a]">Verify, label, and ship orders.</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e5e5e5]" style={{ height: 'calc(100vh - 180px)' }}>
        {content}
      </div>
    </div>
  );
}
