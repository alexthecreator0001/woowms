import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Link,
  Key,
  Shield,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import api from '../../services/api.js';

const formFields = [
  { name: 'name', label: 'Store Name', placeholder: 'My WooCommerce Store', icon: Store },
  { name: 'url', label: 'Store URL', placeholder: 'https://mystore.com', icon: Link },
  { name: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', icon: Key },
  { name: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', icon: Shield, type: 'password' },
  { name: 'webhookSecret', label: 'Webhook Secret (optional)', placeholder: 'For verifying incoming webhooks', icon: Shield, required: false },
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
      setTimeout(() => completeOnboarding(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect store');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="h-px w-8 bg-primary" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">2</div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            {success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <Store className="h-6 w-6 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {success ? 'Store connected!' : 'Connect your store'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {success
              ? 'Setting up your workspace...'
              : 'Link your WooCommerce store to start managing orders and inventory.'
            }
          </p>
        </div>

        {!success && (
          <>
            {/* Form Card */}
            <div className="rounded-xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-4">
                <h3 className="text-sm font-semibold">WooCommerce API Credentials</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Find these in WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API
                </p>
              </div>

              {error && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formFields.map((field) => {
                  const FieldIcon = field.icon;
                  return (
                    <div key={field.name}>
                      <label className="mb-1.5 block text-[13px] font-medium">{field.label}</label>
                      <div className="relative">
                        <FieldIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          name={field.name}
                          type={field.type || 'text'}
                          value={form[field.name]}
                          onChange={handleChange}
                          required={field.required !== false}
                          placeholder={field.placeholder}
                          className="h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
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

            {/* Skip */}
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip for now
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
