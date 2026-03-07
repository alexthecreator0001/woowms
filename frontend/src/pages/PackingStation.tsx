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
  Printer,
  CircleNotch,
  Warning,
  CheckCircle,
  ArrowSquareOut,
  SkipForward,
  ClipboardText,
  User,
  ShoppingBag,
  NavigationArrow,
  Receipt,
  CurrencyEur,
  CurrencyDollar,
  CurrencyGbp,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import type { Order, WooAddress } from '../types';

interface PackingStationProps {
  standalone?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', CZK: 'K\u010D', CAD: 'CA$', AUD: 'A$',
  JPY: '\u00A5', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'z\u0142',
  HUF: 'Ft', RON: 'lei', BGN: 'лв', HRK: 'kn', RUB: '₽', TRY: '₺',
  BRL: 'R$', MXN: 'MX$', INR: '₹', KRW: '₩', SGD: 'S$', HKD: 'HK$',
  NZD: 'NZ$', ZAR: 'R', THB: '฿', IDR: 'Rp', MYR: 'RM', PHP: '₱',
};

function fmtMoney(amount: string, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  // For currencies where symbol goes after (CZK, etc), handle specially
  if (['CZK', 'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'RON', 'BGN', 'HRK'].includes(currency)) {
    return `${amount} ${sym}`;
  }
  return `${sym}${amount}`;
}

function formatShipTo(addr: WooAddress | undefined | null): { name: string; lines: string[] } {
  if (!addr) return { name: '', lines: [] };
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(' ');
  const lines: string[] = [];
  if (addr.address_1) lines.push(addr.address_1);
  if (addr.address_2) lines.push(addr.address_2);
  const cityLine = [addr.city, addr.state, addr.postcode].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  return { name, lines };
}

// Filter out system-generated packing notes, keep only customer/woo notes
function getCustomerNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const lines = notes.split('\n').filter(
    (l) => !l.startsWith('Packing started by user') && !l.startsWith('Picking started by') && l.trim()
  );
  return lines.length > 0 ? lines.join('\n') : null;
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
  const od = activeOrder as any; // access shippingAddress, notes, etc.

  const checkedCount = activeOrder?.items?.filter((item) => checkedItems[item.id]).length ?? 0;
  const totalItems = activeOrder?.items?.length ?? 0;
  const allChecked = totalItems > 0 && checkedCount === totalItems;

  // ── Data fetching ──
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchQueue]);

  useEffect(() => {
    if (activeOrder?.items) {
      const checks: Record<number, boolean> = {};
      activeOrder.items.forEach((item) => { checks[item.id] = true; });
      setCheckedItems(checks);
    } else {
      setCheckedItems({});
    }
    setLabelResult(null);
    setError('');
  }, [activeOrderId]);

  useEffect(() => {
    if (activeOrder && scanRef.current) scanRef.current.focus();
  }, [activeOrderId]);

  // ── Handlers ──
  const handleSelectOrder = async (orderId: number) => {
    setActiveOrderId(orderId);
    setLabelResult(null);
    setError('');
    try { await api.post('/packing/start', { orderId }); } catch {}
  };

  const toggleItem = (itemId: number) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleScan = (value: string) => {
    if (!activeOrder?.items) return;
    const v = value.trim().toLowerCase();
    const item = activeOrder.items.find(
      (i) => i.sku?.toLowerCase() === v || i.name.toLowerCase().includes(v)
    );
    if (item) setCheckedItems((prev) => ({ ...prev, [item.id]: true }));
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
      if (label) setLabelResult({ trackingNumber: label.trackingNumber, labelUrl: label.labelUrl });
      setQueue((prev) => {
        const updated = prev.filter((o) => o.id !== activeOrderId);
        setActiveOrderId(updated.length > 0 ? updated[0].id : null);
        return updated;
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create label. Check Settings > Shipping.');
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
    } catch {}
    setSkipLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', standalone ? 'min-h-screen bg-[#f5f5f4]' : 'min-h-[60vh]')}>
        <CircleNotch size={28} className="animate-spin text-[#a0a0a0]" />
      </div>
    );
  }

  const shipTo = formatShipTo(od?.shippingAddress);
  const customerNotes = getCustomerNotes(od?.notes);

  const content = (
    <div className="flex h-full">
      {/* ═══════ LEFT: Queue ═══════ */}
      <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] font-bold text-[#1a1a1a]">Queue</span>
          <span className={cn(
            'flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold',
            queue.length > 0 ? 'bg-[#1a1a1a] text-white' : 'bg-[#f0f0f0] text-[#a0a0a0]'
          )}>
            {queue.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16">
              <Package size={36} weight="thin" className="mb-2 text-[#d5d5d5]" />
              <p className="text-[12px] text-[#b0b0b0]">No orders to pack</p>
            </div>
          ) : (
            queue.map((order) => {
              const isActive = order.id === activeOrderId;
              return (
                <button
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  className={cn(
                    'w-full border-b border-[#f0f0f0] px-4 py-2.5 text-left transition-all',
                    isActive ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#fafafa]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-[13px] font-bold', isActive ? 'text-white' : 'text-[#1a1a1a]')}>
                      #{order.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {order.isPaid === false && (
                        <span className={cn(
                          'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                          isActive ? 'bg-white/20 text-amber-300' : 'bg-amber-500/10 text-amber-600'
                        )}>Unpaid</span>
                      )}
                      <span className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                        isActive
                          ? 'bg-white/20 text-white/80'
                          : order.status === 'PACKING'
                            ? 'bg-orange-500/10 text-orange-600'
                            : 'bg-violet-500/10 text-violet-600'
                      )}>
                        {order.status === 'PACKING' ? 'Packing' : 'Picked'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={cn('text-[11px]', isActive ? 'text-white/60' : 'text-[#8a8a8a]')}>
                      {order.customerName}
                    </span>
                    <span className={cn('text-[11px] font-semibold', isActive ? 'text-white/50' : 'text-[#b0b0b0]')}>
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════ CENTER: Active Order ═══════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!activeOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#fafaf9]">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f0f0ef]">
              <ShoppingBag size={36} weight="thin" className="text-[#c5c5c5]" />
            </div>
            <p className="text-[14px] font-semibold text-[#a0a0a0]">Select an order to start packing</p>
          </div>
        ) : (
          <>
            {/* ── Order header bar ── */}
            <div className="flex items-center gap-4 border-b border-[#e5e5e5] bg-white px-5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                  <Package size={16} weight="bold" className="text-white" />
                </div>
                <div>
                  <span className="text-[16px] font-extrabold tracking-tight text-[#1a1a1a]">
                    #{activeOrder.orderNumber}
                  </span>
                </div>
              </div>

              {activeOrder.isPaid === false && (
                <span className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-600">
                  <Warning size={11} weight="fill" /> Unpaid
                </span>
              )}

              <div className="ml-auto flex items-center gap-3">
                {activeOrder.shippingMethodTitle && (
                  <span className="flex items-center gap-1.5 text-[12px] text-[#8a8a8a]">
                    <Truck size={14} weight="bold" className="text-[#b0b0b0]" />
                    {activeOrder.shippingMethodTitle}
                  </span>
                )}
                <span className="text-[15px] font-extrabold text-[#1a1a1a]">
                  {fmtMoney(activeOrder.total, activeOrder.currency)}
                </span>
              </div>
            </div>

            {/* ── Two-column: items + sidebar ── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Items column */}
              <div className="flex flex-1 flex-col">
                {/* Scan + progress row */}
                <div className="flex items-center gap-3 border-b border-[#ebebeb] bg-[#fafaf9] px-5 py-2.5">
                  <div className="relative flex-1">
                    <Barcode size={15} weight="bold" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#c0c0c0]" />
                    <input
                      ref={scanRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && scanInput.trim()) handleScan(scanInput); }}
                      placeholder="Scan or type SKU..."
                      className="h-8 w-full rounded-md border border-[#e0e0e0] bg-white pl-8 pr-3 text-[12px] text-[#1a1a1a] placeholder:text-[#c5c5c5] focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]/10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e8e8e8]">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          allChecked ? 'bg-emerald-500' : 'bg-orange-500'
                        )}
                        style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className={cn(
                      'text-[11px] font-bold tabular-nums',
                      allChecked ? 'text-emerald-600' : 'text-[#8a8a8a]'
                    )}>
                      {checkedCount}/{totalItems}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto bg-[#fafaf9] p-4">
                  <div className="space-y-1.5">
                    {activeOrder.items?.map((item, idx) => {
                      const isChecked = checkedItems[item.id] ?? true;
                      const binLabel = (item.product as any)?.stockLocations?.[0]?.bin?.label;
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all',
                            isChecked
                              ? 'border-emerald-300/60 bg-emerald-50/50'
                              : 'border-[#e5e5e5] bg-white hover:border-orange-300 hover:shadow-sm'
                          )}
                        >
                          {/* Check */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                            className={cn(
                              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all',
                              isChecked
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-[#d5d5d5] bg-white group-hover:border-orange-400'
                            )}
                          >
                            {isChecked && <Check size={14} weight="bold" />}
                          </button>

                          {/* Image */}
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-[#e8e8e8] bg-[#f5f5f5]">
                            {item.product?.imageUrl ? (
                              <img src={proxyUrl(item.product.imageUrl, 112)!} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package size={20} weight="thin" className="text-[#d5d5d5]" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'truncate text-[13px] font-semibold',
                              isChecked ? 'text-emerald-800' : 'text-[#1a1a1a]'
                            )}>{item.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {item.sku && (
                                <code className="text-[11px] text-[#8a8a8a]">{item.sku}</code>
                              )}
                              {binLabel && (
                                <span className="flex items-center gap-0.5 rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#6b6b6b]">
                                  <MapPin size={9} weight="bold" />{binLabel}
                                </span>
                              )}
                              <span className="text-[11px] text-[#b0b0b0]">
                                {fmtMoney(item.price, activeOrder.currency)} ea
                              </span>
                            </div>
                          </div>

                          {/* Qty badge */}
                          <div className={cn(
                            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[16px] font-extrabold',
                            isChecked
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-[#f0f0f0] text-[#1a1a1a]'
                          )}>
                            {item.quantity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Feedback ── */}
                {error && (
                  <div className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-5 py-2.5">
                    <Warning size={15} weight="fill" className="flex-shrink-0 text-red-500" />
                    <p className="text-[12px] font-semibold text-red-700">{error}</p>
                  </div>
                )}
                {labelResult && !error && (
                  <div className="flex items-center gap-2 border-t border-emerald-200 bg-emerald-50 px-5 py-2.5">
                    <CheckCircle size={15} weight="fill" className="flex-shrink-0 text-emerald-500" />
                    <p className="text-[12px] font-semibold text-emerald-700">
                      Shipped — {labelResult.trackingNumber}
                    </p>
                    {labelResult.labelUrl && (
                      <a href={labelResult.labelUrl} target="_blank" rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-600 underline hover:text-emerald-700">
                        Label PDF <ArrowSquareOut size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* ── Actions ── */}
                <div className="flex items-center gap-2 border-t border-[#e5e5e5] bg-white px-5 py-3">
                  <button
                    onClick={handlePrintAndShip}
                    disabled={packing}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] text-[13px] font-bold text-white transition-all hover:bg-[#333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {packing ? <CircleNotch size={15} className="animate-spin" /> : <Printer size={15} weight="bold" />}
                    Print Label & Ship
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={skipLoading}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3.5 text-[12px] font-semibold text-[#8a8a8a] transition-all hover:border-[#c5c5c5] hover:text-[#1a1a1a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {skipLoading ? <CircleNotch size={13} className="animate-spin" /> : <SkipForward size={13} weight="bold" />}
                    Skip
                  </button>
                </div>
              </div>

              {/* ═══════ Right sidebar ═══════ */}
              <div className="w-[260px] flex-shrink-0 overflow-y-auto border-l border-[#e5e5e5] bg-white">
                {/* Ship-to — the most important info */}
                <div className="border-b border-[#f0f0f0] px-4 py-3.5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <NavigationArrow size={12} weight="fill" className="text-orange-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Ship to</span>
                  </div>
                  {shipTo.name || shipTo.lines.length > 0 ? (
                    <div className="rounded-lg bg-[#fafaf9] p-3">
                      {shipTo.name && (
                        <p className="text-[13px] font-bold text-[#1a1a1a]">{shipTo.name}</p>
                      )}
                      {shipTo.lines.map((line, i) => (
                        <p key={i} className="text-[12px] leading-relaxed text-[#6b6b6b]">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] italic text-[#c5c5c5]">No address</p>
                  )}
                </div>

                {/* Customer */}
                <div className="border-b border-[#f0f0f0] px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <User size={12} weight="bold" className="text-[#b0b0b0]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">Customer</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{activeOrder.customerName}</p>
                  <p className="truncate text-[11px] text-[#8a8a8a]">{activeOrder.customerEmail}</p>
                </div>

                {/* Shipping */}
                {activeOrder.shippingMethodTitle && (
                  <div className="border-b border-[#f0f0f0] px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Truck size={12} weight="bold" className="text-[#b0b0b0]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">Shipping</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{activeOrder.shippingMethodTitle}</p>
                  </div>
                )}

                {/* Payment */}
                <div className="border-b border-[#f0f0f0] px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <CreditCard size={12} weight="bold" className="text-[#b0b0b0]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">Payment</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#1a1a1a]">
                      {activeOrder.paymentMethodTitle || activeOrder.paymentMethod || '—'}
                    </p>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                      activeOrder.isPaid === false
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    )}>
                      {activeOrder.isPaid === false ? 'Unpaid' : 'Paid'}
                    </span>
                  </div>
                </div>

                {/* Customer Notes — filtered */}
                {customerNotes && (
                  <div className="border-b border-[#f0f0f0] px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <ClipboardText size={12} weight="bold" className="text-[#b0b0b0]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">Notes</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#6b6b6b]">{customerNotes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="px-4 py-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a0a0]">Total</span>
                    <span className="text-[22px] font-extrabold tracking-tight text-[#1a1a1a]">
                      {fmtMoney(activeOrder.total, activeOrder.currency)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-right">
                    <span className="text-[11px] text-[#b0b0b0]">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
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

  // Standalone: fullscreen with top bar
  if (standalone) {
    return (
      <div className="flex h-screen flex-col bg-[#f5f5f4]">
        <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500">
              <Package size={13} weight="bold" className="text-white" />
            </div>
            <span className="text-[13px] font-extrabold tracking-tight text-[#1a1a1a]">Packing</span>
            <span className={cn(
              'flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-bold',
              queue.length > 0 ? 'bg-orange-500 text-white' : 'bg-[#f0f0f0] text-[#a0a0a0]'
            )}>
              {queue.length}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] font-medium text-[#a0a0a0] transition-colors hover:text-red-600"
          >
            <SignOut size={13} />
            Log out
          </button>
        </div>
        <div className="flex-1 overflow-hidden">{content}</div>
      </div>
    );
  }

  // Embedded: with page header
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
          <Package size={18} weight="duotone" className="text-orange-600" />
        </div>
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight">Packing Station</h2>
          <p className="text-[12px] text-muted-foreground">Verify items, print labels, ship orders.</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border" style={{ height: 'calc(100vh - 160px)' }}>
        {content}
      </div>
    </div>
  );
}
