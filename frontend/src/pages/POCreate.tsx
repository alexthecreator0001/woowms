import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PackageOpen,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

interface POItemForm {
  key: number;
  sku: string;
  productName: string;
  orderedQty: number;
  unitCost: string;
}

let itemKeyCounter = 1;

function generatePONumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `PO-${date}-${rand}`;
}

export default function POCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [poNumber, setPoNumber] = useState(generatePONumber);
  const [supplier, setSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItemForm[]>([
    { key: itemKeyCounter++, sku: '', productName: '', orderedQty: 1, unitCost: '' },
  ]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: itemKeyCounter++, sku: '', productName: '', orderedQty: 1, unitCost: '' },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateItem(key: number, field: keyof POItemForm, value: string | number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  }

  async function handleSubmit(markOrdered: boolean) {
    setError('');
    if (!poNumber.trim() || !supplier.trim()) {
      setError('PO number and supplier are required.');
      return;
    }
    if (items.length === 0 || items.every((i) => !i.sku && !i.productName)) {
      setError('Add at least one item.');
      return;
    }

    const validItems = items
      .filter((i) => i.sku || i.productName)
      .map((i) => ({
        sku: i.sku,
        productName: i.productName,
        orderedQty: Math.max(i.orderedQty, 1),
        unitCost: i.unitCost ? parseFloat(i.unitCost) : undefined,
      }));

    try {
      setSaving(true);
      const { data } = await api.post('/receiving', {
        poNumber: poNumber.trim(),
        supplier: supplier.trim(),
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
        items: validItems,
      });

      const createdPo = data.data;

      if (markOrdered) {
        await api.patch(`/receiving/${createdPo.id}/status`, { status: 'ORDERED' });
      }

      navigate(`/receiving/${createdPo.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create purchase order.');
      setSaving(false);
    }
  }

  const totalCost = items.reduce((sum, i) => {
    if (!i.unitCost) return sum;
    return sum + parseFloat(i.unitCost || '0') * Math.max(i.orderedQty, 1);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/receiving')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receiving
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <PackageOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Purchase Order</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Add items and submit a new purchase order.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT — Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* PO Details Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="text-sm font-semibold">Order Details</h3>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Supplier name"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Expected Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h3 className="text-sm font-semibold">Items</h3>
              <button
                onClick={addItem}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Name</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">Unit Cost</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">Line Total</th>
                    <th className="w-12 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {items.map((item) => {
                    const lineTotal = item.unitCost ? parseFloat(item.unitCost || '0') * Math.max(item.orderedQty, 1) : 0;
                    return (
                      <tr key={item.key}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => updateItem(item.key, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateItem(item.key, 'productName', e.target.value)}
                            placeholder="Product name"
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.orderedQty}
                            onChange={(e) => updateItem(item.key, 'orderedQty', parseInt(e.target.value) || 1)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-center text-sm font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.key, 'unitCost', e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                          {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-2">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.key)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            {totalCost > 0 && (
              <div className="border-t border-border/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Cost</span>
                  <span className="text-lg font-bold">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Actions */}
        <div>
          <div className="sticky top-6 rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h3 className="text-sm font-semibold">Save</h3>
            </div>
            <div className="space-y-3 p-4">
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  'border border-border/60 bg-muted/20 hover:bg-muted/40 disabled:opacity-50'
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Mark Ordered
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
