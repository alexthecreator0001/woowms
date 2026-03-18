import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleNotch,
  CheckCircle,
  Key,
  Lock,
  CaretDown,
  Plugs,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import Logo from '../../components/Logo';
import type { AxiosError } from 'axios';

export default function ConnectStore() {
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/stores', form);
      setSuccess(true);
      setTimeout(() => navigate('/onboarding/store-config'), 2000);
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to connect store');
    } finally {
      setSaving(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="grain flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircle size={48} weight="fill" className="mx-auto mb-4 text-emerald-500" />
          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">You're all set</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Your store is connected. Setting up warehouse...</p>
          <CircleNotch size={20} className="mx-auto mt-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="grain relative flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center">
          <Logo width={120} className="text-foreground" />
        </div>
        {/* Steps */}
        <div className="flex items-center gap-3 text-[13px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Account
          </span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-semibold text-foreground">Connect store</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-muted-foreground/50">Store config</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-muted-foreground/50">Warehouse setup</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[480px]">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">Connect your store</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Paste your WooCommerce API credentials. We'll sync your orders, products, and inventory automatically.
            </p>
          </div>

          {/* How-to hint */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Where to find your keys: </span>
              In your WordPress admin, go to{' '}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API</span>{' '}
              and create a new key with Read/Write access.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Store basics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-foreground">Store name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="My Store"
                    className="h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-foreground">Store URL</label>
                  <input
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    required
                    placeholder="https://mystore.com"
                    className="h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/5"
                  />
                </div>
              </div>

              {/* API Keys — visual grouping */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <Key size={15} weight="bold" className="text-muted-foreground" />
                  <span className="text-[13px] font-semibold text-foreground">API credentials</span>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Consumer Key</label>
                    <input
                      name="consumerKey"
                      value={form.consumerKey}
                      onChange={handleChange}
                      required
                      placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3.5 font-mono text-[13px] text-foreground transition-shadow placeholder:text-muted-foreground/50 focus:border-foreground focus:bg-card focus:outline-none focus:ring-4 focus:ring-foreground/5"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Consumer Secret</label>
                    <input
                      name="consumerSecret"
                      type="password"
                      value={form.consumerSecret}
                      onChange={handleChange}
                      required
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3.5 font-mono text-[13px] text-foreground transition-shadow placeholder:text-muted-foreground/50 focus:border-foreground focus:bg-card focus:outline-none focus:ring-4 focus:ring-foreground/5"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced — collapsed */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={cn('transition-transform', showAdvanced && 'rotate-180')}
                  />
                  Advanced settings
                </button>
                {showAdvanced && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Webhook Secret</label>
                    <input
                      name="webhookSecret"
                      value={form.webhookSecret}
                      onChange={handleChange}
                      placeholder="Optional — for verifying webhooks"
                      className="h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/5"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[15px] font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plugs size={18} weight="bold" />
                  Connect store
                </>
              )}
            </button>

            {/* Trust */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
              <Lock size={12} weight="bold" />
              Credentials encrypted end-to-end
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
