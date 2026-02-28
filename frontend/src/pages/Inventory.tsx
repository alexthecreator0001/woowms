import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowDownToLine,
  CircleCheck,
  RefreshCw,
  X,
  MapPin,
  Scale,
  Clock,
  ArrowUpDown,
  Image,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Product, ProductDetail, InventoryStats } from '../types';

const movementTypeConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: 'Received', color: 'text-emerald-600' },
  PICKED: { label: 'Picked', color: 'text-violet-600' },
  TRANSFERRED: { label: 'Transferred', color: 'text-blue-600' },
  ADJUSTED: { label: 'Adjusted', color: 'text-amber-600' },
  RETURNED: { label: 'Returned', color: 'text-orange-600' },
  DAMAGED: { label: 'Damaged', color: 'text-red-600' },
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      await Promise.all([loadProducts(), loadStats()]);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  }

  const openDetail = useCallback(async (productId: number) => {
    try {
      setDetailLoading(true);
      const { data } = await api.get(`/inventory/${productId}`);
      setSelectedProduct(data.data);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedProduct(null);
  }, []);

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
                  onClick={() => openDetail(p.id)}
                  className="cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-emerald-500 hover:bg-emerald-500/[0.03]"
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

      {/* Product Detail Slide-over */}
      {(selectedProduct || detailLoading) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border/60 bg-background shadow-2xl">
            {detailLoading && !selectedProduct ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : selectedProduct ? (
              <>
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Package className="h-[18px] w-[18px] text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold leading-tight">{selectedProduct.name}</h3>
                      {selectedProduct.sku && (
                        <code className="text-xs text-muted-foreground">{selectedProduct.sku}</code>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closeDetail}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-5 p-6">
                    {/* Product Image */}
                    {selectedProduct.imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-border/50">
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="h-48 w-full object-contain bg-muted/20"
                        />
                      </div>
                    )}

                    {/* Stock Overview — 4 mini stat boxes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In Stock</p>
                        <p className="text-lg font-bold text-primary">{selectedProduct.stockQty}</p>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reserved</p>
                        <p className="text-lg font-bold text-amber-600">{selectedProduct.reservedQty}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Available</p>
                        <p className={cn(
                          'text-lg font-bold',
                          (selectedProduct.stockQty - selectedProduct.reservedQty) <= selectedProduct.lowStockThreshold
                            ? 'text-red-500' : 'text-emerald-600'
                        )}>
                          {selectedProduct.stockQty - selectedProduct.reservedQty}
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Low Stock At</p>
                        <p className="text-lg font-bold text-red-500">{selectedProduct.lowStockThreshold}</p>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        Details
                      </div>
                      <div className="space-y-2">
                        {selectedProduct.price && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-medium">${selectedProduct.price}</span>
                          </div>
                        )}
                        {(selectedProduct.weight || selectedProduct.length) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Scale className="h-3 w-3" />
                              Dimensions
                            </span>
                            <span className="font-medium text-xs">
                              {[
                                selectedProduct.weight && `${selectedProduct.weight}kg`,
                                selectedProduct.length && `${selectedProduct.length}×${selectedProduct.width}×${selectedProduct.height}cm`,
                              ].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        )}
                        {selectedProduct.store && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Store</span>
                            <span className="font-medium">{selectedProduct.store.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Locations */}
                    {selectedProduct.stockLocations && selectedProduct.stockLocations.length > 0 && (
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          Locations ({selectedProduct.stockLocations.length})
                        </div>
                        <div className="space-y-1.5">
                          {selectedProduct.stockLocations.map((sl) => (
                            <div key={sl.id} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                              <div>
                                <span className="rounded-md bg-muted/80 px-1.5 py-0.5 text-xs font-medium">{sl.bin?.label}</span>
                                {sl.bin?.zone && (
                                  <span className="ml-2 text-xs text-muted-foreground">{sl.bin.zone.name}</span>
                                )}
                              </div>
                              <span className="text-sm font-semibold">{sl.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Movements */}
                    {selectedProduct.stockMovements && selectedProduct.stockMovements.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          Recent Movements
                        </div>
                        <div className="overflow-hidden rounded-lg border border-border/50">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/30">
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {selectedProduct.stockMovements.map((m) => {
                                const mt = movementTypeConfig[m.type] || { label: m.type, color: 'text-muted-foreground' };
                                return (
                                  <tr key={m.id}>
                                    <td className="px-3 py-2">
                                      <span className={cn('text-xs font-semibold', mt.color)}>{mt.label}</span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={cn('text-xs font-bold', m.quantity > 0 ? 'text-emerald-600' : 'text-red-500')}>
                                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[120px]">
                                      {m.reason || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[11px] text-muted-foreground">
                                      {new Date(m.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
