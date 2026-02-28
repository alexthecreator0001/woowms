import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Plus,
  Store,
  RefreshCw,
  Unplug,
  X,
  AlertCircle,
  Link,
  Key,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Store as StoreType } from '../types';
import type { AxiosError } from 'axios';

interface FormField {
  name: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  type?: string;
  required?: boolean;
}

export default function Settings() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const formFields: FormField[] = [
    { name: 'name', label: 'Store Name', placeholder: 'My WooCommerce Store', icon: Store },
    { name: 'url', label: 'Store URL', placeholder: 'https://mystore.com', icon: Link },
    { name: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', icon: Key },
    { name: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', icon: Shield, type: 'password' },
    { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'For verifying incoming webhooks', icon: Shield, required: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your WooCommerce store connections.
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
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
                    <RefreshCw className="h-4 w-4 animate-spin" />
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
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading stores...</span>
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <Store className="mb-3 h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No stores connected</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Click "Connect Store" to add your first WooCommerce store.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Sync</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {stores.map((store) => (
                <tr key={store.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5 text-sm font-semibold">{store.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{store.url}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{store._count?.orders ?? 0}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{store._count?.products ?? 0}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
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
                  </td>
                  <td className="px-5 py-3.5">
                    {store.isActive && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSync(store.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Sync
                        </button>
                        <button
                          onClick={() => handleDisconnect(store.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive shadow-sm transition-all hover:bg-destructive/10"
                        >
                          <Unplug className="h-3 w-3" />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
