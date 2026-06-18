import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Box,
  Brain,
  Calculator,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Flame,
  Hash,
  Percent,
  Ruler,
  Scale,
  Sigma,
  Sparkles,
  Sprout,
  Square,
  Timer,
  Triangle,
  Trophy,
  UserCircle,
  Wrench,
} from 'lucide-react';
import StudentDashboardUpperPrimary from './StudentDashboardUpperPrimary';
import StudentDashboardLowerPrimary from './StudentDashboardLowerPrimary';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { validateStudentDashboardPayload } from '../../mathpath/orchestration/pipelineContract';
import { fractionSkillGraph, getSkill } from '../../mathpath/fractions/fractionSkillGraph';
import { diagnosticsAPI, learningTelemetryAPI, mathpathAPI, studentProfileAPI } from '../../services/api';
import { Card, Button, Spinner, ErrorState, Badge } from '../../components/ui';
import { getVisualModeStyles, isLowerPrimary, isSecondary, resolveStudentVisualMode } from '../../design-os/studentVisualMode';
import { MascotBubble } from '../../components/MascotAvatar';
import { getDashboardMascot } from '../../config/mascots';
import {
  clearMathPathDomainProgressState,
} from '../../mathpath/state/mathPathDomainProgressState';
import { buildStudentInsight, interpretConfidence } from '../../mathpath/insights/insightQualityEngine';
import {
  getFractionAssessmentBlueprintReadiness,
} from '../../mathpath/fractions/fractionAssessmentReadinessGate';
import FEATURE_FLAGS from '../../config/featureFlags';

function actionMeta(nextAction = {}, assessmentReady = true) {
  const action = String(nextAction.action || '');
  if (action === 'startFluency' && !FEATURE_FLAGS.fluency) {
    return { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' };
  }
  if (action === 'attemptAssessment' && !FEATURE_FLAGS.assessments) {
    return { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' };
  }
  const map = {
    continuePractice: { label: 'Continue Practice', to: '/student/mathpath/practice/recommended-pathway' },
    startFluency: { label: 'Start Fluency Drill', to: '/student/mathpath/fluency' },
    completeRetentionReview: { label: 'Complete Review', to: '/student/mathpath' },
    attemptAssessment: assessmentReady
      ? { label: 'Try Assessment', to: '/student/mathpath/assessment' }
      : { label: 'Mastery Check Locked', to: '/student/mathpath', disabled: true },
    uploadWorking: { label: 'Upload Working', to: '/student/mathpath/working/upload?source=manual' },
    followRemediationPlan: { label: 'Start Practice', to: '/student/mathpath/practice/recommended-diagnostic' },
    advanceSkill: { label: 'Move To Next Skill', to: '/student/mathpath' },
  };
  return map[nextAction.action] || { label: 'Start MathPath', to: '/student/mathpath' };
}

function buildMockPipelinePayload(studentId = 'mock-student') {
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
  mathpath: 'from-sky-100 via-navy-50 to-gold-100 text-emerald-deep',
  fluency: 'from-success-100 via-paper to-gold-100 text-success-700',
  mistakes: 'from-error-100 via-paper to-navy-50 text-error-700',
  progress: 'from-navy-50 via-paper to-success-100 text-emerald-deep',
  worksheet: 'from-gold-100 via-paper to-navy-50 text-gold-700',
};

function CourseArt({ icon: Icon, theme = COURSE_THEMES.mathpath, symbol = '+' }) {
  return (
    <div className={`relative h-32 overflow-hidden rounded-lg bg-gradient-to-br ${theme}`}>
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/45" />
      <div className="absolute -bottom-10 left-8 h-28 w-28 rounded-full bg-white/35" />
      <span className="absolute left-5 top-5 grid h-14 w-14 place-items-center rounded-2xl bg-surface-white/80 shadow-rest">
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
  if (nextAction?.explanation) return nextAction.explanation;
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

function TodaysMissionCard({ currentSkill, nextAction, hasPlacement, visual, assessmentReady = true }) {
  const action = actionMeta(nextAction, assessmentReady);
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
        {isLowerPrimary(visual.mode) ? (
          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-sky-50 to-pink-50 p-4">
            <img src="/illustrations/mission-fractions.png" alt="" aria-hidden="true" className="max-h-48 w-auto object-contain" />
          </div>
        ) : (
          <CourseArt icon={Calculator} symbol="=" theme="from-navy-50 via-paper to-gold-100 text-emerald-deep" />
        )}
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
            <Button to={action.disabled ? undefined : primaryTo} state={primaryState} size={visual.styles.buttonSize} icon={ArrowRight} className="w-full sm:w-auto" disabled={action.disabled}>
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
    navy: 'bg-emerald-tint text-emerald-deep',
    gold: 'bg-gold-100 text-gold-700',
    success: 'bg-success-100 text-success-700',
  }[tone] || 'bg-emerald-tint text-emerald-deep';
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




function confidenceInsightFromBuckets(buckets = {}) {
  const total = Object.values(buckets || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  if (!total) {
    return {
      value: 'No confidence insights yet.',
      body: 'Complete more questions to generate confidence insights.',
      empty: true,
    };
  }
  const confidentIncorrect = Number(buckets.confidentIncorrect || 0);
  const unsureCorrect = Number(buckets.unsureCorrect || 0);
  if (confidentIncorrect > 0) {
    const insight = interpretConfidence({ correct: false, confidence: 'high' });
    return {
      value: confidentIncorrect,
      body: insight.student,
      empty: false,
    };
  }
  if (unsureCorrect > 0) {
    const insight = interpretConfidence({ correct: true, confidence: 'low' });
    return {
      value: unsureCorrect,
      body: insight.student,
      empty: false,
    };
  }
  return {
    value: Number(buckets.confidentCorrect || 0),
    body: 'Confidence looks aligned with recent answers.',
    empty: false,
  };
}

function StudentLearningInsightCard({ analytics = {}, currentSkill = {}, nextAction = {} }) {
  const buckets = analytics.confidenceBuckets || {};
  const confidentIncorrect = Number(buckets.confidentIncorrect || 0);
  const unsureCorrect = Number(buckets.unsureCorrect || 0);
  const correct = confidentIncorrect ? false : true;
  const confidence = confidentIncorrect ? 'high' : unsureCorrect ? 'low' : 'high';
  const insight = buildStudentInsight({
    correct,
    confidence,
    occurrences: confidentIncorrect || unsureCorrect || Number(analytics.questionsAnswered || 0),
    skillName: currentSkill?.skillName || 'your current skill',
    recommendedSkillName: currentSkill?.skillName || 'your current skill',
    nextStep: nextAction?.explanation || 'Continue with the recommended activity.',
    strongImprovement: Number(analytics.accuracyRate || 0) >= 80,
  });

  return (
    <Card className="rounded-[18px] border-blue-100 bg-blue-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Learning Insight</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">Observation</p>
          <p className="mt-1 text-sm leading-5 text-ink-600">{insight.observation}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-800">What it means</p>
          <p className="mt-1 text-sm leading-5 text-ink-600">{insight.interpretation}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-800">Next step</p>
          <p className="mt-1 text-sm leading-5 text-ink-600">{insight.nextStep}</p>
        </div>
      </div>
    </Card>
  );
}


function RecommendedNextSection({ currentSkill, nextAction, hasPlacement, visual, assessmentReady = true }) {
  const action = actionMeta(nextAction, assessmentReady);
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
    ...(FEATURE_FLAGS.fluency ? [{
      icon: Timer,
      title: 'Fluency Challenge',
      body: 'Do a short round to make fractions feel faster.',
      to: '/student/mathpath/fluency',
      cta: 'Start',
    }] : []),
  ];

  return (
    <section className="mt-5">
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">{isLowerPrimary(visual.mode) ? 'Pick One Mission' : 'Recommended Next'}</h2>
        {!isLowerPrimary(visual.mode) && <p className="mt-1 text-sm text-ink-500">Choose one focused action. You do not need to do everything today.</p>}
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body, to, state, cta, primary }) => (
          <Card key={title} className={`relative flex h-full flex-col overflow-hidden p-4 ${primary ? visual.styles.softCard : visual.styles.card}`}>
            <DecorativeMotifs enabled={visual.styles.decorative && primary} />
            <div className="flex flex-1 items-start gap-3">
              <span className={`grid ${isLowerPrimary(visual.mode) ? 'h-12 w-12' : 'h-10 w-10'} shrink-0 place-items-center rounded-xl ${primary ? visual.styles.primaryIcon : visual.styles.icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex min-w-0 flex-1 self-stretch flex-col">
                <h3 className="font-semibold text-ink-900">{title}</h3>
                {!isLowerPrimary(visual.mode) && <p className="mt-1 flex-1 text-sm leading-5 text-ink-500">{body}</p>}
                <Button to={action.disabled && primary ? undefined : to} state={state} size={isLowerPrimary(visual.mode) ? 'm' : 's'} variant={primary ? 'primary' : 'secondary'} icon={ArrowRight} className="mt-auto" disabled={action.disabled && primary}>
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




// One diagnostic CTA per registered diagnostic domain (from the registry, not
// hardcoded). Each links to the diagnostic intro carrying its domainId.
function DiagnosticPrompts({ domains, containerClassName = '', containerStyle }) {
  const list = (domains && domains.length) ? domains : [{ domainId: 'fractions', displayName: 'Fractions' }];
  return (
    <div className={containerClassName} style={containerStyle}>
      <p className="mb-3 text-sm text-ink-500">Choose a topic to find your starting point:</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {list.map((d) => (
          <NavLink
            key={d.domainId}
            to={`/student/mathpath/diagnostic?domain=${encodeURIComponent(d.domainId)}`}
            className="flex min-w-0 items-center justify-between gap-2 rounded-btn border border-line bg-surface-white px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-raised hover:border-gold transition-colors"
          >
            <span className="break-words">{d.displayName}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-body-faint" />
          </NavLink>
        ))}
      </div>
    </div>
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
  const [analytics, setAnalytics] = useState(null);
  const [profileSummary, setProfileSummary] = useState(null);
  const [learningTimeline, setLearningTimeline] = useState([]);
  const [resetting, setResetting] = useState(false);
  const [expandedCards, setExpandedCards] = useState({ a: false, q: false, w: false, c: false, li: false });
  // Diagnostic CTAs are driven by the diagnostic domain registry (one per
  // domain), not hardcoded to Fractions. Seeded with Fractions so the card never
  // regresses if the registry call fails.
  const [diagnosticDomains, setDiagnosticDomains] = useState([{ domainId: 'fractions', displayName: 'Fractions' }]);

  // Dev-only mock mode: explicit opt-in. Internal alpha/default users should
  // see real pipeline output, not synthetic dashboard data.
  const useMock = String(import.meta.env.VITE_USE_MATHPATH_MOCK || '').toLowerCase() === 'true';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const studentId = user?.id || user?._id || user?.email || (useMock ? 'mock-student' : '');
        const [latestResponse, analyticsResponse, profileResponse, timelineResponse, masteryResponse, domainsResponse] = useMock
          ? [null, null, null, null, null, null]
          : await Promise.all([
              mathpathAPI.getLatestDiagnostic(),
              learningTelemetryAPI.studentAnalytics({ days: 7 }).catch(() => ({ data: null })),
              studentProfileAPI.summary().catch(() => ({ data: null })),
              studentProfileAPI.timeline().catch(() => ({ data: [] })),
              mathpathAPI.mastery().catch(() => ({ data: null })),
              diagnosticsAPI.domains().catch(() => ({ data: null })),
            ]);
        const latest = latestResponse?.data || null;
        const profile = profileResponse?.data || null;
        const persistedMastery = masteryResponse?.data || {};
        const diagnosticResult = shapeLatestDiagnostic(latest);
        const persistedRecords = Array.isArray(persistedMastery.records) ? persistedMastery.records : [];
        const persistedMasteredSkillIds = persistedRecords
          .filter((record) => ['mastered', 'accurate', 'fluent', 'retained'].includes(String(record.status || record.masteryState || '').toLowerCase()))
          .map((record) => record.skillCode || record.skillId)
          .filter(Boolean);
        const persistedWeakSkillIds = [
          ...persistedRecords
            .filter((record) => ['needs_review', 'needsreview', 'weak', 'forgotten'].includes(String(record.status || record.masteryState || '').toLowerCase()))
            .map((record) => record.skillCode || record.skillId),
          ...(persistedMastery.weakSkills || []).map((row) => row?.skillCode || row?.skillId),
        ].filter(Boolean);
        const masteredSkillIds = [
          ...(diagnosticResult.masteredSkillIds || []),
          ...persistedMasteredSkillIds,
        ];
        const weakSkillIds = [
          ...(diagnosticResult.weakSkillIds || []),
          ...persistedWeakSkillIds,
        ].filter((skillId) => !masteredSkillIds.includes(skillId));
        const persistedRecommendedSkill = persistedMastery.recommended?.skillCode || persistedMastery.recommended?.target || '';
        const persistedCurrentSkillId = profile?.currentSkillId
          || (String(persistedRecommendedSkill).startsWith('F') ? persistedRecommendedSkill : '')
          || diagnosticResult.recommendedStartingSkillId
          || null;
        const result = useMock
          ? buildMockPipelinePayload(studentId)
          : runMathPathDomainPipeline({
              studentId,
              domainId: 'fractions',
              mode: 'full',
              diagnosticResult,
              practiceState: {
                currentSkillId: persistedCurrentSkillId,
                masteredSkillIds,
                fluentSkillIds: [],
                weakSkillIds,
                lastSessionAt: diagnosticResult.completedAt || diagnosticResult.diagnosticCompletedAt || null,
              },
            });
        if (active) {
          const domains = (domainsResponse?.data?.domains || [])
            .filter((d) => d && d.domainId)
            .map((d) => ({ domainId: d.domainId, displayName: d.displayName || d.domainId }));
          if (domains.length) setDiagnosticDomains(domains);
          setPayload(result);
          setAnalytics(analyticsResponse?.data || null);
          setProfileSummary(profile || null);
          setLearningTimeline(Array.isArray(timelineResponse?.data) ? timelineResponse.data : []);
          const selected = result?.studentProgress?.nextRecommendedAction;
          if (selected?.skillId) {
            learningTelemetryAPI.recordEvent({
              studentId,
              eventType: 'recommendation_selected',
              domain: 'fractions',
              skillCode: selected.skillId,
              metadata: {
                selectedSkill: selected.skillId,
                recommendationReason: selected.explanation || '',
                source: selected.source || 'studentDashboard',
              },
            }).catch((e) => console.warn("StudentDashboard: fetch failed", e));
          }
        }
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
  const hasActivity = (learningTimeline || []).length > 0 || Number(profileSummary?.practiceSessions || 0) > 0 || Number(profileSummary?.questionsSolved || 0) > 0;
  const profileProgress = profileSummary?.progress || {};
  const totalSkills = Math.max(1, Number(profileProgress.total || vm.masteryProgress?.totalSkills || fractionSkillGraph.skillIds.length || 26));
  const masteredCount = Array.isArray(vm.masteryProgress?.masteredSkills)
    ? vm.masteryProgress.masteredSkills.length
    : Math.round((courseProgress / 100) * totalSkills);
  const safeMasteredCount = Math.max(0, Math.min(totalSkills, Number.isFinite(Number(profileProgress.mastered)) ? Number(profileProgress.mastered) : masteredCount));
  const profilePercentage = Number(profileProgress.percentage);
  const displayProgress = Number.isFinite(profilePercentage) ? Math.max(0, Math.min(100, Math.round(profilePercentage))) : courseProgress;
  const currentStreak = Number(profileSummary?.streak ?? 0);
  const learningXp = Number(profileSummary?.xp ?? 0);
  const streakLabel = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
  const isUpperPrimaryDashboard = !isLowerPrimary(visual.mode) && !isSecondary(visual.mode);
  const displayStreak = Math.max(0, currentStreak);
  const displayXp = Math.max(0, Math.round(learningXp));
  const dashboardAnalytics = analytics || {};
  const assessmentGate = getFractionAssessmentBlueprintReadiness({
    completedSkillIds: Array.from({ length: safeMasteredCount }, (_, index) => `F${String(index + 1).padStart(3, '0')}`),
  });
  const currentSkillName = vm.currentSkill?.skillName || (vm.hasPlacement ? 'Continue Practice' : 'Fractions Diagnostic');
  const canResetStudentState = Boolean(user?.is_test_account || /^test\.student\d+@tianos\.test$/i.test(user?.email || ''));
  const resetStudentState = async () => {
    if (!canResetStudentState || resetting) return;
    setResetting(true);
    try {
      await mathpathAPI.resetTestStudentState();
      const studentId = user?.id || user?._id || user?.email || '';
      if (studentId) clearMathPathDomainProgressState(studentId, 'fractions');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not reset student state.');
      setResetting(false);
    }
  };

  if (isUpperPrimaryDashboard) {
    return (
      <StudentDashboardUpperPrimary
        firstName={firstName}
        vm={vm}
        dashboardAnalytics={dashboardAnalytics}
        safeMasteredCount={safeMasteredCount}
        showDiagnosticPrompt={showDiagnosticPrompt}
        diagnosticDomains={diagnosticDomains}
        canResetStudentState={canResetStudentState}
        resetStudentState={resetStudentState}
        resetting={resetting}
        expandedCards={expandedCards}
        setExpandedCards={setExpandedCards}
        hasOtherWarnings={hasOtherWarnings}
      />
    );
  }

  if (isLowerPrimary(visual.mode)) {
    return (
      <StudentDashboardLowerPrimary
        TodaysMissionCard={TodaysMissionCard}
        firstName={firstName}
        vm={vm}
        visual={visual}
        assessmentGate={assessmentGate}
        safeMasteredCount={safeMasteredCount}
        totalSkills={totalSkills}
        streakLabel={streakLabel}
        displayStreak={displayStreak}
        displayXp={displayXp}
        showDiagnosticPrompt={showDiagnosticPrompt}
        diagnosticDomains={diagnosticDomains}
        canResetStudentState={canResetStudentState}
        resetStudentState={resetStudentState}
        resetting={resetting}
      />
    );
  }

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
              {resetting ? 'Resetting...' : 'Reset Demo Student'}
            </Button>
          )}
          <Button to="/student/profile" size="s" variant="secondary" icon={UserCircle} className="hidden sm:inline-flex">
            Profile
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-line-soft bg-surface-white px-4 py-2 text-sm font-semibold text-ink-700">
            <Flame className="h-4 w-4 text-gold-500" />
            {hasActivity ? 1 : 0}
          </div>
        </div>
      </div>

      <MascotBubble
        name={getDashboardMascot().key}
        message={getDashboardMascot().greeting(firstName)}
        size="sm"
        className="mb-4"
      />

      <TodaysMissionCard
        currentSkill={vm.currentSkill}
        nextAction={vm.nextAction}
        hasPlacement={vm.hasPlacement}
        visual={visual}
        assessmentReady={assessmentGate.ready}
      />
      <div className="mt-4">
        <StudentLearningInsightCard analytics={dashboardAnalytics} currentSkill={vm.currentSkill} nextAction={vm.nextAction} />
      </div>

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
          assessmentReady={assessmentGate.ready}
      />

      {FEATURE_FLAGS.comics && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#fef3c7' }}>
            <BookOpen className="h-5 w-5" style={{ color: '#d97706' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Tian 7 Chronicles</p>
            <p className="text-xs text-ink-500 truncate">
              Comic word problems with Kylo & friends — start at Ep 1
            </p>
          </div>
          <Button to="/student/comics" size="s" icon={ArrowRight}>Read</Button>
        </Card>
      )}

      {FEATURE_FLAGS.psl && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100">
            <Brain className="h-5 w-5 text-gold-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Problem Solving Lab</p>
            <p className="text-xs text-ink-500">Learn to solve word problems step by step</p>
          </div>
          <Button to="/student/psl" size="s" icon={ArrowRight}>Start</Button>
        </Card>
      )}

      {FEATURE_FLAGS.lifelab && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-tint">
            <Sprout className="h-5 w-5 text-emerald" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">LifeLab</p>
            <p className="text-xs text-ink-500">Build real-world skills and 21st Century competencies</p>
          </div>
          <Button to="/student/lifelab" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}

      {FEATURE_FLAGS.decimals && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-tint">
            <Calculator className="h-5 w-5 text-emerald" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Decimals</p>
            <p className="text-xs text-ink-500">Place value, operations and measurement (P4–P6)</p>
          </div>
          <Button to="/student/mathpath/decimals" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}

      {FEATURE_FLAGS.percentages && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint">
            <Percent className="h-5 w-5 text-purple" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Percentage</p>
            <p className="text-xs text-ink-500">Per hundred, conversions, discount, GST and interest (P5–P6)</p>
          </div>
          <Button to="/student/mathpath/percentages" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}

      {FEATURE_FLAGS.ratioRate && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100">
            <Scale className="h-5 w-5 text-teal-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Ratio &amp; Rate</p>
            <p className="text-xs text-ink-500">Equivalent ratios, dividing in a ratio, speed and direct proportion (P5–P6)</p>
          </div>
          <Button to="/student/mathpath/ratio-rate" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.operations && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <Calculator className="h-5 w-5 text-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Operations</p>
            <p className="text-xs text-ink-500">Add, subtract, multiply &amp; divide (P1–P4)</p>
          </div>
          <Button to="/student/mathpath/operations" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.numberSense && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <Hash className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Number Sense</p>
            <p className="text-xs text-ink-500">Place value, rounding &amp; patterns (P1–P4)</p>
          </div>
          <Button to="/student/mathpath/number-sense" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.money && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Money</p>
            <p className="text-xs text-ink-500">Dollars, cents &amp; everyday calculations (P1–P4)</p>
          </div>
          <Button to="/student/mathpath/money" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.time && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
            <Clock className="h-5 w-5 text-sky-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Time</p>
            <p className="text-xs text-ink-500">Clock, calendar &amp; duration (P1–P4)</p>
          </div>
          <Button to="/student/mathpath/time" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.measurement && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Ruler className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Measurement</p>
            <p className="text-xs text-ink-500">Length, mass and capacity (P2–P5)</p>
          </div>
          <Button to="/student/mathpath/measurement" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.geometry && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Triangle className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Geometry</p>
            <p className="text-xs text-ink-500">Angles, shapes &amp; properties (P3–P6)</p>
          </div>
          <Button to="/student/mathpath/geometry" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.areaPerimeter && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
            <Square className="h-5 w-5 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Area &amp; Perimeter</p>
            <p className="text-xs text-ink-500">Rectilinear and composite figures (P3–P6)</p>
          </div>
          <Button to="/student/mathpath/area-perimeter" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.circles && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100">
            <Circle className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Circles</p>
            <p className="text-xs text-ink-500">Circumference, area and composite shapes (P5–P6)</p>
          </div>
          <Button to="/student/mathpath/circles" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.volume && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100">
            <Box className="h-5 w-5 text-lime-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Volume &amp; Capacity</p>
            <p className="text-xs text-ink-500">Cuboids and liquid volume (P4–P6)</p>
          </div>
          <Button to="/student/mathpath/volume" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.statistics && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <BarChart2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Statistics</p>
            <p className="text-xs text-ink-500">Charts, tables and averages (P3–P6)</p>
          </div>
          <Button to="/student/mathpath/statistics" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}
      {FEATURE_FLAGS.algebra && (
        <Card className="mt-4 flex items-center gap-4 p-4" interactive>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100">
            <Sigma className="h-5 w-5 text-fuchsia-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-700">Algebra</p>
            <p className="text-xs text-ink-500">Equations, unknowns &amp; patterns (P5–P6)</p>
          </div>
          <Button to="/student/mathpath/algebra" size="s" icon={ArrowRight}>Explore</Button>
        </Card>
      )}

      {showDiagnosticPrompt && (
        <DiagnosticPrompts domains={diagnosticDomains} containerClassName="mt-4" />
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
