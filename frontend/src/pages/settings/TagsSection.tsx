import { useState, useEffect } from 'react';
import {
  CircleNotch,
  Plus,
  Trash,
  Tag,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const TAG_COLORS = [
  { name: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  { name: 'violet', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  { name: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  { name: 'fuchsia', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
];

interface TagDef {
  label: string;
  color: string;
}

export default function TagsSection() {
  const [orderTags, setOrderTags] = useState<TagDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('blue');

  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const s = data.data || {};
        if (Array.isArray(s.orderTags)) setOrderTags(s.orderTags);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (tags: TagDef[]) => {
    setSaving(true);
    try {
      await api.patch('/account/tenant-settings', { orderTags: tags });
      setOrderTags(tags);
    } catch (err) {
      console.error('Failed to save tags:', err);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (orderTags.some((t) => t.label.toLowerCase() === label.toLowerCase())) return;
    const updated = [...orderTags, { label, color: newColor }];
    save(updated);
    setNewLabel('');
  };

  const removeTag = (idx: number) => {
    save(orderTags.filter((_, i) => i !== idx));
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
      {/* Order Tags */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-base font-semibold">Order Tags</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create tags that can be applied to orders. These tags are shared across your team.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Existing tags */}
          {orderTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {orderTags.map((tag, idx) => {
                const cs = TAG_COLORS.find((c) => c.name === tag.color) || TAG_COLORS[0];
                return (
                  <div
                    key={idx}
                    className={cn(
                      'group inline-flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1 text-sm font-medium',
                      cs.bg, cs.text
                    )}
                  >
                    <Tag size={12} weight="bold" />
                    {tag.label}
                    <button
                      onClick={() => removeTag(idx)}
                      disabled={saving}
                      className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-black/10"
                    >
                      <Trash size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60">No tags created yet.</p>
          )}

          {/* Add new tag */}
          <div className="flex items-end gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag name</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="e.g. VIP, Fragile, Rush..."
                className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex items-center gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setNewColor(c.name)}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all',
                      c.dot,
                      newColor === c.name ? 'ring-2 ring-offset-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border'
                    )}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={addTag}
              disabled={!newLabel.trim() || saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Plus size={14} weight="bold" />}
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
