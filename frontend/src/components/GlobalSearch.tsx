import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  ShoppingBag,
  Cube,
  ClipboardText,
  UsersThree,
  X,
  CircleNotch,
  ImageSquare,
  ArrowRight,
  Clock,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResults {
  orders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    status: string;
    wooCreatedAt: string;
    shipments?: Array<{ trackingNumber: string }>;
  }>;
  products: Array<{
    id: number;
    name: string;
    sku: string | null;
    stockQty: number;
    reservedQty: number;
    imageUrl: string | null;
  }>;
  purchaseOrders: Array<{
    id: number;
    poNumber: string;
    supplier: string;
    status: string;
    supplierRef?: { name: string } | null;
  }>;
  suppliers: Array<{
    id: number;
    name: string;
    email: string | null;
  }>;
}

const RECENT_KEY = 'pickNPack_recentSearches';

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch {
    return [];
  }
}

function addRecent(q: string) {
  const recent = getRecent().filter((r) => r !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

const statusBadge: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  ON_HOLD: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  PICKING: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  PACKED: { bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
  SHIPPED: { bg: 'bg-sky-500/10', text: 'text-sky-600' },
  DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-600' },
  DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  ORDERED: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PARTIALLY_RECEIVED: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  RECEIVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
};

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultItemsRef = useRef<Array<{ type: string; id: number }>>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setActiveIndex(-1);
      setRecentSearches(getRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      resultItemsRef.current = [];
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/search', { params: { q: query } });
        setResults(data.data);
        setActiveIndex(-1);

        // Build flat list of navigable items
        const items: Array<{ type: string; id: number }> = [];
        data.data.orders?.forEach((o: { id: number }) => items.push({ type: 'order', id: o.id }));
        data.data.products?.forEach((p: { id: number }) => items.push({ type: 'product', id: p.id }));
        data.data.purchaseOrders?.forEach((po: { id: number }) => items.push({ type: 'po', id: po.id }));
        data.data.suppliers?.forEach((s: { id: number }) => items.push({ type: 'supplier', id: s.id }));
        resultItemsRef.current = items;
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback((type: string, id: number) => {
    if (query.length >= 2) addRecent(query);
    onClose();
    const paths: Record<string, string> = {
      order: `/orders/${id}`,
      product: `/inventory/${id}`,
      po: `/receiving/${id}`,
      supplier: `/suppliers/${id}`,
    };
    navigate(paths[type] || '/');
  }, [navigate, onClose, query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = resultItemsRef.current;

    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      navigateTo(items[activeIndex].type, items[activeIndex].id);
    }
  }

  function getItemIndex(type: string, id: number): number {
    return resultItemsRef.current.findIndex((i) => i.type === type && i.id === id);
  }

  if (!open) return null;

  const hasResults = results && (results.orders.length > 0 || results.products.length > 0 || results.purchaseOrders.length > 0 || results.suppliers.length > 0);
  const noResults = results && !hasResults && query.length >= 2;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl mx-4 rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4">
          <MagnifyingGlass size={18} className="flex-shrink-0 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search orders, products, POs, suppliers..."
            className="h-12 flex-1 bg-transparent text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none"
          />
          {loading && <CircleNotch size={16} className="animate-spin text-muted-foreground" />}
          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/60 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">ESC</kbd>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Recent searches (when no query) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Recent</p>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  onClick={() => setQuery(recent)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  <Clock size={14} className="flex-shrink-0" />
                  <span>{recent}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {hasResults && (
            <div className="p-2">
              {/* Orders */}
              {results!.orders.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Orders</p>
                  {results!.orders.map((order) => {
                    const idx = getItemIndex('order', order.id);
                    const badge = statusBadge[order.status] || statusBadge.PENDING;
                    return (
                      <button
                        key={order.id}
                        onClick={() => navigateTo('order', order.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        <ShoppingBag size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <span className="font-semibold">#{order.orderNumber}</span>
                        <span className="text-muted-foreground">{order.customerName}</span>
                        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', badge.bg, badge.text)}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={12} className="flex-shrink-0 text-muted-foreground/30" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Products */}
              {results!.products.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Products</p>
                  {results!.products.map((product) => {
                    const idx = getItemIndex('product', product.id);
                    const avail = product.stockQty - product.reservedQty;
                    return (
                      <button
                        key={product.id}
                        onClick={() => navigateTo('product', product.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        {product.imageUrl ? (
                          <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/20">
                            <img src={proxyUrl(product.imageUrl, 56)!} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/30">
                            <ImageSquare size={12} weight="duotone" className="text-muted-foreground/25" />
                          </div>
                        )}
                        <span className="font-medium truncate">{product.name}</span>
                        {product.sku && (
                          <code className="flex-shrink-0 rounded bg-muted/50 px-1 py-px text-[10px] font-medium text-muted-foreground">{product.sku}</code>
                        )}
                        <span className={cn(
                          'ml-auto flex-shrink-0 text-xs font-semibold tabular-nums',
                          avail <= 0 ? 'text-red-500' : 'text-emerald-600'
                        )}>
                          {avail} avail
                        </span>
                        <ArrowRight size={12} className="flex-shrink-0 text-muted-foreground/30" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Purchase Orders */}
              {results!.purchaseOrders.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Purchase Orders</p>
                  {results!.purchaseOrders.map((po) => {
                    const idx = getItemIndex('po', po.id);
                    const badge = statusBadge[po.status] || statusBadge.DRAFT;
                    return (
                      <button
                        key={po.id}
                        onClick={() => navigateTo('po', po.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        <ClipboardText size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <span className="font-semibold">{po.poNumber}</span>
                        <span className="text-muted-foreground">{po.supplierRef?.name || po.supplier}</span>
                        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', badge.bg, badge.text)}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={12} className="flex-shrink-0 text-muted-foreground/30" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Suppliers */}
              {results!.suppliers.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Suppliers</p>
                  {results!.suppliers.map((supplier) => {
                    const idx = getItemIndex('supplier', supplier.id);
                    return (
                      <button
                        key={supplier.id}
                        onClick={() => navigateTo('supplier', supplier.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        <UsersThree size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.email && <span className="text-muted-foreground">{supplier.email}</span>}
                        <ArrowRight size={12} className="ml-auto flex-shrink-0 text-muted-foreground/30" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="px-4 py-10 text-center">
              <MagnifyingGlass size={24} className="mx-auto text-muted-foreground/20" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No results found</p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Try searching by order number, product name, SKU, barcode, tracking number, or supplier name
              </p>
            </div>
          )}

          {/* Initial state */}
          {!query && recentSearches.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground/50">
                Search across orders, products, purchase orders, and suppliers
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border/50 px-4 py-2.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <kbd className="inline-flex h-4 items-center rounded border border-border/40 bg-muted/30 px-1 text-[9px]">&uarr;</kbd>
            <kbd className="inline-flex h-4 items-center rounded border border-border/40 bg-muted/30 px-1 text-[9px]">&darr;</kbd>
            <span className="ml-0.5">navigate</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <kbd className="inline-flex h-4 items-center rounded border border-border/40 bg-muted/30 px-1 text-[9px]">&crarr;</kbd>
            <span className="ml-0.5">select</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <kbd className="inline-flex h-4 items-center rounded border border-border/40 bg-muted/30 px-1 text-[9px]">esc</kbd>
            <span className="ml-0.5">close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
