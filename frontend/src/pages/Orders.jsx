import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import api from '../services/api.js';

const statusConfig = {
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

const filterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AWAITING_PICK', label: 'Awaiting Pick' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const params = { limit: 25 };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your WooCommerce orders.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-9 pr-8 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {meta.total > 0 && (
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
                  className="transition-colors hover:bg-muted/30"
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
                <td colSpan="6" className="px-5 py-16 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground">No orders found</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Connect your WooCommerce store to sync orders.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
