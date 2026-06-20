import LearningTelemetryEvent, { LEARNING_EVENT_TYPES } from '../../models/LearningTelemetryEvent.js';
import Subscription from '../../models/Subscription.js';
import logger from '../../config/logger.js';

export const CONFIDENCE = Object.freeze({
  I_KNOW_THIS: 'I_KNOW_THIS',
  IM_NOT_SURE: 'IM_NOT_SURE',
  I_DONT_KNOW: 'I_DONT_KNOW',
});

const CONFIDENCE_ALIASES = Object.freeze({
  i_know_this: CONFIDENCE.I_KNOW_THIS,
  know: CONFIDENCE.I_KNOW_THIS,
  high: CONFIDENCE.I_KNOW_THIS,
  confident: CONFIDENCE.I_KNOW_THIS,
  very_confident: CONFIDENCE.I_KNOW_THIS,
  "i'm_not_sure": CONFIDENCE.IM_NOT_SURE,
  im_not_sure: CONFIDENCE.IM_NOT_SURE,
  not_sure: CONFIDENCE.IM_NOT_SURE,
  low: CONFIDENCE.IM_NOT_SURE,
  unsure: CONFIDENCE.IM_NOT_SURE,
  i_dont_know: CONFIDENCE.I_DONT_KNOW,
  "i_don't_know": CONFIDENCE.I_DONT_KNOW,
  dont_know: CONFIDENCE.I_DONT_KNOW,
  not_ready: CONFIDENCE.I_DONT_KNOW,
  i_need_help: CONFIDENCE.I_DONT_KNOW,
});

export function normalizeConfidence(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (Object.values(CONFIDENCE).includes(raw)) return raw;
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  return CONFIDENCE_ALIASES[key] || raw.toUpperCase();
}

function cleanMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata || {}).filter(([, value]) => value !== undefined)
  );
}

export async function recordLearningEvent(event = {}) {
  if (!event?.studentId || !event?.eventType) return null;
  const eventType = String(event.eventType);
  if (!LEARNING_EVENT_TYPES.includes(eventType)) {
    return null;
  }
  try {
    return await LearningTelemetryEvent.create({
      studentId: String(event.studentId),
      eventType,
      domain: String(event.domain || event.domainId || ''),
      subjectId: String(event.subjectId || ''),
      skillCode: String(event.skillCode || event.skillId || ''),
      questionId: String(event.questionId || ''),
      sessionId: String(event.sessionId || ''),
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      metadata: cleanMetadata(event.metadata || {}),
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'learning-telemetry event write failed');
    return null;
  }
}

export async function recordLearningEvents(events = []) {
  const docs = (events || [])
    .filter((event) => event?.studentId && event?.eventType && LEARNING_EVENT_TYPES.includes(String(event.eventType)))
    .map((event) => ({
      studentId: String(event.studentId),
      eventType: String(event.eventType),
      domain: String(event.domain || event.domainId || ''),
      subjectId: String(event.subjectId || ''),
      skillCode: String(event.skillCode || event.skillId || ''),
      questionId: String(event.questionId || ''),
      sessionId: String(event.sessionId || ''),
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      metadata: cleanMetadata(event.metadata || {}),
    }));
  if (!docs.length) return [];
  try {
    return await LearningTelemetryEvent.insertMany(docs, { ordered: false });
  } catch (err) {
    logger.warn({ err: err.message }, 'learning-telemetry event batch write failed');
    return [];
  }
}

function pct(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function avg(values = []) {
  const nums = values.map(Number).filter((value) => Number.isFinite(value));
  return nums.length ? Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length) : 0;
}

function filterSince(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - Number(days || 30));
  return since;
}

function questionAnsweredFilter(studentId, days) {
  return {
    ...(studentId ? { studentId: String(studentId) } : {}),
    eventType: 'question_answered',
    timestamp: { $gte: filterSince(days) },
  };
}

export function aggregateConfidenceBuckets(events = []) {
  const buckets = {
    confidentCorrect: 0,
    confidentIncorrect: 0,
    unsureCorrect: 0,
    unsureIncorrect: 0,
    needsHelpCorrect: 0,
    needsHelpIncorrect: 0,
  };

  for (const event of events || []) {
    const confidence = normalizeConfidence(event?.metadata?.confidence ?? event?.confidence ?? event?.confidenceLevel ?? event?.reflection);
    if (!confidence) continue;
    const correct = event?.metadata?.answerCorrect ?? event?.answerCorrect ?? event?.correct;
    if (correct !== true && correct !== false) continue;

    if (confidence === CONFIDENCE.I_KNOW_THIS) {
      buckets[correct ? 'confidentCorrect' : 'confidentIncorrect'] += 1;
    } else if (confidence === CONFIDENCE.IM_NOT_SURE) {
      buckets[correct ? 'unsureCorrect' : 'unsureIncorrect'] += 1;
    } else if (confidence === CONFIDENCE.I_DONT_KNOW) {
      buckets[correct ? 'needsHelpCorrect' : 'needsHelpIncorrect'] += 1;
    }
  }

  return buckets;
}

export async function getStudentAnalytics({ studentId, days = 30 } = {}) {
  const base = { studentId: String(studentId), timestamp: { $gte: filterSince(days) } };
  const [answered, completedSessions, masteredEvents] = await Promise.all([
    LearningTelemetryEvent.find({ ...base, eventType: 'question_answered' }).lean(),
    LearningTelemetryEvent.find({ ...base, eventType: 'session_completed' }).lean(),
    LearningTelemetryEvent.find({ ...base, eventType: 'skill_mastered' }).lean(),
  ]);
  const correct = answered.filter((event) => event.metadata?.answerCorrect === true).length;
  const confidenceValues = answered.map((event) => normalizeConfidence(event.metadata?.confidence)).filter(Boolean);
  const confidenceCounts = confidenceValues.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const workingSubmitted = answered.filter((event) => event.metadata?.workingSubmitted === true).length;
  const workingNotNeeded = answered.filter((event) => event.metadata?.workingNotNeeded === true).length;
  const overconfidentWrong = answered.filter((event) => (
    event.metadata?.answerCorrect === false
    && normalizeConfidence(event.metadata?.confidence) === CONFIDENCE.I_KNOW_THIS
  )).length;
  const confidenceBuckets = aggregateConfidenceBuckets(answered);
  const confidenceSampleSize = Object.values(confidenceBuckets).reduce((sum, value) => sum + value, 0);

  return {
    studentId: String(studentId),
    windowDays: Number(days || 30),
    questionsAnswered: answered.length,
    questionsCorrect: correct,
    accuracyRate: pct(correct, answered.length),
    averageConfidence: confidenceValues.length ? confidenceCounts[CONFIDENCE.I_KNOW_THIS] || 0 : 0,
    confidenceDistribution: confidenceCounts,
    confidenceBuckets,
    confidenceSampleSize,
    overconfidenceRate: pct(overconfidentWrong, answered.length),
    workingSubmissionRate: pct(workingSubmitted, answered.length),
    workingNotNeededRate: pct(workingNotNeeded, answered.length),
    skillsMastered: new Set(masteredEvents.map((event) => event.skillCode).filter(Boolean)).size,
    currentStreak: calculateTelemetryStreak([...answered, ...completedSessions]),
    emptyStates: {
      accuracy: answered.length ? '' : 'No practice completed this week.',
      questionsAnswered: answered.length ? '' : 'No questions answered this week.',
      workingSubmitted: workingSubmitted ? '' : 'No working submitted yet.',
      confidenceInsight: confidenceSampleSize ? '' : 'Complete more questions to generate confidence insights.',
    },
  };
}

export async function getSkillAnalytics({ domain = '', days = 30, limit = 10 } = {}) {
  const events = await LearningTelemetryEvent.find({
    eventType: 'question_answered',
    timestamp: { $gte: filterSince(days) },
    ...(domain ? { domain } : {}),
  }).lean();
  const bySkill = new Map();
  for (const event of events) {
    const skill = event.skillCode || 'unmapped';
    if (!bySkill.has(skill)) {
      bySkill.set(skill, {
        skillCode: skill,
        answered: 0,
        missed: 0,
        skipped: 0,
        helpRequested: 0,
        overconfidentWrong: 0,
      });
    }
    const row = bySkill.get(skill);
    row.answered += 1;
    if (event.metadata?.answerCorrect === false) row.missed += 1;
    if (event.metadata?.skipped === true) row.skipped += 1;
    if (event.metadata?.helpRequested === true) row.helpRequested += 1;
    if (event.metadata?.answerCorrect === false && normalizeConfidence(event.metadata?.confidence) === CONFIDENCE.I_KNOW_THIS) {
      row.overconfidentWrong += 1;
    }
  }
  const rows = [...bySkill.values()].map((row) => ({
    ...row,
    missedRate: pct(row.missed, row.answered),
    skippedRate: pct(row.skipped, row.answered),
    overconfidenceRate: pct(row.overconfidentWrong, row.answered),
  }));
  const take = Number(limit || 10);
  return {
    mostMissedSkills: [...rows].sort((a, b) => b.missed - a.missed).slice(0, take),
    highestConfidenceWrongAnswers: [...rows].sort((a, b) => b.overconfidentWrong - a.overconfidentWrong).slice(0, take),
    mostRequestedHelpSkills: [...rows].sort((a, b) => b.helpRequested - a.helpRequested).slice(0, take),
    mostSkippedSkills: [...rows].sort((a, b) => b.skipped - a.skipped).slice(0, take),
  };
}

export async function getPilotAnalytics({ days = 30, domain = '' } = {}) {
  const since = filterSince(days);
  const filter = { timestamp: { $gte: since }, ...(domain ? { domain } : {}) };
  const [
    allEvents,
    answered,
    startedSessions,
    completedSessions,
    abandonedSessions,
    diagnosticCompletions,
    masteredEvents,
  ] = await Promise.all([
    LearningTelemetryEvent.find(filter).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'question_answered' }).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'session_started' }).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'session_completed' }).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'session_abandoned' }).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'diagnostic_completed' }).lean(),
    LearningTelemetryEvent.find({ ...filter, eventType: 'skill_mastered' }).lean(),
  ]);
  const activeStudents = new Set(allEvents.map((event) => event.studentId).filter(Boolean));
  const activeDaysByStudent = new Set(allEvents.map((event) => `${event.studentId}:${new Date(event.timestamp).toISOString().slice(0, 10)}`));
  const sessionLengths = completedSessions.map((event) => event.metadata?.sessionLengthSeconds).filter((value) => Number.isFinite(Number(value)));
  const questionsBySession = answered.reduce((acc, event) => {
    const key = event.sessionId || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const correct = answered.filter((event) => event.metadata?.answerCorrect === true).length;
  const workingSubmitted = answered.filter((event) => event.metadata?.workingSubmitted === true).length;
  const workingNotNeeded = answered.filter((event) => event.metadata?.workingNotNeeded === true).length;
  const withWorking = answered.filter((event) => event.metadata?.workingSubmitted === true);
  const withoutWorking = answered.filter((event) => !event.metadata?.workingSubmitted);
  const withWorkingCorrect = withWorking.filter((event) => event.metadata?.answerCorrect === true).length;
  const withoutWorkingCorrect = withoutWorking.filter((event) => event.metadata?.answerCorrect === true).length;
  const highRiskNoWorkingErrors = answered.filter((event) => (
    event.metadata?.answerCorrect === false
    && event.metadata?.workingNotNeeded === true
    && normalizeConfidence(event.metadata?.confidence) === CONFIDENCE.I_KNOW_THIS
  )).length;
  const byStudent = new Map();
  for (const event of allEvents) {
    const key = event.studentId || 'unknown';
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        studentId: key,
        events: 0,
        questionsAnswered: 0,
        sessionsCompleted: 0,
        lastActiveAt: event.timestamp,
      });
    }
    const row = byStudent.get(key);
    row.events += 1;
    if (event.eventType === 'question_answered') row.questionsAnswered += 1;
    if (event.eventType === 'session_completed') row.sessionsCompleted += 1;
    if (new Date(event.timestamp) > new Date(row.lastActiveAt)) row.lastActiveAt = event.timestamp;
  }
  const eventCounts = allEvents.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {});
  const requiredPilotEvents = [
    'session_started',
    'session_completed',
    'question_viewed',
    'question_answered',
    'question_skipped',
    'confidence_selected',
    'working_submitted',
    'working_not_needed_declared',
    'skill_mastered',
  ];

  return {
    windowDays: Number(days || 30),
    studentOverview: {
      questionsAnswered: answered.length,
      questionsCorrect: correct,
      averageConfidence: confidenceSummary(answered),
      workingSubmissionRate: pct(workingSubmitted, answered.length),
      workingNotNeededRate: pct(workingNotNeeded, answered.length),
      skillsMastered: new Set(masteredEvents.map((event) => `${event.studentId}:${event.skillCode}`).filter(Boolean)).size,
      currentStreak: avg([...activeStudents].map((studentId) => calculateTelemetryStreak(allEvents.filter((event) => event.studentId === studentId)))),
    },
    pilotMetrics: {
      dailyActiveStudents: activeDaysByStudent.size,
      activeStudents: activeStudents.size,
      questionsAnswered: answered.length,
      practiceSessions: startedSessions.length,
      diagnosticCompletions: diagnosticCompletions.length,
      averageSessionLengthSeconds: avg(sessionLengths),
      averageQuestionsPerSession: avg(Object.values(questionsBySession)),
      completionRate: pct(completedSessions.length, startedSessions.length),
      abandonmentRate: pct(abandonedSessions.length, startedSessions.length),
    },
    workingBehaviour: {
      workingUsageRate: pct(workingSubmitted, answered.length),
      workingSubmissionRate: pct(workingSubmitted, answered.length),
      noWorkingDeclarationRate: pct(workingNotNeeded, answered.length),
      accuracyWithWorking: pct(withWorkingCorrect, withWorking.length),
      accuracyWithoutWorking: pct(withoutWorkingCorrect, withoutWorking.length),
      highRiskNoWorkingErrors,
    },
    overconfidence: {
      overconfidentWrongAnswers: answered.filter((event) => (
        event.metadata?.answerCorrect === false
        && normalizeConfidence(event.metadata?.confidence) === CONFIDENCE.I_KNOW_THIS
      )).length,
      overconfidenceRate: pct(
        answered.filter((event) => event.metadata?.answerCorrect === false && normalizeConfidence(event.metadata?.confidence) === CONFIDENCE.I_KNOW_THIS).length,
        answered.length
      ),
    },
    skillMetrics: await getSkillAnalytics({ domain, days }),
    mostActiveStudents: [...byStudent.values()].sort((a, b) => b.events - a.events).slice(0, 10),
    telemetryCoverage: {
      eventCounts,
      requiredPilotEvents: requiredPilotEvents.map((eventType) => ({
        eventType,
        count: eventCounts[eventType] || 0,
        present: Boolean(eventCounts[eventType]),
      })),
      missingEvents: requiredPilotEvents.filter((eventType) => !eventCounts[eventType]),
    },
  };
}

function confidenceSummary(events = []) {
  const values = events.map((event) => normalizeConfidence(event.metadata?.confidence)).filter(Boolean);
  if (!values.length) return '';
  const counts = values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function calculateTelemetryStreak(events = []) {
  const days = new Set(events.map((event) => new Date(event.timestamp).toISOString().slice(0, 10)));
  if (!days.size) return 0;
  let cursor = new Date();
  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (days.has(cursor.toISOString().slice(0, 10))) continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Comics engagement + trial→paid funnel (Phase 3). Reads the comic_episode_*
// telemetry events and joins them against subscriptions on the user, to answer
// the two questions the comics feature exists for: are kids coming back, and
// does comic engagement during a trial correlate with converting to paid?
export async function getComicAnalytics({ days = 30 } = {}) {
  const windowDays = Number(days) || 30;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  // --- Engagement in the window (retention) ---
  const events = await LearningTelemetryEvent.find(
    { eventType: { $in: ['comic_episode_opened', 'comic_episode_completed'] }, timestamp: { $gte: since } },
    { eventType: 1, studentId: 1, timestamp: 1 },
  ).lean();

  let opens = 0;
  let completions = 0;
  const readers = new Set();
  const dayBuckets = new Map(); // YYYY-MM-DD → completions that day
  for (const e of events) {
    readers.add(e.studentId);
    if (e.eventType === 'comic_episode_opened') opens += 1;
    else if (e.eventType === 'comic_episode_completed') {
      completions += 1;
      const key = new Date(e.timestamp).toISOString().slice(0, 10);
      dayBuckets.set(key, (dayBuckets.get(key) || 0) + 1);
    }
  }
  const dailyCompletions = [...dayBuckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));

  // --- Trial → paid funnel (conversion) ---
  // One subscription per user (unique {ownerType, ownerId}). A user "converted"
  // if their (trial-bearing) subscription is now active. They "engaged during
  // trial" if they completed a comic episode within [trialStart, trialEnd].
  const trialSubs = await Subscription.find(
    { ownerType: 'user', trialStart: { $ne: null }, trialEnd: { $ne: null } },
    { ownerId: 1, status: 1, trialStart: 1, trialEnd: 1 },
  ).lean();

  const trialUserIds = trialSubs.map((s) => String(s.ownerId));
  const trialCompletions = trialUserIds.length
    ? await LearningTelemetryEvent.find(
      { eventType: 'comic_episode_completed', studentId: { $in: trialUserIds } },
      { studentId: 1, timestamp: 1 },
    ).lean()
    : [];
  const completionsByUser = new Map();
  for (const e of trialCompletions) {
    if (!completionsByUser.has(e.studentId)) completionsByUser.set(e.studentId, []);
    completionsByUser.get(e.studentId).push(new Date(e.timestamp));
  }

  let engaged = 0;
  let engagedConverted = 0;
  let notEngaged = 0;
  let notEngagedConverted = 0;
  for (const s of trialSubs) {
    const converted = s.status === 'active';
    const stamps = completionsByUser.get(String(s.ownerId)) || [];
    const ts = new Date(s.trialStart);
    const te = new Date(s.trialEnd);
    const didEngage = stamps.some((t) => t >= ts && t <= te);
    if (didEngage) { engaged += 1; if (converted) engagedConverted += 1; }
    else { notEngaged += 1; if (converted) notEngagedConverted += 1; }
  }
  const pct = (c, n) => (n ? Math.round((c / n) * 1000) / 10 : 0); // 1-dp %

  return {
    windowDays,
    engagement: {
      opens,
      completions,
      distinctReaders: readers.size,
      dailyCompletions,
    },
    trialFunnel: {
      trialUsers: trialSubs.length,
      engagedDuringTrial: engaged,
      engagedRate: pct(engaged, trialSubs.length),
      conversion: {
        engaged: { users: engaged, converted: engagedConverted, rate: pct(engagedConverted, engaged) },
        notEngaged: { users: notEngaged, converted: notEngagedConverted, rate: pct(notEngagedConverted, notEngaged) },
      },
    },
  };
}

export default {
  recordLearningEvent,
  recordLearningEvents,
  getStudentAnalytics,
  getSkillAnalytics,
  getPilotAnalytics,
  getComicAnalytics,
  normalizeConfidence,
};
