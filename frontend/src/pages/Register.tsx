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
    <div className="auth-scene font-display flex min-h-screen flex-col">
      {/* Gradient ribbons */}
      <div className="auth-ribbon auth-ribbon-1" />
      <div className="auth-ribbon auth-ribbon-2" />
      <div className="auth-ribbon auth-ribbon-3" />
      <div className="auth-ribbon auth-ribbon-4" />

      {/* Logo */}
      <div className="relative z-10 px-8 pt-8">
        <Logo width={120} className="text-[#1a1a2e]" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16">
        <div className="auth-card w-full max-w-[480px] p-8 sm:p-10">
          <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">Create account</h1>
          <p className="mt-1.5 text-[15px] text-[#6b7280]">
            Free for 14 days. No card needed.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
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
                <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
                  Full name
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
              <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
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
              <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2B67FF] text-[15px] font-semibold text-white transition-colors hover:bg-[#1f54d9] disabled:opacity-50"
            >
              {loading ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <>Get started<ArrowRight size={16} weight="bold" /></>
              )}
            </button>

            <p className="text-center text-[12px] text-[#9ca3af]">
              By signing up, you agree to our Terms of Service.
            </p>
          </form>

          <div className="mt-5 border-t border-[#e5e7eb] pt-5 text-center text-[14px] text-[#6b7280]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#2B67FF] hover:text-[#1f54d9]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-8 pb-6 text-[12px] text-[#9ca3af]">
        &copy; PickNPack &middot; Terms
      </div>
    </div>
  );
}
