import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersThree,
  Plus,
  MagnifyingGlass,
  CaretRight,
  X,
  CircleNotch,
  Package,
  ClipboardText,
  CheckCircle,
  Envelope,
  Phone,
  GlobeSimple,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import Pagination from '../components/Pagination';
import TableConfigDropdown from '../components/TableConfigDropdown';
import { useTableConfig } from '../hooks/useTableConfig';
import type { Supplier, PaginationMeta, TableColumnDef } from '../types';

const supplierColumnDefs: TableColumnDef[] = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'contact', label: 'Contact' },
  { id: 'products', label: 'Products' },
  { id: 'pos', label: 'POs' },
  { id: 'status', label: 'Status' },
  { id: 'website', label: 'Website', defaultVisible: false },
  { id: 'address', label: 'Address', defaultVisible: false },
];

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { visibleIds, toggleColumn, isVisible } = useTableConfig('supplierColumns', supplierColumnDefs);

  // Stats
  const [stats, setStats] = useState<{ total: number; active: number; totalProducts: number; totalPOs: number } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', website: '', notes: '' });

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/suppliers', { params: { limit: 1000 } });
      const all: Supplier[] = data.data;
      const active = all.filter((s) => s.isActive).length;
      const totalProducts = all.reduce((sum, s) => sum + (s._count?.supplierProducts ?? 0), 0);
      const totalPOs = all.reduce((sum, s) => sum + (s._count?.purchaseOrders ?? 0), 0);
      setStats({ total: all.length, active, totalProducts, totalPOs });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => { loadSuppliers(); }, [search, page, statusFilter]);
  useEffect(() => { loadStats(); }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (search) params.search = search;
      if (statusFilter === 'active') params.isActive = 'true';
      if (statusFilter === 'inactive') params.isActive = 'false';
      const { data } = await api.get('/suppliers', { params });
      setSuppliers(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setModalError('Supplier name is required.');
      return;
    }
    try {
      setSaving(true);
      setModalError('');
      const { data } = await api.post('/suppliers', {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', address: '', website: '', notes: '' });
      navigate(`/suppliers/${data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(msg || 'Failed to create supplier.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <UsersThree size={20} weight="duotone" className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Suppliers</h2>
            <p className="text-[13px] text-muted-foreground">
              {stats ? `${stats.total} supplier${stats.total !== 1 ? 's' : ''}` : 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus size={14} weight="bold" />
          Add Supplier
        </button>
      </div>

      {/* Stat Strip */}
      {stats && (
        <div className="grid grid-cols-4 divide-x divide-border/50 rounded-xl border border-border/60 bg-card shadow-sm">
          {[
            { label: 'Total Suppliers', value: stats.total, icon: UsersThree, color: 'text-foreground', iconColor: 'text-violet-500' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: stats.active > 0 ? 'text-emerald-600' : 'text-foreground', iconColor: 'text-emerald-500' },
            { label: 'Products Linked', value: stats.totalProducts, icon: Package, color: 'text-foreground', iconColor: 'text-blue-500' },
            { label: 'Purchase Orders', value: stats.totalPOs, icon: ClipboardText, color: 'text-foreground', iconColor: 'text-amber-500' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3.5">
              <s.icon size={18} weight="duotone" className={s.iconColor} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className={cn('text-lg font-bold tracking-tight', s.color)}>{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-0.5 shadow-sm">
          {([
            { key: 'all' as const, label: 'All' },
            { key: 'active' as const, label: 'Active' },
            { key: 'inactive' as const, label: 'Inactive' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                statusFilter === key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <TableConfigDropdown columns={supplierColumnDefs} visibleIds={visibleIds} onToggle={toggleColumn} />
        {meta && meta.total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} result{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40">
              {isVisible('supplier') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Supplier</th>}
              {isVisible('contact') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Contact</th>}
              {isVisible('products') && <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Products</th>}
              {isVisible('pos') && <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">POs</th>}
              {isVisible('status') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>}
              {isVisible('website') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Website</th>}
              {isVisible('address') && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Address</th>}
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && suppliers.length === 0 ? (
              <tr>
                <td colSpan={visibleIds.length + 1} className="py-20 text-center">
                  <CircleNotch size={24} className="mx-auto animate-spin text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground/50">Loading suppliers...</p>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={visibleIds.length + 1} className="py-20 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <UsersThree size={24} weight="duotone" className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No suppliers found</p>
                  <p className="mt-1 text-xs text-muted-foreground/50">Add your first supplier to start managing your supply chain.</p>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/suppliers/${s.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-muted/30"
                >
                  {isVisible('supplier') && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-bold text-violet-600">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  {isVisible('contact') && (
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5">
                            <Envelope size={11} className="text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">{s.phone}</span>
                          </div>
                        )}
                        {!s.email && !s.phone && (
                          <span className="text-xs text-muted-foreground/30">&mdash;</span>
                        )}
                      </div>
                    </td>
                  )}
                  {isVisible('products') && (
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        'text-sm font-semibold tabular-nums',
                        (s._count?.supplierProducts ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground/40'
                      )}>
                        {s._count?.supplierProducts ?? 0}
                      </span>
                    </td>
                  )}
                  {isVisible('pos') && (
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        'text-sm font-semibold tabular-nums',
                        (s._count?.purchaseOrders ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground/40'
                      )}>
                        {s._count?.purchaseOrders ?? 0}
                      </span>
                    </td>
                  )}
                  {isVisible('status') && (
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                        s.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', s.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  )}
                  {isVisible('website') && (
                    <td className="px-5 py-3.5">
                      {s.website ? (
                        <a
                          href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <GlobeSimple size={11} />
                          {s.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">&mdash;</span>
                      )}
                    </td>
                  )}
                  {isVisible('address') && (
                    <td className="px-5 py-3.5">
                      {s.address ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{s.address}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">&mdash;</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <CaretRight size={14} className="text-muted-foreground/20 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      {/* Create Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <UsersThree size={18} weight="bold" className="text-violet-600" />
                <h3 className="text-base font-semibold">Add Supplier</h3>
              </div>
              <button
                onClick={() => { setShowModal(false); setModalError(''); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {modalError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">{modalError}</div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Supplier name"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://supplier.com"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, Country"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
              <button
                onClick={() => { setShowModal(false); setModalError(''); }}
                className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <CircleNotch size={14} className="animate-spin" />}
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
