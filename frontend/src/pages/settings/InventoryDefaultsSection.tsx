import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

export default function InventoryDefaultsSection() {
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [pushStockToWoo, setPushStockToWoo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (typeof settings.lowStockThreshold === 'number') setLowStockThreshold(settings.lowStockThreshold);
        if (typeof settings.pushStockToWoo === 'boolean') setPushStockToWoo(settings.pushStockToWoo);
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
      });
      setMsg('Inventory settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save inventory settings');
    } finally {
      setSaving(false);
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

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Stock Sync</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Automatically push inventory changes back to WooCommerce.
          </p>
        </div>
        <div className="p-2">
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
                'flex h-6 w-11 items-center rounded-full px-0.5 transition-colors',
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
        </div>
      </div>

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
