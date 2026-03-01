import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cube,
  MagnifyingGlass,
  ArrowsClockwise,
  CircleNotch,
  Package,
  WarningCircle,
  CaretRight,
  Funnel,
  ArrowDown,
  Lock,
  CheckCircle,
  ImageSquare,
  MapPin,
  Export,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import Pagination from '../components/Pagination';
import type { Product, InventoryStats, PaginationMeta } from '../types';

type StockFilter = 'all' | 'low' | 'out' | 'healthy';

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [search, page, stockFilter]);

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
      const params: Record<string, string | number> = { limit: 25, page };
      if (search) params.search = search;
      if (stockFilter === 'low') params.lowStock = 'true';
      const { data } = await api.get('/inventory', { params });
      setProducts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await api.post('/inventory/sync');
      await Promise.all([loadProducts(), loadStats()]);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }

  // Client-side filter for out-of-stock and healthy (API doesn't support these directly)
  const filteredProducts = useMemo(() => {
    if (stockFilter === 'out') return products.filter((p) => p.stockQty <= 0);
    if (stockFilter === 'healthy') return products.filter((p) => (p.stockQty - p.reservedQty) > p.lowStockThreshold);
    return products;
  }, [products, stockFilter]);

  function getStockLevel(product: Product) {
    const available = product.stockQty - product.reservedQty;
    if (product.stockQty <= 0) return { level: 'out' as const, color: 'text-red-600', bg: 'bg-red-500', barBg: 'bg-red-100', label: 'Out of stock', pct: 0 };
    if (available <= product.lowStockThreshold) return { level: 'low' as const, color: 'text-amber-600', bg: 'bg-amber-500', barBg: 'bg-amber-100', label: 'Low stock', pct: Math.min((available / Math.max(product.lowStockThreshold * 3, 1)) * 100, 100) };
    return { level: 'healthy' as const, color: 'text-emerald-600', bg: 'bg-emerald-500', barBg: 'bg-emerald-100', label: 'In stock', pct: Math.min((available / Math.max(product.lowStockThreshold * 3, 1)) * 100, 100) };
  }

  const filterCounts = useMemo(() => {
    const all = products.length;
    const out = products.filter((p) => p.stockQty <= 0).length;
    const low = products.filter((p) => {
      const avail = p.stockQty - p.reservedQty;
      return p.stockQty > 0 && avail <= p.lowStockThreshold;
    }).length;
    return { all, out, low, healthy: all - out - low };
  }, [products]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Cube size={20} weight="duotone" className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Inventory</h2>
            <p className="text-[13px] text-muted-foreground">
              {meta ? `${meta.total} product${meta.total !== 1 ? 's' : ''}` : 'Loading...'}
              {stats ? ` \u00b7 ${stats.inStock.toLocaleString()} units in stock` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium shadow-sm transition-all',
              syncing
                ? 'bg-primary/80 text-primary-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {syncing ? (
              <CircleNotch size={15} className="animate-spin" />
            ) : (
              <ArrowsClockwise size={15} weight="bold" />
            )}
            {syncing ? 'Syncing...' : 'Sync Products'}
          </button>
        </div>
      </div>

      {/* Stat Strip */}
      {stats && (
        <div className="grid grid-cols-4 divide-x divide-border/50 rounded-xl border border-border/60 bg-card shadow-sm">
          {[
            { label: 'In Stock', value: stats.inStock, icon: Package, color: 'text-foreground', iconColor: 'text-emerald-500' },
            { label: 'Reserved', value: stats.reserved, icon: Lock, color: stats.reserved > 0 ? 'text-amber-600' : 'text-foreground', iconColor: 'text-amber-500' },
            { label: 'Incoming', value: stats.incoming, icon: ArrowDown, color: 'text-foreground', iconColor: 'text-blue-500' },
            { label: 'Available', value: stats.freeToSell, icon: CheckCircle, color: 'text-foreground', iconColor: 'text-emerald-500' },
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

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search products or SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-0.5 shadow-sm">
          {([
            { key: 'all' as const, label: 'All' },
            { key: 'low' as const, label: 'Low Stock', count: filterCounts.low },
            { key: 'out' as const, label: 'Out of Stock', count: filterCounts.out },
            { key: 'healthy' as const, label: 'In Stock' },
          ] as const).map(({ key, label, count }: { key: StockFilter; label: string; count?: number }) => (
            <button
              key={key}
              onClick={() => setStockFilter(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                stockFilter === key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  stockFilter === key
                    ? 'bg-background/20 text-background'
                    : key === 'out' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="w-[52px] py-2.5 pl-4 pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70" />
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">SKU</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Price</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">On Hand</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Reserved</th>
              <th className="w-[180px] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Available</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Location</th>
              <th className="w-8 py-2.5 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <CircleNotch size={24} className="mx-auto animate-spin text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground/50">Loading inventory...</p>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <Package size={24} weight="duotone" className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No products found</p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    {search ? 'Try a different search term.' : 'Sync your WooCommerce store to import products.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const available = product.stockQty - product.reservedQty;
                const stock = getStockLevel(product);
                const locations = product.stockLocations?.map((sl) => sl.bin?.label).filter(Boolean) || [];

                return (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/inventory/${product.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    {/* Thumbnail */}
                    <td className="py-2.5 pl-4 pr-2">
                      {product.imageUrl ? (
                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-border/40 bg-muted/20 shadow-sm">
                          <img
                            src={proxyUrl(product.imageUrl, 80)!}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
                          <ImageSquare size={16} weight="duotone" className="text-muted-foreground/25" />
                        </div>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-2.5">
                      {product.sku ? (
                        <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {product.sku}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">&mdash;</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm tabular-nums font-medium">{product.currency} {parseFloat(product.price).toFixed(2)}</span>
                    </td>

                    {/* On Hand */}
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm tabular-nums font-semibold">{product.stockQty}</span>
                    </td>

                    {/* Reserved */}
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        'text-sm tabular-nums font-medium',
                        product.reservedQty > 0 ? 'text-amber-600' : 'text-muted-foreground/40'
                      )}>
                        {product.reservedQty > 0 ? product.reservedQty : '\u2014'}
                      </span>
                    </td>

                    {/* Available — with inline bar */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 min-w-[52px]">
                          {stock.level === 'out' && <WarningCircle size={14} weight="fill" className="text-red-500 flex-shrink-0" />}
                          {stock.level === 'low' && <WarningCircle size={14} weight="fill" className="text-amber-500 flex-shrink-0" />}
                          <span className={cn('text-sm tabular-nums font-bold', stock.color)}>
                            {available}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className={cn('h-1.5 w-full rounded-full', stock.barBg)}>
                            <div
                              className={cn('h-full rounded-full transition-all', stock.bg)}
                              style={{ width: `${Math.max(stock.pct, stock.level === 'out' ? 0 : 4)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-2.5">
                      {locations.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="flex-shrink-0 text-muted-foreground/40" />
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {locations.join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">&mdash;</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="py-2.5 pr-4">
                      <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
