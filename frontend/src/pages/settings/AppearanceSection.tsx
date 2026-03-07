import { Sun, Moon, Monitor } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

const options: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', description: 'Classic light appearance', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { value: 'system', label: 'System', description: 'Follows your OS setting', icon: Monitor },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-1">Theme</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose how PickNPack looks for you.</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all',
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/30'
                )}
              >
                <Icon
                  size={28}
                  weight={selected ? 'fill' : 'regular'}
                  className={cn(selected ? 'text-primary' : 'text-muted-foreground')}
                />
                <div className="text-center">
                  <p className={cn('text-sm font-semibold', selected && 'text-primary')}>{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
