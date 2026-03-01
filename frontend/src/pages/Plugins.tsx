import { useEffect, useState } from 'react';
import {
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
  GearSix,
  Lightning,
  CheckCircle,
  XCircle,
  Code,
  Globe,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { PluginCatalogItem } from '../types';

// ─── Brand config ──────────────────────────────────

const PLUGIN_BRANDS: Record<string, { bg: string; installBg: string; installHover: string }> = {
  zapier: { bg: 'bg-[#FFF4EE]', installBg: 'bg-[#FF4A00]', installHover: 'hover:bg-[#e64300]' },
  slack: { bg: 'bg-[#F8F0F9]', installBg: 'bg-[#4A154B]', installHover: 'hover:bg-[#3B0F3C]' },
  quickbooks: { bg: 'bg-[#EEFBEC]', installBg: 'bg-[#2CA01C]', installHover: 'hover:bg-[#238815]' },
  shipstation: { bg: 'bg-[#EDF4FF]', installBg: 'bg-[#1E3A5F]', installHover: 'hover:bg-[#162D4A]' },
};

const PLUGIN_LOGOS: Record<string, string> = {
  zapier: '/plugins/zapier.png',
  slack: '/plugins/slack.png',
  quickbooks: '/plugins/qb.png',
  shipstation: '/plugins/shipstation.png',
};

function PluginIcon({ pluginKey, size = 28 }: { pluginKey: string; size?: number }) {
  const logo = PLUGIN_LOGOS[pluginKey];
  if (logo) {
    return <img src={logo} alt={pluginKey} width={size} height={size} className="flex-shrink-0 object-contain" />;
  }
  return <Plug size={size} weight="fill" className="flex-shrink-0 text-[#6b6b6b]" />;
}

// Helper: get the base API URL for webhook instructions
function getWebhookBaseUrl(): string {
  const origin = window.location.origin;
  // In production, the API is on the same domain. In dev, it might be proxied.
  return origin;
}

// ─── Copyable code block ───────────────────────────

function CopyBlock({ value, label }: { value: string; label?: string }) {
  const [didCopy, setDidCopy] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setDidCopy(true);
    setTimeout(() => setDidCopy(false), 2000);
  }
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">{label}</p>}
      <div className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
        <code className="flex-1 break-all text-[12px] font-mono text-[#0a0a0a] select-all">{value}</code>
        <button
          onClick={copy}
          className="flex-shrink-0 rounded-md p-1 text-[#a0a0a0] transition-colors hover:bg-[#ebebeb] hover:text-[#0a0a0a]"
          title="Copy"
        >
          {didCopy ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
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
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

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

  async function handleTestConnection() {
    try {
      setTesting(true);
      setTestResult(null);
      const { data } = await api.get('/zapier/webhook/test', {
        // This goes through the normal API proxy but we need the X-API-Key header
        // We can't test from the frontend directly since we don't have the full key
        // Instead, hit a test endpoint on the authenticated plugin route
      });
      setTestResult({ ok: true, message: `Connected to ${data.data?.company || 'your workspace'}` });
    } catch {
      setTestResult({ ok: false, message: 'Could not reach the webhook endpoint. This is normal — the test endpoint requires the API key header, not a browser session.' });
    } finally {
      setTesting(false);
    }
  }

  function openConfigure(plugin: PluginCatalogItem) {
    setConfiguring(plugin.key);
    setSettings(plugin.settings || {});
    setConfirmUninstall(false);
    setConfirmRegenerate(false);
    setTestResult(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = category === 'All' ? plugins : plugins.filter((p) => p.category === category);
  const configuringPlugin = plugins.find((p) => p.key === configuring);
  const webhookBase = getWebhookBaseUrl();

  // ─── API Key Modal (shown after install or regenerate) ──

  if (apiKeyModal) {
    const webhookUrl = `${webhookBase}/api/v1/zapier/webhook`;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4EE]">
              <PluginIcon pluginKey="zapier" size={24} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#0a0a0a]">Zapier Connected</h3>
              <p className="text-[13px] text-[#6b6b6b]">Your API key has been generated</p>
            </div>
          </div>

          {/* What is this key for */}
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[12px] font-medium text-blue-900 mb-1">What is this key for?</p>
            <p className="text-[12px] text-blue-800 leading-relaxed">
              This API key authenticates Zapier when it calls your PickNPack webhook.
              Paste it into Zapier's webhook header as <code className="rounded bg-blue-100 px-1 py-0.5 text-[11px] font-mono">X-API-Key</code> so
              Zapier can pull your orders, inventory, and alerts.
            </p>
          </div>

          {/* The key */}
          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Your API Key</p>
            <div className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
              <code className="flex-1 break-all text-[13px] font-mono text-[#0a0a0a] select-all">
                {apiKeyModal.plaintext}
              </code>
              <button
                onClick={() => copyToClipboard(apiKeyModal.plaintext)}
                className="flex-shrink-0 rounded-md p-1.5 text-[#a0a0a0] transition-colors hover:bg-[#ebebeb] hover:text-[#0a0a0a]"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Warning size={16} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-[12px] text-amber-800">
                <strong>Copy this key now.</strong> For security, the full key is only shown once.
                After you close this dialog, only the first few characters will be visible.
                If you lose it, you can regenerate a new one (which invalidates the old one).
              </p>
            </div>
          </div>

          {/* Quick setup preview */}
          <div className="mb-5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0] mb-2">Quick Setup — Use in Zapier</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-start gap-2">
                <Globe size={14} className="mt-0.5 flex-shrink-0 text-[#6b6b6b]" />
                <span className="text-[#4a4a4a]">Webhook URL: <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] border border-[#e5e5e5]">{webhookUrl}</code></span>
              </div>
              <div className="flex items-start gap-2">
                <Key size={14} className="mt-0.5 flex-shrink-0 text-[#6b6b6b]" />
                <span className="text-[#4a4a4a]">Header: <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] border border-[#e5e5e5]">X-API-Key: {apiKeyModal.plaintext.slice(0, 11)}...</code></span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              I've Copied My Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Configure View ────────────────────────────────

  if (configuring && configuringPlugin) {
    const brand = PLUGIN_BRANDS[configuringPlugin.key];
    const webhookUrl = `${webhookBase}/api/v1/zapier/webhook`;
    const testUrl = `${webhookBase}/api/v1/zapier/webhook/test`;

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

        {configuringPlugin.key === 'zapier' && (
          <div className="space-y-6">

            {/* ── How it works ── */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightning size={18} weight="fill" className="text-[#FF4A00]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">How It Works</h2>
              </div>
              <p className="mb-4 text-[13px] leading-relaxed text-[#6b6b6b]">
                Zapier calls your PickNPack webhook URL with an API key to fetch data.
                You can use it to trigger actions in 5,000+ apps — for example, send a Slack message
                when a new order comes in, or add a Google Sheets row when stock runs low.
              </p>
              <div className="flex items-center gap-4 rounded-lg bg-[#fafafa] p-3">
                <div className="flex items-center gap-2 text-[12px] text-[#6b6b6b]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF4EE]">
                    <PluginIcon pluginKey="zapier" size={16} />
                  </div>
                  <span className="font-medium text-[#0a0a0a]">Zapier</span>
                </div>
                <div className="flex-1 border-t border-dashed border-[#d4d4d4]" />
                <div className="rounded-md bg-[#ebebeb] px-2 py-0.5 text-[10px] font-mono text-[#6b6b6b]">X-API-Key</div>
                <div className="flex-1 border-t border-dashed border-[#d4d4d4]" />
                <div className="flex items-center gap-2 text-[12px] text-[#6b6b6b]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-[11px] font-bold text-primary">P</span>
                  </div>
                  <span className="font-medium text-[#0a0a0a]">PickNPack</span>
                </div>
              </div>
            </div>

            {/* ── Webhook URL & API Key ── */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Webhook endpoint */}
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Globe size={18} weight="fill" className="text-[#6b6b6b]" />
                  <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Webhook Endpoint</h2>
                </div>

                <div className="space-y-3">
                  <CopyBlock label="Webhook URL (POST)" value={webhookUrl} />
                  <CopyBlock label="Test URL (GET)" value={testUrl} />
                </div>

                <p className="mt-3 text-[11px] text-[#a0a0a0]">
                  Use the POST URL as your Zapier webhook trigger. The GET URL is for testing that the connection works.
                </p>
              </div>

              {/* API Key */}
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Key size={18} weight="fill" className="text-[#6b6b6b]" />
                  <h2 className="text-[14px] font-semibold text-[#0a0a0a]">API Key</h2>
                </div>

                <p className="mb-3 text-[12px] text-[#6b6b6b]">
                  Add this as a header in every Zapier request to authenticate:
                </p>

                <div className="mb-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a0a0a0] mb-1">Header name</p>
                  <code className="text-[12px] font-mono text-[#0a0a0a]">X-API-Key</code>
                </div>

                <div className="mb-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a0a0a0] mb-1">Header value (masked)</p>
                  <code className="text-[12px] font-mono text-[#6b6b6b]">
                    {configuringPlugin.apiKeyPrefix}<span className="text-[#d4d4d4]">{'•'.repeat(52)}</span>
                  </code>
                </div>

                <p className="mb-4 text-[11px] text-[#a0a0a0]">
                  The full key was shown when you installed the plugin. Only the prefix is stored for your security.
                </p>

                {confirmRegenerate ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-3 text-[12px] text-amber-800">
                      <strong>Warning:</strong> This creates a new key and permanently invalidates the old one.
                      Any Zapier Zaps using the old key will stop working until you update them.
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
                    Lost your key? Regenerate
                  </button>
                )}
              </div>
            </div>

            {/* ── Available actions ── */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Code size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Available Actions</h2>
              </div>
              <p className="mb-4 text-[12px] text-[#6b6b6b]">
                Send a JSON body with an <code className="rounded bg-[#f5f5f5] px-1 py-0.5 font-mono text-[11px]">"action"</code> field to control what data you receive:
              </p>
              <div className="space-y-2">
                {[
                  {
                    action: 'test',
                    desc: 'Verify the connection works — returns your company name',
                    body: '{ "action": "test" }',
                  },
                  {
                    action: 'new_orders',
                    desc: 'Fetch orders from the last 24 hours',
                    body: '{ "action": "new_orders" }',
                  },
                  {
                    action: 'low_stock',
                    desc: 'Get products that are at or below their low stock threshold',
                    body: '{ "action": "low_stock" }',
                  },
                  {
                    action: 'order_status',
                    desc: 'Look up a specific order by ID',
                    body: '{ "action": "order_status", "orderId": 123 }',
                  },
                ].map((item) => (
                  <div key={item.action} className="flex items-start gap-3 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-3">
                    <code className="mt-0.5 flex-shrink-0 rounded bg-[#0a0a0a] px-2 py-0.5 text-[11px] font-mono text-white">
                      {item.action}
                    </code>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#4a4a4a]">{item.desc}</p>
                      <code className="mt-1 block text-[11px] font-mono text-[#a0a0a0]">{item.body}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Step by step guide ── */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <ArrowSquareOut size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Setup Guide</h2>
              </div>

              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00] text-[11px] font-bold text-white">1</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Create a new Zap on zapier.com</p>
                    <p className="mt-0.5 text-[12px] text-[#6b6b6b]">
                      Click "Create Zap", then for the trigger choose <strong>"Webhooks by Zapier"</strong> → <strong>"Custom Request"</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00] text-[11px] font-bold text-white">2</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Set the method and URL</p>
                    <p className="mt-0.5 mb-2 text-[12px] text-[#6b6b6b]">Set the method to <strong>POST</strong> and paste this URL:</p>
                    <CopyBlock value={webhookUrl} />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00] text-[11px] font-bold text-white">3</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Add the API key header</p>
                    <p className="mt-0.5 mb-2 text-[12px] text-[#6b6b6b]">In the "Headers" section, add one header:</p>
                    <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3 font-mono text-[11px]">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[#a0a0a0]">Key:</span>{' '}
                          <span className="text-[#0a0a0a]">X-API-Key</span>
                        </div>
                        <div>
                          <span className="text-[#a0a0a0]">Value:</span>{' '}
                          <span className="text-[#0a0a0a]">[paste your API key from installation]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00] text-[11px] font-bold text-white">4</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Set the body</p>
                    <p className="mt-0.5 mb-2 text-[12px] text-[#6b6b6b]">Set "Data" to <strong>Raw</strong> and paste the action you want:</p>
                    <CopyBlock value='{ "action": "new_orders" }' />
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FF4A00] text-[11px] font-bold text-white">5</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Add an action</p>
                    <p className="mt-0.5 text-[12px] text-[#6b6b6b]">
                      Now add what should happen when data comes in. For example: send a Slack message,
                      create a Google Sheets row, send an email, update a Notion database — anything Zapier supports.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                    <Check size={12} weight="bold" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-[#0a0a0a]">Test and turn on</p>
                    <p className="mt-0.5 text-[12px] text-[#6b6b6b]">
                      Click "Test" in Zapier to verify it receives data, then turn on the Zap. Done!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Test connection ── */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Test from Terminal</h2>
              </div>
              <p className="mb-3 text-[12px] text-[#6b6b6b]">
                Run this in your terminal to verify the webhook works (replace <code className="rounded bg-[#f5f5f5] px-1 py-0.5 font-mono text-[11px]">YOUR_KEY</code> with your actual key):
              </p>
              <CopyBlock value={`curl -X POST ${webhookUrl} -H "Content-Type: application/json" -H "X-API-Key: YOUR_KEY" -d '{"action":"test"}'`} />
              <p className="mt-2 text-[11px] text-[#a0a0a0]">
                You should get back: <code className="font-mono">{'{"data":{"ok":true,"company":"Your Company"}}'}</code>
              </p>
            </div>

            {/* ── Settings toggles ── */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <GearSix size={18} weight="fill" className="text-[#6b6b6b]" />
                <h2 className="text-[14px] font-semibold text-[#0a0a0a]">Notification Settings</h2>
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

            {/* ── Danger zone ── */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
              <h2 className="mb-1 text-[14px] font-semibold text-red-700">Danger Zone</h2>
              <p className="mb-4 text-[12px] text-red-600/70">
                Uninstalling removes the plugin, deletes the API key, and breaks any active Zaps using it.
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
                  Uninstall Zapier
                </button>
              )}
            </div>
          </div>
        )}
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
                        brand?.installBg || 'bg-[#0a0a0a]',
                        brand?.installHover || 'hover:bg-[#1a1a1a]'
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
