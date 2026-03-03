import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CalendarBlank,
  Plus,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  Cube,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { proxyUrl } from '../lib/image';
import Pagination from '../components/Pagination';
import type { PurchaseOrder, PaginationMeta } from '../types';

const poStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
};

const filterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const MAX_THUMBS = 3;

export default function Receiving() {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    loadPOs();
  }, [filter, search, page]);

  async function loadPOs() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/receiving', { params });
      setPurchaseOrders(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load POs:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Package size={20} weight="duotone" className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Receiving</h2>
            <p className="text-[13px] text-muted-foreground">
              {meta ? `${meta.total} purchase order${meta.total !== 1 ? 's' : ''}` : 'Track inbound shipments and purchase orders.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/receiving/new')}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus size={14} weight="bold" />
          Create Purchase Order
        </button>
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
            placeholder="Search PO# or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {meta && meta.total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} PO{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">PO #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Supplier</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Items</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total Cost</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expected</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Created</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {purchaseOrders.map((po) => {
              const status = poStatusConfig[po.status] || poStatusConfig.DRAFT;
              const items = po.items || [];
              const totalItems = items.length;
              const receivedItems = items.filter((i) => i.receivedQty >= i.orderedQty).length;
              const totalCost = items.reduce((sum, i) => {
                if (!i.unitCost) return sum;
                return sum + parseFloat(i.unitCost) * i.orderedQty;
              }, 0);

              return (
                <tr
                  key={po.id}
                  onClick={() => navigate(`/receiving/${po.poNumber}`)}
                  className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-amber-500 hover:bg-amber-500/[0.03]"
                >
                  <td className="px-5 py-3.5 text-sm font-semibold">{po.poNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{po.supplier}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', status.bg, status.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {/* Thumbnails */}
                      <div className="flex items-center -space-x-1.5">
                        {items.slice(0, MAX_THUMBS).map((item, idx) => {
                          const src = proxyUrl(item.imageUrl, 64);
                          return src ? (
                            <img
                              key={idx}
                              src={src}
                              alt=""
                              className="h-7 w-7 rounded-md border-2 border-card ring-1 ring-border/40 object-cover"
                            />
                          ) : (
                            <div key={idx} className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-card bg-muted/50">
                              <Cube size={12} className="text-muted-foreground/30" />
                            </div>
                          );
                        })}
                        {totalItems > MAX_THUMBS && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                            +{totalItems - MAX_THUMBS}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {receivedItems}/{totalItems}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium tabular-nums">
                    {totalCost > 0 ? `$${totalCost.toFixed(2)}` : <span className="text-muted-foreground/40">&mdash;</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {po.expectedDate ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarBlank size={14} />
                        {new Date(po.expectedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
            {purchaseOrders.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <Package size={24} weight="duotone" className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No purchase orders yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Create your first purchase order to start tracking inbound inventory.</p>
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
