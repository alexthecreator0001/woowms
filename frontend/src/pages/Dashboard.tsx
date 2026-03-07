import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ClockCountdown,
  Cube,
  Warning,
  ArrowRight,
  ListChecks,
  TruckTrailer,
  Package,
  ArrowUpRight,
  Storefront,
  Warehouse,
  ChartLineUp,
  CaretRight,
  ListMagnifyingGlass,
  CurrencyDollar,
  CalendarBlank,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { getStatusDotBadge } from '../lib/statuses';
import api from '../services/api';
import type { Order } from '../types';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ orders: 0, pending: 0, products: 0, lowStock: 0 });
  const [inventoryStats, setInventoryStats] = useState({ inStock: 0, reserved: 0, incoming: 0 });
  const [storeCount, setStoreCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const safe = (p: Promise<any>) => p.catch(() => null);
      try {
        const [meRes, ordersRes, orderStatsRes, inventoryRes, invStatsRes, lowStockRes, storesRes] = await Promise.all([
          safe(api.get('/auth/me')),
          safe(api.get('/orders', { params: { limit: 5 } })),
          safe(api.get('/orders/stats')),
          safe(api.get('/inventory', { params: { limit: 1 } })),
          safe(api.get('/inventory/stats')),
          safe(api.get('/inventory/low-stock')),
          safe(api.get('/stores')),
        ]);
        if (meRes) setUserName(meRes.data.data.name || '');
        if (orderStatsRes) {
          const byStatus = orderStatsRes.data.data.byStatus || {};
          setStats((prev) => ({
            ...prev,
            orders: orderStatsRes.data.data.total,
            pending: (byStatus.PENDING || 0) + (byStatus.PROCESSING || 0),
          }));
        }
        if (inventoryRes) setStats((prev) => ({ ...prev, products: inventoryRes.data.meta.total }));
        if (lowStockRes) setStats((prev) => ({ ...prev, lowStock: (lowStockRes.data.data || []).length }));
        if (invStatsRes) {
          setInventoryStats({
            inStock: invStatsRes.data.data.inStock || 0,
            reserved: invStatsRes.data.data.reserved || 0,
            incoming: invStatsRes.data.data.incoming || 0,
          });
        }
        if (ordersRes) setRecentOrders(ordersRes.data.data || []);
        if (storesRes) setStoreCount(storesRes.data.data.filter((s: any) => s.isActive).length);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const metricCards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', to: '/orders' },
    { label: 'Needs Attention', value: stats.pending, icon: ClockCountdown, color: 'text-amber-500', bg: 'bg-amber-500/10', highlight: stats.pending > 0, to: '/orders' },
    { label: 'Products', value: stats.products, icon: Cube, color: 'text-emerald-500', bg: 'bg-emerald-500/10', to: '/inventory' },
    { label: 'Low Stock', value: stats.lowStock, icon: Warning, color: 'text-red-500', bg: 'bg-red-500/10', highlight: stats.lowStock > 0, to: '/inventory' },
  ];

  const shortcuts = [
    { to: '/orders', label: 'Orders', icon: ShoppingBag, color: 'text-primary', desc: 'Manage fulfillment' },
    { to: '/picking', label: 'Picking', icon: ListChecks, color: 'text-violet-500', desc: 'Pick & pack' },
    { to: '/shipping', label: 'Shipping', icon: TruckTrailer, color: 'text-emerald-500', desc: 'Ship orders' },
    { to: '/receiving', label: 'Purchase Orders', icon: Package, color: 'text-amber-500', desc: 'Inbound stock' },
    { to: '/warehouse', label: 'Warehouse', icon: Warehouse, color: 'text-blue-500', desc: 'Locations & bins' },
    { to: '/cycle-counts', label: 'Cycle Counts', icon: ListMagnifyingGlass, color: 'text-teal-500', desc: 'Inventory accuracy' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {userName || 'there'}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Here's what's happening with your warehouse today.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">{s.label}</p>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', s.bg)}>
                <s.icon size={16} weight="duotone" className={s.color} />
              </div>
            </div>
            {loading ? (
              <Skeleton className="mt-3 h-7 w-16" />
            ) : (
              <p className={cn('mt-2 text-2xl font-bold tracking-tight', s.highlight ? s.color : '')}>
                {s.value.toLocaleString()}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Inventory summary strip */}
      <div className="flex flex-wrap gap-6 rounded-xl border border-border/60 bg-card px-6 py-4 shadow-sm">
        {[
          { label: 'Total Stock', value: inventoryStats.inStock, color: '' },
          { label: 'Reserved', value: inventoryStats.reserved, color: 'text-amber-500' },
          { label: 'Incoming', value: inventoryStats.incoming, color: 'text-blue-500' },
          { label: 'Free to Sell', value: inventoryStats.inStock - inventoryStats.reserved, color: 'text-emerald-500' },
        ].map((item) => (
          <div key={item.label} className="min-w-[100px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-14" />
            ) : (
              <p className={cn('text-lg font-semibold tabular-nums', item.color)}>{item.value.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">Quick Actions</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-border hover:shadow-sm"
            >
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', a.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                <a.icon size={18} weight="duotone" className={a.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-[11px] text-muted-foreground/60">{a.desc}</p>
              </div>
              <CaretRight size={14} className="text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column: Recent Orders + Resources */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders — 2 cols */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Orders</h2>
            <Link to="/orders" className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            {loading ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <div className="ml-auto flex items-center gap-3">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                <ShoppingBag size={32} weight="duotone" className="mb-2 opacity-20" />
                <p className="text-sm">No orders yet</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Connect a store to get started.</p>
              </div>
            ) : (
              recentOrders.map((order) => {
                const colors = getStatusDotBadge(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.orderNumber}`)}
                    className="flex cursor-pointer items-center gap-3 border-b border-border/40 px-5 py-3 last:border-b-0 transition-colors hover:bg-muted/40"
                  >
                    <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', colors.dot)} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold">#{order.orderNumber}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{order.customerName}</span>
                    </div>
                    <span className="hidden sm:inline text-[12px] tabular-nums text-muted-foreground/60">
                      {order.total && parseFloat(order.total) > 0 ? formatCurrency(order.total) : ''}
                    </span>
                    <span className="hidden sm:inline text-[12px] text-muted-foreground/40">
                      {order.wooCreatedAt ? formatDate(order.wooCreatedAt) : ''}
                    </span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', colors.badge)}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <CaretRight size={14} className="text-muted-foreground/30" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resources sidebar — 1 col */}
        <div>
          <div className="mb-3">
            <h2 className="text-base font-semibold">Resources</h2>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Storefront size={16} weight="duotone" className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  {loading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <p className="text-sm font-semibold">{storeCount ?? '—'} store{storeCount !== 1 ? 's' : ''} connected</p>
                  )}
                </div>
                <Link to="/settings" className="text-primary hover:text-primary/80">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            {stats.pending > 0 && (
              <Link
                to="/orders"
                className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <ClockCountdown size={16} weight="duotone" className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{stats.pending} order{stats.pending !== 1 ? 's' : ''} need attention</p>
                </div>
                <CaretRight size={14} className="text-amber-500/50" />
              </Link>
            )}
            {stats.lowStock > 0 && (
              <Link
                to="/inventory"
                className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <Warning size={16} weight="duotone" className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''} low on stock</p>
                </div>
                <CaretRight size={14} className="text-red-500/50" />
              </Link>
            )}
            <a
              href="https://docs.picknpack.io/warehouse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
            >
              <Warehouse size={20} weight="duotone" className="mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Warehouse Docs</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Zones, aisles, racks, and shelf locations.</p>
              </div>
            </a>
            <a
              href="https://docs.picknpack.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
            >
              <ChartLineUp size={20} weight="duotone" className="mt-0.5 flex-shrink-0 text-violet-500" />
              <div>
                <p className="text-sm font-semibold">Documentation</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Browse all help topics and guides.</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
