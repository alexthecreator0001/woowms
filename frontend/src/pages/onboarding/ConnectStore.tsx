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
import type { AxiosError } from 'axios';

export default function ConnectStore() {
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const completeOnboarding = async () => {
    try {
      const { data } = await api.post('/auth/complete-onboarding');
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
    } catch {}
    navigate('/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/stores', form);
      setSuccess(true);
      setTimeout(() => completeOnboarding(), 2000);
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to connect store');
    } finally {
      setSaving(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="grain font-display flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <CheckCircle size={48} weight="fill" className="mx-auto mb-4 text-emerald-500" />
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0a0a0a]">You're all set</h1>
          <p className="mt-2 text-[15px] text-[#6b6b6b]">Your store is connected. Redirecting...</p>
          <CircleNotch size={20} className="mx-auto mt-6 animate-spin text-[#a0a0a0]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grain font-display relative flex min-h-screen flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a]">
            <span className="text-[13px] font-extrabold text-white">P</span>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#0a0a0a]">PickNPack</span>
        </div>
        {/* Steps */}
        <div className="flex items-center gap-3 text-[13px]">
          <span className="flex items-center gap-1.5 text-[#a0a0a0]">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Account
          </span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="font-semibold text-[#0a0a0a]">Connect store</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[480px]">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">Connect your store</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
              Paste your WooCommerce API credentials. We'll sync your orders, products, and inventory automatically.
            </p>
          </div>

          {/* How-to hint */}
          <div className="mb-6 rounded-xl border border-[#e5e5e5] bg-white p-4">
            <p className="text-[13px] leading-relaxed text-[#6b6b6b]">
              <span className="font-semibold text-[#0a0a0a]">Where to find your keys: </span>
              In your WordPress admin, go to{' '}
              <span className="rounded bg-[#f5f5f5] px-1.5 py-0.5 font-mono text-[12px] text-[#0a0a0a]">WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API</span>{' '}
              and create a new key with Read/Write access.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Store basics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Store name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="My Store"
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Store URL</label>
                  <input
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    required
                    placeholder="https://mystore.com"
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                  />
                </div>
              </div>

              {/* API Keys — visual grouping */}
              <div className="rounded-xl border border-[#e5e5e5] bg-white">
                <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-4 py-3">
                  <Key size={15} weight="bold" className="text-[#6b6b6b]" />
                  <span className="text-[13px] font-semibold text-[#0a0a0a]">API credentials</span>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#6b6b6b]">Consumer Key</label>
                    <input
                      name="consumerKey"
                      value={form.consumerKey}
                      onChange={handleChange}
                      required
                      placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3.5 font-mono text-[13px] text-[#0a0a0a] transition-shadow placeholder:text-[#c0c0c0] focus:border-[#0a0a0a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[#6b6b6b]">Consumer Secret</label>
                    <input
                      name="consumerSecret"
                      type="password"
                      value={form.consumerSecret}
                      onChange={handleChange}
                      required
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3.5 font-mono text-[13px] text-[#0a0a0a] transition-shadow placeholder:text-[#c0c0c0] focus:border-[#0a0a0a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced — collapsed */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#8a8a8a] transition-colors hover:text-[#0a0a0a]"
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
                    <label className="mb-1.5 block text-[13px] font-medium text-[#6b6b6b]">Webhook Secret</label>
                    <input
                      name="webhookSecret"
                      value={form.webhookSecret}
                      onChange={handleChange}
                      placeholder="Optional — for verifying webhooks"
                      className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] text-[15px] font-semibold text-white transition-all hover:bg-[#1a1a1a] disabled:opacity-50"
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
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[#a0a0a0]">
              <Lock size={12} weight="bold" />
              Credentials encrypted end-to-end
            </div>
          </form>

          {/* Skip */}
          <div className="mt-8 text-center">
            <button
              onClick={completeOnboarding}
              className="text-[13px] text-[#a0a0a0] transition-colors hover:text-[#6b6b6b]"
            >
              I'll connect later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
