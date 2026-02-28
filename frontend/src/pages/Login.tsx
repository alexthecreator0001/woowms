import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CircleNotch } from '@phosphor-icons/react';
import api from '../services/api';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.data.token);
      const user = data.data.user;
      if (!user.emailVerified) {
        navigate('/onboarding/verify-email');
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding/connect-store');
      } else {
        navigate('/');
      }
    } catch {
      setError('Invalid email or password');
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
        <div className="auth-card w-full max-w-[420px] p-8 sm:p-10">
          <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">Sign in</h1>
          <p className="mt-1.5 text-[15px] text-[#6b7280]">
            Welcome back. Pick up where you left off.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="auth-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-[#111827]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
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
                <>Sign in<ArrowRight size={16} weight="bold" /></>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[#e5e7eb] pt-5 text-center text-[14px] text-[#6b7280]">
            No account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#2B67FF] hover:text-[#1f54d9]"
            >
              Create one
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
