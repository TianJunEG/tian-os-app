import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Spinner } from '../../components/ui';

const STATUSES = [
  { key: 'all_correct', label: 'All correct', color: '#2f8f5b', bg: '#e8f6ee' },
  { key: 'penmanship', label: 'Penmanship', color: '#b5791f', bg: '#fbf1de' },
  { key: 'one_slip', label: 'One slip', color: '#2563c9', bg: '#e7f0fd' },
  { key: 'many_mistakes', label: 'Needs help', color: '#c0405a', bg: '#fceaee' },
  { key: 'not_done', label: 'Not done', color: '#8a94a3', bg: '#f1f3f5' },
];
const NEEDS_DETAIL = new Set(['penmanship', 'one_slip', 'many_mistakes']);

export default function ClassQuickMark() {
  const { id } = useParams();
  const meta = useClass(id);
  const [recent, setRecent] = useState(null);
  const [session, setSession] = useState(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadRecent = useCallback(() => {
    teacherAPI.listQuickMarks(id).then((r) => setRecent(r.data.sessions || [])).catch(() => setRecent([]));
  }, [id]);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  async function start() {
    setBusy(true); setError('');
    try {
      const { data } = await teacherAPI.createQuickMark(id, { title: title.trim() });
      setSession(data.session);
    } catch (e) { setError(e?.response?.data?.error || 'Could not start Quick Mark.'); }
    finally { setBusy(false); }
  }

  async function open(qid) {
    setBusy(true); setError('');
    try { const { data } = await teacherAPI.getQuickMark(id, qid); setSession(data.session); }
    catch { setError('Could not open that session.'); }
    finally { setBusy(false); }
  }

  function patchLocal(studentId, patch) {
    setSession((s) => s && { ...s, marks: s.marks.map((m) => (m.studentId === studentId ? { ...m, ...patch } : m)) });
  }

  function mark(studentId, status) {
    patchLocal(studentId, { status }); // optimistic — feels instant flipping through the stack
    teacherAPI.setQuickMark(id, session.quickMarkId, { studentId, status }).catch(() => {});
  }
  function saveNote(studentId, note) {
    patchLocal(studentId, { note });
    teacherAPI.setQuickMark(id, session.quickMarkId, { studentId, note }).catch(() => {});
  }
  async function uploadPhoto(studentId, file) {
    if (!file) return;
    const fd = new FormData(); fd.append('photo', file);
    try {
      const { data } = await teacherAPI.uploadQuickMarkPhoto(id, session.quickMarkId, studentId, fd);
      patchLocal(studentId, { photoUrl: data.photoUrl });
    } catch { setError('Photo upload failed.'); }
  }

  if (!session) {
    return (
      <>
        <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
        <Card className="mb-4 p-5">
          <h2 className="mb-1 text-lg font-bold text-ink-800">Quick Mark a worksheet stack</h2>
          <p className="mb-4 text-sm text-ink-500">Flip through the papers and tap one status per student. The weak group is captured for follow-up; penmanship and all-correct get noted too.</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-600">Worksheet name (optional)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fractions WS 3"
                className="w-64 rounded-lg border border-border-subtle px-3 py-2 text-ink-800" />
            </label>
            <Button onClick={start} disabled={busy}>{busy ? 'Starting…' : 'Start Quick Mark'}</Button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </Card>

        {recent === null ? <Spinner /> : recent.length > 0 && (
          <Card className="p-4">
            <h3 className="mb-2 font-semibold text-ink-700">Recent</h3>
            <div className="space-y-1.5">
              {recent.map((s) => (
                <button key={s.quickMarkId} type="button" onClick={() => open(s.quickMarkId)}
                  className="flex w-full items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-left hover:bg-surface-hover">
                  <span className="font-medium text-ink-700">{s.title || 'Untitled worksheet'}</span>
                  <span className="text-sm text-ink-500">{s.marked}/{s.total} marked · {new Date(s.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </>
    );
  }

  const counts = STATUSES.reduce((a, s) => { a[s.key] = session.marks.filter((m) => m.status === s.key).length; return a; }, {});
  const weak = session.marks.filter((m) => m.status === 'many_mistakes');

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-800">{session.title || 'Quick Mark'}</h2>
          <p className="text-sm text-ink-500">{session.marks.filter((m) => m.status !== 'not_done').length}/{session.marks.length} marked</p>
        </div>
        <Button size="s" variant="secondary" onClick={() => { setSession(null); loadRecent(); }}>Done</Button>
      </div>

      {/* Live summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <span key={s.key} className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: s.bg, color: s.color }}>
            {counts[s.key]} {s.label}
          </span>
        ))}
      </div>

      {weak.length > 0 && (
        <Card className="mb-4 border-l-4 p-3" style={{ borderLeftColor: '#c0405a' }}>
          <p className="text-sm font-semibold text-ink-700">Weak group ({weak.length}) — needs follow-up</p>
          <p className="mt-1 text-sm text-ink-500">{weak.map((m) => m.name).join(', ')}</p>
        </Card>
      )}

      <div className="space-y-1.5">
        {session.marks.map((m) => {
          const active = STATUSES.find((s) => s.key === m.status);
          return (
            <div key={m.studentId} className="rounded-lg border border-border-subtle p-2"
              style={{ background: active && m.status !== 'not_done' ? active.bg : '#fff' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate font-medium text-ink-700">{m.name}</span>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => {
                    const on = m.status === s.key;
                    return (
                      <button key={s.key} type="button" onClick={() => mark(m.studentId, s.key)} title={s.label}
                        style={{
                          padding: '5px 9px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                          border: '1.5px solid', borderColor: on ? s.color : '#e3e7eb',
                          background: on ? s.color : '#fff', color: on ? '#fff' : '#5a6675',
                        }}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {NEEDS_DETAIL.has(m.status) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input defaultValue={m.note} placeholder="Note (optional)" onBlur={(e) => saveNote(m.studentId, e.target.value)}
                    className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-sm" />
                  <label className="cursor-pointer rounded-md border border-border-subtle px-2 py-1 text-xs text-ink-600 hover:bg-surface-muted">
                    {m.photoUrl ? '✓ Photo' : '📷 Photo'}
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => uploadPhoto(m.studentId, e.target.files?.[0])} />
                  </label>
                  {m.status === 'many_mistakes' && (
                    <a href={`/teacher/mathpath/classes/${id}/students/${m.studentId}/analyse-paper`}
                      className="text-xs font-medium text-blue-600 hover:underline">Scan worksheet →</a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </>
  );
}
