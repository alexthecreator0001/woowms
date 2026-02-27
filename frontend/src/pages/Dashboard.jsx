import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  ClipboardList,
  Truck,
  PackageOpen,
  TrendingUp,
  ArrowUpRight,
  Store,
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import api from '../services/api.js';

function StatCard({ icon: Icon, label, value, iconColor, iconBg, valueColor, loading }) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div
        className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-lg', iconBg)}
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold tracking-tight', valueColor)}>
        {loading ? '—' : value}
      </p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, iconColor, iconBg }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg)}>
        <Icon className={cn('h-[18px] w-[18px]', iconColor)} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

const statusColorMap = {
  PENDING: { dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-600' },
  AWAITING_PICK: { dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600' },
  PICKING: { dot: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-600' },
  PICKED: { dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600' },
  PACKING: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600' },
  SHIPPED: { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600' },
  DELIVERED: { dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-600' },
  CANCELLED: { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-600' },
  ON_HOLD: { dot: 'bg-gray-400', badge: 'bg-gray-400/10 text-gray-500' },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, inventory: 0, lowStock: 0 });
  const [storeCount, setStoreCount] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, inventoryRes, storesRes] = await Promise.all([
          api.get('/orders', { params: { limit: 5 } }),
          api.get('/inventory', { params: { limit: 1 } }),
          api.get('/stores'),
        ]);
        const pendingRes = await api.get('/orders', { params: { status: 'PENDING', limit: 1 } });
        setStats({
          orders: ordersRes.data.meta.total,
          pending: pendingRes.data.meta.total,
          inventory: inventoryRes.data.meta.total,
          lowStock: 0,
        });
        setRecentOrders(ordersRes.data.data || []);
        setStoreCount(storesRes.data.data.filter((s) => s.isActive).length);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{greeting()}</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Here's what's happening with your warehouse today.
        </p>
      </div>

      {/* Welcome Banner */}
      {storeCount === 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-white">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <h3 className="relative text-xl font-semibold">Welcome to PickNPack</h3>
          <p className="relative mt-2 max-w-md text-[15px] text-white/60">
            Connect your first WooCommerce store to start syncing orders and managing your warehouse inventory.
          </p>
          <Link
            to="/settings"
            className="relative mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Connect a Store
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.orders.toLocaleString()}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={stats.pending.toLocaleString()}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          valueColor={stats.pending > 0 ? 'text-amber-500' : ''}
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats.inventory.toLocaleString()}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={stats.lowStock}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          valueColor={stats.lowStock > 0 ? 'text-red-500' : ''}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction to="/orders" icon={ShoppingCart} label="View Orders" iconColor="text-primary" iconBg="bg-primary/10" />
        <QuickAction to="/picking" icon={ClipboardList} label="Pick Lists" iconColor="text-violet-500" iconBg="bg-violet-500/10" />
        <QuickAction to="/shipping" icon={Truck} label="Shipping" iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
        <QuickAction to="/receiving" icon={PackageOpen} label="Receiving" iconColor="text-amber-500" iconBg="bg-amber-500/10" />
      </div>

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Orders</h3>
            <Link to="/orders" className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            {recentOrders.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">No orders yet. Connect a store to get started.</p>
              </div>
            ) : (
              recentOrders.map((order) => {
                const colors = statusColorMap[order.status] || statusColorMap.ON_HOLD;
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3.5 border-b border-border/40 px-5 py-3.5 last:border-b-0 transition-colors hover:bg-muted/50"
                  >
                    <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm">
                        <strong className="font-semibold">#{order.orderNumber}</strong>
                        <span className="text-muted-foreground"> — {order.customerName}</span>
                      </span>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', colors.badge)}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <div className="mb-3">
            <h3 className="text-base font-semibold">Quick Stats</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center gap-3.5 border-b border-border/40 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Store className="h-[18px] w-[18px] text-emerald-500" />
              </div>
              <p className="flex-1 text-sm">
                <strong className="font-semibold">{storeCount ?? '—'}</strong> active store{storeCount !== 1 ? 's' : ''} connected
              </p>
              <Link to="/settings" className="text-primary hover:text-primary/80">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-3.5 border-b border-border/40 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-[18px] w-[18px] text-amber-500" />
              </div>
              <p className="flex-1 text-sm">
                <strong className="font-semibold">{stats.pending}</strong> order{stats.pending !== 1 ? 's' : ''} awaiting fulfillment
              </p>
              <Link to="/orders" className="text-primary hover:text-primary/80">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-[18px] w-[18px] text-red-500" />
              </div>
              <p className="flex-1 text-sm">
                <strong className="font-semibold">{stats.lowStock}</strong> product{stats.lowStock !== 1 ? 's' : ''} below threshold
              </p>
              <Link to="/inventory" className="text-primary hover:text-primary/80">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
