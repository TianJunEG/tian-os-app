import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { teacherAPI, mathpathAPI, skillsAPI, spellingPracticeAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Spinner, ErrorState, Select, Input, Alert } from '../../components/ui';
import { shapeScienceAsTopics } from '../../utils/scienceCatalog';

const MODULES = [
  { key: 'MathPath', label: 'MathPath', subject: 'Math' },
  { key: 'Science Adaptive Revision', label: 'Science', subject: 'Science' },
  { key: 'Spelling Practice', label: 'Spelling', subject: 'English' },
];

export default function AssignPractice() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const meta = useClass(id);

  const [groups, setGroups] = useState(null);
  const [groupsError, setGroupsError] = useState(false);
  const [topics, setTopics] = useState(null);
  const [studentsError, setStudentsError] = useState(false);
  const [topicsError, setTopicsError] = useState(false);
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

  // Spelling-specific state
  const [spellingLists, setSpellingLists] = useState(null);
  const [spellingListId, setSpellingListId] = useState('');

  const loadGroups = useCallback(() => {
    setGroups(null); setGroupsError(false);
    teacherAPI.groups(id).then((r) => setGroups(r.data.saved || [])).catch(() => { setGroups([]); setGroupsError(true); setTarget({ type: 'class' }); });
  }, [id]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const isSpelling = module === 'Spelling Practice';

  const loadCatalog = useCallback(() => {
    setTopics(null); setTopicId(''); setSkillId(''); setStudentsError(false); setTopicsError(false);
    if (isSpelling) {
      setSpellingLists(null); setSpellingListId('');
      spellingPracticeAPI.lists()
        .then((r) => {
          const lists = r.data.lists || [];
          setSpellingLists(lists);
          if (lists[0]) setSpellingListId(lists[0].listId);
          setTopics([]);
        })
        .catch(() => setTopicsError(true));
      return;
    }
    teacherAPI.classStudents(id).then((r) => {
      const first = r.data.students?.[0]?.studentId;
      if (!first) { setTopics([]); return; }
      const fetch = module === 'Science Adaptive Revision'
        ? skillsAPI.list({ subject: 'science', studentId: first }).then((m) => shapeScienceAsTopics(m.data.skills || []))
        : mathpathAPI.map({ studentId: first }).then((m) => m.data.topics || []);
      fetch.then((ts) => { setTopics(ts); if (ts[0]) setTopicId(String(ts[0].topicId)); }).catch(() => setTopicsError(true));
    }).catch(() => setStudentsError(true));
  }, [id, module, isSpelling]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const skills = useMemo(() => topics?.find((t) => String(t.topicId) === String(topicId))?.skills || [], [topics, topicId]);

  const submit = async () => {
    if (isSpelling) {
      if (!spellingListId) { setError('Choose a word list.'); return; }
    } else {
      if (!skillId) { setError('Choose a skill.'); return; }
    }
    setSaving(true); setError(null);
    try {
      const subject = MODULES.find((m) => m.key === module)?.subject || 'Math';
      const payload = {
        target, module, subject,
        skillIds: isSpelling ? [spellingListId] : [skillId],
        questionCount: isSpelling ? undefined : Number(questionCount),
        dueDate: dueDate || null,
      };
      if (!isSpelling) payload.topicId = topicId;
      if (module === 'MathPath') payload.difficulty = difficulty;
      const { data } = await teacherAPI.assign(id, payload);
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

  const loading = isSpelling ? !spellingLists && !topicsError : !topics;

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      {studentsError ? <ErrorState message="Couldn't load class students." onRetry={loadCatalog} /> : topicsError ? <ErrorState message="Couldn't load catalogue." onRetry={loadCatalog} /> : loading ? <Spinner /> : (
        <Card className="space-y-5 p-5">
          {groupsError && (
            <Alert tone="warning" className="text-left">
              Couldn't load saved groups. You can still assign practice to the whole class.
            </Alert>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-700">Assign to</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTarget({ type: 'class' })} className={`rounded-full border px-3 py-1.5 text-sm ${target.type === 'class' ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>Whole class</button>
              {groups && groups.map((g) => (
                <button key={g._id} onClick={() => setTarget({ type: 'group', id: g._id })} className={`rounded-full border px-3 py-1.5 text-sm ${target.type === 'group' && target.id === g._id ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>{g.name}</button>
              ))}
              {groups && groups.length === 0 && !groupsError && <span className="text-sm text-ink-400">No saved groups yet — create some in Groups.</span>}
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

          {isSpelling ? (
            /* Spelling: word list picker */
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Word list</label>
              <Select value={spellingListId} onChange={(e) => setSpellingListId(e.target.value)}>
                {spellingLists && spellingLists.length ? spellingLists.map((l) => (
                  <option key={l.listId} value={l.listId}>{l.level} · {l.title} ({l.wordCount} words)</option>
                )) : <option value="">No shared lists available</option>}
              </Select>
            </div>
          ) : (
            /* Math / Science: topic + skill pickers */
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Topic</label>
                <Select value={topicId} onChange={(e) => { setTopicId(e.target.value); setSkillId(''); }}>
                  {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Skill</label>
                <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
                  <option value="">Choose a skill…</option>
                  {skills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name}</option>)}
                </Select>
              </div>
            </div>
          )}

          {!isSpelling && (
            <div className="grid gap-4 sm:grid-cols-3">
              {module === 'MathPath' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-700">Difficulty</label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </Select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Questions</label>
                <Input type="number" min="5" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Due date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          )}

          {isSpelling && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Due date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-error-700">{error}</p>}
          <Button size="l" disabled={saving} onClick={submit} className="w-full">{saving ? 'Assigning…' : 'Assign practice'}</Button>
        </Card>
      )}
    </>
  );
}
