import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
  ArrowsClockwise,
  PlugsConnected,
  Warning,
} from '@phosphor-icons/react';
import { Truck, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface ShippingMethod {
  methodId: string;
  title: string;
  methodType: string;
  enabled: boolean;
  zoneName: string;
}

interface MappingRow {
  wooMethodId: string;
  wooMethodTitle: string;
  providerCarrier: string;
  providerService: string;
}

interface Carrier {
  id: string;
  name: string;
}

const PROVIDERS = [
  { value: '', label: 'None' },
  { value: 'shippo', label: 'Shippo' },
  { value: 'shipstation', label: 'ShipStation API' },
  { value: 'sendcloud', label: 'SendCloud' },
];

export default function ShippingSection() {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validateMsg, setValidateMsg] = useState('');

  const [wooMethods, setWooMethods] = useState<ShippingMethod[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [fetchingWoo, setFetchingWoo] = useState(false);
  const [savingMappings, setSavingMappings] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Get store's shipping provider
        const { data: storesRes } = await api.get('/stores');
        const stores = storesRes.data || [];
        if (stores.length > 0) {
          const store = stores[0];
          if (store.shippingProvider) {
            setProvider(store.shippingProvider);
            setConnected(true);
            setHasStoredKey(!!store.hasShippingApiKey);
          }
        }

        // Get existing mappings
        const { data: mappingsRes } = await api.get('/shipping-config/mappings');
        if (mappingsRes.data?.length) {
          setMappings(mappingsRes.data.map((m: any) => ({
            wooMethodId: m.wooMethodId,
            wooMethodTitle: m.wooMethodTitle,
            providerCarrier: m.providerCarrier || '',
            providerService: m.providerService || '',
          })));
        }

        // Get carriers if connected
        try {
          const { data: carriersRes } = await api.get('/shipping-config/carriers');
          setCarriers(carriersRes.data || []);
        } catch { /* no provider connected */ }
      } catch (err) {
        console.error('Failed to load shipping config:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleValidate = async () => {
    if (!provider || !apiKey) return;
    setValidating(true);
    setValidateMsg('');
    try {
      const { data } = await api.post('/shipping-config/validate', { provider, apiKey });
      if (data.data.valid) {
        // Save the provider + key
        await api.patch('/shipping-config/store', { shippingProvider: provider, shippingApiKey: apiKey });
        setConnected(true);
        setHasStoredKey(true);
        setValidateMsg('Connected successfully');
        setApiKey('');
        // Fetch carriers
        const { data: carriersRes } = await api.get('/shipping-config/carriers');
        setCarriers(carriersRes.data || []);
      } else {
        setValidateMsg('Invalid API key');
      }
    } catch {
      setValidateMsg('Connection failed');
    } finally {
      setValidating(false);
      setTimeout(() => setValidateMsg(''), 4000);
    }
  };

  const handleDisconnect = async () => {
    await api.patch('/shipping-config/store', { shippingProvider: null, shippingApiKey: null });
    setProvider('');
    setConnected(false);
    setHasStoredKey(false);
    setCarriers([]);
  };

  const handleFetchWooMethods = async () => {
    setFetchingWoo(true);
    try {
      const { data } = await api.get('/shipping-config/woo-methods');
      const methods = (data.data || []) as ShippingMethod[];
      setWooMethods(methods);

      // Merge with existing mappings
      const existing = new Map(mappings.map((m) => [m.wooMethodId, m]));
      const merged = methods
        .filter((m) => m.enabled)
        .map((m) => existing.get(m.methodId) || {
          wooMethodId: m.methodId,
          wooMethodTitle: m.title,
          providerCarrier: '',
          providerService: '',
        });
      setMappings(merged);
    } catch (err) {
      console.error('Failed to fetch WooCommerce methods:', err);
    } finally {
      setFetchingWoo(false);
    }
  };

  const handleSaveMappings = async () => {
    setSavingMappings(true);
    setSaveMsg('');
    try {
      await api.put('/shipping-config/mappings', { mappings });
      setSaveMsg('Mappings saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSavingMappings(false);
    }
  };

  const updateMapping = (idx: number, field: keyof MappingRow, value: string) => {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
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
      {/* Card 1: Shipping Provider */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Shipping Provider</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Connect a shipping label provider to generate labels directly from the app.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {connected ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <PlugsConnected className="h-4 w-4 text-emerald-600" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {PROVIDERS.find((p) => p.value === provider)?.label || provider}
                    </p>
                    <p className="text-xs text-emerald-600/70">Connected</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  Disconnect
                </button>
              </div>
              {/* Update API key section */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasStoredKey ? 'API key saved (enter new to update)' : 'Enter your API key'}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <button
                    onClick={handleValidate}
                    disabled={!apiKey || validating}
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-muted/60 disabled:opacity-50"
                  >
                    {validating ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" weight="bold" />}
                    Update Key
                  </button>
                  {validateMsg && (
                    <span className={cn('text-xs font-medium', validateMsg.includes('success') ? 'text-emerald-600' : 'text-destructive')}>
                      {validateMsg}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleValidate}
                  disabled={!provider || !apiKey || validating}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {validating ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" weight="bold" />}
                  Test & Connect
                </button>
                {validateMsg && (
                  <span className={cn('text-xs font-medium', validateMsg.includes('success') ? 'text-emerald-600' : 'text-destructive')}>
                    {validateMsg}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card 2: Shipping Method Mapping */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold">Shipping Method Mapping</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pair your WooCommerce shipping methods with carrier services.
            </p>
          </div>
          <button
            onClick={handleFetchWooMethods}
            disabled={fetchingWoo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-muted/60 disabled:opacity-50"
          >
            {fetchingWoo ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <ArrowsClockwise className="h-3.5 w-3.5" />}
            Refresh from WooCommerce
          </button>
        </div>
        <div className="p-6">
          {mappings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Truck className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No shipping methods loaded yet.</p>
              <button
                onClick={handleFetchWooMethods}
                disabled={fetchingWoo}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm"
              >
                {fetchingWoo ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <ArrowsClockwise className="h-3.5 w-3.5" />}
                Fetch from WooCommerce
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mappings.map((mapping, idx) => (
                <div
                  key={mapping.wooMethodId}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{mapping.wooMethodTitle}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{mapping.wooMethodId}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    {carriers.length > 0 ? (
                      <select
                        value={mapping.providerCarrier}
                        onChange={(e) => updateMapping(idx, 'providerCarrier', e.target.value)}
                        className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-sm"
                      >
                        <option value="">— Select carrier —</option>
                        {carriers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600">
                        <Warning className="h-3.5 w-3.5" />
                        Connect a provider first
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                {saveMsg && (
                  <span className={cn('text-xs font-medium', saveMsg.includes('saved') ? 'text-emerald-600' : 'text-destructive')}>
                    {saveMsg}
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSaveMappings}
                    disabled={savingMappings}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingMappings && <CircleNotch className="h-4 w-4 animate-spin" />}
                    Save Mappings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
