import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { tutorAPI, skillsAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner, Field, Input, Select, Textarea, ErrorState } from '../../components/ui';

const FIELDS = [
  ['covered', 'What was covered'],
  ['didWell', 'What the student did well'],
  ['struggledWith', 'What the student struggled with'],
  ['misconceptions', 'Mistakes / misconceptions'],
  ['homeworkAssigned', 'Homework assigned'],
  ['nextRecommendation', 'Next lesson recommendation'],
  ['parentSummary', 'Parent-friendly summary'],
];

const WEAK_THRESHOLD = 60; // accuracy at/below this offers one-tap targeted practice

const accuracyOf = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : null);
const accTone = (acc) => (acc >= 80 ? 'success' : acc >= 60 ? 'gold' : 'error');

const emptyRow = () => ({ topicId: '', correct: '', total: '' });

// Record lesson notes + this week's homework accuracy by topic. "Send to parent"
// delivers the summary as an in-app notification to the student's guardians.
export default function LessonNotes() {
  const { id } = useParams();
  const meta = useTutorStudent(id);
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(([k]) => [k, ''])));
  const [hwRows, setHwRows] = useState([emptyRow()]);
  const [topics, setTopics] = useState([]);
  const [past, setPast] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [assigningKey, setAssigningKey] = useState(null);
  const [assignedKeys, setAssignedKeys] = useState(() => new Set());
  const [assignError, setAssignError] = useState(null);

  // Topic catalog (math) — also gives us the skills per topic, used to spin up
  // targeted practice when a topic comes in weak.
  const topicById = Object.fromEntries(topics.map((t) => [t.topicId, t]));
  useEffect(() => {
    skillsAPI.list({ subject: 'math', studentId: id })
      .then((r) => {
        const byTopic = new Map();
        for (const s of (r.data?.skills || [])) {
          if (!s.topicId || !s.topicName) continue;
          const key = String(s.topicId);
          if (!byTopic.has(key)) byTopic.set(key, { topicId: key, topicName: s.topicName, skillIds: [] });
          byTopic.get(key).skillIds.push(s.skillId);
        }
        setTopics([...byTopic.values()].sort((a, b) => a.topicName.localeCompare(b.topicName)));
      })
      .catch(() => setTopics([]));
  }, [id]);

  const setRow = (i, patch) => setHwRows((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setHwRows((rows) => [...rows, emptyRow()]);
  const removeRow = (i) => setHwRows((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : [emptyRow()]));

  const buildHomeworkResults = () => hwRows
    .map((r) => {
      const t = topicById[r.topicId];
      const total = Math.round(Number(r.total) || 0);
      const correct = Math.round(Number(r.correct) || 0);
      if (!t || total <= 0) return null;
      return { topicId: t.topicId, topicName: t.topicName, correct: Math.min(Math.max(correct, 0), total), total };
    })
    .filter(Boolean);

  const weekTotals = (() => {
    const rows = buildHomeworkResults();
    const correct = rows.reduce((s, r) => s + r.correct, 0);
    const total = rows.reduce((s, r) => s + r.total, 0);
    return { correct, total, accuracy: accuracyOf(correct, total) };
  })();

  const sendToParent = async (noteId) => {
    setSendingId(noteId);
    try {
      await tutorAPI.sendLessonNote(id, noteId);
      load();
    } catch {
      setSaveError("Couldn't send to parent. Please try again.");
    } finally { setSendingId(null); }
  };

  const assignPractice = async (note, hr) => {
    const t = topicById[String(hr.topicId)];
    const skillIds = t?.skillIds || [];
    const key = `${note._id}:${hr.topicId}`;
    if (!skillIds.length) { setAssignError(`No practice skills found for ${hr.topicName}.`); return; }
    setAssignError(null);
    setAssigningKey(key);
    try {
      const acc = accuracyOf(hr.correct, hr.total);
      await tutorAPI.assignLessonPrepRecoveryPack(id, {
        skillIds,
        subjectId: 'math',
        title: `${hr.topicName} practice`,
        description: `Targeted practice after ${acc}% on ${hr.topicName} homework.`,
      });
      setAssignedKeys((s) => new Set(s).add(key));
    } catch {
      setAssignError("Couldn't assign practice. Please try again.");
    } finally { setAssigningKey(null); }
  };

  const load = () => {
    setLoadError(false);
    setPast(null);
    tutorAPI.lessonNotes(id).then((r) => setPast(r.data.lessonNotes || [])).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await tutorAPI.createLessonNote(id, { ...form, homeworkResults: buildHomeworkResults() });
      setSaved(true);
      setForm(Object.fromEntries(FIELDS.map(([k]) => [k, ''])));
      setHwRows([emptyRow()]);
      load();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveError("Couldn't save lesson notes. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />

      <Card className="mb-6 space-y-4 p-5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Homework results this week</h3>
            {weekTotals.total > 0 && (
              <span className="text-xs text-ink-500">{weekTotals.correct}/{weekTotals.total} · {weekTotals.accuracy}%</span>
            )}
          </div>
          <p className="mb-3 text-xs text-ink-400">Pick a topic and enter how many she got right out of the total.</p>

          <div className="space-y-2">
            {hwRows.map((r, i) => {
              const acc = accuracyOf(Number(r.correct) || 0, Number(r.total) || 0);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Select value={r.topicId} onChange={(e) => setRow(i, { topicId: e.target.value })} aria-label="Topic">
                      <option value="">Select topic…</option>
                      {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}
                    </Select>
                  </div>
                  <Input type="number" min="0" inputMode="numeric" className="w-16 text-center" placeholder="✓"
                    value={r.correct} onChange={(e) => setRow(i, { correct: e.target.value })} aria-label="Correct" />
                  <span className="text-ink-300">/</span>
                  <Input type="number" min="0" inputMode="numeric" className="w-16 text-center" placeholder="total"
                    value={r.total} onChange={(e) => setRow(i, { total: e.target.value })} aria-label="Total" />
                  <span className="w-12 text-right text-sm font-semibold tabular-nums">
                    {acc == null ? <span className="text-ink-300">—</span> : <span className={acc >= 80 ? 'text-emerald' : acc >= 60 ? 'text-gold-label' : 'text-danger-deep'}>{acc}%</span>}
                  </span>
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove topic"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-300 hover:bg-line hover:text-danger-deep">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={addRow}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:text-emerald-deep">
            <Plus className="h-4 w-4" /> Add topic
          </button>
        </div>

        <div className="border-t border-line-soft pt-4 space-y-4">
          {FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              <Textarea rows={key === 'parentSummary' ? 3 : 2} value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
            </Field>
          ))}
        </div>

        {saved && <p className="text-sm font-semibold text-success-700">Lesson notes saved.</p>}
        {saveError && <p className="text-sm text-error-700">{saveError}</p>}
        <Button size="l" disabled={saving} onClick={save} className="w-full">{saving ? 'Saving…' : 'Save lesson notes'}</Button>
      </Card>

      {assignError && <p className="mb-3 text-sm text-error-700">{assignError}</p>}
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Past notes</h3>
      {loadError ? <ErrorState message="Couldn’t load past lesson notes." onRetry={load} /> : !past ? <Spinner /> : past.length === 0 ? <p className="text-sm text-ink-500">No lesson notes yet.</p> : (
        <div className="space-y-3">
          {past.map((n) => (
            <Card key={n._id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-ink-300">{new Date(n.createdAt).toLocaleDateString()}</span>
                <Badge tone={n.parentUpdateStatus === 'sent' ? 'success' : 'neutral'}>{n.parentUpdateStatus}</Badge>
              </div>
              {Array.isArray(n.homeworkResults) && n.homeworkResults.length > 0 && (
                <div className="mb-2 space-y-1.5 rounded-lg bg-paper p-2.5">
                  {n.homeworkResults.map((hr, i) => {
                    const acc = accuracyOf(hr.correct, hr.total);
                    const key = `${n._id}:${hr.topicId}`;
                    const canAssign = acc != null && acc <= WEAK_THRESHOLD && (topicById[String(hr.topicId)]?.skillIds.length > 0);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-ink-700">{hr.topicName}</span>
                        <span className="text-ink-400 tabular-nums">{hr.correct}/{hr.total}</span>
                        {acc != null && <Badge tone={accTone(acc)}>{acc}%</Badge>}
                        {canAssign && (assignedKeys.has(key)
                          ? <span className="text-xs font-semibold text-success-700">Practice assigned</span>
                          : <Button size="s" variant="secondary" disabled={assigningKey === key} onClick={() => assignPractice(n, hr)}>
                              {assigningKey === key ? 'Assigning…' : 'Assign practice'}
                            </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {n.covered && <p className="text-sm text-ink-700">{n.covered}</p>}
              {n.parentSummary && <p className="mt-1 text-sm text-ink-500">Parent: {n.parentSummary}</p>}
              {n.parentUpdateStatus !== 'sent' && (
                <Button size="s" variant="secondary" className="mt-3"
                  disabled={sendingId === n._id}
                  onClick={() => sendToParent(n._id)}>
                  {sendingId === n._id ? 'Sending…' : 'Send to parent'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
