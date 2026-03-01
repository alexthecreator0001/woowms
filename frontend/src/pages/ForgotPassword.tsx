import { useState, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleNotch, Eye, EyeSlash, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import Logo from '../components/Logo';
import GradientBlobs from '../components/GradientBlobs';
import type { AxiosError } from 'axios';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        (err as AxiosError<{ message: string }>).response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    if (pasted.length < 6) {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        code: fullCode,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        (err as AxiosError<{ message: string }>).response?.data?.message ||
          'Failed to reset password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page relative flex min-h-svh flex-col items-center justify-center px-4">
        <GradientBlobs />
        <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
          <div className="mb-5">
            <Logo width={140} className="text-foreground" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle size={32} weight="fill" className="text-emerald-500" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold tracking-tight text-foreground">Password reset!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page relative flex min-h-svh flex-col items-center justify-center px-4">
      <GradientBlobs />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Logo */}
        <div className="mb-5">
          <Logo width={140} className="text-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          {step === 1 ? 'Reset your password' : 'Enter reset code'}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {step === 1
            ? "Enter your email and we'll send you a code."
            : (
              <>
                We sent a 6-digit code to{' '}
                <span className="font-medium text-foreground">{email}</span>
              </>
            )
          }
        </p>

        {/* Error */}
        {error && (
          <div className="mt-5 w-full rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="mt-7 flex w-full flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground/60">your email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Work email"
              className="auth-input-clean"
            />

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Send Reset Code'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </form>
        )}

        {/* Step 2: Code + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-7 flex w-full flex-col gap-4">
            {/* Code inputs */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground/60">verification code</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleCodePaste : undefined}
                  disabled={loading}
                  className={cn(
                    'h-12 w-11 rounded-lg border text-center text-lg font-bold transition-all',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'disabled:opacity-50',
                    digit ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background'
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground/60">new password</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="New password (min. 8 characters)"
                className="auth-input-clean pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirm new password"
              className="auth-input-clean"
            />

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setCode(['', '', '', '', '', '']); setError(''); }}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Use a different email
            </button>
          </form>
        )}
      </div>

      {/* Bottom */}
      <p className="absolute bottom-6 text-xs text-muted-foreground/50">
        Need help?
      </p>
    </div>
  );
}
