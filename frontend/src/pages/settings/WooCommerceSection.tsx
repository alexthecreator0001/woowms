import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Plus,
  Storefront,
  ArrowsClockwise,
  PlugsConnected,
  X,
  WarningCircle,
  LinkSimple,
  Key,
  ShieldCheck,
  GearSix,
  FloppyDisk,
  CircleNotch,
  CalendarBlank,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import type { Store } from '../../types';
import type { AxiosError } from 'axios';

interface FormField {
  name: string;
  label: string;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  required?: boolean;
}

const WOO_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
];

interface SyncSettingsForm {
  syncOrders: boolean;
  syncProducts: boolean;
  syncInventory: boolean;
  autoSync: boolean;
  syncIntervalMin: number;
  orderStatusFilter: string[];
  syncDaysBack: number;
  syncSinceDate: string;
}

export default function WooCommerceSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync settings panel
  const [configStoreId, setConfigStoreId] = useState<number | null>(null);
  const [syncForm, setSyncForm] = useState<SyncSettingsForm>({
    syncOrders: true,
    syncProducts: true,
    syncInventory: true,
    autoSync: true,
    syncIntervalMin: 5,
    orderStatusFilter: ['processing', 'on-hold', 'pending'],
    syncDaysBack: 30,
    syncSinceDate: '',
  });
  const [syncSaving, setSyncSaving] = useState(false);

  const loadStores = async () => {
    try {
      const { data } = await api.get('/stores');
      setStores(data.data);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStores(); }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/stores', form);
      setForm({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
      setShowForm(false);
      loadStores();
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to add store');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (storeId: number) => {
    try {
      await api.post(`/stores/${storeId}/sync`);
      loadStores();
    } catch (err) {
      alert('Sync failed: ' + ((err as AxiosError<{ message: string }>).response?.data?.message || (err as Error).message));
    }
  };

  const handleDisconnect = async (storeId: number) => {
    if (!confirm('Disconnect this store? It will stop syncing.')) return;
    try {
      await api.delete(`/stores/${storeId}`);
      loadStores();
    } catch (err) {
      alert('Failed to disconnect: ' + ((err as AxiosError<{ message: string }>).response?.data?.message || (err as Error).message));
    }
  };

  const openSyncConfig = (store: Store) => {
    setConfigStoreId(store.id);
    setSyncForm({
      syncOrders: store.syncOrders,
      syncProducts: store.syncProducts,
      syncInventory: store.syncInventory,
      autoSync: store.autoSync,
      syncIntervalMin: store.syncIntervalMin,
      orderStatusFilter: store.orderStatusFilter,
      syncDaysBack: store.syncDaysBack,
      syncSinceDate: store.syncSinceDate ? store.syncSinceDate.slice(0, 10) : '',
    });
  };

  const handleSyncSettingsSave = async () => {
    if (!configStoreId) return;
    setSyncSaving(true);
    try {
      await api.patch(`/stores/${configStoreId}/sync-settings`, {
        ...syncForm,
        syncSinceDate: syncForm.syncSinceDate || null,
      });
      setConfigStoreId(null);
      loadStores();
    } catch (err) {
      alert('Failed to save: ' + ((err as AxiosError<{ message: string }>).response?.data?.message || (err as Error).message));
    } finally {
      setSyncSaving(false);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setSyncForm((prev) => ({
      ...prev,
      orderStatusFilter: prev.orderStatusFilter.includes(status)
        ? prev.orderStatusFilter.filter((s) => s !== status)
        : [...prev.orderStatusFilter, status],
    }));
  };

  const formFields: FormField[] = [
    { name: 'name', label: 'Store Name', placeholder: 'My WooCommerce Store', icon: Storefront },
    { name: 'url', label: 'Store URL', placeholder: 'https://mystore.com', icon: LinkSimple },
    { name: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', icon: Key },
    { name: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', icon: ShieldCheck, type: 'password' },
    { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'For verifying incoming webhooks', icon: ShieldCheck, required: false },
  ];

  const toggleClass = (checked: boolean) => cn(
    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
    checked ? 'bg-primary' : 'bg-muted-foreground/20'
  );

  const toggleDotClass = (checked: boolean) => cn(
    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
    checked ? 'translate-x-5' : 'translate-x-0'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WooCommerce Stores</h3>
          <p className="text-sm text-muted-foreground">
            Connect and configure your WooCommerce store integrations.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            showForm
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          )}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Connect Store
            </>
          )}
        </button>
      </div>

      {/* Add Store Form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-base font-semibold">Connect a WooCommerce Store</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Enter your WooCommerce API credentials to connect.</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <WarningCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="p-6 space-y-4">
            {formFields.map((field) => {
              const FieldIcon = field.icon;
              return (
                <div key={field.name}>
                  <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
                  <div className="relative">
                    <FieldIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      required={field.required !== false}
                      placeholder={field.placeholder}
                      className="h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Connect Store
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stores List */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading stores...</span>
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <Storefront className="mb-3 h-10 w-10 text-muted-foreground/20" weight="duotone" />
          <p className="text-sm font-medium text-muted-foreground">No stores connected</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Click "Connect Store" to add your first WooCommerce store.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              {/* Store row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Storefront className="h-5 w-5 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{store.name}</p>
                    <p className="text-xs text-muted-foreground">{store.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">
                      {store._count?.orders ?? 0} orders &middot; {store._count?.products ?? 0} products
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Last sync: {store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleString() : 'Never'}
                    </p>
                  </div>

                  {store.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Disconnected
                    </span>
                  )}

                  {store.isActive && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openSyncConfig(store)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted"
                      >
                        <GearSix className="h-3 w-3" />
                        Configure
                      </button>
                      <button
                        onClick={() => handleSync(store.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted"
                      >
                        <ArrowsClockwise className="h-3 w-3" />
                        Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(store.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive shadow-sm transition-all hover:bg-destructive/10"
                      >
                        <PlugsConnected className="h-3 w-3" />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Settings Panel */}
              {configStoreId === store.id && (
                <div className="border-t border-border/50 bg-muted/20 px-6 py-5">
                  <h4 className="mb-4 text-sm font-semibold">Sync Configuration</h4>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Left column — toggles */}
                    <div className="space-y-4">
                      {/* Sync toggles */}
                      {[
                        { key: 'syncOrders' as const, label: 'Sync Orders' },
                        { key: 'syncProducts' as const, label: 'Sync Products' },
                        { key: 'syncInventory' as const, label: 'Sync Inventory' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{label}</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={syncForm[key]}
                            onClick={() => setSyncForm((p) => ({ ...p, [key]: !p[key] }))}
                            className={toggleClass(syncForm[key])}
                          >
                            <span className={toggleDotClass(syncForm[key])} />
                          </button>
                        </div>
                      ))}

                      <div className="border-t border-border/40 pt-4" />

                      {/* Auto sync + interval */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-Sync</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={syncForm.autoSync}
                          onClick={() => setSyncForm((p) => ({ ...p, autoSync: !p.autoSync }))}
                          className={toggleClass(syncForm.autoSync)}
                        >
                          <span className={toggleDotClass(syncForm.autoSync)} />
                        </button>
                      </div>

                      {syncForm.autoSync && (
                        <div>
                          <label className="mb-1.5 block text-sm text-muted-foreground">Sync Interval</label>
                          <select
                            value={syncForm.syncIntervalMin}
                            onChange={(e) => setSyncForm((p) => ({ ...p, syncIntervalMin: parseInt(e.target.value) }))}
                            className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {INTERVAL_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Right column — filters + date */}
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Order Status Filter</label>
                        <div className="flex flex-wrap gap-2">
                          {WOO_STATUSES.map((s) => {
                            const active = syncForm.orderStatusFilter.includes(s.value);
                            return (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => toggleStatusFilter(s.value)}
                                className={cn(
                                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                  active
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                                )}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm text-muted-foreground">Days Lookback</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={syncForm.syncDaysBack}
                          onChange={(e) => setSyncForm((p) => ({ ...p, syncDaysBack: parseInt(e.target.value) || 30 }))}
                          className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="mt-1 text-xs text-muted-foreground/60">Only sync orders from the last N days.</p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm text-muted-foreground">Sync Since Date</label>
                        <div className="relative">
                          <CalendarBlank className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <input
                            type="date"
                            value={syncForm.syncSinceDate}
                            onChange={(e) => setSyncForm((p) => ({ ...p, syncSinceDate: e.target.value }))}
                            className="h-9 w-full rounded-lg border border-border/60 bg-background pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground/60">Hard cutoff — orders before this date are never imported.</p>
                      </div>
                    </div>
                  </div>

                  {/* Save / Cancel */}
                  <div className="mt-5 flex items-center justify-end gap-3 border-t border-border/40 pt-4">
                    <button
                      onClick={() => setConfigStoreId(null)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSyncSettingsSave}
                      disabled={syncSaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      {syncSaving ? (
                        <CircleNotch className="h-4 w-4 animate-spin" />
                      ) : (
                        <FloppyDisk className="h-4 w-4" />
                      )}
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
