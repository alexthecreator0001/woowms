import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
  ArrowsClockwise,
  Info,
  CaretDown,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const OOS_OPTIONS = [
  { value: 'show_sold_out', label: 'Show as sold out (no purchase)', description: 'Product stays visible but can\'t be bought' },
  { value: 'hide', label: 'Hide product from store', description: 'Product is hidden when out of stock' },
  { value: 'allow_backorders', label: 'Allow backorders silently', description: 'Customers can still buy — no notification' },
  { value: 'allow_backorders_notify', label: 'Allow backorders (notify customer)', description: 'Customers can buy but see a backorder notice' },
] as const;

export default function InventoryDefaultsSection() {
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [pushStockToWoo, setPushStockToWoo] = useState(false);
  const [outOfStockBehavior, setOutOfStockBehavior] = useState('show_sold_out');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ pushed: number; failed: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (typeof settings.lowStockThreshold === 'number') setLowStockThreshold(settings.lowStockThreshold);
        if (typeof settings.pushStockToWoo === 'boolean') setPushStockToWoo(settings.pushStockToWoo);
        if (typeof settings.outOfStockBehavior === 'string') setOutOfStockBehavior(settings.outOfStockBehavior);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', {
        lowStockThreshold,
        pushStockToWoo,
        outOfStockBehavior,
      });
      setMsg('Inventory settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save inventory settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePushAll = async () => {
    setPushing(true);
    setPushResult(null);
    setError('');
    try {
      const { data } = await api.post('/inventory/push-stock-all');
      setPushResult({ pushed: data.data.pushed, failed: data.data.failed });
      setTimeout(() => setPushResult(null), 5000);
    } catch {
      setError('Failed to push stock to WooCommerce');
    } finally {
      setPushing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Low Stock Threshold */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Low Stock Threshold</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Products with stock at or below this number are flagged as low stock. Default is 5.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={9999}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-10 w-28 rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">units</span>
          </div>
        </div>
      </div>

      {/* Card 2: Stock Push to WooCommerce */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Stock Push to WooCommerce</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Control how inventory changes are pushed back to your WooCommerce store.
          </p>
        </div>
        <div className="p-2">
          {/* Push toggle */}
          <button
            type="button"
            onClick={() => setPushStockToWoo(!pushStockToWoo)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium">Push stock to WooCommerce</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                When stock is adjusted in the WMS, update WooCommerce automatically
              </p>
            </div>
            <div
              className={cn(
                'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                pushStockToWoo ? 'bg-primary' : 'bg-border'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  pushStockToWoo ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
          </button>

          {/* Out-of-stock behavior dropdown */}
          {pushStockToWoo && (
            <div className="px-4 pb-3 pt-1">
              <label className="mb-1.5 block text-sm font-medium">Out-of-stock behavior</label>
              <div className="relative">
                <select
                  value={outOfStockBehavior}
                  onChange={(e) => setOutOfStockBehavior(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {OOS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {OOS_OPTIONS.find((o) => o.value === outOfStockBehavior)?.description}
              </p>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  These are global defaults. You can override per product in product details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Bulk Actions */}
      {pushStockToWoo && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-base font-semibold">Bulk Actions</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manually push stock levels to WooCommerce for all products at once.
            </p>
          </div>
          <div className="p-6">
            <button
              type="button"
              onClick={handlePushAll}
              disabled={pushing}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-muted/60 disabled:opacity-50"
            >
              {pushing ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowsClockwise className="h-4 w-4" />
              )}
              {pushing ? 'Pushing stock...' : 'Push all stock now'}
            </button>

            {pushResult && (
              <p className={cn(
                'mt-3 flex items-center gap-1.5 text-sm',
                pushResult.failed > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}>
                <Check className="h-4 w-4" weight="bold" />
                {pushResult.pushed} products pushed
                {pushResult.failed > 0 && `, ${pushResult.failed} failed`}
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {msg && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <Check className="h-4 w-4" weight="bold" />
          {msg}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <CircleNotch className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
