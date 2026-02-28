import { useEffect, useState } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowDownToLine,
  CircleCheck,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Product, InventoryStats } from '../types';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search]);

  async function loadStats() {
    try {
      const { data } = await api.get('/inventory/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/inventory', { params });
      setProducts(data.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setSyncMessage('');
      const { data } = await api.post('/inventory/sync');
      setSyncMessage(data.data.message);
      // Refresh data after sync
      await Promise.all([loadProducts(), loadStats()]);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  }

  const statCards = stats ? [
    { label: 'In Stock', value: stats.inStock, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'Reserved', value: stats.reserved, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Incoming', value: stats.incoming, icon: ArrowDownToLine, color: 'text-violet-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Free to Sell', value: stats.freeToSell, icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
            <Package className="h-5.5 w-5.5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Track stock levels and manage your products.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-xs font-medium text-emerald-600">{syncMessage}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncing ? 'Importing...' : 'Import Products'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={cn(
                  'rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md',
                  card.border
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', card.bg)}>
                    <Icon className={cn('h-4.5 w-4.5', card.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className={cn('text-xl font-bold', card.color)}>
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Stock</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reserved</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {products.map((p) => {
              const available = p.stockQty - p.reservedQty;
              const isLow = available <= p.lowStockThreshold;
              return (
                <tr
                  key={p.id}
                  className="border-l-4 border-l-transparent transition-all hover:border-l-emerald-500 hover:bg-emerald-500/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium">
                      {p.sku || '—'}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium">{p.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.stockQty}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.reservedQty}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-semibold',
                      isLow ? 'text-red-500' : 'text-emerald-600'
                    )}>
                      {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
                      {available}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {p.stockLocations?.map((sl) => sl.bin?.label).join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl" />
                    <Package className="relative h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No products found</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Sync from WooCommerce to populate inventory.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
