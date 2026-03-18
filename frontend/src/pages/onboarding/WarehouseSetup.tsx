import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CircleNotch,
  CheckCircle,
  Check,
  Cube,
  Ruler,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import Logo from '../../components/Logo';

type UnitSystem = 'metric' | 'imperial';
type PalletType = 'EUR' | 'GMA';

export default function WarehouseSetup() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [palletType, setPalletType] = useState<PalletType>('GMA');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleUnitChange = (unit: UnitSystem) => {
    setUnitSystem(unit);
    // Auto-select pallet type based on unit system
    setPalletType(unit === 'metric' ? 'EUR' : 'GMA');
  };

  const completeOnboarding = async () => {
    try {
      const { data } = await api.post('/auth/complete-onboarding');
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
    } catch {}
    navigate('/');
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { unitSystem, palletType });
      await completeOnboarding();
    } catch {
      // If settings save fails, still try to complete onboarding
      await completeOnboarding();
    } finally {
      setSaving(false);
    }
  };

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
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Connect store
          </span>
          <span className="text-muted-foreground/30">/</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Store config
          </span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-semibold text-foreground">Warehouse setup</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[520px]">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
              Set up your warehouse
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Choose your measurement system and pallet type. These defaults will be used across the app.
            </p>
          </div>

          {/* Unit system */}
          <div className="mb-6">
            <label className="mb-2.5 block text-[13px] font-semibold text-foreground">
              Unit system
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUnitChange('metric')}
                className={cn(
                  'relative rounded-xl border bg-card p-4 text-left transition-all',
                  unitSystem === 'metric'
                    ? 'border-foreground shadow-sm'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {unitSystem === 'metric' && (
                  <div className="absolute right-3 top-3">
                    <Check size={16} weight="bold" className="text-foreground" />
                  </div>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Ruler size={18} className="text-muted-foreground" />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-foreground">Metric</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Meters, kilograms, centimeters</p>
              </button>

              <button
                type="button"
                onClick={() => handleUnitChange('imperial')}
                className={cn(
                  'relative rounded-xl border bg-card p-4 text-left transition-all',
                  unitSystem === 'imperial'
                    ? 'border-foreground shadow-sm'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {unitSystem === 'imperial' && (
                  <div className="absolute right-3 top-3">
                    <Check size={16} weight="bold" className="text-foreground" />
                  </div>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Ruler size={18} className="text-muted-foreground" />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-foreground">Imperial</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Feet, pounds, inches</p>
              </button>
            </div>
          </div>

          {/* Pallet type */}
          <div className="mb-8">
            <label className="mb-2.5 block text-[13px] font-semibold text-foreground">
              Pallet type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPalletType('EUR')}
                className={cn(
                  'relative rounded-xl border bg-card p-4 text-left transition-all',
                  palletType === 'EUR'
                    ? 'border-foreground shadow-sm'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {palletType === 'EUR' && (
                  <div className="absolute right-3 top-3">
                    <Check size={16} weight="bold" className="text-foreground" />
                  </div>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Cube size={18} className="text-muted-foreground" />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-foreground">EUR Pallet</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">800 x 1200 mm (European standard)</p>
              </button>

              <button
                type="button"
                onClick={() => setPalletType('GMA')}
                className={cn(
                  'relative rounded-xl border bg-card p-4 text-left transition-all',
                  palletType === 'GMA'
                    ? 'border-foreground shadow-sm'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {palletType === 'GMA' && (
                  <div className="absolute right-3 top-3">
                    <Check size={16} weight="bold" className="text-foreground" />
                  </div>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Cube size={18} className="text-muted-foreground" />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-foreground">GMA Pallet</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">48 x 40 in (North American standard)</p>
              </button>
            </div>
          </div>

          {/* Continue button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[15px] font-semibold text-white transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} weight="bold" />
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
