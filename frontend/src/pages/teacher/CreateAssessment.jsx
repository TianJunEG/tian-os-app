import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Send } from 'lucide-react';
import { teacherAPI, mathpathAPI, pslAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Spinner, Alert, Input } from '../../components/ui';

const MODULES = [
  { key: 'MathPath', label: 'MathPath' },
  { key: 'PSL', label: 'Problem Solving' },
];

export default function CreateAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);

  const [module, setModule] = useState('MathPath');
  const [topics, setTopics] = useState(null);
  const [topicId, setTopicId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [timed, setTimed] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [target, setTarget] = useState({ type: 'class' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  // PSL skills
  const [pslSkills, setPslSkills] = useState(null);

  useEffect(() => {
    teacherAPI.groups(id).then((r) => setGroups(r.data.saved || [])).catch((e) => console.warn("CreateAssessment: fetch failed", e));
  }, [id]);

  const loadCatalog = useCallback(() => {
    setTopics(null); setTopicId(''); setSkillId(''); setPreview(null);
    if (module === 'PSL') {
      pslAPI.home()
        .then((r) => {
          const skills = r.data.skills || [];
          setPslSkills(skills);
          setTopics([]);
        })
        .catch(() => setTopics([]));
      return;
    }
    teacherAPI.classStudents(id).then((r) => {
      const first = r.data.students?.[0]?.studentId;
      if (!first) { setTopics([]); return; }
      mathpathAPI.map({ studentId: first }).then((m) => {
        const ts = m.data.topics || [];
        setTopics(ts);
        if (ts[0]) setTopicId(String(ts[0].topicId));
      }).catch(() => setTopics([]));
    }).catch(() => setTopics([]));
  }, [id, module]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const skills = useMemo(() =>
    topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [],
  [topics, topicId]);

  const handlePreview = async () => {
    const ids = module === 'PSL' ? [skillId] : [skillId];
    if (!skillId) { setError('Choose a skill first.'); return; }
    setPreviewing(true); setError(null);
    try {
      const { data } = await teacherAPI.previewAssessment({
        module, skillIds: ids, difficulty, questionCount: Number(questionCount),
      });
      setPreview(data.questions);
    } catch (e) { setError(e.response?.data?.error || 'Preview failed.'); }
    setPreviewing(false);
  };

  const handleSubmit = async () => {
    if (!skillId) { setError('Choose a skill.'); return; }
    setSaving(true); setError(null);
    try {
      const { data } = await teacherAPI.createAssessment({
        classId: id,
        title: title || `${module} Quick Check`,
        module,
        skillIds: [skillId],
        difficulty,
        questionCount: Number(questionCount),
        timeLimitMinutes: timed ? Number(timeLimitMinutes) || null : null,
        dueDate: dueDate || null,
      });
      const assessmentId = data.assessment._id;
      const { data: assignResult } = await teacherAPI.assignAssessment(assessmentId, { target });
      setDone(assignResult.assigned);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not create assessment.');
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <ClassNav classId={id} name={meta?.name} level={meta?.level} />
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Send className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-ink-800">Assessment Assigned</h2>
          <p className="mt-1 text-sm text-ink-500">Sent to {done} student{done !== 1 ? 's' : ''}.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate(`/teacher/classes/${id}/assessments`)}>View All</Button>
            <Button onClick={() => { setDone(null); setSaving(false); setPreview(null); }}>Create Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <ClassNav classId={id} name={meta?.name} level={meta?.level} />
      <h2 className="mb-4 text-lg font-semibold text-emerald-deep">Create Assessment</h2>

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <Card className="space-y-5 p-5">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">Title (optional)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fractions Quick Check" />
        </div>

        {/* Module */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">Module</label>
          <div className="flex gap-2">
            {MODULES.map((m) => (
              <button key={m.key} type="button" onClick={() => setModule(m.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${module === m.key ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic + Skill (MathPath) */}
        {module === 'MathPath' && topics && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">Topic</label>
              <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400">
                <option value="">Select topic...</option>
                {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">Skill</label>
              <select value={skillId} onChange={(e) => setSkillId(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400">
                <option value="">Select skill...</option>
                {skills.map((s) => <option key={s.skillId || s.id} value={s.skillId || s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${difficulty === d ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PSL skill picker */}
        {module === 'PSL' && pslSkills && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Skill</label>
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400">
              <option value="">Select skill...</option>
              {pslSkills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Question count */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">Questions</label>
          <input type="number" min={1} max={30} value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-24 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400" />
        </div>

        {/* Time limit */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-emerald-500 focus:ring-emerald-400" />
            Timed
          </label>
          {timed && (
            <div className="flex items-center gap-1">
              <input type="number" min={1} max={120} value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)} placeholder="15"
                className="w-20 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400" />
              <span className="text-sm text-ink-500">minutes</span>
            </div>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">Due date (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-emerald-400" />
        </div>

        {/* Target */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">Assign to</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTarget({ type: 'class' })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${target.type === 'class' ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
              Whole class
            </button>
            {groups.map((g) => (
              <button key={g._id} type="button" onClick={() => setTarget({ type: 'group', id: g._id })}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${target.type === 'group' && target.id === g._id ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex gap-3">
          <Button variant="secondary" disabled={previewing || !skillId} onClick={handlePreview}>
            {previewing ? <Spinner size="s" className="mr-1" /> : <Eye className="mr-1 h-4 w-4" />}
            Preview Questions
          </Button>
          {preview && (
            <Button variant="secondary" disabled={previewing} onClick={handlePreview}>
              <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
            </Button>
          )}
        </div>

        {preview && (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-ink-200 bg-ink-50/50 p-3">
            {preview.map((q, i) => (
              <div key={q.questionId} className="rounded-lg bg-white p-3 text-sm">
                <span className="mr-2 font-semibold text-ink-400">Q{i + 1}.</span>
                <span className="text-ink-700">{q.display || q.storyText}</span>
                <span className="ml-2 text-xs text-emerald-600">
                  Ans: {q.answer ?? q.correctAnswer}
                </span>
                {q.choices?.length > 0 && (
                  <span className="ml-2 text-xs text-ink-400">[MCQ: {q.choices.join(', ')}]</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <Button disabled={saving || !skillId} onClick={handleSubmit} className="w-full">
          {saving ? 'Creating...' : 'Create & Assign'}
        </Button>
      </Card>
    </div>
  );
}
