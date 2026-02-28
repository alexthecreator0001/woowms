import { useState, useEffect, type FormEvent } from 'react';
import { CircleNotch, Check } from '@phosphor-icons/react';
import api from '../../services/api';

export default function BrandingSection() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setCompanyName(data.data.tenantName || ''))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      await api.patch('/account/branding', { companyName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to update company name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold">Company name</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This name appears in the sidebar and throughout the app. Changing it updates the branding for all team members.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label htmlFor="companyName" className="text-sm font-medium">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Acme Inc."
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : saved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              'Save'
            )}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold">Sidebar avatar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The sidebar shows the first letter of your company name as an avatar. Custom logo uploads are coming soon.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {(companyName || 'P').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-muted-foreground">{companyName || 'PickNPack'}</span>
        </div>
      </div>
    </div>
  );
}
