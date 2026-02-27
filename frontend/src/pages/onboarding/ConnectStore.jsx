import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Globe,
  KeyRound,
  Lock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import api from '../../services/api.js';

const steps = [
  {
    num: '1',
    title: 'Open WooCommerce Settings',
    desc: 'Go to WooCommerce \u2192 Settings \u2192 Advanced \u2192 REST API',
  },
  {
    num: '2',
    title: 'Create an API Key',
    desc: 'Click "Add key", set permissions to Read/Write, then click Generate',
  },
  {
    num: '3',
    title: 'Paste your credentials below',
    desc: 'Copy the Consumer Key and Consumer Secret into the form',
  },
];

const whatYouGet = [
  { icon: ShoppingCart, text: 'Automatic order sync' },
  { icon: Package, text: 'Real-time inventory' },
  { icon: Truck, text: 'Shipping management' },
];

export default function ConnectStore() {
  const [form, setForm] = useState({ name: '', url: '', consumerKey: '', consumerSecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const completeOnboarding = async () => {
    try {
      const { data } = await api.post('/auth/complete-onboarding');
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
    } catch {}
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/stores', form);
      setSuccess(true);
      setTimeout(() => completeOnboarding(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect store');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store connected!</h1>
          <p className="mt-2 text-[15px] text-slate-500">Setting up your workspace...</p>
          <div className="mt-6">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Guide Panel */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'1\'/%3E%3C/svg%3E")' }} />
        {/* Glow */}
        <div className="absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute -left-20 bottom-1/3 h-[300px] w-[300px] rounded-full bg-blue-500/8 blur-[100px]" />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">PickNPack</span>
          </div>
        </div>

        {/* Steps Guide */}
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">How to connect</p>
          <h2 className="text-[24px] font-bold leading-tight tracking-tight text-white">
            Get your API keys<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">in 3 simple steps</span>
          </h2>

          <div className="mt-8 space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
                  {step.num}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{step.title}</p>
                  <p className="mt-0.5 text-[13px] text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What you unlock */}
          <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">What you'll unlock</p>
            <div className="mt-3 space-y-2.5">
              {whatYouGet.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-slate-500">
          Your credentials are encrypted and stored securely
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">PickNPack</span>
          </div>

          {/* Progress */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-400">Account</span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">2</div>
              <span className="text-xs font-semibold text-slate-900">Connect Store</span>
            </div>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Connect your store</h1>
          <p className="mt-1.5 text-[15px] text-slate-500">
            Link your WooCommerce store to start syncing orders and inventory.
          </p>

          {error && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Store Name & URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Store name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="My Store"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Store URL</label>
                <input
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  required
                  placeholder="https://mystore.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* API Keys section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">API Credentials</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Consumer Key</label>
                  <input
                    name="consumerKey"
                    value={form.consumerKey}
                    onChange={handleChange}
                    required
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Consumer Secret</label>
                  <input
                    name="consumerSecret"
                    type="password"
                    value={form.consumerSecret}
                    onChange={handleChange}
                    required
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Webhook Secret (collapsed) */}
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Advanced: Webhook Secret (optional)
              </summary>
              <div className="mt-3">
                <input
                  name="webhookSecret"
                  value={form.webhookSecret}
                  onChange={handleChange}
                  placeholder="For verifying incoming webhooks"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </details>

            <button
              type="submit"
              disabled={saving}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting your store...
                </>
              ) : (
                <>
                  Connect and continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3 w-3" />
            Your credentials are encrypted end-to-end
          </div>

          {/* Skip */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
