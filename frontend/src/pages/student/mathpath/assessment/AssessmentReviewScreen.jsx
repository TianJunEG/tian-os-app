import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, Button, PageHeader, ErrorState } from '../../../../components/ui';
import { checkFractionAnswer } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import {
  buildAssessmentReport,
  scoreFractionAssessmentSubmission,
} from '../../../../mathpath/fractions/fractionAssessmentEngine';
import { getSkill } from '../../../../mathpath/fractions/fractionSkillGraph';
import { getQuestionFamily } from '../../../../mathpath/fractions/fractionQuestionFamilies';
import { calculateQuestionFluency } from '../../../../mathpath/fractions/fractionFluencyEngine';
import {
  hasWorkingDecision,
  resolveWorkingRequirementLevel,
} from '../../../../components/learning/WorkingEvidenceDecision';

export default function AssessmentReviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const session = location.state?.session;
  const rawQuestions = location.state?.questions || [];
  const questions = useMemo(() => repairFractionQuestions(rawQuestions), [rawQuestions]);
  const answers = location.state?.answers || {};
  const conf = location.state?.conf || {};
  const helpRequests = location.state?.helpRequests || {};
  const flagged = location.state?.flagged || {};
  const workings = location.state?.workings || {};
  const timeByQuestion = location.state?.timeByQuestion || {};
  const totalTimeSeconds = location.state?.totalTimeSeconds || 0;

  if (!session || !questions.length) {
    return <ErrorState message="No assessment session found. Start assessment again." onRetry={() => navigate('/student/mathpath/assessment')} />;
  }

  const answered = questions.filter((q) => String(answers[q.questionId] || '').trim() !== '').length;
  const unanswered = questions.length - answered;
  const incompleteEvidence = questions.filter((q) => !hasWorkingDecision(workings[q.questionId] || {})).length;
  const missingConfidence = questions.filter((q) => !conf[q.questionId]).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const questionRefs = useMemo(
    () =>
      questions.map((q) => ({
        questionId: q.questionId,
        questionFamilyId: q.questionFamilyId,
        skillId: q.skillId,
        prompt: q.prompt || q.stem,
        workingRequired: Boolean(q.workingRequired),
        mentalMathEligible: Boolean(q.mentalMathEligible),
      })),
    [questions]
  );

  const submit = () => {
    if (unanswered > 0 || missingConfidence > 0 || incompleteEvidence > 0) {
      setError('Complete every answer, confidence choice, and working evidence declaration before submitting.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const responses = questions.map((q) => {
        const studentAnswer = String(answers[q.questionId] || '').trim();
        const checked = checkFractionAnswer({
          studentAnswer,
          correctAnswer: q.answer,
          acceptedAnswers: q.acceptedAnswers || [],
        });
        const correct = Boolean(checked.correct);
        const working = workings[q.questionId] || {};
        const workingRequirementLevel = resolveWorkingRequirementLevel(q, 'mastery_check');
        return {
          questionId: q.questionId,
          skillId: q.skillId,
          questionFamilyId: q.questionFamilyId,
          answer: studentAnswer,
          answerCorrect: correct,
          correct,
          marksAwarded: correct ? (q.marks || 1) : 0,
          totalMarks: q.marks || 1,
          timeTaken: Number(timeByQuestion[q.questionId] || 0),
          confidence: conf[q.questionId] || '',
          reflection: conf[q.questionId] || '',
          helpRequested: Boolean(helpRequests[q.questionId]),
          skipped: studentAnswer === '',
          timestamp: new Date().toISOString(),
          workingImage: working.workingImage || '',
          workingStrokes: working.workingStrokes || [],
          workingSubmitted: Boolean(working.workingSubmitted),
          workingSubmittedAt: working.workingSubmittedAt || null,
          workingNotNeeded: Boolean(working.workingNotNeeded),
          workingRequirementLevel,
          workingUploaded: Boolean(working.workingSubmitted),
          studentAnswer,
          correctAnswer: q.answer?.display || '',
        };
      });
      const scored = scoreFractionAssessmentSubmission({
        assessmentSessionId: session.assessmentSessionId,
        responses,
      });
      const report = buildAssessmentReport(scored);
      const questionById = new Map(questions.map((q) => [q.questionId, q]));
      const reviewItems = responses.map((r) => {
        const q = questionById.get(r.questionId) || {};
        const family = getQuestionFamily(r.questionFamilyId);
        const fluency = calculateQuestionFluency(
          {
            correct: r.correct,
            timeTaken: Number(r.timeTaken || 0),
            confidence: r.confidence,
            skipped: String(r.studentAnswer || '').trim() === '',
          },
          family || {}
        );
        return {
          questionId: r.questionId,
          prompt: q.prompt || q.stem || '',
          skillId: r.skillId,
          questionFamilyId: r.questionFamilyId,
          difficulty: q.difficulty,
          marks: q.marks || 1,
          marksAwarded: r.marksAwarded,
          totalMarks: r.totalMarks,
          studentAnswer: r.studentAnswer,
          correctAnswer: r.correctAnswer,
          correct: r.correct,
          confidence: r.confidence,
          reflection: r.reflection || r.confidence || '',
          helpRequested: Boolean(r.helpRequested),
          timeTaken: r.timeTaken,
          fluencyFlag: fluency.fluencyFlag,
          targetSeconds: fluency.benchmarkSeconds,
          solutionSteps: q.solutionSteps || [],
          workingRequired: Boolean(q.workingRequired),
          workingImage: r.workingImage || '',
          workingStrokes: r.workingStrokes || [],
          workingSubmitted: Boolean(r.workingSubmitted),
          workingSubmittedAt: r.workingSubmittedAt || null,
          workingNotNeeded: Boolean(r.workingNotNeeded),
          workingRequirementLevel: r.workingRequirementLevel,
          workingUploaded: Boolean(r.workingUploaded),
        };
      });

      const requiresWorking = questionRefs.some((q) => q.workingRequired);
      if (requiresWorking) {
        navigate(`/student/mathpath/assessment/working/${session.assessmentSessionId}`, {
          replace: true,
          state: {
            session,
            scored,
            report,
            reviewItems,
            totalTimeSeconds,
            questionRefs,
          },
        });
        return;
      }

      navigate(`/student/mathpath/assessment/results/${session.assessmentSessionId}`, {
        replace: true,
        state: {
          session,
          scored,
          report,
          reviewItems,
          totalTimeSeconds,
          workingUploadStatus: 'notRequired',
        },
      });
    } catch (e) {
      setError(e.message || 'Could not submit assessment.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Review Assessment" subtitle="Check your answers before final submission." />
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-4 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-ink-500">Answered</p><p className="font-mono text-lg">{answered}</p></div>
          <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-ink-500">Unanswered</p><p className="font-mono text-lg">{unanswered}</p></div>
          <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-ink-500">Flagged</p><p className="font-mono text-lg">{flaggedCount}</p></div>
          <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-ink-500">Time Used</p><p className="font-mono text-lg">{Math.floor(totalTimeSeconds / 60)}:{String(totalTimeSeconds % 60).padStart(2, '0')}</p></div>
        </div>
        {(unanswered > 0 || missingConfidence > 0 || incompleteEvidence > 0) && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-100 p-3 text-sm text-gold-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Complete every answer, confidence choice, and working evidence declaration before submitting.</p>
          </div>
        )}
        <div className="mt-4 max-h-56 space-y-2 overflow-auto rounded-lg border border-hairline p-3">
          {questions.map((q, i) => (
            <div key={q.questionId} className="flex items-center justify-between gap-2 text-sm">
              <p className="truncate text-ink-700">Q{i + 1} · {getSkill(q.skillId)?.name || 'Skill'}</p>
              <div className="flex items-center gap-2">
                {flagged[q.questionId] && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-900">Flagged</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs ${answers[q.questionId] ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                  {answers[q.questionId] ? 'Answered' : 'Unanswered'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${conf[q.questionId] ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                  {conf[q.questionId] ? 'Confidence' : 'No confidence'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${hasWorkingDecision(workings[q.questionId] || {}) ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                  {hasWorkingDecision(workings[q.questionId] || {}) ? 'Working evidence' : 'No working evidence'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-error-700">{error}</p>}
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back to Questions</Button>
          <Button icon={ArrowRight} disabled={busy || unanswered > 0 || missingConfidence > 0 || incompleteEvidence > 0} onClick={submit}>
            {busy ? 'Submitting…' : 'Submit Assessment'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
