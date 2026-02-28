import { useState, useMemo } from 'react';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { Bin } from '../../types';

interface BinListViewProps {
  bins: Bin[];
  onBinClick: (bin: Bin) => void;
}

type SortKey = 'label' | 'row' | 'shelf' | 'position' | 'stock' | 'status';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

export default function BinListView({ bins, onBinClick }: BinListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('label');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...bins];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'label':
          cmp = a.label.localeCompare(b.label);
          break;
        case 'row':
          cmp = (a.row || '').localeCompare(b.row || '');
          break;
        case 'shelf':
          cmp = (a.shelf || '').localeCompare(b.shelf || '');
          break;
        case 'position':
          cmp = (a.position || '').localeCompare(b.position || '');
          break;
        case 'stock':
          cmp = (a._stockCount ?? 0) - (b._stockCount ?? 0);
          break;
        case 'status':
          cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [bins, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <CaretDown size={12} className="text-muted-foreground/30" />;
    return sortDir === 'asc'
      ? <CaretUp size={12} className="text-foreground" />
      : <CaretDown size={12} className="text-foreground" />;
  };

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'label', label: 'Label' },
    { key: 'row', label: 'Aisle' },
    { key: 'shelf', label: 'Shelf' },
    { key: 'position', label: 'Position' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
  ];

  if (bins.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground/60">
        No locations in this zone yet.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {col.label}
                    <SortIcon col={col.key} />
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((bin) => {
              const stockCount = bin._stockCount ?? 0;
              return (
                <tr
                  key={bin.id}
                  className={cn(
                    'border-b border-border/20 transition-colors hover:bg-muted/20 cursor-pointer',
                    !bin.isActive && 'opacity-50',
                  )}
                  onClick={() => onBinClick(bin)}
                >
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">{bin.label}</td>
                  <td className="px-3 py-2 text-muted-foreground">{bin.row || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{bin.shelf || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{bin.position || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={cn('font-semibold', stockCount > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>
                      {stockCount}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {bin.isActive ? (
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onBinClick(bin); }}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    page === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
