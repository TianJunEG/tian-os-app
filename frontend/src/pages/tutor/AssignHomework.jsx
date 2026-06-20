import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { mathpathAPI, skillsAPI, assignmentsAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Spinner, ErrorState } from '../../components/ui';
import { shapeScienceAsTopics } from '../../utils/scienceCatalog';

const MODULES = [
  { key: 'MathPath', label: 'MathPath', enabled: true },
  { key: 'Science Adaptive Revision', label: 'Science', enabled: true },
];

const HW_TYPES = ['Digital practice', 'Mistake review', 'Fluency drill'];

// Map the tutor-facing homework type to the Assignment model's interventionType enum.
const HW_TYPE_TO_INTERVENTION = {
  'Digital practice': 'practice_pack',
  'Mistake review': 'retention_review',
  'Fluency drill': 'fluency_drill',
};

const clampQuestionCount = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  return Math.min(20, Math.max(5, Math.round(n)));
};

export default function AssignHomework() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useTutorStudent(id);
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState(false);
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

  const loadTopics = () => {
    setLoadError(false);
    setTopics(null); setTopicId(''); setSkillId('');
    const fetcher = module === 'Science Adaptive Revision'
      ? skillsAPI.list({ subject: 'science', studentId: id }).then((r) => shapeScienceAsTopics(r.data.skills || []))
      : mathpathAPI.map({ studentId: id }).then((r) => r.data.topics || []);
    fetcher.then((ts) => { setTopics(ts); if (ts[0]) setTopicId(String(ts[0].topicId)); }).catch(() => setLoadError(true));
  };
  useEffect(() => { loadTopics(); }, [id, module]);

  const skills = useMemo(() => topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [], [topics, topicId]);

  const submit = async () => {
    if (!skillId) { setError('Choose a skill.'); return; }
    setSaving(true); setError(null);
    try {
      await assignmentsAPI.create({
        studentId: id, module,
        subject: module === 'Science Adaptive Revision' ? 'Science' : 'Math',
        assignedByRole: 'tutor',
        topicId, skillIds: [skillId], difficulty,
        interventionType: HW_TYPE_TO_INTERVENTION[hwType] || '',
        questionCount: clampQuestionCount(questionCount), dueDate: dueDate || null,
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
      {!meta?.loading && meta?.error && (
        <p className="mb-3 text-sm text-error-700">
          {meta.error === 'not_found'
            ? "Couldn’t find this student in your workspace."
            : "Couldn’t load student details. The header may be incomplete."}
        </p>
      )}
      {loadError ? (
        <ErrorState message="Couldn't load topic catalogue." onRetry={loadTopics} />
      ) : !topics ? <Spinner /> : (
        <Card className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Module</label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <button key={m.key} disabled={!m.enabled} onClick={() => m.enabled && setModule(m.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${module === m.key ? 'border-emerald bg-emerald-tint font-semibold text-emerald-deep' : m.enabled ? 'border-line-soft text-ink-700' : 'border-line-soft text-ink-300'}`}>
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
                  className={`rounded-full border px-3 py-1.5 text-sm ${hwType === t ? 'border-emerald bg-emerald-tint font-semibold text-emerald-deep' : 'border-line-soft text-ink-700'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Topic</label>
              <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }} className="w-full rounded-xl border border-line-soft px-3 py-2.5">
                {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Skill</label>
              <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full rounded-xl border border-line-soft px-3 py-2.5">
                <option value="">Choose a skill…</option>
                {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {module === 'MathPath' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-xl border border-line-soft px-3 py-2.5">
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Questions</label>
              <input type="number" min="5" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} onBlur={(e) => setQuestionCount(clampQuestionCount(e.target.value))} className="w-full rounded-xl border border-line-soft px-3 py-2.5 font-mono" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-line-soft px-3 py-2.5" />
            </div>
          </div>
          {error && <p className="text-sm text-error-700">{error}</p>}
          <Button size="l" disabled={saving} onClick={submit} className="w-full">{saving ? 'Assigning…' : 'Assign homework'}</Button>
        </Card>
      )}
    </>
  );
}
