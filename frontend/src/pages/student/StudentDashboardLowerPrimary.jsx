import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Box,
  Brain,
  Calculator,
  ChevronDown,
  Circle,
  Clock,
  Compass,
  DollarSign,
  Hash,
  Percent,
  Ruler,
  Scale,
  Search,
  Sigma,
  Sparkles,
  Square,
  Timer,
  Triangle,
  UserCircle,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
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

function LowerPrimaryRecommendedNext({ currentSkill, nextAction, hasPlacement, masteredSkillCount = 0, visual, studentLevel, isKindergarten }) {
  // Brand-new students shouldn't see "Pick up where you left off" — only treat
  // them as returning when there's a real skill name to point at.
  const isReturning = hasPlacement && Boolean(currentSkill?.skillName);
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
  const sl = String(studentLevel || '').toLowerCase().trim();
  const isK2 = /k2|kindy|preschool|kindergarten/.test(sl);
  const isP1 = sl === 'primary 1' || sl === 'p1';
  // K2 → gentle Numeracy Explore (no diagnostic); P1 → Operations check-in; else Fractions.
  const noPlacementRoute = isK2
    ? '/student/mathpath/early-numeracy'
    : isP1 ? '/student/mathpath/operations/diagnostic' : '/student/mathpath/diagnostic';
  const cards = [
    {
      icon: BookOpen,
      img: '/illustrations/icon-book.png',
      // For lower-primary students keep the language gentle: a younger learner
      // is more reassured by "Start" than "Take Your Check-In".
      title: isReturning ? 'Continue Learning' : 'Start Maths',
      body: isReturning ? currentSkill.skillName : "We'll find a fun place to start.",
      to: isReturning ? action.to : noPlacementRoute,
      state: isReturning && action.to?.startsWith('/student/mathpath/practice/') ? continueState : undefined,
      tone: 'border-emerald-100 from-emerald-50 to-white text-emerald-600',
      disabled: isReturning ? action.disabled : false,
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
    // PSL is designed for P3+ — hide for kindergarten students
    ...(!isKindergarten && FEATURE_FLAGS.psl ? [{
      icon: Brain,
      img: null,
      title: 'Word Problems',
      body: 'Solve word problems step by step',
      to: '/student/psl',
      tone: 'border-gold-tint from-gold-tint2 to-white text-gold-deep',
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

function DiagnosticPrompts({ domains, level, containerClassName = '', containerStyle }) {
  const year = Number(String(level || '').match(/\d/)?.[0] || 0);
  const fallback = year <= 2 ? { domainId: 'whole-numbers', displayName: 'Whole Numbers' } : { domainId: 'fractions', displayName: 'Fractions' };
  const list = (domains && domains.length) ? domains : [fallback];
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

function levelToYear(level = '') {
  const s = String(level).toLowerCase().trim();
  if (/k2|kindy|preschool|kindergarten/.test(s)) return 0;
  const m = s.match(/\d+/);
  return m ? Math.min(6, Math.max(0, parseInt(m[0], 10))) : 1;
}

const LEVEL_LABELS = ['K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

// The two halves of the gentle K2 Early Numeracy track (counting/numbers vs
// part-whole & within-10 +/−). Both deep-link into the same early-numeracy
// Explore track at a representative starting skill — NOT the P1-level
// number-sense/operations domains (which K2 is no longer pushed into).
const K2_TILES = [
  {
    label: 'Count & Numbers',
    desc: 'Count to 10, more or fewer',
    to: '/student/mathpath/early-numeracy/practice?skill=EN001',
    Icon: Hash,
    colorClass: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    textColor: 'text-indigo-800',
    subColor: 'text-indigo-500',
  },
  {
    label: 'Add & Take Away',
    desc: 'Put together & take away, within 10',
    to: '/student/mathpath/early-numeracy/practice?skill=EN007',
    Icon: Calculator,
    colorClass: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    textColor: 'text-orange-800',
    subColor: 'text-orange-500',
  },
];

function K2TopicsView({ visibleDomains }) {
  const [showExplore, setShowExplore] = useState(false);

  return (
    <section>
      <div className="space-y-3">
        {K2_TILES.map(({ label, desc, to, Icon, colorClass, iconBg, iconColor, textColor, subColor }) => (
          <Card key={to} className={`flex items-center gap-4 border p-4 ${colorClass}`} interactive>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-base font-semibold ${textColor}`}>{label}</p>
              <p className={`text-sm ${subColor}`}>{desc}</p>
            </div>
            <Button to={to} size="s" icon={ArrowRight}>Start</Button>
          </Card>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowExplore((v) => !v)}
        className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-ink-200 px-4 py-3 text-sm font-medium text-ink-500 transition hover:border-ink-300 hover:bg-surface-raised"
      >
        <span className="flex items-center gap-2">
          <Compass className="h-4 w-4 shrink-0" />
          {showExplore ? 'Hide extra topics' : 'Explore more topics'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showExplore ? 'rotate-180' : ''}`} />
      </button>

      {showExplore && (
        <div className="mt-3 space-y-2">
          {visibleDomains.map(({ label, desc, to, Icon, bg, iconColor, minYear }) => {
            const opacity = minYear <= 1 ? 0.7 : minYear <= 2 ? 0.5 : 0.3;
            return (
              <Card key={to} className="flex items-center gap-4 p-4" interactive style={{ opacity }}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">{label}</p>
                  <p className="text-xs text-ink-500">{desc}</p>
                </div>
                <Button to={to} size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

const DOMAIN_LIST = [
  { flag: 'earlyNumeracy', minYear: 0, maxYear: 1, label: 'Numeracy',          desc: 'Counting, comparing & number bonds',       to: '/student/mathpath/early-numeracy', bg: 'bg-pink-100',      iconColor: 'text-pink-600',     Icon: Sparkles },
  { flag: 'operations',    minYear: 1, maxYear: 6, label: 'Operations',        desc: 'Add, subtract, multiply & divide',        to: '/student/mathpath/operations',     bg: 'bg-orange-100',    iconColor: 'text-orange-600',   Icon: Calculator },
  { flag: 'numberSense',   minYear: 1, maxYear: 4, label: 'Number Sense',      desc: 'Place value, counting & patterns',         to: '/student/mathpath/number-sense',   bg: 'bg-indigo-100',    iconColor: 'text-indigo-600',   Icon: Hash },
  { flag: 'mathpath',      minYear: 2, maxYear: 6, label: 'Fractions',         desc: 'Equivalent fractions, +−×÷ (P2–P6)',      to: '/student/mathpath/fractions',      bg: 'bg-emerald-tint',  iconColor: 'text-emerald',      Icon: BookOpen },
  { flag: 'money',         minYear: 1, maxYear: 4, label: 'Money',             desc: 'Dollars, cents & everyday calculations',   to: '/student/mathpath/money',          bg: 'bg-green-100',     iconColor: 'text-green-600',    Icon: DollarSign },
  { flag: 'time',          minYear: 1, maxYear: 5, label: 'Time',              desc: 'Clock, calendar & duration',               to: '/student/mathpath/time',           bg: 'bg-sky-100',       iconColor: 'text-sky-600',      Icon: Clock },
  { flag: 'measurement',   minYear: 2, maxYear: 6, label: 'Measurement',       desc: 'Length, mass and capacity',                to: '/student/mathpath/measurement',    bg: 'bg-amber-100',     iconColor: 'text-amber-600',    Icon: Ruler },
  { flag: 'geometry',      minYear: 1, maxYear: 6, label: 'Geometry',          desc: 'Angles, shapes & properties',              to: '/student/mathpath/geometry',       bg: 'bg-violet-100',    iconColor: 'text-violet-600',   Icon: Triangle },
  { flag: 'statistics',    minYear: 2, maxYear: 6, label: 'Statistics',        desc: 'Charts, tables and averages',              to: '/student/mathpath/statistics',     bg: 'bg-blue-100',      iconColor: 'text-blue-600',     Icon: BarChart2 },
  { flag: 'areaPerimeter', minYear: 3, maxYear: 6, label: 'Area & Perimeter',  desc: 'Rectilinear & composite figures',          to: '/student/mathpath/area-perimeter', bg: 'bg-rose-100',      iconColor: 'text-rose-600',     Icon: Square },
  { flag: 'decimals',      minYear: 4, maxYear: 6, label: 'Decimals',          desc: 'Place value, operations & measurement',    to: '/student/mathpath/decimals',       bg: 'bg-emerald-tint',  iconColor: 'text-emerald',      Icon: Calculator },
  { flag: 'volume',        minYear: 4, maxYear: 6, label: 'Volume & Capacity', desc: 'Cuboids and liquid volume',                to: '/student/mathpath/volume',         bg: 'bg-lime-100',      iconColor: 'text-lime-600',     Icon: Box },
  { flag: 'percentages',   minYear: 5, maxYear: 6, label: 'Percentage',        desc: 'Per hundred, conversions, discount, GST',  to: '/student/mathpath/percentages',    bg: 'bg-purple-tint',   iconColor: 'text-purple',       Icon: Percent },
  { flag: 'ratioRate',     minYear: 5, maxYear: 6, label: 'Ratio & Rate',      desc: 'Equivalent ratios, speed & proportion',    to: '/student/mathpath/ratio-rate',     bg: 'bg-teal-100',      iconColor: 'text-teal-600',     Icon: Scale },
  { flag: 'algebra',       minYear: 5, maxYear: 6, label: 'Algebra',           desc: 'Equations, unknowns & patterns',           to: '/student/mathpath/algebra',        bg: 'bg-fuchsia-100',   iconColor: 'text-fuchsia-600',  Icon: Sigma },
  { flag: 'circles',       minYear: 6, maxYear: 6, label: 'Circles',           desc: 'Circumference, area & composite shapes',   to: '/student/mathpath/circles',        bg: 'bg-cyan-100',      iconColor: 'text-cyan-600',     Icon: Circle },
];

export default function StudentDashboardLowerPrimary({
  TodaysMissionCard,
  firstName,
  vm,
  visual,
  assessmentGate,
  safeMasteredCount,
  totalSkills,
  streakLabel,
  displayStreak,
  displayXp,
  showDiagnosticPrompt,
  diagnosticDomains,
  studentLevel,
  canResetStudentState,
  resetStudentState,
  resetting,
}) {
  const bp = brainPower(displayXp);
  const [selectedLevel, setSelectedLevel] = useState(() => levelToYear(studentLevel));
  const isKindergarten = selectedLevel === 0;
  const visibleDomains = DOMAIN_LIST.filter(
    (d) => FEATURE_FLAGS[d.flag] !== false && selectedLevel >= d.minYear && selectedLevel <= d.maxYear,
  );
  // For the K2 explore panel, show all domains beyond K2 sorted by minYear ascending
  const exploreDomains = DOMAIN_LIST.filter(
    (d) => FEATURE_FLAGS[d.flag] !== false && d.minYear > 0,
  );
  return (
    <main className={`${visual.styles.page} space-y-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink-500">Hi, {firstName}! <span aria-hidden>👋</span></p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-ink-900">
            <span className="relative inline-block">
              Today's Plan
              <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-gold-border/80" aria-hidden />
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden items-center gap-2 rounded-full border border-sky-100 bg-white/90 py-2 pl-2 pr-4 shadow-rest sm:flex">
            <img src="/illustrations/mascot-star.png" alt="" aria-hidden="true" className="h-12 w-12 shrink-0 object-contain drop-shadow-sm" />
            <span className="text-sm font-semibold text-emerald-deep">Let's go! 💪</span>
            <span className="absolute -bottom-3 -right-2 rotate-6 rounded-lg border border-gold-tint bg-tianYellow px-2 py-0.5 text-[11px] font-semibold text-gold-deep shadow-rest">You've got this!</span>
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
        studentLevel={studentLevel}
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
        studentLevel={studentLevel}
        isKindergarten={isKindergarten}
      />

      <LowerPrimaryBanner />

      {isKindergarten ? (
        <K2TopicsView visibleDomains={exploreDomains} />
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm font-semibold text-ink-600">Topics for:</span>
            {LEVEL_LABELS.map((label, yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedLevel(yr)}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${selectedLevel === yr ? 'bg-emerald text-white shadow-sm' : 'bg-surface-raised text-ink-600 hover:bg-emerald-tint'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {visibleDomains.length === 0 && (
            <p className="text-sm text-ink-400">No topics for this level yet.</p>
          )}
          <div className="space-y-2">
            {visibleDomains.map(({ label, desc, to, Icon, bg, iconColor }) => (
              <Card key={to} className="flex items-center gap-4 p-4" interactive>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">{label}</p>
                  <p className="text-xs text-ink-500">{desc}</p>
                </div>
                <Button to={to} size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {showDiagnosticPrompt && (
        <DiagnosticPrompts domains={diagnosticDomains} level={studentLevel} />
      )}
    </main>
  );
}
