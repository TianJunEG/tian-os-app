import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, FileText, Flame, Target, Upload, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge, ErrorState, PageHeader, Spinner, CollapsibleSection } from '../../components/ui';
import FEATURE_FLAGS from '../../config/featureFlags';
import ChildNav from './ChildNav';
import { useChild } from './useChild';
import { mathpathAPI, parentsAPI } from '../../services/api';
import AdultWorkingReviewPanel from '../../components/mathpath/working/AdultWorkingReviewPanel';
import { buildParentInsight } from '../../mathpath/insights/insightQualityEngine';
import { buildMascotNarration } from '../../mathpath/dashboard/parentMascotNarration';
import { MascotBubble } from '../../components/MascotAvatar';
import DiagnosticGrowthCard from '../../components/mathpath/DiagnosticGrowthCard';

function statusTone(status) {
  if (status === 'advanced') return 'success';
  if (status === 'strong') return 'navy';
  if (status === 'onTrack') return 'gold';
  if (status === 'developing') return 'neutral';
  return 'error';
}

function toTitle(status) {
  if (!status) return 'Developing';
  return String(status).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function toCount(value) {
  return Array.isArray(value) ? value.length : 0;
}

function asPercent(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && value.find((item) => typeof item === 'string' && item.trim())) {
      return value.find((item) => typeof item === 'string' && item.trim()).trim();
    }
  }
  return '';
}

function inferConfidence(summary = {}) {
  const raw = String(summary.masteryProgress?.confidenceBand || '').toLowerCase();
  if (raw.includes('low')) return 'Low';
  if (raw.includes('medium') || raw.includes('moderate')) return 'Medium';
  if (raw.includes('high')) return 'High';
  return 'High';
}

// Build the "what to know right now" snapshot from the unified dashboard
// payload. Domain-generic: there are no fraction-specific defaults — names,
// counts, and the focus skill all come from the payload for whatever domain is
// selected. `domainNoun` only flavours copy (e.g. the Chelya narration).
function deriveParentSnapshot(summary = {}, child = null, domainNoun = 'fraction') {
  const mastery = summary.masteryProgress || {};
  const recommended = summary.recommendedNextPractice || {};
  const attentionSkillId = recommended.skillId || '';
  const weakSkill = firstText(
    recommended.skillName,
    summary.currentWeaknesses,
    mastery.weakSkills,
  ) || `your next ${domainNoun} skill`;
  const currentFocus = firstText(
    summary.weeklyActionPlan?.weekFocus,
    mastery.inProgressSkills,
  ) || weakSkill;
  const mastered = toCount(mastery.masteredSkills);
  const total = Number(mastery.totalSkills || 0);
  const masteryPercent = asPercent(mastery.percentageMastered, total ? Math.round((mastered / total) * 100) : 0);
  // No domain-wide assessment in this read path yet; mastery % is the best
  // available accuracy proxy.
  const accuracy = masteryPercent;
  const streak = Number(child?.currentStreak || child?.streak || 0);
  const recentActivity = `Recent ${domainNoun} practice is available for review.`;

  const confidence = inferConfidence(summary);
  const parentInsight = buildParentInsight({
    correct: accuracy >= 70,
    confidence,
    skillName: weakSkill,
    recommendedSkillName: weakSkill,
    severity: accuracy < 50 ? 'high' : accuracy < 70 ? 'medium' : 'low',
    parentAction: `Practise ${weakSkill} for 10 minutes, then review one mistake together.`,
  });

  return {
    childName: child?.name || '',
    domainNoun,
    mastered,
    total,
    masteryPercent,
    currentFocus,
    streak: Number.isFinite(streak) ? streak : 0,
    recentActivity,
    attentionSkill: weakSkill,
    attentionSkillId,
    accuracy,
    confidence,
    recommendation: parentInsight.recommendation,
    supportInsight: parentInsight,
  };
}

function ChelyaUpdateCard({ snapshot }) {
  const { body } = buildMascotNarration(snapshot, { childName: snapshot.childName, domainNoun: snapshot.domainNoun });
  if (!body) return null;
  return (
    <Card className="border-l-4 p-5" style={{ borderLeftColor: '#059669' }}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: '#059669' }}>
        Your weekly update
      </p>
      <div className="mt-3">
        <MascotBubble name="chelya" message={body} size="sm" />
      </div>
    </Card>
  );
}

function ParentDashboardMvp({ snapshot, studentId, navigate, domainLabel }) {
  const assignPracticeUrl = `/parent/children/${studentId}/assign-practice?module=MathPath&skill=${encodeURIComponent(snapshot.attentionSkillId || '')}`;
  const worksheetUrl = `/parent/children/${studentId}/worksheets/new?mode=weak_skills&worksheetType=parent_support_worksheet`;
  const mistakesUrl = `/parent/children/${studentId}/mistakes`;

  return (
    <div className="space-y-4">
      {FEATURE_FLAGS.parentNarration && <ChelyaUpdateCard snapshot={snapshot} />}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Child Snapshot</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-deep">What to know right now</h2>
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Child Snapshot">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Skills Mastered</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-emerald-deep">{snapshot.mastered}/{snapshot.total}</p>
          <p className="mt-1 text-sm text-ink-500">{snapshot.masteryPercent}% of {domainLabel}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Focus</p>
          <p className="mt-2 text-lg font-semibold text-ink-800">{snapshot.currentFocus}</p>
          <p className="mt-1 text-sm text-ink-500">Tonight’s best use of time</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-gold-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Streak</p>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-emerald-deep">{snapshot.streak}</p>
          <p className="mt-1 text-sm text-ink-500">{snapshot.streak === 1 ? 'day' : 'days'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Recent Activity</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">{snapshot.recentActivity}</p>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Parent action summary">
        <Card className="border-l-4 border-l-gold-500 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Needs Attention</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-emerald-deep">{snapshot.attentionSkill}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Accuracy</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{snapshot.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Confidence</p>
                  <p className="mt-1 text-2xl font-semibold text-ink-900">{snapshot.confidence}</p>
                </div>
              </div>
            </div>
            <Badge tone={snapshot.accuracy < 50 ? 'error' : snapshot.accuracy < 70 ? 'gold' : 'success'}>
              {snapshot.accuracy < 50 ? 'Watch closely' : snapshot.accuracy < 70 ? 'Needs practice' : 'On track'}
            </Badge>
          </div>
          <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-800">Recommendation</p>
            <p className="mt-1 font-semibold text-ink-800">{snapshot.recommendation}</p>
            {snapshot.supportInsight && (
              <div className="mt-3 grid gap-2 text-sm text-ink-700">
                <p><span className="font-semibold">Issue:</span> {snapshot.supportInsight.whatIsTheIssue}</p>
                <p><span className="font-semibold">How serious:</span> {snapshot.supportInsight.howSerious}</p>
                <p><span className="font-semibold">What to do:</span> {snapshot.supportInsight.whatCanIDo}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Suggested Actions</p>
          <div className="mt-4 grid gap-2">
            <Button className="justify-center" icon={Target} onClick={() => navigate(assignPracticeUrl)}>Assign Practice</Button>
            <Button className="justify-center" variant="secondary" icon={FileText} onClick={() => navigate(worksheetUrl)}>Print Worksheet</Button>
            <Button className="justify-center" variant="secondary" icon={AlertTriangle} onClick={() => navigate(mistakesUrl)}>Review Mistakes</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ParentOverviewCard({ summary, currentFocus, domainLabel }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Overall Status</p>
          <p className="text-xl font-semibold text-emerald-deep">{toTitle(summary.overallStatus)}</p>
          <p className="mt-1 text-sm text-ink-600">Current domain: {domainLabel}</p>
          <p className="mt-1 text-sm text-ink-700">Current focus: {currentFocus || 'Start with diagnostic'}</p>
        </div>
        <Badge tone={statusTone(summary.overallStatus)}>Readiness: {toTitle(summary.assessmentSummary?.readinessBand || 'developing')}</Badge>
      </div>
      {summary.parentFriendlyNarrative && <p className="mt-4 text-sm text-ink-600">{summary.parentFriendlyNarrative}</p>}
    </Card>
  );
}

function MasteryProgressCard({ mastery }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Mastery Progress</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><p className="text-xs text-ink-500">Mastered</p><p className="font-mono text-xl text-emerald-deep">{toCount(mastery.masteredSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Fluent</p><p className="font-mono text-xl text-emerald-deep">{toCount(mastery.fluentSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Retained</p><p className="font-mono text-xl text-emerald-deep">{toCount(mastery.retainedSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Total</p><p className="font-mono text-xl text-emerald-deep">{mastery.totalSkills || 26}</p></div>
      </div>
      <p className="mt-3 text-sm text-ink-600">
        {mastery.percentageMastered || 0}% mastered · {mastery.percentageFluent || 0}% fluent · {mastery.percentageRetained || 0}% retained
      </p>
    </Card>
  );
}

function CurrentWeaknessCard({ weaknesses = [], actions = [] }) {
  const top = weaknesses.slice(0, 3);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Current Weaknesses</h3>
      {top.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
          {top.map((w) => <li key={w}>{w}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-500">No major weak areas flagged right now.</p>
      )}
      <p className="mt-3 text-sm text-ink-600">
        {top.length ? 'Recommended next action: focus on these skills first before moving ahead.' : 'Recommended next action: keep consistent practice to maintain progress.'}
      </p>
      {!!actions.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.slice(0, 2).map((a) => <Badge key={a} tone="navy">{a}</Badge>)}
        </div>
      )}
    </Card>
  );
}

function FluencySummaryCard({ fluency }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Fluency Summary</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p>Accurate but slow: {toCount(fluency.accurateButSlowAreas)}</p>
        <p>Fluent areas: {toCount(fluency.fluentAreas)}</p>
        <p>Automatic areas: {toCount(fluency.automaticAreas)}</p>
      </div>
      <p className="mt-3 text-sm text-ink-600">{fluency.parentExplanation || 'Fluency data is building with each session.'}</p>
    </Card>
  );
}

function RetentionSummaryCard({ retention }) {
  const due = toCount(retention.skillsDueForReview);
  const refresh = toCount(retention.skillsNeedingRefresh);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Retention Summary</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p>Retained skills: {toCount(retention.retainedSkills)}</p>
        <p>Due for review: {due}</p>
        <p>Need refresh: {refresh}</p>
      </div>
      <p className="mt-3 text-sm text-ink-600">{due ? retention.parentExplanation : 'No review is due today.'}</p>
    </Card>
  );
}

function FluencyStatusInsightCard({ fluency }) {
  const fluent = fluency?.fluentSkills || [];
  const developing = fluency?.developingSkills || [];
  const needsPractice = fluency?.needsPracticeSkills || [];
  const focus = needsPractice[0] || developing[0] || fluent[0] || null;
  const label = focus?.fluencyStatus === 'fluent' ? 'Fluent' : focus?.fluencyStatus === 'developing' ? 'Developing' : focus ? 'Needs practice' : 'Building data';
  const tone = focus?.fluencyStatus === 'fluent' ? 'success' : focus?.fluencyStatus === 'developing' ? 'gold' : focus ? 'error' : 'neutral';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fluency Insight</p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-deep">{focus?.skillName || 'Fractions'}</h3>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>
      {focus ? (
        <div className="mt-3 space-y-1 text-sm text-ink-600">
          <p>Accuracy: <span className="font-semibold text-ink-800">{Math.round(focus.accuracy || 0)}%</span></p>
          <p>Average response: {focus.averageTimeSeconds ? `${focus.averageTimeSeconds}s` : 'building data'}</p>
          <p>{focus.interpretation}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">{fluency?.emptyState || 'Complete more practice to begin fluency tracking.'}</p>
      )}
    </Card>
  );
}

function WeeklyActionPlanCard({ plan, onPrimary }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Weekly Action Plan</h3>
      <p className="mt-2 text-sm text-ink-700"><span className="font-semibold">Focus:</span> {plan.weekFocus || 'Maintain practice rhythm'}</p>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p>Recommended practice: {plan.recommendedPracticeMinutes || 0} minutes</p>
        <p>Fluency sessions: {plan.recommendedFluencySessions || 0}</p>
        <p>Review sessions: {plan.recommendedReviewSessions || 0}</p>
        <p>Assessment: {plan.recommendedAssessment || 'Not required this week'}</p>
      </div>
      {!!plan.parentChecklist?.length && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-600">
          {plan.parentChecklist.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      <Button className="mt-4" icon={ArrowRight} onClick={onPrimary}>Start Today’s Practice</Button>
    </Card>
  );
}

// Title-case a canonical domainId (e.g. 'four_operations' → 'Four Operations')
// as a fallback label when the payload has no friendly name yet.
function titleizeDomainId(domainId) {
  return String(domainId || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'MathPath';
}

// Domain switcher: chips/tabs at the top of the dashboard that navigate between
// the math domains the child has activity in (plus the currently-selected one,
// always shown so context is clear even before activity exists).
function DomainSwitcher({ domains, activeDomainId, onSelect }) {
  if (!domains.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Math domains">
      {domains.map((d) => {
        const active = d.domainId === activeDomainId;
        return (
          <button
            key={d.domainId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && onSelect(d.domainId)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'border-emerald-deep bg-emerald-deep text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:border-emerald-deep hover:text-emerald-deep'
            }`}
          >
            {d.friendlyName || titleizeDomainId(d.domainId)}
          </button>
        );
      })}
    </div>
  );
}

export default function ParentMathPathDashboardPage() {
  const { studentId, domainId: domainParam } = useParams();
  // The base route /parent/children/:studentId/mathpath has no :domainId and
  // defaults to fractions, preserving the live pilot's existing links.
  const domainId = domainParam || 'fractions';
  const isFractions = domainId === 'fractions';
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [domains, setDomains] = useState([]);
  const [diagnosticGrowth, setDiagnosticGrowth] = useState(null);
  const [assigningRecovery, setAssigningRecovery] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [workingReview, setWorkingReview] = useState(null);
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);
    setError('');
    setDashboard(null);
    setDiagnosticGrowth(null);
    setWorkingReview(null);
    setAssignmentMessage('');
    try {
      // Diagnostic growth + working review are fractions-only pipelines today;
      // skip them for other domains so this read path degrades gracefully.
      const [dashboardRes, domainsRes, growthRes, workingRes] = await Promise.all([
        parentsAPI.mathPathDashboard({ studentId, domainId }),
        parentsAPI.mathPathDomains({ studentId }),
        isFractions ? mathpathAPI.getDiagnosticGrowth({ studentId, domainId }) : Promise.resolve(null),
        isFractions ? mathpathAPI.workingReviewSummary({ studentId }) : Promise.resolve(null),
      ]);
      if (requestId !== loadRequestRef.current) return;
      setDashboard(dashboardRes?.data || null);
      setDomains(domainsRes?.data?.domains || []);
      setDiagnosticGrowth(growthRes?.data || null);
      setWorkingReview(workingRes?.data || null);
    } catch (e) {
      if (requestId !== loadRequestRef.current) return;
      setError(e?.response?.data?.error || e.message || 'Could not load parent MathPath dashboard.');
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [studentId, domainId, isFractions]);

  const assignRecoveryPack = useCallback(async () => {
    const diagnosticSessionId = diagnosticGrowth?.latest?.diagnosticSessionId || diagnosticGrowth?.baseline?.diagnosticSessionId;
    if (!diagnosticSessionId) {
      setAssignmentMessage('Complete a diagnostic before assigning a Recovery Pack.');
      return;
    }
    setAssigningRecovery(true);
    setAssignmentMessage('');
    try {
      await mathpathAPI.createAssignmentFromDiagnostic({ studentId, diagnosticSessionId, assignedByRole: 'parent' });
      setAssignmentMessage('Recovery Pack assigned.');
    } catch (err) {
      setAssignmentMessage(err?.response?.data?.error || 'Could not assign Recovery Pack.');
    } finally {
      setAssigningRecovery(false);
    }
  }, [diagnosticGrowth, studentId]);

  useEffect(() => { load(); }, [load]);

  const primary = useMemo(() => {
    const actions = dashboard?.recommendedNextActions || [];
    if (actions.includes('uploadWorking')) return { label: 'Upload Working', to: '/student/mathpath/working/upload', icon: Upload };
    if (actions.includes('attemptAssessment')) return { label: 'Try Progress Assessment', to: '/student/mathpath/assessment', icon: FileText };
    if (actions.includes('reviewPreviousSkill')) return { label: 'Complete Review', to: '/student/mathpath/path', icon: Clock3 };
    return { label: "Start Today's Practice", to: '/student/mathpath', icon: Target };
  }, [dashboard]);

  // Chips: the domains the child has activity in, plus the selected domain
  // (so the active tab always renders even before activity exists).
  const domainChips = useMemo(() => {
    const list = [...domains];
    if (!list.find((d) => d.domainId === domainId)) {
      list.unshift({
        domainId,
        friendlyName: dashboard?.domain?.friendlyName || titleizeDomainId(domainId),
      });
    }
    return list;
  }, [domains, domainId, dashboard]);

  const selectDomain = useCallback((nextDomainId) => {
    navigate(`/parent/children/${studentId}/mathpath/${nextDomainId}`);
  }, [navigate, studentId]);

  if (loading) return <Spinner label="Loading parent dashboard…" />;
  if (error) {
    return (
      <>
        <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
        <ErrorState message={error} onRetry={load} />
      </>
    );
  }
  if (!dashboard) {
    return (
      <>
        <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
        <ErrorState message="No MathPath dashboard data available yet." onRetry={load} />
      </>
    );
  }

  const domainLabel = dashboard.domain?.friendlyName || titleizeDomainId(domainId);
  const domainNoun = dashboard.domain?.displayNoun || 'fraction';
  const currentFocus = dashboard.masteryProgress?.weakSkills?.[0] || dashboard.masteryProgress?.inProgressSkills?.[0] || `${domainLabel} practice`;
  const snapshot = deriveParentSnapshot(dashboard, child, domainNoun);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      <PageHeader
        title="Parent MathPath Dashboard"
        subtitle={`${domainLabel} progress — mastery, fluency, retention, and next actions.`}
        action={(
          <Button icon={primary.icon} onClick={() => navigate(primary.to)}>{primary.label}</Button>
        )}
      />

      <div className="space-y-4">
        <DomainSwitcher domains={domainChips} activeDomainId={domainId} onSelect={selectDomain} />
        <ParentDashboardMvp snapshot={snapshot} studentId={studentId} navigate={navigate} domainLabel={domainLabel} />
        {isFractions && (
          <DiagnosticGrowthCard
            growth={diagnosticGrowth}
            onViewHistory={() => navigate(`/parent/children/${studentId}/mathpath/${domainId}`)}
            onRunRecheck={() => navigate('/student/mathpath/diagnostic', { state: { diagnosticPurpose: 'recheck' } })}
            onAssignRecovery={assignRecoveryPack}
            assigningRecovery={assigningRecovery}
            assignmentMessage={assignmentMessage}
          />
        )}
        <ParentOverviewCard summary={dashboard} currentFocus={currentFocus} domainLabel={domainLabel} />

        <WeeklyActionPlanCard plan={dashboard.weeklyActionPlan || {}} onPrimary={() => navigate('/student/mathpath')} />
        {isFractions && <AdultWorkingReviewPanel review={workingReview || {}} title="Workings and Help Requests" />}

        <CollapsibleSection
          title="Progress details"
          summary="Mastery, weak areas, fluency, and retention."
          surface={false}
          action={FEATURE_FLAGS.assessments ? <Button size="s" variant="secondary" onClick={() => navigate(`/parent/children/${studentId}/mathpath/test-spec`)}>School Test</Button> : null}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MasteryProgressCard mastery={dashboard.masteryProgress || {}} />
            <CurrentWeaknessCard weaknesses={dashboard.currentWeaknesses || []} actions={dashboard.recommendedNextActions || []} />
            <FluencyStatusInsightCard fluency={dashboard.fluency || {}} />
            <FluencySummaryCard fluency={dashboard.fluencySummary || {}} />
            <RetentionSummaryCard retention={dashboard.retentionSummary || {}} />
          </div>
        </CollapsibleSection>

        <Card className="p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-success-700" />
            <p className="text-sm text-ink-600">This dashboard uses parent-friendly summaries and avoids technical skill IDs.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
