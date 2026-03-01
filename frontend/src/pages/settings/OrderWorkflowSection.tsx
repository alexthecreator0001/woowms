import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import api from '../../services/api';

const WOO_STATUSES = [
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
] as const;

const WMS_STATUSES = [
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

const DEFAULT_MAPPING: Record<string, string> = {
  pending: 'PENDING',
  processing: 'PENDING',
  'on-hold': 'ON_HOLD',
  completed: 'DELIVERED',
  cancelled: 'CANCELLED',
  refunded: 'CANCELLED',
  failed: 'CANCELLED',
};

function formatWooStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrderWorkflowSection() {
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({ ...DEFAULT_MAPPING });
  const [defaultNewOrderStatus, setDefaultNewOrderStatus] = useState('PENDING');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (settings.statusMapping) {
          setStatusMapping({ ...DEFAULT_MAPPING, ...settings.statusMapping });
        }
        if (settings.defaultNewOrderStatus) {
          setDefaultNewOrderStatus(settings.defaultNewOrderStatus);
        }
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
        statusMapping,
        defaultNewOrderStatus,
      });
      setMsg('Workflow settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save workflow settings');
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

  const selectClass = 'h-9 w-full rounded-lg border border-border/60 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Status Mapping</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Map each WooCommerce order status to a WMS status.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {WOO_STATUSES.map((wooStatus) => (
            <div key={wooStatus} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{formatWooStatus(wooStatus)}</p>
                <p className="text-xs text-muted-foreground">woo: {wooStatus}</p>
              </div>
              <div className="w-44">
                <select
                  value={statusMapping[wooStatus] || 'PENDING'}
                  onChange={(e) =>
                    setStatusMapping((prev) => ({ ...prev, [wooStatus]: e.target.value }))
                  }
                  className={selectClass}
                >
                  {WMS_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Default New-Order Status</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The WMS status assigned to newly synced orders when no mapping matches.
          </p>
        </div>
        <div className="p-6">
          <select
            value={defaultNewOrderStatus}
            onChange={(e) => setDefaultNewOrderStatus(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {WMS_STATUSES.map((s) => (
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
