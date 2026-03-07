import { useEffect, useRef } from 'react';
import { X, Keyboard } from '@phosphor-icons/react';
import { cn } from '../lib/utils';

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    label: 'General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open search' },
      { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'O'], description: 'Go to Orders' },
      { keys: ['G', 'I'], description: 'Go to Inventory' },
      { keys: ['G', 'P'], description: 'Go to Purchase Orders' },
      { keys: ['G', 'S'], description: 'Go to Suppliers' },
      { keys: ['G', 'H'], description: 'Go to Shipping' },
      { keys: ['G', 'W'], description: 'Go to Warehouse' },
      { keys: ['G', 'K'], description: 'Go to Picking' },
      { keys: ['G', 'C'], description: 'Go to Cycle Counts' },
      { keys: ['G', 'R'], description: 'Go to Returns' },
      { keys: ['G', 'X'], description: 'Go to Settings' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Keyboard size={20} weight="duotone" className="text-primary" />
            <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.description}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-[13px] text-foreground">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <span key={i}>
                          {i > 0 && (
                            <span className="mx-0.5 text-[10px] text-muted-foreground/40">then</span>
                          )}
                          <kbd
                            className={cn(
                              'inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border/60 bg-muted/50 px-1.5 text-[11px] font-medium text-muted-foreground'
                            )}
                          >
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
