import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { mathpathAPI, assignmentsAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner } from '../../components/ui';

const MODULES = [
  { key: 'MathPath', label: 'MathPath', enabled: true },
  { key: 'Mistake-to-Mastery', label: 'Mistake-to-Mastery', enabled: true },
  { key: 'Fluency Practice', label: 'Fluency Practice', enabled: true },
  { key: 'Mastery Worksheet', label: 'Mastery Worksheet', enabled: false },
  { key: 'Spelling Practice', label: 'Spelling Practice', enabled: false },
];
const HW_TYPES = ['Digital practice', 'Mistake review', 'Fluency drill'];

export default function AssignHomework() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useTutorStudent(id);
  const [topics, setTopics] = useState(null);
  const [module, setModule] = useState('MathPath');
  const [hwType, setHwType] = useState('Digital practice');
  const [topicId, setTopicId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    mathpathAPI.map({ studentId: id }).then((r) => {
      const ts = r.data.topics || []; setTopics(ts); if (ts[0]) setTopicId(String(ts[0].topicId));
    }).catch(() => setTopics([]));
  }, [id]);

  const skills = useMemo(() => topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [], [topics, topicId]);

  const submit = async () => {
    if (!skillId) { setError('Choose a skill.'); return; }
    setSaving(true); setError(null);
    try {
      await assignmentsAPI.create({
        studentId: id, module, subject: 'Math', assignedByRole: 'tutor',
        topicId, skillIds: [skillId], difficulty, questionCount: Number(questionCount), dueDate: dueDate || null,
      });
      setDone(true);
    } catch (e) { setError(e.response?.data?.error || 'Could not assign.'); setSaving(false); }
  };

  if (done) {
    return (
      <>
        <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-success-500" />
          <p className="font-semibold text-ink-700">Homework assigned</p>
          <div className="flex gap-2">
            <Button size="s" variant="secondary" onClick={() => navigate(`/tutor/students/${id}`)}>Back to student</Button>
            <Button size="s" onClick={() => { setDone(false); setSaving(false); }}>Assign another</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />
      {!topics ? <Spinner /> : (
        <Card className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Module</label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <button key={m.key} disabled={!m.enabled} onClick={() => m.enabled && setModule(m.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${module === m.key ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : m.enabled ? 'border-hairline text-ink-700' : 'border-hairline text-ink-300'}`}>
                  {m.label}{!m.enabled && <Badge tone="neutral">soon</Badge>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Homework type</label>
            <div className="flex flex-wrap gap-2">
              {HW_TYPES.map((t) => (
                <button key={t} onClick={() => setHwType(t)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${hwType === t ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Topic</label>
              <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Skill</label>
              <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                <option value="">Choose a skill…</option>
                {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Questions</label>
              <input type="number" min="5" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5 font-mono" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5" />
            </div>
          </div>
          {error && <p className="text-sm text-error-700">{error}</p>}
          <Button size="l" disabled={saving} onClick={submit} className="w-full">{saving ? 'Assigning…' : 'Assign homework'}</Button>
        </Card>
      )}
    </>
  );
}
