import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock3, FileText, Target, Upload } from 'lucide-react';
import { Button, Card, ErrorState, PageHeader, Spinner, Badge, CollapsibleSection } from '../../components/ui';
import TutorStudentNav from './TutorStudentNav';
import { useTutorStudent } from './useTutorStudent';
import { tutorAPI, mathpathAPI } from '../../services/api';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { buildTutorMathPathDashboard } from '../../mathpath/dashboard/tutorMathPathDashboardEngine';
import { getSkill } from '../../mathpath/fractions/fractionSkillGraph';

function skillLabel(skillId) {
  if (!skillId) return '—';
  const skill = getSkill(skillId);
  return skill ? `${skill.id} ${skill.name}` : skillId;
}

function severityTone(severity) {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'gold';
  return 'neutral';
}

function issueTone(type) {
  if (type === 'accurateButSlow') return 'gold';
  if (type === 'fastButInaccurate' || type === 'inconsistent') return 'error';
  return 'neutral';
}

function buildMistakePlans(mistakes = []) {
  if (!Array.isArray(mistakes) || !mistakes.length) return [];
  const byCode = new Map();
  mistakes.forEach((m) => {
    const code = m.mistakeCode || m.code || m.type;
    if (!code) return;
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(m);
  });
  return [...byCode.entries()].map(([code, rows]) => ({
    focusMistakes: [{
      mistakeCode: code,
      count: rows.length,
      highestSeverity: rows.length >= 3 ? 'high' : rows.length === 2 ? 'medium' : 'low',
    }],
    rootCauseSkillIds: [...new Set(rows.map((row) => row.skillId).filter(Boolean))],
    remediationQueue: [...new Set(rows.map((row) => row.skillId).filter(Boolean))].map((skillId) => ({ skillId })),
  }));
}

function derivePracticeState(mastery = {}, student = {}) {
  const records = mastery.records || [];
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
  return {
    currentSkillId: student?.focusSkillId || mastery?.recommended?.skillId || null,
    masteredSkillIds,
    weakSkillIds,
    fluentSkillIds,
  };
}

function TutorOverviewCard({ studentName, dashboard, currentSkill }) {
  const topPriority = dashboard.interventionPriorities?.[0];
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Tutor Overview</p>
          <p className="text-lg font-semibold text-navy-700">{studentName}</p>
          <p className="mt-1 text-sm text-ink-600">Domain: Fractions</p>
          <p className="text-sm text-ink-600">Current skill: {skillLabel(currentSkill)}</p>
          <p className="mt-1 text-sm text-ink-700">Overall readiness: {dashboard.tutorNotes?.readinessBand || 'developing'} ({dashboard.tutorNotes?.readinessScore ?? '—'})</p>
        </div>
        <Badge tone={topPriority ? severityTone(topPriority.severity) : 'neutral'}>
          Main priority: {topPriority?.issueType || 'monitoring'}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-ink-600">{dashboard.overallTutorSummary}</p>
    </Card>
  );
}

function RootCauseAnalysisCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Root Cause Analysis</h3>
      {rows.length ? (
        <div className="mt-3 space-y-3">
          {rows.slice(0, 3).map((row) => (
            <div key={row.weakSkillId} className="rounded-lg border border-hairline p-3 text-sm">
              <p><span className="font-semibold text-ink-700">Weak skill:</span> {skillLabel(row.weakSkillId)}</p>
              <p><span className="font-semibold text-ink-700">Root cause:</span> {skillLabel(row.suspectedRootCauseSkillIds?.[0] || row.weakSkillId)}</p>
              <p><span className="font-semibold text-ink-700">Chain:</span> {(row.prerequisiteChain || []).map(skillLabel).join(' → ') || '—'}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={severityTone(row.severity)}>Severity: {row.severity}</Badge>
                <span className="text-ink-500">Intervention: {row.recommendedIntervention}</span>
              </div>
              {!!row.evidence?.length && <p className="mt-1 text-ink-500">Evidence: {row.evidence.join(' ')}</p>}
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">Ask the student to complete the Fractions Diagnostic first.</p>}
    </Card>
  );
}

function MistakeClusterCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Mistake Clusters</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 4).map((row) => (
            <div key={row.mistakeCode} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{row.mistakeCode} {row.mistakeName}</p>
                <Badge tone={severityTone(row.severity)}>{row.severity}</Badge>
              </div>
              <p className="mt-1 text-ink-600">Frequency: {row.frequency}</p>
              <p className="text-ink-600">Affected skills: {(row.affectedSkills || []).map(skillLabel).join(', ') || '—'}</p>
              <p className="text-ink-600">Remediation: {(row.remediationSkills || []).map(skillLabel).join(', ') || '—'}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No recurring mistake pattern detected yet.</p>}
    </Card>
  );
}

function FluencyBottleneckCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Fluency Bottlenecks</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 5).map((row) => (
            <div key={`${row.skillId}-${row.questionFamilyId}`} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{skillLabel(row.skillId)}</p>
                <Badge tone={issueTone(row.issueType)}>{row.issueType}</Badge>
              </div>
              <p className="text-ink-600">{row.questionFamilyName}</p>
              <p className="text-ink-600">Accuracy: {row.accuracy}% · Avg time: {row.averageTime ?? '—'}s · Benchmark: {row.benchmarkTime ?? '—'}s</p>
              <p className="text-ink-600">Recommended drill: {row.recommendation}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No clear fluency bottlenecks yet.</p>}
    </Card>
  );
}

function RetentionRiskCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Retention Risks</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 5).map((row) => (
            <div key={row.skillId} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{skillLabel(row.skillId)}</p>
                <Badge tone={severityTone(row.riskLevel)}>{row.riskLevel}</Badge>
              </div>
              <p className="text-ink-600">Status: {row.retentionStatus}</p>
              <p className="text-ink-600">Next review: {row.nextReviewDue ? new Date(row.nextReviewDue).toLocaleDateString() : '—'}</p>
              <p className="text-ink-600">Plan: {row.recommendation}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No retention risk flagged yet.</p>}
    </Card>
  );
}

function WorkingQualityTutorCard({ data = {} }) {
  const missing = data.missingWorkingQuestions || [];
  const flags = data.calculatorIntegrityFlags || [];
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Working Quality</h3>
      <p className="mt-2 text-sm text-ink-600">Overall quality: {data.overallWorkingQuality ?? '—'}</p>
      <p className="text-sm text-ink-600">Missing working questions: {missing.length}</p>
      <p className="text-sm text-ink-600">Integrity flags: {flags.length}</p>
      {!!flags.length && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-500">
          {flags.slice(0, 3).map((f, i) => <li key={`${f.flagType}-${i}`}>{f.flagType} ({f.severity})</li>)}
        </ul>
      )}
      <p className="mt-2 text-sm text-ink-600">
        {missing.length ? 'Working has not been uploaded for some recent sessions.' : 'Working data is available for review.'}
      </p>
      <p className="mt-1 text-sm text-ink-500">Use these flags as coaching signals, not judgement.</p>
    </Card>
  );
}

function NextSessionPlanCard({ plan = {} }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Next Session Plan</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-600">
        <p><span className="font-semibold text-ink-700">Goal:</span> {plan.sessionGoal || 'Plan next intervention.'}</p>
        <p><span className="font-semibold text-ink-700">Warm-up:</span> {plan.warmUp || '—'}</p>
        <p><span className="font-semibold text-ink-700">Main intervention:</span> {plan.mainIntervention || '—'}</p>
        <p><span className="font-semibold text-ink-700">Guided practice:</span> {(plan.guidedPractice || []).join(', ') || '—'}</p>
        <p><span className="font-semibold text-ink-700">Independent practice:</span> {plan.independentPractice?.recommendedQuestionCount ?? '—'} questions</p>
        <p><span className="font-semibold text-ink-700">Homework:</span> {(plan.homeworkAssignment?.focusSkills || []).map(skillLabel).join(', ') || '—'}</p>
        <p><span className="font-semibold text-ink-700">Success criteria:</span> {plan.successCriteria || '—'}</p>
      </div>
    </Card>
  );
}

function SuggestedAssignmentsCard({ rows = [] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Suggested Assignments</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 6).map((row, i) => (
            <div key={`${row.assignmentType}-${row.skillId || i}`} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{row.assignmentType}</p>
                <Badge tone={row.workingRequired ? 'gold' : 'neutral'}>{row.workingRequired ? 'Working required' : 'No working required'}</Badge>
              </div>
              <p className="text-ink-600">Target: {skillLabel(row.skillId)}</p>
              <p className="text-ink-600">Question families: {(row.questionFamilyIds || []).join(', ') || '—'}</p>
              <p className="text-ink-600">Count: {row.recommendedQuestionCount || 0}</p>
              <p className="text-ink-600">Reason: {row.reason}</p>
            </div>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-ink-500">No assignment suggestions yet.</p>}
    </Card>
  );
}

export default function TutorMathPathDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentMeta = useTutorStudent(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [placement, setPlacement] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentRes, masteryRes, latestRes] = await Promise.all([
        tutorAPI.student(id),
        mathpathAPI.mastery({ studentId: id }),
        mathpathAPI.getLatestDiagnostic({ studentId: id }),
      ]);
      const studentPayload = studentRes?.data || {};
      const masteryPayload = masteryRes?.data || {};
      const practiceState = derivePracticeState(masteryPayload, studentPayload.student || {});
      const mistakePlans = buildMistakePlans(studentPayload.mistakes || []);

      const pipeline = runMathPathDomainPipeline({
        studentId: id,
        domainId: 'fractions',
        mode: 'full',
        practiceState,
        retentionState: {},
        assessmentResults: [],
        mistakePlans,
        workingAnalysisSummary: {},
      });

      const tutorDashboard = buildTutorMathPathDashboard({
        studentId: id,
        studentProgressState: pipeline.studentProgress,
        diagnosticResult: pipeline.diagnostic?.summary || {},
        practiceState: pipeline.practice?.state || practiceState,
        fluencyState: pipeline.fluency || {},
        retentionState: pipeline.retention?.state || {},
        assessmentResults: [],
        mistakePlans,
        workingAnalysisSummary: pipeline.working?.summary || {},
      });
      setDashboard(tutorDashboard);
      setPlacement(latestRes?.data?.result || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not load tutor MathPath dashboard.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const primary = useMemo(() => {
    const top = dashboard?.interventionPriorities?.[0];
    if (top?.recommendedAction === 'reviewWorking') return { label: 'Review Working', icon: Upload, to: `/tutor/students/${id}/lesson-notes` };
    if (top?.recommendedAction === 'runFluencyDrill' || top?.issueType === 'accurateButSlow') return { label: 'Assign Fluency Drill', icon: Clock3, to: `/tutor/students/${id}/assign-homework` };
    if (top?.recommendedAction === 'conductMiniAssessment') return { label: 'Assign Targeted Practice', icon: FileText, to: `/tutor/students/${id}/assign-homework` };
    return { label: 'Start Recommended Session', icon: Target, to: `/tutor/students/${id}/lesson-prep` };
  }, [dashboard, id]);

  if (loading) return <Spinner label="Loading tutor dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!dashboard) return <ErrorState message="No tutor dashboard data available yet." onRetry={load} />;

  return (
    <>
      <TutorStudentNav studentId={id} name={studentMeta?.name || 'Student'} level={studentMeta?.level} />
      <PageHeader
        title="Tutor MathPath Dashboard"
        subtitle="Root causes, fluency bottlenecks, retention risk, and session planning."
        action={<Button icon={primary.icon} onClick={() => navigate(primary.to)}>{primary.label}</Button>}
      />
      {!!placement?.recommendedStartingSkill?.name && (
        <Card className="mb-4 p-4">
          <p className="text-sm text-ink-600">
            Latest placement: start at <span className="font-semibold text-ink-700">{placement.recommendedStartingSkill.name}</span>.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        <TutorOverviewCard studentName={studentMeta?.name || 'Student'} dashboard={dashboard} currentSkill={dashboard.tutorNotes?.currentSkill} />

        <CollapsibleSection
          title="Intervention details"
          summary="Root causes, mistake clusters, fluency, retention, working quality, and next session plan."
          surface={false}
          action={<Button size="s" variant="secondary" onClick={() => navigate(`/tutor/students/${id}/mathpath/test-spec`)}>School Test</Button>}
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RootCauseAnalysisCard rows={dashboard.rootCauseAnalysis || []} />
            <MistakeClusterCard rows={dashboard.mistakeClusters || []} />
            <FluencyBottleneckCard rows={dashboard.fluencyBottlenecks || []} />
            <RetentionRiskCard rows={dashboard.retentionRisks || []} />
            <WorkingQualityTutorCard data={dashboard.workingQualityConcerns || {}} />
            <NextSessionPlanCard plan={dashboard.nextSessionPlan || {}} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Suggested assignments"
          summary={`${(dashboard.suggestedAssignments || []).length} generated assignment suggestion${(dashboard.suggestedAssignments || []).length === 1 ? '' : 's'}`}
          surface={false}
        >
          <SuggestedAssignmentsCard rows={dashboard.suggestedAssignments || []} />
        </CollapsibleSection>
      </div>
    </>
  );
}
