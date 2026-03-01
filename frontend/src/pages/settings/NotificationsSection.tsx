import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const ORDER_STATUSES = [
  { value: '', label: 'No default (show all)' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AWAITING_PICK', label: 'Awaiting Pick' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'PICKED', label: 'Picked' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

export default function NotificationsSection() {
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [defaultOrderFilter, setDefaultOrderFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/preferences')
      .then(({ data }) => {
        const prefs = data.data || {};
        if (typeof prefs.lowStockAlerts === 'boolean') setLowStockAlerts(prefs.lowStockAlerts);
        if (typeof prefs.newOrderAlerts === 'boolean') setNewOrderAlerts(prefs.newOrderAlerts);
        if (prefs.defaultOrderFilter) setDefaultOrderFilter(prefs.defaultOrderFilter);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/preferences', {
        lowStockAlerts,
        newOrderAlerts,
        defaultOrderFilter,
      });
      setMsg('Preferences saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save preferences');
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
          <h3 className="text-base font-semibold">Alert Preferences</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose which alerts and highlights appear on your dashboard.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          <button
            type="button"
            onClick={() => setLowStockAlerts(!lowStockAlerts)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <div>
              <p className="text-sm font-medium">Low stock alerts</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Show low-stock badge on dashboard</p>
            </div>
            <div
              className={cn(
                'flex h-6 w-11 items-center rounded-full px-0.5 transition-colors',
                lowStockAlerts ? 'bg-primary' : 'bg-border'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  lowStockAlerts ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setNewOrderAlerts(!newOrderAlerts)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <div>
              <p className="text-sm font-medium">New order alerts</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Highlight new orders on the orders page</p>
            </div>
            <div
              className={cn(
                'flex h-6 w-11 items-center rounded-full px-0.5 transition-colors',
                newOrderAlerts ? 'bg-primary' : 'bg-border'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  newOrderAlerts ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Default Order Filter</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pre-select a status filter when opening the Orders page.
          </p>
        </div>
        <div className="p-6">
          <select
            value={defaultOrderFilter}
            onChange={(e) => setDefaultOrderFilter(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
