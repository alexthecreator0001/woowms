import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react';
import api from '../services/api';
import Logo from '../components/Logo';
import GradientBlobs from '../components/GradientBlobs';
import type { AxiosError } from 'axios';

export default function Register() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-page relative flex min-h-svh flex-col items-center justify-center px-4">
      <GradientBlobs />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Logo */}
        <div className="mb-5">
          <Logo width={140} className="text-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Sign in
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
            <span className="text-xs text-muted-foreground/60">your details</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email */}
          <div>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Work email"
              className="auth-input-clean"
            />
          </div>

          {/* Company + Name row */}
          <div className="grid grid-cols-2 gap-3">
            <input
              id="companyName"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              placeholder="Company name"
              className="auth-input-clean"
            />
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Full name"
              className="auth-input-clean"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Password (min. 6 characters)"
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
            {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Create Account'}
          </button>

          <p className="text-center text-xs text-muted-foreground/60">
            By signing up, you agree to our Terms of Service.
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
