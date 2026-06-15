import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Wand2 } from 'lucide-react';
import { mathpathAPI, assignmentsAPI, spellingPracticeAPI, skillsAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Spinner, ErrorState, Field, Select, Input } from '../../components/ui';
import { shapeScienceAsTopics } from '../../utils/scienceCatalog';

// Parent assigns practice. MathPath (topic/skill), Science Adaptive Revision
// (topic/skill), or Spelling Practice (word list).
const MODULES = [
  { key: 'MathPath', label: 'MathPath', subject: 'Math' },
  { key: 'Science Adaptive Revision', label: 'Science', subject: 'Science' },
  { key: 'Spelling Practice', label: 'Spelling Practice', subject: 'English' },
];

export default function AssignPractice() {
  const { studentId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const child = useChild(studentId);

  // A recommendation can deep-link here with ?module=&skill= (MathPath/Science)
  // or ?module=Spelling Practice&list= to pre-select the right module + target.
  const initialModule = MODULES.find((m) => m.key === params.get('module'))?.key || 'MathPath';
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
  // Separate from `error` (which is the submit error shown inline under the
  // form). A catalog-fetch failure is a load-time problem — the form can't
  // render at all — so it gets its own ErrorState with a Retry button.
  const [loadError, setLoadError] = useState(null);

  // Spelling lists are independent of module choice — fetched once. This is
  // enrichment for Spelling-only flows; failing here doesn't kill the page
  // (Spelling submit will still show "Choose a word list" with an empty list).
  useEffect(() => {
    spellingPracticeAPI.lists().then((r) => setLists(r.data.lists || [])).catch(() => setLists([]));
  }, []);

  // Math and Science share the same picker shape but draw from different
  // catalogs. Reload when module changes (or on first mount with a deep-link).
  const loadCatalog = useCallback(() => {
    if (module === 'Spelling Practice') { setTopics([]); setLoadError(null); return; }
    setLoadError(null); setTopics(null); setTopicId(''); setSkillId('');
    const fetcher = module === 'Science Adaptive Revision'
      ? skillsAPI.list({ subject: 'science', studentId }).then((r) => shapeScienceAsTopics(r.data.skills || []))
      : mathpathAPI.map({ studentId }).then((r) => r.data.topics || []);
    fetcher.then((ts) => {
      setTopics(ts);
      // Honour ?skill= only if it exists in the *new* catalog; otherwise fall
      // through to the first-topic default. Without the fallback, switching
      // module from Math → Science with a math skill in the URL left the
      // topic dropdown blank.
      const pre = params.get('skill');
      const matched = pre ? ts.find((x) => x.skills.some((s) => String(s.skillId) === String(pre))) : null;
      if (matched) { setTopicId(String(matched.topicId)); setSkillId(pre); }
      else if (ts[0]) setTopicId(String(ts[0].topicId));
    }).catch((e) => setLoadError(e));
  }, [studentId, module, params]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

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
        const subject = MODULES.find((m) => m.key === module)?.subject || 'Math';
        // Science questions are open-ended and don't carry a difficulty band,
        // so only pass `difficulty` for MathPath. The backend tolerates extra
        // fields but the picker would be misleading for Science.
        const body = { studentId, module, subject, assignedByRole: 'parent', topicId, skillIds: [skillId], questionCount: Number(questionCount), dueDate: dueDate || null };
        if (module === 'MathPath') body.difficulty = difficulty;
        await assignmentsAPI.create(body);
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
            <Button variant="secondary" size="s" onClick={() => navigate(`/parent/children/${studentId}/assignments`)}>View practice tasks</Button>
            <Button size="s" onClick={() => { setDone(false); setSaving(false); }}>Assign another</Button>
          </div>
        </Card>
      </>
    );
  }

  const isSpelling = module === 'Spelling Practice';
  const isMathPath = module === 'MathPath';

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} showAssign={false} />
      {loadError ? (
        <ErrorState message="Couldn't load the skill catalogue." onRetry={loadCatalog} />
      ) : !topics ? <Spinner label="Loading…" /> : (
        <Card className="space-y-5 p-5">
          {/* Module */}
          <div>
            <div className="mb-2 text-sm font-semibold text-ink-700">Module</div>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <button key={m.key} type="button" onClick={() => setModule(m.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${module === m.key ? 'border-emerald bg-emerald-tint font-semibold text-emerald-deep' : 'border-line-soft text-ink-700'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {isSpelling ? (
            <div>
              <Field label="Word list">
                <Select value={listId} onChange={(e) => setListId(e.target.value)}>
                  <option value="">Choose a word list…</option>
                  {lists.map((l) => <option key={l.listId} value={l.listId}>{l.title} ({l.wordCount} words)</option>)}
                </Select>
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field label="Topic">
                  <Select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }}>
                    {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
                  </Select>
                </Field>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-ink-700">Skill</div>
                  <button
                    type="button"
                    onClick={suggestWeakest}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-deep hover:text-emerald-deep"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Suggest the weakest
                  </button>
                </div>
                <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
                  <option value="">Choose a skill…</option>
                  {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
                </Select>
              </div>
            </div>
          )}

          {/* Question count + difficulty only meaningful for MathPath (Science
              questions are open-ended at one level, Spelling is list-based). */}
          <div className="grid gap-4 sm:grid-cols-3">
            {isMathPath && (
              <div>
                <Field label="Difficulty">
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </Field>
              </div>
            )}
            {!isSpelling && (
              <div>
                <Field label="Questions">
                  <Input type="number" min="5" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="font-mono" />
                </Field>
              </div>
            )}
            <div>
                <Field label="Due date">
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>
            </div>
          </div>

          {error && <p className="text-sm text-error-700">{error}</p>}
          <Button size="l" disabled={saving} onClick={submit} className="w-full">{saving ? 'Assigning…' : 'Assign practice'}</Button>
        </Card>
      )}
    </>
  );
}
