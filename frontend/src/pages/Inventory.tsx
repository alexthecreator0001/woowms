import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowDownToLine,
  CircleCheck,
  RefreshCw,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import Pagination from '../components/Pagination';
import TableConfigDropdown from '../components/TableConfigDropdown';
import { useTableConfig } from '../hooks/useTableConfig';
import type { Product, InventoryStats, PaginationMeta, TableColumnDef } from '../types';

const inventoryColumnDefs: TableColumnDef[] = [
  { id: 'image', label: 'Image' },
  { id: 'product', label: 'Product' },
  { id: 'price', label: 'Price' },
  { id: 'inStock', label: 'In Stock' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'available', label: 'Available' },
  { id: 'location', label: 'Location' },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const { visibleIds, toggleColumn, isVisible } = useTableConfig('inventoryColumns', inventoryColumnDefs);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [search, page]);

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
      setSyncMessage('');
      const { data } = await api.post('/inventory/sync');
      setSyncMessage(data.data.message);
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
    { label: 'In Stock', value: stats.inStock, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', gradFrom: 'from-primary/5', gradTo: 'to-blue-500/5' },
    { label: 'Reserved', value: stats.reserved, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradFrom: 'from-amber-500/5', gradTo: 'to-orange-500/5' },
    { label: 'Incoming', value: stats.incoming, icon: ArrowDownToLine, color: 'text-violet-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20', gradFrom: 'from-violet-500/5', gradTo: 'to-purple-500/5' },
    { label: 'Free to Sell', value: stats.freeToSell, icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradFrom: 'from-emerald-500/5', gradTo: 'to-teal-500/5' },
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
            <span className={cn(
              'text-xs font-medium',
              syncMessage.includes('failed') ? 'text-red-500' : 'text-emerald-600'
            )}>{syncMessage}</span>
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
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md',
                  card.border
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', card.gradFrom, card.gradTo)} />
                <div className="relative">
                  <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', card.bg)}>
                    <Icon className={cn('h-5 w-5', card.color)} />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  <p className={cn('mt-0.5 text-3xl font-bold tracking-tight', card.color)}>
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + Count */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {meta && meta.total > 0 && (
          <span className="text-sm text-muted-foreground">{meta.total} product{meta.total !== 1 ? 's' : ''}</span>
        )}
        <div className="ml-auto">
          <TableConfigDropdown columns={inventoryColumnDefs} visibleIds={visibleIds} onToggle={toggleColumn} />
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {isVisible('image') && <th className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" />}
              {isVisible('product') && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>}
              {isVisible('price') && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>}
              {isVisible('inStock') && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Stock</th>}
              {isVisible('reserved') && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reserved</th>}
              {isVisible('available') && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</th>}
              {isVisible('location') && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>}
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {products.map((p) => {
              const available = p.stockQty - p.reservedQty;
              const isLow = available <= p.lowStockThreshold;
              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/inventory/${p.id}`)}
                  className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-emerald-500 hover:bg-emerald-500/[0.03]"
                >
                  {isVisible('image') && (
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                          <img src={proxyUrl(p.imageUrl, 80)!} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </td>
                  )}
                  {isVisible('product') && (
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold leading-tight">{p.name}</p>
                      {p.sku && (
                        <code className="mt-0.5 text-[11px] text-muted-foreground">{p.sku}</code>
                      )}
                    </td>
                  )}
                  {isVisible('price') && (
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{p.currency} {p.price}</span>
                    </td>
                  )}
                  {isVisible('inStock') && (
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold">{p.stockQty}</span>
                    </td>
                  )}
                  {isVisible('reserved') && (
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'text-sm font-medium',
                        p.reservedQty > 0 ? 'text-amber-600' : 'text-muted-foreground'
                      )}>{p.reservedQty}</span>
                    </td>
                  )}
                  {isVisible('available') && (
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-sm font-bold',
                        isLow ? 'text-red-500' : 'text-emerald-600'
                      )}>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
                        {available}
                      </span>
                    </td>
                  )}
                  {isVisible('location') && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {p.stockLocations?.map((sl) => sl.bin?.label).filter(Boolean).join(', ') || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={visibleIds.length + 1} className="px-5 py-16 text-center">
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

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
