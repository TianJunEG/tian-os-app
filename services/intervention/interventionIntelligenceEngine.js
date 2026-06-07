import InterventionRecommendation from '../../models/InterventionRecommendation.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathWorkingIntelligence from '../../models/mathpath/MathPathWorkingIntelligence.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import {
  buildDiagnosticGrowth,
  getDiagnosticHistory,
} from '../diagnostics/diagnosticGrowthService.js';
import { evaluateStudentReadiness } from './readinessEngine.js';
import mongoose from 'mongoose';

const ACTION_LABELS = {
  assign_recovery_pack: 'Assign Recovery Pack',
  generate_worksheet: 'Generate Worksheet',
  run_recheck: 'Run Recheck',
  review_working: 'Review Working',
  tutor_support: 'Tutor Support Recommended',
  continue_practice: 'Continue Practice',
  advance_skill: 'Advance Skill',
};

const ACTIONS = Object.keys(ACTION_LABELS);
const STALE_ACTIVITY_DAYS = 10;
const LOW_DIAGNOSTIC_SCORE = 60;
const LOW_ASSIGNMENT_ACCURACY = 70;
const CONFIDENCE_MISMATCH_GAP = 25;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value, dp = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysSince(value, now = new Date()) {
  const date = asDate(value);
  if (!date) return null;
  return Math.floor((new Date(now) - date) / 86400000);
}

function priorityBand(score) {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function objectIdOrNull(value) {
  const id = String(value || '');
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
}

function evidenceItem(type, weight, reason, data = {}) {
  return {
    type,
    weight,
    reason,
    ...data,
  };
}

function addEvidence(map, skillId, item) {
  const key = String(skillId || '').toUpperCase();
  if (!key) return;
  if (!map.has(key)) {
    map.set(key, {
      skillId: key,
      score: 0,
      evidence: [],
      misconceptionTags: [],
      latestActivityAt: null,
    });
  }
  const row = map.get(key);
  row.score += num(item.weight);
  row.evidence.push(item);
  if (item.misconceptionTags) row.misconceptionTags.push(...item.misconceptionTags);
  const activityAt = asDate(item.activityAt);
  if (activityAt && (!row.latestActivityAt || activityAt > row.latestActivityAt)) row.latestActivityAt = activityAt;
}

function latestActivity({ growth = {}, assignments = [], papers = [], mistakes = [], workings = [] } = {}) {
  return [
    growth.latest?.completedAt,
    ...assignments.map((item) => item.updatedAt || item.createdAt),
    ...papers.map((item) => item.reviewedAt || item.updatedAt || item.createdAt),
    ...mistakes.map((item) => item.lastSeenAt || item.updatedAt || item.createdAt),
    ...workings.map((item) => item.updatedAt || item.createdAt || item.submittedAt),
  ].map(asDate).filter(Boolean).sort((a, b) => b - a)[0] || null;
}

function assignmentCompletionSummary(assignment = {}) {
  const completion = assignment.completion || {};
  const attempted = num(completion.questionsAttempted);
  const target = num(assignment.targetQuestionCount || completion.questionsAssigned);
  const accuracy = num(completion.accuracy);
  return { attempted, target, accuracy };
}

function workingQualityPenalty(working = {}) {
  const band = String(working.workingQualityEnhanced?.qualityBand || working.qualityBand || '').toUpperCase();
  if (band === 'INSUFFICIENT') return 24;
  if (band === 'PARTIAL') return 16;
  if (working.reviewStatus === 'pending' || working.humanReviewStatus === 'pending') return 8;
  if (working.procedureAnalysis || working.misconceptionDetection || working.tutorInsight || working.teacherInsight) return 12;
  return 0;
}

export function auditDecisionLogic() {
  return {
    duplicatedDecisionLogic: [
      'Parent recommendations, tutor lesson prep, student-care queues, pilot intervention metrics and weak-group logic each score weak skills independently.',
      'Paper analysis and assignment services both emit intervention-like recommendations before a shared next-action service exists.',
    ],
    hardcodedThresholds: [
      'Recheck readiness uses 80% completion and 70% accuracy.',
      'Tutor lesson prep treats Recovery Pack accuracy below 70% as a focus signal.',
      'Diagnostic growth surfaces treat scores below roughly 60% as remaining weak skills.',
    ],
    conflictingRecommendations: [
      'A student can receive continue-practice, recheck-ready and tutor-support messages from different surfaces without a single priority order.',
      'Paper-analysis recommendations are intentionally review-gated, while older parent recommendations can still point directly to assignment actions from weaker evidence.',
    ],
    recommendation: 'Use interventionIntelligenceEngine as the shared decision layer and keep role-specific surfaces as presentation layers.',
  };
}

export function buildSkillPriorityRows({
  growth = {},
  assignments = [],
  papers = [],
  mistakes = [],
  workings = [],
  now = new Date(),
} = {}) {
  const bySkill = new Map();
  const latestSnapshotBySkill = new Map((growth.latest?.perSkillSnapshot || []).map((row) => [String(row.skillId || '').toUpperCase(), row]));

  for (const row of growth.perSkillGrowth || []) {
    const currentScore = row.currentScore === null || row.currentScore === undefined ? null : num(row.currentScore);
    if (currentScore !== null && currentScore < LOW_DIAGNOSTIC_SCORE) {
      addEvidence(bySkill, row.skillId, evidenceItem(
        'diagnostic_weakness',
        clamp((LOW_DIAGNOSTIC_SCORE - currentScore) * 0.8 + 22, 20, 55),
        `${row.skillId} is at ${currentScore}% diagnostic readiness.`,
        { currentScore, beforeScore: row.beforeScore, improvement: row.improvement, activityAt: growth.latest?.completedAt }
      ));
    }
    if (row.improvement !== null && row.improvement !== undefined && num(row.improvement) <= 0) {
      addEvidence(bySkill, row.skillId, evidenceItem(
        'recheck_performance',
        18,
        `${row.skillId} did not improve after the latest diagnostic comparison.`,
        { improvement: row.improvement, activityAt: growth.latest?.completedAt }
      ));
    }
    const snapshot = latestSnapshotBySkill.get(String(row.skillId || '').toUpperCase()) || {};
    const confidenceScore = num(row.confidenceScore ?? row.latestConfidenceScore ?? snapshot.confidenceScore, null);
    if (currentScore !== null && confidenceScore !== null && confidenceScore - currentScore >= CONFIDENCE_MISMATCH_GAP) {
      addEvidence(bySkill, row.skillId, evidenceItem(
        'confidence_mismatch',
        14,
        `${row.skillId} shows confidence higher than performance.`,
        { confidenceScore, currentScore, activityAt: growth.latest?.completedAt }
      ));
    }
  }

  for (const skillId of growth.remainingWeakSkills || []) {
    addEvidence(bySkill, skillId, evidenceItem(
      'diagnostic_weakness',
      28,
      `${skillId} is still listed as a remaining weak skill.`,
      { activityAt: growth.latest?.completedAt }
    ));
  }

  for (const paper of papers || []) {
    const confirmedWrong = (paper.detectedQuestions || []).filter((question) => question.adultConfirmedWrong);
    for (const skillId of paper.weakSkillIds || []) {
      addEvidence(bySkill, skillId, evidenceItem(
        'paper_analysis_weakness',
        paper.status === 'reviewed' || paper.status === 'assigned' ? 26 : 12,
        `Paper analysis confirmed weakness in ${skillId}.`,
        {
          paperAnalysisId: String(paper._id || paper.id || ''),
          status: paper.status,
          activityAt: paper.reviewedAt || paper.updatedAt || paper.createdAt,
          misconceptionTags: confirmedWrong.flatMap((question) => question.misconceptionTags || []),
        }
      ));
    }
  }

  for (const assignment of assignments || []) {
    const { attempted, target, accuracy } = assignmentCompletionSummary(assignment);
    for (const skillId of assignment.skillIds || []) {
      if (['assigned', 'in_progress'].includes(assignment.status)) {
        addEvidence(bySkill, skillId, evidenceItem(
          'assignment_performance',
          assignment.status === 'assigned' ? 14 : 10,
          `${assignment.title || 'Recovery Pack'} is still ${assignment.status.replace('_', ' ')}.`,
          { assignmentId: String(assignment._id || assignment.id || ''), attempted, target, accuracy, activityAt: assignment.updatedAt || assignment.createdAt }
        ));
      }
      if (assignment.status === 'completed' && accuracy < LOW_ASSIGNMENT_ACCURACY) {
        addEvidence(bySkill, skillId, evidenceItem(
          'assignment_performance',
          24,
          `${assignment.title || 'Recovery Pack'} finished at ${accuracy}% accuracy.`,
          { assignmentId: String(assignment._id || assignment.id || ''), attempted, target, accuracy, activityAt: assignment.updatedAt || assignment.createdAt }
        ));
      }
      if (assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId) {
        addEvidence(bySkill, skillId, evidenceItem(
          'recheck_performance',
          20,
          `${assignment.title || 'Recovery Pack'} is ready for recheck.`,
          { assignmentId: String(assignment._id || assignment.id || ''), activityAt: assignment.recheck?.recommendedAt || assignment.updatedAt || assignment.createdAt }
        ));
      }
    }
  }

  for (const mistake of mistakes || []) {
    const frequency = num(mistake.frequency, 1);
    const weight = mistake.severity === 'high' ? 28 : frequency >= 3 ? 24 : 14;
    addEvidence(bySkill, mistake.skillId, evidenceItem(
      'misconception_frequency',
      weight,
      `${mistake.mistakeName || mistake.mistakeCode || 'Misconception'} appeared ${frequency} time(s).`,
      {
        mistakeCode: mistake.mistakeCode || '',
        frequency,
        severity: mistake.severity || 'medium',
        activityAt: mistake.lastSeenAt || mistake.updatedAt || mistake.createdAt,
      }
    ));
  }

  for (const working of workings || []) {
    const weight = workingQualityPenalty(working);
    if (!weight) continue;
    addEvidence(bySkill, working.skillId || working.skillCode, evidenceItem(
      'working_evidence_quality',
      weight,
      'Working evidence suggests method quality needs review.',
      {
        workingId: working.workingId || String(working._id || ''),
        qualityBand: working.workingQualityEnhanced?.qualityBand || working.qualityBand || '',
        activityAt: working.updatedAt || working.createdAt || working.submittedAt,
      }
    ));
  }

  const latest = latestActivity({ growth, assignments, papers, mistakes, workings });
  const inactiveDays = daysSince(latest, now);
  if (inactiveDays !== null && inactiveDays >= STALE_ACTIVITY_DAYS) {
    const fallbackSkill = bySkill.keys().next().value || growth.remainingWeakSkills?.[0] || '';
    addEvidence(bySkill, fallbackSkill, evidenceItem(
      'time_since_last_activity',
      clamp(inactiveDays, 10, 24),
      `No recent MathPath activity for ${inactiveDays} days.`,
      { inactiveDays, activityAt: latest }
    ));
  }

  return [...bySkill.values()]
    .map((row) => ({
      ...row,
      priorityScore: clamp(round(row.score)),
      evidence: row.evidence.sort((a, b) => num(b.weight) - num(a.weight)),
      misconceptionTags: unique(row.misconceptionTags),
      latestActivityAt: row.latestActivityAt,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function action(action, { skillId = '', priorityScore = 0, confidence = 0.7, evidence = [], target = null, reason = '' } = {}) {
  const reasons = unique([
    reason,
    ...evidence.slice(0, 4).map((item) => item.reason),
  ]);
  return {
    action,
    type: action,
    title: ACTION_LABELS[action],
    targetSkillId: skillId,
    targetSkillIds: unique([skillId]),
    priorityScore: clamp(priorityScore),
    priority: priorityBand(priorityScore),
    confidence,
    evidence: evidence.slice(0, 6),
    reasons,
    why: reasons,
    target,
  };
}

export function buildRecommendedActions({
  priorityRows = [],
  readiness = {},
  assignments = [],
  papers = [],
  growth = {},
} = {}) {
  const actions = [];
  const top = priorityRows[0] || null;
  const activeAssignment = assignments.find((assignment) => ['assigned', 'in_progress'].includes(assignment.status));
  const paperNeedsReview = papers.find((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'skills_mapped', 'needs_review'].includes(paper.status));

  if (readiness.recheck?.ready) {
    const ready = readiness.recheck.readyAssignments[0];
    actions.push(action('run_recheck', {
      skillId: ready?.skillIds?.[0] || top?.skillId || '',
      priorityScore: Math.max(82, top?.priorityScore || 0),
      confidence: 0.9,
      evidence: top?.evidence || [],
      target: ready,
      reason: ready?.reason || 'Recovery Pack is ready for recheck.',
    }));
  }

  if (top && !activeAssignment && !readiness.recheck?.ready) {
    actions.push(action('assign_recovery_pack', {
      skillId: top.skillId,
      priorityScore: top.priorityScore,
      confidence: top.priorityScore >= 65 ? 0.82 : 0.68,
      evidence: top.evidence,
      reason: `${top.skillId} is the highest-priority skill from combined evidence.`,
    }));
  }

  if (top && top.evidence.some((item) => item.type === 'paper_analysis_weakness' || item.type === 'assignment_performance')) {
    actions.push(action('generate_worksheet', {
      skillId: top.skillId,
      priorityScore: clamp(top.priorityScore - 8),
      confidence: 0.72,
      evidence: top.evidence,
      reason: 'A short worksheet can reinforce the current intervention target.',
    }));
  }

  if (top && top.evidence.some((item) => item.type === 'working_evidence_quality' || item.type === 'confidence_mismatch')) {
    actions.push(action('review_working', {
      skillId: top.skillId,
      priorityScore: clamp(top.priorityScore - 4),
      confidence: 0.76,
      evidence: top.evidence,
      reason: 'Working evidence or confidence calibration needs adult review.',
    }));
  }

  if (top && top.evidence.some((item) => item.type === 'misconception_frequency' && (num(item.frequency) >= 3 || item.severity === 'high'))) {
    actions.push(action('tutor_support', {
      skillId: top.skillId,
      priorityScore: clamp(top.priorityScore - 2),
      confidence: 0.7,
      evidence: top.evidence,
      reason: 'Repeated misconception evidence suggests live explanation may help.',
    }));
  }

  if (activeAssignment && !readiness.recheck?.ready) {
    const { attempted, target, accuracy } = assignmentCompletionSummary(activeAssignment);
    actions.push(action('continue_practice', {
      skillId: activeAssignment.skillIds?.[0] || top?.skillId || '',
      priorityScore: Math.max(45, top?.priorityScore || 0),
      confidence: 0.8,
      evidence: top?.evidence || [],
      target: { assignmentId: String(activeAssignment._id || activeAssignment.id || ''), attempted, target, accuracy },
      reason: `${activeAssignment.title || 'Recovery Pack'} is still in progress.`,
    }));
  }

  if (readiness.advancement?.ready || readiness.enrichment?.ready) {
    actions.push(action('advance_skill', {
      skillId: growth.latest?.masteredSkillIds?.[0] || '',
      priorityScore: readiness.enrichment?.ready ? 70 : 62,
      confidence: readiness.enrichment?.ready ? 0.88 : 0.78,
      evidence: [],
      reason: readiness.enrichment?.ready
        ? 'Latest evidence supports enrichment.'
        : 'Latest evidence supports moving to the next skill.',
    }));
  }

  if (!actions.length && paperNeedsReview) {
    actions.push(action('review_working', {
      skillId: paperNeedsReview.weakSkillIds?.[0] || '',
      priorityScore: 48,
      confidence: 0.62,
      reason: 'Uploaded paper needs adult review before intervention.',
      target: { paperAnalysisId: String(paperNeedsReview._id || paperNeedsReview.id || '') },
    }));
  }

  return actions
    .filter((item) => ACTIONS.includes(item.action))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);
}

export function buildInterventionIntelligence({
  studentId,
  subjectId = 'math',
  domainId = 'fractions',
  growth = {},
  assignments = [],
  papers = [],
  mistakes = [],
  workings = [],
  now = new Date(),
} = {}) {
  const priorityRows = buildSkillPriorityRows({ growth, assignments, papers, mistakes, workings, now });
  const readiness = evaluateStudentReadiness({ growth, assignments });
  const recommendedActions = buildRecommendedActions({ priorityRows, readiness, assignments, papers, growth });
  const top = priorityRows[0] || null;
  const lastActivityAt = latestActivity({ growth, assignments, papers, mistakes, workings });
  const confidence = recommendedActions.length
    ? round(recommendedActions.reduce((sum, item) => sum + num(item.confidence), 0) / recommendedActions.length, 2)
    : 0.45;

  return {
    studentId: String(studentId || ''),
    subjectId,
    domainId,
    currentStatus: {
      latestReadiness: growth.latest?.readinessScore ?? null,
      baselineReadiness: growth.baseline?.readinessScore ?? null,
      overallImprovement: growth.overallImprovement ?? null,
      remainingWeakSkills: growth.remainingWeakSkills || [],
      activeAssignmentCount: assignments.filter((assignment) => ['assigned', 'in_progress'].includes(assignment.status)).length,
      paperReviewNeededCount: papers.filter((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'skills_mapped', 'needs_review'].includes(paper.status)).length,
      lastActivityAt,
      readiness,
    },
    interventionPriority: {
      priorityScore: top?.priorityScore || 0,
      priority: priorityBand(top?.priorityScore || 0),
      topSkillId: top?.skillId || '',
      priorityRows: priorityRows.slice(0, 5),
    },
    recommendedActions,
    supportingEvidence: {
      topSkill: top,
      diagnosticGrowth: {
        baseline: growth.baseline || null,
        latest: growth.latest || null,
        overallImprovement: growth.overallImprovement ?? null,
      },
      readiness,
      audit: auditDecisionLogic(),
    },
    confidence,
  };
}

export async function collectInterventionEvidence({ studentId, subjectId = 'math', domainId = 'fractions' } = {}) {
  const [history, assignments, papers, mistakes, workings] = await Promise.all([
    getDiagnosticHistory({ studentId, subjectId, domainId }),
    MathPathAssignment.find({ studentId: String(studentId), subjectId, domainId }).sort({ updatedAt: -1, createdAt: -1 }).limit(30).lean(),
    PaperAnalysis.find({ studentId: String(studentId), subjectId, domainId }).sort({ updatedAt: -1, createdAt: -1 }).limit(20).lean(),
    MathPathMistakeRecord.find({ studentId: String(studentId), domainId }).sort({ lastSeenAt: -1, updatedAt: -1 }).limit(40).lean(),
    MathPathWorkingIntelligence.find({ studentId: String(studentId) }).sort({ updatedAt: -1, createdAt: -1 }).limit(30).lean(),
  ]);
  return {
    history,
    growth: { ...buildDiagnosticGrowth(history), history },
    assignments,
    papers,
    mistakes,
    workings,
  };
}

export async function getInterventionIntelligence({ studentId, subjectId = 'math', domainId = 'fractions', persist = false } = {}) {
  const evidence = await collectInterventionEvidence({ studentId, subjectId, domainId });
  const intelligence = buildInterventionIntelligence({ studentId, subjectId, domainId, ...evidence });
  if (persist) {
    const persisted = await persistInterventionRecommendations({ intelligence, studentId, subjectId, domainId });
    return { ...intelligence, persistedRecommendations: persisted };
  }
  return intelligence;
}

export async function persistInterventionRecommendations({ intelligence, studentId, subjectId = 'math', domainId = 'fractions' } = {}) {
  const docs = [];
  for (const rec of intelligence.recommendedActions || []) {
    const doc = await InterventionRecommendation.create({
      studentId,
      subjectId,
      domainId,
      interventionAction: rec.action,
      priorityScore: rec.priorityScore,
      confidence: rec.confidence,
      priority: rec.priority,
      isReady: rec.action === 'run_recheck' || rec.action === 'advance_skill',
      recommendationPayload: rec,
      supportingEvidence: rec.evidence,
      reasons: rec.reasons,
      targetSkillIds: rec.targetSkillIds,
      assignmentId: objectIdOrNull(rec.target?.assignmentId),
      paperAnalysisId: objectIdOrNull(rec.target?.paperAnalysisId),
    });
    docs.push(doc);
  }
  return docs;
}

export function buildInterventionEffectivenessStats(recommendations = []) {
  const byAction = new Map();
  for (const rec of recommendations || []) {
    const actionName = rec.interventionAction || rec.action || rec.type || 'unknown';
    if (!byAction.has(actionName)) {
      byAction.set(actionName, {
        interventionAction: actionName,
        assignedCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        improvedCount: 0,
        declinedCount: 0,
        totalMetricDelta: 0,
        metricDeltaCount: 0,
      });
    }
    const row = byAction.get(actionName);
    row.assignedCount += 1;
    if (rec.status === 'accepted') row.acceptedCount += 1;
    if (rec.status === 'rejected') row.rejectedCount += 1;
    if (rec.outcome?.outcomeType === 'improved') row.improvedCount += 1;
    if (rec.outcome?.outcomeType === 'declined') row.declinedCount += 1;
    const delta = num(rec.outcome?.metricDelta, NaN);
    if (Number.isFinite(delta)) {
      row.totalMetricDelta += delta;
      row.metricDeltaCount += 1;
    }
  }

  return [...byAction.values()].map((row) => ({
    ...row,
    successRate: row.assignedCount ? round((row.improvedCount / row.assignedCount) * 100) : 0,
    averageMetricDelta: row.metricDeltaCount ? round(row.totalMetricDelta / row.metricDeltaCount) : null,
  })).sort((a, b) => b.successRate - a.successRate || b.assignedCount - a.assignedCount);
}

export async function getInterventionEffectiveness({ subjectId = 'math', domainId = 'fractions' } = {}) {
  const recommendations = await InterventionRecommendation.find({ subjectId, domainId }).lean();
  return buildInterventionEffectivenessStats(recommendations);
}

export default {
  auditDecisionLogic,
  buildSkillPriorityRows,
  buildRecommendedActions,
  buildInterventionIntelligence,
  collectInterventionEvidence,
  getInterventionIntelligence,
  persistInterventionRecommendations,
  buildInterventionEffectivenessStats,
  getInterventionEffectiveness,
};
