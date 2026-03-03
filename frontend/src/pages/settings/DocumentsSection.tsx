import { useState, useEffect } from 'react';
import {
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import type { PoTemplate } from '../../lib/generatePoPdf';

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

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const s = data.data || {};
        if (s.poTemplate === 'modern' || s.poTemplate === 'classic' || s.poTemplate === 'minimal') {
          setTemplate(s.poTemplate);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleSave(t.value)}
                disabled={saving}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all',
                  template === t.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/20'
                )}
              >
                {template === t.value && (
                  <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check size={12} weight="bold" className="text-white" />
                  </div>
                )}

                {/* Mini PDF preview */}
                <div className="mb-3 overflow-hidden rounded-lg border border-border/40 bg-white p-2 shadow-sm">
                  {t.value === 'modern' && <ModernPreview />}
                  {t.value === 'classic' && <ClassicPreview />}
                  {t.value === 'minimal' && <MinimalPreview />}
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

/* ─── Mini preview thumbnails ────────────────────────── */

function ModernPreview() {
  return (
    <div className="space-y-1.5">
      <div className="h-1 w-full rounded-full bg-indigo-500" />
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-8 rounded bg-slate-200" />
        <div className="h-2 w-16 rounded bg-slate-800" />
      </div>
      <div className="h-px bg-slate-100" />
      <div className="space-y-0.5">
        <div className="h-2 w-full rounded bg-slate-800" />
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('h-2 w-full rounded', i % 2 === 0 ? 'bg-slate-50' : 'bg-white')} style={{ border: '0.5px solid #f1f5f9' }} />
        ))}
      </div>
      <div className="flex justify-end">
        <div className="h-2 w-10 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function ClassicPreview() {
  return (
    <div className="space-y-1.5">
      <div className="rounded border border-gray-200 p-1">
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-12 rounded bg-gray-300" />
          <div className="h-1.5 w-8 rounded bg-gray-400" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 rounded border border-gray-200 bg-gray-50 p-1">
          <div className="h-1 w-6 rounded bg-gray-200" />
        </div>
        <div className="flex-1 rounded border border-gray-200 bg-gray-50 p-1">
          <div className="h-1 w-8 rounded bg-gray-200" />
        </div>
      </div>
      <div className="space-y-0">
        <div className="h-2 w-full rounded-t bg-gray-700" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-2 w-full border-x border-b border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="space-y-1.5">
      <div className="h-1 w-6 rounded bg-neutral-200" />
      <div className="h-2 w-14 rounded bg-neutral-800" />
      <div className="h-1 w-20 rounded bg-neutral-100" />
      <div className="h-px bg-neutral-100" />
      <div className="space-y-0.5">
        <div className="h-1.5 w-full rounded bg-neutral-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 w-full border-b border-neutral-50 bg-white" />
        ))}
      </div>
      <div className="flex justify-end">
        <div className="h-1.5 w-8 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
