import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Card, Button, PageHeader, Badge } from '../../../../components/ui';
import { buildFractionAssessmentSession } from '../../../../mathpath/fractions/fractionAssessmentEngine';
import { generateAssessmentQuestionSet } from '../../../../mathpath/fractions/fractionQuestionGenerator';

const TYPES = ['baseline', 'progress', 'mastery', 'curriculum', 'mockPaper'];

function inferLevel(user) {
  return user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || 'P5';
}

export default function AssessmentIntroScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessmentType, setAssessmentType] = useState('progress');
  const [level, setLevel] = useState(inferLevel(user));
  const [paperType, setPaperType] = useState('paper1');
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Fractions Assessment" subtitle="Timed assessment to measure readiness." />
      <div className="space-y-4">
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
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-700">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Time Limit</p>
              <p>{preview?.timeLimitMinutes || 30} minutes</p>
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

        {error && <Card className="p-3 text-sm text-error-700">{error}</Card>}
        <Button size="l" icon={ArrowRight} className="w-full" onClick={start}>Start Assessment</Button>
      </div>
    </div>
  );
}

