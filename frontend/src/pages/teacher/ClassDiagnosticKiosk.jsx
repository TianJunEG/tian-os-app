import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI, diagnosticsAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Spinner } from '../../components/ui';

const STATUS_LABEL = { not_started: 'Not started', in_progress: 'In progress', completed: 'Done', abandoned: 'Left' };
const STATUS_COLOR = { not_started: '#8a94a3', in_progress: '#c98a3a', completed: '#2f8f5b', abandoned: '#b23b54' };

export default function ClassDiagnosticKiosk() {
  const { id } = useParams();
  const meta = useClass(id);
  const [domains, setDomains] = useState([]);
  const [domainId, setDomainId] = useState('');
  const [session, setSession] = useState(null); // { sessionId, code }
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
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

  async function start() {
    if (!domainId || starting) return;
    setStarting(true);
    setError('');
    try {
      const { data } = await teacherAPI.createKioskSession(id, { domainId });
      setSession({ sessionId: data.sessionId, code: data.code });
      setStatus(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not start the check-in.');
    } finally {
      setStarting(false);
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
  const qrSrc = kioskUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(kioskUrl)}`
    : '';

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {!session ? (
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold text-ink-800">Start an in-class check-in</h2>
          <p className="mb-4 text-sm text-ink-500">
            Students scan a QR on the classroom iPads, tap their name, and take a short adaptive
            diagnostic. Results land on each student&apos;s account — Mistakes review and Recommended
            Practice update automatically.
          </p>
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
              {qrSrc && (
                <img src={qrSrc} alt="Scan to join the check-in" width={200} height={200}
                  className="self-center rounded-xl border border-border-subtle" />
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
                {status.students.map((s) => (
                  <div key={s.studentId} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
                    <span className="font-medium text-ink-700">{s.name}</span>
                    <span className="flex items-center gap-3 text-sm">
                      {s.attemptStatus !== 'not_started' && (
                        <span className="text-ink-500">{s.answeredCount} answered{s.readinessScore != null ? ` · ${s.readinessScore}%` : ''}</span>
                      )}
                      <span style={{ color: STATUS_COLOR[s.attemptStatus] || '#8a94a3' }} className="font-semibold">
                        {STATUS_LABEL[s.attemptStatus] || s.attemptStatus}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
