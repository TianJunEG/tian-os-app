import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Radio, Alert } from '../components/ui';
import { ROLE_HOME } from '../config/nav';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => {
    const p = new URLSearchParams(location.search).get('next');
    return p && p.startsWith('/') ? p : null;
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });

    setLoading(false);

    if (result.success) {
      navigate(nextPath || ROLE_HOME[result.user?.role] || '/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>
        <h1 className="text-center font-display text-3xl font-semibold tracking-[-0.02em] text-emerald-deep">Get started</h1>
        <p className="mb-8 mt-1 text-center text-sm text-ink-500">Join Tian OS today</p>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Field label="Full name">
            <Input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="Jane Tan" icon={User} autoComplete="name" required />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="you@example.com" icon={Mail} autoComplete="email" required />
          </Field>
          <Field label="I am a">
            <div className="flex gap-6 pt-1">
              <Radio name="role" value="parent" checked={formData.role === 'parent'} onChange={handleChange} label="Student / Parent" />
              <Radio name="role" value="tutor" checked={formData.role === 'tutor'} onChange={handleChange} label="Tutor" />
            </div>
          </Field>
          <Field label="Password">
            <Input type="password" name="password" value={formData.password} onChange={handleChange}
              placeholder="••••••••" icon={Lock} autoComplete="new-password" required />
          </Field>
          <Field label="Confirm password">
            <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              placeholder="••••••••" icon={Lock} autoComplete="new-password" required />
          </Field>
          <Button type="submit" size="m" disabled={loading} className="mt-2 w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 border-t border-line-soft pt-6">
          <p className="text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="font-semibold text-emerald-deep hover:text-emerald-deep">Sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
