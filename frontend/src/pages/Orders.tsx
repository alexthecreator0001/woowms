import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  X,
  ChevronDown,
  User,
  MapPin,
  Package,
  Truck,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Order, OrderStatus, PaginationMeta, Shipment } from '../types';

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

const filterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AWAITING_PICK', label: 'Awaiting Pick' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface OrderDetail extends Order {
  shippingAddress?: string;
  billingAddress?: string;
  shipments?: Shipment[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Partial<PaginationMeta>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25 };
      if (filter) params.status = filter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const openDetail = useCallback(async (orderId: number) => {
    try {
      setDetailLoading(true);
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data.data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  const updateStatus = useCallback(async (orderId: number, newStatus: OrderStatus) => {
    try {
      setStatusUpdating(true);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Refresh detail + list
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data.data);
      loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-5.5 w-5.5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage and track your WooCommerce orders.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3.5 pr-8 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {meta.total != null && meta.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {orders.length} of {meta.total} orders
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.ON_HOLD;
              return (
                <tr
                  key={order.id}
                  onClick={() => openDetail(order.id)}
                  className="cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-primary hover:bg-primary/[0.03]"
                >
                  <td className="px-5 py-3.5 text-sm font-semibold">#{order.orderNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.customerName}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.items?.length || 0}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">{order.currency} {order.total}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(order.wooCreatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 blur-xl" />
                    <ShoppingBag className="relative h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No orders found</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Connect your WooCommerce store to sync orders.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail Panel */}
      {(selectedOrder || detailLoading) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border/60 bg-background shadow-2xl">
            {detailLoading && !selectedOrder ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : selectedOrder ? (
              <>
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">#{selectedOrder.orderNumber}</h3>
                    {(() => {
                      const s = statusConfig[selectedOrder.status] || statusConfig.ON_HOLD;
                      return (
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', s.bg, s.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    onClick={closeDetail}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-5 p-6">
                    {/* Customer */}
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Customer
                      </div>
                      <p className="text-sm font-semibold">{selectedOrder.customerName}</p>
                      {selectedOrder.customerEmail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                      )}
                    </div>

                    {/* Addresses */}
                    {(selectedOrder.shippingAddress || selectedOrder.billingAddress) && (
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          Addresses
                        </div>
                        {selectedOrder.shippingAddress && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground">Shipping</p>
                            <p className="text-sm">{selectedOrder.shippingAddress}</p>
                          </div>
                        )}
                        {selectedOrder.billingAddress && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Billing</p>
                            <p className="text-sm">{selectedOrder.billingAddress}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div>
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        Items ({selectedOrder.items?.length || 0})
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Picked</th>
                              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {selectedOrder.items?.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2">
                                  <p className="text-xs font-medium">{item.name}</p>
                                  {item.sku && (
                                    <code className="text-[10px] text-muted-foreground">{item.sku}</code>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center text-xs">{item.quantity}</td>
                                <td className="px-3 py-2 text-center text-xs">
                                  <span className={cn(
                                    'font-medium',
                                    item.pickedQty >= item.quantity ? 'text-emerald-600' : 'text-muted-foreground'
                                  )}>
                                    {item.pickedQty}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right text-xs font-medium">
                                  {selectedOrder.currency} {item.price}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Shipments */}
                    {selectedOrder.shipments && selectedOrder.shipments.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Truck className="h-3.5 w-3.5" />
                          Shipments ({selectedOrder.shipments.length})
                        </div>
                        <div className="space-y-2">
                          {selectedOrder.shipments.map((ship: Shipment) => (
                            <div key={ship.id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{ship.carrier || 'No carrier'}</span>
                                <span className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                  ship.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600' :
                                  ship.status === 'SHIPPED' || ship.status === 'IN_TRANSIT' ? 'bg-violet-500/10 text-violet-600' :
                                  'bg-amber-500/10 text-amber-600'
                                )}>
                                  {ship.status}
                                </span>
                              </div>
                              {ship.trackingNumber && (
                                <code className="mt-1 block text-[11px] text-muted-foreground">{ship.trackingNumber}</code>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Change */}
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Update Status
                      </label>
                      <div className="relative">
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => updateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                          disabled={statusUpdating}
                          className="h-9 w-full appearance-none rounded-lg border border-border/60 bg-card px-3 pr-8 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                </div>

                {/* Panel Footer — Order Total */}
                <div className="border-t border-border/50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Order Total</span>
                    <span className="text-lg font-bold">{selectedOrder.currency} {selectedOrder.total}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
