import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Box,
  Brain,
  Calculator,
  ChevronRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  DollarSign,
  Flame,
  Gem,
  Hash,
  Lightbulb,
  Percent,
  PenLine,
  Ruler,
  Scale,
  Search,
  Sigma,
  Sparkles,
  Square,
  Timer,
  Target,
  Triangle,
  Trophy,
  UserCircle,
  Wrench,
} from 'lucide-react';
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
  ASSESSMENT_LOCK_MESSAGE,
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

function UpperPrimaryMissionArt() {
  return (
    <div className="relative min-h-[140px] overflow-hidden bg-gradient-to-br from-violet-100 via-indigo-50 to-white sm:min-h-[200px]">
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-t-[60%] bg-white/75" />
      <div className="absolute bottom-7 left-10 h-20 w-32 rounded-[50%] bg-white/70" />
      <div className="absolute bottom-4 right-8 h-24 w-36 rounded-[50%] bg-white/80" />
      <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-indigo-200/80 shadow-rest sm:h-32 sm:w-32">
        <div className="grid h-20 w-20 place-items-center rounded-full border-[8px] border-indigo-500/60 bg-white sm:h-24 sm:w-24 sm:border-[10px]">
          <div className="grid h-10 w-10 place-items-center rounded-full border-[6px] border-indigo-400/80 bg-indigo-50 sm:h-12 sm:w-12 sm:border-[8px]">
            <div className="h-4 w-4 rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>
      <div className="absolute left-[52%] top-[33%] h-2 w-20 rotate-[-38deg] rounded-full bg-indigo-700 shadow-sm sm:w-24" />
      <div className="absolute left-[63%] top-[25%] h-8 w-8 rotate-[-38deg] border-l-[12px] border-t-[12px] border-l-indigo-600 border-t-transparent" />
      <Sparkles className="absolute left-20 top-16 h-5 w-5 text-indigo-300" />
      <Sparkles className="absolute right-20 top-28 h-4 w-4 text-indigo-300" />
    </div>
  );
}

function UpperPrimaryMissionCard({ currentSkill, nextAction, hasPlacement, assessmentReady = true }) {
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
  const skillName = currentSkill?.skillName || 'Equivalent Fractions';
  const time = estimateTime(nextAction, hasPlacement);
  const reason = nextAction?.explanation || 'This will help strengthen your understanding of fractions.';

  return (
    <Card className="overflow-hidden rounded-[22px] border-line-soft bg-surface-white p-0">
      <div className="grid lg:grid-cols-[0.48fr_0.52fr]">
        <UpperPrimaryMissionArt />
        <div className="flex flex-col justify-center p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="lavender" className="px-4 py-1 text-[12px] uppercase tracking-[0.08em]">Today's Mission</Badge>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">
              <Timer className="h-4 w-4" /> {time}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep sm:mt-4 sm:text-3xl">{skillName}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-600 sm:mt-3">
            {reason}
          </p>
          <Button to={action.disabled ? undefined : primaryTo} state={primaryState} icon={ArrowRight} className="mt-3 w-full bg-purple hover:bg-violet-700 sm:hidden" disabled={action.disabled}>
            Start Practice
          </Button>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-[16px] border border-violet-100 bg-white/80 p-3 text-sm sm:mt-5 sm:gap-3 sm:p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple">Current Skill</p>
              <p className="mt-1 font-semibold text-ink-800">{skillName}</p>
            </div>
            <div className="border-l border-violet-100 pl-2 sm:pl-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple">Why This</p>
              <p className="mt-1 font-semibold text-ink-800">{reason}</p>
            </div>
            <div className="border-l border-violet-100 pl-2 sm:pl-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple">Time</p>
              <p className="mt-1 font-semibold text-ink-800">{time}</p>
            </div>
          </div>
          <Button to={action.disabled ? undefined : primaryTo} state={primaryState} icon={ArrowRight} className="mt-4 hidden w-full bg-purple hover:bg-violet-700 sm:mt-5 sm:inline-flex sm:w-fit" disabled={action.disabled}>
            Start Practice
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TodayHighlights({ streak, xp, mastered, totalSkills, progress }) {
  const xpDetail = Number(xp || 0) > 0 ? 'Learning progress' : 'Start learning to earn XP';
  const rows = [
    { icon: Flame, value: streak, label: 'day streak', detail: Number(streak || 0) > 0 ? 'Keep it up!' : 'Start today', tone: 'bg-orange-50 text-orange-600', suffix: streak === 1 ? '' : '' },
    { icon: Gem, value: xp, label: 'Learning XP', detail: xpDetail, tone: 'bg-purple-tint text-purple' },
    { icon: CheckCircle2, value: `${mastered} / ${totalSkills}`, label: 'Skills Mastered', detail: `${progress}% complete`, tone: 'bg-emerald-50 text-emerald-600', progress },
  ];
  return (
    <Card className="h-full rounded-[22px] border-line-soft bg-surface-white p-5">
      <h3 className="text-lg font-semibold text-emerald-deep">Today's Highlights</h3>
      <div className="mt-4 space-y-3">
        {rows.map(({ icon: Icon, value, label, detail, tone, progress: bar }) => (
          <div key={label} className="rounded-[16px] border border-line-soft bg-gradient-to-r from-white to-slate-50 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-semibold leading-none text-emerald-deep">{value}</p>
                  <p className="text-xs font-semibold text-emerald-deep">{detail}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-600">{label}</p>
                {Number.isFinite(bar) && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniTrend({ tone = 'emerald' }) {
  const color = tone === 'blue' ? 'bg-blue-500' : tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-500';
  const heights = tone === 'amber' ? [10, 18, 28, 24, 20, 32, 38, 30, 42, 36, 48, 58] : [10, 16, 14, 20, 24, 24, 36];
  return (
    <div className="mt-4 flex h-16 items-end gap-1.5">
      {heights.map((height, index) => (
        <span key={`${tone}-${index}`} className={`w-full rounded-t-full ${color}`} style={{ height, opacity: index % 3 === 0 ? 0.4 : index % 3 === 1 ? 0.6 : 0.8 }} />
      ))}
    </div>
  );
}

function StudentMetricTile({ icon: Icon, title, value, body, tone = 'emerald', chart = 'line', empty = false }) {
  const toneMap = {
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    rose: 'border-rose-100 bg-danger-tint/70 text-danger-deep',
  };
  return (
    <Card className={`rounded-[18px] p-4 sm:p-5 ${toneMap[tone] || toneMap.emerald}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/75 shadow-sm sm:h-12 sm:w-12">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <ChevronRight className="h-4 w-4 opacity-70 sm:h-5 sm:w-5" />
      </div>
      <p className="mt-2 text-xs font-semibold sm:text-sm">{title}</p>
      <p className={`${empty ? 'text-sm leading-snug sm:text-base' : 'font-mono text-2xl leading-none sm:text-3xl'} font-semibold text-emerald-deep`}>{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-ink-700 sm:mt-2 sm:min-h-[2.5rem] sm:text-sm">{body}</p>
      {chart === 'none' || empty ? null : <MiniTrend tone={tone === 'amber' ? 'amber' : tone === 'blue' ? 'blue' : 'emerald'} />}
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

function buildUpperPrimaryMetricCards(analytics = {}) {
  const questions = Number(analytics.questionsAnswered || 0);
  const workingRate = Number(analytics.workingSubmissionRate || 0);
  const confidence = confidenceInsightFromBuckets(analytics.confidenceBuckets || {});
  return {
    accuracy: {
      value: questions ? `${Number(analytics.accuracyRate || 0)}%` : '—',
      body: questions
        ? (Number(analytics.accuracyRate || 0) > 0 ? "You're building accuracy. Keep going." : 'Keep going. Review the next question carefully.')
        : 'No practice completed this week.',
      empty: !questions,
    },
    questions: {
      value: questions || '—',
      body: questions ? 'This week' : 'No questions answered this week.',
      empty: !questions,
    },
    working: {
      value: workingRate ? `${workingRate}%` : '—',
      body: workingRate ? 'Keep showing your thinking.' : 'No working submitted yet.',
      empty: !workingRate,
    },
    confidence,
  };
}

function UpperPrimaryMetrics({ analytics }) {
  const metrics = buildUpperPrimaryMetricCards(analytics);
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StudentMetricTile icon={Target} title="Accuracy (This Week)" value={metrics.accuracy.value} body={metrics.accuracy.body} tone="emerald" empty={metrics.accuracy.empty} />
      <StudentMetricTile icon={ClipboardList} title="Questions Answered" value={metrics.questions.value} body={metrics.questions.body} tone="amber" empty={metrics.questions.empty} />
      <StudentMetricTile icon={PenLine} title="Working Submitted" value={metrics.working.value} body={metrics.working.body} tone="blue" empty={metrics.working.empty} />
      <StudentMetricTile icon={Brain} title="Confidence Insight" value={metrics.confidence.value} body={metrics.confidence.body} tone="rose" chart="none" empty={metrics.confidence.empty} />
    </section>
  );
}

function UpperPrimaryRecommendedNext({ currentSkill, nextAction, hasPlacement, masteredSkillCount = 0 }) {
  const assessmentGate = getFractionAssessmentBlueprintReadiness({
    completedSkillIds: Array.from({ length: masteredSkillCount }, (_, index) => `F${String(index + 1).padStart(3, '0')}`),
  });
  const action = actionMeta(nextAction, assessmentGate.ready);
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
  const cards = [
    {
      icon: BookOpen,
      title: 'Continue Learning',
      body: 'Pick up where you left off',
      to: hasPlacement ? action.to : '/student/mathpath/diagnostic',
      state: action.to?.startsWith('/student/mathpath/practice/') ? continueState : undefined,
      tone: 'from-emerald-50 to-white text-emerald-700',
      disabled: action.disabled,
    },
    { icon: Search, title: 'Review Mistakes', body: 'Learn from your recent mistakes', to: '/student/mathpath/mistakes', tone: 'from-amber-50 to-white text-amber-700' },
    ...(FEATURE_FLAGS.fluency ? [{ icon: Timer, title: 'Fluency Challenge', body: 'Improve speed and accuracy', to: '/student/mathpath/fluency', tone: 'from-blue-50 to-white text-blue-700' }] : []),
    ...(FEATURE_FLAGS.assessments ? [{
      icon: Award,
      title: 'Mastery Check',
      body: assessmentGate.ready ? "Check if you're ready to level up" : ASSESSMENT_LOCK_MESSAGE,
      to: assessmentGate.ready ? '/student/mathpath/assessment' : null,
      tone: 'from-violet-50 to-white text-purple',
      disabled: !assessmentGate.ready,
    }] : []),
  ];

  return (
    <Card className="rounded-[18px] border-line-soft bg-surface-white p-5">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">Recommended Next <Sparkles className="h-5 w-5 text-blue-300" /></h2>
        <p className="mt-1 text-sm text-ink-500">Choose one focused action. You don't need to do everything.</p>
      </div>
      <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, title, body, to, state, tone, disabled }) => (
          <Card key={title} className={`flex h-full flex-col rounded-btn bg-gradient-to-br p-4 shadow-sm ${tone}`}>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/75 shadow-sm">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-semibold text-emerald-deep">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-5 text-ink-700">{body}</p>
            <Button to={disabled ? undefined : to} state={state} size="s" icon={ArrowRight} className="mt-auto h-10 w-10 rounded-full px-0" aria-label={title} disabled={disabled} />
          </Card>
        ))}
      </div>
    </Card>
  );
}

function formatRelativeActivityTime(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function activityIconMeta(eventType = '') {
  if (/working/i.test(eventType)) return { icon: PenLine, tone: 'bg-blue-50 text-blue-600' };
  if (/diagnostic/i.test(eventType)) return { icon: ClipboardList, tone: 'bg-amber-50 text-amber-600' };
  if (/xp|achievement/i.test(eventType)) return { icon: Gem, tone: 'bg-purple-tint text-purple' };
  return { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' };
}

function RecentActivityCard({ activities = [] }) {
  const rows = Array.isArray(activities) ? activities : [];
  return (
    <Card className="rounded-[18px] border-line-soft bg-surface-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-emerald-deep">Recent Activity</h2>
        <Button to="/student/profile" size="s" variant="ghost">View all</Button>
      </div>
      {rows.length ? (
        <div className="mt-4 divide-y divide-line-soft">
          {rows.slice(0, 4).map((activity) => {
            const { icon: Icon, tone } = activityIconMeta(activity.eventType);
            const key = activity.id || `${activity.eventType}-${activity.occurredAt}-${activity.title}`;
            return (
              <div key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{activity.title}</p>
                  <p className="text-xs text-ink-500">{formatRelativeActivityTime(activity.occurredAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-soft bg-white px-4 py-5">
          <p className="text-sm font-semibold text-ink-700">No recent activity yet. Start your diagnostic to begin.</p>
        </div>
      )}
    </Card>
  );
}

function EncouragementBanner() {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50 px-6 py-4">
      <div className="absolute bottom-0 left-10 h-12 w-28 rounded-t-[50%] bg-violet-200/60" />
      <div className="absolute bottom-0 left-20 h-16 w-32 rounded-t-[50%] bg-violet-300/50" />
      <div className="absolute bottom-8 left-28 h-8 w-1 rounded-full bg-danger" />
      <div className="absolute bottom-14 left-29 h-5 w-8 rounded-r-full bg-danger" />
      <div className="relative ml-0 md:ml-64">
        <p className="font-semibold text-emerald-deep">Small steps every day lead to big progress.</p>
        <p className="mt-1 text-sm text-ink-600">You're doing great. Keep going!</p>
      </div>
    </div>
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

const XP_PER_LEVEL = 200;
function brainPower(xp = 0) {
  const safe = Math.max(0, Math.round(Number(xp) || 0));
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const into = safe % XP_PER_LEVEL;
  return { level, into, perLevel: XP_PER_LEVEL, percent: Math.round((into / XP_PER_LEVEL) * 100) };
}

function LowerPrimaryStatCard({ icon: Icon, img, label, value, subtitle, caption, tone = 'success', progress }) {
  const tones = {
    success: { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40', icon: 'bg-emerald-100 text-emerald-600', label: 'text-emerald-700', bar: 'bg-emerald-500' },
    gold: { card: 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50/50', icon: 'bg-orange-100 text-orange-500', label: 'text-orange-600', bar: 'bg-orange-400' },
    sky: { card: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50/50', icon: 'bg-sky-100 text-sky-600', label: 'text-sky-700', bar: 'bg-sky-500' },
    rose: { card: 'border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50/60', icon: 'bg-danger-tint text-rose-500', label: 'text-danger', bar: 'bg-danger' },
  };
  const t = tones[tone] || tones.success;
  return (
    <Card className={`relative overflow-hidden p-4 sm:p-5 ${t.card}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        {img ? (
          <img src={img} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain drop-shadow-sm sm:h-14 sm:w-14" />
        ) : (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${t.icon} shadow-rest`}>
            <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold sm:text-sm ${t.label}`}>{label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{value}</p>
        </div>
      </div>
      {(subtitle || caption) && (
        <div className="mt-3 flex items-end justify-between gap-2">
          {subtitle ? <p className="text-sm font-medium text-ink-600">{subtitle}</p> : <span />}
          {caption && <p className="text-xs font-semibold text-ink-500">{caption}</p>}
        </div>
      )}
      {Number.isFinite(progress) && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
          <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </Card>
  );
}

function LowerPrimaryRecommendedNext({ currentSkill, nextAction, hasPlacement, masteredSkillCount = 0, visual }) {
  const assessmentGate = getFractionAssessmentBlueprintReadiness({
    completedSkillIds: Array.from({ length: masteredSkillCount }, (_, index) => `F${String(index + 1).padStart(3, '0')}`),
  });
  const action = actionMeta(nextAction, assessmentGate.ready);
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
  const cards = [
    {
      icon: BookOpen,
      img: '/illustrations/icon-book.png',
      title: 'Continue Learning',
      body: 'Pick up where you left off',
      to: hasPlacement ? action.to : '/student/mathpath/diagnostic',
      state: action.to?.startsWith('/student/mathpath/practice/') ? continueState : undefined,
      tone: 'border-emerald-100 from-emerald-50 to-white text-emerald-600',
      disabled: action.disabled,
    },
    { icon: Search, img: '/illustrations/icon-magnifier.png', title: 'Review Mistakes', body: 'Learn from your recent mistakes', to: '/student/mathpath/mistakes', tone: 'border-rose-100 from-rose-50 to-white text-rose-500' },
    ...(FEATURE_FLAGS.fluency ? [{ icon: Timer, img: '/illustrations/icon-stopwatch.png', title: 'Fluency Challenge', body: 'Get faster and more sure', to: '/student/mathpath/fluency', tone: 'border-sky-100 from-sky-50 to-white text-sky-600' }] : []),
    ...(FEATURE_FLAGS.assessments ? [{
      icon: Award,
      img: '/illustrations/icon-crown.png',
      title: 'Mastery Check',
      body: assessmentGate.ready ? "See if you're ready to level up" : ASSESSMENT_LOCK_MESSAGE,
      to: assessmentGate.ready ? '/student/mathpath/assessment' : null,
      tone: 'border-violet-100 from-violet-50 to-white text-purple',
      disabled: !assessmentGate.ready,
    }] : []),
    ...(FEATURE_FLAGS.psl ? [{
      icon: Brain,
      img: null,
      title: 'Word Problems',
      body: 'Solve word problems step by step',
      to: '/student/psl',
      tone: 'border-gold-100 from-gold-50 to-white text-gold-600',
    }] : []),
  ];

  return (
    <section>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">Recommended Next <Sparkles className="h-6 w-6 text-sky-300" /></h2>
        <p className="mt-1 text-sm text-ink-500">Choose one focused action. You do not need to do everything today.</p>
      </div>
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, img, title, body, to, state, tone, disabled }) => (
          <Card key={title} className={`flex h-full flex-col rounded-card border bg-gradient-to-br p-5 shadow-rest ${tone}`}>
            {img ? (
              <img src={img} alt="" aria-hidden="true" className="h-16 w-16 object-contain drop-shadow-sm" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/80 shadow-rest">
                <Icon className="h-8 w-8" />
              </span>
            )}
            <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
            <p className="mt-1 flex-1 text-sm leading-5 text-ink-600">{body}</p>
            <Button to={disabled ? undefined : to} state={state} size="m" variant="primary" icon={ArrowRight} className={`mt-4 w-full ${visual?.styles?.primaryCta || 'bg-purple hover:bg-violet-700'}`} disabled={disabled} aria-label={title}>
              Go
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LowerPrimaryBanner() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-yellow-100 bg-gradient-to-r from-yellow-50 via-white to-emerald-50">
      <img
        src="/illustrations/banner-hills.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover object-left opacity-90 [mask-image:linear-gradient(to_right,transparent,black_35%)] sm:block"
      />
      <div className="relative px-6 py-5">
        <p className="font-display text-lg font-semibold text-emerald-deep">Small steps every day lead to big progress.</p>
        <p className="mt-1 text-sm font-medium text-ink-600">You've got this! 💪</p>
      </div>
    </div>
  );
}

// One diagnostic CTA per registered diagnostic domain (from the registry, not
// hardcoded). Each links to the diagnostic intro carrying its domainId.
function DiagnosticPrompts({ domains, containerClassName = '', containerStyle }) {
  const list = (domains && domains.length) ? domains : [{ domainId: 'fractions', displayName: 'Fractions' }];
  return (
    <div className={`space-y-3 ${containerClassName}`} style={containerStyle}>
      {list.map((d) => (
        <Card key={d.domainId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">Start your {d.displayName} Diagnostic to find your best starting point.</p>
          <Button to={`/student/mathpath/diagnostic?domain=${encodeURIComponent(d.domainId)}`} size="s" icon={ArrowRight}>Start Diagnostic</Button>
        </Card>
      ))}
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
    const metrics = buildUpperPrimaryMetricCards(dashboardAnalytics);
    const dashShadow = '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.05)';
    const monoFont = "'JetBrains Mono', ui-monospace, monospace";
    const dateNow = new Date();
    const dateLabel = `${['SUN','MON','TUE','WED','THU','FRI','SAT'][dateNow.getDay()]} ${dateNow.getDate()} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][dateNow.getMonth()]}`;
    const toggleCard = (k) => setExpandedCards((s) => ({ ...s, [k]: !s[k] }));

    const cBuckets = dashboardAnalytics.confidenceBuckets || {};
    const cIncorrect = Number(cBuckets.confidentIncorrect || 0);
    const cUnsureCorrect = Number(cBuckets.unsureCorrect || 0);
    const dashInsight = buildStudentInsight({
      correct: !cIncorrect,
      confidence: cIncorrect ? 'high' : cUnsureCorrect ? 'low' : 'high',
      occurrences: cIncorrect || cUnsureCorrect || Number(dashboardAnalytics.questionsAnswered || 0),
      skillName: vm.currentSkill?.skillName || 'your current skill',
      recommendedSkillName: vm.currentSkill?.skillName || 'your current skill',
      nextStep: vm.nextAction?.explanation || 'Continue with the recommended activity.',
      strongImprovement: Number(dashboardAnalytics.accuracyRate || 0) >= 80,
    });
    const insightSummary = cIncorrect > 0
      ? 'confident but answered incorrectly'
      : cUnsureCorrect > 0
        ? 'unsure but answered correctly'
        : 'confidence aligned with performance';
    const confidenceSubtitle = cIncorrect > 0 ? 'sure-but-slipped moments' : cUnsureCorrect > 0 ? 'unsure-but-correct moments' : null;

    const cardBase = {
      cursor: 'pointer', background: '#fff', borderRadius: 22,
      boxShadow: dashShadow, padding: '22px 24px',
      display: 'flex', flexDirection: 'column', minHeight: 196,
      transition: 'box-shadow .2s ease',
    };

    return (
      <main style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif", color: '#232c39', background: '#eef1f5', minHeight: '100vh', padding: '40px 36px 56px' }}>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" style={{ marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', color: '#1c2433' }}>
                Hi {firstName} {'—'} here's your week
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 12.5, color: '#8a93a3', marginTop: 4, letterSpacing: '0.02em' }}>
                Tap any card to see what it means
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canResetStudentState && (
                <Button size="s" variant="secondary" onClick={resetStudentState} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset'}
                </Button>
              )}
              <Button to="/student/profile" size="s" variant="secondary" icon={UserCircle}>Profile</Button>
              <span style={{ fontFamily: monoFont, fontSize: 11.5, color: '#aab2bf', letterSpacing: '0.06em' }}>{dateLabel}</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {/* Accuracy */}
            <div onClick={() => toggleCard('a')} style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e7f3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f8a5b' }}>
                  <Target size={23} />
                </div>
                <div style={{ color: '#1f8a5b', transition: 'transform .25s ease', transform: expandedCards.a ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1f8a5b' }}>
                Accuracy <span style={{ fontWeight: 500, color: '#5aa982' }}>(this week)</span>
              </div>
              <div style={{ fontSize: 46, fontWeight: 800, color: '#1c2433', lineHeight: 1.05, marginTop: 4 }}>{metrics.accuracy.value}</div>
              {expandedCards.a && (
                <div style={{ fontSize: 14.5, color: '#5a6675', lineHeight: 1.5, marginTop: 8 }}>{metrics.accuracy.body}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 46, marginTop: 'auto', paddingTop: 16 }}>
                {[24, 38, 30, 24, 42, 32, 46].map((h, i) => (
                  <span key={i} style={{ flex: 1, height: h, background: i % 2 === 0 ? '#bfe3cf' : '#57b389', borderRadius: '6px 6px 2px 2px' }} />
                ))}
              </div>
            </div>

            {/* Questions answered */}
            <div onClick={() => toggleCard('q')} style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fbf1e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d2812c' }}>
                  <ClipboardList size={22} />
                </div>
                <div style={{ color: '#d2812c', transition: 'transform .25s ease', transform: expandedCards.q ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#a8743a' }}>Questions answered</div>
              <div style={{ fontSize: 46, fontWeight: 800, color: '#1c2433', lineHeight: 1.05, marginTop: 4 }}>{metrics.questions.value}</div>
              {expandedCards.q && (
                <div style={{ fontSize: 14.5, color: '#5a6675', lineHeight: 1.5, marginTop: 8 }}>Across MathPath &amp; Word Problems this week.</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 46, marginTop: 'auto', paddingTop: 16 }}>
                {[16, 28, 22, 24, 36, 30, 34, 44, 30, 52].map((h, i) => (
                  <span key={i} style={{ flex: 1, height: h, background: i % 2 === 0 ? '#f1d6a3' : '#e3a64f', borderRadius: '5px 5px 2px 2px' }} />
                ))}
              </div>
            </div>

            {/* Working submitted */}
            <div onClick={() => toggleCard('w')} style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eaf3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2f80d8' }}>
                  <PenLine size={22} />
                </div>
                <div style={{ color: '#2f80d8', transition: 'transform .25s ease', transform: expandedCards.w ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f80d8' }}>Working submitted</div>
              <div style={{ fontSize: 46, fontWeight: 800, color: '#1c2433', lineHeight: 1.05, marginTop: 4 }}>{metrics.working.value}</div>
              {expandedCards.w && (
                <div style={{ fontSize: 14.5, color: '#5a6675', lineHeight: 1.5, marginTop: 8 }}>Keep showing your thinking {'—'} it helps your tutor help you.</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 46, marginTop: 'auto', paddingTop: 16 }}>
                {[26, 40, 32, 28, 44, 34, 30, 50].map((h, i) => (
                  <span key={i} style={{ flex: 1, height: h, background: i % 2 === 0 ? '#bcd6f5' : '#5a93e0', borderRadius: '6px 6px 2px 2px' }} />
                ))}
              </div>
            </div>

            {/* Confidence insight */}
            <div onClick={() => toggleCard('c')} style={{ ...cardBase, background: 'linear-gradient(160deg, #fdeef0, #fff6f7)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c0405a', boxShadow: '0 1px 3px rgba(192,64,90,0.18)' }}>
                  <Lightbulb size={22} />
                </div>
                <div style={{ color: '#c0405a', transition: 'transform .25s ease', transform: expandedCards.c ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#b23b54' }}>Confidence insight</div>
              <div style={{ fontSize: metrics.confidence.empty ? 18 : 46, fontWeight: 800, color: '#1c2433', lineHeight: 1.05, marginTop: 4 }}>
                {metrics.confidence.empty ? '—' : metrics.confidence.value}
              </div>
              {expandedCards.c && (
                <div style={{ fontSize: 14.5, color: '#7a4450', lineHeight: 1.5, marginTop: 8 }}>{metrics.confidence.body}</div>
              )}
              {!expandedCards.c && confidenceSubtitle && (
                <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 13, color: '#c98a96', fontWeight: 500 }}>{confidenceSubtitle}</div>
              )}
            </div>

          </div>

          {/* Learning Insight */}
          <div onClick={() => toggleCard('li')} style={{ cursor: 'pointer', background: '#fff', borderRadius: 22, boxShadow: dashShadow, padding: '24px 28px', marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#2f80d8' }}>Learning insight</span>
                {!expandedCards.li && (
                  <span style={{ fontSize: 14, color: '#8a93a3' }}>{'·'} {insightSummary}</span>
                )}
              </div>
              <div style={{ color: '#2f80d8', transition: 'transform .25s ease', transform: expandedCards.li ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                <ChevronRight size={20} />
              </div>
            </div>
            {expandedCards.li && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3" style={{ marginTop: 22 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c2433', marginBottom: 7 }}>Observation</div>
                  <div style={{ fontSize: 15, color: '#5a6675', lineHeight: 1.6 }}>{dashInsight.observation}</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c2433', marginBottom: 7 }}>What it means</div>
                  <div style={{ fontSize: 15, color: '#5a6675', lineHeight: 1.6 }}>{dashInsight.interpretation}</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c2433', marginBottom: 7 }}>Next step</div>
                  <div style={{ fontSize: 15, color: '#5a6675', lineHeight: 1.6 }}>{dashInsight.nextStep}</div>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Next */}
          <div style={{ marginTop: 24 }}>
            <UpperPrimaryRecommendedNext currentSkill={vm.currentSkill} nextAction={vm.nextAction} hasPlacement={vm.hasPlacement} masteredSkillCount={safeMasteredCount} />
          </div>

          {FEATURE_FLAGS.comics && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#fef3c7' }}>
                  <BookOpen className="h-5 w-5" style={{ color: '#d97706' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Tian 7 Chronicles</p>
                  <p className="text-xs text-ink-500">Comic word problems with Kylo &amp; friends</p>
                </div>
                <Button to="/student/comics" size="s" icon={ArrowRight}>Read</Button>
              </Card>
            </div>
          )}

          {FEATURE_FLAGS.psl && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100">
                  <Brain className="h-5 w-5 text-gold-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Problem Solving Lab</p>
                  <p className="text-xs text-ink-500">Learn to solve word problems step by step</p>
                </div>
                <Button to="/student/psl" size="s" icon={ArrowRight}>Start</Button>
              </Card>
            </div>
          )}

          {FEATURE_FLAGS.decimals && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-tint">
                  <Calculator className="h-5 w-5 text-emerald" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Decimals</p>
                  <p className="text-xs text-ink-500">Place value, operations and measurement (P4–P6)</p>
                </div>
                <Button to="/student/mathpath/decimals" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}

          {FEATURE_FLAGS.percentages && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint">
                  <Percent className="h-5 w-5 text-purple" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Percentage</p>
                  <p className="text-xs text-ink-500">Per hundred, conversions, discount, GST and interest (P5–P6)</p>
                </div>
                <Button to="/student/mathpath/percentages" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}

          {FEATURE_FLAGS.ratioRate && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                  <Scale className="h-5 w-5 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Ratio &amp; Rate</p>
                  <p className="text-xs text-ink-500">Equivalent ratios, dividing in a ratio, speed and direct proportion (P5–P6)</p>
                </div>
                <Button to="/student/mathpath/ratio-rate" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.operations && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Calculator className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Operations</p>
                  <p className="text-xs text-ink-500">Add, subtract, multiply &amp; divide (P1–P4)</p>
                </div>
                <Button to="/student/mathpath/operations" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.numberSense && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                  <Hash className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Number Sense</p>
                  <p className="text-xs text-ink-500">Place value, rounding &amp; patterns (P1–P4)</p>
                </div>
                <Button to="/student/mathpath/number-sense" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.money && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Money</p>
                  <p className="text-xs text-ink-500">Dollars, cents &amp; everyday calculations (P1–P4)</p>
                </div>
                <Button to="/student/mathpath/money" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.timeDomain && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                  <Clock className="h-5 w-5 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Time</p>
                  <p className="text-xs text-ink-500">Clock, calendar &amp; duration (P1–P4)</p>
                </div>
                <Button to="/student/mathpath/time" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.measurement && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Ruler className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Measurement</p>
                  <p className="text-xs text-ink-500">Length, mass and capacity (P2–P5)</p>
                </div>
                <Button to="/student/mathpath/measurement" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.geometry && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <Triangle className="h-5 w-5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Geometry</p>
                  <p className="text-xs text-ink-500">Angles, shapes &amp; properties (P3–P6)</p>
                </div>
                <Button to="/student/mathpath/geometry" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.areaPerimeter && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                  <Square className="h-5 w-5 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Area &amp; Perimeter</p>
                  <p className="text-xs text-ink-500">Rectilinear and composite figures (P3–P6)</p>
                </div>
                <Button to="/student/mathpath/area-perimeter" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.circles && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100">
                  <Circle className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Circles</p>
                  <p className="text-xs text-ink-500">Circumference, area and composite shapes (P5–P6)</p>
                </div>
                <Button to="/student/mathpath/circles" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.volume && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100">
                  <Box className="h-5 w-5 text-lime-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Volume &amp; Capacity</p>
                  <p className="text-xs text-ink-500">Cuboids and liquid volume (P4–P6)</p>
                </div>
                <Button to="/student/mathpath/volume" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.statistics && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <BarChart2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Statistics</p>
                  <p className="text-xs text-ink-500">Charts, tables and averages (P3–P6)</p>
                </div>
                <Button to="/student/mathpath/statistics" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}
          {FEATURE_FLAGS.algebra && (
            <div style={{ marginTop: 20 }}>
              <Card className="flex items-center gap-4 p-4" interactive>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100">
                  <Sigma className="h-5 w-5 text-fuchsia-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">Algebra</p>
                  <p className="text-xs text-ink-500">Equations, unknowns &amp; patterns (P5–P6)</p>
                </div>
                <Button to="/student/mathpath/algebra" size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            </div>
          )}

          {showDiagnosticPrompt && (
            <DiagnosticPrompts domains={diagnosticDomains} containerStyle={{ marginTop: 20 }} />
          )}
          {hasOtherWarnings && !showDiagnosticPrompt && (
            <div style={{ marginTop: 20 }}>
              <Card className="p-4">
                <p className="text-sm text-ink-500">
                  Some advanced metrics are based on limited history and will fill in as you complete more practice, fluency, and assessments.
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (isLowerPrimary(visual.mode)) {
    const bp = brainPower(displayXp);
    return (
      <main className={`${visual.styles.page} space-y-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink-500">Hi, {firstName}! <span aria-hidden>👋</span></p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-ink-900">
              <span className="relative inline-block">
                Today's Plan
                <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-gold-300/80" aria-hidden />
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden items-center gap-2 rounded-full border border-sky-100 bg-white/90 py-2 pl-2 pr-4 shadow-rest sm:flex">
              <img src="/illustrations/mascot-star.png" alt="" aria-hidden="true" className="h-12 w-12 shrink-0 object-contain drop-shadow-sm" />
              <span className="text-sm font-semibold text-emerald-deep">Let's go! 💪</span>
              <span className="absolute -bottom-3 -right-2 rotate-6 rounded-lg border border-gold-200 bg-tianYellow px-2 py-0.5 text-[11px] font-semibold text-gold-700 shadow-rest">You've got this!</span>
            </div>
            {canResetStudentState && (
              <Button size="s" variant="secondary" onClick={resetStudentState} disabled={resetting}>
                {resetting ? 'Resetting...' : 'Reset Demo Student'}
              </Button>
            )}
            <Button to="/student/profile" size="m" variant="secondary" icon={UserCircle}>
              Profile
            </Button>
          </div>
        </div>

        <TodaysMissionCard
          currentSkill={vm.currentSkill}
          nextAction={vm.nextAction}
          hasPlacement={vm.hasPlacement}
          visual={visual}
          assessmentReady={assessmentGate.ready}
        />

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <LowerPrimaryStatCard img="/illustrations/icon-trophy.png" label="Skills Mastered" value={`${safeMasteredCount}/${totalSkills}`} subtitle="Amazing progress!" tone="success" />
          <LowerPrimaryStatCard img="/illustrations/icon-flame.png" label="Current Streak" value={streakLabel} subtitle={displayStreak > 0 ? "Keep it up! You're on fire! 🔥" : 'Start your streak today!'} tone="gold" />
          <LowerPrimaryStatCard img="/illustrations/icon-gem.png" label="Learning XP" value={displayXp} subtitle="Keep learning to earn more!" tone="sky" />
          <LowerPrimaryStatCard img="/illustrations/icon-brain.png" label="Brain Power" value={`Level ${bp.level}`} caption={`${bp.into}/${bp.perLevel} XP`} progress={bp.percent} tone="rose" />
        </section>

        <LowerPrimaryRecommendedNext
          currentSkill={vm.currentSkill}
          nextAction={vm.nextAction}
          hasPlacement={vm.hasPlacement}
          masteredSkillCount={safeMasteredCount}
          visual={visual}
        />

        <LowerPrimaryBanner />

        {FEATURE_FLAGS.decimals && (
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
        {FEATURE_FLAGS.timeDomain && (
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <Card className="flex items-center gap-4 p-4" interactive>
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
          <DiagnosticPrompts domains={diagnosticDomains} />
        )}
      </main>
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
            <p className="text-xs text-ink-500">Comic word problems with Kylo &amp; friends</p>
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
      {FEATURE_FLAGS.timeDomain && (
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
