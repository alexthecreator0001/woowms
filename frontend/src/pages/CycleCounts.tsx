import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListMagnifyingGlass,
  CalendarBlank,
  Plus,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  User,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import Pagination from '../components/Pagination';
import type { CycleCount, PaginationMeta } from '../types';

const ccStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PLANNED: { label: 'Planned', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'Counting', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  REVIEW: { label: 'Review', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
};

const typeLabels: Record<string, string> = {
  ZONE: 'Zone',
  LOCATION: 'Location',
  PRODUCT: 'Product',
};

const filterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'Counting' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function CycleCounts() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<CycleCount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [filter, search]);

  useEffect(() => {
    loadCounts();
  }, [filter, search, page]);

  async function loadCounts() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/cycle-counts', { params });
      setCounts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load cycle counts:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <ListMagnifyingGlass size={20} weight="duotone" className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Cycle Counts</h2>
            <p className="text-[13px] text-muted-foreground">
              {meta ? `${meta.total} cycle count${meta.total !== 1 ? 's' : ''}` : 'Verify inventory accuracy with scheduled counts.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cycle-counts/new')}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus size={14} weight="bold" />
          New Count
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3.5 pr-8 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <CaretDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative max-w-xs flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search CC# or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {meta && meta.total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} count{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">CC #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Type</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Assigned</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Items</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Planned</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Created</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {counts.map((cc) => {
              const status = ccStatusConfig[cc.status] || ccStatusConfig.PLANNED;
              return (
                <tr
                  key={cc.id}
                  onClick={() => navigate(`/cycle-counts/${cc.id}`)}
                  className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-teal-500 hover:bg-teal-500/[0.03]"
                >
                  <td className="px-5 py-3.5 text-sm font-semibold">{cc.ccNumber}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {typeLabels[cc.type] || cc.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {cc.assignedToName ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User size={14} />
                        {cc.assignedToName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium tabular-nums">
                    {cc._count?.items ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    {cc.plannedDate ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarBlank size={14} />
                        {new Date(cc.plannedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(cc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {counts.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <ListMagnifyingGlass size={24} weight="duotone" className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No cycle counts yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Create your first cycle count to start verifying inventory accuracy.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
