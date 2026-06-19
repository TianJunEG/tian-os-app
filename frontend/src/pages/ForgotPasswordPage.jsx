import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Wordmark } from '../components/tianos';
import { Card, Button, Field, Input, Alert } from '../components/ui';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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

        <h1 className="text-center font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">Reset your password</h1>
        <p className="mb-8 mt-1 text-center text-sm text-ink-500">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <Alert tone="success" icon={CheckCircle}>
            Check your inbox — if that email is registered, a reset link is on its way.
          </Alert>
        ) : (
          <>
            {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Field label="Email">
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={Mail}
                  autoComplete="email"
                  required
                />
              </Field>
              <Button type="submit" size="m" disabled={loading} className="mt-2 w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
