import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  ShoppingBag,
  Cube,
  ClipboardText,
  ListMagnifyingGlass,
  UsersThree,
  X,
  CircleNotch,
  ImageSquare,
  ArrowRight,
  Clock,
  SquaresFour,
  ChartLineUp,
  Buildings,
  ListChecks,
  TruckTrailer,
  Package,
  GearSix,
  Plug,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
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
  cycleCounts: Array<{
    id: number;
    ccNumber: string;
    status: string;
    type: string;
    assignedToName: string | null;
    _count?: { items: number };
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

interface PageEntry {
  path: string;
  label: string;
  description: string;
  keywords: string[];
  icon: PhosphorIcon;
}

const APP_PAGES: PageEntry[] = [
  { path: '/', label: 'Dashboard', description: 'Overview & metrics', keywords: ['dashboard', 'home', 'overview', 'main'], icon: SquaresFour },
  { path: '/analytics', label: 'Analytics', description: 'Charts & reports', keywords: ['analytics', 'reports', 'charts', 'stats', 'statistics'], icon: ChartLineUp },
  { path: '/orders', label: 'Orders', description: 'Manage orders', keywords: ['orders', 'sales', 'fulfillment'], icon: ShoppingBag },
  { path: '/inventory', label: 'Inventory', description: 'Products & stock', keywords: ['inventory', 'products', 'stock', 'sku', 'catalog'], icon: Cube },
  { path: '/warehouse', label: 'Locations', description: 'Warehouses, zones & bins', keywords: ['warehouse', 'locations', 'zones', 'bins', 'storage'], icon: Buildings },
  { path: '/picking', label: 'Picking', description: 'Pick lists & wave picking', keywords: ['picking', 'pick lists', 'wave', 'pack'], icon: ListChecks },
  { path: '/shipping', label: 'Shipping', description: 'Labels & tracking', keywords: ['shipping', 'labels', 'tracking', 'carrier', 'shipments'], icon: TruckTrailer },
  { path: '/receiving', label: 'Purchase Orders', description: 'Inbound stock & POs', keywords: ['purchase orders', 'receiving', 'po', 'inbound', 'purchase'], icon: Package },
  { path: '/receiving/new', label: 'Create Purchase Order', description: 'New PO', keywords: ['new po', 'create po', 'new purchase order', 'create purchase order', 'add po'], icon: Package },
  { path: '/suppliers', label: 'Suppliers', description: 'Manage suppliers', keywords: ['suppliers', 'vendors'], icon: UsersThree },
  { path: '/cycle-counts', label: 'Cycle Counts', description: 'Inventory accuracy counts', keywords: ['cycle count', 'counting', 'inventory accuracy', 'audit', 'variance'], icon: ListMagnifyingGlass },
  { path: '/cycle-counts/new', label: 'New Cycle Count', description: 'Create a new count', keywords: ['new cycle count', 'create cycle count', 'count inventory'], icon: ListMagnifyingGlass },
  { path: '/plugins', label: 'Plugins', description: 'Integrations & extensions', keywords: ['plugins', 'integrations', 'extensions', 'woocommerce', 'connect'], icon: Plug },
  { path: '/settings', label: 'Settings', description: 'App configuration', keywords: ['settings', 'config', 'configuration', 'preferences', 'branding', 'account'], icon: GearSix },
];

function filterPages(q: string): PageEntry[] {
  if (!q || q.length < 1) return [];
  const lower = q.toLowerCase();
  return APP_PAGES.filter(
    (p) =>
      p.label.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.keywords.some((k) => k.includes(lower))
  );
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultItemsRef = useRef<Array<{ type: string; slug: string }>>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setActiveIndex(-1);
      setRecentSearches(getRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Matching pages (instant, client-side)
  const matchedPages = filterPages(query);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      // Build page-only nav items when query is 1 char
      const pageItems = filterPages(query);
      resultItemsRef.current = pageItems.map((p) => ({ type: 'page', slug: p.path }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/search', { params: { q: query } });
        setResults(data.data);
        setActiveIndex(-1);

        // Build flat list of navigable items — pages first, then API results
        const items: Array<{ type: string; slug: string }> = [];
        const pageItems = filterPages(query);
        pageItems.forEach((p) => items.push({ type: 'page', slug: p.path }));
        data.data.orders?.forEach((o: { orderNumber: string }) => items.push({ type: 'order', slug: o.orderNumber }));
        data.data.products?.forEach((p: { id: number; sku?: string }) => items.push({ type: 'product', slug: p.sku || String(p.id) }));
        data.data.purchaseOrders?.forEach((po: { poNumber: string }) => items.push({ type: 'po', slug: po.poNumber }));
        data.data.suppliers?.forEach((s: { id: number }) => items.push({ type: 'supplier', slug: String(s.id) }));
        data.data.cycleCounts?.forEach((cc: { id: number }) => items.push({ type: 'cycleCount', slug: String(cc.id) }));
        resultItemsRef.current = items;
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback((type: string, slug: string) => {
    if (query.length >= 2) addRecent(query);
    onClose();
    if (type === 'page') {
      navigate(slug);
      return;
    }
    const paths: Record<string, string> = {
      order: `/orders/${slug}`,
      product: `/inventory/${slug}`,
      po: `/receiving/${slug}`,
      supplier: `/suppliers/${slug}`,
      cycleCount: `/cycle-counts/${slug}`,
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
      navigateTo(items[activeIndex].type, items[activeIndex].slug);
    }
  }

  function getItemIndex(type: string, slug: string): number {
    return resultItemsRef.current.findIndex((i) => i.type === type && i.slug === slug);
  }

  if (!open) return null;

  const hasApiResults = results && (results.orders.length > 0 || results.products.length > 0 || results.purchaseOrders.length > 0 || results.suppliers.length > 0 || results.cycleCounts?.length > 0);
  const hasResults = hasApiResults || matchedPages.length > 0;
  const noResults = !hasResults && query.length >= 2;

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
            placeholder="Search pages, orders, products, suppliers..."
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
              {/* Pages */}
              {matchedPages.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Pages</p>
                  {matchedPages.map((page) => {
                    const idx = getItemIndex('page', page.path);
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.path}
                        onClick={() => navigateTo('page', page.path)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        <Icon size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <span className="font-medium">{page.label}</span>
                        <span className="text-muted-foreground/50">{page.description}</span>
                        <ArrowRight size={12} className="ml-auto flex-shrink-0 text-muted-foreground/30" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Orders */}
              {results?.orders && results.orders.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Orders</p>
                  {results?.orders.map((order) => {
                    const idx = getItemIndex('order', order.orderNumber);
                    const badge = statusBadge[order.status] || statusBadge.PENDING;
                    return (
                      <button
                        key={order.id}
                        onClick={() => navigateTo('order', order.orderNumber)}
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
              {results?.products && results.products.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Products</p>
                  {results?.products.map((product) => {
                    const slug = product.sku || String(product.id);
                    const idx = getItemIndex('product', slug);
                    const avail = product.stockQty - product.reservedQty;
                    return (
                      <button
                        key={product.id}
                        onClick={() => navigateTo('product', slug)}
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
              {results?.purchaseOrders && results.purchaseOrders.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Purchase Orders</p>
                  {results?.purchaseOrders.map((po) => {
                    const idx = getItemIndex('po', po.poNumber);
                    const badge = statusBadge[po.status] || statusBadge.DRAFT;
                    return (
                      <button
                        key={po.id}
                        onClick={() => navigateTo('po', po.poNumber)}
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
              {results?.suppliers && results.suppliers.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Suppliers</p>
                  {results?.suppliers.map((supplier) => {
                    const idx = getItemIndex('supplier', String(supplier.id));
                    return (
                      <button
                        key={supplier.id}
                        onClick={() => navigateTo('supplier', String(supplier.id))}
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

              {/* Cycle Counts */}
              {results?.cycleCounts && results.cycleCounts.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Cycle Counts</p>
                  {results?.cycleCounts.map((cc) => {
                    const idx = getItemIndex('cycleCount', String(cc.id));
                    const badge = statusBadge[cc.status] || statusBadge.PLANNED;
                    return (
                      <button
                        key={cc.id}
                        onClick={() => navigateTo('cycleCount', String(cc.id))}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/40'
                        )}
                      >
                        <ListMagnifyingGlass size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <span className="font-semibold">{cc.ccNumber}</span>
                        {cc.assignedToName && <span className="text-muted-foreground">{cc.assignedToName}</span>}
                        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', badge.bg, badge.text)}>
                          {cc.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={12} className="flex-shrink-0 text-muted-foreground/30" />
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
                Try searching by page name, order number, product name, SKU, barcode, tracking number, or supplier
              </p>
            </div>
          )}

          {/* Initial state */}
          {!query && recentSearches.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground/50">
                Search pages, orders, products, purchase orders, and suppliers
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
