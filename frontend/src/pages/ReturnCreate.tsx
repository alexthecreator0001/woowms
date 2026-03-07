import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MagnifyingGlass,
  CircleNotch,
  ShoppingBag,
  Cube,
  X,
  Check,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import api from '../services/api';
import type { Order, OrderItem } from '../types';

interface ReturnItemForm {
  selected: boolean;
  orderItemId: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  maxQty: number;
  returnQty: number;
  condition: string;
  imageUrl: string | null;
}

export default function ReturnCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Order search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState<Order[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);

  // Return details
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  // Debounced order search
  useEffect(() => {
    if (orderSearch.length < 2) {
      setOrderResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const { data } = await api.get('/orders', { params: { search: orderSearch, limit: 10 } });
        setOrderResults(data.data || []);
        setShowDropdown(true);
      } catch {
        setOrderResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectOrder(order: Order) {
    setSelectedOrder(order);
    setShowDropdown(false);
    setOrderSearch('');
    // Build return items from order items
    setReturnItems(
      (order.items || []).map((item) => ({
        selected: false,
        orderItemId: item.id,
        productId: (item.product?.id || item as any).productId || null,
        productName: item.name,
        sku: item.sku,
        maxQty: item.quantity,
        returnQty: item.quantity,
        condition: 'NEW',
        imageUrl: item.product?.imageUrl || null,
      }))
    );
  }

  function toggleItem(idx: number) {
    setReturnItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function updateItem(idx: number, field: string, value: any) {
    setReturnItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const selectedItems = returnItems.filter((i) => i.selected);

  async function handleSubmit() {
    if (!selectedOrder) {
      setError('Please select an order');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }
    if (selectedItems.some((i) => i.returnQty <= 0 || i.returnQty > i.maxQty)) {
      setError('All return quantities must be between 1 and the ordered quantity');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const { data } = await api.post('/returns', {
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber,
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail,
        reason: reason || null,
        notes: notes || null,
        refundAmount: refundAmount ? parseFloat(refundAmount) : null,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.returnQty,
          condition: item.condition,
        })),
      });
      navigate(`/returns/${data.data.rmaNumber}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create return');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/returns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          Returns
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Return</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order search */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Select Order</h3>
            {!selectedOrder ? (
              <div className="relative" ref={dropdownRef}>
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search by order #, customer name, or email..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchLoading && (
                  <CircleNotch size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {showDropdown && orderResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-64 overflow-auto">
                    {orderResults.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => selectOrder(order)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <ShoppingBag size={16} weight="duotone" className="flex-shrink-0 text-muted-foreground/50" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">#{order.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">{order.customerName} &middot; {order.items?.length || 0} items &middot; {order.total ? `$${parseFloat(order.total).toFixed(2)}` : ''}</div>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(order.wooCreatedAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && orderSearch.length >= 2 && orderResults.length === 0 && !searchLoading && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg px-4 py-6 text-center text-sm text-muted-foreground">
                    No orders found
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <ShoppingBag size={20} weight="duotone" className="flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Link to={`/orders/${selectedOrder.orderNumber}`} className="font-semibold text-sm hover:text-primary">
                    #{selectedOrder.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.customerName} &middot; {selectedOrder.customerEmail || ''} &middot; {selectedOrder.total ? `$${parseFloat(selectedOrder.total).toFixed(2)}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedOrder(null); setReturnItems([]); }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Items selection */}
          {selectedOrder && returnItems.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border/50 px-5 py-3">
                <h3 className="text-sm font-semibold">Select Items to Return</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedItems.length} of {returnItems.length} items selected</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/40">
                    <th className="w-10 px-4 py-2" />
                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Product</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">SKU</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Ordered</th>
                    <th className="w-24 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Return Qty</th>
                    <th className="w-36 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {returnItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        'transition-colors',
                        item.selected ? 'bg-teal-500/[0.03]' : 'opacity-60'
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleItem(idx)}
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                            item.selected
                              ? 'border-teal-500 bg-teal-500 text-white'
                              : 'border-border hover:border-teal-500/50'
                          )}
                        >
                          {item.selected && <Check size={12} weight="bold" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={proxyUrl(item.imageUrl, 64) || ''} alt="" className="h-8 w-8 rounded-md border border-border/40 object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                              <Cube size={14} className="text-muted-foreground/30" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{item.maxQty}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={item.maxQty}
                          value={item.returnQty}
                          onChange={(e) => updateItem(idx, 'returnQty', Math.min(parseInt(e.target.value) || 1, item.maxQty))}
                          disabled={!item.selected}
                          className="h-8 w-20 rounded-md border border-border/60 bg-background px-2 text-sm text-center tabular-nums disabled:opacity-40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.condition}
                          onChange={(e) => updateItem(idx, 'condition', e.target.value)}
                          disabled={!item.selected}
                          className="h-8 rounded-md border border-border/60 bg-background px-2 text-sm disabled:opacity-40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="NEW">New / Unopened</option>
                          <option value="OPENED">Opened</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="DEFECTIVE">Defective</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Return details */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold">Return Details</h3>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reason for Return</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer changed their mind, wrong size, defective product..."
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible only to the team..."
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Refund Amount (optional)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9 w-full rounded-lg border border-border/60 bg-background pl-7 pr-3 text-sm tabular-nums placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">{selectedOrder ? `#${selectedOrder.orderNumber}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Qty</span>
                <span className="font-medium tabular-nums">{selectedItems.reduce((s, i) => s + i.returnQty, 0)}</span>
              </div>
              {refundAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund</span>
                  <span className="font-medium tabular-nums">${parseFloat(refundAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-border/50 pt-4 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={saving || !selectedOrder || selectedItems.length === 0}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <CircleNotch size={16} className="animate-spin" />}
                Create Return
              </button>
              <button
                onClick={() => navigate('/returns')}
                className="w-full inline-flex h-10 items-center justify-center rounded-lg border border-border/60 bg-card text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
