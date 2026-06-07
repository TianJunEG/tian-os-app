import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';
import { mathpathAPI } from '../../../services/api';

const STUDENT_SKILL_LABELS = {
  F001: 'Recognising fractions',
  F002: 'Understanding numerator and denominator',
  F003: 'Finding fractions of a whole',
  F004: 'Understanding unit fractions',
  F005: 'Placing fractions on a number line',
  F006: 'Comparing unit fractions',
  F007: 'Comparing fractions with the same denominator',
  F008: 'Comparing fractions with the same numerator',
  F009: 'Ordering fractions',
  F010: 'Understanding equivalent fractions',
  F011: 'Making equivalent fractions',
  F012: 'Simplifying fractions',
  F013: 'Understanding improper fractions',
  F014: 'Understanding mixed numbers',
  F015: 'Changing mixed numbers and improper fractions',
  F016: 'Adding fractions with the same denominator',
  F017: 'Subtracting fractions with the same denominator',
  F018: 'Adding fractions with different denominators',
  F019: 'Subtracting fractions with different denominators',
  F020: 'Finding a fraction of a quantity',
  F021: 'Multiplying fractions',
  F022: 'Dividing fractions',
  F023: 'Solving fraction word problems',
  F024: 'Solving multi-step fraction problems',
  F025: 'Solving exam-style fraction questions',
  F026: 'Solving mixed fraction challenges',
};

function statusText(status = '') {
  return String(status || 'assigned').replace(/_/g, ' ');
}

function sourceReason(assignment = {}) {
  if (assignment.evidenceSource?.studentExplanation) return assignment.evidenceSource.studentExplanation;
  const source = String(assignment.sourceType || '').toLowerCase();
  if (source === 'diagnostic') return 'Your diagnostic found skills that need more practice.';
  if (source === 'paper_analysis') return 'An uploaded paper found questions to strengthen.';
  if (source === 'tutor_lesson' || source === 'tutor') return 'Your tutor assigned this from your lesson plan.';
  if (source === 'student_care_intervention') return 'This was assigned from your student care support plan.';
  if (source === 'parent_support') return 'This was assigned for home practice support.';
  return 'This pack gives you targeted practice for skills that need more work.';
}

function learningSequenceText(assignment = {}) {
  const steps = assignment.guidedPracticeFlow?.steps || [];
  if (!steps.length) return 'Worked example -> Guided practice -> Independent practice -> Recheck';
  const labels = {
    worked_example: 'Worked example',
    visual_explanation: 'Visual explanation',
    guided_question: 'Guided practice',
    independent_practice: 'Independent practice',
    mastery_check: 'Mastery check',
  };
  return steps.map((step) => labels[step.type] || step.title || step.type).filter(Boolean).join(' -> ');
}

function nextStepText({ recheckReady, attempted, target, status } = {}) {
  if (recheckReady) return 'You are ready to do a short recheck and see what improved.';
  if (status === 'completed') return 'You finished this pack. Check whether your recheck is ready.';
  if (attempted > 0) return 'Continue the pack until Tian OS unlocks your recheck.';
  return 'Start with the first practice set. Tian OS will track your progress.';
}

function progressPercent(attempted, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((attempted / target) * 100)));
}

function studentSkillLabel(skillId = '') {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return 'Fractions practice';
  return STUDENT_SKILL_LABELS[normalized]
    || getUniversalSkillByFrameworkId(normalized)?.title
    || 'Fractions practice';
}

export default function MathPathAssignments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    mathpathAPI.mathPathAssignments()
      .then((res) => {
        if (mounted) setItems(res.data.assignments || []);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load Recovery Packs.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const startPractice = (assignment) => {
    navigate(`/student/mathpath/recovery-pack/${assignment.id}`);
  };

  const runRecheck = async (assignment) => {
    setMessage('');
    try {
      const { data } = await mathpathAPI.createAssignmentRecheck(assignment.id);
      if (data.diagnosticSessionId) {
        navigate(`/student/mathpath/diagnostic/session/${data.diagnosticSessionId}`);
        return;
      }
      setMessage(data.message || 'Recheck is not ready yet.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Complete more of the Recovery Pack before recheck.');
    }
  };

  if (loading) return <Spinner label="Loading Recovery Packs..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Recovery Packs"
        subtitle="Targeted practice that helps you strengthen weak skills before a recheck."
      />
      {message && <Card className="mb-4 p-3 text-sm font-semibold text-ink-700">{message}</Card>}
      {!items.length ? (
        <EmptyState message="No Recovery Packs yet. Complete a diagnostic or paper review to unlock targeted practice." />
      ) : (
        <div className="space-y-3">
          {items.map((assignment) => {
            const completion = assignment.completion || {};
            const attempted = Number(completion.questionsAttempted || 0);
            const target = Number(assignment.targetQuestionCount || completion.questionsAssigned || 0);
            const recheckReady = Boolean(assignment.recheck?.recommended);
            const percent = progressPercent(attempted, target);
            return (
              <Card key={assignment.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{statusText(assignment.status)}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-navy-700">{assignment.title || 'Fractions Recovery Pack'}</h2>
                    <p className="mt-1 text-sm text-ink-600">{assignment.description || 'Targeted practice for weak skills.'}</p>
                    <p className="mt-2 rounded-xl bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-800">
                      Why this pack: {sourceReason(assignment)}
                    </p>
                    <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink-700">
                      Learning path: {learningSequenceText(assignment)}
                    </p>
                    <p className="mt-2 text-sm text-ink-600">
                      Skills: {(assignment.skillIds || []).map(studentSkillLabel).join(', ') || 'Fractions'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-paper px-3 py-2 text-sm text-ink-700 sm:min-w-[170px]">
                    <p className="font-semibold">{attempted}/{target || '-'} questions</p>
                    <p>{Number(completion.accuracy || 0)}% accuracy</p>
                    <ProgressBar value={percent} max={100} className="mt-2" />
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink-700">
                  <span className="font-semibold">Next step:</span>{' '}
                  {nextStepText({ recheckReady, attempted, target, status: assignment.status })}
                  {!recheckReady && (
                    <span className="mt-1 block text-xs text-ink-500">
                      Recheck unlocks after enough targeted practice is completed.
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recheckReady || assignment.status === 'completed' ? (
                    <Button icon={RefreshCw} onClick={() => runRecheck(assignment)}>
                      {recheckReady ? 'Run Recheck' : 'Check Recheck Readiness'}
                    </Button>
                  ) : (
                    <Button icon={ArrowRight} onClick={() => startPractice(assignment)}>
                      {assignment.status === 'in_progress' ? 'Continue Recovery Pack' : 'Start Recovery Pack'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
