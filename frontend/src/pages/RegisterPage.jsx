import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Radio, Alert } from '../components/ui';
import { ROLE_HOME } from '../config/nav';
import { FEATURE_FLAGS } from '../config/featureFlags';

// Roles a landing CTA may request via ?role= (e.g. "Become a tutor" → ?role=tutor).
// Anything else falls back to the default 'parent' intent.
const VALID_ROLES = ['parent', 'tutor'];
const normalizeRole = (raw) => (VALID_ROLES.includes(raw) ? raw : 'parent');
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Early-access screen (shown when FEAT_OPEN_REGISTRATION is off) ──────────
// `role` comes from a landing CTA's ?role= param (e.g. "Become a tutor"), so the
// invite request lands with the right intent in the subject line.
function EarlyAccessPage({ role = 'parent' }) {
  // NOTE: hello@tianos.app is the branded waitlist inbox on the project domain
  // (matches EMAIL_FROM=noreply@tianos.app). Confirm this alias actually routes
  // to a monitored inbox before launch — it must NOT 404 / bounce.
  const subject = role === 'tutor' ? 'Tian OS early access — tutor' : 'Tian OS early access';
  const mailto = `mailto:hello@tianos.app?subject=${encodeURIComponent(subject)}`;
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-tint">
          <Sparkles className="h-7 w-7 text-emerald-deep" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-emerald-deep">
          Tian OS is in early access
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          We're currently onboarding schools and families by invitation. Reach out and we'll get you set up.
        </p>
        <a
          href={mailto}
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-deep px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Request access
        </a>
        <div className="mt-6 border-t border-line-soft pt-5">
          <p className="text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-deep hover:opacity-80">Sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

// ── Full registration form (shown when FEAT_OPEN_REGISTRATION=1) ────────────
function RegisterForm() {
  const [searchParams] = useSearchParams();
  // Pre-select the role a landing CTA asked for (e.g. "Become a tutor" → ?role=tutor).
  const initialRole = useMemo(() => normalizeRole(searchParams.get('role')), [searchParams]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: initialRole });
  const [fieldErrors, setFieldErrors] = useState({});
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
    // Clear a field's error as soon as the user edits it.
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  // Inline, field-level validation. Returns a map of field → message (empty if valid).
  const validate = (data) => {
    const errs = {};
    if (!data.name.trim()) errs.name = 'Please enter your name';
    if (!data.email.trim()) errs.email = 'Please enter your email';
    else if (!EMAIL_RE.test(data.email.trim())) errs.email = 'Enter a valid email address';
    if (!data.password) errs.password = 'Please choose a password';
    else if (data.password.length < MIN_PASSWORD_LENGTH) errs.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
    if (data.confirmPassword !== data.password) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const errs = validate(formData);
    setFieldErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate(formData);
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    const result = await register({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
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

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Full name" error={fieldErrors.name}>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} placeholder="Jane Tan" icon={User} autoComplete="name" required />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com" icon={Mail} autoComplete="email" required />
          </Field>
          <Field label="I am a">
            <div className="flex gap-6 pt-1">
              <Radio name="role" value="parent" checked={formData.role === 'parent'} onChange={handleChange} label="Student / Parent" />
              <Radio name="role" value="tutor" checked={formData.role === 'tutor'} onChange={handleChange} label="Tutor" />
            </div>
          </Field>
          <Field label="Password" error={fieldErrors.password} hint={`At least ${MIN_PASSWORD_LENGTH} characters`}>
            <Input type="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} placeholder="••••••••" icon={Lock} autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} />
          </Field>
          <Field label="Confirm password" error={fieldErrors.confirmPassword}>
            <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} placeholder="••••••••" icon={Lock} autoComplete="new-password" required />
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

export default function RegisterPage() {
  // Even when registration is closed, honour the landing CTA's ?role= so the
  // invite mailto subject reflects the intent (e.g. "Become a tutor").
  const [searchParams] = useSearchParams();
  const role = normalizeRole(searchParams.get('role'));
  return FEATURE_FLAGS.openRegistration ? <RegisterForm /> : <EarlyAccessPage role={role} />;
}
