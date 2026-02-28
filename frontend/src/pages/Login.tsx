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
        <div className="auth-glass w-full max-w-[400px] rounded-2xl p-8">
          <h1 className="text-[22px] font-bold tracking-tight text-white">Sign in</h1>
          <p className="mt-1.5 text-[14px] text-white/40">
            Welcome back. Pick up where you left off.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
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
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/30">
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
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2B67FF] text-[15px] font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(43,103,255,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <CircleNotch size={18} className="animate-spin" />
              ) : (
                <>Continue<ArrowRight size={16} weight="bold" /></>
              )}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <p className="mt-8 text-[13px] text-white/25">
          No account?{' '}
          <Link
            to="/register"
            className="font-semibold text-white/50 transition-colors hover:text-white"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
