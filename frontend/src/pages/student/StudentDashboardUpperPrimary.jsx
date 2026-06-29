import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Box,
  Brain,
  Calculator,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock,
  Divide,
  DollarSign,
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
  Target,
  Timer,
  Triangle,
  UserCircle,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { buildStudentInsight, interpretConfidence } from '../../mathpath/insights/insightQualityEngine';
import {
  ASSESSMENT_LOCK_MESSAGE,
  getFractionAssessmentBlueprintReadiness,
} from '../../mathpath/fractions/fractionAssessmentReadinessGate';
import FEATURE_FLAGS from '../../config/featureFlags';
import { getLatestEpisode } from '../../data/comics/episodes';

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
    return { value: confidentIncorrect, caption: 'times you felt sure but slipped', body: insight.student, empty: false };
  }
  if (unsureCorrect > 0) {
    const insight = interpretConfidence({ correct: true, confidence: 'low' });
    return { value: unsureCorrect, caption: 'times you were right but unsure', body: insight.student, empty: false };
  }
  return {
    value: Number(buckets.confidentCorrect || 0),
    caption: 'answers you felt sure about — and got right',
    body: 'Confidence looks aligned with recent answers.',
    empty: false,
  };
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

function UpperPrimaryRecommendedNext({ currentSkill, nextAction, hasPlacement, masteredSkillCount = 0 }) {
  // A student is only "returning" when there's a real skill name to point at.
  // Without this, brand-new students saw the misleading "Pick up where you
  // left off" body even though they had nothing to continue.
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
  const cards = [
    {
      icon: BookOpen,
      // Route brand-new students to the MathPath home (domain grid) so they
      // pick a topic — never auto-funnel them into the fractions check-in.
      title: isReturning ? 'Continue Learning' : 'Start MathPath',
      body: isReturning ? currentSkill.skillName : 'Pick a topic to begin.',
      to: isReturning ? action.to : '/student/mathpath',
      state: isReturning && action.to?.startsWith('/student/mathpath/practice/') ? continueState : undefined,
      tone: 'from-emerald-50 to-white text-emerald-700',
      disabled: isReturning ? action.disabled : false,
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

function levelToYear(level = '') {
  const s = String(level).toLowerCase().trim();
  if (/k2|kindy|preschool|kindergarten/.test(s)) return 0;
  const m = s.match(/\d+/);
  return m ? Math.min(6, Math.max(0, parseInt(m[0], 10))) : 4;
}

const LEVEL_LABELS = ['K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

const UP_DOMAIN_LIST = [
  { flag: 'operations',    minYear: 0, maxYear: 6, label: 'Operations',        desc: 'Add, subtract, multiply & divide',                     to: '/student/mathpath/operations',     iconBg: 'bg-orange-100',   iconText: 'text-orange-600',   Icon: Calculator },
  { flag: 'numberSense',   minYear: 0, maxYear: 4, label: 'Number Sense',      desc: 'Place value, rounding & patterns',                     to: '/student/mathpath/number-sense',   iconBg: 'bg-indigo-100',   iconText: 'text-indigo-600',   Icon: Hash },
  { flag: 'mathpath',      minYear: 2, maxYear: 6, label: 'Fractions',         desc: 'Equivalent fractions, mixed numbers & division',       to: '/student/mathpath',                iconBg: 'bg-emerald-100',  iconText: 'text-emerald-700',  Icon: Divide },
  { flag: 'money',         minYear: 1, maxYear: 4, label: 'Money',             desc: 'Dollars, cents & everyday calculations',               to: '/student/mathpath/money',          iconBg: 'bg-green-100',    iconText: 'text-green-600',    Icon: DollarSign },
  { flag: 'time',          minYear: 1, maxYear: 5, label: 'Time',              desc: 'Clock, calendar & duration',                           to: '/student/mathpath/time',           iconBg: 'bg-sky-100',      iconText: 'text-sky-600',      Icon: Clock },
  { flag: 'measurement',   minYear: 2, maxYear: 6, label: 'Measurement',       desc: 'Length, mass and capacity',                            to: '/student/mathpath/measurement',    iconBg: 'bg-amber-100',    iconText: 'text-amber-600',    Icon: Ruler },
  { flag: 'geometry',      minYear: 1, maxYear: 6, label: 'Geometry',          desc: 'Angles, shapes & properties',                          to: '/student/mathpath/geometry',       iconBg: 'bg-violet-100',   iconText: 'text-violet-600',   Icon: Triangle },
  { flag: 'statistics',    minYear: 2, maxYear: 6, label: 'Statistics',        desc: 'Charts, tables and averages',                          to: '/student/mathpath/statistics',     iconBg: 'bg-blue-100',     iconText: 'text-blue-600',     Icon: BarChart2 },
  { flag: 'areaPerimeter', minYear: 3, maxYear: 6, label: 'Area & Perimeter',  desc: 'Rectilinear and composite figures',                    to: '/student/mathpath/area-perimeter', iconBg: 'bg-rose-100',     iconText: 'text-rose-600',     Icon: Square },
  { flag: 'decimals',      minYear: 4, maxYear: 6, label: 'Decimals',          desc: 'Place value, operations and measurement',              to: '/student/mathpath/decimals',       iconBg: 'bg-emerald-tint', iconText: 'text-emerald',      Icon: Calculator },
  { flag: 'volume',        minYear: 4, maxYear: 6, label: 'Volume & Capacity', desc: 'Cuboids and liquid volume',                            to: '/student/mathpath/volume',         iconBg: 'bg-lime-100',     iconText: 'text-lime-600',     Icon: Box },
  { flag: 'percentages',   minYear: 5, maxYear: 6, label: 'Percentage',        desc: 'Per hundred, conversions, discount, GST and interest', to: '/student/mathpath/percentages',    iconBg: 'bg-purple-tint',  iconText: 'text-purple',       Icon: Percent },
  { flag: 'ratioRate',     minYear: 5, maxYear: 6, label: 'Ratio & Rate',      desc: 'Equivalent ratios, speed and direct proportion',       to: '/student/mathpath/ratio-rate',     iconBg: 'bg-teal-100',     iconText: 'text-teal-600',     Icon: Scale },
  { flag: 'algebra',       minYear: 5, maxYear: 6, label: 'Algebra',           desc: 'Equations, unknowns & patterns',                       to: '/student/mathpath/algebra',        iconBg: 'bg-fuchsia-100',  iconText: 'text-fuchsia-600',  Icon: Sigma },
  { flag: 'circles',       minYear: 6, maxYear: 6, label: 'Circles',           desc: 'Circumference, area and composite shapes',             to: '/student/mathpath/circles',        iconBg: 'bg-cyan-100',     iconText: 'text-cyan-600',     Icon: Circle },
];

export default function StudentDashboardUpperPrimary({
  firstName,
  vm,
  dashboardAnalytics,
  safeMasteredCount,
  showDiagnosticPrompt,
  diagnosticDomains,
  studentLevel,
  canResetStudentState,
  resetStudentState,
  resetting,
  expandedCards,
  setExpandedCards,
  hasOtherWarnings,
}) {
  const [selectedLevel, setSelectedLevel] = useState(() => levelToYear(studentLevel));
  const visibleDomains = UP_DOMAIN_LIST.filter((d) => FEATURE_FLAGS[d.flag] !== false && selectedLevel >= d.minYear && selectedLevel <= d.maxYear);

  const metrics = buildUpperPrimaryMetricCards(dashboardAnalytics);
  const dashShadow = '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.05)';
  const monoFont = "'JetBrains Mono', ui-monospace, monospace";
  const dateNow = new Date();
  const dateLabel = `${['SUN','MON','TUE','WED','THU','FRI','SAT'][dateNow.getDay()]} ${dateNow.getDate()} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][dateNow.getMonth()]}`;
  const toggleCard = (k) => setExpandedCards((s) => ({ ...s, [k]: !s[k] }));

  const cBuckets = dashboardAnalytics.confidenceBuckets || {};
  const cIncorrect = Number(cBuckets.confidentIncorrect || 0);
  const cUnsureCorrect = Number(cBuckets.unsureCorrect || 0);
  // Without any confidence-rated answers the engine has no signal — building
  // an "insight" from bare questionsAnswered fabricates patterns. Gate so the
  // insight is only used when there's real data; the card render checks this.
  const cSampleSize = Number(dashboardAnalytics.confidenceSampleSize ?? 0)
    || Object.values(cBuckets).reduce((sum, v) => sum + Number(v || 0), 0);
  const dashInsight = cSampleSize ? buildStudentInsight({
    correct: !cIncorrect,
    confidence: cIncorrect ? 'high' : cUnsureCorrect ? 'low' : 'high',
    occurrences: cIncorrect || cUnsureCorrect || cSampleSize,
    skillName: vm.currentSkill?.skillName || 'your current skill',
    recommendedSkillName: vm.currentSkill?.skillName || 'your current skill',
    nextStep: vm.nextAction?.explanation || 'Continue with the recommended activity.',
    strongImprovement: Number(dashboardAnalytics.accuracyRate || 0) >= 80,
  }) : null;
  const insightSummary = !cSampleSize
    ? 'building your confidence picture'
    : cIncorrect > 0
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
            {!expandedCards.a && !metrics.accuracy.empty && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 46, marginTop: 'auto', paddingTop: 16 }}>
                <span style={{ flex: 1, height: Math.max(4, Math.round(Number(dashboardAnalytics?.accuracyRate || 0) * 0.46)), background: '#57b389', borderRadius: '6px 6px 2px 2px' }} />
                <span style={{ flex: 1, height: 4, background: '#bfe3cf', borderRadius: '6px 6px 2px 2px', opacity: 0.5 }} />
              </div>
            )}
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
            {!expandedCards.q && !metrics.questions.empty && (
              <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 12, color: '#a8743a', fontWeight: 500 }}>
                This week
              </div>
            )}
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
            {!expandedCards.w && !metrics.working.empty && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 46, marginTop: 'auto', paddingTop: 16 }}>
                <span style={{ flex: 1, height: Math.max(4, Math.round(Number(dashboardAnalytics?.workingSubmissionRate || 0) * 0.46)), background: '#5a93e0', borderRadius: '6px 6px 2px 2px' }} />
                <span style={{ flex: 1, height: 4, background: '#bcd6f5', borderRadius: '6px 6px 2px 2px', opacity: 0.5 }} />
              </div>
            )}
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
            {!metrics.confidence.empty && metrics.confidence.caption && (
              <div style={{ fontSize: 13, color: '#a8616f', fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{metrics.confidence.caption}</div>
            )}
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
          {expandedCards.li && (dashInsight ? (
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
          ) : (
            <div style={{ marginTop: 22, fontSize: 15, color: '#5a6675', lineHeight: 1.6 }}>
              Complete a few questions to unlock your first insight — it’ll show where you’re confident and where to focus next.
            </div>
          ))}
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
                <p className="text-xs text-ink-500 truncate">
                  {getLatestEpisode() ? `New: Ep ${getLatestEpisode().episode} — ${getLatestEpisode().title}` : 'Comic word problems with Kylo & friends'}
                </p>
              </div>
              <Button to="/student/comics" size="s" icon={ArrowRight}>Read</Button>
            </Card>
          </div>
        )}

        {FEATURE_FLAGS.psl && (
          <div style={{ marginTop: 20 }}>
            <Card className="flex items-center gap-4 p-4" interactive>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-tint">
                <Brain className="h-5 w-5 text-gold-deep" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-700">Problem Solving Lab</p>
                <p className="text-xs text-ink-500">Learn to solve word problems step by step</p>
              </div>
              <Button to="/student/psl" size="s" icon={ArrowRight}>Start</Button>
            </Card>
          </div>
        )}

        {/* Domain list with level switcher */}
        <div style={{ marginTop: 24 }}>
          <div className="mb-3 flex flex-wrap gap-2">
            {LEVEL_LABELS.map((lbl, i) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setSelectedLevel(i)}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${selectedLevel === i ? 'bg-navy-600 text-white' : 'bg-surface-raised text-ink-600 hover:bg-navy-50'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
          {visibleDomains.length === 0 && (
            <p className="text-sm text-ink-400">No topics available for this level.</p>
          )}
          <div className="space-y-3">
            {visibleDomains.map((d) => (
              <Card key={d.flag} className="flex items-center gap-4 p-4" interactive>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${d.iconBg}`}>
                  <d.Icon className={`h-5 w-5 ${d.iconText}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-700">{d.label}</p>
                  <p className="text-xs text-ink-500">{d.desc}</p>
                </div>
                <Button to={d.to} size="s" icon={ArrowRight}>Explore</Button>
              </Card>
            ))}
          </div>
        </div>

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
