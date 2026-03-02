import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Envelope, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import Logo from '../../components/Logo';
import type { AxiosError } from 'axios';

export default function VerifyEmail() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
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

  const handleChange = (index: number, value: string) => {
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

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
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

  const handleVerify = async (fullCode: string) => {
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
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Verification failed');
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
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="grain font-display flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <CheckCircle size={48} weight="fill" className="mx-auto mb-4 text-emerald-500" />
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0a0a0a]">Email verified!</h1>
          <p className="mt-2 text-[15px] text-[#6b6b6b]">Redirecting to next step...</p>
          <CircleNotch size={20} className="mx-auto mt-6 animate-spin text-[#a0a0a0]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grain font-display relative flex min-h-screen flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center">
          <Logo width={120} className="text-[#0a0a0a]" />
        </div>
        {/* Steps */}
        <div className="flex items-center gap-3 text-[13px]">
          <span className="font-semibold text-[#0a0a0a]">Account</span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="text-[#c5c5c5]">Connect store</span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="text-[#c5c5c5]">Store config</span>
          <span className="text-[#d5d5d5]">/</span>
          <span className="text-[#c5c5c5]">Warehouse setup</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f0f0]">
              <Envelope size={28} weight="duotone" className="text-[#6b6b6b]" />
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">
              Check your email
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
              We sent a 6-digit verification code to{' '}
              <span className="font-semibold text-[#0a0a0a]">{userEmail}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Code input card */}
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <p className="mb-4 text-center text-[13px] font-medium text-[#8a8a8a]">
              Enter verification code
            </p>

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2.5">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className={cn(
                    'h-14 w-12 rounded-lg border text-center text-[20px] font-bold text-[#0a0a0a] transition-all',
                    'focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5',
                    'disabled:opacity-50',
                    digit
                      ? 'border-[#0a0a0a]/30 bg-[#fafafa]'
                      : 'border-[#e5e5e5] bg-white'
                  )}
                />
              ))}
            </div>

            {loading && (
              <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-[#8a8a8a]">
                <CircleNotch size={16} className="animate-spin" />
                Verifying...
              </div>
            )}
          </div>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#8a8a8a]">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className={cn(
                  'font-semibold transition-colors',
                  resendCooldown > 0 || resending
                    ? 'cursor-not-allowed text-[#c5c5c5]'
                    : 'text-[#0a0a0a] hover:underline'
                )}
              >
                {resending ? (
                  <span className="inline-flex items-center gap-1.5">
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
        </div>
      </div>
    </div>
  );
}
