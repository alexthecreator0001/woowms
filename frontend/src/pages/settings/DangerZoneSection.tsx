import { useState, type FormEvent } from 'react';
import {
  Warning,
  Trash,
  Lock,
  CircleNotch,
} from '@phosphor-icons/react';
import api from '../../services/api';
import type { AxiosError } from 'axios';

export default function DangerZoneSection() {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText === 'DELETE MY ACCOUNT' && password.length > 0;

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;

    setError('');
    setDeleting(true);
    try {
      await api.delete('/account', { data: { password, confirmText } });
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Irreversible actions that permanently affect your account.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-destructive/30 bg-card shadow-sm">
        <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Warning className="h-5 w-5 text-destructive" weight="fill" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-destructive">Delete Account</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Permanently delete your account, all stores, orders, inventory, and team data. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Type <span className="font-mono text-destructive">DELETE MY ACCOUNT</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="h-10 w-full rounded-lg border border-border/60 bg-background px-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Your Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canDelete || deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4" />
                Permanently Delete Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
