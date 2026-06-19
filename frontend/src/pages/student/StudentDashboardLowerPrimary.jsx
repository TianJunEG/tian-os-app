import React from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Box,
  Brain,
  Calculator,
  Circle,
  Clock,
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
  canResetStudentState,
  resetStudentState,
  resetting,
}) {
  const bp = brainPower(displayXp);
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
