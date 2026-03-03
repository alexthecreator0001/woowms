import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  MagnifyingGlass,
  CaretRight,
  CaretDown as CaretDownIcon,
  Star,
  ClockCounterClockwise,
  Gear,
  Package,
  Truck,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { getStatusStyle, fetchAllStatuses, type StatusDef } from '../lib/statuses';
import api from '../services/api';
import Pagination from '../components/Pagination';
import TableConfigDropdown from '../components/TableConfigDropdown';
import { useTableConfig } from '../hooks/useTableConfig';
import type { Order, PaginationMeta, TableColumnDef } from '../types';

interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
}

const orderColumnDefs: TableColumnDef[] = [
  { id: 'order', label: 'Order' },
  { id: 'customer', label: 'Customer' },
  { id: 'status', label: 'Status' },
  { id: 'items', label: 'Items' },
  { id: 'total', label: 'Total' },
  { id: 'date', label: 'Date' },
  { id: 'email', label: 'Email', defaultVisible: false },
  { id: 'payment', label: 'Payment', defaultVisible: false },
  { id: 'shipping', label: 'Shipping', defaultVisible: false },
  { id: 'priority', label: 'Priority', defaultVisible: false },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allStatuses, setAllStatuses] = useState<StatusDef[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const { visibleIds, toggleColumn, isVisible } = useTableConfig('orderColumns', orderColumnDefs);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/stats');
      setOrderStats(data.data);
    } catch (err) {
      console.error('Failed to load order stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllStatuses().then(setAllStatuses);
    loadStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    loadOrders();
  }, [filter, search, page]);

  async function loadOrders() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  // Derive stat strip values from order stats
  const pending = orderStats ? (orderStats.byStatus['PENDING'] || 0) + (orderStats.byStatus['ON_HOLD'] || 0) : 0;
  const processing = orderStats ? (orderStats.byStatus['PROCESSING'] || 0) : 0;
  const picking = orderStats ? (orderStats.byStatus['PICKING'] || 0) + (orderStats.byStatus['PACKING'] || 0) : 0;
  const shipped = orderStats ? (orderStats.byStatus['SHIPPED'] || 0) + (orderStats.byStatus['DELIVERED'] || 0) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag size={20} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Orders</h2>
            <p className="text-[13px] text-muted-foreground">
              {orderStats ? `${orderStats.total} total orders` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      {orderStats && (
        <div className="grid grid-cols-4 divide-x divide-border/50 rounded-xl border border-border/60 bg-card shadow-sm">
          {[
            { label: 'Pending', value: pending, icon: ClockCounterClockwise, color: 'text-foreground', iconColor: 'text-amber-500' },
            { label: 'Processing', value: processing, icon: Gear, color: processing > 0 ? 'text-blue-600' : 'text-foreground', iconColor: 'text-blue-500' },
            { label: 'Picking / Packing', value: picking, icon: Package, color: picking > 0 ? 'text-violet-600' : 'text-foreground', iconColor: 'text-violet-500' },
            { label: 'Shipped', value: shipped, icon: Truck, color: 'text-foreground', iconColor: 'text-emerald-500' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3.5">
              <s.icon size={18} weight="duotone" className={s.iconColor} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className={cn('text-lg font-bold tracking-tight', s.color)}>{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3.5 pr-8 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            {allStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <CaretDownIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {meta && meta.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {meta.total} order{meta.total !== 1 ? 's' : ''}
          </span>
        )}
        <div className="ml-auto">
          <TableConfigDropdown columns={orderColumnDefs} visibleIds={visibleIds} onToggle={toggleColumn} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              {isVisible('order') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Order</th>}
              {isVisible('customer') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Customer</th>}
              {isVisible('status') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>}
              {isVisible('items') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Items</th>}
              {isVisible('total') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total</th>}
              {isVisible('date') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Date</th>}
              {isVisible('email') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Email</th>}
              {isVisible('payment') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Payment</th>}
              {isVisible('shipping') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Shipping</th>}
              {isVisible('priority') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Priority</th>}
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {orders.map((order) => {
              const status = getStatusStyle(order.status, allStatuses);
              return (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.orderNumber}`)}
                  className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-primary hover:bg-primary/[0.03]"
                >
                  {isVisible('order') && <td className="px-5 py-3.5 text-sm font-semibold">#{order.orderNumber}</td>}
                  {isVisible('customer') && <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.customerName}</td>}
                  {isVisible('status') && (
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                        {status.label}
                      </span>
                    </td>
                  )}
                  {isVisible('items') && <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.items?.length || 0}</td>}
                  {isVisible('total') && <td className="px-5 py-3.5 text-sm font-medium">{order.currency} {order.total}</td>}
                  {isVisible('date') && (
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {new Date(order.wooCreatedAt).toLocaleDateString()}
                    </td>
                  )}
                  {isVisible('email') && (
                    <td className="px-5 py-3.5 text-sm text-muted-foreground truncate max-w-[180px]">
                      {order.customerEmail || '\u2014'}
                    </td>
                  )}
                  {isVisible('payment') && (
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {order.paymentMethodTitle || order.paymentMethod || '\u2014'}
                    </td>
                  )}
                  {isVisible('shipping') && (
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {order.shippingMethodTitle || order.shippingMethod || '\u2014'}
                    </td>
                  )}
                  {isVisible('priority') && (
                    <td className="px-5 py-3.5">
                      {(order as any).priority ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          (order as any).priority === 3 ? 'bg-red-500/10 text-red-600' :
                          (order as any).priority === 2 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-blue-500/10 text-blue-600'
                        )}>
                          <Star size={10} weight="fill" />
                          {(order as any).priority === 3 ? 'High' : (order as any).priority === 2 ? 'Normal' : 'Low'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/40">&mdash;</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={visibleIds.length + 1} className="px-5 py-16 text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 blur-xl" />
                    <ShoppingBag size={32} weight="duotone" className="relative text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No orders found</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Connect your WooCommerce store to sync orders.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
