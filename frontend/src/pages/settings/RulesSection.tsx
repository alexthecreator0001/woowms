import { useState, useEffect } from 'react';
import {
  Plus,
  Trash,
  CircleNotch,
  Check,
  Tag,
  Gift,
  ArrowUp,
  NoteBlank,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

type RuleType = 'customer_tag' | 'free_gift' | 'auto_priority' | 'auto_note';
type Condition = 'revenue_gt' | 'orders_gt' | 'order_total_gt' | 'item_count_gt' | 'is_cod';

interface OrderRule {
  type: RuleType;
  condition: Condition;
  threshold: number;
  label?: string;
  color?: string;
  sku?: string;
  giftName?: string;
  priority?: number;
  note?: string;
}

const RULE_TYPES: { value: RuleType; label: string; icon: typeof Tag; borderColor: string }[] = [
  { value: 'customer_tag', label: 'Customer Tag', icon: Tag, borderColor: 'border-l-amber-500' },
  { value: 'free_gift', label: 'Free Gift', icon: Gift, borderColor: 'border-l-emerald-500' },
  { value: 'auto_priority', label: 'Auto Priority', icon: ArrowUp, borderColor: 'border-l-blue-500' },
  { value: 'auto_note', label: 'Auto Note', icon: NoteBlank, borderColor: 'border-l-violet-500' },
];

const CONDITIONS_BY_TYPE: Record<RuleType, { value: Condition; label: string }[]> = {
  customer_tag: [
    { value: 'revenue_gt', label: 'Total revenue >' },
    { value: 'orders_gt', label: 'Order count >' },
    { value: 'order_total_gt', label: 'Order total >' },
  ],
  free_gift: [
    { value: 'order_total_gt', label: 'Order total >' },
    { value: 'item_count_gt', label: 'Item count >' },
  ],
  auto_priority: [
    { value: 'order_total_gt', label: 'Order total >' },
    { value: 'item_count_gt', label: 'Item count >' },
    { value: 'is_cod', label: 'Is cash on delivery' },
  ],
  auto_note: [
    { value: 'order_total_gt', label: 'Order total >' },
    { value: 'is_cod', label: 'Is cash on delivery' },
  ],
};

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

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Normal' },
  { value: 3, label: 'High' },
];

function getColorStyle(color: string) {
  return COLOR_CLASSES[color] || COLOR_CLASSES.blue;
}

function getDefaultRule(type: RuleType): OrderRule {
  switch (type) {
    case 'customer_tag':
      return { type: 'customer_tag', condition: 'revenue_gt', threshold: 500, label: '', color: 'amber' };
    case 'free_gift':
      return { type: 'free_gift', condition: 'order_total_gt', threshold: 100, sku: '', giftName: '' };
    case 'auto_priority':
      return { type: 'auto_priority', condition: 'order_total_gt', threshold: 500, priority: 3 };
    case 'auto_note':
      return { type: 'auto_note', condition: 'is_cod', threshold: 0, note: '' };
  }
}

export default function RulesSection() {
  const [rules, setRules] = useState<OrderRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const settings = data.data || {};
        if (Array.isArray(settings.orderRules)) {
          setRules(settings.orderRules);
        } else if (Array.isArray(settings.customerRules)) {
          // Backward compat: migrate old customerRules
          setRules(settings.customerRules.map((r: any) => ({ ...r, type: 'customer_tag' as RuleType })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addRule = (type: RuleType) => {
    setRules([...rules, getDefaultRule(type)]);
  };

  const updateRule = (index: number, updates: Partial<OrderRule>) => {
    setRules(rules.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, ...updates };
      // When type changes, reset to valid defaults for the new type
      if (updates.type && updates.type !== r.type) {
        const validConditions = CONDITIONS_BY_TYPE[updates.type];
        if (!validConditions.find((c) => c.value === updated.condition)) {
          updated.condition = validConditions[0].value;
        }
      }
      return updated;
    }));
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate each rule
    for (const rule of rules) {
      if (rule.condition !== 'is_cod' && rule.threshold <= 0) {
        setError('Each rule needs a threshold greater than 0 (except COD rules).');
        return;
      }
      if (rule.type === 'customer_tag' && !rule.label?.trim()) {
        setError('Customer tag rules need a label.');
        return;
      }
      if (rule.type === 'free_gift' && !rule.sku?.trim()) {
        setError('Free gift rules need a SKU.');
        return;
      }
      if (rule.type === 'auto_note' && !rule.note?.trim()) {
        setError('Auto note rules need a note.');
        return;
      }
    }
    setError('');
    setMsg('');
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { orderRules: rules });
      setMsg('Rules saved');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('Failed to save rules');
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
          <h3 className="text-base font-semibold">Order Rules</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Automate actions when orders arrive. Customer tags evaluate on view, other rules fire when new orders sync.
          </p>
        </div>

        <div className="p-6">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/60 py-10">
              <p className="text-sm text-muted-foreground">No rules yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Add a rule to start automating order actions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const typeConfig = RULE_TYPES.find((t) => t.value === rule.type) || RULE_TYPES[0];
                const TypeIcon = typeConfig.icon;
                const conditions = CONDITIONS_BY_TYPE[rule.type] || CONDITIONS_BY_TYPE.customer_tag;
                const isThresholdHidden = rule.condition === 'is_cod';

                return (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-xl border border-border/60 border-l-[3px] bg-background p-4',
                      typeConfig.borderColor
                    )}
                  >
                    {/* Row 1: type, condition, threshold, delete */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon size={16} weight="duotone" className="text-muted-foreground" />
                          <select
                            value={rule.type}
                            onChange={(e) => updateRule(idx, { type: e.target.value as RuleType })}
                            className="h-9 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {RULE_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        <span className="text-sm text-muted-foreground">when</span>

                        <select
                          value={rule.condition}
                          onChange={(e) => updateRule(idx, { condition: e.target.value as Condition })}
                          className="h-9 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {conditions.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>

                        {!isThresholdHidden && (
                          <input
                            type="number"
                            min={1}
                            value={rule.threshold}
                            onChange={(e) => updateRule(idx, { threshold: parseInt(e.target.value) || 0 })}
                            className="h-9 w-24 rounded-lg border border-border/60 bg-card px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash size={16} />
                      </button>
                    </div>

                    {/* Row 2: type-specific action fields */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {rule.type === 'customer_tag' && (
                        <>
                          <span className="text-xs text-muted-foreground">Tag as</span>
                          <input
                            type="text"
                            value={rule.label || ''}
                            onChange={(e) => updateRule(idx, { label: e.target.value })}
                            placeholder="e.g. VIP"
                            className="h-9 w-28 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
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
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              getColorStyle(rule.color || 'blue').bg,
                              getColorStyle(rule.color || 'blue').text
                            )}>
                              {rule.label}
                            </span>
                          )}
                        </>
                      )}

                      {rule.type === 'free_gift' && (
                        <>
                          <span className="text-xs text-muted-foreground">Add SKU</span>
                          <input
                            type="text"
                            value={rule.sku || ''}
                            onChange={(e) => updateRule(idx, { sku: e.target.value })}
                            placeholder="GIFT-001"
                            className="h-9 w-32 rounded-lg border border-border/60 bg-card px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-xs text-muted-foreground">named</span>
                          <input
                            type="text"
                            value={rule.giftName || ''}
                            onChange={(e) => updateRule(idx, { giftName: e.target.value })}
                            placeholder="Free Sticker"
                            className="h-9 w-36 rounded-lg border border-border/60 bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </>
                      )}

                      {rule.type === 'auto_priority' && (
                        <>
                          <span className="text-xs text-muted-foreground">Set priority to</span>
                          <select
                            value={rule.priority || 2}
                            onChange={(e) => updateRule(idx, { priority: parseInt(e.target.value) })}
                            className="h-9 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {PRIORITY_OPTIONS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
                            ))}
                          </select>
                        </>
                      )}

                      {rule.type === 'auto_note' && (
                        <>
                          <span className="text-xs text-muted-foreground">Add note</span>
                          <input
                            type="text"
                            value={rule.note || ''}
                            onChange={(e) => updateRule(idx, { note: e.target.value })}
                            placeholder="e.g. Collect payment on delivery"
                            className="h-9 w-72 rounded-lg border border-border/60 bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add rule buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {RULE_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => addRule(t.value)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon size={15} weight="duotone" />
                  {t.label}
                </button>
              );
            })}
          </div>
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
