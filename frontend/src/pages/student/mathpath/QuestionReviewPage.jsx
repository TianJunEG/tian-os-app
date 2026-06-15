import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, ErrorState, PageHeader } from '../../../components/ui';
import { getSkill } from '../../../mathpath/fractions/fractionSkillGraph';
import { getQuestionFamily } from '../../../mathpath/fractions/fractionQuestionFamilies';
import { classifyFractionMistake, getRemediationForMistake } from '../../../mathpath/fractions/fractionMistakeToMasteryEngine';
import {
  AnswerComparisonCard,
  FluencyFeedbackCard,
  MistakeInsightCard,
  MissingReviewState,
  NextActionCard,
  QuestionReviewCard,
  ReviewFilterBar,
  SolutionStepsCard,
  WorkingStatusCard,
} from '../../../components/mathpath/review/QuestionReviewCards';

function normalizeInsight(item) {
  if (item.correct) return null;
  if (item.mistakeInsight) return item.mistakeInsight;

  const classified = classifyFractionMistake({
    skillId: item.skillId,
    questionFamilyId: item.questionFamilyId,
    studentAnswer: item.studentAnswer,
    correctAnswer: item.correctAnswer,
    timeTaken: item.timeTaken,
    confidence: item.confidence,
    workingAnalysisResult: item.workingAnalysisResult || {},
  });
  const remediation = getRemediationForMistake(classified.suspectedMistakeCode, { skillId: item.skillId });
  return {
    code: classified.suspectedMistakeCode,
    message: remediation.explanationForStudent,
    recommendedSkill: remediation.remediationSkillIds?.[0] ? (getSkill(remediation.remediationSkillIds[0])?.name || remediation.remediationSkillIds[0]) : null,
    modelDrawingTrainer: remediation.modelDrawingTrainer,
  };
}

function filterItems(items, filter) {
  if (filter === 'incorrect') return items.filter((item) => !item.correct);
  if (filter === 'slow') return items.filter((item) => item.fluencyFlag === 'accurateButSlow');
  if (filter === 'missingWorking') return items.filter((item) => item.workingRequired && !item.workingUploaded);
  return items;
}

export default function QuestionReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [idx, setIdx] = useState(0);

  const rawItems = location.state?.reviewItems || [];
  const source = location.state?.source || 'practice';
  const nextAction = location.state?.nextAction || 'continuePractice';
  const backTo = location.state?.backTo || '/student';
  const primaryAction = location.state?.primaryAction || (source === 'assessment' ? '/student/mathpath/assessment' : '/student/mathpath');

  const preparedItems = useMemo(
    () =>
      rawItems.map((item) => {
        const skill = getSkill(item.skillId);
        const family = getQuestionFamily(item.questionFamilyId);
        return {
          ...item,
          skillName: item.skillName || skill?.name || 'Fractions',
          questionFamilyName: item.questionFamilyName || family?.name || '',
          targetSeconds: item.targetSeconds ?? family?.fluencyBenchmarks?.gold ?? family?.fluencyTargetSeconds ?? null,
        };
      }),
    [rawItems]
  );

  const visibleItems = useMemo(() => filterItems(preparedItems, filter), [preparedItems, filter]);
  const safeIdx = Math.min(idx, Math.max(0, visibleItems.length - 1));
  const item = visibleItems[safeIdx];

  if (!rawItems.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Question Review" subtitle="Review your methods, fluency, and next steps." />
        <ErrorState
          message="No review data found yet. Complete a practice or assessment session first."
          onRetry={() => navigate('/student/mathpath')}
        />
      </div>
    );
  }

  const insight = item ? normalizeInsight(item) : null;
  const actionMessage =
    nextAction === 'startFluency' ? 'Start a fluency drill for this skill.' :
      nextAction === 'reviewNeeded' ? 'Review the prerequisite skill before continuing.' :
        nextAction === 'uploadWorking' ? 'Upload your working to improve feedback quality.' :
          source === 'assessment' ? 'Continue assessment review or start recommended practice.' :
            'Try similar questions to reinforce this skill.';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Question Review"
        subtitle="See what you answered, how fast, and what to improve next."
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <ReviewFilterBar filter={filter} setFilter={setFilter} />
        <p className="text-xs text-ink-500">{visibleItems.length} / {preparedItems.length} shown</p>
      </div>

      {!visibleItems.length ? (
        <MissingReviewState />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-surface-white px-3 py-2">
            <Button size="s" variant="secondary" icon={ChevronLeft} disabled={safeIdx <= 0} onClick={() => setIdx((n) => Math.max(0, n - 1))}>Previous</Button>
            <p className="text-sm text-ink-600">Question {safeIdx + 1} of {visibleItems.length}</p>
            <Button size="s" variant="secondary" icon={ChevronRight} disabled={safeIdx >= visibleItems.length - 1} onClick={() => setIdx((n) => Math.min(visibleItems.length - 1, n + 1))}>Next</Button>
          </div>

          <QuestionReviewCard item={item} />
          <AnswerComparisonCard item={item} />
          <SolutionStepsCard solutionSteps={item.solutionSteps || []} />
          <FluencyFeedbackCard item={item} />
          <MistakeInsightCard
            insight={insight}
            onModelDrawing={() => insight?.modelDrawingTrainer?.href && navigate(insight.modelDrawingTrainer.href)}
          />
          <WorkingStatusCard item={item} />
          <NextActionCard
            actionLabel={actionMessage}
            primaryLabel={source === 'assessment' ? 'Continue Assessment Review' : 'Practise This Skill'}
            onPrimary={() => navigate(primaryAction)}
            onBack={() => navigate(backTo)}
          />
        </div>
      )}
    </div>
  );
}
