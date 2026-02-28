import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CircleNotch } from '@phosphor-icons/react';
import api from '../services/api.js';

export default function Register() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.data.token);
      navigate('/onboarding/connect-store');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain font-display relative flex min-h-screen flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a]">
            <span className="text-[13px] font-extrabold text-white">P</span>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#0a0a0a]">PickNPack</span>
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-[13px] font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
        >
          Sign in
        </Link>
      </nav>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[360px]">
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
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
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
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
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
                  className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
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
                  className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] text-[15px] font-semibold text-white transition-all hover:bg-[#1a1a1a] disabled:opacity-50"
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
            <Link to="/login" className="font-semibold text-[#0a0a0a] underline decoration-[#0a0a0a]/30 underline-offset-2 hover:decoration-[#0a0a0a]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
