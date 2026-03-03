import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

type PoTemplate = 'modern' | 'classic' | 'minimal';

const TEMPLATES: { value: PoTemplate; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean layout with accent bar and bold typography.' },
  { value: 'classic', label: 'Classic', description: 'Bordered boxes, grid table, traditional business style.' },
  { value: 'minimal', label: 'Minimal', description: 'Ultra-clean with thin lines and lots of whitespace.' },
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
            Choose a design for generated purchase order PDFs. Your company logo and name are included automatically.
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

                {/* Realistic PDF preview */}
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

/* ─── Realistic A4 PDF preview mockups ───────────────── */

const sampleRows = [
  { sku: 'WDG-001', name: 'Widget Pro Max', qty: '24', cost: '$12.50', total: '$300.00' },
  { sku: 'BLT-042', name: 'Bolt Assembly Kit', qty: '100', cost: '$3.25', total: '$325.00' },
  { sku: 'GKT-017', name: 'Gasket Ring Set', qty: '50', cost: '$8.90', total: '$445.00' },
  { sku: 'SPR-088', name: 'Spring Tension Unit', qty: '36', cost: '$5.75', total: '$207.00' },
];

function ModernPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[6%] text-[3.5px] leading-tight">
      {/* Accent bar */}
      <div className="mb-[3%] h-[1px] rounded-full bg-indigo-500" />

      {/* Header */}
      <div className="mb-[3%] flex items-start justify-between">
        <span className="text-[4px] font-bold text-slate-800">{company}</span>
        <div className="text-right">
          <div className="text-[5px] font-bold text-indigo-500">PURCHASE ORDER</div>
          <div className="text-[3px] text-slate-400">PO-20260301-001</div>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-[2%] h-px bg-slate-100" />

      {/* Info row */}
      <div className="mb-[3%] flex gap-[8%]">
        <div>
          <div className="text-[2.5px] font-bold text-slate-400">SUPPLIER</div>
          <div className="text-[3.5px] text-slate-800">Acme Parts Ltd</div>
        </div>
        <div>
          <div className="text-[2.5px] font-bold text-slate-400">DETAILS</div>
          <div className="text-[3px] text-slate-400">Status: ORDERED</div>
          <div className="text-[3px] text-slate-400">Created: Mar 1, 2026</div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1">
        <div className="flex rounded-t bg-slate-800 px-[2%] py-[1%] text-[2.5px] font-bold text-white">
          <span className="w-[15%]">SKU</span>
          <span className="flex-1">Product</span>
          <span className="w-[10%] text-center">Ord</span>
          <span className="w-[15%] text-right">Cost</span>
          <span className="w-[15%] text-right">Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className={cn('flex px-[2%] py-[1.2%] text-[3px]', i % 2 === 1 ? 'bg-slate-50' : '')}>
            <span className="w-[15%] text-slate-500">{r.sku}</span>
            <span className="flex-1 text-slate-800">{r.name}</span>
            <span className="w-[10%] text-center text-slate-600">{r.qty}</span>
            <span className="w-[15%] text-right text-slate-600">{r.cost}</span>
            <span className="w-[15%] text-right text-slate-800">{r.total}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-[2%] flex justify-end">
        <div className="rounded bg-slate-50 px-[3%] py-[1%] text-[3.5px] font-bold text-slate-800">
          Total $1,277.00
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-[3%] text-[2.5px] text-slate-300">
        Generated Mar 3, 2026
        <span className="float-right">{company}</span>
      </div>
    </div>
  );
}

function ClassicPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[6%] text-[3.5px] leading-tight">
      {/* Header box */}
      <div className="mb-[3%] flex items-center justify-between rounded border border-gray-200 p-[2.5%]">
        <div>
          <div className="text-[5px] font-bold text-gray-800">Purchase Order</div>
          <div className="text-[3px] text-gray-400">{company}</div>
        </div>
        <div className="text-right">
          <div className="text-[4px] font-bold text-gray-800">PO-20260301-001</div>
          <div className="text-[2.5px] text-gray-400">Mar 1, 2026</div>
        </div>
      </div>

      {/* Info boxes */}
      <div className="mb-[3%] flex gap-[2%]">
        <div className="flex-1 rounded border border-gray-200 bg-gray-50 p-[2%]">
          <div className="text-[2px] font-bold text-gray-400">SUPPLIER</div>
          <div className="mt-[1%] text-[3.5px] text-gray-800">Acme Parts Ltd</div>
        </div>
        <div className="flex-1 rounded border border-gray-200 bg-gray-50 p-[2%]">
          <div className="text-[2px] font-bold text-gray-400">ORDER DETAILS</div>
          <div className="mt-[1%] text-[3px] text-gray-700">Status: ORDERED</div>
          <div className="text-[3px] text-gray-700">Expected: Mar 15, 2026</div>
        </div>
      </div>

      {/* Table with grid */}
      <div className="flex-1">
        <div className="flex rounded-t bg-gray-700 px-[2%] py-[1%] text-[2.5px] font-bold text-white">
          <span className="w-[14%]">SKU</span>
          <span className="flex-1">Product</span>
          <span className="w-[8%] text-center">Qty</span>
          <span className="w-[14%] text-right">Unit Cost</span>
          <span className="w-[14%] text-right">Line Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className={cn('flex border-b border-x border-gray-200 px-[2%] py-[1.2%] text-[3px]', i % 2 === 1 ? 'bg-gray-50' : 'bg-white')}>
            <span className="w-[14%] text-gray-600">{r.sku}</span>
            <span className="flex-1 text-gray-800">{r.name}</span>
            <span className="w-[8%] text-center text-gray-600">{r.qty}</span>
            <span className="w-[14%] text-right text-gray-600">{r.cost}</span>
            <span className="w-[14%] text-right text-gray-800">{r.total}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-[2%]">
        <div className="border-t border-gray-200 pt-[1%]" />
        <div className="flex justify-end gap-[4%] text-[3.5px] font-bold text-gray-800">
          <span>Total:</span>
          <span>$1,277.00</span>
        </div>
      </div>

      {/* Footer line */}
      <div className="mt-auto border-t border-gray-200 pt-[1%] text-[2.5px] text-gray-300">
        {company}
        <span className="float-right">Page 1 · Mar 3, 2026</span>
      </div>
    </div>
  );
}

function MinimalPreview({ company }: { company: string }) {
  return (
    <div className="flex h-full flex-col p-[6%] text-[3.5px] leading-tight">
      {/* Company */}
      <div className="text-[3px] text-neutral-400">{company}</div>

      {/* PO number */}
      <div className="mt-[2%] text-[6px] font-bold text-neutral-900">PO-20260301-001</div>
      <div className="mt-[1%] text-[3px] text-neutral-400">
        Acme Parts Ltd &nbsp;·&nbsp; Mar 1, 2026 &nbsp;·&nbsp; ORDERED
      </div>

      {/* Divider */}
      <div className="my-[3%] h-px bg-neutral-100" />

      {/* Table */}
      <div className="flex-1">
        <div className="flex bg-neutral-100 px-[2%] py-[1%] text-[2.5px] font-bold text-neutral-700">
          <span className="flex-1">Product</span>
          <span className="w-[14%]">SKU</span>
          <span className="w-[8%] text-center">Ord</span>
          <span className="w-[12%] text-right">Cost</span>
          <span className="w-[12%] text-right">Total</span>
        </div>
        {sampleRows.map((r, i) => (
          <div key={i} className="flex border-b border-neutral-50 px-[2%] py-[1.2%] text-[3px]">
            <span className="flex-1 text-neutral-800">{r.name}</span>
            <span className="w-[14%] text-neutral-400">{r.sku}</span>
            <span className="w-[8%] text-center text-neutral-600">{r.qty}</span>
            <span className="w-[12%] text-right text-neutral-600">{r.cost}</span>
            <span className="w-[12%] text-right text-neutral-800">{r.total}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-[2%] text-right text-[3.5px] font-bold text-neutral-900">
        Total &nbsp;$1,277.00
      </div>

      {/* Footer */}
      <div className="mt-auto text-[2.5px] text-neutral-200">{company}</div>
    </div>
  );
}
