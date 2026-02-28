import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CircleNotch } from '@phosphor-icons/react';
import api from '../services/api';
import Logo from '../components/Logo';
import type { AxiosError } from 'axios';

export default function Register() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.data.token);
      navigate('/onboarding/connect-store');
    } catch (err) {
      setError(
        (err as AxiosError<{ message: string }>).response?.data?.message ||
          'Registration failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-scene font-display flex min-h-screen items-center justify-center">
      <div className="aurora" />
      <div className="aurora-2" />
      <div className="auth-vignette" />

      <div className="relative z-10 flex w-full flex-col items-center px-5">
        {/* Ambient glow behind card */}
        <div className="auth-glow" />

        {/* Logo */}
        <Logo width={140} className="mb-10 text-white" />

        {/* Glass card */}
        <div className="auth-glass w-full max-w-[440px] rounded-2xl p-8">
          <h1 className="text-[22px] font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-1.5 text-[14px] text-white/40">
            Free for 14 days. No card needed.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
                  Company
                </label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Acme Inc."
                  className="auth-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
                  Your name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                  className="auth-input"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
                Work email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="jane@acme.com"
                className="auth-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2B67FF] text-[15px] font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(43,103,255,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <>Get started<ArrowRight size={16} weight="bold" /></>
              )}
            </button>

            <p className="text-center text-[11px] text-white/15">
              By signing up, you agree to our Terms of Service.
            </p>
          </form>
        </div>

        {/* Bottom link */}
        <p className="mt-8 text-[13px] text-white/25">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-white/50 transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
