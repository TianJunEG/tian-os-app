import PilotFeedback from '../../models/mathpath/PilotFeedback.js';
import OutcomeTracking from '../../models/mathpath/OutcomeTracking.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import { updateOutcomeTracking } from './outcomeTrackingEngine.js';

const DEFAULT_DOMAIN_ID = 'fractions';
const DEFAULT_PILOT_ID = 'fractions-pilot-v1';
const FEEDBACK_TYPES = ['student', 'parent', 'tutor', 'teacher', 'founder', 'bug'];
const BUG_SEVERITIES = ['critical', 'high', 'medium', 'low'];

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toDate(value, fallback = new Date()) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : fallback;
}

function round(value, dp = 1) {
  const p = 10 ** dp;
  return Math.round(toNum(value, 0) * p) / p;
}

function average(values = []) {
  const nums = values.map((v) => toNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function normalizeDomainId(domainId) {
  const normalized = String(domainId || DEFAULT_DOMAIN_ID).trim();
  return normalized || DEFAULT_DOMAIN_ID;
}

function normalizePilotId(pilotId) {
  const normalized = String(pilotId || DEFAULT_PILOT_ID).trim();
  return normalized || DEFAULT_PILOT_ID;
}

function normalizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeRatings(ratings = {}) {
  const output = {};
  const entries = ratings instanceof Map ? Array.from(ratings.entries()) : Object.entries(ratings || {});
  entries.forEach(([key, value]) => {
    const k = normalizeString(key);
    if (!k) return;
    const score = toNum(value, NaN);
    if (!Number.isFinite(score)) return;
    output[k] = Math.max(1, Math.min(5, Math.round(score)));
  });
  return output;
}

function normalizeResponses(responses = {}) {
  const output = {};
  const entries = responses instanceof Map ? Array.from(responses.entries()) : Object.entries(responses || {});
  entries.forEach(([key, value]) => {
    const k = normalizeString(key);
    if (!k) return;
    output[k] = normalizeString(value);
  });
  return output;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function syncOutcomeTracking(studentIds = [], domainId = DEFAULT_DOMAIN_ID) {
  const uniq = [...new Set((studentIds || []).map(normalizeString).filter(Boolean))];
  if (!uniq.length) return [];
  const settled = await Promise.allSettled(uniq.map((studentId) => updateOutcomeTracking(studentId, domainId)));
  return settled
    .filter((item) => item.status === 'fulfilled' && item.value)
    .map((item) => item.value);
}

function toMinutes(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / 60000;
}

function computeRecommendedActions(summary) {
  const actions = [];
  if (summary.completionRate < 70) {
    actions.push('Improve weekly practice completion with tighter supervision and reminders.');
  }
  if (summary.averageStudentSatisfaction > 0 && summary.averageStudentSatisfaction < 3.5) {
    actions.push('Review question UX and explanation clarity based on student feedback comments.');
  }
  if (summary.averageParentSatisfaction > 0 && summary.averageParentSatisfaction < 3.5) {
    actions.push('Simplify parent-facing progress language and add clearer next-step guidance.');
  }
  if (summary.majorIssues.some((issue) => issue.severity === 'critical')) {
    actions.push('Resolve all critical bugs before expanding pilot size.');
  }
  if (!actions.length) {
    actions.push('Continue current pilot plan and prepare mid-pilot outcome review.');
  }
  return actions;
}

function getDateRange({ startDate, endDate } = {}) {
  const end = toDate(endDate, new Date());
  const start = toDate(startDate, new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000));
  return { start, end };
}

export async function createPilotFeedback(input = {}) {
  const feedbackType = normalizeString(input.feedbackType).toLowerCase();
  if (!FEEDBACK_TYPES.includes(feedbackType)) {
    throw new Error(`feedbackType must be one of: ${FEEDBACK_TYPES.join(', ')}`);
  }

  const ratings = normalizeRatings(input.ratings);
  const overallRating = Number.isFinite(toNum(input.overallRating, NaN))
    ? Math.max(1, Math.min(5, Math.round(toNum(input.overallRating))))
    : null;

  const payload = {
    pilotId: normalizePilotId(input.pilotId),
    domainId: normalizeDomainId(input.domainId),
    feedbackType,
    respondentId: normalizeString(input.respondentId),
    respondentRole: normalizeString(input.respondentRole || feedbackType),
    studentId: normalizeString(input.studentId),
    classId: normalizeString(input.classId),
    ratings,
    overallRating,
    responses: normalizeResponses(input.responses),
    notes: normalizeString(input.notes),
    status: normalizeString(input.status || 'open') || 'open',
  };

  if (feedbackType === 'bug') {
    const severity = normalizeString(input?.bugReport?.severity || input?.severity || 'medium').toLowerCase();
    payload.bugReport = {
      category: normalizeString(input?.bugReport?.category || input?.category),
      severity: BUG_SEVERITIES.includes(severity) ? severity : 'medium',
      description: normalizeString(input?.bugReport?.description || input?.description),
      screenshotUrl: normalizeString(input?.bugReport?.screenshotUrl || input?.screenshotUrl),
      reportedBy: normalizeString(input?.bugReport?.reportedBy || input?.reportedBy || payload.respondentId),
      fixed: Boolean(input?.bugReport?.fixed ?? input?.fixed ?? false),
      createdAt: toDate(input?.bugReport?.createdAt, new Date()),
    };
  }

  return PilotFeedback.create(payload);
}

export function submitStudentFeedback(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'student' });
}

export function submitParentFeedback(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'parent' });
}

export function submitTutorFeedback(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'tutor' });
}

export function submitTeacherFeedback(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'teacher' });
}

export function submitFounderNotes(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'founder' });
}

export function reportPilotBug(input = {}) {
  return createPilotFeedback({ ...input, feedbackType: 'bug' });
}

export async function listPilotFeedback(filters = {}) {
  const query = {
    pilotId: normalizePilotId(filters.pilotId),
    domainId: normalizeDomainId(filters.domainId),
  };
  if (filters.feedbackType && FEEDBACK_TYPES.includes(String(filters.feedbackType).toLowerCase())) {
    query.feedbackType = String(filters.feedbackType).toLowerCase();
  }
  if (filters.studentId) query.studentId = normalizeString(filters.studentId);
  if (filters.classId) query.classId = normalizeString(filters.classId);
  if (filters.status) query.status = normalizeString(filters.status);
  if (filters.severity) query['bugReport.severity'] = normalizeString(filters.severity).toLowerCase();
  if (filters.since || filters.until) {
    query.createdAt = {};
    if (filters.since) query.createdAt.$gte = toDate(filters.since, new Date(0));
    if (filters.until) query.createdAt.$lte = toDate(filters.until, new Date());
  }

  return PilotFeedback.find(query).sort({ createdAt: -1 }).lean();
}

async function collectUsageMetrics({ studentIds = [], domainId = DEFAULT_DOMAIN_ID, start, end }) {
  const baseQuery = {
    domainId,
    createdAt: { $gte: start, $lte: end },
  };
  if (studentIds.length) baseQuery.studentId = { $in: studentIds };

  const [sessions, attempts] = await Promise.all([
    MathPathPracticeSession.find(baseQuery, {
      studentId: 1,
      status: 1,
      startedAt: 1,
      completedAt: 1,
      createdAt: 1,
    }).lean(),
    MathPathAttempt.find(baseQuery, {
      studentId: 1,
      sessionId: 1,
      createdAt: 1,
      timeTaken: 1,
    }).lean(),
  ]);

  const todayStart = startOfDay(end);
  const weekStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeByDay = new Map();
  const activeStudentsToday = new Set();
  const activeStudentsWeek = new Set();
  const sessionStudents = new Set();

  const sessionDurationsMinutes = [];
  let completedSessions = 0;

  sessions.forEach((session) => {
    const sid = normalizeString(session.studentId);
    if (!sid) return;
    sessionStudents.add(sid);
    const createdAt = toDate(session.createdAt, end);
    const dayKey = startOfDay(createdAt).toISOString();
    if (!activeByDay.has(dayKey)) activeByDay.set(dayKey, new Set());
    activeByDay.get(dayKey).add(sid);

    if (createdAt >= todayStart) activeStudentsToday.add(sid);
    if (createdAt >= weekStart) activeStudentsWeek.add(sid);

    if (String(session.status) === 'completed') completedSessions += 1;
    if (session.startedAt && session.completedAt) {
      const ms = toDate(session.completedAt, end).getTime() - toDate(session.startedAt, end).getTime();
      if (ms > 0) sessionDurationsMinutes.push(toMinutes(ms));
    }
  });

  const attemptStudents = new Set();
  attempts.forEach((attempt) => {
    const sid = normalizeString(attempt.studentId);
    if (!sid) return;
    attemptStudents.add(sid);
    const createdAt = toDate(attempt.createdAt, end);
    if (createdAt >= todayStart) activeStudentsToday.add(sid);
    if (createdAt >= weekStart) activeStudentsWeek.add(sid);
  });

  const activeStudents = new Set([...sessionStudents, ...attemptStudents]);
  const multiDayReturners = [...activeStudents].filter((studentId) => {
    let dayCount = 0;
    for (const set of activeByDay.values()) {
      if (set.has(studentId)) dayCount += 1;
      if (dayCount >= 2) return true;
    }
    return false;
  });

  const totalSessions = sessions.length;
  const completionRate = totalSessions ? round((completedSessions / totalSessions) * 100, 1) : 0;
  const returnRate = activeStudents.size
    ? round((multiDayReturners.length / activeStudents.size) * 100, 1)
    : 0;

  return {
    dailyActiveStudents: activeStudentsToday.size,
    weeklyActiveStudents: activeStudentsWeek.size,
    activeStudents: activeStudents.size,
    practiceSessions: totalSessions,
    questionsAnswered: attempts.length,
    averageSessionLength: round(average(sessionDurationsMinutes), 1),
    completionRate,
    returnRate,
  };
}

async function collectOutcomeMetrics({ studentIds = [], domainId = DEFAULT_DOMAIN_ID }) {
  const synced = await syncOutcomeTracking(studentIds, domainId);
  const records = synced.length
    ? synced
    : await OutcomeTracking.find({
      domainId,
      ...(studentIds.length ? { studentId: { $in: studentIds } } : {}),
    }).lean();

  return {
    studentCount: records.length,
    averageMasteryGain: round(average(records.map((r) => toNum(r.masteryGain, 0))), 1),
    averageFluencyGain: round(average(records.map((r) => toNum(r.fluencyGain, 0))), 1),
    averageRetentionGain: round(average(records.map((r) => toNum(r.retentionGain, 0))), 1),
    averageAssessmentGain: round(average(records.map((r) => toNum(r.assessmentGain, NaN)).filter(Number.isFinite)), 1),
    averageReadinessGain: round(average(records.map((r) => toNum(r.readinessGain, NaN)).filter(Number.isFinite)), 1),
  };
}

function extractSatisfactionScore(record) {
  if (!record) return null;
  if (Number.isFinite(toNum(record.overallRating, NaN))) return toNum(record.overallRating, NaN);
  const ratings = record.ratings instanceof Map
    ? Object.fromEntries(record.ratings.entries())
    : (record.ratings || {});
  const values = Object.values(ratings).map((v) => toNum(v, NaN)).filter(Number.isFinite);
  if (!values.length) return null;
  return average(values);
}

async function collectFeedbackStats({ pilotId, domainId, start, end, studentIds = [] }) {
  const query = {
    pilotId,
    domainId,
    createdAt: { $gte: start, $lte: end },
  };
  if (studentIds.length) {
    query.$or = [
      { studentId: { $in: studentIds } },
      { studentId: '' },
    ];
  }

  const feedback = await PilotFeedback.find(query).lean();
  const studentFeedback = feedback.filter((item) => item.feedbackType === 'student');
  const parentFeedback = feedback.filter((item) => item.feedbackType === 'parent');
  const bugs = feedback.filter((item) => item.feedbackType === 'bug' && item.bugReport);

  const averageStudentSatisfaction = round(average(
    studentFeedback.map(extractSatisfactionScore).filter((v) => Number.isFinite(v))
  ), 2);
  const averageParentSatisfaction = round(average(
    parentFeedback.map(extractSatisfactionScore).filter((v) => Number.isFinite(v))
  ), 2);

  const majorIssues = bugs
    .filter((item) => ['critical', 'high'].includes(String(item?.bugReport?.severity || '').toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((item) => ({
      id: String(item._id),
      category: item.bugReport.category || 'general',
      severity: item.bugReport.severity,
      description: item.bugReport.description,
      fixed: Boolean(item.bugReport.fixed),
      reportedBy: item.bugReport.reportedBy || item.respondentId || '',
      createdAt: item.bugReport.createdAt || item.createdAt,
    }));

  return {
    averageStudentSatisfaction,
    averageParentSatisfaction,
    majorIssues,
    feedbackCount: feedback.length,
  };
}

export async function buildPilotSummary(options = {}) {
  const pilotId = normalizePilotId(options.pilotId);
  const domainId = normalizeDomainId(options.domainId);
  const studentIds = [...new Set((options.studentIds || []).map(normalizeString).filter(Boolean))];
  const { start, end } = getDateRange(options);

  const [usage, outcome, feedback] = await Promise.all([
    collectUsageMetrics({ studentIds, domainId, start, end }),
    collectOutcomeMetrics({ studentIds, domainId }),
    collectFeedbackStats({ pilotId, domainId, start, end, studentIds }),
  ]);

  const summary = {
    studentCount: studentIds.length || outcome.studentCount || usage.activeStudents,
    activeStudents: usage.activeStudents,
    completionRate: usage.completionRate,
    averageMasteryGain: outcome.averageMasteryGain,
    averageFluencyGain: outcome.averageFluencyGain,
    averageRetentionGain: outcome.averageRetentionGain,
    averageAssessmentGain: outcome.averageAssessmentGain,
    averageParentSatisfaction: feedback.averageParentSatisfaction,
    averageStudentSatisfaction: feedback.averageStudentSatisfaction,
    majorIssues: feedback.majorIssues,
    recommendedActions: [],
    usageMetrics: {
      dailyActiveStudents: usage.dailyActiveStudents,
      weeklyActiveStudents: usage.weeklyActiveStudents,
      practiceSessions: usage.practiceSessions,
      questionsAnswered: usage.questionsAnswered,
      averageSessionLength: usage.averageSessionLength,
      returnRate: usage.returnRate,
    },
    outcomeMetrics: {
      masteryGain: outcome.averageMasteryGain,
      fluencyGain: outcome.averageFluencyGain,
      retentionGain: outcome.averageRetentionGain,
      assessmentGain: outcome.averageAssessmentGain,
      readinessGain: outcome.averageReadinessGain,
    },
    generatedAt: new Date().toISOString(),
  };

  summary.recommendedActions = computeRecommendedActions(summary);
  return summary;
}

export async function validatePilotFeedbackEngine(options = {}) {
  const domainId = normalizeDomainId(options.domainId);
  const pilotId = normalizePilotId(options.pilotId);
  const now = Date.now();
  const studentId = normalizeString(options.studentId || `pilot-student-${now}`);
  const parentId = normalizeString(options.parentId || `pilot-parent-${now}`);
  const tutorId = normalizeString(options.tutorId || `pilot-tutor-${now}`);
  const teacherId = normalizeString(options.teacherId || `pilot-teacher-${now}`);

  const created = await Promise.all([
    submitStudentFeedback({
      pilotId,
      domainId,
      respondentId: studentId,
      studentId,
      ratings: {
        practiceStartEase: 4,
        difficultyFit: 4,
        explanationUsefulness: 5,
      },
      responses: {
        confusing: 'None this week.',
        improve: 'More mixed-number examples.',
      },
      overallRating: 4,
    }),
    submitParentFeedback({
      pilotId,
      domainId,
      respondentId: parentId,
      studentId,
      ratings: {
        progressUnderstandable: 4,
        dashboardUsefulness: 4,
        continueUsing: 5,
      },
      overallRating: 4,
    }),
    submitTutorFeedback({
      pilotId,
      domainId,
      respondentId: tutorId,
      studentId,
      ratings: {
        dataUseful: 4,
        recommendationsUseful: 4,
        lessonPrepUseful: 5,
      },
      responses: { missing: 'Would like a quicker misconception trend view.' },
    }),
    submitTeacherFeedback({
      pilotId,
      domainId,
      respondentId: teacherId,
      classId: normalizeString(options.classId || `pilot-class-${now}`),
      ratings: {
        classDataUseful: 4,
        interventionUseful: 4,
        masteryUseful: 4,
      },
      responses: { missing: 'Need one-click weekly export.' },
    }),
    reportPilotBug({
      pilotId,
      domainId,
      respondentId: tutorId,
      studentId,
      bugReport: {
        category: 'practice-session',
        severity: 'medium',
        description: 'Occasional retry needed on session complete.',
        screenshotUrl: '',
        reportedBy: tutorId,
      },
    }),
  ]);

  const summary = await buildPilotSummary({
    pilotId,
    domainId,
    studentIds: [studentId],
    startDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(now + 60 * 1000),
  });

  const savedBug = created.find((record) => record.feedbackType === 'bug');
  const checks = {
    feedbackRecordsSave: created.filter(Boolean).length >= 5,
    pilotSummaryGenerates: Boolean(summary && Number.isFinite(toNum(summary.completionRate, NaN))),
    outcomeMetricsIntegrate: ['averageMasteryGain', 'averageFluencyGain', 'averageRetentionGain', 'averageAssessmentGain']
      .every((key) => Number.isFinite(toNum(summary[key], NaN))),
    bugReportsSave: Boolean(savedBug?.bugReport?.description),
    satisfactionScoresCalculate:
      Number.isFinite(toNum(summary.averageParentSatisfaction, NaN)) &&
      Number.isFinite(toNum(summary.averageStudentSatisfaction, NaN)),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    createdFeedbackIds: created.map((entry) => String(entry._id)),
    summary,
  };
}

export const pilotFeedbackEngine = {
  createPilotFeedback,
  submitStudentFeedback,
  submitParentFeedback,
  submitTutorFeedback,
  submitTeacherFeedback,
  submitFounderNotes,
  reportPilotBug,
  listPilotFeedback,
  buildPilotSummary,
  validatePilotFeedbackEngine,
};

export default pilotFeedbackEngine;

