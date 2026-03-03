import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UsersThree,
  Envelope,
  Phone,
  MapPin,
  PencilSimple,
  X,
  Check,
  CircleNotch,
  Package,
  Plus,
  Trash,
  ClipboardText,
  NoteBlank,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import ProductSearchDropdown from '../components/ProductSearchDropdown';
import type { Supplier, SupplierProduct, PurchaseOrder } from '../types';

const poStatusStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
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
      loadSupplier();
    } catch { /* ignore */ }
    finally { setAddSaving(false); }
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
        <CircleNotch size={32} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (!supplier) return null;

  const products = supplier.supplierProducts || [];
  const purchaseOrders = supplier.purchaseOrders || [];

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/suppliers')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Suppliers
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-lg font-bold text-violet-600">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">{supplier.name}</h2>
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  supplier.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', supplier.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} &middot; {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted/60 hover:text-foreground"
            >
              <PencilSimple size={14} />
              Edit
            </button>
          )}
        </div>
        {saveMsg && (
          <p className={cn('mt-2 text-xs', saveMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>{saveMsg}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 divide-x divide-border/50 rounded-xl border border-border/60 bg-card shadow-sm">
        {[
          { label: 'Products', value: products.length, icon: Package, iconColor: 'text-blue-500' },
          { label: 'Purchase Orders', value: purchaseOrders.length, icon: ClipboardText, iconColor: 'text-amber-500' },
          { label: 'Avg Lead Time', value: products.filter(p => p.leadTimeDays).length > 0 ? `${Math.round(products.filter(p => p.leadTimeDays).reduce((s, p) => s + (p.leadTimeDays || 0), 0) / products.filter(p => p.leadTimeDays).length)}d` : '\u2014', icon: ClipboardText, iconColor: 'text-violet-500' },
          { label: 'Open POs', value: purchaseOrders.filter(po => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED').length, icon: ClipboardText, iconColor: 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-5 py-3.5">
            <s.icon size={18} weight="duotone" className={s.iconColor} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold tracking-tight">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* LEFT — 2 cols */}
        <div className="space-y-5 lg:col-span-2">
          {/* Products Card */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package size={16} weight="duotone" className="text-blue-500" />
                Products
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {products.length}
                </span>
              </h3>
              <button
                onClick={() => setShowAddProduct(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40"
              >
                <Plus size={12} weight="bold" />
                Add Product
              </button>
            </div>
            {products.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Supplier SKU</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Price</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Lead Time</th>
                    <th className="w-10 px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {products.map((sp) => (
                    <tr key={sp.id} className="group transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); sp.product && navigate(`/inventory/${sp.product.sku || sp.product.id}`); }}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {sp.product?.name || `Product #${sp.productId}`}
                        </button>
                        {sp.product?.sku && (
                          <p className="mt-0.5">
                            <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{sp.product.sku}</code>
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded bg-violet-500/8 px-1.5 py-0.5 text-[11px] font-medium text-violet-600">{sp.supplierSku}</code>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">
                        {sp.supplierPrice ? `$${parseFloat(sp.supplierPrice).toFixed(2)}` : <span className="text-muted-foreground/40">&mdash;</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-muted-foreground tabular-nums">
                        {sp.leadTimeDays ? `${sp.leadTimeDays}d` : <span className="text-muted-foreground/40">&mdash;</span>}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveProduct(sp.productId); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <Package size={28} weight="duotone" className="mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No products linked</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Add product mappings to track supplier SKUs and pricing.</p>
              </div>
            )}
          </div>

          {/* Purchase Orders Card */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardText size={16} weight="duotone" className="text-amber-500" />
                Purchase Orders
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {purchaseOrders.length}
                </span>
              </h3>
            </div>
            {purchaseOrders.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">PO Number</th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expected</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {purchaseOrders.map((po) => {
                    const pst = poStatusStyles[po.status] || poStatusStyles.DRAFT;
                    return (
                      <tr
                        key={po.id}
                        onClick={() => navigate(`/receiving/${po.poNumber}`)}
                        className="group cursor-pointer transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-3 text-sm font-semibold group-hover:text-primary transition-colors">{po.poNumber}</td>
                        <td className="px-5 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', pst.bg, pst.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', pst.dot)} />
                            {pst.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-muted-foreground">
                          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : <span className="text-muted-foreground/40">&mdash;</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-muted-foreground">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <ClipboardText size={28} weight="duotone" className="mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No purchase orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Info card */}
        <div>
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <UsersThree size={16} weight="duotone" className="text-violet-500" />
                Supplier Info
              </h3>
              {editing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                  >
                    <X size={12} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? <CircleNotch size={12} className="animate-spin" /> : <Check size={12} weight="bold" />}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-border/40 px-5">
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
                  <Envelope size={14} className="text-muted-foreground/50" />
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
                  <span className="text-sm font-medium">{supplier.email || <span className="text-muted-foreground/40">&mdash;</span>}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone size={14} className="text-muted-foreground/50" />
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
                  <span className="text-sm font-medium">{supplier.phone || <span className="text-muted-foreground/40">&mdash;</span>}</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-muted-foreground/50" />
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
                  <span className="max-w-[180px] truncate text-right text-sm font-medium">{supplier.address || <span className="text-muted-foreground/40">&mdash;</span>}</span>
                )}
              </div>

              {/* Notes */}
              <div className="py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <NoteBlank size={14} className="text-muted-foreground/50" />
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
              <div className="flex items-center gap-2.5">
                <Package size={18} weight="bold" className="text-blue-500" />
                <h3 className="text-base font-semibold">Add Product Mapping</h3>
              </div>
              <button
                onClick={() => { setShowAddProduct(false); setAddForm({ productId: 0, productName: '', supplierSku: '', supplierPrice: '', leadTimeDays: '' }); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product *</label>
                {addForm.productId ? (
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <span className="text-sm font-medium">{addForm.productName}</span>
                    <button
                      onClick={() => setAddForm({ ...addForm, productId: 0, productName: '' })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <ProductSearchDropdown
                    onSelect={(p) => setAddForm({ ...addForm, productId: p.id, productName: p.name })}
                    excludeIds={supplier?.supplierProducts?.map((sp) => sp.productId) || []}
                    placeholder="Search by name, SKU, or barcode..."
                    autoFocus
                  />
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
                onClick={() => { setShowAddProduct(false); setAddForm({ productId: 0, productName: '', supplierSku: '', supplierPrice: '', leadTimeDays: '' }); }}
                className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={addSaving || !addForm.productId || !addForm.supplierSku.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {addSaving && <CircleNotch size={14} className="animate-spin" />}
                Add Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
