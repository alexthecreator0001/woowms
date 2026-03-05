import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
  CaretDown,
  Info,
  Barcode,
  ListNumbers,
  MapPin,
  Image,
  Scales,
  UserCircle,
  SortAscending,
  ArrowRight,
  Camera,
  Package,
  ClipboardText,
  SpeakerHigh,
  Vibrate,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface MobileSettings {
  pickingMode: 'single' | 'batch';
  maxBatchSize: number;
  useBins: boolean;
  requireBarcodeScan: boolean;
  allowPartialPicks: boolean;
  allowSkipItems: boolean;
  autoAssignNextList: boolean;
  showProductImages: boolean;
  showProductWeight: boolean;
  showCustomerInfo: boolean;
  priorityBasedQueue: boolean;
  requirePhotoOnDamage: boolean;
  enableReceivingOnMobile: boolean;
  enableInventoryCount: boolean;
  pickConfirmation: 'scan_only' | 'tap_only' | 'scan_or_tap';
  defaultSortOrder: 'bin_location' | 'sku' | 'product_name';
  soundOnScan: boolean;
  vibrationOnScan: boolean;
  autoAdvanceToNext: boolean;
  theme: 'system' | 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

const DEFAULTS: MobileSettings = {
  pickingMode: 'single',
  maxBatchSize: 10,
  useBins: true,
  requireBarcodeScan: false,
  allowPartialPicks: true,
  allowSkipItems: true,
  autoAssignNextList: false,
  showProductImages: true,
  showProductWeight: false,
  showCustomerInfo: false,
  priorityBasedQueue: true,
  requirePhotoOnDamage: false,
  enableReceivingOnMobile: false,
  enableInventoryCount: false,
  pickConfirmation: 'scan_or_tap',
  defaultSortOrder: 'bin_location',
  soundOnScan: true,
  vibrationOnScan: true,
  autoAdvanceToNext: true,
  theme: 'system',
  fontSize: 'medium',
};

function Toggle({
  value,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon?: PhosphorIcon;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg"
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted/60">
            <Icon size={15} weight="duotone" className="text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={cn(
          'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors ml-4',
          value ? 'bg-primary' : 'bg-border'
        )}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            value ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  );
}

export default function MobileAppSection() {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/account/mobile-settings')
      .then(({ data }) => {
        setSettings({ ...DEFAULTS, ...(data.data || {}) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof MobileSettings>(key: K, value: MobileSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/mobile-settings', settings);
      setMsg('Mobile app settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save mobile app settings');
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
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-500/5 border border-blue-200/40 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-700">These settings control the Android mobile app</p>
          <p className="mt-0.5 text-xs text-blue-600/70">
            Changes take effect the next time a picker logs in or refreshes the app. Settings marked with a star can be overridden by individual users on their device.
          </p>
        </div>
      </div>

      {/* Card 1: Picking Mode */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Picking Mode</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How pickers process orders on the mobile app.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => update('pickingMode', 'single')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                settings.pickingMode === 'single'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-border hover:bg-muted/20'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                settings.pickingMode === 'single' ? 'bg-primary/10' : 'bg-muted/60'
              )}>
                <ClipboardText size={18} weight="duotone" className={settings.pickingMode === 'single' ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-semibold">Single order</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Pick one order at a time. Simple and focused.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => update('pickingMode', 'batch')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                settings.pickingMode === 'batch'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-border hover:bg-muted/20'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                settings.pickingMode === 'batch' ? 'bg-primary/10' : 'bg-muted/60'
              )}>
                <ListNumbers size={18} weight="duotone" className={settings.pickingMode === 'batch' ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-semibold">Batch picking</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Pick multiple orders in one walk. Faster for high volume.</p>
              </div>
            </button>
          </div>

          {settings.pickingMode === 'batch' && (
            <div className="flex items-center gap-3 pt-1">
              <label className="text-sm font-medium whitespace-nowrap">Max orders per batch</label>
              <input
                type="number"
                min={2}
                max={50}
                value={settings.maxBatchSize}
                onChange={(e) => update('maxBatchSize', Math.max(2, Math.min(50, parseInt(e.target.value) || 10)))}
                className="h-10 w-24 rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Pick Confirmation */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Pick Confirmation</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How pickers confirm they've picked the correct item.
          </p>
        </div>
        <div className="p-6">
          <div className="relative">
            <select
              value={settings.pickConfirmation}
              onChange={(e) => update('pickConfirmation', e.target.value as MobileSettings['pickConfirmation'])}
              className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="scan_or_tap">Barcode scan or manual tap (flexible)</option>
              <option value="scan_only">Barcode scan only (strict)</option>
              <option value="tap_only">Manual tap only (no scanner needed)</option>
            </select>
            <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {settings.pickConfirmation === 'scan_only' && 'Pickers must scan the product barcode — no manual override allowed. Highest accuracy.'}
            {settings.pickConfirmation === 'tap_only' && 'Pickers tap to confirm — no barcode scanner required. Fastest but less accurate.'}
            {settings.pickConfirmation === 'scan_or_tap' && 'Pickers can scan the barcode or tap to confirm. Good balance of speed and accuracy.'}
          </p>
        </div>
      </div>

      {/* Card 3: Picking Workflow */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Picking Workflow</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Control what pickers can and can't do during a pick.
          </p>
        </div>
        <div className="p-2">
          <Toggle
            icon={MapPin}
            value={settings.useBins}
            onChange={(v) => update('useBins', v)}
            label="Show bin locations"
            description="Display bin/shelf locations on pick items (e.g. A-01-03-02)"
          />
          <Toggle
            icon={Barcode}
            value={settings.requireBarcodeScan}
            onChange={(v) => update('requireBarcodeScan', v)}
            label="Require barcode scan to start"
            description="Picker must scan the bin barcode before picking items from it"
          />
          <Toggle
            icon={ListNumbers}
            value={settings.allowPartialPicks}
            onChange={(v) => update('allowPartialPicks', v)}
            label="Allow partial picks"
            description="Let pickers pick less than the full quantity (e.g. short stock)"
          />
          <Toggle
            icon={ArrowRight}
            value={settings.allowSkipItems}
            onChange={(v) => update('allowSkipItems', v)}
            label="Allow skipping items"
            description="Pickers can skip an item and come back to it later"
          />
          <Toggle
            icon={ArrowRight}
            value={settings.autoAssignNextList}
            onChange={(v) => update('autoAssignNextList', v)}
            label="Auto-assign next pick list"
            description="Automatically assign the next pending pick list when current one is completed"
          />
          <Toggle
            icon={SortAscending}
            value={settings.priorityBasedQueue}
            onChange={(v) => update('priorityBasedQueue', v)}
            label="Priority-based queue"
            description="Show high-priority orders first in the pick list queue"
          />
          <Toggle
            icon={Camera}
            value={settings.requirePhotoOnDamage}
            onChange={(v) => update('requirePhotoOnDamage', v)}
            label="Require photo on damage/shortage"
            description="Picker must take a photo when reporting damaged or short items"
          />
        </div>
      </div>

      {/* Card 4: Display Options */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Display Options</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            What information is shown to pickers on the mobile app.
          </p>
        </div>
        <div className="p-2">
          <Toggle
            icon={Image}
            value={settings.showProductImages}
            onChange={(v) => update('showProductImages', v)}
            label="Show product images"
            description="Display product thumbnail on pick list items"
          />
          <Toggle
            icon={Scales}
            value={settings.showProductWeight}
            onChange={(v) => update('showProductWeight', v)}
            label="Show product weight"
            description="Display weight and dimensions on pick list items"
          />
          <Toggle
            icon={UserCircle}
            value={settings.showCustomerInfo}
            onChange={(v) => update('showCustomerInfo', v)}
            label="Show customer info"
            description="Display customer name and notes on the pick list"
          />
        </div>
      </div>

      {/* Card 5: Additional Modules */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Mobile Modules</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enable additional modules beyond picking on the mobile app.
          </p>
        </div>
        <div className="p-2">
          <Toggle
            icon={Package}
            value={settings.enableReceivingOnMobile}
            onChange={(v) => update('enableReceivingOnMobile', v)}
            label="Receiving (PO receiving)"
            description="Allow staff to receive purchase orders and scan items into stock from the mobile app"
          />
          <Toggle
            icon={ClipboardText}
            value={settings.enableInventoryCount}
            onChange={(v) => update('enableInventoryCount', v)}
            label="Inventory counts"
            description="Allow staff to perform cycle counts and stock audits from the mobile app"
          />
        </div>
      </div>

      {/* Card 6: User-Overridable Defaults */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">User-Overridable Defaults</h3>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
              Overridable
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These are defaults for all users. Individual pickers can change these on their device.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default item sort order</label>
            <div className="relative">
              <select
                value={settings.defaultSortOrder}
                onChange={(e) => update('defaultSortOrder', e.target.value as MobileSettings['defaultSortOrder'])}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="bin_location">By bin location (efficient walk path)</option>
                <option value="sku">By SKU (alphabetical)</option>
                <option value="product_name">By product name</option>
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Default theme</label>
            <div className="relative">
              <select
                value={settings.theme}
                onChange={(e) => update('theme', e.target.value as MobileSettings['theme'])}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="system">System default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Default font size</label>
            <div className="relative">
              <select
                value={settings.fontSize}
                onChange={(e) => update('fontSize', e.target.value as MobileSettings['fontSize'])}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 p-2">
          <Toggle
            icon={SpeakerHigh}
            value={settings.soundOnScan}
            onChange={(v) => update('soundOnScan', v)}
            label="Sound on scan"
            description="Play a confirmation sound when barcode is scanned"
          />
          <Toggle
            icon={Vibrate}
            value={settings.vibrationOnScan}
            onChange={(v) => update('vibrationOnScan', v)}
            label="Vibration on scan"
            description="Vibrate device when barcode is scanned"
          />
          <Toggle
            icon={ArrowRight}
            value={settings.autoAdvanceToNext}
            onChange={(v) => update('autoAdvanceToNext', v)}
            label="Auto-advance to next item"
            description="Automatically move to the next pick item after confirming"
          />
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
          Save mobile settings
        </button>
      </div>
    </div>
  );
}
