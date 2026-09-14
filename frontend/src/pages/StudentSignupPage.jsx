import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Select, Alert } from '../components/ui';
import { FEATURE_FLAGS } from '../config/featureFlags';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_LEVELS = [
  { value: 'P1', label: 'Primary 1' },
  { value: 'P2', label: 'Primary 2' },
  { value: 'P3', label: 'Primary 3' },
  { value: 'P4', label: 'Primary 4' },
  { value: 'P5', label: 'Primary 5' },
  { value: 'P6', label: 'Primary 6' },
];

// ── Closed screen (shown when FEAT_STUDENT_SIGNUP is off) ───────────────────
function SignupClosedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-tint">
          <Sparkles className="h-7 w-7 text-emerald-deep" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-emerald-deep">
          Student sign-up isn't open yet
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          Ask your parent, tutor, or teacher to set up your login for now.
        </p>
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

// ── Full sign-up form (shown when FEAT_STUDENT_SIGNUP=1) ────────────────────
function StudentSignupForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', level: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { studentSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => {
    const p = new URLSearchParams(location.search).get('next');
    return p && p.startsWith('/') ? p : null;
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

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
    setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate(formData);
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    const result = await studentSignup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      ...(formData.level ? { level: formData.level } : {}),
    });
    setLoading(false);
    if (result.success) {
      // MathPath progress belongs to a Student record scoped to a class
      // workspace, not to the login itself — so a fresh self-signup has
      // nothing to show yet. Send them to redeem their teacher's class code
      // first; JoinClassPage lets them skip straight to /student if they
      // don't have one yet.
      navigate(nextPath || '/join');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>
        <h1 className="text-center font-display text-3xl font-semibold tracking-[-0.02em] text-emerald-deep">Create your login</h1>
        <p className="mb-8 mt-1 text-center text-sm text-ink-500">For students — track your own progress on Tian OS</p>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Your name" error={fieldErrors.name}>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} placeholder="Jane Tan" icon={User} autoComplete="name" required />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com" icon={Mail} autoComplete="email" required />
          </Field>
          <Field label="Level (optional)">
            <Select name="level" value={formData.level} onChange={handleChange}>
              <option value="">Select level</option>
              {STUDENT_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
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

export default function StudentSignupPage() {
  return FEATURE_FLAGS.studentSignup ? <StudentSignupForm /> : <SignupClosedPage />;
}
