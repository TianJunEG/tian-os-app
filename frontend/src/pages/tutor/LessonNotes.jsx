import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner } from '../../components/ui';

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => tutorAPI.lessonNotes(id).then((r) => setPast(r.data.lessonNotes || [])).catch(() => setPast([]));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const save = async () => {
    setSaving(true);
    try {
      await tutorAPI.createLessonNote(id, form);
      setSaved(true);
      setForm(Object.fromEntries(FIELDS.map(([k]) => [k, ''])));
      load();
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />

      <Card className="mb-6 space-y-4 p-5">
        {FIELDS.map(([key, label]) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</label>
            <textarea rows={key === 'parentSummary' ? 3 : 2} value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20" />
          </div>
        ))}
        {saved && <p className="text-sm font-semibold text-success-700">Lesson notes saved.</p>}
        <Button size="l" disabled={saving} onClick={save} className="w-full">{saving ? 'Saving…' : 'Save lesson notes'}</Button>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Past notes</h3>
      {!past ? <Spinner /> : past.length === 0 ? <p className="text-sm text-ink-500">No lesson notes yet.</p> : (
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
