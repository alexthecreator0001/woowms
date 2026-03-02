import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

type UnitSystem = 'metric' | 'imperial';
type PalletType = 'EUR' | 'GMA';

export default function UnitsSection() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [palletType, setPalletType] = useState<PalletType>('GMA');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (settings.unitSystem === 'metric' || settings.unitSystem === 'imperial') {
          setUnitSystem(settings.unitSystem);
        }
        if (settings.palletType === 'EUR' || settings.palletType === 'GMA') {
          setPalletType(settings.palletType);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { unitSystem, palletType });
      setMsg('Unit settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save unit settings');
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

  return (
    <div className="space-y-6">
      {/* Card 1: Unit System */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Unit System</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose between metric and imperial measurements for your warehouse.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                unitSystem === 'metric'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Metric
              <span className="ml-1.5 text-xs text-muted-foreground">(m, kg, cm)</span>
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                unitSystem === 'imperial'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Imperial
              <span className="ml-1.5 text-xs text-muted-foreground">(ft, lb, in)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Pallet Type */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Pallet Type</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Default pallet dimensions used for pallet rack and pallet storage elements.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setPalletType('EUR')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                palletType === 'EUR'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EUR Pallet
              <span className="ml-1.5 text-xs text-muted-foreground">(800x1200mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setPalletType('GMA')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                palletType === 'GMA'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              GMA Pallet
              <span className="ml-1.5 text-xs text-muted-foreground">(48x40in)</span>
            </button>
          </div>
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
