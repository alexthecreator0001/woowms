import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Pencil,
  X,
  Check,
  Loader2,
  Package,
  Plus,
  Trash2,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Supplier, SupplierProduct, PurchaseOrder, Product } from '../types';

const poStatusStyles: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600' },
};

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<(Supplier & { supplierProducts?: SupplierProduct[]; purchaseOrders?: PurchaseOrder[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Add product mapping modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addForm, setAddForm] = useState({ productId: 0, productName: '', supplierSku: '', supplierPrice: '', leadTimeDays: '' });
  const [addSaving, setAddSaving] = useState(false);

  const loadSupplier = useCallback(() => {
    if (!id) return;
    api.get(`/suppliers/${id}`)
      .then(({ data }) => {
        const s = data.data;
        setSupplier(s);
        setEditFields({
          name: s.name || '',
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          notes: s.notes || '',
        });
      })
      .catch(() => navigate('/suppliers'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { loadSupplier(); }, [loadSupplier]);

  // Product search for add mapping
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProductResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const { data } = await api.get('/inventory', { params: { search: productSearch, limit: 8 } });
        setProductResults(data.data);
      } catch { setProductResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const { data } = await api.patch(`/suppliers/${id}`, {
        name: editFields.name.trim(),
        email: editFields.email.trim() || null,
        phone: editFields.phone.trim() || null,
        address: editFields.address.trim() || null,
        notes: editFields.notes.trim() || null,
      });
      setSupplier((prev) => prev ? { ...prev, ...data.data } : prev);
      setEditing(false);
      setSaveMsg('Supplier updated');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!id || !addForm.productId || !addForm.supplierSku.trim()) return;
    try {
      setAddSaving(true);
      await api.post(`/suppliers/${id}/products`, {
        productId: addForm.productId,
        supplierSku: addForm.supplierSku.trim(),
        supplierPrice: addForm.supplierPrice ? parseFloat(addForm.supplierPrice) : undefined,
        leadTimeDays: addForm.leadTimeDays ? parseInt(addForm.leadTimeDays) : undefined,
      });
      setShowAddProduct(false);
      setAddForm({ productId: 0, productName: '', supplierSku: '', supplierPrice: '', leadTimeDays: '' });
      setProductSearch('');
      loadSupplier();
    } catch {
      // Could show error
    } finally {
      setAddSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!id || !confirm('Remove this product mapping?')) return;
    try {
      await api.delete(`/suppliers/${id}/products/${productId}`);
      loadSupplier();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!supplier) return null;

  const products = supplier.supplierProducts || [];
  const purchaseOrders = supplier.purchaseOrders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/suppliers')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suppliers
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{supplier.name}</h2>
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  supplier.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', supplier.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} &middot; {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium shadow-sm transition-all hover:bg-muted/60"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
        {saveMsg && (
          <p className={cn('mt-2 text-xs', saveMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>{saveMsg}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Products Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted-foreground" />
                Products
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {products.length}
                </span>
              </h3>
              <button
                onClick={() => setShowAddProduct(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </button>
            </div>
            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier SKU</th>
                      <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                      <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Time</th>
                      <th className="w-12 px-6 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {products.map((sp) => (
                      <tr key={sp.id} className="border-l-4 border-l-transparent transition-all hover:border-l-violet-500 hover:bg-violet-500/[0.02]">
                        <td className="px-6 py-3">
                          <button
                            onClick={() => sp.product && navigate(`/inventory/${sp.product.id}`)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {sp.product?.name || `Product #${sp.productId}`}
                          </button>
                          {sp.product?.sku && (
                            <p className="text-[11px] text-muted-foreground">{sp.product.sku}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <code className="text-xs text-muted-foreground">{sp.supplierSku}</code>
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium">
                          {sp.supplierPrice ? `$${parseFloat(sp.supplierPrice).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                          {sp.leadTimeDays ? `${sp.leadTimeDays} days` : '—'}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveProduct(sp.productId); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No products linked</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Add product mappings to track supplier SKUs and pricing.</p>
              </div>
            )}
          </div>

          {/* Purchase Orders Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Purchase Orders
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {purchaseOrders.length}
                </span>
              </h3>
            </div>
            {purchaseOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Number</th>
                      <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected</th>
                      <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {purchaseOrders.map((po) => {
                      const pst = poStatusStyles[po.status] || poStatusStyles.DRAFT;
                      return (
                        <tr
                          key={po.id}
                          onClick={() => navigate(`/receiving/${po.id}`)}
                          className="cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-amber-500 hover:bg-amber-500/[0.02]"
                        >
                          <td className="px-6 py-3 text-sm font-semibold">{po.poNumber}</td>
                          <td className="px-6 py-3">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', pst.bg, pst.text)}>
                              {pst.label}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                            {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <ClipboardList className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No purchase orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — 1 col */}
        <div className="space-y-6">
          {/* Supplier Info Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                Supplier Info
              </h3>
              {editing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-border/40 px-6">
              {/* Name */}
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Name</span>
                {editing ? (
                  <input
                    type="text"
                    value={editFields.name}
                    onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                    className="h-8 w-40 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-semibold">{supplier.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </span>
                {editing ? (
                  <input
                    type="email"
                    value={editFields.email}
                    onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                    className="h-8 w-40 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-medium">{supplier.email || '—'}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={editFields.phone}
                    onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                    className="h-8 w-40 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-medium">{supplier.phone || '—'}</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={editFields.address}
                    onChange={(e) => setEditFields({ ...editFields, address: e.target.value })}
                    className="h-8 w-40 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="max-w-[180px] truncate text-right text-sm font-medium">{supplier.address || '—'}</span>
                )}
              </div>

              {/* Notes */}
              <div className="py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </span>
                {editing ? (
                  <textarea
                    value={editFields.notes}
                    onChange={(e) => setEditFields({ ...editFields, notes: e.target.value })}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{supplier.notes || 'No notes'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Mapping Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h3 className="text-base font-semibold">Add Product Mapping</h3>
              <button
                onClick={() => { setShowAddProduct(false); setProductSearch(''); setProductResults([]); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {/* Product search */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product *</label>
                {addForm.productId ? (
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <span className="text-sm font-medium">{addForm.productName}</span>
                    <button
                      onClick={() => { setAddForm({ ...addForm, productId: 0, productName: '' }); setProductSearch(''); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by name or SKU..."
                      className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                    {searchLoading && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    {productResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card shadow-lg">
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setAddForm({ ...addForm, productId: p.id, productName: p.name });
                              setProductSearch('');
                              setProductResults([]);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                          >
                            <span className="font-medium">{p.name}</span>
                            {p.sku && <span className="text-xs text-muted-foreground">{p.sku}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Supplier SKU *</label>
                <input
                  type="text"
                  value={addForm.supplierSku}
                  onChange={(e) => setAddForm({ ...addForm, supplierSku: e.target.value })}
                  placeholder="Supplier's SKU for this product"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addForm.supplierPrice}
                    onChange={(e) => setAddForm({ ...addForm, supplierPrice: e.target.value })}
                    placeholder="0.00"
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lead Time (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.leadTimeDays}
                    onChange={(e) => setAddForm({ ...addForm, leadTimeDays: e.target.value })}
                    placeholder="e.g. 14"
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
              <button
                onClick={() => { setShowAddProduct(false); setProductSearch(''); setProductResults([]); }}
                className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={addSaving || !addForm.productId || !addForm.supplierSku.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {addSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
