import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  ArrowRight,
  CircleNotch,
  CheckCircle,
  GearSix,
  CaretDown,
  CurrencyDollar,
  Coins,
  Package,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import Logo from '../../components/Logo';

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
        reverseStatusMapping: statusMapping,
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

  // Loading state
  if (loading) {
    return (
      <div className="grain flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <CircleNotch size={32} className="mx-auto animate-spin text-[#a0a0a0]" />
          <p className="mt-4 text-[14px] text-[#8a8a8a]">Loading store configuration...</p>
        </div>
      </div>
    );
  }

  const enabledGateways = paymentGateways.filter(g => g.enabled);
  const enabledShipping = shippingMethods.filter(m => m.enabled);

  return (
    <div className="grain relative flex min-h-screen flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center">
          <Logo width={120} className="text-[#0a0a0a]" />
        </div>
        {/* Steps */}
        <div className="flex items-center gap-3 text-[13px]">
          <span className="flex items-center gap-1.5 text-[#a0a0a0]">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Account
          </span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="flex items-center gap-1.5 text-[#a0a0a0]">
            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
            Connect store
          </span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="font-semibold text-[#0a0a0a]">Store config</span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="text-[#c5c5c5]">Warehouse setup</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:pt-4">
        <div className="w-full max-w-[560px]">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">
              Configure your store
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
              We fetched your WooCommerce settings. Review and configure how they map to your warehouse.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={16} weight="bold" className="text-[#6b6b6b]" />
              <span className="text-[13px] font-semibold text-[#0a0a0a]">Payment Methods</span>
            </div>

            {enabledGateways.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-[#e5e5e5] bg-white py-8">
                <CreditCard size={28} weight="duotone" className="mb-2 text-[#c5c5c5]" />
                <p className="text-[13px] text-[#a0a0a0]">No payment methods found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enabledGateways.map((gw) => (
                  <div
                    key={gw.id}
                    className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#0a0a0a]">{gw.title}</p>
                      <p className="text-[12px] text-[#a0a0a0]">{gw.id}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setPaymentConfig((prev) => ({
                            ...prev,
                            [gw.id]: { isPaid: true },
                          }))
                        }
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all',
                          paymentConfig[gw.id]?.isPaid !== false
                            ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                            : 'bg-[#f5f5f5] text-[#a0a0a0] hover:bg-[#efefef]'
                        )}
                      >
                        <CurrencyDollar size={14} weight="bold" />
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
                          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all',
                          paymentConfig[gw.id]?.isPaid === false
                            ? 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20'
                            : 'bg-[#f5f5f5] text-[#a0a0a0] hover:bg-[#efefef]'
                        )}
                      >
                        <Coins size={14} weight="bold" />
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
            <div className="mb-3 flex items-center gap-2">
              <Truck size={16} weight="bold" className="text-[#6b6b6b]" />
              <span className="text-[13px] font-semibold text-[#0a0a0a]">Shipping Methods</span>
            </div>

            {enabledShipping.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-[#e5e5e5] bg-white py-8">
                <Package size={28} weight="duotone" className="mb-2 text-[#c5c5c5]" />
                <p className="text-[13px] text-[#a0a0a0]">No shipping methods found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enabledShipping.map((method) => (
                  <div
                    key={method.methodId}
                    className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#0a0a0a]">{method.title}</p>
                      <p className="text-[12px] text-[#a0a0a0]">
                        {method.zoneName} &middot; {method.methodType}
                      </p>
                    </div>
                    <span className="rounded-lg bg-[#f5f5f5] px-2.5 py-1 text-[11px] font-semibold text-[#8a8a8a]">
                      Map in Settings
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2.5 text-[12px] leading-relaxed text-[#a0a0a0]">
              Shipping method carrier mapping can be configured in Settings after connecting a shipping provider.
            </p>
          </div>

          {/* Order Status Mapping */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <ArrowsLeftRight size={16} weight="bold" className="text-[#6b6b6b]" />
              <span className="text-[13px] font-semibold text-[#0a0a0a]">Order Status Mapping</span>
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-[#a0a0a0]">
              When the app updates an order status, which WooCommerce status should it push back?
            </p>

            <div className="rounded-xl border border-[#e5e5e5] bg-white">
              {APP_STATUSES.map((appStatus, index) => (
                <div
                  key={appStatus.value}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    index < APP_STATUSES.length - 1 && 'border-b border-[#f0f0f0]'
                  )}
                >
                  <span className="w-24 text-[13px] font-semibold text-[#0a0a0a]">
                    {appStatus.label}
                  </span>
                  <ArrowRight size={14} weight="bold" className="text-[#c5c5c5]" />
                  <div className="relative flex-1">
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
                      className="w-full appearance-none rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 pr-8 text-[13px] text-[#0a0a0a] transition-all focus:border-[#0a0a0a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                    >
                      <option value="">-- Don't push --</option>
                      {orderStatuses.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a0a0a0]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save & Continue */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] text-[15px] font-semibold text-white transition-all hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            {saving ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <GearSix size={18} weight="bold" />
                Save & Continue
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
