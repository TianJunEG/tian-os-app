import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI, diagnosticsAPI, mathpathAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Button, Spinner, Modal } from '../../components/ui';

function fmtTime(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2 text-center">
      <div className="text-lg font-bold text-ink-800">{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}

// Per-student results drill-down: overall stats, weak skills, and a per-question
// breakdown incl. the student's workings.
function KioskStudentDetail({ data }) {
  if (!data?.started) return <p className="text-sm text-ink-500">This student hasn’t started yet.</p>;
  const o = data.overall || {};
  const isPractice = data.type === 'practice';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip label="Accuracy" value={`${o.accuracy ?? 0}%`} />
        <StatChip label="Correct" value={`${o.correct ?? 0}/${o.answered ?? 0}`} />
        {!isPractice && <StatChip label="Readiness" value={o.readinessScore != null ? `${o.readinessScore}%` : (o.readinessBand || '—')} />}
        <StatChip label="Time" value={fmtTime(o.timeSpentSeconds)} />
      </div>

      {!isPractice && data.skills?.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-sm font-semibold text-ink-700">Skills</h4>
          <div className="space-y-1">
            {data.skills.map((sk, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${sk.weak ? 'bg-rose-50 text-rose-700' : 'bg-surface-muted text-ink-700'}`}>
                <span>{sk.name}{sk.weak ? ' · needs work' : ''}</span>
                {sk.score != null && <span className="font-mono">{sk.score}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-1.5 text-sm font-semibold text-ink-700">Questions</h4>
        <div className="space-y-2">
          {(data.questions || []).map((q, i) => (
            <div key={i} className="rounded-lg border border-border-subtle p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-ink-800">{q.prompt || q.skillName || `Question ${i + 1}`}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${q.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{q.correct ? '✓' : '✗'}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500">
                <span>Their answer: <span className="font-mono text-ink-700">{q.studentAnswer || '—'}</span></span>
                {!q.correct && q.correctAnswer && <span>Correct: <span className="font-mono text-emerald-700">{q.correctAnswer}</span></span>}
                {q.timeMs != null && <span>{Math.round(q.timeMs / 1000)}s</span>}
                {q.misconceptions?.length > 0 && <span className="text-rose-600">{q.misconceptions.join(', ')}</span>}
              </div>
              {q.workingImage && (
                <img src={q.workingImage} alt="Student working" className="mt-2 max-h-44 rounded border border-border-subtle" />
              )}
            </div>
          ))}
          {(!data.questions || !data.questions.length) && <p className="text-sm text-ink-400">No per-question detail.</p>}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = { not_started: 'Not started', in_progress: 'In progress', completed: 'Done', abandoned: 'Left' };
const STATUS_COLOR = { not_started: '#8a94a3', in_progress: '#c98a3a', completed: '#2f8f5b', abandoned: '#b23b54' };

export default function ClassDiagnosticKiosk() {
  const { id } = useParams();
  const meta = useClass(id);
  const [kioskType, setKioskType] = useState('diagnostic'); // 'diagnostic' | 'practice'
  const [domains, setDomains] = useState([]);
  const [domainId, setDomainId] = useState('');
  // Practice: topic → skill picker (reuses the MathPath catalogue).
  const [topics, setTopics] = useState(null);
  const [topicId, setTopicId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [session, setSession] = useState(null); // { sessionId, code }
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null); // { studentId, name, loading, data, error }
  const [weakGroups, setWeakGroups] = useState(null); // { groups, analysedStudents }
  const pollRef = useRef(null);

  // Load the diagnostic topics + any already-open session for this class.
  useEffect(() => {
    let active = true;
    diagnosticsAPI.domains().then((r) => {
      if (!active) return;
      const list = r.data?.domains || [];
      setDomains(list);
      setDomainId((d) => d || list[0]?.domainId || '');
    }).catch(() => {});
    teacherAPI.listKioskSessions(id).then((r) => {
      if (!active) return;
      const open = (r.data?.sessions || []).find((s) => s.status === 'open');
      if (open) setSession({ sessionId: open.sessionId, code: open.code });
    }).catch(() => {});
    return () => { active = false; };
  }, [id]);

  // Lazy-load the MathPath catalogue the first time Practice is selected (uses a
  // class student to shape the topic/skill tree, same as Assign work).
  useEffect(() => {
    if (kioskType !== 'practice' || topics !== null) return undefined;
    let active = true;
    setError('');
    teacherAPI.classStudents(id).then((r) => {
      if (!active) return undefined;
      const first = r.data?.students?.[0]?.studentId;
      if (!first) { setTopics([]); return undefined; }
      return mathpathAPI.map({ studentId: first }).then((m) => {
        if (!active) return;
        const ts = m.data?.topics || [];
        setTopics(ts);
        if (ts[0]) setTopicId(String(ts[0].topicId));
      });
    }).catch(() => { if (active) { setTopics([]); setError('Could not load skills for this class.'); } });
    return () => { active = false; };
  }, [kioskType, id, topics]);

  const skills = useMemo(
    () => (topics || []).find((t) => String(t.topicId) === String(topicId))?.skills || [],
    [topics, topicId],
  );

  const poll = useCallback(async (sessionId) => {
    try {
      const { data } = await teacherAPI.kioskSessionStatus(id, sessionId);
      setStatus(data);
    } catch { /* transient — keep last status */ }
  }, [id]);

  // Poll live status every 5s while a session is active.
  useEffect(() => {
    if (!session?.sessionId) return undefined;
    poll(session.sessionId);
    pollRef.current = setInterval(() => poll(session.sessionId), 5000);
    return () => clearInterval(pollRef.current);
  }, [session?.sessionId, poll]);

  // Post-session "groups to pull": refetch whenever another student finishes a
  // diagnostic (completed count changes) — diagnostic sessions only.
  const completedCount = status?.summary?.completed || 0;
  const isDiagnosticSession = (status?.type || kioskType) !== 'practice';
  useEffect(() => {
    if (!session?.sessionId || !isDiagnosticSession || completedCount < 1) { setWeakGroups(null); return undefined; }
    let cancelled = false;
    teacherAPI.kioskWeakGroups(id, session.sessionId)
      .then(({ data }) => { if (!cancelled) setWeakGroups(data); })
      .catch(() => { if (!cancelled) setWeakGroups(null); });
    return () => { cancelled = true; };
  }, [id, session?.sessionId, isDiagnosticSession, completedCount]);

  async function start() {
    if (starting) return;
    if (kioskType === 'diagnostic' && !domainId) return;
    if (kioskType === 'practice' && !skillId) { setError('Choose a skill to practise.'); return; }
    setStarting(true);
    setError('');
    try {
      const body = kioskType === 'practice'
        ? { type: 'practice', skillId, questionCount: Number(questionCount) }
        : { type: 'diagnostic', domainId };
      const { data } = await teacherAPI.createKioskSession(id, body);
      setSession({ sessionId: data.sessionId, code: data.code });
      setStatus(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not start the check-in.');
    } finally {
      setStarting(false);
    }
  }

  async function openDetail(s) {
    if (!session?.sessionId || s.attemptStatus === 'not_started') return;
    setDetail({ studentId: s.studentId, name: s.name, loading: true, data: null, error: '' });
    try {
      const { data } = await teacherAPI.kioskStudentDetail(id, session.sessionId, s.studentId);
      setDetail({ studentId: s.studentId, name: s.name, loading: false, data, error: '' });
    } catch (e) {
      setDetail({ studentId: s.studentId, name: s.name, loading: false, data: null, error: e?.response?.data?.error || 'Could not load results.' });
    }
  }

  async function close() {
    if (!session?.sessionId) return;
    try {
      await teacherAPI.closeKioskSession(id, session.sessionId);
    } catch { /* ignore */ }
    clearInterval(pollRef.current);
    setSession(null);
    setStatus(null);
  }

  const kioskUrl = session ? `${window.location.origin}/kiosk/${session.code}` : '';

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {!session ? (
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold text-ink-800">Start an in-class session</h2>
          <p className="mb-4 text-sm text-ink-500">
            {kioskType === 'practice'
              ? 'Students scan a QR on the classroom iPads, tap their name, and work through a set of practice questions on the skill you choose. Results land on each student’s account.'
              : 'Students scan a QR on the classroom iPads, tap their name, and take a short adaptive diagnostic. Results land on each student’s account — Mistakes review and Recommended Practice update automatically.'}
          </p>

          {/* Session-type toggle */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: 'diagnostic', label: 'Diagnostic check-in' },
              { key: 'practice', label: 'Skill practice' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setKioskType(t.key); setError(''); }}
                className={`rounded-full border px-3 py-1.5 text-sm ${kioskType === t.key ? 'border-emerald bg-emerald-tint font-semibold text-emerald-deep' : 'border-line-soft text-ink-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {kioskType === 'diagnostic' ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">Topic</span>
                <select
                  value={domainId}
                  onChange={(e) => setDomainId(e.target.value)}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-ink-800"
                >
                  {domains.map((d) => (
                    <option key={d.domainId} value={d.domainId}>{d.displayName || d.domainId}</option>
                  ))}
                </select>
              </label>
              <Button onClick={start} disabled={starting || !domainId}>
                {starting ? 'Starting…' : 'Start check-in'}
              </Button>
            </div>
          ) : topics === null ? (
            <Spinner />
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">Topic</span>
                <select
                  value={topicId}
                  onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-ink-800"
                >
                  {(topics || []).map((t) => (
                    <option key={t.topicId} value={t.topicId}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">Skill</span>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-ink-800"
                >
                  <option value="">Choose a skill…</option>
                  {skills.map((s) => (
                    <option key={s.skillId} value={s.skillId}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-600">Questions</span>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-24 rounded-lg border border-border-subtle px-3 py-2 font-mono text-ink-800"
                />
              </label>
              <Button onClick={start} disabled={starting || !skillId}>
                {starting ? 'Starting…' : 'Start practice'}
              </Button>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Check-in is live</p>
                <p className="mt-2 text-sm text-ink-500">Students go to</p>
                <p className="text-lg font-semibold text-ink-800">{kioskUrl.replace(/^https?:\/\//, '')}</p>
                <p className="mt-3 text-sm text-ink-500">or enter code</p>
                <p className="font-mono text-4xl font-extrabold tracking-widest text-ink-900">{session.code}</p>
                <Button className="mt-4" variant="secondary" onClick={close}>End check-in</Button>
              </div>
              {kioskUrl && (
                <div className="self-center rounded-xl border border-border-subtle bg-white p-2">
                  <QRCodeSVG value={kioskUrl} size={200} title="Scan to join the check-in" />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-ink-800">Live progress</h3>
              {status?.summary && (
                <p className="text-sm text-ink-500">
                  {status.summary.completed} done · {status.summary.inProgress} in progress · {status.summary.notStarted} waiting
                </p>
              )}
            </div>
            {!status ? <Spinner /> : (
              <div className="space-y-1.5">
                {status.students.map((s) => {
                  const started = s.attemptStatus !== 'not_started';
                  return (
                    <button
                      key={s.studentId}
                      type="button"
                      onClick={() => openDetail(s)}
                      disabled={!started}
                      title={started ? 'View results' : undefined}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${started ? 'cursor-pointer bg-surface-muted hover:bg-emerald-tint' : 'cursor-default bg-surface-muted opacity-80'}`}
                    >
                      <span className="font-medium text-ink-700">{s.name}</span>
                      <span className="flex items-center gap-3 text-sm">
                        {started && (
                          <span className="text-ink-500">{s.answeredCount} answered{s.readinessScore != null ? ` · ${s.readinessScore}%` : ''}</span>
                        )}
                        <span style={{ color: STATUS_COLOR[s.attemptStatus] || '#8a94a3' }} className="font-semibold">
                          {STATUS_LABEL[s.attemptStatus] || s.attemptStatus}
                        </span>
                        {started && <span className="text-ink-300" aria-hidden="true">›</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {isDiagnosticSession && weakGroups?.groups?.length > 0 && (
            <Card className="p-5">
              <div className="mb-3">
                <h3 className="font-bold text-ink-800">Groups to pull</h3>
                <p className="text-sm text-ink-500">
                  Skills the class struggled with in this check-in ({weakGroups.analysedStudents} finished).
                </p>
              </div>
              <div className="space-y-2">
                {weakGroups.groups.map((g) => (
                  <div key={g.skillId} className="rounded-lg bg-surface-muted px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink-700">{g.skillName}</span>
                      <span className="whitespace-nowrap text-sm font-semibold text-rose-600">
                        {g.studentCount} {g.studentCount === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500">{g.students.join(', ')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.name} — results` : ''}
      >
        {detail?.loading ? <Spinner /> : detail?.error ? (
          <p className="text-sm text-rose-600">{detail.error}</p>
        ) : detail?.data ? (
          <KioskStudentDetail data={detail.data} />
        ) : null}
      </Modal>
    </>
  );
}
