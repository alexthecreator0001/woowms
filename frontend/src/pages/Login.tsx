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

          {/* Floating feature pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {['WooCommerce Sync', 'Pick & Pack', 'Inventory Tracking', 'Shelf Locations', 'Label Printing'].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/50 backdrop-blur-sm"
              >
                {f}
              </span>
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
            to="/register"
            className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
          >
            Sign up
          </Link>
        </nav>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0a0a0a]">Welcome back</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
              Enter your credentials to continue.
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
                    className="h-11 w-full rounded-lg border border-[#e5e5e5] bg-white px-3.5 text-[15px] text-[#0a0a0a] transition-shadow placeholder:text-[#a0a0a0] focus:border-[#2B67FF] focus:outline-none focus:ring-4 focus:ring-[#2B67FF]/10"
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
                  <>Continue<ArrowRight size={16} weight="bold" /></>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-[#8a8a8a]">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#2B67FF] underline decoration-[#2B67FF]/30 underline-offset-2 hover:decoration-[#2B67FF]">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
