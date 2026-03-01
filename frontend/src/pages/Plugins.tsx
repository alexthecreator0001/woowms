import { useEffect, useState } from 'react';
import {
  Lightning,
  SlackLogo,
  ArrowLeft,
  Check,
  Copy,
  Key,
  Trash,
  ArrowsClockwise,
  Warning,
  Plug,
  Clock,
  ShieldCheck,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { PluginCatalogItem } from '../types';

// ─── Brand colors & icons for plugins ──────────────

const PLUGIN_BRANDS: Record<string, { color: string; bg: string; border: string }> = {
  zapier: { color: 'text-[#FF4A00]', bg: 'bg-[#FF4A00]/10', border: 'border-[#FF4A00]/20' },
  slack: { color: 'text-[#4A154B]', bg: 'bg-[#4A154B]/10', border: 'border-[#4A154B]/20' },
  quickbooks: { color: 'text-[#2CA01C]', bg: 'bg-[#2CA01C]/10', border: 'border-[#2CA01C]/20' },
  shipstation: { color: 'text-[#66BB47]', bg: 'bg-[#66BB47]/10', border: 'border-[#66BB47]/20' },
};

function PluginIcon({ pluginKey, size = 32 }: { pluginKey: string; size?: number }) {
  const brand = PLUGIN_BRANDS[pluginKey];
  const iconClass = cn('flex-shrink-0', brand?.color || 'text-[#6b6b6b]');

  switch (pluginKey) {
    case 'zapier':
      return <Lightning size={size} weight="fill" className={iconClass} />;
    case 'slack':
      return <SlackLogo size={size} weight="fill" className={iconClass} />;
    case 'quickbooks':
      return (
        <div className={cn('flex items-center justify-center rounded-lg', brand?.bg)} style={{ width: size + 8, height: size + 8 }}>
          <span className={cn('font-bold', brand?.color)} style={{ fontSize: size * 0.6 }}>QB</span>
        </div>
      );
    case 'shipstation':
      return (
        <div className={cn('flex items-center justify-center rounded-lg', brand?.bg)} style={{ width: size + 8, height: size + 8 }}>
          <span className={cn('font-bold', brand?.color)} style={{ fontSize: size * 0.6 }}>SS</span>
        </div>
      );
    default:
      return <Plug size={size} weight="fill" className={iconClass} />;
  }
}

// ─── Category filter ───────────────────────────────

const CATEGORIES = ['All', 'Automation', 'Notifications', 'Accounting', 'Shipping'];

// ─── Main component ────────────────────────────────

export default function Plugins() {
  const [plugins, setPlugins] = useState<PluginCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [apiKeyModal, setApiKeyModal] = useState<{ key: string; plaintext: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPlugins();
  }, []);

  async function loadPlugins() {
    try {
      setLoading(true);
      const { data } = await api.get('/plugins');
      setPlugins(data.data);
    } catch (err) {
      console.error('Failed to load plugins:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall(key: string) {
    try {
      setActionLoading(key);
      const { data } = await api.post(`/plugins/${key}/install`);
      const result = data.data;

      // Show API key modal if key was generated
      if (result.apiKey) {
        setApiKeyModal({ key, plaintext: result.apiKey });
      }

      await loadPlugins();
    } catch (err: any) {
      console.error('Install failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUninstall(key: string) {
    try {
      setActionLoading(key);
      await api.post(`/plugins/${key}/uninstall`);
      setConfiguring(null);
      setConfirmUninstall(false);
      await loadPlugins();
    } catch (err) {
      console.error('Uninstall failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegenerateKey(key: string) {
    try {
      setActionLoading(key);
      const { data } = await api.post(`/plugins/${key}/regenerate-key`);
      setApiKeyModal({ key, plaintext: data.data.apiKey });
      setConfirmRegenerate(false);
      await loadPlugins();
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveSettings(key: string) {
    try {
      setSavingSettings(true);
      await api.patch(`/plugins/${key}/settings`, settings);
      await loadPlugins();
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setSavingSettings(false);
    }
  }

  function openConfigure(plugin: PluginCatalogItem) {
    setConfiguring(plugin.key);
    setSettings(plugin.settings || {});
    setConfirmUninstall(false);
    setConfirmRegenerate(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = category === 'All' ? plugins : plugins.filter((p) => p.category === category);
  const configuringPlugin = plugins.find((p) => p.key === configuring);

  // ─── API Key Modal ─────────────────────────────────

  if (apiKeyModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Key size={20} weight="fill" className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0a0a0a]">Your API Key</h3>
              <p className="text-[13px] text-[#6b6b6b]">Save this key — you won't see it again</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Warning size={16} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-[12px] text-amber-800">
                This is the only time your full API key will be shown. Copy it now and store it securely.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
            <code className="block break-all text-[13px] font-mono text-[#0a0a0a]">
              {apiKeyModal.plaintext}
            </code>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(apiKeyModal.plaintext)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-4 py-2.5 text-[13px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
            <button
              onClick={() => setApiKeyModal(null)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              <ShieldCheck size={16} />
              I've Saved This Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Configure View ────────────────────────────────

  if (configuring && configuringPlugin) {
    const brand = PLUGIN_BRANDS[configuringPlugin.key];

    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setConfiguring(null)}
          className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b6b] transition-colors hover:text-[#0a0a0a]"
        >
          <ArrowLeft size={16} />
          Back to Plugins
        </button>

        {/* Plugin header */}
        <div className="mb-8 flex items-start gap-4">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl', brand?.bg || 'bg-[#f5f5f5]')}>
            <PluginIcon pluginKey={configuringPlugin.key} size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#0a0a0a]">{configuringPlugin.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Check size={12} weight="bold" />
                Installed
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6b6b6b]">{configuringPlugin.description}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* API Key card */}
          {configuringPlugin.requiresApiKey && (
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Key size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">API Key</h2>
              </div>

              <div className="mb-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <code className="text-[13px] font-mono text-[#0a0a0a]">
                    {configuringPlugin.apiKeyPrefix}{'••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => {
                      if (configuringPlugin.apiKeyPrefix) {
                        copyToClipboard(configuringPlugin.apiKeyPrefix + '••••');
                      }
                    }}
                    className="text-[#a0a0a0] transition-colors hover:text-[#0a0a0a]"
                    title="Copy prefix"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <p className="mb-4 text-[12px] text-[#a0a0a0]">
                Only the key prefix is shown. If you've lost your key, regenerate a new one.
              </p>

              {confirmRegenerate ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-3 text-[12px] text-amber-800">
                    This will invalidate the current key. Any Zapier integrations using the old key will stop working.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRegenerateKey(configuringPlugin.key)}
                      disabled={actionLoading === configuringPlugin.key}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                    >
                      {actionLoading === configuringPlugin.key ? 'Regenerating...' : 'Yes, Regenerate'}
                    </button>
                    <button
                      onClick={() => setConfirmRegenerate(false)}
                      className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6b6b6b] transition-colors hover:bg-[#f5f5f5]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRegenerate(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-[13px] font-medium text-[#6b6b6b] transition-colors hover:bg-[#f5f5f5]"
                >
                  <ArrowsClockwise size={14} />
                  Regenerate Key
                </button>
              )}
            </div>
          )}

          {/* Settings card */}
          {configuringPlugin.key === 'zapier' && (
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightning size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Webhook Settings</h2>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'sendOrderNotifications', label: 'Send order notifications' },
                  { key: 'sendLowStockAlerts', label: 'Send low stock alerts' },
                  { key: 'sendShippingUpdates', label: 'Send shipping updates' },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center justify-between">
                    <span className="text-[13px] text-[#0a0a0a]">{toggle.label}</span>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, [toggle.key]: !s[toggle.key] }))}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        (settings as any)[toggle.key] ? 'bg-primary' : 'bg-[#d4d4d4]'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
                          (settings as any)[toggle.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        )}
                      />
                    </button>
                  </label>
                ))}
              </div>

              <button
                onClick={() => handleSaveSettings(configuringPlugin.key)}
                disabled={savingSettings}
                className="mt-5 w-full rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Setup instructions */}
          {configuringPlugin.key === 'zapier' && (
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <ArrowSquareOut size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Setup Instructions</h2>
              </div>

              <div className="space-y-4 text-[13px] text-[#4a4a4a]">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00]/10 text-[11px] font-bold text-[#FF4A00]">1</span>
                  <div>
                    <p className="font-medium text-[#0a0a0a]">Create a Zap in Zapier</p>
                    <p className="mt-0.5 text-[#6b6b6b]">Go to zapier.com and create a new Zap. Choose "Webhooks by Zapier" as your trigger.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00]/10 text-[11px] font-bold text-[#FF4A00]">2</span>
                  <div>
                    <p className="font-medium text-[#0a0a0a]">Configure the webhook</p>
                    <p className="mt-0.5 text-[#6b6b6b]">
                      Set the webhook URL to your PickNPack API endpoint:{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">
                        POST /api/v1/zapier/webhook
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00]/10 text-[11px] font-bold text-[#FF4A00]">3</span>
                  <div>
                    <p className="font-medium text-[#0a0a0a]">Add your API key</p>
                    <p className="mt-0.5 text-[#6b6b6b]">
                      In the webhook headers, add{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">X-API-Key: your_key_here</code>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00]/10 text-[11px] font-bold text-[#FF4A00]">4</span>
                  <div>
                    <p className="font-medium text-[#0a0a0a]">Set the action in the body</p>
                    <p className="mt-0.5 text-[#6b6b6b]">
                      Send a JSON body with an <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">action</code> field.
                      Available actions:{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">test</code>,{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">new_orders</code>,{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">low_stock</code>,{' '}
                      <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[12px] font-mono">order_status</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 lg:col-span-2">
            <h2 className="mb-1 text-[14px] font-semibold text-red-700">Danger Zone</h2>
            <p className="mb-4 text-[12px] text-red-600/70">
              Uninstalling will remove all plugin data and invalidate API keys.
            </p>

            {confirmUninstall ? (
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-red-700">Are you sure?</span>
                <button
                  onClick={() => handleUninstall(configuringPlugin.key)}
                  disabled={actionLoading === configuringPlugin.key}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === configuringPlugin.key ? 'Removing...' : 'Yes, Uninstall'}
                </button>
                <button
                  onClick={() => setConfirmUninstall(false)}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmUninstall(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash size={14} />
                Uninstall {configuringPlugin.name}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Grid View (default) ───────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Plugins</h1>
        <p className="mt-1 text-[13px] text-[#6b6b6b]">Extend your warehouse with integrations</p>
      </div>

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
              category === cat
                ? 'bg-[#0a0a0a] text-white'
                : 'bg-[#f5f5f5] text-[#6b6b6b] hover:bg-[#ebebeb] hover:text-[#0a0a0a]'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugin grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#0a0a0a]" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plugin) => {
            const brand = PLUGIN_BRANDS[plugin.key];
            const isComingSoon = plugin.status === 'coming_soon';

            return (
              <div
                key={plugin.key}
                className={cn(
                  'group relative rounded-xl border bg-white p-5 transition-all',
                  isComingSoon
                    ? 'border-[#ebebeb] opacity-75'
                    : 'border-[#e5e5e5] hover:border-[#d0d0d0] hover:shadow-sm'
                )}
              >
                {/* Icon + Category */}
                <div className="mb-4 flex items-start justify-between">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', brand?.bg || 'bg-[#f5f5f5]')}>
                    <PluginIcon pluginKey={plugin.key} size={24} />
                  </div>
                  <span className="rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-medium text-[#6b6b6b]">
                    {plugin.category}
                  </span>
                </div>

                {/* Name + Description */}
                <h3 className="mb-1.5 text-[14px] font-semibold text-[#0a0a0a]">{plugin.name}</h3>
                <p className="mb-5 text-[12px] leading-relaxed text-[#6b6b6b]">{plugin.description}</p>

                {/* Action */}
                <div className="flex items-center gap-2">
                  {isComingSoon ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-[#f5f5f5] px-3 py-2 text-[12px] font-medium text-[#a0a0a0]">
                      <Clock size={14} />
                      Coming Soon
                    </span>
                  ) : plugin.installed ? (
                    <>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <Check size={12} weight="bold" />
                        Installed
                      </span>
                      <button
                        onClick={() => openConfigure(plugin)}
                        className="ml-auto rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
                      >
                        Configure
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(plugin.key)}
                      disabled={actionLoading === plugin.key}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white transition-colors disabled:opacity-50',
                        brand?.color === 'text-[#FF4A00]'
                          ? 'bg-[#FF4A00] hover:bg-[#e64300]'
                          : 'bg-[#0a0a0a] hover:bg-[#1a1a1a]'
                      )}
                    >
                      {actionLoading === plugin.key ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Installing...
                        </>
                      ) : (
                        'Install'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <Plug size={40} weight="light" className="mx-auto mb-3 text-[#d4d4d4]" />
          <p className="text-[14px] font-medium text-[#6b6b6b]">No plugins in this category</p>
          <p className="mt-1 text-[12px] text-[#a0a0a0]">Try selecting a different category</p>
        </div>
      )}
    </div>
  );
}
