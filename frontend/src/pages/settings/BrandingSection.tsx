import { useState, useEffect, type FormEvent } from 'react';
import { CircleNotch, Check, ImageSquare } from '@phosphor-icons/react';
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

  const initial = (companyName || 'P').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Company name */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Company name</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Displayed in the sidebar and used across the app for all team members.
          </p>
        </div>
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label htmlFor="companyName" className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Acme Inc."
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
      </div>

      {/* Sidebar preview */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Sidebar preview</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your company appears in the navigation sidebar.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="inline-flex items-center gap-2.5 rounded-lg border border-border/60 bg-[#fafafa] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
              {initial}
            </div>
            <span className="text-[13px] font-semibold text-[#0a0a0a]">{companyName || 'PickNPack'}</span>
          </div>
        </div>
      </div>

      {/* Logo upload — coming soon */}
      <div className="rounded-xl border border-dashed border-border/60 bg-card shadow-sm">
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ImageSquare size={24} weight="duotone" className="text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-semibold">Custom logo</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your company logo to replace the initial avatar in the sidebar.
          </p>
          <span className="mt-3 inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
