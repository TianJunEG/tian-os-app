import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Alert } from '../components/ui';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(token, password);
      navigate('/login?reset=1');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-raised p-4 font-ui">
      <Card className="w-full max-w-md p-8">
        <Link to="/login" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-600">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <div className="mb-6 flex justify-center"><Wordmark onDark={false} size={34} /></div>

        <h1 className="text-center font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">Set new password</h1>
        <p className="mb-8 mt-1 text-center text-sm text-ink-500">Choose a new password for your account.</p>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Field label="New password">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                icon={Lock}
                autoComplete="new-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-body-faint hover:text-body-soft"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="m" disabled={loading} className="mt-2 w-full">
            {loading ? 'Saving…' : 'Set new password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
