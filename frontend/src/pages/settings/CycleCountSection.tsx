import { useState, useEffect } from 'react';
import { CircleNotch, EyeSlash } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

export default function CycleCountSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultBlindCount, setDefaultBlindCount] = useState(false);
  const [defaultCountType, setDefaultCountType] = useState('ZONE');

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const settings = data.data?.tenantSettings || {};
        setDefaultBlindCount(settings.defaultBlindCount || false);
        setDefaultCountType(settings.defaultCountType || 'ZONE');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    try {
      setSaving(true);
      await api.patch('/account/tenant-settings', {
        defaultBlindCount,
        defaultCountType,
      });
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-5">
        {/* Default blind count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeSlash size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Default blind count</p>
              <p className="text-xs text-muted-foreground">New counts will default to blind counting</p>
            </div>
          </div>
          <button
            onClick={() => setDefaultBlindCount(!defaultBlindCount)}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              defaultBlindCount ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200',
              defaultBlindCount ? 'translate-x-5' : 'translate-x-0'
            )} />
          </button>
        </div>

        {/* Default count type */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Default count type</label>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1 max-w-sm">
            {(['ZONE', 'LOCATION', 'PRODUCT'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDefaultCountType(t)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  defaultCountType === t
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'ZONE' ? 'Zone' : t === 'LOCATION' ? 'Location' : 'Product'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {saving && <CircleNotch size={14} className="animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}
