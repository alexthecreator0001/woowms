import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  CreditCard,
  RefreshCw,
  Loader2,
  Check,
  ArrowRight,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface ShippingMethod {
  methodId: string;
  title: string;
  methodType: string;
  enabled: boolean;
  zoneName: string;
}

interface PaymentGateway {
  id: string;
  title: string;
  enabled: boolean;
  isCod: boolean;
}

interface OrderStatus {
  slug: string;
  name: string;
  total: number;
}

interface PaymentConfig {
  [key: string]: { isPaid: boolean };
}

interface StatusMapping {
  [key: string]: string;
}

const APP_STATUSES = [
  { value: 'PICKED', label: 'Picked' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function StoreConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({});
  const [statusMapping, setStatusMapping] = useState<StatusMapping>({});

  useEffect(() => {
    async function load() {
      try {
        // Get the first store
        const { data: storesRes } = await api.get('/stores');
        const stores = storesRes.data;
        if (!stores || stores.length === 0) {
          navigate('/onboarding/connect-store');
          return;
        }
        const store = stores[0];
        setStoreId(store.id);

        // Fetch WooCommerce config
        const { data: configRes } = await api.get(`/stores/${store.id}/woo-config`);
        const config = configRes.data;

        setShippingMethods(config.shippingMethods || []);
        setPaymentGateways(config.paymentGateways || []);
        setOrderStatuses(config.orderStatuses || []);

        // Auto-detect payment types
        const autoPaymentConfig: PaymentConfig = {};
        for (const gw of config.paymentGateways || []) {
          autoPaymentConfig[gw.id] = { isPaid: !gw.isCod };
        }
        setPaymentConfig(autoPaymentConfig);
      } catch (err) {
        console.error('Failed to load WooCommerce config:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', {
        paymentMethods: paymentConfig,
        statusMapping,
        autoStatusPush: Object.keys(statusMapping).length > 0,
      });
      navigate('/onboarding/warehouse-setup');
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/warehouse-setup');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Step indicators */}
        <nav className="mb-8 flex items-center justify-center gap-3">
          {[
            { label: 'Account', done: true },
            { label: 'Connect store', done: true },
            { label: 'Store config', current: true },
            { label: 'Warehouse setup', done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    step.done
                      ? 'bg-primary text-primary-foreground'
                      : step.current
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium', step.current ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Configure your store</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We fetched your WooCommerce settings. Review and configure how they map to your warehouse.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Methods
            </h3>
            {paymentGateways.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payment gateways found.</p>
            ) : (
              <div className="space-y-2">
                {paymentGateways.filter(g => g.enabled).map((gw) => (
                  <div
                    key={gw.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{gw.title}</p>
                      <p className="text-xs text-muted-foreground">{gw.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setPaymentConfig((prev) => ({
                            ...prev,
                            [gw.id]: { isPaid: true },
                          }))
                        }
                        className={cn(
                          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                          paymentConfig[gw.id]?.isPaid !== false
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        Prepaid
                      </button>
                      <button
                        onClick={() =>
                          setPaymentConfig((prev) => ({
                            ...prev,
                            [gw.id]: { isPaid: false },
                          }))
                        }
                        className={cn(
                          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                          paymentConfig[gw.id]?.isPaid === false
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        COD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Methods */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Shipping Methods
            </h3>
            {shippingMethods.length === 0 ? (
              <p className="text-xs text-muted-foreground">No shipping methods found.</p>
            ) : (
              <div className="space-y-2">
                {shippingMethods.filter(m => m.enabled).map((method) => (
                  <div
                    key={method.methodId}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{method.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.zoneName} &middot; {method.methodType}
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Map in Settings
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Shipping method carrier mapping can be configured in Settings after connecting a shipping provider.
            </p>
          </div>

          {/* Order Status Mapping */}
          <div className="mb-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Order Status Mapping
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              When the app updates an order status, which WooCommerce status should it push back?
            </p>
            <div className="space-y-2">
              {APP_STATUSES.map((appStatus) => (
                <div
                  key={appStatus.value}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-2.5"
                >
                  <span className="w-24 text-sm font-medium">{appStatus.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={statusMapping[appStatus.value] || ''}
                    onChange={(e) =>
                      setStatusMapping((prev) => {
                        const next = { ...prev };
                        if (e.target.value) {
                          next[appStatus.value] = e.target.value;
                        } else {
                          delete next[appStatus.value];
                        }
                        return next;
                      })
                    }
                    className="flex-1 rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="">-- Don't push --</option>
                    {orderStatuses.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              I'll set this up later
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
