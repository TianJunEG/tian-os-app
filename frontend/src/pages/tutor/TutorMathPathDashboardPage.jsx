import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, AlertTriangle, Brain, CheckCircle2, Clock3, Eye, FileText, Target, Upload } from 'lucide-react';
import { Button, Card, ErrorState, PageHeader, Spinner, Badge, CollapsibleSection } from '../../components/ui';
import FEATURE_FLAGS from '../../config/featureFlags';
import TutorStudentNav from './TutorStudentNav';
import { useTutorStudent } from './useTutorStudent';
import { tutorAPI, mathpathAPI } from '../../services/api';
import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';
import { buildTutorMathPathDashboard } from '../../mathpath/dashboard/tutorMathPathDashboardEngine';
import { getSkill } from '../../mathpath/fractions/fractionSkillGraph';
import { CURRICULUM_DOMAINS, getSkillFromDomain } from '../../mathpath/curriculumDomainIndex';
import AdultWorkingReviewPanel from '../../components/mathpath/working/AdultWorkingReviewPanel';
import DiagnosticGrowthCard from '../../components/mathpath/DiagnosticGrowthCard';

function skillLabel(skillId, domainId) {
  if (!skillId) return '—';
  if (domainId && domainId !== 'fractions') {
    const skill = getSkillFromDomain(domainId, skillId);
    return skill ? `${skill.id} ${skill.name}` : skillId;
  }
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

function percent(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function readableIssue(type = '') {
  const key = String(type || '');
  const labels = {
    rootCause: 'Concept gap',
    mistakeCluster: 'Repeated mistake',
    workingQuality: 'Working evidence needed',
    retentionRisk: 'Review risk',
    accurateButSlow: 'Accurate but slow',
    fastButInaccurate: 'Fast but inaccurate',
    inconsistent: 'Inconsistent',
  };
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim() || 'Monitor';
}

function readableAction(action = '') {
  const labels = {
    reteachConcept: 'Reteach with visual models before assigning more practice.',
    assignTargetedPractice: 'Assign targeted practice and check the first few questions together.',
    reviewWorking: 'Review submitted working and coach clearer steps.',
    runFluencyDrill: 'Run a short fluency drill after checking accuracy.',
    conductMiniAssessment: 'Do a mini assessment before moving forward.',
    scheduleRetentionReview: 'Schedule a short retention review.',
    continuePractice: 'Continue practice and monitor the next session.',
  };
  return labels[action] || readableIssue(action);
}

function formatDate(value) {
  if (!value) return 'No recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const found = value.find((item) => typeof item === 'string' && item.trim());
      if (found) return found.trim();
    }
  }
  return '';
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
          <p className="text-lg font-semibold text-emerald-deep">{studentName}</p>
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
            <div key={row.weakSkillId} className="rounded-lg border border-line-soft p-3 text-sm">
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
            <div key={row.mistakeCode} className="rounded-lg border border-line-soft p-3">
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
            <div key={`${row.skillId}-${row.questionFamilyId}`} className="rounded-lg border border-line-soft p-3">
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

function TutorFluencyInsightCard({ fluency = {}, retention = {} }) {
  const needsPractice = fluency.needsPracticeSkills || [];
  const developing = fluency.developingSkills || [];
  const fluent = fluency.fluentSkills || [];
  const focus = needsPractice[0] || developing[0] || fluent[0] || null;
  const needsReteaching = focus?.fluencyStatus === 'not_fluent' || Number(focus?.accuracy || 0) < 70;
  const statusLabel = focus?.fluencyStatus === 'fluent' ? 'Fluent' : focus?.fluencyStatus === 'developing' ? 'Developing' : focus ? 'Needs practice' : 'Building data';
  const tone = focus?.fluencyStatus === 'fluent' ? 'success' : focus?.fluencyStatus === 'developing' ? 'gold' : focus ? 'error' : 'neutral';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fluency Intelligence</p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-deep">{focus?.skillName || 'No fluency record yet'}</h3>
        </div>
        <Badge tone={tone}>{statusLabel}</Badge>
      </div>
      {focus ? (
        <div className="mt-3 space-y-1 text-sm text-ink-600">
          <p>Accuracy: {Math.round(focus.accuracy || 0)}% · Avg response: {focus.averageTimeSeconds ? `${focus.averageTimeSeconds}s` : '—'}</p>
          <p>Retention reviews: {(retention.upcomingReviews || []).length} upcoming · {(retention.overdueReviews || []).length} overdue</p>
          <p className="font-semibold text-ink-800">Tutor signal: {needsReteaching ? 'Reteach before drilling.' : 'Use repetition and short drills.'}</p>
          <p>{focus.interpretation}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">{fluency.emptyState || 'Complete more practice to begin fluency tracking.'}</p>
      )}
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
            <div key={row.skillId} className="rounded-lg border border-line-soft p-3">
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
      <h3 className="text-sm font-semibold text-ink-700">Suggested Practice</h3>
      {rows.length ? (
        <div className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 6).map((row, i) => (
            <div key={`${row.assignmentType}-${row.skillId || i}`} className="rounded-lg border border-line-soft p-3">
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
      ) : <p className="mt-2 text-sm text-ink-500">No practice suggestions yet.</p>}
    </Card>
  );
}

function deriveTutorSnapshot({ dashboard = {}, placement = null, workingReview = {}, studentName = 'Student' }) {
  const priorities = dashboard.interventionPriorities || [];
  const top = priorities[0] || {};
  const notes = dashboard.tutorNotes || {};
  const mastery = dashboard.adultIntelligence?.masterySignals || dashboard.tutorStudentProfile?.masteryStatus || {};
  const workingSummary = workingReview.summary || {};
  const workingSessions = Array.isArray(workingReview.workingSessions) ? workingReview.workingSessions : [];
  const topSkillId = top.skillId || notes.currentSkill || placement?.recommendedStartingSkill?.skillId || 'F010';
  const topSkillName = skillLabel(topSkillId).replace(/^F\d{3}\s+/, '') || 'Equivalent Fractions';
  const masteredCount = Number(mastery.masteredCount || (mastery.masteredSkillIds || mastery.recentlyMasteredSkills || []).length || 0);
  const totalSkills = Number(mastery.totalSkills || 26);
  const submitted = Number(workingSummary.analysedCount || workingSummary.needsReviewCount || workingSessions.length || 0);
  const pending = Number(workingSummary.pendingUploadCount || 0);
  const workingRate = submitted + pending > 0 ? percent((submitted / (submitted + pending)) * 100) : 0;
  const highConfidenceWrong = Number(
    dashboard.adultIntelligence?.confidenceSignals?.overconfidentWrongCount
    || dashboard.tutorStudentProfile?.confidenceCalibration?.overconfidentWrongCount
    || dashboard.mistakeClusters?.reduce((sum, row) => sum + Number(row.frequency || 0), 0)
    || (top.severity === 'high' ? 4 : 0)
  );
  const accuracy = percent(
    dashboard.fluencyBottlenecks?.[0]?.accuracy
    || dashboard.adultIntelligence?.masterySignals?.currentAccuracy
    || placement?.score
    || (top.severity === 'high' ? 42 : 62),
    62
  );

  return {
    studentName,
    currentDomain: 'Fractions',
    currentSkill: topSkillName,
    masteredCount,
    totalSkills,
    streak: Number(mastery.currentStreak || 0),
    questionsThisWeek: Number(mastery.questionsThisWeek || dashboard.adultIntelligence?.practiceSignals?.questionsThisWeek || 0),
    accuracy,
    workingRate,
    highConfidenceWrong,
    topSkillId,
    topSkillName,
    topReason: top.reason || 'High confidence wrong answers',
  };
}

function InterventionQueueCard({ priorities = [], snapshot }) {
  const rows = priorities.length ? priorities.slice(0, 5) : [{
    priorityRank: 1,
    skillId: snapshot.topSkillId,
    severity: 'high',
    issueType: 'mistakeCluster',
    reason: 'High confidence wrong answers',
    recommendedAction: 'reteachConcept',
  }];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Intervention Queue</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-deep">{snapshot.studentName}</h2>
        </div>
        <Badge tone={severityTone(rows[0]?.severity)}>{rows.length} priorit{rows.length === 1 ? 'y' : 'ies'}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const label = skillLabel(row.skillId || snapshot.topSkillId).replace(/^F\d{3}\s+/, '') || snapshot.topSkillName;
          const highConfidenceWrong = snapshot.highConfidenceWrong || (row.severity === 'high' ? 4 : 0);
          return (
            <div key={`${row.priorityRank}-${row.skillId || label}-${row.issueType}`} className="rounded-xl border border-line-soft bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{label}</p>
                  <p className="mt-1 text-sm text-ink-600"><span className="font-semibold">Needs help:</span> {label}</p>
                </div>
                <Badge tone={severityTone(row.severity)}>{row.severity === 'high' ? 'High priority' : row.severity === 'medium' ? 'Medium priority' : 'Monitor'}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-700"><span className="font-semibold">Reason:</span> {row.reason || 'High confidence wrong answers'}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
                <li>Accuracy: {snapshot.accuracy}%</li>
                <li>Confident but incorrect: {highConfidenceWrong} question{highConfidenceWrong === 1 ? '' : 's'}</li>
                <li>Working submission rate: {snapshot.workingRate}%</li>
              </ul>
              <p className="mt-3 text-sm text-ink-700"><span className="font-semibold">Recommended tutor action:</span> {readableAction(row.recommendedAction)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TutorIntelligenceCard({ insight = {} }) {
  const evidence = Array.isArray(insight.evidence) ? insight.evidence : [];
  const intervention = insight.recommendedIntervention || {};
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Tutor Intelligence Engine</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-deep">Root cause, evidence, next intervention</h2>
        </div>
        <Badge tone={severityTone(insight.severity)}>{insight.confidence || 'Building data'} confidence</Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-line-soft bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Root Cause</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{insight.rootCause || 'No root cause detected yet.'}</p>
        </div>
        <div className="rounded-xl border border-line-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Evidence</p>
          {evidence.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
              {evidence.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-500">More attempts and working submissions are needed before calling a root cause.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-800">Recommended Intervention</p>
        <p className="mt-1 text-lg font-semibold text-emerald-deep">{intervention.title || 'Continue monitoring'}</p>
        <p className="mt-1 text-sm text-ink-700">{insight.nextTutorAction || 'Review the next practice session before assigning remediation.'}</p>
        {!!intervention.steps?.length && (
          <ol className="mt-3 space-y-1 text-sm text-ink-700">
            {intervention.steps.slice(0, 4).map((step, index) => (
              <li key={step}><span className="font-semibold">{index + 1}.</span> {step}</li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}

function SessionRecommendationsMvp({ plan = {}, snapshot }) {
  const focus = snapshot.topSkillName || 'Equivalent Fractions';
  const secondary = plan.homeworkAssignment?.focusSkills?.find((skillId) => skillId !== snapshot.topSkillId) || 'F003';
  const secondaryLabel = skillLabel(secondary).replace(/^F\d{3}\s+/, '') || 'Fraction of a Set';

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Session Recommendations</p>
      <h3 className="mt-1 font-display text-xl font-semibold text-emerald-deep">Next Session Plan — {plan.estimatedDurationMinutes || 45} minutes</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line-soft p-4">
          <p className="font-mono text-sm font-semibold text-gold-700">20 min</p>
          <p className="mt-1 font-semibold text-ink-800">{focus}</p>
          <p className="mt-1 text-sm text-ink-600">{plan.mainIntervention || `Reteach ${focus} using shaded diagrams and number lines.`}</p>
        </div>
        <div className="rounded-xl border border-line-soft p-4">
          <p className="font-mono text-sm font-semibold text-gold-700">10 min</p>
          <p className="mt-1 font-semibold text-ink-800">{secondaryLabel}</p>
          <p className="mt-1 text-sm text-ink-600">Do guided practice together before independent work.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2 text-sm text-ink-700">
        <li><span className="font-semibold">1. Warm-up — 5 minutes:</span> {plan.warmUp || 'Review 3 simple fraction recognition questions.'}</li>
        <li><span className="font-semibold">2. Main Teaching — 20 minutes:</span> Reteach {focus} with visual models.</li>
        <li><span className="font-semibold">3. Guided Practice — 10 minutes:</span> Work through 4 questions together.</li>
        <li><span className="font-semibold">4. Independent Practice — 5 minutes:</span> Student attempts 3 questions independently.</li>
        <li><span className="font-semibold">5. Exit Check — 5 minutes:</span> One short mastery check question.</li>
      </ol>
    </Card>
  );
}

function MistakeInsightsMvp({ dashboard = {}, snapshot }) {
  const clusters = dashboard.mistakeClusters || [];
  const skills = clusters.flatMap((row) => row.remediationSkills || row.affectedSkills || []).filter(Boolean);
  const topSkills = skills.length ? [...new Set(skills)].slice(0, 3).map((id) => skillLabel(id).replace(/^F\d{3}\s+/, '')) : [snapshot.topSkillName];
  const skipped = Number(dashboard.adultIntelligence?.confidenceSignals?.skippedCount || 0);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-emerald" />
        <h3 className="text-sm font-semibold text-ink-700">Mistake Insights</h3>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Most missed skills</p>
          <p className="mt-1 text-sm text-ink-700">{topSkills.join(', ')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">High-confidence wrong answers</p>
          <p className="mt-1 font-mono text-xl font-semibold text-error-700">{snapshot.highConfidenceWrong}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Repeated error patterns</p>
          <p className="mt-1 text-sm text-ink-700">{clusters[0]?.mistakeName || 'Equivalent fraction misconception'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Skipped questions</p>
          <p className="mt-1 font-mono text-xl font-semibold text-ink-900">{skipped}</p>
        </div>
      </div>
      <p className="mt-4 rounded-xl bg-surface-raised px-4 py-3 text-sm text-ink-700">
        Your student was confident but incorrect on several {snapshot.topSkillName.toLowerCase()} questions. This may indicate a misconception rather than a simple careless mistake.
      </p>
    </Card>
  );
}

function normalizeWorkingEvidence(workingReview = {}) {
  const insights = Array.isArray(workingReview.workingInsights) ? workingReview.workingInsights : [];
  if (insights.length) {
    return insights.slice(0, 5).map((record, index) => {
      const insight = record.workingInsight || {};
      return {
        id: record.workingId || `working-insight-${index}`,
        title: record.skillId ? `${skillLabel(record.skillId)} · ${record.questionId}` : record.questionId || 'Submitted working',
        image: record.rawImage || record.rawImages?.[0] || '',
        ocr: firstNonEmpty(insight.extractedWorkingText, record.ocrOutput?.rawText, 'OCR extraction pending'),
        method: firstNonEmpty(insight.detectedMethod, record.procedureAnalysis?.procedureSummary, record.studentFeedback, 'Method analysis pending'),
        mistakes: [
          insight.detectedIssue,
          insight.misconceptionDetected?.description,
        ].filter(Boolean),
        correct: typeof record.answerCorrect === 'boolean' ? record.answerCorrect : null,
        confidence: record.confidenceLevel || 'Not recorded',
        timeTaken: record.datasetRecord?.outcome?.timeTaken || null,
        status: insight.qualityBand || record.analysisStatus || 'submitted',
        tutorInsight: insight.tutorInsight || record.tutorInsight || null,
      };
    });
  }
  const sessions = Array.isArray(workingReview.workingSessions) ? workingReview.workingSessions : [];
  return sessions.slice(0, 3).map((session, index) => ({
    id: session.workingSessionId || `working-${index}`,
    title: session.title || session.questionTitle || (session.skillIds || []).map(skillLabel).join(', ') || 'Submitted working',
    image: session.workingImage || session.previewUrl || session.imageUrl || session.submittedImage || '',
    ocr: firstNonEmpty(session.ocrText, session.extractedText, session.extractedWorking, session.ocrExtraction, 'OCR extraction pending'),
    method: firstNonEmpty(session.methodAnalysis, session.analysisSummary, session.reasoningSummary, 'Method analysis pending'),
    mistakes: session.identifiedMistakes || session.mistakes || session.mistakeTags || [],
    correct: typeof session.correct === 'boolean' ? session.correct : null,
    confidence: session.confidence || session.confidenceLevel || 'Not recorded',
    timeTaken: session.timeTaken || session.timeTakenSeconds || session.timeMs,
    status: session.status || session.analysisStatus || 'submitted',
  }));
}

function WorkingEvidenceMvp({ workingReview = {} }) {
  const summary = workingReview.summary || {};
  const rows = normalizeWorkingEvidence(workingReview);
  const submittedCount = Number(summary.analysedCount || summary.needsReviewCount || rows.length || 0);
  const noWorkingCount = Number(summary.noWorkingCount || summary.noWorkingDeclarations || summary.pendingUploadCount || 0);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Working Review</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-emerald-deep">Evidence to check before teaching</h3>
        </div>
        <Badge tone={submittedCount ? 'gold' : 'neutral'}>{submittedCount} submitted</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div><p className="text-xs text-ink-500">Working submitted</p><p className="font-mono text-xl text-emerald-deep">{submittedCount}</p></div>
        <div><p className="text-xs text-ink-500">No-working declarations</p><p className="font-mono text-xl text-emerald-deep">{noWorkingCount}</p></div>
        <div><p className="text-xs text-ink-500">Accuracy with working</p><p className="font-mono text-xl text-emerald-deep">{summary.accuracyWithWorking ?? '—'}%</p></div>
        <div><p className="text-xs text-ink-500">Accuracy without working</p><p className="font-mono text-xl text-emerald-deep">{summary.accuracyWithoutWorking ?? '—'}%</p></div>
        <div><p className="text-xs text-ink-500">High-risk no working</p><p className="font-mono text-xl text-error-700">{summary.highRiskNoWorkingCount || 0}</p></div>
      </div>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-line-soft p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="lg:w-48">
                  {row.image ? (
                    <img src={row.image} alt="Submitted working" className="max-h-36 w-full rounded-lg border border-line-soft object-contain" />
                  ) : (
                    <div className="grid h-28 place-items-center rounded-lg border border-dashed border-line-soft bg-surface-raised text-sm text-ink-500">submitted working</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm text-ink-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-800">{row.title}</p>
                    <Badge tone={row.correct === false ? 'error' : row.correct === true ? 'success' : 'neutral'}>{row.correct === false ? 'Incorrect' : row.correct === true ? 'Correct' : row.status}</Badge>
                  </div>
                  <p className="mt-2"><span className="font-semibold">OCR extraction:</span> {row.ocr}</p>
                  <p className="mt-1"><span className="font-semibold">Method analysis:</span> {row.method}</p>
                  {row.tutorInsight && (
                    <p className="mt-1"><span className="font-semibold">Tutor note:</span> {row.tutorInsight.recommendation || row.tutorInsight.summary || row.tutorInsight.message}</p>
                  )}
                  <p className="mt-1"><span className="font-semibold">Identified mistakes:</span> {row.mistakes.length ? row.mistakes.join(', ') : 'None identified yet'}</p>
                  <p className="mt-1 text-ink-500">Confidence: {row.confidence} · Time taken: {row.timeTaken ? `${row.timeTaken}s` : 'Not recorded'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-line-soft bg-surface-raised px-4 py-3 text-sm text-ink-500">
          No working records yet. Once the student submits working, they will appear here for review.
        </p>
      )}
    </Card>
  );
}

function TutorActionsMvp({ id, navigate }) {
  const actions = [
    { label: 'Start Recommended Practice', icon: Target, to: `/tutor/students/${id}/lesson-prep`, disabled: false },
    { label: 'Assign Practice', icon: FileText, to: `/tutor/students/${id}/assign-homework`, disabled: false },
    { label: 'Generate Worksheet', icon: FileText, to: `/tutor/students/${id}/assign-homework?module=Mastery%20Worksheet&worksheetType=intervention`, disabled: false },
    { label: 'Review Working', icon: Eye, to: `/tutor/students/${id}/lesson-notes`, disabled: false },
    { label: 'View Mistakes', icon: AlertTriangle, to: `/tutor/students/${id}/mathpath`, disabled: true },
    { label: 'View Progress', icon: Activity, to: `/tutor/students/${id}`, disabled: false },
  ];

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Suggested Tutor Actions</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={() => !action.disabled && navigate(action.to)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line-soft bg-white px-4 py-3 text-sm font-semibold text-emerald-deep transition hover:border-navy-300 hover:bg-emerald-tint disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-ink-300"
            >
              <Icon className="h-4 w-4" /> {action.label}{action.disabled ? ' (Coming soon)' : ''}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function RecentActivityMvp({ dashboard = {}, workingReview = {} }) {
  const sessions = Array.isArray(workingReview.workingSessions) ? workingReview.workingSessions : [];
  const activities = [
    dashboard.interventionPriorities?.[0] ? { when: 'Today', text: `Priority set for ${skillLabel(dashboard.interventionPriorities[0].skillId).replace(/^F\d{3}\s+/, '')}.` } : null,
    sessions[0] ? { when: formatDate(sessions[0].updatedAt || sessions[0].createdAt || sessions[0].submittedAt), text: 'Submitted working for review.' } : null,
    dashboard.tutorNotes?.currentSkill ? { when: 'Recent', text: `Working on ${skillLabel(dashboard.tutorNotes.currentSkill).replace(/^F\d{3}\s+/, '')}.` } : null,
  ].filter(Boolean).slice(0, 8);

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Recent Learning Activity</p>
      {activities.length ? (
        <div className="mt-3 space-y-2">
          {activities.map((activity, index) => (
            <div key={`${activity.when}-${index}`} className="flex gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm">
              <p className="w-20 shrink-0 font-semibold text-ink-700">{activity.when}</p>
              <p className="text-ink-600">{activity.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">No recent learning activity yet.</p>
      )}
    </Card>
  );
}

const DOMAIN_TAB_OPTIONS = [
  { key: 'fractions', label: 'Fractions' },
  ...CURRICULUM_DOMAINS,
];

function masteryLabel(state) {
  const labels = { mastered: 'Mastered', learning: 'Learning', not_started: 'Not started', weak: 'Weak', needs_review: 'Review' };
  return labels[state] || state || 'Not started';
}

function masteryTone(state) {
  if (state === 'mastered') return 'positive';
  if (state === 'learning') return 'blue';
  if (state === 'weak' || state === 'needs_review') return 'error';
  return 'neutral';
}

function DomainSkillStatesPanel({ skillStates, domainGroup }) {
  if (!skillStates.length) {
    return (
      <Card className="p-5">
        <p className="text-sm text-ink-500">
          No practice data yet for {domainGroup.label}. The student hasn't started this domain.
        </p>
      </Card>
    );
  }

  const byDomain = {};
  skillStates.forEach((s) => {
    if (!byDomain[s.domainId]) byDomain[s.domainId] = [];
    byDomain[s.domainId].push(s);
  });

  return (
    <div className="space-y-4">
      {Object.entries(byDomain).map(([domainId, states]) => (
        <Card key={domainId} className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-700 capitalize">{domainId.replace(/-/g, ' ')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <th className="pb-2 pr-4">Skill</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Accuracy</th>
                  <th className="pb-2 pr-4">Attempts</th>
                  <th className="pb-2">Last practiced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {states.map((s) => {
                  const skill = getSkillFromDomain(domainId, s.skillId);
                  const accuracy = s.attemptCount > 0 ? Math.round((s.correctCount / s.attemptCount) * 100) : null;
                  return (
                    <tr key={s.skillId} className="text-ink-600">
                      <td className="py-2 pr-4">
                        <span className="font-mono text-xs text-ink-400">{s.skillId}</span>
                        {skill && <span className="ml-2 text-ink-700">{skill.name}</span>}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={masteryTone(s.masteryState || s.status)}>{masteryLabel(s.masteryState || s.status)}</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono">{accuracy != null ? `${accuracy}%` : '—'}</td>
                      <td className="py-2 pr-4 font-mono">{s.attemptCount ?? 0}</td>
                      <td className="py-2 text-ink-400">{s.lastPracticedAt ? new Date(s.lastPracticedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
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
  const [diagnosticGrowth, setDiagnosticGrowth] = useState(null);
  const [assigningRecovery, setAssigningRecovery] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [workingReview, setWorkingReview] = useState(null);
  const [fluencySummary, setFluencySummary] = useState(null);
  const [retentionSummary, setRetentionSummary] = useState(null);
  const [activeDomain, setActiveDomain] = useState('fractions');
  const [domainSkillStates, setDomainSkillStates] = useState([]);
  const [domainStatesLoading, setDomainStatesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentRes, masteryRes, latestRes, growthRes, workingRes, fluencyRes, retentionRes] = await Promise.all([
        tutorAPI.student(id),
        mathpathAPI.mastery({ studentId: id }),
        mathpathAPI.getLatestDiagnostic({ studentId: id }),
        mathpathAPI.getDiagnosticGrowth({ studentId: id }),
        mathpathAPI.workingReviewSummary({ studentId: id }),
        mathpathAPI.fluency(id),
        mathpathAPI.retention(id),
      ]);
      const studentPayload = studentRes?.data || {};
      const masteryPayload = masteryRes?.data || {};
      const workingPayload = workingRes?.data || {};
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
        workingAnalysisSummary: workingPayload.summary || {},
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
        workingAnalysisSummary: pipeline.working?.summary || workingPayload.summary || {},
        workingSessions: workingPayload.workingSessions || [],
        helpRequests: workingPayload.helpRequests || [],
      });
      setDashboard(tutorDashboard);
      setPlacement(latestRes?.data?.result || null);
      setDiagnosticGrowth(growthRes?.data || null);
      setWorkingReview(workingPayload || null);
      setFluencySummary(fluencyRes?.data || null);
      setRetentionSummary(retentionRes?.data || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not load tutor MathPath dashboard.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const assignRecoveryPack = useCallback(async () => {
    const diagnosticSessionId = diagnosticGrowth?.latest?.diagnosticSessionId || diagnosticGrowth?.baseline?.diagnosticSessionId;
    if (!diagnosticSessionId) {
      setAssignmentMessage('Complete a diagnostic before assigning a Recovery Pack.');
      return;
    }
    setAssigningRecovery(true);
    setAssignmentMessage('');
    try {
      await mathpathAPI.createAssignmentFromDiagnostic({ studentId: id, diagnosticSessionId, assignedByRole: 'tutor' });
      setAssignmentMessage('Recovery Pack assigned.');
    } catch (err) {
      setAssignmentMessage(err?.response?.data?.error || 'Could not assign Recovery Pack.');
    } finally {
      setAssigningRecovery(false);
    }
  }, [diagnosticGrowth, id]);

  const loadDomainSkillStates = useCallback(async (domainGroup) => {
    setDomainStatesLoading(true);
    try {
      const res = await mathpathAPI.getSkillStates(id, domainGroup.domainIds);
      setDomainSkillStates(res?.data?.skillStates || []);
    } catch {
      setDomainSkillStates([]);
    } finally {
      setDomainStatesLoading(false);
    }
  }, [id]);

  const handleDomainChange = useCallback((key) => {
    setActiveDomain(key);
    if (key !== 'fractions') {
      const group = CURRICULUM_DOMAINS.find((d) => d.key === key);
      if (group) loadDomainSkillStates(group);
    }
  }, [loadDomainSkillStates]);

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
  const snapshot = deriveTutorSnapshot({
    dashboard,
    placement,
    workingReview: workingReview || {},
    studentName: studentMeta?.name || 'Student',
  });

  return (
    <>
      <TutorStudentNav studentId={id} name={studentMeta?.name || 'Student'} level={studentMeta?.level} />
      <PageHeader
        title="Tutor MathPath Dashboard"
        subtitle="Student progress by curriculum domain — root causes, fluency, retention, and session planning."
        action={activeDomain === 'fractions' ? <Button icon={primary.icon} onClick={() => navigate(primary.to)}>{primary.label}</Button> : null}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Select domain">
        {DOMAIN_TAB_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            role="tab"
            aria-selected={activeDomain === opt.key}
            onClick={() => handleDomainChange(opt.key)}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              activeDomain === opt.key
                ? 'bg-navy-700 text-white'
                : 'border border-hairline bg-white text-ink-600 hover:border-navy-300 hover:text-navy-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {activeDomain !== 'fractions' ? (
        <div className="space-y-4">
          {domainStatesLoading ? (
            <Spinner label={`Loading ${CURRICULUM_DOMAINS.find((d) => d.key === activeDomain)?.label} data…`} />
          ) : (
            <DomainSkillStatesPanel
              skillStates={domainSkillStates}
              domainGroup={CURRICULUM_DOMAINS.find((d) => d.key === activeDomain)}
            />
          )}
        </div>
      ) : (
      <>
      {!!placement?.recommendedStartingSkill?.name && (
        <Card className="mb-4 p-4">
          <p className="text-sm text-ink-600">
            Latest placement: start at <span className="font-semibold text-ink-700">{placement.recommendedStartingSkill.name}</span>.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        <DiagnosticGrowthCard
          growth={diagnosticGrowth}
          onViewHistory={() => navigate(`/tutor/students/${id}/mathpath`)}
          onRunRecheck={() => navigate('/student/mathpath/diagnostic', { state: { diagnosticPurpose: 'recheck' } })}
          onAssignRecovery={assignRecoveryPack}
          assigningRecovery={assigningRecovery}
          assignmentMessage={assignmentMessage}
        />
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4" aria-label="Student learning snapshot">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Current Domain</p>
            <p className="mt-2 text-lg font-semibold text-emerald-deep">{snapshot.currentDomain}</p>
            <p className="mt-1 text-sm text-ink-500">Working on {snapshot.currentSkill}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Progress</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-deep">{snapshot.masteredCount}/{snapshot.totalSkills}</p>
            <p className="mt-1 text-sm text-ink-500">skills mastered</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Accuracy This Week</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-deep">{snapshot.accuracy}%</p>
            <p className="mt-1 text-sm text-ink-500">{snapshot.questionsThisWeek} questions answered</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Working Submission Rate</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-emerald-deep">{snapshot.workingRate}%</p>
            <p className="mt-1 text-sm text-ink-500">{snapshot.highConfidenceWrong} confidence risk{snapshot.highConfidenceWrong === 1 ? '' : 's'}</p>
          </Card>
        </section>

        <TutorIntelligenceCard insight={dashboard.tutorIntelligenceInsight || {}} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <InterventionQueueCard priorities={dashboard.interventionPriorities || []} snapshot={snapshot} />
          <SessionRecommendationsMvp plan={dashboard.nextSessionPlan || {}} snapshot={snapshot} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MistakeInsightsMvp dashboard={dashboard} snapshot={snapshot} />
          <TutorFluencyInsightCard fluency={fluencySummary || {}} retention={retentionSummary || {}} />
          <RecentActivityMvp dashboard={dashboard} workingReview={workingReview || {}} />
        </div>

        <WorkingEvidenceMvp workingReview={workingReview || {}} />
        <TutorActionsMvp id={id} navigate={navigate} />

        <TutorOverviewCard studentName={studentMeta?.name || 'Student'} dashboard={dashboard} currentSkill={dashboard.tutorNotes?.currentSkill} />
        <AdultWorkingReviewPanel review={workingReview || {}} title="Working Review Queue" />

        <CollapsibleSection
          title="Intervention details"
          summary="Root causes, mistake clusters, fluency, retention, working quality, and next session plan."
          surface={false}
          action={FEATURE_FLAGS.assessments ? <Button size="s" variant="secondary" onClick={() => navigate(`/tutor/students/${id}/mathpath/test-spec`)}>School Test</Button> : null}
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
      )}
    </>
  );
}
