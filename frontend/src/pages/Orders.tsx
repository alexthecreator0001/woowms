import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import Pagination from '../components/Pagination';
import TableConfigDropdown from '../components/TableConfigDropdown';
import { useTableConfig } from '../hooks/useTableConfig';
import type { Order, PaginationMeta, TableColumnDef } from '../types';

const orderColumnDefs: TableColumnDef[] = [
  { id: 'order', label: 'Order' },
  { id: 'customer', label: 'Customer' },
  { id: 'status', label: 'Status' },
  { id: 'items', label: 'Items' },
  { id: 'total', label: 'Total' },
  { id: 'date', label: 'Date' },
];

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
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { visibleIds, toggleColumn, isVisible } = useTableConfig('orderColumns', orderColumnDefs);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    loadOrders();
  }, [filter, page]);

  async function loadOrders() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
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
            <tr className="border-b border-border/50 bg-muted/30">
              {isVisible('order') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>}
              {isVisible('customer') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>}
              {isVisible('status') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>}
              {isVisible('items') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>}
              {isVisible('total') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>}
              {isVisible('date') && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>}
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.ON_HOLD;
              return (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
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
                  <td className="px-5 py-3.5">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={visibleIds.length + 1} className="px-5 py-16 text-center">
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

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
