import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Flame,
  Timer,
  Trophy,
  UserCircle,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { validateStudentDashboardPayload } from '../../mathpath/orchestration/pipelineContract';
import { fractionSkillGraph, getSkill } from '../../mathpath/fractions/fractionSkillGraph';
import { mathpathAPI } from '../../services/api';
import { Card, Button, Spinner, ErrorState, Badge } from '../../components/ui';
import { getVisualModeStyles, isLowerPrimary, isSecondary, resolveStudentVisualMode } from '../../student/studentVisualMode';

function actionMeta(nextAction = {}) {
  const map = {
    continuePractice: { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' },
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

function estimateTime(nextAction = {}, hasPlacement = false) {
  if (!hasPlacement) return '6 min';
  const map = {
    continuePractice: '10 min',
    startFluency: '5 min',
    completeRetentionReview: '7 min',
    attemptAssessment: '15 min',
    uploadWorking: '4 min',
    followRemediationPlan: '8 min',
    advanceSkill: '10 min',
  };
  return map[nextAction?.action] || '8 min';
}

function recommendationReason(nextAction = {}, hasPlacement = false, currentSkill) {
  if (!hasPlacement) return 'This will find the best place for you to begin.';
  const skillName = currentSkill?.skillName || 'your current skill';
  const map = {
    continuePractice: `You are ready to keep building ${skillName}.`,
    startFluency: 'Your answers are accurate. A short speed round will make them feel easier.',
    completeRetentionReview: 'A quick review now will help this stay remembered.',
    attemptAssessment: 'You have enough progress to check what is secure.',
    uploadWorking: 'Your next step is to show your method, not just the answer.',
    followRemediationPlan: `This will clear the stuck point in ${skillName}.`,
    advanceSkill: 'You are ready for the next skill.',
  };
  return map[nextAction?.action] || `Start with ${skillName} because it is the best next step.`;
}

function DecorativeMotifs({ enabled }) {
  if (!enabled) return null;
  return (
    <>
      <span className="pointer-events-none absolute right-5 top-5 text-2xl opacity-70" aria-hidden>⭐</span>
      <span className="pointer-events-none absolute bottom-5 right-14 text-xl opacity-60" aria-hidden>✦</span>
    </>
  );
}

function TodaysMissionCard({ currentSkill, nextAction, hasPlacement, visual }) {
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
  const skillName = currentSkill?.skillName || 'Fractions Diagnostic';
  const ctaLabel = hasPlacement
    ? (isLowerPrimary(visual.mode) ? visual.styles.practiceCta : action.label)
    : (isLowerPrimary(visual.mode) ? '🚀 Start Check-In' : 'Start Diagnostic');

  return (
    <Card className={`relative overflow-hidden p-0 ${visual.styles.card}`}>
      <DecorativeMotifs enabled={visual.styles.decorative} />
      <div className="grid gap-0 lg:grid-cols-[16rem_1fr]">
        <CourseArt icon={Calculator} symbol="=" theme="from-navy-50 via-paper to-gold-100 text-navy-700" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="navy">{visual.styles.missionLabel}</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">{estimateTime(nextAction, hasPlacement)}</span>
          </div>
          <h2 className={`mt-3 font-display ${isLowerPrimary(visual.mode) ? 'text-3xl sm:text-4xl' : isSecondary(visual.mode) ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-semibold ${visual.styles.title}`}>{skillName}</h2>
          {!isLowerPrimary(visual.mode) && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
              {recommendationReason(nextAction, hasPlacement, currentSkill)}
            </p>
          )}
          <div className={`mt-5 grid gap-3 rounded-xl border p-3 text-sm text-ink-700 sm:grid-cols-3 ${visual.styles.softCard}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Current skill</p>
              <p className="mt-1 font-semibold text-ink-900">{skillName}</p>
            </div>
            {!isLowerPrimary(visual.mode) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Why this</p>
                <p className="mt-1 font-semibold text-ink-900">{hasPlacement ? 'Best next step' : 'Find your start'}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">Time</p>
              <p className="mt-1 font-semibold text-ink-900">{estimateTime(nextAction, hasPlacement)}</p>
            </div>
          </div>
          <div className="mt-5">
            <Button to={primaryTo} state={primaryState} size={visual.styles.buttonSize} icon={ArrowRight} className="w-full sm:w-auto">
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompactStatCard({ icon: Icon, label, value, tone = 'navy', visual }) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-700',
    gold: 'bg-gold-100 text-gold-700',
    success: 'bg-success-100 text-success-700',
  }[tone] || 'bg-navy-50 text-navy-700';
  return (
    <Card className={`relative overflow-hidden p-4 ${visual?.styles?.card || ''}`}>
      <DecorativeMotifs enabled={visual?.styles?.decorative && tone === 'gold'} />
      <div className="flex items-center gap-3">
        <span className={`grid ${isLowerPrimary(visual?.mode) ? 'h-12 w-12' : 'h-11 w-11'} shrink-0 place-items-center rounded-xl ${visual?.styles?.icon || toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className={`${isLowerPrimary(visual?.mode) ? 'text-base' : 'text-sm'} font-semibold text-ink-500`}>{label}</p>
          <p className="mt-0.5 text-2xl font-semibold text-ink-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function RecommendedNextSection({ currentSkill, nextAction, hasPlacement, visual }) {
  const action = actionMeta(nextAction);
  const continueState = hasPlacement
    ? {
        skillId: currentSkill?.skillId || null,
        questionCount: 8,
        sessionType: 'practice',
        source: 'student-dashboard',
        backTo: '/student',
        homeBase: '/student',
      }
    : undefined;
  const items = [
    {
      icon: ArrowRight,
      title: 'Continue Learning',
      body: hasPlacement ? currentSkill?.skillName || 'Pick up where you left off.' : 'Find your best starting point.',
      to: hasPlacement ? action.to : '/student/mathpath/diagnostic',
      state: action.to?.startsWith('/student/mathpath/practice/') ? continueState : undefined,
      cta: hasPlacement ? action.label : 'Start Diagnostic',
      primary: true,
    },
    {
      icon: Wrench,
      title: 'Review Mistakes',
      body: 'Clear one recent error before it becomes a habit.',
      to: '/student/mathpath/mistakes',
      cta: 'Review',
    },
    {
      icon: Timer,
      title: 'Fluency Challenge',
      body: 'Do a short round to make fractions feel faster.',
      to: '/student/mathpath/fluency',
      cta: 'Start',
    },
  ];

  return (
    <section className="mt-7">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-semibold text-ink-900">{isLowerPrimary(visual.mode) ? 'Pick One Mission' : 'Recommended Next'}</h2>
        {!isLowerPrimary(visual.mode) && <p className="mt-1 text-sm text-ink-500">Choose one focused action. You do not need to do everything today.</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body, to, state, cta, primary }) => (
          <Card key={title} className={`relative overflow-hidden p-4 ${primary ? visual.styles.softCard : visual.styles.card}`}>
            <DecorativeMotifs enabled={visual.styles.decorative && primary} />
            <div className="flex items-start gap-3">
              <span className={`grid ${isLowerPrimary(visual.mode) ? 'h-12 w-12' : 'h-10 w-10'} shrink-0 place-items-center rounded-xl ${primary ? visual.styles.primaryIcon : visual.styles.icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink-900">{title}</h3>
                {!isLowerPrimary(visual.mode) && <p className="mt-1 min-h-[2.5rem] text-sm leading-5 text-ink-500">{body}</p>}
                <Button to={to} state={state} size={isLowerPrimary(visual.mode) ? 'm' : 's'} variant={primary ? 'primary' : 'secondary'} icon={ArrowRight} className="mt-4">
                  {primary && isLowerPrimary(visual.mode) ? visual.styles.practiceCta : cta}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];
  const visualMode = resolveStudentVisualMode(user || {});
  const visual = { mode: visualMode, styles: getVisualModeStyles(visualMode) };
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
  const retainedProgress = Math.max(0, Math.min(100, Math.round(vm.masteryProgress?.percentageRetained || 0)));
  const hasActivity = courseProgress > 0 || fluencyProgress > 0 || retainedProgress > 0;
  const totalSkills = Math.max(1, Number(vm.masteryProgress?.totalSkills || fractionSkillGraph.skillIds.length || 26));
  const masteredCount = Array.isArray(vm.masteryProgress?.masteredSkills)
    ? vm.masteryProgress.masteredSkills.length
    : Math.round((courseProgress / 100) * totalSkills);
  const safeMasteredCount = Math.max(0, Math.min(totalSkills, masteredCount));
  const currentStreak = hasActivity ? 1 : 0;
  const learningXp = safeMasteredCount * 120 + fluencyProgress * 4 + retainedProgress * 3;
  const streakLabel = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
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
    <main className={visual.styles.page}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-500">{isLowerPrimary(visual.mode) ? `Hi ${firstName}, ready?` : `Hi, ${firstName}`}</p>
          <h1 className={`font-display ${isSecondary(visual.mode) ? 'text-2xl' : 'text-3xl'} font-semibold text-ink-900`}>{isSecondary(visual.mode) ? 'Dashboard' : 'Today'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canResetStudentState && (
            <Button size="s" variant="secondary" onClick={resetStudentState} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Student State'}
            </Button>
          )}
          <Button to="/student/profile" size="s" variant="secondary" icon={UserCircle} className="hidden sm:inline-flex">
            Profile
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-4 py-2 text-sm font-semibold text-ink-700">
            <Flame className="h-4 w-4 text-gold-500" />
            {hasActivity ? 1 : 0}
          </div>
        </div>
      </div>

      <TodaysMissionCard
        currentSkill={vm.currentSkill}
        nextAction={vm.nextAction}
        hasPlacement={vm.hasPlacement}
        visual={visual}
      />

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CompactStatCard
          icon={CheckCircle2}
          label="Skills Mastered"
          value={`${safeMasteredCount}/${totalSkills}`}
          tone="success"
          visual={visual}
        />
        <CompactStatCard
          icon={Flame}
          label={visual.styles.streakLabel}
          value={streakLabel}
          tone="gold"
          visual={visual}
        />
        <CompactStatCard
          icon={Trophy}
          label={visual.styles.xpLabel}
          value={learningXp}
          tone="navy"
          visual={visual}
        />
      </section>

      <div className="mt-3 sm:hidden">
        <Button to="/student/profile" size="m" variant="secondary" icon={UserCircle} className="w-full">
          View Profile
        </Button>
      </div>

      <RecommendedNextSection
          currentSkill={vm.currentSkill}
          nextAction={vm.nextAction}
          hasPlacement={vm.hasPlacement}
          visual={visual}
      />

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
    </main>
  );
}
