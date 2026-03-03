import { useState, useEffect } from 'react';
import {
  Plus,
  Trash,
  CircleNotch,
  Check,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

interface CustomerRule {
  condition: 'revenue_gt' | 'orders_gt';
  threshold: number;
  label: string;
  color: string;
}

const COLOR_PRESETS = [
  { name: 'Amber', value: 'amber' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Violet', value: 'violet' },
  { name: 'Blue', value: 'blue' },
  { name: 'Rose', value: 'rose' },
  { name: 'Orange', value: 'orange' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Fuchsia', value: 'fuchsia' },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600',   ring: 'ring-amber-500/30',   dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-600',  ring: 'ring-violet-500/30',  dot: 'bg-violet-500' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-600',    ring: 'ring-blue-500/30',    dot: 'bg-blue-500' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600',    ring: 'ring-rose-500/30',    dot: 'bg-rose-500' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-600',  ring: 'ring-orange-500/30',  dot: 'bg-orange-500' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-600',    ring: 'ring-cyan-500/30',    dot: 'bg-cyan-500' },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600', ring: 'ring-fuchsia-500/30', dot: 'bg-fuchsia-500' },
};

function getColorStyle(color: string) {
  return COLOR_CLASSES[color] || COLOR_CLASSES.blue;
}

export default function CustomerRulesSection() {
  const [rules, setRules] = useState<CustomerRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (Array.isArray(settings.customerRules)) {
          setRules(settings.customerRules);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addRule = () => {
    setRules([...rules, { condition: 'revenue_gt', threshold: 500, label: '', color: 'amber' }]);
  };

  const updateRule = (index: number, updates: Partial<CustomerRule>) => {
    setRules(rules.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate
    const valid = rules.every((r) => r.label.trim() && r.threshold > 0);
    if (!valid) {
      setError('Each rule needs a label and a threshold greater than 0.');
      return;
    }
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { customerRules: rules });
      setMsg('Customer rules saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save customer rules');
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
          <h3 className="text-base font-semibold">Customer Classification Rules</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Automatically tag customers based on their order history. Tags appear on the order detail page.
          </p>
        </div>

        <div className="p-6">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/60 py-10">
              <p className="text-sm text-muted-foreground">No rules yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Add a rule to start tagging customers automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const cs = getColorStyle(rule.color);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/60 bg-background p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Condition + threshold */}
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">If</span>
                        <select
                          value={rule.condition}
                          onChange={(e) => updateRule(idx, { condition: e.target.value as CustomerRule['condition'] })}
                          className="h-9 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="revenue_gt">Total revenue &gt;</option>
                          <option value="orders_gt">Order count &gt;</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={rule.threshold}
                          onChange={(e) => updateRule(idx, { threshold: parseInt(e.target.value) || 0 })}
                          className="h-9 w-24 rounded-lg border border-border/60 bg-card px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-muted-foreground">then tag as</span>
                        <input
                          type="text"
                          value={rule.label}
                          onChange={(e) => updateRule(idx, { label: e.target.value })}
                          placeholder="e.g. VIP"
                          className="h-9 w-28 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash size={16} />
                      </button>
                    </div>

                    {/* Color picker + preview */}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Color:</span>
                      <div className="flex items-center gap-1.5">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => updateRule(idx, { color: preset.value })}
                            title={preset.name}
                            className={cn(
                              'h-6 w-6 rounded-full transition-all',
                              COLOR_CLASSES[preset.value].dot,
                              rule.color === preset.value
                                ? 'ring-2 ring-offset-2 ' + COLOR_CLASSES[preset.value].ring
                                : 'opacity-50 hover:opacity-80'
                            )}
                          />
                        ))}
                      </div>
                      {rule.label && (
                        <span className={cn(
                          'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          cs.bg, cs.text
                        )}>
                          {rule.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={addRule}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus size={16} weight="bold" />
            Add rule
          </button>
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
          Save
        </button>
      </div>
    </div>
  );
}
