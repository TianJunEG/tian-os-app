import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { familyAPI, tutorInviteAPI } from '../services/api';
import { Alert, Button, Card, Field, Spinner } from '../components/ui';

export default function TutorInviteConnectPage() {
  const { token } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [preview, setPreview] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const nextParam = useMemo(() => encodeURIComponent(`/connect/tutor/${token}`), [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await tutorInviteAPI.preview(token);
        if (!mounted) return;
        setPreview(p.data);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || 'Could not load invite preview.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') return;
    let mounted = true;
    (async () => {
      try {
        const res = await familyAPI.children();
        if (!mounted) return;
        const list = res.data?.children || [];
        setChildren(list);
        if (list[0]?.studentId) setSelectedStudentId(String(list[0].studentId));
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || 'Could not load your children list.');
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated, user?.role]);

  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {
      // no-op
    }
  };

  const acceptInvite = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = user?.role === 'parent' ? { studentId: selectedStudentId } : {};
      const res = await tutorInviteAPI.accept(token, payload);
      if (res.data?.linked) {
        setSuccess('Student account successfully connected to tutor.');
      } else {
        setSuccess('Invite accepted.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to accept invite.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-deep">
          <Link2 size={18} />
          <h1 className="text-xl font-semibold">Connect to Tutor</h1>
        </div>

        {error && <Alert tone="error" icon={AlertCircle} className="mb-4">{error}</Alert>}
        {success && <Alert tone="success" icon={CheckCircle2} className="mb-4">{success}</Alert>}

        {preview && (
          <div className="mb-5 rounded-lg border border-line-soft bg-surface-raised p-4 text-sm">
            <p><span className="font-medium">Tutor:</span> {preview.tutorName}</p>
            <p><span className="font-medium">Focus:</span> {preview.focusArea || 'MathPath'}</p>
            <p><span className="font-medium">Status:</span> {preview.status}</p>
            <p><span className="font-medium">Expires:</span> {new Date(preview.expiresAt).toLocaleString()}</p>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-500">Please sign in or register first to connect this student account.</p>
            <div className="flex flex-wrap gap-2">
              <Button to={`/login?next=${nextParam}`}>Sign In</Button>
              <Button variant="secondary" to={`/register?next=${nextParam}`}>Register</Button>
              <Button variant="ghost" onClick={copyInviteUrl} icon={Copy}>{copied ? 'Copied' : 'Copy Link'}</Button>
            </div>
          </div>
        ) : user?.role === 'parent' ? (
          <div className="space-y-4">
            <Field label="Select child to connect">
              <select
                className="w-full rounded-md border border-line-soft bg-white px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {children.map((c) => (
                  <option key={String(c.studentId)} value={String(c.studentId)}>
                    {c.name} {c.level ? `(${c.level})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Button disabled={submitting || !selectedStudentId} onClick={acceptInvite}>
              {submitting ? 'Connecting…' : 'Connect Child to Tutor'}
            </Button>
          </div>
        ) : user?.role === 'student' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">Connect your student account to this tutor.</p>
            <Button disabled={submitting} onClick={acceptInvite}>
              {submitting ? 'Connecting…' : 'Connect My Account'}
            </Button>
          </div>
        ) : (
          <Alert tone="info">Only parent or student accounts can accept tutor invites.</Alert>
        )}
      </Card>
    </div>
  );
}

