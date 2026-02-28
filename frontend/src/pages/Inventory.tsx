import { useEffect, useState } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Product } from '../types';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [search]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track stock levels and manage your products.
          </p>
        </div>
      </div>

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
                  className="transition-colors hover:bg-muted/30"
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
                  <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
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
