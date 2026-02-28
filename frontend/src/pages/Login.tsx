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
    <div className="grain font-display relative flex min-h-screen flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center">
          <Logo width={120} className="text-[#0a0a0a]" />
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          Sign up
        </Link>
      </nav>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[360px]">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">Sign in</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
            Welcome back. Enter your credentials to continue.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#0a0a0a] focus:outline-none focus:ring-4 focus:ring-[#0a0a0a]/5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
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
                <>Continue<ArrowRight size={16} weight="bold" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#8a8a8a]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#0a0a0a] underline decoration-[#0a0a0a]/30 underline-offset-2 hover:decoration-[#0a0a0a]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
