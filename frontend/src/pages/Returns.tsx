import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUUpLeft,
  Plus,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  DownloadSimple,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import CsvExportModal from '../components/CsvExportModal';
import Pagination from '../components/Pagination';
import type { ReturnOrder, PaginationMeta } from '../types';

const rmaStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  REQUESTED: { label: 'Requested', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  AUTHORIZED: { label: 'Authorized', bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  RECEIVING: { label: 'Receiving', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const filterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'AUTHORIZED', label: 'Authorized' },
  { value: 'RECEIVING', label: 'Receiving' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Returns() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    loadReturns();
  }, [filter, search, page]);

  async function loadReturns() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/returns', { params });
      setReturns(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load returns:', err);
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
            <ArrowUUpLeft size={20} weight="duotone" className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Returns</h2>
            <p className="text-[13px] text-muted-foreground">
              {meta ? `${meta.total} return${meta.total !== 1 ? 's' : ''}` : 'Process return merchandise authorizations.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
          >
            <DownloadSimple size={15} weight="bold" />
            Export
          </button>
          <button
            onClick={() => navigate('/returns/new')}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus size={14} weight="bold" />
            New Return
          </button>
        </div>
      </div>

      {/* Filters Bar */}
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
            placeholder="Search RMA#, order#, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {meta && meta.total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} return{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">RMA #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Order #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Customer</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Items</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Refund</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Created</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {returns.map((rma) => {
              const status = rmaStatusConfig[rma.status] || rmaStatusConfig.REQUESTED;
              const itemCount = rma._count?.items ?? rma.items?.length ?? 0;
              const totalQty = rma.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

              return (
                <tr
                  key={rma.id}
                  onClick={() => navigate(`/returns/${rma.rmaNumber}`)}
                  className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-teal-500 hover:bg-teal-500/[0.03]"
                >
                  <td className="px-5 py-3.5 text-sm font-semibold">{rma.rmaNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{rma.orderNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{rma.customerName}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}{totalQty > 0 ? ` (${totalQty} pcs)` : ''}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium tabular-nums">
                    {rma.refundAmount ? `$${parseFloat(rma.refundAmount).toFixed(2)}` : <span className="text-muted-foreground/40">&mdash;</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(rma.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {returns.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <ArrowUUpLeft size={24} weight="duotone" className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No returns yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Create your first return to start processing RMAs.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <CsvExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Returns"
        columns={[
          { key: 'rmaNumber', label: 'RMA #' },
          { key: 'status', label: 'Status' },
          { key: 'orderNumber', label: 'Order #' },
          { key: 'customerName', label: 'Customer' },
          { key: 'itemsCount', label: 'Items Count' },
          { key: 'totalQty', label: 'Total Qty' },
          { key: 'receivedQty', label: 'Received Qty' },
          { key: 'refundAmount', label: 'Refund Amount' },
          { key: 'reason', label: 'Reason' },
          { key: 'createdAt', label: 'Created At' },
        ]}
        endpoint="/returns/export"
        filename="returns-export.csv"
      />
    </div>
  );
}
