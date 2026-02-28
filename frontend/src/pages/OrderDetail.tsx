import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { OrderDetail as OrderDetailType, OrderStatus, WooAddress, Shipment } from '../types';

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  AWAITING_PICK: { label: 'Awaiting Pick', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  PICKING: { label: 'Picking', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  PICKED: { label: 'Picked', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  PACKING: { label: 'Packing', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  SHIPPED: { label: 'Shipped', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-500/10', text: 'text-green-600', dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const allStatuses: OrderStatus[] = [
  'PENDING', 'AWAITING_PICK', 'PICKING', 'PICKED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD',
];

const shipmentStatusConfig: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  LABEL_CREATED: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  SHIPPED: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  IN_TRANSIT: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  RETURNED: { bg: 'bg-red-500/10', text: 'text-red-600' },
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

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

  const updateStatus = useCallback(async (newStatus: OrderStatus) => {
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

  const status = statusConfig[order.status] || statusConfig.ON_HOLD;
  const subtotal = order.items?.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) ?? 0;
  const shippingAddr = formatAddress(order.shippingAddress);
  const billingAddr = formatAddress(order.billingAddress);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
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
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h2>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {order.store?.name && <>{order.store.name} &middot; </>}
                {new Date(order.wooCreatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value as OrderStatus)}
              disabled={statusUpdating}
              className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3.5 pr-8 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {statusUpdating && (
              <Loader2 className="absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items Card */}
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
                return (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {item.product?.imageUrl ? (
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
                          <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{item.name}</p>
                      {item.sku && (
                        <code className="mt-0.5 text-[11px] text-muted-foreground">{item.sku}</code>
                      )}
                      <div className="mt-1">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          fullyPicked
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : item.pickedQty > 0
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-muted text-muted-foreground'
                        )}>
                          Picked {item.pickedQty}/{item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Qty x Price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold">{order.currency} {lineTotal.toFixed(2)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.quantity} &times; {order.currency} {parseFloat(item.price).toFixed(2)}
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
          </div>

          {/* Payment Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({order.items?.length || 0} items)</span>
                <span className="font-medium">{order.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="my-3 border-t border-border/40" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold">{order.currency} {parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipments Card */}
          {order.shipments && order.shipments.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Shipments
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {order.shipments.length}
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-border/40">
                {order.shipments.map((ship: Shipment) => {
                  const sc = shipmentStatusConfig[ship.status] || shipmentStatusConfig.PENDING;
                  return (
                    <div key={ship.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold">{ship.carrier || 'No carrier'}</p>
                        {ship.trackingNumber && (
                          <code className="mt-0.5 text-xs text-muted-foreground">{ship.trackingNumber}</code>
                        )}
                      </div>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        sc.bg, sc.text
                      )}>
                        {ship.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Card */}
          {order.notes && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Notes
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — 1 col */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm font-semibold">{order.customerName}</p>
              {order.customerEmail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{order.customerEmail}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddr && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Shipping Address
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">{shippingAddr}</p>
              </div>
            </div>
          )}

          {/* Billing Address */}
          {billingAddr && (
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

          {/* Timeline Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Placed</span>
                  <span className="text-sm font-medium">
                    {new Date(order.wooCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">WooCommerce</span>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {order.wooStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Warehouse</span>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                </div>
                {order.shipments && order.shipments.some(s => s.shippedAt) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shipped</span>
                    <span className="text-sm font-medium">
                      {new Date(order.shipments.find(s => s.shippedAt)!.shippedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {order.shipments && order.shipments.some(s => s.deliveredAt) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <span className="text-sm font-medium">
                      {new Date(order.shipments.find(s => s.deliveredAt)!.deliveredAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
