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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.data.token);
      navigate('/onboarding/connect-store');
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display flex min-h-screen">
      {/* Left — animated mesh */}
      <div className="auth-mesh relative hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="mesh-blob-1" />
        <div className="mesh-blob-2" />
        <div className="mesh-blob-3" />
        <div className="auth-grid" />

        {/* Centered content on the mesh */}
        <div className="relative z-10 max-w-md px-12 text-center">
          <Logo width={180} className="mx-auto text-white" />
          <p className="mt-6 text-[17px] leading-relaxed text-white/60">
            Warehouse management built for modern e-commerce. Pick, pack, and ship faster.
          </p>

          {/* Social proof / stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '10x', label: 'Faster picking' },
              { value: '99%', label: 'Order accuracy' },
              { value: '0', label: 'Setup fees' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-[12px] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex flex-1 flex-col bg-[#fafafa]">
        <div className="grain pointer-events-none" />

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center lg:hidden">
            <Logo width={120} className="text-[#0a0a0a]" />
          </Link>
          <div className="lg:ml-auto" />
          <Link
            to="/login"
            className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-[13px] font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
          >
            Sign in
          </Link>
        </nav>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">Get started</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
              Create your account. Free for 14 days, no card needed.
            </p>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Company</label>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                      placeholder="Acme Inc."
                      className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#2B67FF] focus:outline-none focus:ring-4 focus:ring-[#2B67FF]/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Your name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Jane Doe"
                      className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#2B67FF] focus:outline-none focus:ring-4 focus:ring-[#2B67FF]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Work email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="jane@acme.com"
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#2B67FF] focus:outline-none focus:ring-4 focus:ring-[#2B67FF]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#2B67FF] focus:outline-none focus:ring-4 focus:ring-[#2B67FF]/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2B67FF] text-[15px] font-semibold text-white transition-all hover:bg-[#2358d9] disabled:opacity-50"
              >
                {loading ? (
                  <CircleNotch size={18} className="animate-spin" />
                ) : (
                  <>Create account<ArrowRight size={16} weight="bold" /></>
                )}
              </button>

              <p className="mt-4 text-center text-[12px] text-[#a0a0a0]">
                By signing up, you agree to our Terms of Service.
              </p>
            </form>

            <p className="mt-8 text-center text-[13px] text-[#8a8a8a]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#2B67FF] underline decoration-[#2B67FF]/30 underline-offset-2 hover:decoration-[#2B67FF]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
