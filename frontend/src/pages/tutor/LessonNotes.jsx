import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner, Field, Textarea, ErrorState } from '../../components/ui';

const FIELDS = [
  ['covered', 'What was covered'],
  ['didWell', 'What the student did well'],
  ['struggledWith', 'What the student struggled with'],
  ['misconceptions', 'Mistakes / misconceptions'],
  ['homeworkAssigned', 'Homework assigned'],
  ['nextRecommendation', 'Next lesson recommendation'],
  ['parentSummary', 'Parent-friendly summary'],
];

// Record lesson notes; the parent summary is saved (sending awaits messaging).
export default function LessonNotes() {
  const { id } = useParams();
  const meta = useTutorStudent(id);
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(([k]) => [k, ''])));
  const [past, setPast] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      await tutorAPI.createLessonNote(id, form);
      setSaved(true);
      setForm(Object.fromEntries(FIELDS.map(([k]) => [k, ''])));
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
        {FIELDS.map(([key, label]) => (
          <Field key={key} label={label}>
            <Textarea rows={key === 'parentSummary' ? 3 : 2} value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
          </Field>
        ))}
        {saved && <p className="text-sm font-semibold text-success-700">Lesson notes saved.</p>}
        {saveError && <p className="text-sm text-error-700">{saveError}</p>}
        <Button size="l" disabled={saving} onClick={save} className="w-full">{saving ? 'Saving…' : 'Save lesson notes'}</Button>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Past notes</h3>
      {loadError ? <ErrorState message="Couldn’t load past lesson notes." onRetry={load} /> : !past ? <Spinner /> : past.length === 0 ? <p className="text-sm text-ink-500">No lesson notes yet.</p> : (
        <div className="space-y-3">
          {past.map((n) => (
            <Card key={n._id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-ink-300">{new Date(n.createdAt).toLocaleDateString()}</span>
                <Badge tone={n.parentUpdateStatus === 'sent' ? 'success' : 'neutral'}>{n.parentUpdateStatus}</Badge>
              </div>
              <p className="text-sm text-ink-700">{n.covered}</p>
              {n.parentSummary && <p className="mt-1 text-sm text-ink-500">Parent: {n.parentSummary}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
