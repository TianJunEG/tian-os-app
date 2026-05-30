import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Gauge, RefreshCw, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { getSkill } from '../../mathpath/fractions/fractionSkillGraph';
import { Card, Button, ProgressBar, PageHeader, Spinner, ErrorState, Badge } from '../../components/ui';

function actionMeta(nextAction = {}) {
  const map = {
    continuePractice: { label: 'Continue Practice', to: '/student/mathpath' },
    startFluency: { label: 'Start Fluency Drill', to: '/student/mathpath/fluency' },
    completeRetentionReview: { label: 'Complete Review', to: '/student/mathpath' },
    attemptAssessment: { label: 'Try Assessment', to: '/student/mathpath/assessment' },
    uploadWorking: { label: 'Upload Working', to: '/student/mathpath/working/upload?source=manual' },
    followRemediationPlan: { label: 'Follow Plan', to: '/student/mathpath/mistakes' },
    advanceSkill: { label: 'Move To Next Skill', to: '/student/mathpath' },
  };
  return map[nextAction.action] || { label: 'Start MathPath', to: '/student/mathpath' };
}

function buildMockPipelinePayload(studentId = 'demo-student') {
  return runMathPathDomainPipeline({
    studentId,
    domainId: 'fractions',
    mode: 'full',
    studentLevel: 'P5',
    diagnosticResult: {
      masteredSkillIds: ['F001', 'F002', 'F003'],
      weakSkillIds: ['F010', 'F018'],
      recommendedStartingSkillId: 'F010',
    },
    practiceState: {
      masteredSkillIds: ['F001', 'F002', 'F003'],
      weakSkillIds: ['F010'],
      currentSkillId: 'F010',
    },
    fluencyState: {
      questionFamilyResults: [
        { status: 'accurateButSlow', skillId: 'F010', questionFamilyId: 'QF_F010_001', displayName: 'Equivalent Fractions' },
        { status: 'fluent', skillId: 'F007', questionFamilyId: 'QF_F007_001', displayName: 'Compare Same Denominator' },
      ],
      fluentSkillIds: ['F001', 'F003', 'F007'],
      accurateButSlowAreas: ['Equivalent Fractions'],
      fluentAreas: ['Compare Same Denominator'],
      automaticAreas: [],
    },
    retentionState: {
      retainedSkillIds: ['F001'],
      skillsDueForReview: ['F003'],
      skillsNeedingRefresh: ['F010'],
    },
    assessmentResults: [
      {
        percentage: 63,
        readinessScore: { readinessScore: 64, readinessBand: 'approaching' },
        skillBreakdown: { F010: { percentage: 60 }, F018: { percentage: 48 } },
        fluencyBreakdown: {},
        workingSummary: {},
      },
    ],
    workingAnalysisSummary: {
      missingWorkingCount: 1,
      averageWorkingQuality: 62,
    },
    mistakePlans: [
      {
        focusMistakes: [{ mistakeCode: 'M001', count: 2, highestSeverity: 'high' }],
        rootCauseSkillIds: ['F010'],
        remediationQueue: [{ skillId: 'F010' }],
      },
    ],
  });
}

function CurrentSkillCard({ domain, currentSkill }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Domain</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-navy-700">{domain}</h2>
      <div className="mt-4 rounded-xl border border-hairline p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Skill</p>
        <p className="mt-1 font-semibold text-ink-700">{currentSkill?.skillName || 'Start Fractions Diagnostic'}</p>
        <div className="mt-2">
          <Badge tone="navy">{currentSkill?.status || 'learning'}</Badge>
        </div>
      </div>
    </Card>
  );
}

function NextActionCard({ nextAction }) {
  const action = actionMeta(nextAction);
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Next Action</p>
      <p className="mt-2 text-sm text-ink-600">
        {nextAction?.explanation || "Start your Fractions Diagnostic to find your best starting point."}
      </p>
      <Button to={action.to} size="l" icon={ArrowRight} className="mt-4 w-full">
        {action.label}
      </Button>
    </Card>
  );
}

function MasteryProgressCard({ masteryProgress }) {
  const mastered = masteryProgress?.percentageMastered || 0;
  const fluent = masteryProgress?.percentageFluent || 0;
  const retained = masteryProgress?.percentageRetained || 0;
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Mastery Progress</p>
      <div className="mt-3 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm"><span>Mastered</span><span>{mastered}%</span></div>
          <ProgressBar value={mastered} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm"><span>Fluent</span><span>{fluent}%</span></div>
          <ProgressBar value={fluent} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm"><span>Retained</span><span>{retained}%</span></div>
          <ProgressBar value={retained} />
        </div>
      </div>
    </Card>
  );
}

function FluencyStatusCard({ fluency }) {
  const slow = fluency?.accurateButSlowAreas || [];
  const fluent = fluency?.fluentAreas || [];
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2 text-ink-700"><Gauge className="h-4 w-4" /> <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fluency</p></div>
      <p className="text-sm text-ink-600">{slow.length ? `Accurate but slow: ${slow.slice(0, 2).join(', ')}` : 'No fluency bottlenecks currently flagged.'}</p>
      {fluent.length > 0 && <p className="mt-2 text-sm text-ink-500">Fluent: {fluent.slice(0, 2).join(', ')}</p>}
    </Card>
  );
}

function RetentionReviewCard({ retention }) {
  const due = retention?.skillsDueForReview || [];
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2 text-ink-700"><RefreshCw className="h-4 w-4" /> <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Retention Reviews</p></div>
      {due.length ? (
        <p className="text-sm text-ink-600">Review due: {due.slice(0, 3).join(', ')}</p>
      ) : (
        <p className="text-sm text-ink-600">No review due right now.</p>
      )}
    </Card>
  );
}

function PracticeStartCard() {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2 text-ink-700"><BookOpen className="h-4 w-4" /> <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Practice</p></div>
      <p className="text-sm text-ink-600">Continue your guided MathPath practice session.</p>
      <Button to="/student/mathpath" variant="secondary" className="mt-4 w-full">Open Practice</Button>
    </Card>
  );
}

function AssessmentStartCard({ readinessBand }) {
  const ready = ['ready', 'strong', 'advanced', 'approaching'].includes(String(readinessBand || '').toLowerCase());
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2 text-ink-700"><ClipboardCheck className="h-4 w-4" /> <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Assessment</p></div>
      <p className="text-sm text-ink-600">
        {ready ? 'You are close to assessment readiness. Try a progress check.' : 'Build more skill confidence before your next assessment.'}
      </p>
      <Button to="/student/mathpath/assessment" variant="secondary" className="mt-4 w-full" disabled={!ready}>
        {ready ? 'Try Assessment' : 'Not Ready Yet'}
      </Button>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  // Dev-only mock mode: explicit opt-in. Internal alpha/default users should
  // see real pipeline output, not synthetic dashboard data.
  const useMock = String(import.meta.env.VITE_USE_MATHPATH_MOCK || '').toLowerCase() === 'true';

  useEffect(() => {
    setLoading(true);
    setError('');
    try {
      const result = useMock
        ? buildMockPipelinePayload(user?.id || user?._id || 'demo-student')
        : runMathPathDomainPipeline({
            studentId: user?.id || user?._id || 'demo-student',
            domainId: 'fractions',
            mode: 'full',
          });
      setPayload(result);
    } catch (e) {
      setError('Couldn’t load MathPath dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id, useMock]);

  const vm = useMemo(() => {
    const p = payload || {};
    const state = p.studentProgress || {};
    const currentSkillName = getSkill(state.currentSkill)?.name || 'Start Fractions Diagnostic';
    return {
      domain: 'Fractions',
      currentSkill: state.currentSkill ? {
        skillName: currentSkillName,
        status: state.skillStatuses?.[state.currentSkill] || 'learning',
      } : null,
      nextAction: state.nextRecommendedAction || p.nextRecommendedAction || null,
      masteryProgress: state.masteryProgress || {},
      fluency: {
        accurateButSlowAreas: state.fluencyProgress?.accurateButSlowAreas || p.parentDashboard?.fluencySummary?.accurateButSlowAreas || [],
        fluentAreas: p.parentDashboard?.fluencySummary?.fluentAreas || [],
      },
      retention: {
        skillsDueForReview: state.retentionProgress?.skillsDueForReview || p.parentDashboard?.retentionSummary?.skillsDueForReview || [],
      },
      readinessBand: state.readinessLevel?.readinessBand || p.parentDashboard?.assessmentSummary?.readinessBand || 'developing',
      warnings: p.warnings || [],
    };
  }, [payload]);

  if (loading) return <Spinner label="Loading MathPath dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const primaryAction = actionMeta(vm.nextAction);
  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} subtitle="Your MathPath dashboard for today." />

      <div className="mb-4">
        <Button to={primaryAction.to} size="l" icon={ArrowRight} className="w-full">
          {primaryAction.label}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CurrentSkillCard domain={vm.domain} currentSkill={vm.currentSkill} />
        <NextActionCard nextAction={vm.nextAction} />
        <MasteryProgressCard masteryProgress={vm.masteryProgress} />
        <FluencyStatusCard fluency={vm.fluency} />
        <RetentionReviewCard retention={vm.retention} />
        <PracticeStartCard />
        <AssessmentStartCard readinessBand={vm.readinessBand} />
      </div>

      {vm.warnings.length > 0 && (
        <Card className="mt-4 p-4">
          <p className="text-sm text-ink-500">
            {vm.warnings.includes('no diagnostic available')
              ? "Start your Fractions Diagnostic to find your best starting point."
              : 'Some dashboard data is still loading. You can continue with today’s recommended action.'}
          </p>
        </Card>
      )}
    </>
  );
}
