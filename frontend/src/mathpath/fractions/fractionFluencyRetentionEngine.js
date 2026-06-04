import { getQuestionFamiliesBySkill, getQuestionFamily } from './fractionQuestionFamilies.js';
import { getSkill } from './fractionSkillGraph.js';

export const FLUENCY_STATES = {
  NOT_YET_FLUENT: 'not_yet_fluent',
  DEVELOPING: 'developing_fluency',
  FUNCTIONAL: 'functional_fluency',
  FLUENT: 'fluent',
  AUTOMATIC: 'automatic',
};

export const RETENTION_STATES = {
  NOT_REVIEWED: 'not_reviewed',
  REVIEW_DUE: 'review_due',
  REVIEW_SCHEDULED: 'review_scheduled',
  RETAINED: 'retained',
  RETENTION_RISK: 'retention_risk',
  FORGOTTEN: 'forgotten',
};

export const SPACED_REVIEW_INTERVALS_DAYS = [1, 7, 30, 90, 180];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value, places = 1) {
  const m = 10 ** places;
  return Math.round(toNum(value, 0) * m) / m;
}

function mean(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function standardDeviation(values = []) {
  if (values.length < 2) return 0;
  const avg = mean(values) || 0;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length);
}

function normalizeDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeConfidence(confidence = '') {
  const raw = String(confidence || '').toLowerCase();
  if (raw.includes('very')) return 95;
  if (raw.includes('confident')) return 82;
  if (raw.includes('unsure')) return 55;
  if (raw.includes('guess')) return 25;
  const n = Number(raw);
  if (Number.isFinite(n)) return n <= 1 ? n * 100 : clamp(n, 0, 100);
  return 60;
}

function attemptHasWorking(attempt = {}) {
  if (attempt.workingUploaded || attempt.workingSubmitted || attempt.fullscreenWorkingSubmitted) return true;
  if (Array.isArray(attempt.workingStrokes) && attempt.workingStrokes.length) return true;
  if (Array.isArray(attempt.fullscreenWorkingStrokes) && attempt.fullscreenWorkingStrokes.length) return true;
  if (Array.isArray(attempt.workingEvidence) && attempt.workingEvidence.length) return true;
  return toNum(attempt.workingLength, 0) > 0;
}

function isMentalMathEligible(attempt = {}) {
  if (attempt.mentalMathEligible === true || attempt.workingRequired === false || attempt.workingNotNeeded === true) return true;
  const family = attempt.questionFamilyId ? getQuestionFamily(attempt.questionFamilyId) : null;
  return Boolean(family?.mentalMathEligible);
}

function timingTargetForAttempt(attempt = {}, benchmark = null) {
  return benchmark || getFluencyBenchmark({
    skillId: attempt.skillId || '',
    level: attempt.level || 'P4',
    difficulty: attempt.difficulty || 2,
    questionFamilyId: attempt.questionFamilyId || '',
  });
}

function sortAttemptsByTime(attempts = []) {
  return attempts.slice().sort((a, b) => {
    const aTime = normalizeDate(a.timestamp || a.createdAt || a.questionStartedAt)?.getTime();
    const bTime = normalizeDate(b.timestamp || b.createdAt || b.questionStartedAt)?.getTime();
    if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
    return toNum(a.sequence ?? a.index, 0) - toNum(b.sequence ?? b.index, 0);
  });
}

export function getFluencyBenchmark({ skillId = '', level = 'P4', difficulty = 2, questionFamilyId = '' } = {}) {
  const family = questionFamilyId ? getQuestionFamily(questionFamilyId) : null;
  const base = family?.fluencyTargetSeconds || getSkill(skillId)?.fluency?.targetAverageSeconds || 30;
  const levelMultiplier = String(level).toUpperCase().startsWith('S') ? 0.85 : String(level).toUpperCase().startsWith('P6') ? 0.9 : 1;
  const difficultyMultiplier = 1 + Math.max(0, toNum(difficulty, 2) - 2) * 0.25;
  const fluent = Math.max(6, Math.round(base * levelMultiplier * difficultyMultiplier));
  return {
    skillId,
    level,
    difficulty,
    developingSeconds: fluent * 4,
    secureSeconds: fluent * 2,
    fluentSeconds: fluent,
    automaticSeconds: Math.max(4, Math.round(fluent * 0.65)),
    tunable: true,
  };
}

export function calculateQuestionTiming(event = {}) {
  const start = normalizeDate(event.questionStartedAt);
  const answerEnd = normalizeDate(event.answerSubmittedAt || event.questionEndedAt || event.timestamp);
  const workingEnd = normalizeDate(event.workingSubmittedAt || event.fullscreenWorkingSubmittedAt);
  const reviewEnd = normalizeDate(event.reviewEndedAt);
  const rawTime = toNum(event.rawTimeSeconds ?? event.timeSpentSeconds ?? event.timeTaken, null);
  const effectiveAnswerTimeSeconds = start && answerEnd
    ? Math.max(0, Math.round((answerEnd.getTime() - start.getTime()) / 1000))
    : rawTime;
  const workingSeconds = start && workingEnd
    ? Math.max(0, Math.round((workingEnd.getTime() - start.getTime()) / 1000))
    : toNum(event.workingTimeSeconds, 0);
  const reviewTimeSeconds = answerEnd && reviewEnd
    ? Math.max(0, Math.round((reviewEnd.getTime() - answerEnd.getTime()) / 1000))
    : toNum(event.reviewTimeSeconds, 0);
  const totalQuestionTimeSeconds = Math.max(
    toNum(rawTime, 0),
    toNum(effectiveAnswerTimeSeconds, 0),
    toNum(workingSeconds, 0)
  ) + reviewTimeSeconds;

  return {
    rawTimeSeconds: rawTime,
    effectiveAnswerTimeSeconds,
    workingTimeSeconds: workingSeconds,
    reviewTimeSeconds,
    totalQuestionTimeSeconds,
  };
}

export function buildSkillTimingHistory(attempts = []) {
  const bySkill = new Map();
  attempts.forEach((attempt) => {
    const skillId = String(attempt.skillId || '').toUpperCase();
    if (!skillId) return;
    if (!bySkill.has(skillId)) bySkill.set(skillId, []);
    bySkill.get(skillId).push({
      questionId: attempt.questionId || '',
      questionFamilyId: attempt.questionFamilyId || '',
      ...calculateQuestionTiming(attempt),
      correct: Boolean(attempt.correct),
      timestamp: attempt.timestamp || attempt.createdAt || null,
    });
  });
  return [...bySkill.entries()].reduce((acc, [skillId, rows]) => {
    const answered = rows.filter((row) => row.effectiveAnswerTimeSeconds !== null);
    acc[skillId] = {
      skillId,
      samples: rows,
      averageEffectiveAnswerTime: round(mean(answered.map((row) => row.effectiveAnswerTimeSeconds)) ?? 0),
      averageTotalQuestionTime: round(mean(answered.map((row) => row.totalQuestionTimeSeconds)) ?? 0),
      fastestCorrectTime: Math.min(...answered.filter((row) => row.correct).map((row) => row.effectiveAnswerTimeSeconds), Number.POSITIVE_INFINITY),
    };
    if (!Number.isFinite(acc[skillId].fastestCorrectTime)) acc[skillId].fastestCorrectTime = null;
    return acc;
  }, {});
}

export function analyzeWorkingDependence(attempts = []) {
  const total = attempts.length;
  const withWorking = attempts.filter((attempt) => attempt.workingUploaded || attempt.workingSubmitted || attempt.fullscreenWorkingSubmitted);
  const workingLengths = attempts.map((attempt) => {
    if (Array.isArray(attempt.workingStrokes)) return attempt.workingStrokes.length;
    if (Array.isArray(attempt.fullscreenWorkingStrokes)) return attempt.fullscreenWorkingStrokes.length;
    if (Array.isArray(attempt.workingEvidence)) return attempt.workingEvidence.length;
    return toNum(attempt.workingLength, 0);
  });
  const splitIndex = Math.max(1, Math.floor(attempts.length / 2));
  const earlier = attempts.slice(0, splitIndex);
  const recent = attempts.slice(splitIndex);
  const recentRate = recent.length ? recent.filter((a) => a.workingUploaded || a.workingSubmitted || a.fullscreenWorkingSubmitted).length / recent.length : 0;
  const earlierRate = earlier.length ? earlier.filter((a) => a.workingUploaded || a.workingSubmitted || a.fullscreenWorkingSubmitted).length / earlier.length : recentRate;
  const workingUsageRate = total ? withWorking.length / total : 0;
  let dependenceLevel = 'insufficient_data';
  if (total >= 3) {
    if (workingUsageRate >= 0.8 && mean(workingLengths) > 3) dependenceLevel = 'high_working_dependence';
    else if (workingUsageRate >= 0.35) dependenceLevel = 'healthy_working_use';
    else dependenceLevel = 'mental_or_automatic';
  }

  return {
    workingUsageRate: round(workingUsageRate * 100),
    averageWorkingLength: round(mean(workingLengths) ?? 0),
    workingFrequency: withWorking.length,
    trend: recentRate < earlierRate ? 'reducing_working' : recentRate > earlierRate ? 'increasing_working' : 'stable',
    dependenceLevel,
  };
}

export function evaluateAccuracyConsistency(attempts = []) {
  const answered = attempts.filter((attempt) => !attempt.skipped);
  const correct = answered.filter((attempt) => attempt.correct);
  const sessions = new Map();
  const variants = new Set();
  answered.forEach((attempt) => {
    const sessionId = attempt.sessionId || 'session_unknown';
    if (!sessions.has(sessionId)) sessions.set(sessionId, { total: 0, correct: 0 });
    sessions.get(sessionId).total += 1;
    if (attempt.correct) sessions.get(sessionId).correct += 1;
    if (attempt.questionFamilyId || attempt.questionId) variants.add(attempt.questionFamilyId || attempt.questionId);
  });
  const sessionSuccesses = [...sessions.values()].filter((session) => session.total && session.correct / session.total >= 0.8).length;
  const repeatedSuccess = correct.length >= 5 && answered.length && correct.length / answered.length >= 0.85;
  const multiSessionSuccess = sessionSuccesses >= 2;
  const variantSuccess = variants.size >= 3;

  return {
    accuracyRate: answered.length ? round((correct.length / answered.length) * 100) : 0,
    repeatedSuccess,
    multiSessionSuccess,
    variantSuccess,
    consistencyScore: round(((repeatedSuccess ? 35 : 0) + (multiSessionSuccess ? 35 : 0) + (variantSuccess ? 30 : 0))),
    preventsEarlyMastery: !(repeatedSuccess && multiSessionSuccess && variantSuccess),
    sessionsObserved: sessions.size,
    variantsObserved: variants.size,
  };
}

export function detectMentalCalculation({ attempts = [], benchmark = null } = {}) {
  const eligible = attempts.filter((attempt) => !attempt.skipped && isMentalMathEligible(attempt));
  const fastMentalCorrect = eligible.filter((attempt) => {
    if (!attempt.correct || attemptHasWorking(attempt)) return false;
    const timing = calculateQuestionTiming(attempt);
    if (timing.effectiveAnswerTimeSeconds === null) return false;
    const target = timingTargetForAttempt(attempt, benchmark);
    return timing.effectiveAnswerTimeSeconds <= target.fluentSeconds;
  });
  const mentalCalculationRate = eligible.length ? round((fastMentalCorrect.length / eligible.length) * 100) : 0;
  const detected = eligible.length >= 3 && mentalCalculationRate >= 60;

  return {
    mentalEligibleCount: eligible.length,
    fastMentalCorrectCount: fastMentalCorrect.length,
    mentalCalculationRate,
    detected,
    confidence: eligible.length >= 5 ? 'high' : eligible.length >= 3 ? 'medium' : 'low',
    evidence: detected ? 'fast_correct_answers_without_working' : 'insufficient_fast_mental_evidence',
  };
}

export function trackSpeedProgress({ attempts = [] } = {}) {
  const timedCorrect = sortAttemptsByTime(attempts)
    .map((attempt) => ({
      attempt,
      seconds: calculateQuestionTiming(attempt).effectiveAnswerTimeSeconds,
    }))
    .filter((row) => row.attempt.correct && row.seconds !== null);
  const times = timedCorrect.map((row) => row.seconds);
  const splitIndex = Math.max(1, Math.floor(times.length / 2));
  const earlierTimes = times.slice(0, splitIndex);
  const recentTimes = times.slice(splitIndex);
  const earlierAverageSeconds = mean(earlierTimes);
  const recentAverageSeconds = mean(recentTimes.length ? recentTimes : earlierTimes);
  const improvementPercent = earlierAverageSeconds && recentAverageSeconds !== null
    ? round(((earlierAverageSeconds - recentAverageSeconds) / earlierAverageSeconds) * 100)
    : 0;

  return {
    samples: times.length,
    personalBestSeconds: times.length ? Math.min(...times) : null,
    earlierAverageSeconds: earlierAverageSeconds === null ? null : round(earlierAverageSeconds),
    recentAverageSeconds: recentAverageSeconds === null ? null : round(recentAverageSeconds),
    speedImprovementPercent: improvementPercent,
    speedTrend: improvementPercent >= 10 ? 'improving' : improvementPercent <= -10 ? 'slowing' : 'stable',
  };
}

export function calculateAutomaticFluencyScore({
  accuracyRate = 0,
  averageResponseTime = null,
  benchmark = null,
  consistencyScore = 0,
  mentalCalculation = {},
  workingDependence = {},
  confidenceAverage = 60,
} = {}) {
  const timingBenchmark = benchmark || getFluencyBenchmark();
  const accuracyComponent = clamp(accuracyRate);
  const speedComponent = averageResponseTime === null
    ? 0
    : clamp(((timingBenchmark.secureSeconds - averageResponseTime) / Math.max(1, timingBenchmark.secureSeconds - timingBenchmark.automaticSeconds)) * 100);
  const mentalComponent = clamp(mentalCalculation.mentalCalculationRate || 0);
  const workingComponent = workingDependence.dependenceLevel === 'mental_or_automatic'
    ? 100
    : workingDependence.trend === 'reducing_working'
      ? 75
      : workingDependence.dependenceLevel === 'high_working_dependence'
        ? 25
        : 55;
  const score = round(
    accuracyComponent * 0.35 +
    speedComponent * 0.25 +
    clamp(consistencyScore) * 0.15 +
    mentalComponent * 0.15 +
    workingComponent * 0.05 +
    clamp(confidenceAverage) * 0.05
  );

  return {
    automaticFluencyScore: score,
    automaticityBand:
      score >= 90 && accuracyComponent >= 95 && mentalCalculation.detected ? FLUENCY_STATES.AUTOMATIC
        : score >= 78 ? FLUENCY_STATES.FLUENT
          : score >= 58 ? FLUENCY_STATES.FUNCTIONAL
            : score >= 40 ? FLUENCY_STATES.DEVELOPING
              : FLUENCY_STATES.NOT_YET_FLUENT,
    components: {
      accuracy: round(accuracyComponent),
      speed: round(speedComponent),
      consistency: round(consistencyScore),
      mentalCalculation: round(mentalComponent),
      workingIndependence: round(workingComponent),
      confidence: round(confidenceAverage),
    },
  };
}

export function calculateSkillFluencyProfile({ skillId = '', attempts = [], level = 'P4', difficulty = 2 } = {}) {
  const benchmark = getFluencyBenchmark({ skillId, level, difficulty, questionFamilyId: attempts[0]?.questionFamilyId || '' });
  const answered = attempts.filter((attempt) => !attempt.skipped);
  const correct = answered.filter((attempt) => attempt.correct);
  const timings = correct.map((attempt) => calculateQuestionTiming(attempt).effectiveAnswerTimeSeconds).filter((value) => value !== null);
  const averageTime = mean(timings);
  const sd = standardDeviation(timings);
  const consistency = evaluateAccuracyConsistency(attempts);
  const workingDependence = analyzeWorkingDependence(attempts);
  const confidenceAverage = answered.length ? mean(answered.map((attempt) => normalizeConfidence(attempt.confidence || attempt.confidenceLevel))) : null;
  const accuracy = answered.length ? correct.length / answered.length : 0;
  const speedScore = averageTime === null ? 0 : clamp((benchmark.developingSeconds - averageTime) / Math.max(1, benchmark.developingSeconds - benchmark.automaticSeconds) * 100);
  const consistencySpeedPenalty = averageTime ? clamp(100 - (sd / averageTime) * 100) : 0;
  const mentalCalculation = detectMentalCalculation({ attempts, benchmark });
  const speedTracking = trackSpeedProgress({ attempts });
  const workingIndependenceScore = workingDependence.dependenceLevel === 'mental_or_automatic'
    ? 100
    : workingDependence.trend === 'reducing_working'
      ? 80
      : workingDependence.dependenceLevel === 'high_working_dependence'
        ? 45
        : 65;
  const automaticFluency = calculateAutomaticFluencyScore({
    accuracyRate: accuracy * 100,
    averageResponseTime: averageTime,
    benchmark,
    consistencyScore: consistency.consistencyScore,
    mentalCalculation,
    workingDependence,
    confidenceAverage: confidenceAverage ?? 60,
  });
  const fluencyScore = round(
    accuracy * 40 +
    speedScore * 0.25 +
    consistency.consistencyScore * 0.2 +
    workingIndependenceScore * 0.1 +
    (confidenceAverage ?? 60) * 0.05
  );

  let fluencyState = FLUENCY_STATES.NOT_YET_FLUENT;
  if (accuracy >= 0.8 && fluencyScore >= 45) fluencyState = FLUENCY_STATES.DEVELOPING;
  if (accuracy >= 0.85 && averageTime !== null && averageTime <= benchmark.secureSeconds && consistency.consistencyScore >= 65) fluencyState = FLUENCY_STATES.FUNCTIONAL;
  if (accuracy >= 0.9 && averageTime !== null && averageTime <= benchmark.fluentSeconds && consistency.consistencyScore >= 75) fluencyState = FLUENCY_STATES.FLUENT;
  if (accuracy >= 0.95 && averageTime !== null && averageTime <= benchmark.automaticSeconds && consistency.consistencyScore >= 85 && mentalCalculation.detected) {
    fluencyState = FLUENCY_STATES.AUTOMATIC;
  }

  return {
    skillId,
    skillName: getSkill(skillId)?.name || skillId,
    fluencyScore,
    fluencyState,
    accuracyRate: round(accuracy * 100),
    averageResponseTime: averageTime === null ? null : round(averageTime),
    responseTimeSpread: round(sd),
    consistency,
    workingDependence,
    mentalCalculation,
    speedTracking,
    automaticFluencyScore: automaticFluency.automaticFluencyScore,
    automaticityBand: automaticFluency.automaticityBand,
    automaticFluencyComponents: automaticFluency.components,
    confidenceAverage: confidenceAverage === null ? null : round(confidenceAverage),
    benchmark,
    masteryScoreSeparate: true,
  };
}

export function buildTimedPracticeSession({
  skillId = '',
  level = 'P4',
  currentFluencyState = FLUENCY_STATES.DEVELOPING,
  durationMinutes = null,
  questionCount = null,
  mentalMathOnly = false,
} = {}) {
  const families = getQuestionFamiliesBySkill(skillId)
    .filter((family) => family.fluencyTargetSeconds || family.mentalMathEligible)
    .filter((family) => !mentalMathOnly || family.mentalMathEligible);
  const benchmark = getFluencyBenchmark({
    skillId,
    level,
    difficulty: getSkill(skillId)?.difficulty || 2,
    questionFamilyId: families[0]?.id || '',
  });
  const sessionLengthMinutes = durationMinutes || (currentFluencyState === FLUENCY_STATES.NOT_YET_FLUENT ? 6 : 4);
  const recommendedQuestionCount = questionCount || Math.max(6, Math.min(16, Math.round((sessionLengthMinutes * 60) / Math.max(benchmark.fluentSeconds, 1))));

  return {
    sessionId: `TIMED_FRA_${skillId}_${Date.now()}`,
    skillId,
    mode: 'timed_fluency_practice',
    sessionLengthMinutes,
    recommendedQuestionCount,
    questionFamilyIds: families.slice(0, 6).map((family) => family.id),
    timerVisible: true,
    perQuestionTargetSeconds: benchmark.fluentSeconds,
    automaticTargetSeconds: benchmark.automaticSeconds,
    timeTrackingRequired: true,
    scoreModel: 'accuracy_speed_consistency_automaticity',
    mentalMathOnly,
    workingAllowed: !mentalMathOnly,
  };
}

export function buildFluencyDrillPack({ skillId = '', level = 'P4', currentFluencyState = FLUENCY_STATES.DEVELOPING } = {}) {
  const families = getQuestionFamiliesBySkill(skillId).filter((family) => family.mentalMathEligible || family.fluencyTargetSeconds);
  const benchmark = getFluencyBenchmark({ skillId, level, difficulty: getSkill(skillId)?.difficulty || 2, questionFamilyId: families[0]?.id || '' });
  return {
    drillId: `DRILL_FRA_${skillId}_${currentFluencyState}`,
    skillId,
    mode: 'fluency_drill',
    sessionLengthMinutes: currentFluencyState === FLUENCY_STATES.NOT_YET_FLUENT ? 6 : 4,
    repetitionTarget: currentFluencyState === FLUENCY_STATES.AUTOMATIC ? 8 : 12,
    adaptiveDifficulty: true,
    timeTrackingRequired: true,
    questionFamilyIds: families.slice(0, 4).map((family) => family.id),
    targetSeconds: benchmark.fluentSeconds,
    timedPractice: buildTimedPracticeSession({ skillId, level, currentFluencyState }),
    examples: ['fraction comparison', 'equivalent fractions', 'mental percentages', 'algebra manipulation'],
  };
}

export function recommendFluencyIntervention(profile = {}) {
  if (profile.accuracyRate < 75) return { interventionType: 'concept_work', reason: 'Accuracy is not stable enough for a fluency drill.' };
  if ([FLUENCY_STATES.DEVELOPING, FLUENCY_STATES.FUNCTIONAL].includes(profile.fluencyState)) {
    return {
      interventionType: 'fluency_drill_pack',
      reason: 'Student understands the skill but needs speed and consistency.',
      drillPack: buildFluencyDrillPack({ skillId: profile.skillId, currentFluencyState: profile.fluencyState }),
    };
  }
  if (profile.workingDependence?.dependenceLevel === 'high_working_dependence') return { interventionType: 'working_to_mental_bridge', reason: 'Student still needs extensive working before automaticity.' };
  if ([FLUENCY_STATES.FLUENT, FLUENCY_STATES.AUTOMATIC].includes(profile.fluencyState)) return { interventionType: 'schedule_retention', reason: 'Fluency is strong enough to protect with spaced review.' };
  return { interventionType: 'guided_practice', reason: 'More accurate attempts are needed before fluency work.' };
}

export function buildSpacedReviewSchedule({ skillId = '', masteredAt = new Date(), intervals = SPACED_REVIEW_INTERVALS_DAYS } = {}) {
  const start = normalizeDate(masteredAt) || new Date();
  return {
    skillId,
    initialMasteryAt: start.toISOString(),
    reviews: intervals.map((days, index) => ({
      reviewNumber: index + 1,
      intervalDays: days,
      dueAt: addDays(start, days).toISOString(),
      status: RETENTION_STATES.REVIEW_SCHEDULED,
    })),
  };
}

export function buildRetentionScheduleFromFluency({
  profile = {},
  masteredAt = new Date(),
  intervals = SPACED_REVIEW_INTERVALS_DAYS,
} = {}) {
  const fluentEnough = [FLUENCY_STATES.FLUENT, FLUENCY_STATES.AUTOMATIC].includes(profile.fluencyState)
    || [FLUENCY_STATES.FLUENT, FLUENCY_STATES.AUTOMATIC].includes(profile.automaticityBand);
  if (!fluentEnough) {
    return {
      skillId: profile.skillId || '',
      shouldSchedule: false,
      reason: 'Schedule retention after the student is fluent, not just correct.',
      reviews: [],
    };
  }
  const schedule = buildSpacedReviewSchedule({ skillId: profile.skillId || '', masteredAt, intervals });
  return {
    ...schedule,
    shouldSchedule: true,
    reason: 'Protect fluent performance with spaced speed and accuracy checks.',
    sourceFluencyState: profile.fluencyState || null,
    automaticFluencyScore: profile.automaticFluencyScore ?? null,
    reviews: schedule.reviews.map((review) => ({
      ...review,
      reviewMode: 'speed_accuracy_retention',
      targetSeconds: profile.benchmark?.fluentSeconds || null,
      automaticTargetSeconds: profile.benchmark?.automaticSeconds || null,
    })),
  };
}

export function evaluateRetentionStatus({ skillId = '', masteredAt = null, retentionHistory = [], recentAttempts = [], asOf = new Date() } = {}) {
  const now = normalizeDate(asOf) || new Date();
  const latest = retentionHistory.slice().sort((a, b) => new Date(b.reviewedAt || b.timestamp || 0) - new Date(a.reviewedAt || a.timestamp || 0))[0];
  const dueSchedule = buildSpacedReviewSchedule({ skillId, masteredAt: masteredAt || now });
  const nextDue = dueSchedule.reviews.find((review) => new Date(review.dueAt) <= now && !retentionHistory.some((row) => toNum(row.reviewNumber) === review.reviewNumber));
  const recentAccuracy = evaluateAccuracyConsistency(recentAttempts).accuracyRate;
  let retentionState = RETENTION_STATES.NOT_REVIEWED;
  if (nextDue) retentionState = RETENTION_STATES.REVIEW_DUE;
  if (latest?.retentionState === RETENTION_STATES.RETAINED || latest?.retentionStatus === 'retained') retentionState = RETENTION_STATES.RETAINED;
  if (latest && ['needsReview', RETENTION_STATES.RETENTION_RISK].includes(latest.retentionStatus || latest.retentionState)) retentionState = RETENTION_STATES.RETENTION_RISK;
  if (latest && ['forgotten', RETENTION_STATES.FORGOTTEN].includes(latest.retentionStatus || latest.retentionState)) retentionState = RETENTION_STATES.FORGOTTEN;
  if (recentAttempts.length >= 3 && recentAccuracy < 70 && masteredAt) retentionState = RETENTION_STATES.RETENTION_RISK;

  return {
    skillId,
    retentionState,
    nextDueReview: nextDue || null,
    latestReview: latest || null,
    recentAccuracy,
    alert: [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.RETENTION_RISK, RETENTION_STATES.FORGOTTEN].includes(retentionState),
  };
}

export function detectForgetting({ masteredSkillIds = [], retentionHistoryBySkill = {}, recentAttempts = [] } = {}) {
  return masteredSkillIds.map((skillId) => {
    const attempts = recentAttempts.filter((attempt) => String(attempt.skillId).toUpperCase() === skillId);
    const status = evaluateRetentionStatus({
      skillId,
      masteredAt: retentionHistoryBySkill[skillId]?.masteredAt || new Date(Date.now() - 45 * 86400000),
      retentionHistory: retentionHistoryBySkill[skillId]?.reviews || [],
      recentAttempts: attempts,
    });
    return status.alert ? {
      skillId,
      alertType: status.retentionState === RETENTION_STATES.REVIEW_DUE ? 'retention_review_due' : 'forgetting_detected',
      message: `${getSkill(skillId)?.name || skillId} was previously mastered but now needs review.`,
      retentionState: status.retentionState,
    } : null;
  }).filter(Boolean);
}

export function generateRetentionReview({ skillId = '', previousQuestionIds = [], difficulty = 2 } = {}) {
  const previous = new Set(previousQuestionIds);
  const families = getQuestionFamiliesBySkill(skillId)
    .filter((family) => !previous.has(family.id))
    .sort((a, b) => Math.abs((a.difficulty || difficulty) - difficulty) - Math.abs((b.difficulty || difficulty) - difficulty));
  return {
    reviewId: `RET_FRA_${skillId}_${Date.now()}`,
    skillId,
    sameConcept: true,
    differentQuestions: true,
    preventMemorisation: true,
    questionFamilyIds: families.slice(0, 4).map((family) => family.id),
    recommendedQuestionCount: Math.min(8, Math.max(4, families.length)),
  };
}

export function analyzeConfidenceVsFluency(profile = {}) {
  const confidence = toNum(profile.confidenceAverage, 60);
  const accurate = toNum(profile.accuracyRate, 0) >= 85;
  const slow = profile.averageResponseTime !== null && profile.averageResponseTime > profile.benchmark?.secureSeconds;
  if (confidence >= 80 && slow && accurate) return { pattern: 'overconfident_but_slow', suggestion: 'Use fluency drill with visible timing feedback.' };
  if (confidence < 60 && accurate) return { pattern: 'accurate_but_lacking_confidence', suggestion: 'Use short success streaks and confidence reflection.' };
  if (confidence >= 75 && profile.accuracyRate < 75 && profile.averageResponseTime <= profile.benchmark?.fluentSeconds) return { pattern: 'fast_but_careless', suggestion: 'Slow down with accuracy-first checks.' };
  if (slow && accurate) return { pattern: 'slow_but_accurate', suggestion: 'Assign speed-building practice, not concept reteaching.' };
  return { pattern: 'balanced', suggestion: 'Continue current learning path.' };
}

export function calculateExamReadiness({ knowledgeScore = 0, fluencyScore = 0, confidenceScore = 0, retentionScore = 0, workingEvidenceScore = 0 } = {}) {
  const components = {
    knowledge: clamp(knowledgeScore),
    fluency: clamp(fluencyScore),
    confidence: clamp(confidenceScore),
    retention: clamp(retentionScore),
    workingEvidence: clamp(workingEvidenceScore),
  };
  const examReadinessScore = round(
    components.knowledge * 0.35 +
    components.fluency * 0.2 +
    components.confidence * 0.15 +
    components.retention * 0.2 +
    components.workingEvidence * 0.1
  );
  return {
    examReadinessScore,
    components,
    transparent: true,
    interpretation:
      examReadinessScore >= 80 ? 'exam_ready'
        : examReadinessScore >= 60 ? 'nearly_ready'
          : 'needs_preparation',
  };
}

export function buildFluencyRetentionDashboards({ profiles = [], retentionStatuses = [] } = {}) {
  const fluent = profiles.filter((profile) => [FLUENCY_STATES.FLUENT, FLUENCY_STATES.AUTOMATIC].includes(profile.fluencyState));
  const developing = profiles.filter((profile) => [FLUENCY_STATES.DEVELOPING, FLUENCY_STATES.FUNCTIONAL].includes(profile.fluencyState));
  const slow = profiles.filter((profile) => profile.fluencyState === FLUENCY_STATES.FUNCTIONAL || profile.averageResponseTime > profile.benchmark?.secureSeconds);
  const risks = retentionStatuses.filter((status) => [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.RETENTION_RISK, RETENTION_STATES.FORGOTTEN].includes(status.retentionState));
  return {
    student: {
      fluentSkills: fluent.map((p) => p.skillName),
      developingFluency: developing.map((p) => p.skillName),
      retentionReviewsDue: risks.map((r) => getSkill(r.skillId)?.name || r.skillId),
      recentlyRetainedSkills: retentionStatuses.filter((r) => r.retentionState === RETENTION_STATES.RETAINED).map((r) => getSkill(r.skillId)?.name || r.skillId),
      personalBests: profiles.map((p) => ({ skillId: p.skillId, fastestTime: p.personalBestTime || null })).filter((p) => p.fastestTime !== null),
    },
    parent: {
      strongSkills: fluent.map((p) => p.skillName),
      slowSkills: slow.map((p) => p.skillName),
      retentionRisks: risks,
      upcomingReviews: retentionStatuses.filter((r) => r.retentionState === RETENTION_STATES.REVIEW_DUE),
      recommendedSupportActions: profiles.map(recommendFluencyIntervention).slice(0, 5),
    },
    tutor: {
      fluencyDeficits: profiles.filter((p) => ![FLUENCY_STATES.FLUENT, FLUENCY_STATES.AUTOMATIC].includes(p.fluencyState)),
      retentionRisks: risks,
      speedWorkSkills: slow.map((p) => p.skillId),
      conceptWorkSkills: profiles.filter((p) => p.accuracyRate < 75).map((p) => p.skillId),
      suggestedInterventions: profiles.map((p) => ({ skillId: p.skillId, ...recommendFluencyIntervention(p) })),
    },
    teacher: {
      classFluencyDistribution: profiles.reduce((acc, profile) => {
        acc[profile.fluencyState] = (acc[profile.fluencyState] || 0) + 1;
        return acc;
      }, {}),
      skillsNeedingFluencyPractice: slow.map((p) => p.skillId),
      retentionTrends: risks,
      groupingRecommendations: [
        slow.length ? { groupName: 'Speed Work', skillIds: slow.map((p) => p.skillId) } : null,
        risks.length ? { groupName: 'Retention Review', skillIds: risks.map((r) => r.skillId) } : null,
      ].filter(Boolean),
    },
  };
}

export function validateFractionFluencyRetentionEngine() {
  const attempts = [
    { skillId: 'F010', questionFamilyId: 'QF_F010_001', questionId: 'q1', sessionId: 'a', correct: true, timeTaken: 32, confidence: 'Confident', workingUploaded: true, workingStrokes: [1, 2, 3] },
    { skillId: 'F010', questionFamilyId: 'QF_F010_002', questionId: 'q2', sessionId: 'a', correct: true, timeTaken: 28, confidence: 'Confident', workingUploaded: true, workingStrokes: [1, 2] },
    { skillId: 'F010', questionFamilyId: 'QF_F010_003', questionId: 'q3', sessionId: 'b', correct: true, timeTaken: 18, confidence: 'Very Confident', workingUploaded: false },
    { skillId: 'F010', questionFamilyId: 'QF_F010_004', questionId: 'q4', sessionId: 'b', correct: true, timeTaken: 16, confidence: 'Very Confident', workingUploaded: false },
    { skillId: 'F010', questionFamilyId: 'QF_F010_005', questionId: 'q5', sessionId: 'c', correct: true, timeTaken: 14, confidence: 'Very Confident', workingUploaded: false },
  ];
  const profile = calculateSkillFluencyProfile({ skillId: 'F010', attempts, level: 'P4', difficulty: 2 });
  const schedule = buildSpacedReviewSchedule({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z' });
  const fluencySchedule = buildRetentionScheduleFromFluency({ profile, masteredAt: '2026-01-01T00:00:00.000Z' });
  const due = evaluateRetentionStatus({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z', retentionHistory: [], recentAttempts: attempts, asOf: '2026-01-08T00:00:00.000Z' });
  const review = generateRetentionReview({ skillId: 'F010', previousQuestionIds: ['QF_F010_001'] });
  const exam = calculateExamReadiness({ knowledgeScore: 85, fluencyScore: profile.fluencyScore, confidenceScore: 90, retentionScore: 70, workingEvidenceScore: 80 });
  const dashboards = buildFluencyRetentionDashboards({ profiles: [profile], retentionStatuses: [due] });

  const checks = {
    fluencySeparateFromMastery: profile.masteryScoreSeparate === true,
    timingHistoryWorks: Boolean(buildSkillTimingHistory(attempts).F010),
    benchmarkHasThreeBands: Boolean(profile.benchmark.developingSeconds && profile.benchmark.secureSeconds && profile.benchmark.fluentSeconds),
    workingDependenceDetected: profile.workingDependence.trend === 'reducing_working',
    consistencyPreventsEarlyMastery: typeof profile.consistency.preventsEarlyMastery === 'boolean',
    drillPackGenerated: buildFluencyDrillPack({ skillId: 'F010' }).mode === 'fluency_drill',
    timedPracticeGenerated: buildTimedPracticeSession({ skillId: 'F010' }).mode === 'timed_fluency_practice',
    automaticScoreGenerated: typeof profile.automaticFluencyScore === 'number',
    mentalCalculationTracked: typeof profile.mentalCalculation.detected === 'boolean',
    speedTrackingGenerated: typeof profile.speedTracking.speedTrend === 'string',
    retentionHasFiveReviews: schedule.reviews.length === 5 && schedule.reviews[4].intervalDays === 180,
    retentionCanFollowFluency: Array.isArray(fluencySchedule.reviews),
    retentionDueDetected: due.retentionState === RETENTION_STATES.REVIEW_DUE,
    reviewUsesDifferentQuestions: !review.questionFamilyIds.includes('QF_F010_001'),
    examReadinessTransparent: exam.transparent === true && Object.keys(exam.components).length === 5,
    dashboardsBuilt: Boolean(dashboards.student && dashboards.parent && dashboards.tutor && dashboards.teacher),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: { profile, schedule, due, review, exam, dashboards },
  };
}

export const fractionFluencyRetentionEngine = {
  getFluencyBenchmark,
  calculateQuestionTiming,
  buildSkillTimingHistory,
  analyzeWorkingDependence,
  evaluateAccuracyConsistency,
  detectMentalCalculation,
  trackSpeedProgress,
  calculateAutomaticFluencyScore,
  calculateSkillFluencyProfile,
  buildTimedPracticeSession,
  buildFluencyDrillPack,
  recommendFluencyIntervention,
  buildSpacedReviewSchedule,
  buildRetentionScheduleFromFluency,
  evaluateRetentionStatus,
  detectForgetting,
  generateRetentionReview,
  analyzeConfidenceVsFluency,
  calculateExamReadiness,
  buildFluencyRetentionDashboards,
  validateFractionFluencyRetentionEngine,
  FLUENCY_STATES,
  RETENTION_STATES,
  SPACED_REVIEW_INTERVALS_DAYS,
};

export default fractionFluencyRetentionEngine;
