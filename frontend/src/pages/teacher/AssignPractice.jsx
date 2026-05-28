import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { teacherAPI, mathpathAPI, skillsAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, Spinner } from '../../components/ui';

const MODULES = [
  { key: 'MathPath', label: 'MathPath', subject: 'Math' },
  { key: 'Science Adaptive Revision', label: 'Science', subject: 'Science' },
];

// /api/skills?subject=science returns flat skills; reshape into the same
// { topicId, name, skills: [{ skillId, name }] } form that mathpathAPI.map
// produces, with level suffixed so same-name topics across levels are
// distinguishable in the dropdown.
function shapeScienceAsTopics(skills) {
  const byTopic = new Map();
  for (const s of skills) {
    const id = String(s.topicId);
    if (!byTopic.has(id)) byTopic.set(id, {
      topicId: s.topicId,
      name: `${s.topicName}${s.moeLevel ? ' · ' + s.moeLevel.replace('Primary ', 'P') : ''}`,
      skills: [],
    });
    byTopic.get(id).skills.push({ skillId: s.skillId, name: s.name });
  }
  return [...byTopic.values()];
}

// Assign targeted practice to the whole class or a saved group. Math or Science.
export default function AssignPractice() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const meta = useClass(id);

  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState(null);
  const [target, setTarget] = useState(params.get('group') ? { type: 'group', id: params.get('group') } : { type: 'class' });
  const [module, setModule] = useState('MathPath');
  const [topicId, setTopicId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    teacherAPI.groups(id).then((r) => setGroups(r.data.saved || [])).catch(() => {});
  }, [id]);

  // Reload the catalog whenever the class or module changes. Both Math and
  // Science endpoints are seeded by picking the first student in the class;
  // skills are the same across the class (they're a catalog, not per-student),
  // so a single fetch via that student is fine.
  useEffect(() => {
    setTopics(null); setTopicId(''); setSkillId('');
    teacherAPI.classStudents(id).then((r) => {
      const first = r.data.students?.[0]?.studentId;
      if (!first) { setTopics([]); return; }
      const fetch = module === 'Science Adaptive Revision'
        ? skillsAPI.list({ subject: 'science', studentId: first }).then((m) => shapeScienceAsTopics(m.data.skills || []))
        : mathpathAPI.map({ studentId: first }).then((m) => m.data.topics || []);
      fetch.then((ts) => { setTopics(ts); if (ts[0]) setTopicId(String(ts[0].topicId)); }).catch(() => setTopics([]));
    }).catch(() => setTopics([]));
  }, [id, module]);

  const skills = useMemo(() => topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [], [topics, topicId]);

  const submit = async () => {
    if (!skillId) { setError('Choose a skill.'); return; }
    setSaving(true); setError(null);
    try {
      const subject = MODULES.find((m) => m.key === module)?.subject || 'Math';
      const { data } = await teacherAPI.assign(id, { target, module, subject, topicId, skillIds: [skillId], difficulty, questionCount: Number(questionCount), dueDate: dueDate || null });
      setDone(data.assigned);
    } catch (e) { setError(e.response?.data?.error || 'Could not assign.'); setSaving(false); }
  };

  if (done != null) {
    return (
      <>
        <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-success-500" />
          <p className="font-semibold text-ink-700">Assigned to {done} student{done > 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <Button size="s" variant="secondary" onClick={() => navigate(`/teacher/classes/${id}`)}>Back to class</Button>
            <Button size="s" onClick={() => { setDone(null); setSaving(false); }}>Assign more</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      {!topics ? <Spinner /> : (
        <Card className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Assign to</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTarget({ type: 'class' })} className={`rounded-full border px-3 py-1.5 text-sm ${target.type === 'class' ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>Whole class</button>
              {groups.map((g) => (
                <button key={g._id} onClick={() => setTarget({ type: 'group', id: g._id })} className={`rounded-full border px-3 py-1.5 text-sm ${target.type === 'group' && target.id === g._id ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>{g.name}</button>
              ))}
              {groups.length === 0 && <span className="text-sm text-ink-400">No saved groups yet — create some in Groups.</span>}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Module</label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setModule(m.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${module === m.key ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}
                >
                  {m.label}
                </button>
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
          <Button size="l" disabled={saving} onClick={submit} className="w-full">{saving ? 'Assigning…' : 'Assign practice'}</Button>
        </Card>
      )}
    </>
  );
}
