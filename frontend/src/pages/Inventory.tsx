import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cube,
  MagnifyingGlass,
  ArrowsClockwise,
  CircleNotch,
  Package,
  WarningCircle,
  CaretRight,
  ArrowDown,
  Lock,
  CheckCircle,
  ImageSquare,
  MapPin,
  CaretUpDown,
  CaretUp,
  CaretDown as CaretDownIcon,
  X,
  Info,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import Pagination from '../components/Pagination';
import type { Product, InventoryStats, PaginationMeta } from '../types';

type StockFilter = 'all' | 'low' | 'out' | 'healthy';
type SortField = 'name' | 'sku' | 'price' | 'stock' | 'reserved';
type SortOrder = 'asc' | 'desc';
type SyncMode = 'add_only' | 'update_only' | 'add_and_update';

interface FilterCounts {
  total: number;
  outOfStock: number;
  lowStock: number;
  inStock: number;
}

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
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Server-side filter counts
  const [filterCounts, setFilterCounts] = useState<FilterCounts | null>(null);

  // Sync modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncMode, setSyncMode] = useState<SyncMode>('add_and_update');
  const [importStock, setImportStock] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncPhase, setSyncPhase] = useState('');
  const [syncBgNotice, setSyncBgNotice] = useState(false);

  const loadFilterCounts = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory/filter-counts');
      setFilterCounts(data.data);
    } catch (err) {
      console.error('Failed to load filter counts:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadStats();
    loadFilterCounts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [search, page, stockFilter, sortField, sortOrder]);

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
      const params: Record<string, string | number> = { limit: 25, page, sort: sortField, order: sortOrder };
      if (search) params.search = search;
      if (stockFilter !== 'all') params.stockFilter = stockFilter;
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
      setSyncResult(null);
      setSyncProgress(0);
      setSyncPhase('Starting...');
      setSyncBgNotice(false);

      const { data } = await api.post('/inventory/sync', { mode: syncMode, importStock });
      const jobId = data.data.jobId;
      setSyncJobId(jobId);

      // Poll for progress
      const poll = setInterval(async () => {
        try {
          const { data: status } = await api.get(`/inventory/sync-status/${jobId}`);
          const job = status.data;
          setSyncProgress(job.progress || 0);
          setSyncPhase(job.phase || '');

          if (job.status === 'complete') {
            clearInterval(poll);
            setSyncResult({ added: job.added, updated: job.updated, skipped: job.skipped });
            setSyncing(false);
            setSyncJobId(null);
            await Promise.all([loadProducts(), loadStats(), loadFilterCounts()]);
          } else if (job.status === 'error') {
            clearInterval(poll);
            setSyncPhase(job.error || 'Sync failed');
            setSyncing(false);
            setSyncJobId(null);
          }
        } catch {
          clearInterval(poll);
          setSyncing(false);
          setSyncJobId(null);
        }
      }, 800);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncing(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <CaretUpDown size={12} className="text-muted-foreground/30" />;
    return sortOrder === 'asc'
      ? <CaretUp size={12} weight="bold" className="text-foreground" />
      : <CaretDownIcon size={12} weight="bold" className="text-foreground" />;
  }

  function getStockLevel(product: Product) {
    const available = product.stockQty - product.reservedQty;
    if (product.stockQty <= 0) return { level: 'out' as const, color: 'text-red-600', bg: 'bg-red-500', barBg: 'bg-red-100', label: 'Out of stock', pct: 0 };
    if (available <= product.lowStockThreshold) return { level: 'low' as const, color: 'text-amber-600', bg: 'bg-amber-500', barBg: 'bg-amber-100', label: 'Low stock', pct: Math.min((available / Math.max(product.lowStockThreshold * 3, 1)) * 100, 100) };
    return { level: 'healthy' as const, color: 'text-emerald-600', bg: 'bg-emerald-500', barBg: 'bg-emerald-100', label: 'In stock', pct: Math.min((available / Math.max(product.lowStockThreshold * 3, 1)) * 100, 100) };
  }

  return (
    <div className="space-y-5">
      {/* Background sync banner */}
      {syncing && !showSyncModal && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CircleNotch size={16} className="animate-spin text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-primary">{syncPhase}</p>
              <span className="text-xs font-bold tabular-nums text-primary">{syncProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${syncProgress}%` }} />
            </div>
          </div>
        </div>
      )}

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
            onClick={() => { setShowSyncModal(true); setSyncResult(null); }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <ArrowsClockwise size={15} weight="bold" />
            Sync Products
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
            placeholder="Search products, SKUs, barcodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-0.5 shadow-sm">
          {([
            { key: 'all' as const, label: 'All', count: filterCounts?.total },
            { key: 'low' as const, label: 'Low Stock', count: filterCounts?.lowStock },
            { key: 'out' as const, label: 'Out of Stock', count: filterCounts?.outOfStock },
            { key: 'healthy' as const, label: 'In Stock', count: filterCounts?.inStock },
          ] as const).map(({ key, label, count }) => (
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
              {count !== undefined && count > 0 && key !== 'all' && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  stockFilter === key
                    ? 'bg-background/20 text-background'
                    : key === 'out' ? 'bg-red-500/10 text-red-600' : key === 'low' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {meta ? `${meta.total} result${meta.total !== 1 ? 's' : ''}` : ''}
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="w-[52px] py-2.5 pl-4 pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70" />
              <th
                className="cursor-pointer px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                <span className="inline-flex items-center gap-1">Product <SortIcon field="name" /></span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={() => handleSort('sku')}
              >
                <span className="inline-flex items-center gap-1">SKU <SortIcon field="sku" /></span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={() => handleSort('price')}
              >
                <span className="inline-flex items-center gap-1 justify-end">Price <SortIcon field="price" /></span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={() => handleSort('stock')}
              >
                <span className="inline-flex items-center gap-1 justify-center">On Hand <SortIcon field="stock" /></span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                onClick={() => handleSort('reserved')}
              >
                <span className="inline-flex items-center gap-1 justify-center">Reserved <SortIcon field="reserved" /></span>
              </th>
              <th className="w-[180px] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Available</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Location</th>
              <th className="w-8 py-2.5 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <CircleNotch size={24} className="mx-auto animate-spin text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground/50">Loading inventory...</p>
                </td>
              </tr>
            ) : products.length === 0 ? (
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
              products.map((product) => {
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

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <ArrowsClockwise size={18} weight="bold" className="text-primary" />
                <h3 className="text-base font-semibold">Sync Products</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Sync Mode */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sync Mode
                </label>
                <div className="space-y-2">
                  {([
                    { value: 'add_and_update' as SyncMode, label: 'Add new + Update existing', desc: 'Import new products and update existing ones' },
                    { value: 'add_only' as SyncMode, label: 'Add new products only', desc: 'Only import products not yet in the system' },
                    { value: 'update_only' as SyncMode, label: 'Update existing only', desc: 'Only update products already imported' },
                  ]).map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all',
                        syncMode === opt.value
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/60 hover:border-border hover:bg-muted/20'
                      )}
                    >
                      <input
                        type="radio"
                        name="syncMode"
                        value={opt.value}
                        checked={syncMode === opt.value}
                        onChange={() => setSyncMode(opt.value)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Import */}
              <div>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all',
                    importStock
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-border/60 hover:border-border hover:bg-muted/20'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={importStock}
                    onChange={(e) => setImportStock(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">Import stock quantities from WooCommerce</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      When enabled, your local stock levels will be overwritten with WooCommerce values
                    </p>
                  </div>
                </label>
                {importStock && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
                    <Info size={14} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      This will overwrite any manual stock adjustments you've made in PickNPack.
                    </p>
                  </div>
                )}
              </div>

              {/* Sync Progress */}
              {syncing && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-primary">{syncPhase}</p>
                    <span className="text-xs font-bold tabular-nums text-primary">{syncProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    You can close this dialog — sync will continue in the background.
                  </p>
                </div>
              )}

              {/* Sync Result */}
              {syncResult && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-700">Sync complete</p>
                  <div className="mt-1.5 flex items-center gap-4 text-xs text-emerald-600">
                    <span>{syncResult.added} added</span>
                    <span>{syncResult.updated} updated</span>
                    <span>{syncResult.skipped} skipped</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
              <button
                onClick={() => {
                  if (syncing) setSyncBgNotice(true);
                  setShowSyncModal(false);
                }}
                className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {syncResult ? 'Close' : syncing ? 'Run in Background' : 'Cancel'}
              </button>
              {!syncing && (
                <button
                  onClick={handleSync}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  <ArrowsClockwise size={14} weight="bold" />
                  {syncResult ? 'Sync Again' : 'Start Sync'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
