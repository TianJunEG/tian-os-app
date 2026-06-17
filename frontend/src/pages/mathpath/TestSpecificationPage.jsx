import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { assessmentSpecificationAPI, familyAPI, teacherAPI, tutorAPI } from '../../services/api';

const OWNER_BY_ROLE = { parent: 'parent', tutor: 'tutor', teacher: 'teacher' };

// UI mirror of services/mathpath/testModePresets.js. `dataDriven` modes build the
// paper from the student's weak skills, so the manual topic matrix is hidden.
// `forcesTimed` modes lock the timed flag on. defaultMix seeds the per-topic mix.
const TEST_MODE_OPTIONS = [
  { value: 'topic_test', label: 'Topic Test', desc: 'Straightforward test on the topics you choose.', defaultMix: { easy: 40, medium: 40, hard: 20 } },
  { value: 'skill_test', label: 'Skill Test', desc: 'Focused check on a few specific skills.', defaultMix: { easy: 30, medium: 50, hard: 20 } },
  { value: 'mixed_review', label: 'Mixed Topical Review', desc: 'Spread evenly across several topics.', defaultMix: { easy: 35, medium: 40, hard: 25 } },
  { value: 'weakness_drill', label: 'Weakness Drill', desc: "Auto-built from the student's weak skills — no topic setup needed.", dataDriven: true, defaultMix: { easy: 55, medium: 35, hard: 10 } },
  { value: 'timed_paper', label: 'Timed Paper', desc: 'Exam-style practice under time pressure.', forcesTimed: true, defaultMix: { easy: 30, medium: 45, hard: 25 } },
  { value: 'weighted_exam', label: 'Weighted Exam-Prep', desc: 'Marks weighted by topic for exam-style balance.', defaultMix: { easy: 30, medium: 40, hard: 30 } },
  { value: 'error_diagnosis', label: 'Error Diagnosis', desc: 'MCQ-led; surfaces the misconception behind wrong answers.', defaultMix: { easy: 25, medium: 45, hard: 30 } },
  { value: 'psle_mock', label: 'PSLE-style Mixed Paper', desc: 'Full mixed paper, timed, multi-topic.', forcesTimed: true, defaultMix: { easy: 25, medium: 45, hard: 30 } },
];

const DEFAULT_TEST_MODE = 'topic_test';
const findMode = (value) => TEST_MODE_OPTIONS.find((m) => m.value === value) || TEST_MODE_OPTIONS[0];

function defaultTopic() {
  return {
    topicName: 'Fractions',
    domainId: 'fractions',
    marks: 20,
    questionCount: 0,
    difficulty: 'mixed',
    difficultyMix: null,
    includeWordProblems: true,
    notes: '',
  };
}

export default function TestSpecificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studentId, id: routeId, classId } = useParams();
  const ownerType = OWNER_BY_ROLE[user?.role] || null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [specs, setSpecs] = useState([]);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [generated, setGenerated] = useState(null);
  const [targets, setTargets] = useState({ students: [], classes: [] });
  const [form, setForm] = useState({
    title: 'School-Aligned Revision Test',
    testMode: DEFAULT_TEST_MODE,
    targetType: 'student',
    targetStudentId: studentId || routeId || '',
    targetClassId: classId || '',
    level: 'P6',
    subject: 'Math',
    paperType: 'paper1',
    totalMarks: 50,
    durationMinutes: 45,
    calculatorAllowed: false,
    timed: true,
    source: 'manual',
    status: 'active',
    topics: [defaultTopic()],
  });

  const selectedSpec = useMemo(
    () => specs.find((s) => String(s._id) === String(selectedSpecId)) || null,
    [specs, selectedSpecId]
  );
  const currentMode = useMemo(() => findMode(form.testMode), [form.testMode]);

  // Modes that run under the clock lock the timed flag on.
  useEffect(() => {
    if (currentMode.forcesTimed && !form.timed) {
      setForm((prev) => ({ ...prev, timed: true }));
    }
  }, [currentMode.forcesTimed]);
  const uploadRoute = useMemo(() => {
    if (ownerType === 'parent') {
      const id = form.targetStudentId || studentId || routeId;
      return id ? `/parent/children/${id}/mathpath/assessment-upload` : '';
    }
    if (ownerType === 'tutor') {
      const id = form.targetStudentId || routeId;
      return id ? `/tutor/students/${id}/mathpath/assessment-upload` : '';
    }
    if (ownerType === 'teacher') {
      const id = form.targetClassId || classId;
      return id ? `/teacher/classes/${id}/mathpath/assessment-upload` : '';
    }
    return '';
  }, [ownerType, form.targetStudentId, form.targetClassId, studentId, routeId, classId]);

  const totalTopicMarks = useMemo(
    () => form.topics.reduce((sum, row) => sum + Number(row.marks || 0), 0),
    [form.topics]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [specRes, targetRes] = await Promise.all([
          ownerType ? assessmentSpecificationAPI.listMine({ ownerType }) : Promise.resolve({ data: { specifications: [] } }),
          (async () => {
            if (ownerType === 'parent') return familyAPI.children();
            if (ownerType === 'tutor') return tutorAPI.students();
            if (ownerType === 'teacher') return teacherAPI.classes();
            return { data: {} };
          })(),
        ]);

        if (!active) return;
        const specRows = specRes.data?.specifications || [];
        setSpecs(specRows);
        if (specRows.length) setSelectedSpecId(String(specRows[0]._id));

        if (ownerType === 'parent') {
          const students = targetRes.data?.children || [];
          setTargets({ students, classes: [] });
          if (!form.targetStudentId && students[0]?._id) {
            setForm((prev) => ({ ...prev, targetStudentId: String(students[0]._id) }));
          }
        } else if (ownerType === 'tutor') {
          const students = targetRes.data?.students || [];
          setTargets({ students, classes: [] });
          if (!form.targetStudentId && students[0]?.studentId) {
            setForm((prev) => ({ ...prev, targetStudentId: String(students[0].studentId) }));
          }
        } else if (ownerType === 'teacher') {
          const classes = targetRes.data?.classes || [];
          setTargets({ students: [], classes });
          if (form.targetType === 'class' && !form.targetClassId && classes[0]?._id) {
            setForm((prev) => ({ ...prev, targetClassId: String(classes[0]._id) }));
          }
        }
      } catch (e) {
        if (!active) return;
        setError(e.response?.data?.error || e.message || 'Could not load test specification workspace.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [ownerType]);

  const setTopic = (index, key, value) => {
    setForm((prev) => {
      const topics = [...prev.topics];
      topics[index] = { ...topics[index], [key]: value };
      return { ...prev, topics };
    });
  };

  const addTopic = () => setForm((prev) => ({ ...prev, topics: [...prev.topics, defaultTopic()] }));
  const removeTopic = (index) => {
    setForm((prev) => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
  };

  const createSpec = async () => {
    setSaving(true);
    setError('');
    setGenerated(null);
    try {
      const payload = {
        ...form,
        ownerType,
        // Data-driven modes synthesize their own topics server-side from weak skills.
        topics: currentMode.dataDriven ? [] : form.topics,
      };
      const res = await assessmentSpecificationAPI.create(payload);
      const created = res.data?.specification;
      if (created?._id) {
        const next = [created, ...specs];
        setSpecs(next);
        setSelectedSpecId(String(created._id));
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not create specification.');
    } finally {
      setSaving(false);
    }
  };

  const generateFromSelected = async () => {
    if (!selectedSpecId) {
      setError('Select or create a specification first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await assessmentSpecificationAPI.generateTest(selectedSpecId, {
        targetStudentId: form.targetStudentId || undefined,
      });
      setGenerated(res.data?.generated || null);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not generate test from specification.');
    } finally {
      setSaving(false);
    }
  };

  const startGenerated = () => {
    if (!generated?.assessmentSessionId || !Array.isArray(generated?.questions) || !generated.questions.length) return;
    navigate(`/student/mathpath/assessment/session/${generated.assessmentSessionId}`, {
      state: {
        session: {
          assessmentSessionId: generated.assessmentSessionId,
          assessmentType: 'curriculum',
          mode: 'tos',
          singaporeLevel: generated.level,
          paperType: generated.paperType,
          totalMarks: generated.totalMarks,
          timeLimitMinutes: generated.durationMinutes,
          calculatorAllowed: generated.calculatorAllowed,
          workingRequired: true,
          timed: generated.timed,
        },
        questions: generated.questions,
        sections: generated.sections || [],
        assessmentType: 'curriculum',
        level: generated.level,
        specificationId: selectedSpecId,
      },
    });
  };

  if (loading) return <Spinner label="Loading specification workspace…" />;
  if (!ownerType) return <ErrorState message="This page is available to parent, tutor, and teacher accounts." />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="School-Aligned Test" subtitle="Create a school-style blueprint and generate a balanced revision test." />
      {uploadRoute && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-600">Have a school paper PDF? Analyse it once and convert it to blueprint metadata.</p>
            <Button to={uploadRoute} variant="secondary">Open Assessment Upload</Button>
          </div>
        </Card>
      )}

      {error && <ErrorState message={error} />}

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-ink-600">Title
            <input className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </label>
          <label className="text-sm text-ink-600">Level
            <select className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}>
              {['P3', 'P4', 'P5', 'P6', 'Sec1', 'Sec2', 'Sec3', 'Sec4'].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </label>
          <label className="text-sm text-ink-600">Paper Type
            <select className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.paperType} onChange={(e) => setForm((p) => ({ ...p, paperType: e.target.value }))}>
              <option value="paper1">Practice Paper 1</option>
              <option value="paper2">Practice Paper 2</option>
            </select>
          </label>
          <label className="text-sm text-ink-600">Target Type
            <select className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.targetType} onChange={(e) => setForm((p) => ({ ...p, targetType: e.target.value }))}>
              <option value="student">student</option>
              {ownerType === 'teacher' && <option value="class">class</option>}
            </select>
          </label>
          {form.targetType === 'student' ? (
            <label className="text-sm text-ink-600">Target Student
              <select className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.targetStudentId} onChange={(e) => setForm((p) => ({ ...p, targetStudentId: e.target.value }))}>
                <option value="">Select student</option>
                {targets.students.map((s) => {
                  const sid = s._id || s.studentId;
                  const label = s.displayName || s.name || s.studentName || sid;
                  return <option key={sid} value={sid}>{label}</option>;
                })}
              </select>
            </label>
          ) : (
            <label className="text-sm text-ink-600">Target Class
              <select className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.targetClassId} onChange={(e) => setForm((p) => ({ ...p, targetClassId: e.target.value }))}>
                <option value="">Select class</option>
                {targets.classes.map((c) => <option key={c._id} value={c._id}>{c.name || c.className || c._id}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm text-ink-600">Total Marks
            <input type="number" min="10" className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: Number(e.target.value || 0) }))} />
          </label>
          <label className="text-sm text-ink-600">Duration (minutes)
            <input type="number" min="10" className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value || 0) }))} />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" checked={form.calculatorAllowed} onChange={(e) => setForm((p) => ({ ...p, calculatorAllowed: e.target.checked }))} />
            Calculator allowed
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" checked={form.timed} disabled={currentMode.forcesTimed} onChange={(e) => setForm((p) => ({ ...p, timed: e.target.checked }))} />
            Timed test{currentMode.forcesTimed && <span className="text-xs text-ink-500">(locked on for {currentMode.label})</span>}
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-ink-700">Test Mode</h3>
        <p className="mb-3 text-xs text-ink-500">Pick how this paper is assembled. {currentMode.desc}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TEST_MODE_OPTIONS.map((mode) => {
            const active = mode.value === form.testMode;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, testMode: mode.value }))}
                className={`rounded-lg border p-3 text-left transition ${active ? 'border-navy-500 bg-navy-50 ring-1 ring-navy-300' : 'border-line-soft hover:border-navy-300'}`}
              >
                <p className={`text-sm font-semibold ${active ? 'text-navy-700' : 'text-ink-700'}`}>{mode.label}</p>
                <p className="mt-1 text-xs text-ink-500">{mode.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {currentMode.dataDriven ? (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink-700">Weak skills (auto-sourced)</h3>
          <p className="mt-2 text-sm text-ink-600">
            {currentMode.label} builds the paper from this student's weakest skills — pulled from their mistakes,
            skill states, and mastery records. No topic setup needed. Total marks and duration above still apply.
          </p>
          {!form.targetStudentId && (
            <p className="mt-2 text-xs text-amber-600">Select a target student above so weak skills can be sourced.</p>
          )}
        </Card>
      ) : (
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-700">Topic Weightage</h3>
          <Button size="s" variant="secondary" icon={Plus} onClick={addTopic}>Add Topic</Button>
        </div>
        <div className="space-y-3">
          {form.topics.map((row, idx) => (
            <div key={`${row.topicName}-${idx}`} className="rounded-lg border border-line-soft p-3">
              <div className="grid gap-2 sm:grid-cols-4">
                <input className="rounded-lg border border-line-soft px-3 py-2 text-sm" value={row.topicName} onChange={(e) => setTopic(idx, 'topicName', e.target.value)} placeholder="Topic name" />
                <input className="rounded-lg border border-line-soft px-3 py-2 text-sm" value={row.domainId} onChange={(e) => setTopic(idx, 'domainId', e.target.value)} placeholder="domainId" />
                <input type="number" min="1" className="rounded-lg border border-line-soft px-3 py-2 text-sm" value={row.marks} onChange={(e) => setTopic(idx, 'marks', Number(e.target.value || 0))} placeholder="marks" />
                <select className="rounded-lg border border-line-soft px-3 py-2 text-sm" value={row.difficulty} onChange={(e) => setTopic(idx, 'difficulty', e.target.value)}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                  <option value="mixed">mixed</option>
                </select>
              </div>
              {row.difficulty === 'mixed' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-500">Difficulty mix %:</span>
                  {['easy', 'medium', 'hard'].map((band) => (
                    <label key={band} className="inline-flex items-center gap-1 text-xs text-ink-600">
                      {band}
                      <input
                        type="number"
                        min="0"
                        className="w-16 rounded-lg border border-line-soft px-2 py-1 text-sm"
                        value={row.difficultyMix?.[band] ?? ''}
                        placeholder={String(currentMode.defaultMix[band])}
                        onChange={(e) => setTopic(idx, 'difficultyMix', {
                          ...(row.difficultyMix || { easy: 0, medium: 0, hard: 0 }),
                          [band]: Number(e.target.value || 0),
                        })}
                      />
                    </label>
                  ))}
                  <span className="text-xs text-ink-400">blank = mode default ({currentMode.defaultMix.easy}/{currentMode.defaultMix.medium}/{currentMode.defaultMix.hard})</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-ink-600">
                  <input type="checkbox" checked={row.includeWordProblems} onChange={(e) => setTopic(idx, 'includeWordProblems', e.target.checked)} />
                  Include word problems
                </label>
                {form.topics.length > 1 && <Button size="s" variant="ghost" icon={Trash2} onClick={() => removeTopic(idx)}>Remove</Button>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-600">Total topic marks: {totalTopicMarks}</p>
      </Card>
      )}

      <Card className="p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <Button onClick={createSpec} disabled={saving}>{saving ? 'Saving…' : 'Create Specification'}</Button>
          <select className="rounded-lg border border-line-soft px-3 py-2 text-sm" value={selectedSpecId} onChange={(e) => setSelectedSpecId(e.target.value)}>
            <option value="">Select existing specification</option>
            {specs.map((spec) => (
              <option key={spec._id} value={spec._id}>
                {spec.title} · {spec.level} · {spec.totalMarks} marks
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={generateFromSelected} disabled={saving || !selectedSpecId}>
            {saving ? 'Generating…' : 'Generate Test'}
          </Button>
        </div>
      </Card>

      {generated && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-700">Generated Test Blueprint</h3>
            <div className="flex flex-wrap items-center gap-2">
              {generated.testMode && <Badge tone="ink">{findMode(generated.testMode).label}</Badge>}
              <Badge tone="navy">{generated.totalMarks} marks · {generated.durationMinutes} min</Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-600">{generated.questions?.length || 0} questions · {generated.calculatorAllowed ? 'Calculator allowed' : 'Calculator not allowed'} · {generated.timed ? 'Timed' : 'Untimed'}</p>
          {generated.synthesizedFromWeakness && (
            <p className="mt-1 text-xs text-ink-500">
              Auto-built from {generated.weakSkillIds?.length || 0} weak skill{(generated.weakSkillIds?.length || 0) === 1 ? '' : 's'}: {(generated.weakSkillIds || []).join(', ')}
            </p>
          )}
          {(generated.sections || []).length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {generated.sections.map((sec) => (
                <span key={sec.id} className="rounded-full border border-line-soft bg-paper px-3 py-1 text-xs text-ink-600">
                  {sec.shortName || sec.name} · {sec.questionCount}Q · {sec.marks}m · {sec.calculatorAllowed ? 'calc' : 'no calc'}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 space-y-2 text-sm text-ink-600">
            {(generated.topicBlueprint || []).map((row, idx) => (
              <div key={`${row.topicName}-${idx}`} className="rounded-lg border border-line-soft p-3">
                <p className="font-semibold text-ink-700">{row.topicName}</p>
                <p>Allocated marks: {row.allocatedMarks} · Questions: {row.questionCount} · Difficulty: {row.difficulty}</p>
              </div>
            ))}
          </div>
          {ownerType === 'parent' && generated.targetType === 'student' && (
            <Button className="mt-4" icon={ArrowRight} onClick={startGenerated}>Start Generated Test</Button>
          )}
          {ownerType !== 'parent' && (
            <p className="mt-4 text-sm text-ink-600">Test generated. Share or assign this generated session in your student/class workflow.</p>
          )}
          {selectedSpec && (
            <p className="mt-2 text-xs text-ink-500">Specification: {selectedSpec.title}</p>
          )}
        </Card>
      )}
    </div>
  );
}
