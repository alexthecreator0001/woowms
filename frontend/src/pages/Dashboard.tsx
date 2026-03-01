import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ClockCountdown,
  Cube,
  Warning,
  ArrowRight,
  Plus,
  ListChecks,
  TruckTrailer,
  Package,
  ArrowUpRight,
  Storefront,
  Warehouse,
  ChartLineUp,
  CaretRight,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { getStatusDotBadge } from '../lib/statuses';
import api from '../services/api';
import type { Order } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ orders: 0, pending: 0, inventory: 0, lowStock: 0 });
  const [storeCount, setStoreCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, ordersRes, inventoryRes, storesRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/orders', { params: { limit: 5 } }),
          api.get('/inventory', { params: { limit: 1 } }),
          api.get('/stores'),
        ]);
        setUserName(meRes.data.data.name || '');
        const pendingRes = await api.get('/orders', { params: { status: 'PENDING', limit: 1 } });
        setStats({
          orders: ordersRes.data.meta.total,
          pending: pendingRes.data.meta.total,
          inventory: inventoryRes.data.meta.total,
          lowStock: 0,
        });
        setRecentOrders(ordersRes.data.data || []);
        setStoreCount(storesRes.data.data.filter((s: any) => s.isActive).length);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
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

  const hasStores = storeCount !== null && storeCount > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {userName || 'there'}!
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Here's what's happening with your warehouse today.
        </p>
      </div>

      {/* Getting started banner */}
      {!hasStores && !loading && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-white to-violet-500/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Getting started</p>
              <h3 className="mt-1.5 text-lg font-semibold">Connect your WooCommerce store</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Link your store to start syncing orders, products, and inventory automatically.
              </p>
              <Link
                to="/settings"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} weight="bold" />
                Connect a Store
              </Link>
            </div>
            <Storefront size={64} weight="duotone" className="hidden sm:block text-primary/15" />
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pending', value: stats.pending, icon: ClockCountdown, color: 'text-amber-500', bg: 'bg-amber-500/10', highlight: stats.pending > 0 },
          { label: 'Products', value: stats.inventory, icon: Cube, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Low Stock', value: stats.lowStock, icon: Warning, color: 'text-red-500', bg: 'bg-red-500/10', highlight: stats.lowStock > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">{s.label}</p>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', s.bg)}>
                <s.icon size={16} weight="duotone" className={s.color} />
              </div>
            </div>
            <p className={cn('mt-2 text-2xl font-bold tracking-tight', s.highlight ? s.color : '')}>
              {loading ? '—' : s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Shortcuts — Stripe-style row */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">Shortcuts</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { to: '/orders', label: 'Orders', icon: ShoppingBag, color: 'text-primary' },
            { to: '/picking', label: 'Pick Lists', icon: ListChecks, color: 'text-violet-500' },
            { to: '/shipping', label: 'Shipping', icon: TruckTrailer, color: 'text-emerald-500' },
            { to: '/receiving', label: 'Receiving', icon: Package, color: 'text-amber-500' },
            { to: '/warehouse', label: 'Warehouse', icon: Warehouse, color: 'text-blue-500' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3.5 py-2.5 text-sm font-medium transition-colors hover:border-border hover:bg-muted/50"
            >
              <a.icon size={16} weight="duotone" className={a.color} />
              {a.label}
              <CaretRight size={12} className="ml-auto text-muted-foreground/40" />
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
            {recentOrders.length === 0 && !loading ? (
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
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex cursor-pointer items-center gap-3 border-b border-border/40 px-5 py-3 last:border-b-0 transition-colors hover:bg-muted/40"
                  >
                    <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', colors.dot)} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold">#{order.orderNumber}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{order.customerName}</span>
                    </div>
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
            <Link
              to="/warehouse/guide"
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
            >
              <Warehouse size={20} weight="duotone" className="mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Warehouse Setup Guide</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Learn about zones, aisles, racks, and shelf locations.</p>
              </div>
            </Link>
            <Link
              to="/docs"
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
            >
              <ChartLineUp size={20} weight="duotone" className="mt-0.5 flex-shrink-0 text-violet-500" />
              <div>
                <p className="text-sm font-semibold">Help Center</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Browse all help topics, guides, and documentation.</p>
              </div>
            </Link>
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Storefront size={16} weight="duotone" className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{storeCount ?? '—'} store{storeCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">connected</p>
                </div>
                <Link to="/settings" className="text-primary hover:text-primary/80">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <ClockCountdown size={16} weight="duotone" className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{stats.pending} order{stats.pending !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">awaiting fulfillment</p>
                </div>
                <Link to="/orders" className="text-primary hover:text-primary/80">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
