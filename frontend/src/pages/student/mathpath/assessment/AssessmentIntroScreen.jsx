import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Card, Button, PageHeader, Badge } from '../../../../components/ui';
import { buildFractionAssessmentSession } from '../../../../mathpath/fractions/fractionAssessmentEngine';
import { generateAssessmentQuestionSet } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { assessmentSpecificationAPI } from '../../../../services/api';

const TYPES = ['baseline', 'progress', 'mastery', 'curriculum', 'mockPaper'];
const OWNER_TYPE_BY_ROLE = {
  parent: 'parent',
  tutor: 'tutor',
  teacher: 'teacher',
};

function inferLevel(user) {
  return user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || 'P5';
}

export default function AssessmentIntroScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entryMode, setEntryMode] = useState('free');
  const [assessmentType, setAssessmentType] = useState('progress');
  const [level, setLevel] = useState(inferLevel(user));
  const [paperType, setPaperType] = useState('paper1');
  const [timed, setTimed] = useState(true);
  const [tosList, setTosList] = useState([]);
  const [tosLoading, setTosLoading] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [tosForm, setTosForm] = useState({
    title: 'School-Aligned Revision Test',
    totalMarks: 50,
    durationMinutes: 45,
    calculatorAllowed: false,
    timed: true,
    paperType: 'paper1',
    topicName: 'Fractions',
    marks: 50,
    difficulty: 'mixed',
    includeWordProblems: true,
    notes: '',
  });
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    try {
      const s = buildFractionAssessmentSession({
        studentId: user?._id || user?.id || user?.email || 'demo-student',
        assessmentType,
        singaporeLevel: level,
        paperType,
      });
      return s;
    } catch (_) {
      return null;
    }
  }, [assessmentType, level, paperType, user]);

  const ownerType = OWNER_TYPE_BY_ROLE[user?.role] || null;

  const loadSpecifications = async () => {
    if (!ownerType) return;
    setTosLoading(true);
    setError('');
    try {
      const res = await assessmentSpecificationAPI.listMine({ ownerType, status: 'active' });
      const rows = res.data?.specifications || [];
      setTosList(rows);
      if (!selectedSpecId && rows.length) setSelectedSpecId(String(rows[0]._id));
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load assessment specifications.');
    } finally {
      setTosLoading(false);
    }
  };

  const createSpecification = async () => {
    if (!ownerType) {
      setError('School-aligned test setup is available for parent, tutor, or teacher accounts.');
      return '';
    }
    setError('');
    try {
      const payload = {
        title: tosForm.title,
        ownerType,
        targetType: 'student',
        targetStudentId: user?._id || user?.id || null,
        level,
        subject: 'Math',
        paperType: tosForm.paperType,
        totalMarks: Number(tosForm.totalMarks || 50),
        durationMinutes: Number(tosForm.durationMinutes || 45),
        calculatorAllowed: Boolean(tosForm.calculatorAllowed),
        timed: Boolean(tosForm.timed),
        source: ownerType === 'teacher' ? 'teacherProvided' : ownerType === 'tutor' ? 'tutorProvided' : 'parentProvided',
        status: 'active',
        topics: [
          {
            topicName: tosForm.topicName || 'Fractions',
            domainId: 'fractions',
            marks: Number(tosForm.marks || tosForm.totalMarks || 50),
            difficulty: tosForm.difficulty || 'mixed',
            includeWordProblems: Boolean(tosForm.includeWordProblems),
            notes: tosForm.notes || '',
          },
        ],
      };
      const created = await assessmentSpecificationAPI.create(payload);
      const id = String(created.data?.specification?._id || '');
      if (!id) throw new Error('Specification was not created.');
      setSelectedSpecId(id);
      await loadSpecifications();
      return id;
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not create assessment specification.');
      return '';
    }
  };

  const start = () => {
    try {
      const session = buildFractionAssessmentSession({
        studentId: user?._id || user?.id || user?.email || 'demo-student',
        assessmentType,
        singaporeLevel: level,
        paperType,
      });
      const count = Math.max(8, Math.min(20, session.targetQuestionFamilyIds.length || 10));
      const questions = generateAssessmentQuestionSet({ assessmentSession: session, count });
      if (!questions.length) {
        setError("Couldn't generate assessment questions.");
        return;
      }
      navigate(`/student/mathpath/assessment/session/${session.assessmentSessionId}`, {
        state: { session, questions, assessmentType, level },
      });
    } catch (e) {
      setError(e.message || "Couldn't start assessment.");
    }
  };

  const startFromSpecification = async () => {
    setError('');
    try {
      let specId = selectedSpecId;
      if (!specId) specId = await createSpecification();
      if (!specId) return;

      const generated = await assessmentSpecificationAPI.generateTest(specId, {
        targetStudentId: user?._id || user?.id || null,
      });
      const bundle = generated.data?.generated;
      const questions = bundle?.questions || [];
      if (!questions.length) {
        setError("Couldn't generate a test from this specification.");
        return;
      }
      const session = {
        assessmentSessionId: bundle.assessmentSessionId,
        assessmentType: 'curriculum',
        mode: 'tos',
        singaporeLevel: bundle.level,
        paperType: bundle.paperType,
        totalMarks: bundle.totalMarks,
        timeLimitMinutes: bundle.durationMinutes,
        calculatorAllowed: bundle.calculatorAllowed,
        workingRequired: true,
        timed: bundle.timed,
      };
      navigate(`/student/mathpath/assessment/session/${session.assessmentSessionId}`, {
        state: { session, questions, assessmentType: 'curriculum', level: bundle.level, specificationId: specId },
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Couldn't start school-aligned test.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Test Mode" subtitle="Free Test or school-aligned revision using Table of Specification." />
      <div className="space-y-4">
        <Card className="p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setEntryMode('free')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${entryMode === 'free' ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-hairline text-ink-600'}`}>
              Free Test
            </button>
            <button type="button" onClick={() => { setEntryMode('tos'); loadSpecifications(); }} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${entryMode === 'tos' ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-hairline text-ink-600'}`}>
              School-Aligned Test (TOS)
            </button>
          </div>
        </Card>

        {entryMode === 'free' && (
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-ink-600">
              Assessment Type
              <select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm text-ink-600">
              Student Level
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                {['P3', 'P4', 'P5', 'P6', 'Sec1', 'Sec2', 'Sec3', 'Sec4'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="text-sm text-ink-600">
              Paper Type
              <select value={paperType} onChange={(e) => setPaperType(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                <option value="paper1">paper1</option>
                <option value="paper2">paper2</option>
              </select>
            </label>
            <label className="text-sm text-ink-600">
              Timing
              <select value={timed ? 'timed' : 'untimed'} onChange={(e) => setTimed(e.target.value === 'timed')} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                <option value="timed">timed</option>
                <option value="untimed">untimed</option>
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-700">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Time Limit</p>
              <p>{timed ? `${preview?.timeLimitMinutes || 30} minutes` : `${preview?.timeLimitMinutes || 30} minutes (internally timed)`}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-700">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Questions</p>
              <p>{Math.max(8, Math.min(20, preview?.targetQuestionFamilyIds?.length || 10))}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={preview?.calculatorAllowed ? 'success' : 'error'}>
              {preview?.calculatorAllowed ? 'Calculator is allowed for this assessment.' : 'Calculator is not allowed for this assessment.'}
            </Badge>
            <Badge tone="navy">{preview?.workingRequired ? 'Working required' : 'Working optional'}</Badge>
          </div>
        </Card>
        )}

        {entryMode === 'tos' && (
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-ink-700">Table of Specification</p>
            {!ownerType && (
              <div className="mb-3 rounded-lg border border-gold-200 bg-gold-50 p-3 text-sm text-ink-700">
                School-aligned test setup is available to parent, tutor, or teacher accounts.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ink-600">
                Test Name
                <input value={tosForm.title} onChange={(e) => setTosForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-ink-600">
                Topic
                <input value={tosForm.topicName} onChange={(e) => setTosForm((p) => ({ ...p, topicName: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-ink-600">
                Total Marks
                <input type="number" min="10" value={tosForm.totalMarks} onChange={(e) => setTosForm((p) => ({ ...p, totalMarks: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-ink-600">
                Duration (minutes)
                <input type="number" min="10" value={tosForm.durationMinutes} onChange={(e) => setTosForm((p) => ({ ...p, durationMinutes: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-ink-600">
                Topic Marks Allocation
                <input type="number" min="1" value={tosForm.marks} onChange={(e) => setTosForm((p) => ({ ...p, marks: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-ink-600">
                Difficulty
                <select value={tosForm.difficulty} onChange={(e) => setTosForm((p) => ({ ...p, difficulty: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                  <option value="mixed">mixed</option>
                </select>
              </label>
              <label className="text-sm text-ink-600">
                Paper Type
                <select value={tosForm.paperType} onChange={(e) => setTosForm((p) => ({ ...p, paperType: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                  <option value="paper1">paper1</option>
                  <option value="paper2">paper2</option>
                </select>
              </label>
              <label className="text-sm text-ink-600">
                Timing
                <select value={tosForm.timed ? 'timed' : 'untimed'} onChange={(e) => setTosForm((p) => ({ ...p, timed: e.target.value === 'timed' }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                  <option value="timed">timed</option>
                  <option value="untimed">untimed</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={tosForm.calculatorAllowed} onChange={(e) => setTosForm((p) => ({ ...p, calculatorAllowed: e.target.checked }))} />
                Calculator allowed
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={tosForm.includeWordProblems} onChange={(e) => setTosForm((p) => ({ ...p, includeWordProblems: e.target.checked }))} />
                Include word problems
              </label>
            </div>
            <label className="mt-3 block text-sm text-ink-600">
              Notes
              <textarea value={tosForm.notes} onChange={(e) => setTosForm((p) => ({ ...p, notes: e.target.value }))} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm" rows={3} />
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={createSpecification} disabled={!ownerType}>Create Specification</Button>
              <Button variant="secondary" onClick={loadSpecifications} disabled={!ownerType || tosLoading}>{tosLoading ? 'Loading…' : 'Reload Specifications'}</Button>
            </div>

            <label className="mt-3 block text-sm text-ink-600">
              Select existing specification
              <select value={selectedSpecId} onChange={(e) => setSelectedSpecId(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm">
                <option value="">-- Select --</option>
                {tosList.map((s) => <option key={s._id} value={s._id}>{s.title} · {s.level} · {s.totalMarks} marks</option>)}
              </select>
            </label>
          </Card>
        )}

        {error && <Card className="p-3 text-sm text-error-700">{error}</Card>}
        {entryMode === 'free' ? (
          <Button size="l" icon={ArrowRight} className="w-full" onClick={start}>Start Free Test</Button>
        ) : (
          <Button size="l" icon={ArrowRight} className="w-full" onClick={startFromSpecification} disabled={!ownerType}>Start School-Aligned Test</Button>
        )}
      </div>
    </div>
  );
}
