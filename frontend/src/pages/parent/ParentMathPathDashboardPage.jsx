import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, FileText, Target, Upload, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge, ErrorState, PageHeader, Spinner, CollapsibleSection } from '../../components/ui';
import ChildNav from './ChildNav';
import { useChild } from './useChild';
import { mathpathAPI } from '../../services/api';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import AdultWorkingReviewPanel from '../../components/mathpath/working/AdultWorkingReviewPanel';

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

function ParentOverviewCard({ summary, currentFocus }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Overall Status</p>
          <p className="text-xl font-semibold text-navy-700">{toTitle(summary.overallStatus)}</p>
          <p className="mt-1 text-sm text-ink-600">Current domain: Fractions</p>
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
        <div><p className="text-xs text-ink-500">Mastered</p><p className="font-mono text-xl text-navy-700">{toCount(mastery.masteredSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Fluent</p><p className="font-mono text-xl text-navy-700">{toCount(mastery.fluentSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Retained</p><p className="font-mono text-xl text-navy-700">{toCount(mastery.retainedSkills)}</p></div>
        <div><p className="text-xs text-ink-500">Total</p><p className="font-mono text-xl text-navy-700">{mastery.totalSkills || 26}</p></div>
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

function AssessmentProgressCard({ assessment, onStartBaseline }) {
  const hasScore = typeof assessment.latestScore === 'number';
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Assessment Progress</h3>
      {hasScore ? (
        <div className="mt-2 space-y-1 text-sm text-ink-600">
          <p>Latest score: <span className="font-semibold text-ink-700">{assessment.latestScore}%</span></p>
          <p>Previous score: {typeof assessment.previousScore === 'number' ? `${assessment.previousScore}%` : '—'}</p>
          <p>Score change: {typeof assessment.scoreChange === 'number' ? `${assessment.scoreChange >= 0 ? '+' : ''}${assessment.scoreChange}%` : '—'}</p>
          <p>Readiness: {toTitle(assessment.readinessBand)}</p>
          <p className="pt-1">{assessment.parentExplanation}</p>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-ink-600">Take a baseline assessment to measure your child’s current fraction readiness.</p>
          <Button size="s" icon={FileText} onClick={onStartBaseline}>Start Baseline Assessment</Button>
        </div>
      )}
    </Card>
  );
}

function WorkingQualityCard({ working, onUpload }) {
  const missing = Number(working.missingWorkingCount || 0);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Working Quality</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p>Working quality: <span className="font-semibold text-ink-700">{toTitle(working.workingQualityBand || 'good')}</span></p>
        <p>Missing working: {missing}</p>
      </div>
      <p className="mt-2 text-sm text-ink-600">{working.parentExplanation}</p>
      {!!working.guidance?.length && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-500">
          {working.guidance.slice(0, 2).map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      )}
      {missing > 0 && <Button className="mt-3" size="s" icon={Upload} onClick={onUpload}>Upload Working</Button>}
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

function deriveParentPayload(studentId, mastery) {
  const records = Array.isArray(mastery?.records) ? mastery.records : [];
  const masteredSkillIds = records
    .filter((r) => ['mastered', 'accurate', 'fluent', 'retained'].includes(String(r.status || '').toLowerCase()))
    .map((r) => r.skillId)
    .filter(Boolean);
  const weakSkillIds = records
    .filter((r) => ['weak', 'needs_review', 'needsreview'].includes(String(r.status || '').toLowerCase()))
    .map((r) => r.skillId)
    .filter(Boolean);
  const fluentSkillIds = records
    .filter((r) => ['fluent', 'retained'].includes(String(r.status || '').toLowerCase()))
    .map((r) => r.skillId)
    .filter(Boolean);

  const pipeline = runMathPathDomainPipeline({
    studentId,
    domainId: 'fractions',
    mode: 'full',
    practiceState: {
      currentSkillId: mastery?.recommended?.skillId || null,
      masteredSkillIds,
      weakSkillIds,
      fluentSkillIds,
    },
    retentionState: {},
    assessmentResults: [],
    mistakePlans: [],
    workingAnalysisSummary: {},
  });
  return pipeline.parentDashboard || null;
}

export default function ParentMathPathDashboardPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [workingReview, setWorkingReview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [masteryRes, latestRes, workingRes] = await Promise.all([
        mathpathAPI.mastery({ studentId }),
        mathpathAPI.getLatestDiagnostic({ studentId }),
        mathpathAPI.workingReviewSummary({ studentId }),
      ]);
      const parentPayload = deriveParentPayload(studentId, masteryRes?.data || {});
      setSummary(parentPayload);
      setPlacement(latestRes?.data?.result || null);
      setWorkingReview(workingRes?.data || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not load parent MathPath dashboard.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const primary = useMemo(() => {
    const actions = summary?.recommendedNextActions || [];
    if (actions.includes('uploadWorking')) return { label: 'Upload Working', to: '/student/mathpath/working/upload', icon: Upload };
    if (actions.includes('attemptAssessment')) return { label: 'Try Progress Assessment', to: '/student/mathpath/assessment', icon: FileText };
    if (actions.includes('reviewPreviousSkill')) return { label: 'Complete Review', to: '/student/mathpath/path', icon: Clock3 };
    return { label: "Start Today's Practice", to: '/student/mathpath', icon: Target };
  }, [summary]);

  if (loading) return <Spinner label="Loading parent dashboard…" />;
  if (error) {
    return (
      <>
        <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
        <ErrorState message={error} onRetry={load} />
      </>
    );
  }
  if (!summary) {
    return (
      <>
        <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
        <ErrorState message="No MathPath dashboard data available yet." onRetry={load} />
      </>
    );
  }

  const currentFocus = summary.masteryProgress?.weakSkills?.[0] || summary.masteryProgress?.inProgressSkills?.[0] || 'Fractions diagnostic';
  const placementSkill = placement?.recommendedStartingSkill?.name || null;

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      <PageHeader
        title="Parent MathPath Dashboard"
        subtitle="A clear weekly view of mastery, fluency, retention, and next actions."
        action={(
          <Button icon={primary.icon} onClick={() => navigate(primary.to)}>{primary.label}</Button>
        )}
      />

      <div className="space-y-4">
        <ParentOverviewCard summary={summary} currentFocus={placementSkill || currentFocus} />
        {!!placementSkill && (
          <Card className="p-4">
            <p className="text-sm text-ink-600">
              Latest placement recommends starting at <span className="font-semibold text-ink-700">{placementSkill}</span>.
            </p>
          </Card>
        )}

        <WeeklyActionPlanCard plan={summary.weeklyActionPlan || {}} onPrimary={() => navigate('/student/mathpath')} />
        <AdultWorkingReviewPanel review={workingReview || {}} title="Workings and Help Requests" />

        <CollapsibleSection
          title="Progress details"
          summary="Mastery, weak areas, fluency, retention, assessment, and working quality."
          surface={false}
          action={<Button size="s" variant="secondary" onClick={() => navigate(`/parent/children/${studentId}/mathpath/test-spec`)}>School Test</Button>}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MasteryProgressCard mastery={summary.masteryProgress || {}} />
            <CurrentWeaknessCard weaknesses={summary.currentWeaknesses || []} actions={summary.recommendedNextActions || []} />
            <FluencySummaryCard fluency={summary.fluencySummary || {}} />
            <RetentionSummaryCard retention={summary.retentionSummary || {}} />
            <AssessmentProgressCard
              assessment={summary.assessmentSummary || {}}
              onStartBaseline={() => navigate('/student/mathpath/assessment')}
            />
            <WorkingQualityCard
              working={summary.workingSummary || {}}
              onUpload={() => navigate('/student/mathpath/working/upload')}
            />
          </div>
        </CollapsibleSection>

        {!!summary.warnings?.length && (
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-gold-700" />
              <p className="text-sm text-ink-600">Some sections are partial while more student data is being collected.</p>
            </div>
          </Card>
        )}

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
