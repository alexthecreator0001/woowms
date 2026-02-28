import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react';
import api from '../services/api';
import { LogoMark } from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-page relative flex min-h-svh flex-col items-center justify-center px-4">
      {/* Gradient blobs — large, heavily blurred, top-anchored */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[5%] h-[80vh] w-[80vh] rounded-full bg-rose-300/40 blur-[180px]" />
        <div className="absolute -top-[35%] left-[25%] h-[70vh] w-[70vh] rounded-full bg-violet-300/30 blur-[180px]" />
        <div className="absolute -top-[38%] right-[5%] h-[75vh] w-[75vh] rounded-full bg-sky-300/35 blur-[180px]" />
        <div className="absolute -top-[30%] right-[30%] h-[60vh] w-[60vh] rounded-full bg-amber-200/30 blur-[160px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Logo */}
        <div className="mb-5">
          <LogoMark size={42} className="text-primary" />
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Welcome back!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Sign up
          </Link>
        </p>

        {/* Error */}
        {error && (
          <div className="mt-5 w-full rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 flex w-full flex-col gap-4">
          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground/60">email &amp; password</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email */}
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Work email"
              className="auth-input-clean"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="auth-input-clean pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Log In'}
          </button>

          <p className="text-center text-sm text-primary/80 hover:text-primary transition-colors cursor-pointer">
            Forgot Password?
          </p>
        </form>
      </div>

      {/* Bottom */}
      <p className="absolute bottom-6 text-xs text-muted-foreground/50">
        Need help?
      </p>
    </div>
  );
}
