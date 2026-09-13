import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Copy, Mail } from 'lucide-react';
import { teacherAPI, parentInvitesAPI } from '../../services/api';
import { useEntitlements } from '../../context/useEntitlements';
import { Card, Badge, Button, StatusBadge, StatTile, PageHeader, Spinner, ErrorState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';
import StudentSciencePanel from '../../components/StudentSciencePanel';

// Invite a parent/guardian by email to a free, view-only progress dashboard.
function InviteParentCard({ studentId }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const send = async () => {
    if (!email.trim()) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await parentInvitesAPI.create({ studentId, email: email.trim() });
      setResult(res.data);
      setEmail('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not send invite.');
    } finally { setBusy(false); }
  };
  const copy = () => { if (result?.inviteUrl) navigator.clipboard?.writeText(result.inviteUrl); };
  return (
    <Card className="mt-5 p-5">
      <div className="mb-2 flex items-center gap-2"><Mail className="h-4 w-4 text-ink-400" /><h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Invite parent</h3></div>
      <p className="mb-3 text-sm text-ink-500">Send a guardian a free, view-only link to this student's progress.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@email.com" className="min-w-0 flex-1 rounded-lg border border-line-soft px-3 py-2 text-sm outline-none focus:border-emerald-border" />
        <Button onClick={send} disabled={busy || !email.trim()} icon={Mail}>{busy ? 'Sending…' : 'Send invite'}</Button>
      </div>
      {error ? <p className="mt-2 text-sm text-error-700">{error}</p> : null}
      {result ? (
        <div className="mt-3 rounded-lg border border-line-soft bg-surface-raised p-3 text-sm">
          <p className="text-ink-600">Invite sent to <span className="font-medium text-ink-700">{result.email}</span>.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs text-ink-500">{result.inviteUrl}</code>
            <Button size="s" variant="secondary" icon={Copy} onClick={copy}>Copy link</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export default function TeacherStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useEntitlements();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const load = () => { setLoadError(false); setData(null); teacherAPI.student(id).then((r) => setData(r.data)).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn't load student details." onRetry={load} />;
  if (!data) return <Spinner />;
  const { student, overallMastery, weakTopics, mistakes, assignments } = data;

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader title={student.name} subtitle={student.level} />

      <Card className="mb-4 p-4 sm:mb-5 sm:p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <StatTile label="Overall mastery" value={overallMastery} suffix="%" />
          <StatTile label="Weak topics" value={weakTopics.length} />
          <StatTile label="Open mistakes" value={mistakes.length} />
        </div>
      </Card>

      <button
        onClick={() => navigate(`/teacher/students/${id}/psl`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-line-soft px-4 py-2.5 text-sm font-semibold text-emerald-deep transition hover:border-emerald-border hover:bg-emerald-tint/40"
      >
        <Brain className="h-4 w-4" /> View Problem Solving Lab Sessions
      </button>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weak topics</h3>
          {weakTopics.length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2">
              {weakTopics.map((w, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-700">{w.skillName} <span className="text-ink-400">· {w.topicName}</span></span>
                  <Badge tone={w.score < 40 ? 'error' : 'navy'}>{w.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Assignments</h3>
          {assignments.length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2">
              {assignments.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-700">{a.skillNames?.join(', ') || a.module}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <StudentSciencePanel studentId={id} />

      {can('inviteParents') ? <InviteParentCard studentId={id} /> : null}

      {mistakes.length > 0 && (
        <Card className="mt-5 p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          <ul className="space-y-3">
            {mistakes.slice(0, 5).map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-medium text-ink-700">{m.skillName}</p>
                <p className="text-ink-500"><MathText text={m.questionStem} /></p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
