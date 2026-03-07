import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
  Plus,
  X,
  ArrowRight,
  Info,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { fetchAllStatuses, AVAILABLE_COLORS, type StatusDef } from '../../lib/statuses';
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

const DEFAULT_MAPPING: Record<string, string> = {
  pending: 'PENDING',
  processing: 'PROCESSING',
  'on-hold': 'ON_HOLD',
  completed: 'DELIVERED',
  cancelled: 'CANCELLED',
  refunded: 'CANCELLED',
  failed: 'CANCELLED',
};

function formatWooStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PaymentMethod {
  paymentMethod: string;
  paymentMethodTitle: string;
}

interface PaymentRule {
  paidStatuses: string[];
}

export default function OrderWorkflowSection() {
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({ ...DEFAULT_MAPPING });
  const [defaultNewOrderStatus, setDefaultNewOrderStatus] = useState('PENDING');
  const [reverseStatusMapping, setReverseStatusMapping] = useState<Record<string, string>>({});
  const [autoStatusPush, setAutoStatusPush] = useState(false);
  const [paymentRules, setPaymentRules] = useState<Record<string, PaymentRule>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [allStatuses, setAllStatuses] = useState<StatusDef[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('gray');
  const [addingStatus, setAddingStatus] = useState(false);
  const [newPaymentSlug, setNewPaymentSlug] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/account/tenant-settings'),
      fetchAllStatuses(),
      api.get('/orders/payment-methods').catch(() => ({ data: { data: [] } })),
    ]).then(([settingsRes, statuses, pmRes]) => {
      const settings = settingsRes.data.data || {};
      if (settings.statusMapping) {
        setStatusMapping({ ...DEFAULT_MAPPING, ...settings.statusMapping });
      }
      if (settings.defaultNewOrderStatus) {
        setDefaultNewOrderStatus(settings.defaultNewOrderStatus);
      }
      if (settings.reverseStatusMapping) {
        setReverseStatusMapping(settings.reverseStatusMapping);
      }
      if (settings.autoStatusPush !== undefined) {
        setAutoStatusPush(settings.autoStatusPush);
      }
      if (settings.paymentRules) {
        setPaymentRules(settings.paymentRules);
      }
      setAllStatuses(statuses);
      setPaymentMethods(pmRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      // Clean empty values from reverse mapping
      const cleanReverse: Record<string, string> = {};
      for (const [k, v] of Object.entries(reverseStatusMapping)) {
        if (v) cleanReverse[k] = v;
      }
      await api.patch('/account/tenant-settings', {
        statusMapping,
        defaultNewOrderStatus,
        reverseStatusMapping: cleanReverse,
        autoStatusPush,
        paymentRules,
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

  const handleAddCustomStatus = async () => {
    if (!newLabel.trim()) return;
    setAddingStatus(true);
    try {
      const value = newLabel.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      await api.post('/account/custom-statuses', { value, label: newLabel.trim(), color: newColor });
      const statuses = await fetchAllStatuses();
      setAllStatuses(statuses);
      setNewLabel('');
      setNewColor('gray');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add custom status');
    } finally {
      setAddingStatus(false);
    }
  };

  const handleRemoveCustomStatus = async (value: string) => {
    try {
      await api.delete(`/account/custom-statuses/${value}`);
      const statuses = await fetchAllStatuses();
      setAllStatuses(statuses);
    } catch {
      setError('Failed to remove custom status');
    }
  };

  const togglePaidStatus = (methodId: string, wooStatus: string) => {
    setPaymentRules((prev) => {
      const rule = prev[methodId] || { paidStatuses: [] };
      const has = rule.paidStatuses.includes(wooStatus);
      return {
        ...prev,
        [methodId]: {
          paidStatuses: has
            ? rule.paidStatuses.filter((s) => s !== wooStatus)
            : [...rule.paidStatuses, wooStatus],
        },
      };
    });
  };

  const addPaymentRule = (slug: string) => {
    if (!slug.trim() || paymentRules[slug.trim()]) return;
    const defaults: Record<string, string[]> = {
      cod: ['completed'],
      bacs: ['processing', 'completed'],
      cheque: ['processing', 'completed'],
    };
    setPaymentRules((prev) => ({
      ...prev,
      [slug.trim()]: { paidStatuses: defaults[slug.trim()] || ['completed'] },
    }));
    setNewPaymentSlug('');
  };

  const removePaymentRule = (methodId: string) => {
    setPaymentRules((prev) => {
      const next = { ...prev };
      delete next[methodId];
      return next;
    });
  };

  const selectClass = 'h-9 w-full rounded-lg border border-border/60 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  // Separate built-in from custom for the custom statuses card
  const builtInValues = new Set(['PENDING', 'PROCESSING', 'AWAITING_PICK', 'PICKING', 'PICKED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD']);
  const customStatuses = allStatuses.filter((s) => !builtInValues.has(s.value));

  // Payment methods not in rules = always paid
  const getMethodTitle = (slug: string) => {
    const found = paymentMethods.find((m) => m.paymentMethod === slug);
    return found?.paymentMethodTitle || formatWooStatus(slug);
  };
  const alwaysPaidMethods = paymentMethods.filter((m) => !paymentRules[m.paymentMethod]);

  return (
    <div className="space-y-6">
      {/* Custom Statuses Card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Custom Statuses</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create custom order statuses in addition to the 10 built-in ones.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {customStatuses.map((s) => (
            <div key={s.value} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className={cn('h-2.5 w-2.5 rounded-full', `bg-${s.color}-500`)} />
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.value}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCustomStatus(s.value)}
                className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {customStatuses.length === 0 && (
            <div className="px-6 py-4 text-center text-sm text-muted-foreground/60">
              No custom statuses yet
            </div>
          )}
        </div>
        <div className="border-t border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Status name..."
              className="h-9 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm"
            >
              {AVAILABLE_COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleAddCustomStatus}
              disabled={addingStatus || !newLabel.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {addingStatus ? <CircleNotch size={14} className="animate-spin" /> : <Plus size={14} weight="bold" />}
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Inbound Status Mapping Card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Inbound Status Mapping</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Map each WooCommerce order status to a WMS status when syncing orders in.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {WOO_STATUSES.map((wooStatus) => (
            <div key={wooStatus} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 flex-1">
                <p className="text-sm font-medium">{formatWooStatus(wooStatus)}</p>
                <ArrowRight size={12} className="text-muted-foreground/40" />
              </div>
              <div className="w-44">
                <select
                  value={statusMapping[wooStatus] || 'PENDING'}
                  onChange={(e) =>
                    setStatusMapping((prev) => ({ ...prev, [wooStatus]: e.target.value }))
                  }
                  className={selectClass}
                >
                  {allStatuses.map((s) => (
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

      {/* Default New-Order Status Card */}
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
            {allStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Push Card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Status Push</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                When you change a status in the app, push it back to WooCommerce.
              </p>
            </div>
            <button
              onClick={() => setAutoStatusPush(!autoStatusPush)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                autoStatusPush ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  autoStatusPush ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>
        {autoStatusPush && (
          <div className="divide-y divide-border/40">
            {allStatuses.map((wmsStatus) => (
              <div key={wmsStatus.value} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <p className="text-sm font-medium">{wmsStatus.label}</p>
                  <ArrowRight size={12} className="text-muted-foreground/40" />
                </div>
                <div className="w-44">
                  <select
                    value={reverseStatusMapping[wmsStatus.value] || ''}
                    onChange={(e) =>
                      setReverseStatusMapping((prev) => ({ ...prev, [wmsStatus.value]: e.target.value }))
                    }
                    className={selectClass}
                  >
                    <option value="">Don&apos;t push</option>
                    {WOO_STATUSES.map((ws) => (
                      <option key={ws} value={ws}>{formatWooStatus(ws)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Rules Card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Payment Rules</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure which WooCommerce statuses mean &ldquo;paid&rdquo; for each payment method.
            Methods not listed are always considered paid (prepaid gateways).
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {/* Always-paid methods */}
          {alwaysPaidMethods.map((m) => (
            <div key={m.paymentMethod} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium">{m.paymentMethodTitle}</p>
                <p className="text-xs text-muted-foreground">{m.paymentMethod}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                  Always Paid
                </span>
                <button
                  onClick={() => addPaymentRule(m.paymentMethod)}
                  className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                  title="Add rule"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
          {/* Configured rules */}
          {Object.entries(paymentRules).map(([methodId, rule]) => (
            <div key={methodId} className="px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{getMethodTitle(methodId)}</p>
                  <p className="text-xs text-muted-foreground">{methodId}</p>
                </div>
                <button
                  onClick={() => removePaymentRule(methodId)}
                  className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remove rule (mark as always paid)"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">Paid when WooCommerce status is:</p>
              <div className="flex flex-wrap gap-1.5">
                {WOO_STATUSES.map((ws) => (
                  <button
                    key={ws}
                    onClick={() => togglePaidStatus(methodId, ws)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                      rule.paidStatuses.includes(ws)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {formatWooStatus(ws)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {alwaysPaidMethods.length === 0 && Object.keys(paymentRules).length === 0 && (
            <div className="px-6 py-4 text-center text-sm text-muted-foreground/60">
              No payment methods found. Sync some orders first.
            </div>
          )}
        </div>
        <div className="border-t border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPaymentSlug}
              onChange={(e) => setNewPaymentSlug(e.target.value)}
              placeholder="Payment method slug (e.g. cod, bacs)..."
              className="h-9 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => addPaymentRule(newPaymentSlug)}
              disabled={!newPaymentSlug.trim() || !!paymentRules[newPaymentSlug.trim()]}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus size={14} weight="bold" />
              Add Rule
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground/60">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            Adding a rule means the method is NOT always considered paid. Select which WooCommerce statuses indicate payment received.
          </p>
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
