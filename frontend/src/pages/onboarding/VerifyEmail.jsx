import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import api from '../../services/api.js';

export default function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Get email from JWT token
  const token = localStorage.getItem('token');
  let userEmail = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email || '';
    } catch {}
  }

  // Start cooldown on mount (code was sent during registration)
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (fullCode) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-email', { code: fullCode });
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      setSuccess(true);
      setTimeout(() => navigate('/onboarding/connect-store'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await api.post('/auth/send-verification');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</div>
          <div className="h-px w-8 bg-border" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">2</div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            {success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {success ? 'Email verified!' : 'Check your email'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {success
              ? 'Redirecting to next step...'
              : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-foreground">{userEmail}</span>
                </>
              )
            }
          </p>
        </div>

        {!success && (
          <>
            {/* Code Card */}
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
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

              {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  Verifying...
                </div>
              )}
            </div>

            {/* Resend */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className={cn(
                    'font-medium transition-colors',
                    resendCooldown > 0 || resending
                      ? 'cursor-not-allowed text-muted-foreground/50'
                      : 'text-primary hover:underline'
                  )}
                >
                  {resending ? (
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Sending...
                    </span>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend code'
                  )}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
