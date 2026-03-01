import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import Pagination from '../components/Pagination';
import type { Supplier, PaginationMeta } from '../types';

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { loadSuppliers(); }, [search, page]);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 25, page };
      if (search) params.search = search;
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
        notes: form.notes.trim() || undefined,
      });
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      navigate(`/suppliers/${data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(msg || 'Failed to create supplier.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
            <Users className="h-5.5 w-5.5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage suppliers and product sourcing.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Supplier
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {meta && meta.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {meta.total} supplier{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">POs</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {suppliers.map((s) => (
              <tr
                key={s.id}
                onClick={() => navigate(`/suppliers/${s.id}`)}
                className="group cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-violet-500 hover:bg-violet-500/[0.03]"
              >
                <td className="px-5 py-3.5 text-sm font-semibold">{s.name}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.email || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.phone || '—'}</td>
                <td className="px-5 py-3.5 text-center text-sm font-medium">
                  {s._count?.supplierProducts ?? 0}
                </td>
                <td className="px-5 py-3.5 text-center text-sm font-medium">
                  {s._count?.purchaseOrders ?? 0}
                </td>
                <td className="px-5 py-3.5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                    s.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-xl" />
                    <Users className="relative h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No suppliers yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Add your first supplier to start managing your supply chain.</p>
                </td>
              </tr>
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
              <h3 className="text-base font-semibold">Add Supplier</h3>
              <button
                onClick={() => { setShowModal(false); setModalError(''); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
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
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
