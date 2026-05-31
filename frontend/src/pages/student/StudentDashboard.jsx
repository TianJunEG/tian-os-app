import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Flame,
  Gauge,
  Lock,
  Network,
  RefreshCw,
  Timer,
  Trophy,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { validateStudentDashboardPayload } from '../../mathpath/orchestration/pipelineContract';
import { getSkill } from '../../mathpath/fractions/fractionSkillGraph';
import { mathpathAPI } from '../../services/api';
import { Card, Button, ProgressBar, Spinner, ErrorState, Badge } from '../../components/ui';

function actionMeta(nextAction = {}) {
  const map = {
    continuePractice: { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-dashboard' },
    startFluency: { label: 'Start Fluency Drill', to: '/student/mathpath/fluency' },
    completeRetentionReview: { label: 'Complete Review', to: '/student/mathpath' },
    attemptAssessment: { label: 'Try Assessment', to: '/student/mathpath/assessment' },
    uploadWorking: { label: 'Upload Working', to: '/student/mathpath/working/upload?source=manual' },
    followRemediationPlan: { label: 'Start Practice', to: '/student/mathpath/practice/recommended-diagnostic' },
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

function skillIds(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => row?.skillId || row)
    .filter(Boolean);
}

function shapeLatestDiagnostic(latest = {}) {
  if (!latest?.hasPlacement || !latest?.result) return {};
  const result = latest.result || {};
  const recommendedStartingSkillId = result.recommendedStartingSkill?.skillId
    || result.recommendedStartingSkillId
    || result.currentSkillId
    || result.nextPracticePayload?.skillId
    || null;

  return {
    ...result,
    diagnosticCompleted: true,
    diagnosticCompletedAt: result.diagnosticCompletedAt || result.completedAt || latest.completedAt || null,
    completedAt: result.completedAt || latest.completedAt || null,
    recommendedStartingSkillId,
    masteredSkillIds: skillIds(result.masteredSkills),
    weakSkillIds: skillIds(result.weakSkills),
  };
}

const COURSE_THEMES = {
  mathpath: 'from-sky-100 via-navy-50 to-gold-100 text-navy-700',
  fluency: 'from-success-100 via-paper to-gold-100 text-success-700',
  mistakes: 'from-error-100 via-paper to-navy-50 text-error-700',
  progress: 'from-navy-50 via-paper to-success-100 text-navy-700',
  worksheet: 'from-gold-100 via-paper to-navy-50 text-gold-700',
};

function CourseArt({ icon: Icon, theme = COURSE_THEMES.mathpath, symbol = '+' }) {
  return (
    <div className={`relative h-32 overflow-hidden rounded-lg bg-gradient-to-br ${theme}`}>
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/45" />
      <div className="absolute -bottom-10 left-8 h-28 w-28 rounded-full bg-white/35" />
      <span className="absolute left-5 top-5 grid h-14 w-14 place-items-center rounded-2xl bg-paper/80 shadow-resting">
        <Icon className="h-7 w-7" />
      </span>
      <span className="absolute bottom-4 right-5 font-mono text-6xl font-semibold text-current opacity-25">{symbol}</span>
    </div>
  );
}

function JourneyStatusBadge({ status }) {
  if (status === 'done') return <Badge tone="success">Completed</Badge>;
  if (status === 'active') return <Badge tone="navy">Current</Badge>;
  if (status === 'next') return <Badge tone="gold">Upcoming</Badge>;
  return <Badge tone="neutral">Locked</Badge>;
}

function CertificateStrip({ courseProgress }) {
  const milestones = [
    { icon: Calculator, step: 'Step 1', label: 'Learn Fractions', status: courseProgress >= 25 ? 'done' : 'active' },
    { icon: Timer, step: 'Step 2', label: 'Build Fluency', status: courseProgress >= 45 ? 'done' : courseProgress >= 25 ? 'active' : 'next' },
    { icon: Wrench, step: 'Step 3', label: 'Review Mistakes', status: courseProgress >= 65 ? 'done' : courseProgress >= 45 ? 'active' : 'locked' },
    { icon: Network, step: 'Step 4', label: 'Track Progress', status: courseProgress >= 85 ? 'done' : courseProgress >= 65 ? 'active' : 'locked' },
    { icon: Trophy, step: 'Step 5', label: 'Mastery Test', status: courseProgress >= 100 ? 'done' : courseProgress >= 85 ? 'active' : 'locked' },
  ];

  return (
    <section className="mb-6 rounded-2xl bg-navy-50 px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Math Mastery Journey</h1>
          <p className="mt-1 text-sm text-ink-500 sm:text-base">Your roadmap through learning, fluency, review, progress, and the mastery test.</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Progress tracker · navigation stays in the sidebar</p>
        </div>
        <div className="grid gap-2 rounded-xl bg-paper p-2 sm:grid-cols-5">
          {milestones.map(({ icon: Icon, step, label, status }) => {
            const active = status === 'active';
            const done = status === 'done';
            return (
              <div
                key={label}
                className={`flex min-h-[8rem] flex-col rounded-lg border p-2 text-center ${
                  active ? 'border-navy-400 bg-navy-50' : done ? 'border-success-100 bg-paper' : 'border-transparent bg-paper'
                }`}
              >
                <span className="block h-4 text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-ink-400">{step}</span>
                <span className="flex h-12 items-center justify-center">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${done ? 'bg-success-500 text-white' : active ? 'bg-navy-700 text-white' : 'bg-bone text-ink-300'}`}>
                    {status === 'locked' ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                </span>
                <span className={`flex min-h-[2rem] items-center justify-center text-xs font-semibold leading-4 ${active ? 'text-navy-700' : done ? 'text-success-700' : 'text-ink-400'}`}>{label}</span>
                <span className="mt-auto flex min-h-[1.75rem] items-end justify-center pt-2"><JourneyStatusBadge status={status} /></span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CurrentCourseCard({ currentSkill, nextAction, courseProgress, hasPlacement }) {
  const action = actionMeta(nextAction);
  const primaryTo = hasPlacement ? action.to : '/student/mathpath/diagnostic';
  const primaryState = hasPlacement && primaryTo.startsWith('/student/mathpath/practice/')
    ? {
        skillId: currentSkill?.skillId || null,
        questionCount: 8,
        sessionType: 'practice',
        source: 'student-dashboard',
        backTo: '/student',
        homeBase: '/student',
      }
    : undefined;
  const lessonsCompleted = Math.max(0, Math.min(12, Math.round((courseProgress / 100) * 12)));
  return (
    <Card className="p-4 sm:p-5">
      <div className="grid gap-5 sm:grid-cols-[13rem_1fr] sm:items-center">
        <CourseArt icon={Calculator} symbol="=" />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase text-navy-700">Current Course</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">Fractions</h2>
          <p className="mt-1 text-sm text-ink-500">{currentSkill?.skillName || 'Start with your Fractions Diagnostic'}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:items-stretch">
            <Button to={primaryTo} state={primaryState} size="l" icon={ArrowRight} className="w-full min-w-0 flex-wrap px-4 text-center leading-tight">
              {hasPlacement ? action.label : 'Start Diagnostic'}
            </Button>
            <Button to="/student/mathpath/path" size="l" variant="secondary" icon={Network} className="w-full min-w-0 flex-wrap px-4 text-center leading-tight">
              View Path
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={courseProgress} />
        <div className="mt-2 flex items-center justify-between text-sm font-semibold text-ink-500">
          <span>{lessonsCompleted}/12 lessons completed</span>
          <span className="text-navy-700">{courseProgress}%</span>
        </div>
      </div>
    </Card>
  );
}

function WeeklyStreakCard({ hasActivity }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-navy-700">Weekly Streaks</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">{hasActivity ? 'Help you build learning habit' : 'Start your first streak'}</h2>
        </div>
        {!hasActivity && <Badge tone="neutral" className="shrink-0">No activity yet</Badge>}
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, index) => (
          <div key={day} className="text-center">
            <span className={`mx-auto grid h-8 w-full max-w-10 place-items-center rounded-full border text-[11px] font-semibold sm:h-9 ${
              hasActivity && index === 0
                ? 'border-success-100 bg-success-100 text-success-700'
                : 'border-hairline bg-bone/60 text-ink-400'
            }`}>
              {hasActivity && index === 0 ? <CheckCircle2 className="h-4 w-4" /> : day.slice(0, 1)}
            </span>
            <span className="mt-2 block text-[11px] font-semibold text-ink-600 sm:text-xs">{day}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-700">{hasActivity ? "Today's task is ready." : 'Complete one activity to begin your streak.'}</p>
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [resetting, setResetting] = useState(false);

  // Dev-only mock mode: explicit opt-in. Internal alpha/default users should
  // see real pipeline output, not synthetic dashboard data.
  const useMock = String(import.meta.env.VITE_USE_MATHPATH_MOCK || '').toLowerCase() === 'true';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const studentId = user?.id || user?._id || 'demo-student';
        const latest = useMock ? null : (await mathpathAPI.getLatestDiagnostic()).data;
        const diagnosticResult = shapeLatestDiagnostic(latest);
        const result = useMock
          ? buildMockPipelinePayload(studentId)
          : runMathPathDomainPipeline({
              studentId,
              domainId: 'fractions',
              mode: 'full',
              diagnosticResult,
              practiceState: {
                currentSkillId: diagnosticResult.recommendedStartingSkillId || null,
                masteredSkillIds: diagnosticResult.masteredSkillIds || [],
                weakSkillIds: diagnosticResult.weakSkillIds || [],
                lastSessionAt: diagnosticResult.completedAt || diagnosticResult.diagnosticCompletedAt || null,
              },
            });
        if (active) setPayload(result);
      } catch (e) {
        if (active) setError('Couldn’t load MathPath dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, user?._id, useMock]);

  const vm = useMemo(() => {
    const p = payload || {};
    const contract = validateStudentDashboardPayload(p);
    if (!contract.valid) {
      return { contractError: contract.errors.join(' | ') };
    }
    const state = p.studentProgress || {};
    const currentSkillName = getSkill(state.currentSkill)?.name || 'Start Fractions Diagnostic';
    const hasPlacement = Boolean(p?.studentProgress?.diagnosticCompleted || p?.diagnostic?.summary?.recommendedStartingSkillId);
    return {
      domain: 'Fractions',
      hasPlacement,
      currentSkill: hasPlacement && state.currentSkill ? {
        skillId: state.currentSkill,
        skillName: currentSkillName,
        status: state.skillStatuses?.[state.currentSkill] || 'learning',
      } : null,
      nextAction: state.nextRecommendedAction || p.nextRecommendedAction || null,
      masteryProgress: state.masteryProgress || {},
      fluency: {
        accurateButSlowAreas: state.fluencyProgress?.accurateButSlowAreas || [],
        fluentAreas: state.fluencyProgress?.fluentSkillIds || [],
      },
      retention: {
        skillsDueForReview: state.retentionProgress?.skillsDueForReview || [],
      },
      readinessBand: state.readinessLevel?.readinessBand || 'developing',
      warnings: p.warnings || [],
    };
  }, [payload]);

  if (loading) return <Spinner label="Loading MathPath dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (vm.contractError) return <ErrorState message={`MathPath dashboard payload contract mismatch: ${vm.contractError}`} onRetry={() => window.location.reload()} />;

  const warningSet = Array.isArray(vm.warnings) ? vm.warnings : [];
  const showDiagnosticPrompt = warningSet.includes('no diagnostic available');
  const hasOtherWarnings = warningSet.some((warning) => warning !== 'no diagnostic available');

  const courseProgress = Math.max(0, Math.min(100, Math.round(vm.masteryProgress?.percentageMastered || 0)));
  const fluencyProgress = Math.max(0, Math.min(100, Math.round(vm.masteryProgress?.percentageFluent || 0)));
  const hasActivity = courseProgress > 0 || fluencyProgress > 0 || Math.round(vm.masteryProgress?.percentageRetained || 0) > 0;
  const canResetStudentState = Boolean(user?.is_test_account || /^test\.student\d+@tianos\.test$/i.test(user?.email || ''));
  const resetStudentState = async () => {
    if (!canResetStudentState || resetting) return;
    setResetting(true);
    try {
      await mathpathAPI.resetTestStudentState();
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not reset student state.');
      setResetting(false);
    }
  };
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-500">Hi, {firstName}</p>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Home</h1>
        </div>
        <div className="flex items-center gap-2">
          {canResetStudentState && (
            <Button size="s" variant="secondary" onClick={resetStudentState} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Student State'}
            </Button>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-4 py-2 text-sm font-semibold text-ink-700">
            <Flame className="h-4 w-4 text-gold-500" />
            {hasActivity ? 1 : 0}
          </div>
        </div>
      </div>

      <CertificateStrip courseProgress={courseProgress} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <CurrentCourseCard
          currentSkill={vm.currentSkill}
          nextAction={vm.nextAction}
          courseProgress={courseProgress}
          hasPlacement={vm.hasPlacement}
        />
        <WeeklyStreakCard hasActivity={hasActivity} />
      </div>

      <section className="mt-7">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Recent Progress</h2>
          <p className="mt-1 text-sm text-ink-500">A quick summary only. Use Progress in the sidebar for the full report.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MasteryProgressCard masteryProgress={vm.masteryProgress} />
        <FluencyStatusCard fluency={vm.fluency} />
        <RetentionReviewCard retention={vm.retention} />
        </div>
      </section>

      {showDiagnosticPrompt && (
        <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">Start your Fractions Diagnostic to find your best starting point.</p>
          <Button to="/student/mathpath/diagnostic" size="s" icon={ArrowRight}>
            Start Diagnostic
          </Button>
        </Card>
      )}
      {hasOtherWarnings && !showDiagnosticPrompt && (
        <Card className="mt-4 p-4">
          <p className="text-sm text-ink-500">
            Your dashboard is ready, but some advanced metrics are based on limited history and will fill in as you complete more practice, fluency, and assessments.
          </p>
        </Card>
      )}
    </>
  );
}
