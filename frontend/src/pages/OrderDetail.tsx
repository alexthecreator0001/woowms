import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  Package,
  Truck,
  CreditCard,
  StickyNote,
  Clock,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Download,
  MapPinned,
  Mail,
  Phone,
  CircleDot,
  Plus,
  X,
  Tag,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import { fmtMoney } from '../lib/currency';
import { getStatusStyle, fetchAllStatuses, type StatusDef } from '../lib/statuses';
import api from '../services/api';
import type { OrderDetail as OrderDetailType, WooAddress, Shipment } from '../types';

/* ─── Helpers ────────────────────────────────────────── */

const shipmentStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:       { bg: 'bg-amber-500/10',   text: 'text-amber-600',   label: 'Pending' },
  LABEL_CREATED: { bg: 'bg-blue-500/10',    text: 'text-blue-600',    label: 'Label Created' },
  SHIPPED:       { bg: 'bg-violet-500/10',   text: 'text-violet-600',  label: 'Shipped' },
  IN_TRANSIT:    { bg: 'bg-violet-500/10',   text: 'text-violet-600',  label: 'In Transit' },
  DELIVERED:     { bg: 'bg-emerald-500/10',  text: 'text-emerald-600', label: 'Delivered' },
  RETURNED:      { bg: 'bg-red-500/10',      text: 'text-red-600',     label: 'Returned' },
};

function formatAddress(addr: WooAddress | undefined | null): string | null {
  if (!addr) return null;
  const parts = [
    [addr.first_name, addr.last_name].filter(Boolean).join(' '),
    addr.address_1,
    addr.address_2,
    [addr.city, addr.state, addr.postcode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : null;
}

function addressOneLine(addr: WooAddress | undefined | null): string {
  if (!addr) return '';
  return [addr.address_1, addr.city, addr.state, addr.postcode, addr.country]
    .filter(Boolean)
    .join(', ');
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function addressesMatch(a: WooAddress | undefined | null, b: WooAddress | undefined | null): boolean {
  if (!a || !b) return false;
  return (
    a.address_1 === b.address_1 &&
    a.city === b.city &&
    a.postcode === b.postcode &&
    a.country === b.country
  );
}

/* ─── Copy Button ────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ─── Tag Colors & Popover ────────────────────────────── */

const TAG_COLORS = [
  { name: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  { name: 'violet', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  { name: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  { name: 'fuchsia', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
];

const TAG_COLOR_MAP: Record<string, { bg: string; text: string }> = Object.fromEntries(
  TAG_COLORS.map((c) => [c.name, { bg: c.bg, text: c.text }])
);

function TagPopover({ onAdd, onClose }: { onAdd: (tag: { label: string; color: string }) => void; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('blue');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const submit = () => {
    if (!label.trim()) return;
    onAdd({ label: label.trim(), color });
    onClose();
  };

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 w-56 rounded-xl border border-border/60 bg-card p-3 shadow-lg">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Tag label..."
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-2 flex items-center gap-1.5">
        {TAG_COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => setColor(c.name)}
            className={cn(
              'h-5 w-5 rounded-full transition-all',
              c.dot,
              color === c.name ? 'ring-2 ring-offset-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border'
            )}
          />
        ))}
      </div>
      <button
        onClick={submit}
        disabled={!label.trim()}
        className="mt-2 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        Add Tag
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [allStatuses, setAllStatuses] = useState<StatusDef[]>([]);
  const [orderTags, setOrderTags] = useState<{ label: string; color: string }[]>([]);
  const [customerManualTags, setCustomerManualTags] = useState<{ label: string; color: string }[]>([]);
  const [packingNote, setPackingNote] = useState('');
  const [tagPopover, setTagPopover] = useState<'order' | 'customer' | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    fetchAllStatuses().then(setAllStatuses);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch((err) => {
        console.error('Failed to load order:', err);
        navigate('/orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Sync state from order data
  useEffect(() => {
    if (order) {
      setOrderTags(order.tags || []);
      setCustomerManualTags(order.customerStats?.manualTags || []);
      setPackingNote(order.packingNote || '');
    }
  }, [order]);

  // Order tags management
  const saveOrderTags = useCallback(async (tags: { label: string; color: string }[]) => {
    if (!order) return;
    setOrderTags(tags);
    try { await api.patch(`/orders/${order.orderNumber}`, { tags }); } catch (err) { console.error('Failed to save order tags:', err); }
  }, [order]);

  const addOrderTag = useCallback((tag: { label: string; color: string }) => {
    saveOrderTags([...orderTags, tag]);
  }, [orderTags, saveOrderTags]);

  const removeOrderTag = useCallback((idx: number) => {
    saveOrderTags(orderTags.filter((_, i) => i !== idx));
  }, [orderTags, saveOrderTags]);

  // Customer manual tags management
  const saveCustomerTags = useCallback(async (tags: { label: string; color: string }[]) => {
    if (!order) return;
    setCustomerManualTags(tags);
    try { await api.put(`/orders/${order.orderNumber}/customer-tags`, { tags }); } catch (err) { console.error('Failed to save customer tags:', err); }
  }, [order]);

  const addCustomerTag = useCallback((tag: { label: string; color: string }) => {
    saveCustomerTags([...customerManualTags, tag]);
  }, [customerManualTags, saveCustomerTags]);

  const removeCustomerTag = useCallback((idx: number) => {
    saveCustomerTags(customerManualTags.filter((_, i) => i !== idx));
  }, [customerManualTags, saveCustomerTags]);

  // Packing note — save on blur
  const savePackingNote = useCallback(async () => {
    if (!order) return;
    try {
      await api.patch(`/orders/${order.orderNumber}`, { packingNote: packingNote || null });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) { console.error('Failed to save packing note:', err); }
  }, [order, packingNote]);

  const updateStatus = useCallback(async (newStatus: string) => {
    if (!order) return;
    try {
      setStatusUpdating(true);
      await api.patch(`/orders/${order.id}/status`, { status: newStatus });
      const { data } = await api.get(`/orders/${order.id}`);
      setOrder(data.data);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  }, [order]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const status = getStatusStyle(order.status, allStatuses);
  const subtotal = order.items?.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) ?? 0;
  const shippingAddr = formatAddress(order.shippingAddress);
  const billingAddr = formatAddress(order.billingAddress);
  const showBilling = billingAddr && !addressesMatch(order.shippingAddress, order.billingAddress);
  const mapQuery = addressOneLine(order.shippingAddress);
  const billingPhone = order.billingAddress?.phone;

  // Timeline steps
  const hasShipped = order.shipments?.some((s) => s.shippedAt);
  const hasDelivered = order.shipments?.some((s) => s.deliveredAt);
  const timelineSteps = [
    { label: 'Order Placed', date: order.wooCreatedAt, done: true },
    { label: 'Synced to WMS', date: order.wooCreatedAt, done: true },
    { label: 'Shipped', date: order.shipments?.find((s) => s.shippedAt)?.shippedAt ?? null, done: !!hasShipped },
    { label: 'Delivered', date: order.shipments?.find((s) => s.deliveredAt)?.deliveredAt ?? null, done: !!hasDelivered },
  ];
  // Find the "current" step index (last completed)
  const currentStepIdx = timelineSteps.reduce((acc, step, i) => (step.done ? i : acc), 0);

  return (
    <div className="space-y-6">
      {/* ── Back + Header ─────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/orders')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h2>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
                {order.isPaid === false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                    COD
                  </span>
                )}
                {order.isPaid !== false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                    Paid
                  </span>
                )}
                {order.shippingMethodTitle && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                    <Truck className="h-3 w-3" />
                    {order.shippingMethodTitle}
                  </span>
                )}
                {/* Order Tags */}
                {orderTags.map((tag, i) => {
                  const cs = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.blue;
                  return (
                    <span
                      key={i}
                      className={cn('group inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', cs.bg, cs.text)}
                    >
                      <Tag className="h-3 w-3" />
                      {tag.label}
                      <button
                        onClick={() => removeOrderTag(i)}
                        className="ml-0.5 hidden rounded-full p-0.5 transition-colors hover:bg-black/10 group-hover:inline-flex"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
                <div className="relative">
                  <button
                    onClick={() => setTagPopover(tagPopover === 'order' ? null : 'order')}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    title="Add tag"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  {tagPopover === 'order' && (
                    <TagPopover onAdd={addOrderTag} onClose={() => setTagPopover(null)} />
                  )}
                </div>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {order.store?.name && <>{order.store.name} &middot; </>}
                {new Date(order.wooCreatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                <span className="ml-1.5 text-muted-foreground/60">({relativeTime(order.wooCreatedAt)})</span>
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={statusUpdating}
              className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3.5 pr-8 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {allStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {statusUpdating && (
              <Loader2 className="absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ═══ LEFT — 2 cols ═══ */}
        <div className="space-y-6 lg:col-span-2">

          {/* ── Items Card ──────────────────────────────── */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {order.items?.length || 0}
                </span>
              </h3>
            </div>
            <div className="divide-y divide-border/40">
              {order.items?.map((item) => {
                const lineTotal = parseFloat(item.price) * item.quantity;
                const fullyPicked = item.pickedQty >= item.quantity;
                const pickPct = item.quantity > 0 ? Math.min((item.pickedQty / item.quantity) * 100, 100) : 0;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Thumbnail — bigger 56px */}
                    <div className="flex-shrink-0">
                      {item.product?.imageUrl ? (
                        <div className="h-14 w-14 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
                          <img src={proxyUrl(item.product.imageUrl, 112)!} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      {item.sku ? (
                        <Link
                          to={`/inventory/${item.sku}`}
                          className="text-sm font-semibold leading-tight hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold leading-tight">{item.name}</p>
                      )}
                      {item.sku && (
                        <code className="mt-0.5 block text-[11px] text-muted-foreground">{item.sku}</code>
                      )}
                      {/* Picking progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60" style={{ maxWidth: 120 }}>
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              fullyPicked ? 'bg-emerald-500' : item.pickedQty > 0 ? 'bg-amber-500' : 'bg-muted-foreground/20'
                            )}
                            style={{ width: `${pickPct}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold tabular-nums',
                          fullyPicked ? 'text-emerald-600' : item.pickedQty > 0 ? 'text-amber-600' : 'text-muted-foreground'
                        )}>
                          {item.pickedQty}/{item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Qty x Price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold">{fmtMoney(lineTotal, order.currency)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.quantity} &times; {fmtMoney(item.price, order.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <div className="px-6 py-12 text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No items</p>
                </div>
              )}
            </div>
            {/* Totals row */}
            {order.items && order.items.length > 0 && (
              <div className="border-t border-border/50 px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} items total
                </span>
                <span className="text-sm font-bold">{fmtMoney(subtotal, order.currency)}</span>
              </div>
            )}
          </div>

          {/* ── Shipments & Tracking Card ───────────────── */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Shipments & Tracking
                {order.shipments && order.shipments.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {order.shipments.length}
                  </span>
                )}
              </h3>
            </div>
            {order.shipments && order.shipments.length > 0 ? (
              <div className="divide-y divide-border/40">
                {order.shipments.map((ship: Shipment) => {
                  const sc = shipmentStatusConfig[ship.status] || shipmentStatusConfig.PENDING;
                  const trackUrl = ship.trackingUrl || (ship.trackingNumber ? `https://parcelsapp.com/en/tracking/${ship.trackingNumber}` : null);
                  return (
                    <div key={ship.id} className="px-6 py-4 space-y-3">
                      {/* Row 1: carrier + status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{ship.carrier || 'Unknown Carrier'}</span>
                          {ship.weight && (
                            <span className="text-xs text-muted-foreground">{ship.weight} kg</span>
                          )}
                        </div>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          sc.bg, sc.text
                        )}>
                          {sc.label}
                        </span>
                      </div>

                      {/* Row 2: Tracking number */}
                      {ship.trackingNumber && (
                        <div className="flex items-center gap-2">
                          <code className="rounded-md bg-muted/60 px-2.5 py-1 text-xs font-mono tracking-wider">
                            {ship.trackingNumber}
                          </code>
                          <CopyButton text={ship.trackingNumber} />
                        </div>
                      )}

                      {/* Row 3: Action buttons + dates */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {trackUrl && (
                          <a
                            href={trackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Track Package
                          </a>
                        )}
                        {ship.labelUrl && (
                          <a
                            href={ship.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            <Download className="h-3 w-3" />
                            Download Label
                          </a>
                        )}
                        <div className="flex-1" />
                        {ship.shippedAt && (
                          <span className="text-[11px] text-muted-foreground">
                            Shipped {new Date(ship.shippedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {ship.deliveredAt && (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Delivered {new Date(ship.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <Truck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No shipments yet</p>
              </div>
            )}
          </div>

          {/* ── Packing Note Card ────────────────────────── */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] shadow-sm">
            <div className="border-b border-amber-500/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4 text-amber-600" />
                  Packing Note
                </h3>
                {noteSaved && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={packingNote}
                onChange={(e) => setPackingNote(e.target.value)}
                onBlur={savePackingNote}
                placeholder="Add a note for packing / picking..."
                rows={3}
                className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* ── Notes Card ──────────────────────────────── */}
          {order.notes && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Customer Notes
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT — 1 col ═══ */}
        <div className="space-y-6">

          {/* ── Customer Card ───────────────────────────── */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(order.customerName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{order.customerName}</p>
                  {order.customerEmail && (
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {order.customerEmail}
                    </a>
                  )}
                  {billingPhone && (
                    <a
                      href={`tel:${billingPhone}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {billingPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Customer stats */}
              {order.customerStats && (
                <div className="mt-3 border-t border-border/40 pt-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {order.customerStats.orderCount} {order.customerStats.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {fmtMoney(order.customerStats.totalRevenue, order.currency)} lifetime
                    </span>
                  </div>
                  {order.customerStats.labels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {order.customerStats.labels.map((tag, i) => {
                        const cs = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.blue;
                        return (
                          <span
                            key={`auto-${i}`}
                            className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', cs.bg, cs.text)}
                          >
                            {tag.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Manual customer tags */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {customerManualTags.map((tag, i) => {
                      const cs = TAG_COLOR_MAP[tag.color] || TAG_COLOR_MAP.blue;
                      return (
                        <span
                          key={`manual-${i}`}
                          className={cn('group inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', cs.bg, cs.text)}
                        >
                          {tag.label}
                          <button
                            onClick={() => removeCustomerTag(i)}
                            className="ml-0.5 hidden rounded-full p-0.5 transition-colors hover:bg-black/10 group-hover:inline-flex"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                    <div className="relative">
                      <button
                        onClick={() => setTagPopover(tagPopover === 'customer' ? null : 'customer')}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        title="Add customer tag"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {tagPopover === 'customer' && (
                        <TagPopover onAdd={addCustomerTag} onClose={() => setTagPopover(null)} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Shipping Address + Map ──────────────────── */}
          {shippingAddr && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Shipping Address
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">{shippingAddr}</p>
              </div>
              {/* Embedded Google Map */}
              {mapQuery && (
                <>
                  <div className="h-40 w-full bg-muted/30">
                    <iframe
                      title="Shipping location"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=14`}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="px-6 py-3 border-t border-border/40">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MapPinned className="h-3 w-3" />
                      Open in Google Maps
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Billing Address (only if different) ─────── */}
          {showBilling && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Billing Address
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">{billingAddr}</p>
              </div>
            </div>
          )}

          {/* ── Timeline Card ───────────────────────────── */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="relative space-y-0">
                {timelineSteps.map((step, idx) => {
                  const isLast = idx === timelineSteps.length - 1;
                  const isCurrent = idx === currentStepIdx && !isLast;
                  const isDone = step.done;
                  const isPending = !step.done;
                  return (
                    <div key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                      {/* Vertical line */}
                      {!isLast && (
                        <div
                          className={cn(
                            'absolute left-[7px] top-4 bottom-0 w-px',
                            isDone && timelineSteps[idx + 1]?.done
                              ? 'bg-emerald-400'
                              : isDone && !timelineSteps[idx + 1]?.done
                                ? 'bg-gradient-to-b from-emerald-400 to-border'
                                : 'border-l border-dashed border-border'
                          )}
                        />
                      )}
                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0 mt-0.5">
                        {isDone ? (
                          <div className={cn(
                            'h-[15px] w-[15px] rounded-full border-2 flex items-center justify-center',
                            isCurrent
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-emerald-500 bg-emerald-500'
                          )}>
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        ) : (
                          <div className="h-[15px] w-[15px] rounded-full border-2 border-border bg-background">
                            <CircleDot className="h-full w-full text-muted-foreground/30 p-px" />
                          </div>
                        )}
                      </div>
                      {/* Label + Date */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm font-medium',
                          isPending && 'text-muted-foreground'
                        )}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="ml-1 text-muted-foreground/60">
                              {new Date(step.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Payment Summary ─────────────────────────── */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment
              </h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {order.paymentMethodTitle && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{order.paymentMethodTitle}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({order.items?.length || 0} items)</span>
                <span className="font-medium">{fmtMoney(subtotal, order.currency)}</span>
              </div>
              <div className="border-t border-border/40" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Total</span>
                  {order.isPaid === false ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      COD
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      Paid
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold">{fmtMoney(order.total, order.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
