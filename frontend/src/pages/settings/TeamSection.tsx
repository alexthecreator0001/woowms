import { useEffect, useState, type FormEvent } from 'react';
import {
  UserPlus,
  User,
  EnvelopeSimple,
  Lock,
  ShieldCheck,
  Trash,
  PencilSimple,
  CircleNotch,
  X,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import type { TeamMember, TokenPayload } from '../../types';
import type { AxiosError } from 'axios';

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const ROLE_OPTIONS = ['MANAGER', 'STAFF', 'PICKER'] as const;

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-violet-500/10 text-violet-600',
  MANAGER: 'bg-blue-500/10 text-blue-600',
  STAFF: 'bg-emerald-500/10 text-emerald-600',
  PICKER: 'bg-amber-500/10 text-amber-600',
};

export default function TeamSection() {
  const payload = getTokenPayload();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Inline role editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState('');

  const loadMembers = async () => {
    try {
      const { data } = await api.get('/team');
      setMembers(data.data);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/team', form);
      setForm({ name: '', email: '', password: '', role: 'STAFF' });
      setShowForm(false);
      loadMembers();
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSave = async (memberId: number) => {
    try {
      await api.patch(`/team/${memberId}`, { role: editRole });
      setEditingId(null);
      loadMembers();
    } catch (err) {
      alert((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from your team?`)) return;
    try {
      await api.delete(`/team/${memberId}`);
      loadMembers();
    } catch (err) {
      alert((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to remove member');
    }
  };

  const inputClass = 'h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  const selectClass = 'h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your workspace.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            showForm
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          )}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Add Member
            </>
          )}
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-base font-semibold">Add Team Member</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Create a new user account. They'll be able to log in immediately.
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={selectClass}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border/60 bg-card py-16 shadow-sm">
          <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading team...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {members.map((member) => {
                const isYou = member.id === payload?.id;
                return (
                  <tr key={member.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5 text-sm font-semibold">
                      {member.name}
                      {isYou && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(You)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{member.email}</td>
                    <td className="px-5 py-3.5">
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoleSave(member.id)}
                            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                          roleBadgeColors[member.role] || 'bg-gray-500/10 text-gray-500'
                        )}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {!isYou && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(member.id);
                              setEditRole(member.role);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted"
                          >
                            <PencilSimple className="h-3 w-3" />
                            Role
                          </button>
                          <button
                            onClick={() => handleRemove(member.id, member.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive shadow-sm transition-all hover:bg-destructive/10"
                          >
                            <Trash className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
