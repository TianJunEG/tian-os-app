import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';

const CONFIDENCE_SCORE = {
  i_know_this: 1,
  confident: 0.85,
  not_sure: 0.5,
  unsure: 0.5,
  i_dont_know: 0.2,
  i_need_help: 0.1,
};

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, dp = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

function skillNameFor(skillId, skillsByFrameworkId) {
  const skill = skillsByFrameworkId?.get?.(String(skillId || '').toUpperCase());
  return skill?.name || skill?.title || skill?.metadata?.title || '';
}

function confidenceValue(value) {
  const key = String(value || '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(CONFIDENCE_SCORE, key)) return CONFIDENCE_SCORE[key];
  return null;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function buildPerSkillSnapshot({ responses = [], skillsByFrameworkId = null } = {}) {
  const bySkill = new Map();
  for (const response of responses || []) {
    const skillId = String(response.skillId || '').toUpperCase();
    if (!skillId) continue;
    if (!bySkill.has(skillId)) {
      bySkill.set(skillId, {
        skillId,
        skillName: skillNameFor(skillId, skillsByFrameworkId),
        questionsAnswered: 0,
        correctCount: 0,
        timeTakenValues: [],
        confidenceValues: [],
        workingSubmittedCount: 0,
        misconceptionTags: [],
        evidenceQuestionIds: [],
      });
    }
    const row = bySkill.get(skillId);
    row.questionsAnswered += 1;
    if (response.correct) row.correctCount += 1;
    const ms = toNum(response.timeTakenMs ?? response.responseMs, NaN);
    if (Number.isFinite(ms) && ms > 0) row.timeTakenValues.push(ms / 1000);
    const cv = confidenceValue(response.confidence);
    if (cv !== null) row.confidenceValues.push(cv);
    if (response.workingSubmitted) row.workingSubmittedCount += 1;
    row.misconceptionTags.push(...(Array.isArray(response.detectedErrorTags) ? response.detectedErrorTags : []));
    if (response.questionId) row.evidenceQuestionIds.push(String(response.questionId));
  }

  return [...bySkill.values()].map((row) => ({
    skillId: row.skillId,
    skillName: row.skillName,
    questionsAnswered: row.questionsAnswered,
    correctCount: row.correctCount,
    score: row.questionsAnswered ? round((row.correctCount / row.questionsAnswered) * 100) : 0,
    confidenceScore: row.confidenceValues.length
      ? round((row.confidenceValues.reduce((sum, n) => sum + n, 0) / row.confidenceValues.length) * 100)
      : null,
    averageTimeTaken: row.timeTakenValues.length
      ? round(row.timeTakenValues.reduce((sum, n) => sum + n, 0) / row.timeTakenValues.length)
      : null,
    workingSubmittedRate: row.questionsAnswered ? round((row.workingSubmittedCount / row.questionsAnswered) * 100) : 0,
    misconceptionTags: unique(row.misconceptionTags),
    evidenceQuestionIds: unique(row.evidenceQuestionIds),
  }));
}

export async function resolveDiagnosticLineage({
  studentId,
  subjectId = 'math',
  domainId = 'fractions',
  diagnosticSessionId = '',
} = {}) {
  const completed = await MathPathDiagnosticSession.find({
    studentId: String(studentId),
    subjectId,
    domainId,
    status: 'completed',
  }).sort({ completedAt: 1, createdAt: 1 }).lean();

  const baseline = completed.find((session) => session.isBaseline)
    || completed.find((session) => session.diagnosticPurpose === 'baseline')
    || completed[0]
    || null;
  const previous = [...completed].reverse()
    .find((session) => String(session.diagnosticSessionId) !== String(diagnosticSessionId))
    || null;

  return {
    baselineDiagnosticId: baseline?.diagnosticSessionId || diagnosticSessionId,
    previousDiagnosticId: previous?.diagnosticSessionId || '',
    attemptNumber: completed.length + 1,
    isBaseline: !baseline,
  };
}

export async function applyDiagnosticCompletionMetadata(session, { responses = [], skillsByFrameworkId = null } = {}) {
  const lineage = await resolveDiagnosticLineage({
    studentId: session.studentId,
    subjectId: session.subjectId || 'math',
    domainId: session.domainId || 'fractions',
    diagnosticSessionId: session.diagnosticSessionId,
  });
  session.attemptNumber = session.attemptNumber || lineage.attemptNumber;
  // Baseline is defined by first completed diagnostic, not first started diagnostic.
  // A provisional baseline session can be abandoned while another diagnostic completes first.
  session.isBaseline = Boolean(lineage.isBaseline);
  session.baselineDiagnosticId = session.isBaseline
    ? session.diagnosticSessionId
    : lineage.baselineDiagnosticId;
  session.previousDiagnosticId = lineage.previousDiagnosticId;
  session.perSkillSnapshot = buildPerSkillSnapshot({ responses, skillsByFrameworkId });
  return session;
}

function shapeDiagnosticHistoryItem(session = {}) {
  const result = session.result || {};
  const snapshot = Array.isArray(session.perSkillSnapshot) ? session.perSkillSnapshot : [];
  return {
    diagnosticSessionId: session.diagnosticSessionId,
    diagnosticPurpose: session.diagnosticPurpose || result.diagnosticPurpose || 'baseline',
    attemptNumber: toNum(session.attemptNumber, 1),
    isBaseline: Boolean(session.isBaseline),
    baselineDiagnosticId: session.baselineDiagnosticId || '',
    previousDiagnosticId: session.previousDiagnosticId || '',
    startedAt: session.startedAt || session.createdAt || null,
    completedAt: session.completedAt || null,
    readinessScore: toNum(session.readinessScore ?? result.overallFractionReadinessScore, 0),
    totalQuestions: toNum(result.totalQuestions ?? result.questionsAnswered ?? session.adaptiveState?.responses?.length, 0),
    correctCount: toNum(result.questionsCorrect ?? result.correctCount, 0),
    weakSkillIds: unique((result.weakSkills || result.weakSkillIds || []).map((item) => item.skillId || item)),
    masteredSkillIds: unique((result.masteredSkills || result.masteredSkillIds || []).map((item) => item.skillId || item)),
    perSkillSnapshot: snapshot,
  };
}

export async function getDiagnosticHistory({
  studentId,
  subjectId = 'math',
  domainId = 'fractions',
} = {}) {
  const sessions = await MathPathDiagnosticSession.find({
    studentId: String(studentId),
    subjectId,
    domainId,
    status: 'completed',
  }).sort({ completedAt: 1, createdAt: 1 }).lean();

  return sessions.map(shapeDiagnosticHistoryItem);
}

function trendForSkill({ baselineRows = [], previousRows = [], latestRows = [] } = {}) {
  const ids = unique([
    ...baselineRows.map((row) => row.skillId),
    ...previousRows.map((row) => row.skillId),
    ...latestRows.map((row) => row.skillId),
  ]);
  const by = (rows) => new Map(rows.map((row) => [row.skillId, row]));
  const baseline = by(baselineRows);
  const previous = by(previousRows);
  const latest = by(latestRows);

  return ids.map((skillId) => {
    const beforeRow = baseline.get(skillId) || previous.get(skillId) || null;
    const currentRow = latest.get(skillId) || null;
    const beforeScore = beforeRow ? toNum(beforeRow.score, 0) : null;
    const currentScore = currentRow ? toNum(currentRow.score, 0) : null;
    const improvement = beforeScore === null || currentScore === null ? null : round(currentScore - beforeScore);
    return {
      skillId,
      skillName: currentRow?.skillName || beforeRow?.skillName || '',
      beforeScore,
      currentScore,
      improvement,
      status: improvement === null ? 'insufficient_data' : improvement > 0 ? 'improved' : improvement < 0 ? 'declined' : 'unchanged',
    };
  });
}

function average(rows = [], key) {
  const values = rows.map((row) => toNum(row?.[key], NaN)).filter(Number.isFinite);
  if (!values.length) return null;
  return round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

export function buildDiagnosticGrowth(history = []) {
  const completed = [...(history || [])].sort((a, b) => new Date(a.completedAt || 0) - new Date(b.completedAt || 0));
  const baseline = completed.find((session) => session.isBaseline) || completed[0] || null;
  const latest = completed[completed.length - 1] || null;
  const previous = completed.length > 1 ? completed[completed.length - 2] : null;

  const perSkillGrowth = trendForSkill({
    baselineRows: baseline?.perSkillSnapshot || [],
    previousRows: previous?.perSkillSnapshot || [],
    latestRows: latest?.perSkillSnapshot || [],
  });
  const remainingWeakSkills = unique([
    ...(latest?.weakSkillIds || []),
    ...perSkillGrowth.filter((row) => row.currentScore !== null && row.currentScore < 60).map((row) => row.skillId),
  ]);

  return {
    baseline,
    latest,
    previous,
    overallImprovement: baseline && latest ? round(toNum(latest.readinessScore, 0) - toNum(baseline.readinessScore, 0)) : null,
    readinessImprovementSincePrevious: previous && latest ? round(toNum(latest.readinessScore, 0) - toNum(previous.readinessScore, 0)) : null,
    perSkillGrowth,
    confidenceTrend: {
      baseline: average(baseline?.perSkillSnapshot || [], 'confidenceScore'),
      latest: average(latest?.perSkillSnapshot || [], 'confidenceScore'),
    },
    timingTrend: {
      baselineAverageSeconds: average(baseline?.perSkillSnapshot || [], 'averageTimeTaken'),
      latestAverageSeconds: average(latest?.perSkillSnapshot || [], 'averageTimeTaken'),
    },
    workingEvidenceTrend: {
      baselineWorkingSubmittedRate: average(baseline?.perSkillSnapshot || [], 'workingSubmittedRate'),
      latestWorkingSubmittedRate: average(latest?.perSkillSnapshot || [], 'workingSubmittedRate'),
    },
    remainingWeakSkills,
    recommendedActions: remainingWeakSkills.slice(0, 5).map((skillId) => ({
      type: 'assign_practice',
      skillId,
      reason: 'Still below readiness threshold',
    })),
  };
}

export async function getDiagnosticGrowth(params = {}) {
  const history = await getDiagnosticHistory(params);
  const growth = buildDiagnosticGrowth(history);
  if (!params.assignmentId) return growth;

  const assignment = await MathPathAssignment.findOne({
    _id: params.assignmentId,
    studentId: String(params.studentId || ''),
  }).lean();
  if (!assignment) {
    return {
      ...growth,
      assignmentGrowth: {
        assignmentId: String(params.assignmentId),
        available: false,
        reason: 'Assignment not found for this student.',
      },
    };
  }
  const assignmentCreatedAt = assignment.createdAt ? new Date(assignment.createdAt) : null;
  const afterAssignment = assignmentCreatedAt
    ? history.filter((row) => row.completedAt && new Date(row.completedAt) >= assignmentCreatedAt)
    : [];
  const latestAfterAssignment = afterAssignment.at(-1) || null;
  const baseline = growth.baseline || history[0] || null;
  const targetedSkillIds = assignment.skillIds || [];
  const targetedSkillGrowth = (growth.perSkillGrowth || [])
    .filter((row) => targetedSkillIds.includes(row.skillId));
  const assignmentSummary = {
    assignmentId: String(assignment._id),
    title: assignment.title,
    sourceType: assignment.sourceType,
    sourceId: assignment.sourceId,
    skillIds: targetedSkillIds,
    status: assignment.status,
    completion: assignment.completion || {},
  };
  const improvementAfterAssignment = baseline && latestAfterAssignment
    ? Number(latestAfterAssignment.readinessScore || 0) - Number(baseline.readinessScore || 0)
    : null;

  return {
    ...growth,
    assignmentGrowth: {
      assignmentId: String(assignment._id),
      available: Boolean(latestAfterAssignment),
      reason: latestAfterAssignment
        ? 'Latest diagnostic after assignment is available.'
        : 'No completed diagnostic after this assignment yet.',
      linkedAssignment: assignmentSummary,
      assignment: assignmentSummary,
      baseline,
      recheck: latestAfterAssignment,
      latestAfterAssignment,
      improvementAfterAssignment,
      improvement: improvementAfterAssignment,
      targetedSkillIds,
      targetedSkills: targetedSkillIds,
      targetedSkillGrowth,
      targetedSkillImprovement: targetedSkillGrowth,
    },
  };
}

export default {
  buildPerSkillSnapshot,
  resolveDiagnosticLineage,
  applyDiagnosticCompletionMetadata,
  getDiagnosticHistory,
  buildDiagnosticGrowth,
  getDiagnosticGrowth,
};
