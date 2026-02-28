import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  MapPin,
  ArrowUpDown,
  Scale,
  Tag,
  Store,
  AlertTriangle,
  Lock,
  CircleCheck,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Hash,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { ProductDetail as ProductDetailType, StockMovement } from '../types';

const movementTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  PICKED: { label: 'Picked', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  TRANSFERRED: { label: 'Transferred', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  ADJUSTED: { label: 'Adjusted', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  RETURNED: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-600' },
  DAMAGED: { label: 'Damaged', bg: 'bg-red-500/10', text: 'text-red-600' },
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/inventory/${id}`)
      .then(({ data }) => setProduct(data.data))
      .catch((err) => {
        console.error('Failed to load product:', err);
        navigate('/inventory');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) return null;

  const available = product.stockQty - product.reservedQty;
  const isLow = available <= product.lowStockThreshold;

  const stockCards = [
    { label: 'In Stock', value: product.stockQty, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', gradFrom: 'from-primary/5', gradTo: 'to-blue-500/5' },
    { label: 'Reserved', value: product.reservedQty, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradFrom: 'from-amber-500/5', gradTo: 'to-orange-500/5' },
    { label: 'Available', value: available, icon: CircleCheck, color: isLow ? 'text-red-500' : 'text-emerald-600', bg: isLow ? 'bg-red-500/10' : 'bg-emerald-500/10', border: isLow ? 'border-red-500/20' : 'border-emerald-500/20', gradFrom: isLow ? 'from-red-500/5' : 'from-emerald-500/5', gradTo: isLow ? 'to-red-400/5' : 'to-teal-500/5' },
    { label: 'Low Stock Alert', value: product.lowStockThreshold, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', gradFrom: 'from-red-500/5', gradTo: 'to-pink-500/5' },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/inventory')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </button>

        <div className="flex items-start gap-5">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {product.imageUrl ? (
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm">
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 shadow-sm">
                <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Title + Meta */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">{product.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {product.sku && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  {product.sku}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                <Tag className="h-3 w-3" />
                {product.currency} {product.price}
              </span>
              {product.store && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Store className="h-3 w-3" />
                  {product.store.name}
                </span>
              )}
              {!product.isActive && (
                <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stock Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stockCards.map((card) => {
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

      {/* Two-column layout: Details + Locations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Info */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-muted-foreground" />
              Product Information
            </h3>
          </div>
          <div className="divide-y divide-border/40 px-6">
            {product.description && (
              <div className="py-3.5">
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}
            <div className="flex items-center justify-between py-3.5">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-sm font-semibold">{product.currency} {product.price}</span>
            </div>
            {(product.weight || product.length) && (
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Scale className="h-3.5 w-3.5" />
                  Dimensions
                </span>
                <span className="text-sm font-medium">
                  {[
                    product.weight && `${product.weight} kg`,
                    product.length && `${product.length} × ${product.width} × ${product.height} cm`,
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-3.5">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Low Stock Threshold
              </span>
              <span className="text-sm font-semibold text-red-500">{product.lowStockThreshold}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Last Updated
              </span>
              <span className="text-sm font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stock Locations */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Warehouse Locations
              {product.stockLocations && product.stockLocations.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {product.stockLocations.length}
                </span>
              )}
            </h3>
          </div>
          <div className="p-4">
            {product.stockLocations && product.stockLocations.length > 0 ? (
              <div className="space-y-2">
                {product.stockLocations.map((sl) => (
                  <div
                    key={sl.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{sl.bin?.label}</p>
                        {sl.bin?.zone && (
                          <p className="text-xs text-muted-foreground">{sl.bin.zone.name} · {sl.bin.zone.type}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{sl.quantity}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">units</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No locations assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Movements — Full Width */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            Stock Movement History
            {product.stockMovements && product.stockMovements.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {product.stockMovements.length}
              </span>
            )}
          </h3>
        </div>
        {product.stockMovements && product.stockMovements.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {product.stockMovements.map((m: StockMovement) => {
                const mt = movementTypeConfig[m.type] || { label: m.type, bg: 'bg-gray-500/10', text: 'text-gray-500' };
                return (
                  <tr key={m.id} className="border-l-4 border-l-transparent transition-all hover:border-l-emerald-500 hover:bg-emerald-500/[0.02]">
                    <td className="px-6 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', mt.bg, mt.text)}>
                        {mt.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={cn(
                        'text-sm font-bold',
                        m.quantity > 0 ? 'text-emerald-600' : 'text-red-500'
                      )}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{m.fromBin || '—'}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{m.toBin || '—'}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{m.reason || '—'}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center">
            <ArrowUpDown className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No stock movements yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
