import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Alert } from '../components/ui';
import { ROLE_HOME } from '../config/nav';
import MascotAvatar from '../components/MascotAvatar';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => {
    const p = new URLSearchParams(location.search).get('next');
    return p && p.startsWith('/') ? p : null;
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData);
    setLoading(false);
    if (result.success) {
      // Land in the unified Tian OS shell for the user's role.
      navigate(nextPath || ROLE_HOME[result.user?.role] || '/student');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory p-4 font-ui">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-600">
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>
        <div className="mb-4 flex justify-center">
          <MascotAvatar name="tiano" size="lg" />
        </div>
        <h1 className="text-center font-display text-3xl font-semibold tracking-[-0.02em] text-navy-700">Welcome back</h1>
        <p className="mb-8 mt-1 text-center text-sm text-ink-500">Sign in to your Tian OS account</p>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <Input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="you@example.com" icon={Mail} autoComplete="email" required />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" icon={Lock} autoComplete="current-password" required className="pr-10" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="m" disabled={loading} className="mt-2 w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 border-t border-hairline pt-6">
          <p className="text-center text-sm text-ink-500">
            Don't have an account?{' '}
            <Link to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'} className="font-semibold text-navy-700 hover:text-navy-800">Sign up</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
