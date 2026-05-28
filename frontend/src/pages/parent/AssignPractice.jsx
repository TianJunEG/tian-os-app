import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Wand2 } from 'lucide-react';
import { mathpathAPI, assignmentsAPI, spellingPracticeAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Badge, Spinner } from '../../components/ui';

// Parent assigns practice. MathPath (topic/skill) or Spelling Practice (word
// list). Math is the core; Spelling is the one English module (no others).
const MODULES = [
  { key: 'MathPath', label: 'MathPath', enabled: true },
  { key: 'Spelling Practice', label: 'Spelling Practice', enabled: true },
];

export default function AssignPractice() {
  const { studentId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const child = useChild(studentId);

  // A recommendation can deep-link here with ?module=&skill= (MathPath) or
  // ?module=Spelling Practice&list= to pre-select the right module + target.
  const initialModule = MODULES.find((m) => m.key === params.get('module') && m.enabled)?.key || 'MathPath';
  const [module, setModule] = useState(initialModule);
  const [topics, setTopics] = useState(null);
  const [topicId, setTopicId] = useState('');
  const [skillId, setSkillId] = useState(params.get('skill') || '');
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState(params.get('list') || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    mathpathAPI.map({ studentId }).then((r) => {
      const ts = r.data.topics || [];
      setTopics(ts);
      const pre = params.get('skill');
      if (pre) { const t = ts.find((x) => x.skills.some((s) => String(s.skillId) === String(pre))); if (t) setTopicId(String(t.topicId)); }
      else if (ts[0]) setTopicId(String(ts[0].topicId));
    }).catch(() => setTopics([]));
    spellingPracticeAPI.lists().then((r) => setLists(r.data.lists || [])).catch(() => setLists([]));
  }, [studentId]); // eslint-disable-line

  const skills = useMemo(() => topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [], [topics, topicId]);

  // "Suggest the weakest" — for a parent who doesn't know what to pick, this
  // selects the lowest-scoring attempted skill across all topics. Falls back
  // to the first not-yet-attempted skill if the child hasn't started anything
  // yet (a new account); falls back further to the very first skill in the
  // map so the button always does something visible.
  const suggestWeakest = () => {
    if (!topics?.length) return;
    const allSkills = topics.flatMap((t) => (t.skills || []).map((s) => ({ ...s, topicId: t.topicId })));
    const attempted = allSkills.filter((s) => s.attempts > 0 || (s.status && s.status !== 'not_started'));
    const pick = attempted.length
      ? attempted.sort((a, b) => (a.score || 0) - (b.score || 0))[0]
      : (allSkills[0] || null);
    if (!pick) return;
    setTopicId(String(pick.topicId));
    setSkillId(String(pick.skillId));
  };

  const submit = async () => {
    if (saving) return;
    setError(null);
    try {
      if (module === 'Spelling Practice') {
        if (!listId) { setError('Choose a word list.'); return; }
        setSaving(true);
        await assignmentsAPI.create({ studentId, module: 'Spelling Practice', subject: 'English', assignedByRole: 'parent', skillIds: [listId], dueDate: dueDate || null });
      } else {
        if (!skillId) { setError('Choose a skill to practise.'); return; }
        setSaving(true);
        await assignmentsAPI.create({ studentId, module: 'MathPath', subject: 'Math', assignedByRole: 'parent', topicId, skillIds: [skillId], difficulty, questionCount: Number(questionCount), dueDate: dueDate || null });
      }
      setDone(true);
    } catch (e) { setError(e.response?.data?.error || 'Could not assign practice.'); setSaving(false); }
  };

  if (done) {
    return (
      <>
        <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} showAssign={false} />
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-success-500" />
          <p className="font-semibold text-ink-700">Practice assigned</p>
          <p className="text-sm text-ink-500">{child?.name} will see it in Today's Learning.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="s" onClick={() => navigate(`/parent/children/${studentId}/assignments`)}>View assignments</Button>
            <Button size="s" onClick={() => { setDone(false); setSaving(false); }}>Assign another</Button>
          </div>
        </Card>
      </>
    );
  }

  const isSpelling = module === 'Spelling Practice';

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} showAssign={false} />
      {!topics ? <Spinner label="Loading…" /> : (
        <Card className="space-y-5 p-5">
          {/* Module */}
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

          {isSpelling ? (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Word list</label>
              <select value={listId} onChange={(e) => setListId(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                <option value="">Choose a word list…</option>
                {lists.map((l) => <option key={l.listId} value={l.listId}>{l.title} ({l.wordCount} words)</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Topic</label>
                  <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                    {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-ink-700">Skill</label>
                    <button
                      type="button"
                      onClick={suggestWeakest}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Suggest the weakest
                    </button>
                  </div>
                  <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full rounded-xl border border-hairline px-3 py-2.5">
                    <option value="">Choose a skill…</option>
                    {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {!isSpelling && (
              <>
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
              </>
            )}
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
