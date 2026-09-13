import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Link2, Users } from 'lucide-react';
import { tutorAPI, tutorInviteAPI } from '../../services/api';
import { Card, Button, Badge, ProgressBar, PageHeader, Spinner, ErrorState } from '../../components/ui';

// Tutor's assigned students (tutor-workspace scope only).
// A student card with a quick "Link parent" action so announcements reach them.
function TutorStudentCard({ student: s }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function link() {
    if (!email.trim() || busy) return;
    setBusy(true); setMsg('');
    try {
      const { data } = await tutorAPI.linkParent(s.studentId, { email: email.trim() });
      setMsg(`✓ Linked ${data.parentEmail}${data.created ? ' — new account; they set a password via “forgot password”.' : '.'}`);
      setEmail('');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Could not link the parent.');
    } finally { setBusy(false); }
  }

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <div><h3 className="font-semibold text-ink-700">{s.name}</h3><p className="text-sm text-ink-500">{s.level} · {s.focusArea}</p></div>
        <Badge tone="navy">{s.overallMastery}%</Badge>
      </div>
      {s.weakestSkill && <p className="text-sm text-error-700">Weakest: {s.weakestSkill}</p>}
      <p className="mt-2 text-xs uppercase tracking-wide text-ink-300">Homework completion</p>
      <ProgressBar value={s.homeworkCompletion} className="mt-1" />
      <div className="mt-4 flex gap-2">
        <Button size="s" to={`/tutor/students/${s.studentId}`}>View student</Button>
        <Button size="s" variant="secondary" onClick={() => setOpen((v) => !v)}>Link parent</Button>
      </div>
      {open && (
        <div className="mt-3 flex items-center gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Parent email"
            className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-sm" />
          <Button size="s" onClick={link} disabled={busy || !email.trim()}>{busy ? 'Linking…' : 'Link'}</Button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-ink-600">{msg}</p>}
    </Card>
  );
}

export default function AssignedStudents() {
  const [students, setStudents] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  const load = () => {
    setLoadError(false);
    setStudents(null);
    tutorAPI.students()
      .then((r) => setStudents(r.data.students || []))
      .catch(() => setLoadError(true));
  };

  useEffect(() => { load(); }, []);

  const createInvite = async () => {
    setCreatingInvite(true);
    setInviteError('');
    try {
      const res = await tutorInviteAPI.create({ focusArea: 'MathPath' });
      setInviteUrl(res.data?.inviteUrl || '');
    } catch (_) {
      setInviteError("Couldn’t create an invite link. Please try again.");
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try { await navigator.clipboard.writeText(inviteUrl); } catch (_) { /* noop */ }
  };

  if (loadError) return <ErrorState message="Couldn’t load assigned students." onRetry={load} />;
  if (!students) return <Spinner />;
  return (
    <>
      <PageHeader
        title="Assigned students"
        subtitle="Private students in this workspace."
        action={<Button size="s" icon={Link2} onClick={createInvite} disabled={creatingInvite}>{creatingInvite ? 'Creating…' : 'Invite Student'}</Button>}
      />
      {inviteError && (
        <Card className="mb-4 p-4">
          <p className="text-sm text-error-700">{inviteError}</p>
        </Card>
      )}
      {inviteUrl && (
        <Card className="mb-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm text-ink-600">{inviteUrl}</p>
            <Button size="s" variant="secondary" icon={Copy} onClick={copyInvite}>Copy Link</Button>
          </div>
        </Card>
      )}
      {students.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No students assigned yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {students.map((s) => <TutorStudentCard key={s.studentId} student={s} />)}
        </div>
      )}
    </>
  );
}
