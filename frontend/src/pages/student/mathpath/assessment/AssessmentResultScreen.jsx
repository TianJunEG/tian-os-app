import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Button, Badge, ErrorState, PageHeader, CollapsibleSection } from '../../../../components/ui';
import { getSkill } from '../../../../mathpath/fractions/fractionSkillGraph';

function nameOfSkill(skillId) {
  return getSkill(skillId)?.name || skillId;
}

export default function AssessmentResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;
  const scored = location.state?.scored;
  const report = location.state?.report;
  const reviewItems = location.state?.reviewItems || [];
  const workingUploadStatus = location.state?.workingUploadStatus || 'pending';

  if (!session || !scored) {
    return <ErrorState message="No assessment result found. Please run the assessment again." onRetry={() => navigate('/student/mathpath/assessment')} />;
  }

  const readiness = scored.readinessScore || {};
  const weakAreas = Object.entries(scored.skillBreakdown || {})
    .filter(([, v]) => (v?.percentage || 0) < 70)
    .map(([skillId]) => nameOfSkill(skillId))
    .slice(0, 5);
  const strengths = Object.entries(scored.skillBreakdown || {})
    .filter(([, v]) => (v?.percentage || 0) >= 85)
    .map(([skillId]) => nameOfSkill(skillId))
    .slice(0, 5);

  const recommendedSkillId = report?.recommendedRemediation?.[0] || scored?.nextPracticeQueue?.[0]?.skillId || session?.targetSkillIds?.[0] || 'F001';
  const recommendedSkillName = nameOfSkill(recommendedSkillId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Assessment Result" subtitle="Here is your Fractions readiness snapshot." />
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Score</p>
              <p className="font-mono text-2xl sm:text-3xl font-semibold text-navy-700">{scored.totalScore}/{scored.totalMarks}</p>
              <p className="text-sm text-ink-600">{scored.percentage}%</p>
            </div>
            <Badge tone="navy">Readiness: {readiness.readinessBand || 'developing'}</Badge>
          </div>
          <p className="mt-3 text-sm text-ink-600">
            {report?.studentSummary || 'You are developing well in Fractions. Keep practising to improve speed and confidence.'}
          </p>
        </Card>
        <CollapsibleSection
          title="Detailed report"
          summary="Strengths, weak areas, fluency notes, and working upload status."
        >
          <div className="space-y-5">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-ink-700">Strengths</p>
                  {strengths.length ? <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">{strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="mt-2 text-sm text-ink-500">Strengths will appear as you attempt more items.</p>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-700">Weak Areas</p>
                  {weakAreas.length ? <ul className="mt-2 list-disc pl-5 text-sm text-ink-600">{weakAreas.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="mt-2 text-sm text-ink-500">No major weak areas detected in this attempt.</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4">
              <p className="text-sm font-semibold text-ink-700">Fluency Notes</p>
              <p className="mt-1 text-sm text-ink-600">{readiness.explanation || 'Build speed while keeping your answers accurate.'}</p>
              <p className="mt-3 text-sm font-semibold text-ink-700">Working Upload Status</p>
              <Badge tone={workingUploadStatus === 'pending' ? 'gold' : workingUploadStatus === 'uploaded' ? 'success' : 'neutral'}>
                {workingUploadStatus}
              </Badge>
            </div>
          </div>
        </CollapsibleSection>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            size="l"
            icon={ArrowRight}
            onClick={() =>
              navigate('/student/mathpath/practice/recommended-assessment', {
                state: { skillId: recommendedSkillId, questionCount: 6 },
              })
            }
          >
            Start Recommended Practice
          </Button>
          <Button
            size="l"
            variant="secondary"
            onClick={() =>
              navigate('/student/mathpath/review', {
                state: {
                  source: 'assessment',
                  reviewItems,
                  nextAction: 'continueAssessmentReview',
                  primaryAction: '/student/mathpath/assessment',
                  backTo: '/student/mathpath/assessment',
                },
              })
            }
          >
            Review Answers
          </Button>
        </div>

        <Card className="p-4">
          <p className="text-xs text-ink-500">Recommended next skill: <span className="font-semibold text-ink-700">{recommendedSkillName}</span></p>
        </Card>
      </div>
    </div>
  );
}
