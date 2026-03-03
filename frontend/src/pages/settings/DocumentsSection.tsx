import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

type PoTemplate = 'modern' | 'classic' | 'minimal';

const TEMPLATES: { value: PoTemplate; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Accent bar, bold headers, clean info boxes.' },
  { value: 'classic', label: 'Classic', description: 'Bordered header, grid table, traditional style.' },
  { value: 'minimal', label: 'Minimal', description: 'Ultra-clean with thin lines, lots of whitespace.' },
];

export default function DocumentsSection() {
  const [template, setTemplate] = useState<PoTemplate>('modern');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/account/tenant-settings'),
      api.get('/auth/me'),
    ]).then(([settingsRes, meRes]) => {
      const s = settingsRes.data.data || {};
      if (s.poTemplate === 'modern' || s.poTemplate === 'classic' || s.poTemplate === 'minimal') {
        setTemplate(s.poTemplate);
      }
      setCompanyName(meRes.data.data.tenantName || 'Your Company');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (val: PoTemplate) => {
    setTemplate(val);
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { poTemplate: val });
      setMsg('Template saved');
      setTimeout(() => setMsg(''), 2000);
    } catch {
      setMsg('Failed to save');
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
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Purchase Order PDF Template</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose a design for generated purchase order PDFs. Includes your logo, supplier info, delivery address, SKUs, and EAN codes.
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleSave(t.value)}
                disabled={saving}
                className={cn(
                  'relative rounded-xl border-2 p-3 text-left transition-all',
                  template === t.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border/60 hover:border-border hover:bg-muted/20'
                )}
              >
                {template === t.value && (
                  <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check size={12} weight="bold" className="text-white" />
                  </div>
                )}

                <div className="mb-3 aspect-[210/297] overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm">
                  {t.value === 'modern' && <ModernPreview company={companyName} />}
                  {t.value === 'classic' && <ClassicPreview company={companyName} />}
                  {t.value === 'minimal' && <MinimalPreview company={companyName} />}
                </div>

                <p className="text-sm font-semibold">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>

          {msg && (
            <p className={cn('mt-4 flex items-center gap-1.5 text-sm', msg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>
              {!msg.includes('Failed') && <Check size={14} weight="bold" />}
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared preview data ───────────────────────────── */

const sampleRows = [
  { sku: 'WDG-001', supSku: 'SP-4401', name: 'Widget Pro Max', ean: '8594001234567', qty: '24', cost: '$12.50', total: '$300.00' },
  { sku: 'BLT-042', supSku: 'SP-7780', name: 'Bolt Assembly Kit', ean: '8594009876543', qty: '100', cost: '$3.25', total: '$325.00' },
  { sku: 'GKT-017', supSku: 'SP-1122', name: 'Gasket Ring Set', ean: '8594005551234', qty: '50', cost: '$8.90', total: '$445.00' },
];

function InfoBox({ title, lines, className }: { title: string; lines: string[]; className?: string }) {
  return (
    <div className={cn('flex-1 rounded border border-gray-200 bg-gray-50/70 p-[2%]', className)}>
      <div className="text-[2px] font-bold uppercase text-gray-400">{title}</div>
      {lines.map((l, i) => (
        <div key={i} className="text-[2.8px] text-gray-700 leading-[1.4]">{l}</div>
      ))}
    </div>
  );
}

/* ─── MODERN ────────────────────────────────────────── */

function ModernPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[5%] text-[3px] leading-tight">
      <div className="mb-[2%] h-[1px] rounded-full bg-indigo-500" />

      <div className="mb-[2%] flex items-start justify-between">
        <div className="flex items-center gap-[1.5%]">
          <div className="h-[8px] w-[8px] rounded-[1px] bg-indigo-100 flex items-center justify-center text-[3px] font-bold text-indigo-500">
            {company.charAt(0)}
          </div>
          <span className="text-[4px] font-bold text-slate-800">{company}</span>
        </div>
        <div className="text-right">
          <div className="text-[5px] font-bold text-indigo-500">PURCHASE ORDER</div>
          <div className="text-[2.5px] text-slate-400">PO-20260301-001</div>
        </div>
      </div>

      <div className="mb-[2%] h-px bg-slate-100" />

      <div className="mb-[2.5%] flex gap-[1.5%]">
        <InfoBox title="Supplier" lines={['Acme Parts Ltd', 'Priemyselna 42, Bratislava', 'orders@acme.sk']} className="bg-slate-50/70 border-slate-200" />
        <InfoBox title="Deliver To" lines={['Main Warehouse', 'Skladova 15, Zilina']} className="bg-slate-50/70 border-slate-200" />
        <InfoBox title="Details" lines={['Status: ORDERED', 'Date: Mar 1, 2026', 'Expected: Mar 15']} className="bg-slate-50/70 border-slate-200" />
      </div>

      <div className="flex-1">
        <div className="flex rounded-t bg-slate-800 px-[1.5%] py-[0.8%] text-[2.2px] font-bold text-white">
          <span className="w-[12%]">SKU</span>
          <span className="w-[12%]">Supp. SKU</span>
          <span className="flex-1">Product</span>
          <span className="w-[16%]">EAN</span>
          <span className="w-[7%] text-center">Qty</span>
          <span className="w-[10%] text-right">Cost</span>
          <span className="w-[10%] text-right">Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className={cn('flex px-[1.5%] py-[0.8%] text-[2.5px]', i % 2 === 1 ? 'bg-slate-50' : '')}>
            <span className="w-[12%] text-slate-500">{r.sku}</span>
            <span className="w-[12%] text-slate-400">{r.supSku}</span>
            <span className="flex-1 text-slate-800">{r.name}</span>
            <span className="w-[16%] text-slate-400">{r.ean}</span>
            <span className="w-[7%] text-center text-slate-600">{r.qty}</span>
            <span className="w-[10%] text-right text-slate-600">{r.cost}</span>
            <span className="w-[10%] text-right text-slate-800">{r.total}</span>
          </div>
        ))}
      </div>

      <div className="mt-[1.5%] flex justify-end">
        <div className="rounded bg-slate-50 border border-slate-200 px-[2.5%] py-[0.8%] text-[3px] font-bold text-slate-800">
          TOTAL &nbsp; $1,070.00
        </div>
      </div>

      <div className="mt-auto pt-[2%] border-t border-slate-100 text-[2px] text-slate-300">
        {company}
        <span className="float-right">Generated Mar 3, 2026</span>
      </div>
    </div>
  );
}

/* ─── CLASSIC ───────────────────────────────────────── */

function ClassicPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[5%] text-[3px] leading-tight">
      <div className="mb-[2.5%] flex items-center justify-between rounded border border-gray-200 p-[2%]">
        <div>
          <div className="text-[5px] font-bold text-gray-800">Purchase Order</div>
          <div className="text-[2.5px] text-gray-400">{company}</div>
        </div>
        <div className="text-right">
          <div className="text-[4px] font-bold text-gray-800">PO-20260301-001</div>
          <div className="text-[2.2px] text-gray-400">Mar 1, 2026</div>
        </div>
      </div>

      <div className="mb-[2.5%] flex gap-[1.5%]">
        <InfoBox title="Supplier" lines={['Acme Parts Ltd', 'Priemyselna 42, Bratislava', 'orders@acme.sk', '+421 900 111 222']} />
        <InfoBox title="Deliver To" lines={['Main Warehouse', 'Skladova 15, Zilina']} />
        <InfoBox title="Order Details" lines={['Status: ORDERED', 'Date: Mar 1, 2026', 'Expected: Mar 15']} />
      </div>

      <div className="flex-1">
        <div className="flex rounded-t bg-gray-700 px-[1.5%] py-[0.8%] text-[2.2px] font-bold text-white">
          <span className="w-[12%]">SKU</span>
          <span className="w-[12%]">Supp. SKU</span>
          <span className="flex-1">Product</span>
          <span className="w-[16%]">EAN</span>
          <span className="w-[7%] text-center">Qty</span>
          <span className="w-[10%] text-right">Unit Cost</span>
          <span className="w-[10%] text-right">Line Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className={cn('flex border-b border-x border-gray-200 px-[1.5%] py-[0.8%] text-[2.5px]', i % 2 === 1 ? 'bg-gray-50' : 'bg-white')}>
            <span className="w-[12%] text-gray-600">{r.sku}</span>
            <span className="w-[12%] text-gray-400">{r.supSku}</span>
            <span className="flex-1 text-gray-800">{r.name}</span>
            <span className="w-[16%] text-gray-400">{r.ean}</span>
            <span className="w-[7%] text-center text-gray-600">{r.qty}</span>
            <span className="w-[10%] text-right text-gray-600">{r.cost}</span>
            <span className="w-[10%] text-right text-gray-800">{r.total}</span>
          </div>
        ))}
      </div>

      <div className="mt-[1.5%] border-t border-gray-200 pt-[0.8%]">
        <div className="flex justify-end gap-[3%] text-[3px] font-bold text-gray-800">
          <span>Total:</span>
          <span>$1,070.00</span>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 pt-[0.8%] text-[2px] text-gray-300">
        {company}
        <span className="float-right">Page 1 · Mar 3, 2026</span>
      </div>
    </div>
  );
}

/* ─── MINIMAL ───────────────────────────────────────── */

function MinimalPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[5%] text-[3px] leading-tight">
      <div className="text-[2.5px] text-neutral-400">{company}</div>
      <div className="mt-[1.5%] text-[6px] font-bold text-neutral-900">PO-20260301-001</div>
      <div className="mt-[0.5%] text-[2.5px] text-neutral-400">Mar 1, 2026 &nbsp;·&nbsp; ORDERED &nbsp;·&nbsp; Expected Mar 15</div>

      <div className="my-[2%] h-px bg-neutral-100" />

      <div className="mb-[2%] flex gap-[8%]">
        <div>
          <div className="text-[2px] font-bold text-neutral-400">SUPPLIER</div>
          <div className="text-[3px] text-neutral-800">Acme Parts Ltd</div>
          <div className="text-[2.5px] text-neutral-400">Priemyselna 42, Bratislava</div>
          <div className="text-[2.5px] text-neutral-400">orders@acme.sk</div>
        </div>
        <div>
          <div className="text-[2px] font-bold text-neutral-400">DELIVER TO</div>
          <div className="text-[3px] text-neutral-800">Main Warehouse</div>
          <div className="text-[2.5px] text-neutral-400">Skladova 15, Zilina</div>
        </div>
      </div>

      <div className="h-px bg-neutral-100 mb-[1%]" />

      <div className="flex-1">
        <div className="flex bg-neutral-100 px-[1.5%] py-[0.8%] text-[2.2px] font-bold text-neutral-700">
          <span className="flex-1">Product</span>
          <span className="w-[12%]">SKU</span>
          <span className="w-[16%]">EAN</span>
          <span className="w-[7%] text-center">Qty</span>
          <span className="w-[10%] text-right">Cost</span>
          <span className="w-[10%] text-right">Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className="flex border-b border-neutral-50 px-[1.5%] py-[0.8%] text-[2.5px]">
            <span className="flex-1 text-neutral-800">{r.name}</span>
            <span className="w-[12%] text-neutral-400">{r.sku}</span>
            <span className="w-[16%] text-neutral-400">{r.ean}</span>
            <span className="w-[7%] text-center text-neutral-600">{r.qty}</span>
            <span className="w-[10%] text-right text-neutral-600">{r.cost}</span>
            <span className="w-[10%] text-right text-neutral-800">{r.total}</span>
          </div>
        ))}
      </div>

      <div className="mt-[1.5%] text-right text-[3px] font-bold text-neutral-900">
        Total &nbsp; $1,070.00
      </div>

      <div className="mt-auto pt-[1%] text-[2px] text-neutral-200">{company}</div>
    </div>
  );
}
