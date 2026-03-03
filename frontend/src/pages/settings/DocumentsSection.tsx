import { useState, useEffect, useRef } from 'react';
import {
  Check,
  CircleNotch,
  Palette,
  Stamp,
  NoteBlank,
  FileText,
  UploadSimple,
  Trash,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

type PoTemplate = 'modern' | 'classic' | 'minimal';

const TEMPLATES: { value: PoTemplate; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Accent bar, bold headers, clean info boxes.' },
  { value: 'classic', label: 'Classic', description: 'Bordered header, grid table, traditional style.' },
  { value: 'minimal', label: 'Minimal', description: 'Ultra-clean with thin lines, lots of whitespace.' },
];

const BRAND_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#64748b', label: 'Slate' },
  { value: '#1e293b', label: 'Dark' },
];

const MAX_FILE_SIZE = 512 * 1024; // 512KB

export default function DocumentsSection() {
  const [loading, setLoading] = useState(true);

  // --- PO template ---
  const [template, setTemplate] = useState<PoTemplate>('modern');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');

  // --- Brand color ---
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [colorSaving, setColorSaving] = useState(false);
  const [colorMsg, setColorMsg] = useState('');

  // --- Company stamp ---
  const [stampUrl, setStampUrl] = useState('');
  const [stampUploading, setStampUploading] = useState(false);
  const [stampMsg, setStampMsg] = useState('');
  const stampFileRef = useRef<HTMLInputElement>(null);

  // --- Default PO note ---
  const [defaultPoNote, setDefaultPoNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');

  // --- Company name (for template previews) ---
  const [companyName, setCompanyName] = useState('');

  // --- Load data ---
  useEffect(() => {
    Promise.all([
      api.get('/account/tenant-settings'),
      api.get('/auth/me'),
    ]).then(([settingsRes, meRes]) => {
      const s = settingsRes.data.data || {};
      if (s.poTemplate === 'modern' || s.poTemplate === 'classic' || s.poTemplate === 'minimal') {
        setTemplate(s.poTemplate);
      }
      if (s.brandColor) setBrandColor(s.brandColor);
      if (s.defaultPoNote) setDefaultPoNote(s.defaultPoNote);
      if (s.stampUrl) setStampUrl(s.stampUrl);
      setCompanyName(meRes.data.data.tenantName || 'Your Company');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // --- Template handler ---
  const handleTemplateSave = async (val: PoTemplate) => {
    setTemplate(val);
    setTemplateMsg('');
    setTemplateSaving(true);
    try {
      await api.patch('/account/tenant-settings', { poTemplate: val });
      setTemplateMsg('Template saved');
      setTimeout(() => setTemplateMsg(''), 2000);
    } catch {
      setTemplateMsg('Failed to save');
    } finally {
      setTemplateSaving(false);
    }
  };

  // --- Stamp handlers ---
  const handleStampSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStampMsg('Please select an image file');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStampMsg('Image must be under 512KB');
      return;
    }
    setStampUploading(true);
    setStampMsg('');
    try {
      const dataUrl = await resizeImage(file, 300);
      await api.patch('/account/tenant-settings', { stampUrl: dataUrl });
      setStampUrl(dataUrl);
      setStampMsg('Stamp saved');
      setTimeout(() => setStampMsg(''), 2000);
    } catch {
      setStampMsg('Failed to upload stamp');
    } finally {
      setStampUploading(false);
      if (stampFileRef.current) stampFileRef.current.value = '';
    }
  };

  const removeStamp = async () => {
    setStampUploading(true);
    try {
      await api.patch('/account/tenant-settings', { stampUrl: null });
      setStampUrl('');
      setStampMsg('Stamp removed');
      setTimeout(() => setStampMsg(''), 2000);
    } catch {
      setStampMsg('Failed to remove stamp');
    } finally {
      setStampUploading(false);
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
      {/* ── General document settings ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">General document settings</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These settings apply to all generated documents (purchase orders, packing lists, invoices).
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {/* Brand color */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} weight="duotone" className="text-muted-foreground" />
              <h4 className="text-sm font-semibold">Brand color</h4>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Used as accent color on document PDFs (headers, bars, highlights).
            </p>
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  disabled={colorSaving}
                  onClick={async () => {
                    setBrandColor(c.value);
                    setColorSaving(true);
                    setColorMsg('');
                    try {
                      await api.patch('/account/tenant-settings', { brandColor: c.value });
                      setColorMsg('Saved');
                      setTimeout(() => setColorMsg(''), 2000);
                    } catch { setColorMsg('Failed'); }
                    finally { setColorSaving(false); }
                  }}
                  className={cn(
                    'relative h-9 w-9 rounded-full border-2 transition-all',
                    brandColor === c.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {brandColor === c.value && (
                    <Check size={14} weight="bold" className="absolute inset-0 m-auto text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
            {colorMsg && (
              <p className={cn('mt-2 text-xs', colorMsg === 'Failed' ? 'text-destructive' : 'text-emerald-600')}>{colorMsg}</p>
            )}
          </div>

          {/* Company stamp */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Stamp size={16} weight="duotone" className="text-muted-foreground" />
              <h4 className="text-sm font-semibold">Company stamp / signature</h4>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Printed on purchase orders and official documents. Max 512KB, resized to 300px.
            </p>
            <div className="flex items-start gap-5">
              {/* Stamp preview */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10">
                {stampUrl ? (
                  <img src={stampUrl} alt="Stamp" className="h-16 w-16 rounded-lg object-contain" />
                ) : (
                  <Stamp size={28} weight="duotone" className="text-muted-foreground/30" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stampFileRef.current?.click()}
                    disabled={stampUploading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    {stampUploading ? <CircleNotch size={14} className="animate-spin" /> : <UploadSimple size={14} />}
                    {stampUrl ? 'Change' : 'Upload'}
                  </button>
                  {stampUrl && (
                    <button
                      type="button"
                      onClick={removeStamp}
                      disabled={stampUploading}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-background px-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash size={14} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Upload a PNG or JPEG of your company stamp or authorized signature.
                </p>
                {stampMsg && (
                  <p className={cn('mt-1.5 text-xs', stampMsg.includes('Failed') || stampMsg.includes('must') || stampMsg.includes('Please') ? 'text-destructive' : 'text-emerald-600')}>
                    {stampMsg}
                  </p>
                )}
              </div>
            </div>
            <input
              ref={stampFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleStampSelect}
            />
          </div>

          {/* Default PO note */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <NoteBlank size={16} weight="duotone" className="text-muted-foreground" />
              <h4 className="text-sm font-semibold">Default PO note</h4>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              This note is automatically included on every purchase order PDF. E.g. payment terms, delivery instructions.
            </p>
            <textarea
              value={defaultPoNote}
              onChange={(e) => setDefaultPoNote(e.target.value)}
              rows={3}
              placeholder="e.g. Payment within 30 days. Deliver to warehouse gate B."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={noteSaving}
                onClick={async () => {
                  setNoteSaving(true);
                  setNoteMsg('');
                  try {
                    await api.patch('/account/tenant-settings', { defaultPoNote });
                    setNoteMsg('Saved');
                    setTimeout(() => setNoteMsg(''), 2000);
                  } catch { setNoteMsg('Failed'); }
                  finally { setNoteSaving(false); }
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {noteSaving ? <CircleNotch size={12} className="animate-spin" /> : 'Save note'}
              </button>
              {noteMsg && (
                <span className={cn('text-xs', noteMsg === 'Failed' ? 'text-destructive' : 'text-emerald-600')}>{noteMsg}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Purchase Order template ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={16} weight="duotone" className="text-muted-foreground" />
            <h3 className="text-base font-semibold">Purchase Order template</h3>
          </div>
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
                onClick={() => handleTemplateSave(t.value)}
                disabled={templateSaving}
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

          {templateMsg && (
            <p className={cn('mt-4 flex items-center gap-1.5 text-sm', templateMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>
              {!templateMsg.includes('Failed') && <Check size={14} weight="bold" />}
              {templateMsg}
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

/** Resize image to maxDim and return a PNG data URL */
function resizeImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
