import { useState, type FormEvent } from 'react';
import {
  User,
  EnvelopeSimple,
  Lock,
  Check,
  CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import type { TokenPayload } from '../../types';
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

interface CardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Card({ title, description, children }: CardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AccountSection() {
  const payload = getTokenPayload();

  // Profile state
  const [name, setName] = useState(payload?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Email state
  const [email, setEmail] = useState(payload?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');
    setProfileSaving(true);
    try {
      const { data } = await api.patch('/account/profile', { name });
      localStorage.setItem('token', data.data.token);
      setProfileMsg('Profile updated');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEmailSave = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailMsg('');
    setEmailSaving(true);
    try {
      const { data } = await api.patch('/account/email', { email, password: emailPassword });
      localStorage.setItem('token', data.data.token);
      setEmailPassword('');
      setEmailMsg('Email updated');
      setTimeout(() => setEmailMsg(''), 3000);
    } catch (err) {
      setEmailError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSave = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.patch('/account/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = 'h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card title="Profile" description="Update your display name.">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className={inputClass}
              />
            </div>
          </div>
          {profileError && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}
          {profileMsg && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="h-4 w-4" weight="bold" />
              {profileMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {profileSaving && <CircleNotch className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Card>

      {/* Email */}
      <Card title="Email Address" description="Change your email. Requires password verification.">
        <form onSubmit={handleEmailSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Email</label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                required
                className={inputClass}
              />
            </div>
          </div>
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
          {emailMsg && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="h-4 w-4" weight="bold" />
              {emailMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {emailSaving && <CircleNotch className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card title="Password" description="Change your account password.">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className={inputClass}
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          {passwordMsg && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="h-4 w-4" weight="bold" />
              {passwordMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {passwordSaving && <CircleNotch className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
