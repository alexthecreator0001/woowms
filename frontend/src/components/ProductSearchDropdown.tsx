import { useEffect, useState, useRef } from 'react';
import { Loader2, ImageIcon, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  stockQty: number;
  reservedQty: number;
  imageUrl: string | null;
}

interface ProductSearchDropdownProps {
  onSelect: (product: Product) => void;
  excludeIds?: number[];
  placeholder?: string;
  autoFocus?: boolean;
}

export default function ProductSearchDropdown({ onSelect, excludeIds = [], placeholder = 'Search products...', autoFocus }: ProductSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/inventory', { params: { search: query, limit: 8 } });
        setResults(data.data as Product[]);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter at render time so excludeIds changes are always reflected
  const filteredResults = results.filter((p) => !excludeIds.includes(p.id));

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredResults[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleSelect(product: Product) {
    onSelect(product);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => filteredResults.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-9 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && filteredResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[320px] overflow-y-auto rounded-lg border border-border/60 bg-card shadow-lg">
          {filteredResults.map((product, index) => {
            const available = product.stockQty - product.reservedQty;
            return (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                  index === activeIndex ? 'bg-primary/8' : 'hover:bg-muted/60'
                )}
              >
                {/* Thumbnail */}
                {product.imageUrl ? (
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/20">
                    <img
                      src={proxyUrl(product.imageUrl, 64)!}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/30">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/25" />
                  </div>
                )}

                {/* Name + SKU */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
                  {product.sku && (
                    <code className="mt-0.5 inline-block rounded bg-muted/50 px-1 py-px text-[10px] font-medium text-muted-foreground">
                      {product.sku}
                    </code>
                  )}
                </div>

                {/* Stock qty */}
                <div className="flex-shrink-0 text-right">
                  <span className={cn(
                    'text-xs font-semibold tabular-nums',
                    available <= 0 ? 'text-red-500' : available <= 5 ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {available}
                  </span>
                  <p className="text-[10px] text-muted-foreground/60">avail</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && !loading && filteredResults.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border/60 bg-card px-4 py-6 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">No products found</p>
          <p className="mt-0.5 text-xs text-muted-foreground/50">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
