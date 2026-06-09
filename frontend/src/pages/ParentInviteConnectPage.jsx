import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parentInvitesAPI } from '../services/api';
import { Alert, Button, Card, Field, Spinner } from '../components/ui';

export default function ParentInviteConnectPage() {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const nextParam = useMemo(() => encodeURIComponent(`/connect/parent/${token}`), [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await parentInvitesAPI.preview(token);
        if (mounted) setPreview(p.data);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || 'Could not load this invite.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const accept = async (payload = {}) => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await parentInvitesAPI.accept(token, payload);
      // A freshly created account comes back with a token — log them straight in.
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/parent';
        return;
      }
      setSuccess(`You're connected to ${res.data?.studentName || 'your child'}'s progress.`);
    } catch (e) {
      if (e?.response?.status === 409) {
        setError(e.response.data.error);
      } else {
        setError(e?.response?.data?.error || 'Could not accept the invite.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6"><Spinner /></div>;

  const expired = preview?.status === 'expired' || preview?.status === 'revoked';
  const alreadyAccepted = preview?.status === 'accepted';

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <GraduationCap size={18} />
          <h1 className="text-xl font-semibold">Follow your child's progress</h1>
        </div>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}
        {success && <Alert tone="success" icon={CheckCircle2} className="mb-4">{success}</Alert>}

        {preview && (
          <div className="mb-5 rounded-lg border border-hairline bg-ivory p-4 text-sm">
            <p><span className="font-medium">Student:</span> {preview.studentName}</p>
            {preview.schoolName ? <p><span className="font-medium">School:</span> {preview.schoolName}</p> : null}
            <p><span className="font-medium">Invite for:</span> {preview.email}</p>
            <p><span className="font-medium">Access:</span> View-only progress dashboard</p>
          </div>
        )}

        {expired ? (
          <Alert tone="error">This invite has {preview.status}. Please ask the school to send a new one.</Alert>
        ) : alreadyAccepted && !success ? (
          <div className="space-y-3">
            <Alert tone="info">This invite has already been accepted.</Alert>
            <Button to="/parent">Go to your dashboard</Button>
          </div>
        ) : success ? (
          <Button to="/parent">Go to your dashboard</Button>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Connect this child to your account. You'll get a free, view-only view of their school progress.</p>
            <Button disabled={submitting} onClick={() => accept({})}>{submitting ? 'Connecting…' : 'Connect to my account'}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">Create a free parent account to view {preview?.studentName || 'your child'}'s progress. Your email is set from the invitation.</p>
            <Field label="Your name">
              <input className="w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mrs Tan" />
            </Field>
            <Field label="Choose a password">
              <input type="password" className="w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </Field>
            <Button disabled={submitting || !name.trim() || password.length < 6} onClick={() => accept({ name: name.trim(), password })}>
              {submitting ? 'Creating account…' : 'Create account & connect'}
            </Button>
            <p className="text-xs text-ink-500">Already have an account? <a className="font-semibold text-navy-700" href={`/login?next=${nextParam}`}>Log in</a>, then open this link again.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
