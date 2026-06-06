import Student from '../../models/Student.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';

const DEFAULT_SUBJECT = 'math';
const DEFAULT_DOMAIN = 'fractions';
const DAY_MS = 24 * 60 * 60 * 1000;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, dp = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

function median(values = []) {
  const nums = values.map((value) => num(value, NaN)).filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : round((nums[mid - 1] + nums[mid]) / 2);
}

function average(values = []) {
  const nums = values.map((value) => num(value, NaN)).filter(Number.isFinite);
  return nums.length ? round(nums.reduce((sum, n) => sum + n, 0) / nums.length) : 0;
}

function percent(part, whole) {
  return whole ? round((part / whole) * 100) : 0;
}

function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function dateRangeFilter({ from, to } = {}) {
  const createdAt = {};
  const start = asDate(from);
  const end = asDate(to);
  if (start) createdAt.$gte = start;
  if (end) createdAt.$lte = end;
  return Object.keys(createdAt).length ? { createdAt } : {};
}

function completedDate(session = {}) {
  return asDate(session.completedAt || session.updatedAt || session.createdAt);
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function countBy(values = []) {
  return values.reduce((acc, value) => {
    const key = String(value || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topCounts(counter = {}, keyName, limit = 8) {
  return Object.entries(counter)
    .map(([key, count]) => ({ [keyName]: key, count }))
    .sort((a, b) => b.count - a.count || String(a[keyName]).localeCompare(String(b[keyName])))
    .slice(0, limit);
}

function studentName(student) {
  return student?.name || student?.profile?.name || 'Student';
}

function latestCompletedDiagnostic(sessions = []) {
  return [...sessions]
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (completedDate(a)?.getTime() || 0) - (completedDate(b)?.getTime() || 0))
    .at(-1) || null;
}

function baselineDiagnostic(sessions = []) {
  const completed = sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (completedDate(a)?.getTime() || 0) - (completedDate(b)?.getTime() || 0));
  return completed.find((session) => session.isBaseline) || completed[0] || null;
}

function perSkillScores(session = {}) {
  const rows = Array.isArray(session.perSkillSnapshot) ? session.perSkillSnapshot : [];
  return new Map(rows.map((row) => [String(row.skillId || '').toUpperCase(), num(row.score, 0)]));
}

function targetedSkillImprovementFor({ baseline, latest, skillIds = [] } = {}) {
  if (!baseline || !latest || !skillIds.length) return null;
  const before = perSkillScores(baseline);
  const after = perSkillScores(latest);
  const improvements = skillIds
    .map((skillId) => {
      const key = String(skillId || '').toUpperCase();
      if (!before.has(key) || !after.has(key)) return null;
      return after.get(key) - before.get(key);
    })
    .filter((value) => Number.isFinite(value));
  return improvements.length ? average(improvements) : null;
}

function activityDate(row = {}) {
  return asDate(row.completedAt || row.updatedAt || row.createdAt || row.timestamp);
}

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

function inWindow(row, since) {
  const date = activityDate(row);
  return date && date >= since;
}

function buildFilters({ subjectId = DEFAULT_SUBJECT, domainId = DEFAULT_DOMAIN, from, to } = {}) {
  return {
    subjectId,
    domainId,
    range: dateRangeFilter({ from, to }),
  };
}

function detectDataQualityWarnings({ diagnostics = [], assignments = [], papers = [] } = {}) {
  const warnings = [];
  const completed = diagnostics.filter((session) => session.status === 'completed');
  const baselinesByStudent = new Map();
  for (const session of completed) {
    if (session.isBaseline) baselinesByStudent.set(String(session.studentId), session);
  }

  const missingBaselineLinks = completed.filter((session) => (
    !session.isBaseline
    && !session.baselineDiagnosticId
    && baselinesByStudent.has(String(session.studentId))
  ));
  if (missingBaselineLinks.length) {
    warnings.push({
      type: 'diagnostic_missing_baseline_link',
      severity: 'medium',
      count: missingBaselineLinks.length,
      message: 'Some completed diagnostics are not linked to the preserved baseline.',
    });
  }

  const assignmentsMissingSource = assignments.filter((assignment) => !assignment.sourceType || !assignment.sourceId);
  if (assignmentsMissingSource.length) {
    warnings.push({
      type: 'assignment_missing_source',
      severity: 'high',
      count: assignmentsMissingSource.length,
      message: 'Some Recovery Packs are missing sourceType or sourceId.',
    });
  }

  const rechecksMissingAssignment = completed.filter((session) => (
    session.diagnosticPurpose === 'recheck' && !session.assignmentId
  ));
  if (rechecksMissingAssignment.length) {
    warnings.push({
      type: 'recheck_missing_assignment',
      severity: 'medium',
      count: rechecksMissingAssignment.length,
      message: 'Some recheck diagnostics are not linked to a Recovery Pack.',
    });
  }

  const assignedWithoutWeakSkills = papers.filter((paper) => (
    paper.status === 'assigned' && !(paper.weakSkillIds || []).length
  ));
  if (assignedWithoutWeakSkills.length) {
    warnings.push({
      type: 'paper_assigned_without_weak_skills',
      severity: 'high',
      count: assignedWithoutWeakSkills.length,
      message: 'Some paper analyses were assigned without reviewed weak skills.',
    });
  }

  const studentsWithOneDiagnostic = [...new Set(completed.map((session) => String(session.studentId)))]
    .filter((studentId) => completed.filter((session) => String(session.studentId) === studentId).length < 2);
  if (studentsWithOneDiagnostic.length) {
    warnings.push({
      type: 'growth_not_yet_measurable',
      severity: 'info',
      count: studentsWithOneDiagnostic.length,
      message: 'Some students have only one completed diagnostic, so growth cannot be measured yet.',
    });
  }

  return warnings;
}

export function buildPilotInterventionMetrics({
  students = [],
  diagnostics = [],
  assignments = [],
  attempts = [],
  papers = [],
  mistakes = [],
} = {}) {
  const studentIds = unique([
    ...students.map((student) => student._id || student.id),
    ...diagnostics.map((session) => session.studentId),
    ...assignments.map((assignment) => assignment.studentId),
    ...attempts.map((attempt) => attempt.studentId),
    ...papers.map((paper) => paper.studentId),
  ]);
  const studentNameById = new Map(students.map((student) => [String(student._id || student.id), studentName(student)]));
  const diagnosticsByStudent = new Map();
  for (const session of diagnostics) {
    const id = String(session.studentId || '');
    if (!diagnosticsByStudent.has(id)) diagnosticsByStudent.set(id, []);
    diagnosticsByStudent.get(id).push(session);
  }

  const assignmentStudentIds = unique(assignments.map((assignment) => assignment.studentId));
  const startedAssignments = assignments.filter((assignment) => (
    assignment.status === 'in_progress'
    || assignment.status === 'completed'
    || num(assignment.completion?.questionsAttempted) > 0
  ));
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed');
  const recheckRecommendedAssignments = assignments.filter((assignment) => assignment.recheck?.recommended);
  const recheckDiagnosticIds = unique(assignments.map((assignment) => assignment.recheck?.diagnosticSessionId));
  const completedRechecks = diagnostics.filter((session) => (
    session.status === 'completed'
    && (session.diagnosticPurpose === 'recheck' || recheckDiagnosticIds.includes(String(session.diagnosticSessionId)))
  ));

  const baselineSessions = studentIds
    .map((studentId) => baselineDiagnostic(diagnosticsByStudent.get(studentId) || []))
    .filter(Boolean);
  const latestSessions = studentIds
    .map((studentId) => latestCompletedDiagnostic(diagnosticsByStudent.get(studentId) || []))
    .filter(Boolean);
  const improvements = studentIds.map((studentId) => {
    const sessions = diagnosticsByStudent.get(studentId) || [];
    const baseline = baselineDiagnostic(sessions);
    const latest = latestCompletedDiagnostic(sessions);
    if (!baseline || !latest || String(baseline.diagnosticSessionId) === String(latest.diagnosticSessionId)) return null;
    return num(latest.readinessScore) - num(baseline.readinessScore);
  }).filter((value) => value !== null);

  const targetedSkillImprovements = assignments
    .map((assignment) => {
      const sessions = diagnosticsByStudent.get(String(assignment.studentId)) || [];
      return targetedSkillImprovementFor({
        baseline: baselineDiagnostic(sessions),
        latest: latestCompletedDiagnostic(sessions),
        skillIds: assignment.skillIds || [],
      });
    })
    .filter((value) => value !== null);

  const weakSkillCounts = countBy([
    ...assignments.flatMap((assignment) => assignment.skillIds || []),
    ...papers.flatMap((paper) => paper.weakSkillIds || []),
  ]);
  const paperWeakSkillCounts = countBy(papers.flatMap((paper) => paper.weakSkillIds || []));
  const misconceptionCounts = mistakes.reduce((acc, mistake) => {
    const key = mistake.mistakeName || mistake.mistakeCode || 'mistake';
    acc[key] = (acc[key] || 0) + num(mistake.frequency, 1);
    return acc;
  }, {});
  for (const paper of papers) {
    for (const question of paper.detectedQuestions || []) {
      for (const tag of question.misconceptionTags || []) {
        misconceptionCounts[tag] = (misconceptionCounts[tag] || 0) + 1;
      }
    }
  }

  const active7 = new Set([
    ...diagnostics.filter((row) => inWindow(row, daysAgo(7))).map((row) => String(row.studentId)),
    ...assignments.filter((row) => inWindow(row, daysAgo(7))).map((row) => String(row.studentId)),
    ...attempts.filter((row) => inWindow(row, daysAgo(7))).map((row) => String(row.studentId)),
    ...papers.filter((row) => inWindow(row, daysAgo(7))).map((row) => String(row.studentId)),
  ]);
  const active30 = new Set([
    ...diagnostics.filter((row) => inWindow(row, daysAgo(30))).map((row) => String(row.studentId)),
    ...assignments.filter((row) => inWindow(row, daysAgo(30))).map((row) => String(row.studentId)),
    ...attempts.filter((row) => inWindow(row, daysAgo(30))).map((row) => String(row.studentId)),
    ...papers.filter((row) => inWindow(row, daysAgo(30))).map((row) => String(row.studentId)),
  ]);
  const inactive14 = studentIds.filter((studentId) => {
    const rows = [
      ...diagnostics.filter((row) => String(row.studentId) === studentId),
      ...assignments.filter((row) => String(row.studentId) === studentId),
      ...attempts.filter((row) => String(row.studentId) === studentId),
      ...papers.filter((row) => String(row.studentId) === studentId),
    ];
    return rows.length > 0 && !rows.some((row) => inWindow(row, daysAgo(14)));
  }).length;

  const studentsWithMeasuredImprovement = improvements.filter((value) => value > 0).length;
  const studentsNoImprovementCount = improvements.filter((value) => value <= 0).length;
  const papersReviewed = papers.filter((paper) => ['reviewed', 'assigned'].includes(paper.status)).length;
  const papersConverted = papers.filter((paper) => (
    paper.status === 'assigned' || (paper.linkedPracticeAssignmentIds || []).length > 0
  )).length;

  return {
    generatedAt: new Date().toISOString(),
    summaryMetrics: {
      totalStudents: studentIds.length,
      studentsImprovedCount: studentsWithMeasuredImprovement,
      studentsNoImprovementCount,
      activeStudents7d: active7.size,
      activeStudents30d: active30.size,
      inactiveStudents14d: inactive14,
    },
    funnel: {
      totalStudents: studentIds.length,
      studentsWithBaselineDiagnostic: new Set(baselineSessions.map((session) => String(session.studentId))).size,
      studentsWithRecoveryPackAssigned: new Set(assignmentStudentIds).size,
      studentsWithRecoveryPackStarted: new Set(startedAssignments.map((assignment) => String(assignment.studentId))).size,
      studentsWithRecoveryPackCompleted: new Set(completedAssignments.map((assignment) => String(assignment.studentId))).size,
      studentsWithRecheckRecommended: new Set(recheckRecommendedAssignments.map((assignment) => String(assignment.studentId))).size,
      studentsWithRecheckCompleted: new Set(completedRechecks.map((session) => String(session.studentId))).size,
      studentsWithMeasuredImprovement,
    },
    growth: {
      averageBaselineReadiness: average(baselineSessions.map((session) => session.readinessScore)),
      averageLatestReadiness: average(latestSessions.map((session) => session.readinessScore)),
      averageReadinessImprovement: average(improvements),
      medianReadinessImprovement: median(improvements),
      averageTargetedSkillImprovement: average(targetedSkillImprovements),
      studentsImprovedCount: studentsWithMeasuredImprovement,
      studentsNoImprovementCount,
    },
    assignments: {
      totalRecoveryPacksAssigned: assignments.length,
      totalRecoveryPacksStarted: startedAssignments.length,
      totalRecoveryPacksCompleted: completedAssignments.length,
      assignmentCompletionRate: percent(completedAssignments.length, assignments.length),
      averageAssignmentAccuracy: average(assignments.map((assignment) => assignment.completion?.accuracy)),
      dropOffAfterAssignment: Math.max(0, assignments.length - startedAssignments.length),
    },
    paperAnalysis: {
      papersUploaded: papers.length,
      papersReviewed,
      papersAwaitingReview: papers.filter((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'needs_review'].includes(paper.status)).length,
      papersConvertedToRecoveryPacks: papersConverted,
      paperConversionRate: percent(papersConverted, papers.length),
      mostCommonPaperWeakSkills: topCounts(paperWeakSkillCounts, 'skillId'),
    },
    rechecks: {
      rechecksRecommended: recheckRecommendedAssignments.length,
      rechecksCreated: assignments.filter((assignment) => assignment.recheck?.diagnosticSessionId).length,
      rechecksCompleted: completedRechecks.length,
      recheckCompletionRate: percent(completedRechecks.length, recheckRecommendedAssignments.length),
    },
    misconceptions: {
      mostCommonMisconceptions: topCounts(misconceptionCounts, 'misconception'),
      misconceptionImprovementWhereAvailable: [],
    },
    engagement: {
      activeStudents7d: active7.size,
      activeStudents30d: active30.size,
      inactiveStudents14d: inactive14,
      parentReportsGenerated: 0,
      parentReportsViewed: null,
    },
    commonWeakSkills: topCounts(weakSkillCounts, 'skillId'),
    dataQualityWarnings: detectDataQualityWarnings({ diagnostics, assignments, papers }),
    _studentNameById: studentNameById,
  };
}

export function getStudentsNeedingAttentionFromData({
  students = [],
  diagnostics = [],
  assignments = [],
  papers = [],
} = {}) {
  const metrics = buildPilotInterventionMetrics({ students, diagnostics, assignments, papers });
  const nameById = metrics._studentNameById || new Map();
  const diagnosticsByStudent = new Map();
  for (const session of diagnostics) {
    const id = String(session.studentId || '');
    if (!diagnosticsByStudent.has(id)) diagnosticsByStudent.set(id, []);
    diagnosticsByStudent.get(id).push(session);
  }
  const assignmentsByStudent = new Map();
  for (const assignment of assignments) {
    const id = String(assignment.studentId || '');
    if (!assignmentsByStudent.has(id)) assignmentsByStudent.set(id, []);
    assignmentsByStudent.get(id).push(assignment);
  }
  const rows = [];
  const now = Date.now();
  const allStudentIds = unique([
    ...students.map((student) => student._id || student.id),
    ...diagnostics.map((session) => session.studentId),
    ...assignments.map((assignment) => assignment.studentId),
    ...papers.map((paper) => paper.studentId),
  ]);

  for (const studentId of allStudentIds) {
    const ds = diagnosticsByStudent.get(studentId) || [];
    const as = assignmentsByStudent.get(studentId) || [];
    const baseline = baselineDiagnostic(ds);
    const latest = latestCompletedDiagnostic(ds);
    const hasAssignment = as.length > 0;
    const staleAssigned = as.find((assignment) => (
      assignment.status === 'assigned'
      && num(assignment.completion?.questionsAttempted) === 0
      && asDate(assignment.createdAt)
      && now - asDate(assignment.createdAt).getTime() >= 7 * DAY_MS
    ));
    const incomplete = as.find((assignment) => assignment.status === 'in_progress');
    const recheckReady = as.find((assignment) => assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId);
    const completedNoImprovement = as.find((assignment) => {
      if (assignment.status !== 'completed' || !baseline || !latest) return false;
      if (String(baseline.diagnosticSessionId) === String(latest.diagnosticSessionId)) return false;
      return num(latest.readinessScore) <= num(baseline.readinessScore);
    });
    if (baseline && !hasAssignment) {
      rows.push({
        studentId,
        studentName: nameById.get(studentId) || 'Student',
        priority: 'high',
        reason: 'Baseline diagnostic completed but no Recovery Pack has been assigned.',
        recommendedAction: 'Assign Recovery Pack',
        linkedObjectType: 'diagnostic',
        linkedObjectId: baseline.diagnosticSessionId || String(baseline._id || ''),
      });
    } else if (staleAssigned) {
      rows.push({
        studentId,
        studentName: nameById.get(studentId) || 'Student',
        priority: 'high',
        reason: 'Recovery Pack assigned but not started after 7 days.',
        recommendedAction: 'Nudge student or parent to start practice.',
        linkedObjectType: 'assignment',
        linkedObjectId: String(staleAssigned._id || staleAssigned.id || ''),
      });
    } else if (recheckReady) {
      rows.push({
        studentId,
        studentName: nameById.get(studentId) || 'Student',
        priority: 'medium',
        reason: 'Recheck is recommended but has not been created.',
        recommendedAction: 'Create recheck diagnostic.',
        linkedObjectType: 'assignment',
        linkedObjectId: String(recheckReady._id || recheckReady.id || ''),
      });
    } else if (completedNoImprovement) {
      rows.push({
        studentId,
        studentName: nameById.get(studentId) || 'Student',
        priority: 'high',
        reason: 'Recovery Pack completed but latest diagnostic shows no readiness improvement.',
        recommendedAction: 'Review misconception evidence and plan tutor intervention.',
        linkedObjectType: 'assignment',
        linkedObjectId: String(completedNoImprovement._id || completedNoImprovement.id || ''),
      });
    } else if (incomplete) {
      rows.push({
        studentId,
        studentName: nameById.get(studentId) || 'Student',
        priority: 'medium',
        reason: 'Recovery Pack is in progress but not completed.',
        recommendedAction: 'Monitor completion and accuracy.',
        linkedObjectType: 'assignment',
        linkedObjectId: String(incomplete._id || incomplete.id || ''),
      });
    }
  }

  for (const paper of papers.filter((row) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'needs_review'].includes(row.status))) {
    rows.push({
      studentId: String(paper.studentId || ''),
      studentName: nameById.get(String(paper.studentId || '')) || 'Student',
      priority: 'medium',
      reason: 'Paper uploaded but not reviewed.',
      recommendedAction: 'Review detected questions and confirm weak skills.',
      linkedObjectType: 'paper_analysis',
      linkedObjectId: String(paper._id || paper.id || ''),
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 };
  return rows.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.studentName.localeCompare(b.studentName));
}

async function loadInterventionData(options = {}) {
  const { subjectId, domainId, range } = buildFilters(options);
  const base = { subjectId, domainId };
  const diagnosticBase = { subjectId, domainId };
  const studentFilter = {};
  if (options.cohortId) studentFilter['profile.pilotProfile'] = String(options.cohortId);

  const [students, diagnostics, assignments, attempts, papers, mistakes] = await Promise.all([
    Student.find(studentFilter).lean(),
    MathPathDiagnosticSession.find({ ...diagnosticBase, ...range }).lean(),
    MathPathAssignment.find({ ...base, ...range }).lean(),
    MathPathAttempt.find({ domainId, ...range }).lean(),
    PaperAnalysis.find({ ...base, ...range }).lean(),
    MathPathMistakeRecord.find({ domainId, ...range }).lean(),
  ]);

  let scopedStudents = students;
  if (!scopedStudents.length) {
    const ids = unique([
      ...diagnostics.map((row) => row.studentId),
      ...assignments.map((row) => row.studentId),
      ...attempts.map((row) => row.studentId),
      ...papers.map((row) => row.studentId),
    ]);
    scopedStudents = ids.map((id) => ({ _id: id, name: `Student ${id.slice(-4)}` }));
  }
  const scopedIds = new Set(scopedStudents.map((student) => String(student._id || student.id)));
  const inScope = (row) => !scopedIds.size || scopedIds.has(String(row.studentId || ''));

  return {
    students: scopedStudents,
    diagnostics: diagnostics.filter(inScope),
    assignments: assignments.filter(inScope),
    attempts: attempts.filter(inScope),
    papers: papers.filter(inScope),
    mistakes: mistakes.filter(inScope),
  };
}

export async function getPilotInterventionMetrics(options = {}) {
  const data = await loadInterventionData(options);
  const metrics = buildPilotInterventionMetrics(data);
  const { _studentNameById, ...publicMetrics } = metrics;
  return {
    ...publicMetrics,
    studentsNeedingAttention: getStudentsNeedingAttentionFromData(data).slice(0, 25),
  };
}

export async function getPilotInterventionSummary(options = {}) {
  const metrics = await getPilotInterventionMetrics(options);
  return {
    generatedAt: metrics.generatedAt,
    pilotSize: metrics.funnel.totalStudents,
    baselineCompletionRate: percent(metrics.funnel.studentsWithBaselineDiagnostic, metrics.funnel.totalStudents),
    recoveryPackCompletionRate: metrics.assignments.assignmentCompletionRate,
    recheckCompletionRate: metrics.rechecks.recheckCompletionRate,
    averageReadinessGain: metrics.growth.averageReadinessImprovement,
    topImprovedSkills: [],
    topRemainingWeakSkills: metrics.commonWeakSkills,
    evidenceExamples: metrics.studentsNeedingAttention.slice(0, 5).map((row) => ({
      studentId: row.studentId,
      evidence: row.reason,
      recommendedAction: row.recommendedAction,
    })),
    dataQualityWarnings: metrics.dataQualityWarnings,
  };
}

export default {
  buildPilotInterventionMetrics,
  getStudentsNeedingAttentionFromData,
  getPilotInterventionMetrics,
  getPilotInterventionSummary,
};
