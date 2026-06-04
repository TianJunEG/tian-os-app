const STATUS = Object.freeze({
  NOT_FLUENT: 'not_fluent',
  DEVELOPING: 'developing',
  FLUENT: 'fluent',
});

const RETENTION_INTERVALS_DAYS = [3, 7, 14, 30];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value, places = 1) {
  const factor = 10 ** places;
  return Math.round(toNum(value, 0) * factor) / factor;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function normalizeConfidenceValue(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (['high', 'confident', 'very confident', 'i know this', 'know'].includes(raw)) return 100;
  if (['medium', 'not sure', "i'm not sure", 'im not sure', 'unsure'].includes(raw)) return 65;
  if (['low', 'guess', "i don't know", 'dont know', 'not confident'].includes(raw)) return 35;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 60;
  return n <= 1 ? clamp(n * 100) : clamp(n);
}

export function fluencyStatusFromScore(score = 0) {
  const value = toNum(score, 0);
  if (value >= 85) return STATUS.FLUENT;
  if (value >= 60) return STATUS.DEVELOPING;
  return STATUS.NOT_FLUENT;
}

export function speedScoreFromAverageTime(averageTimeSeconds = null, targetSeconds = 10) {
  if (averageTimeSeconds === null || averageTimeSeconds === undefined) return 0;
  const average = Math.max(0, toNum(averageTimeSeconds, 0));
  const target = Math.max(1, toNum(targetSeconds, 10));
  if (average <= target) return 100;
  if (average >= target * 4) return 0;
  return clamp(((target * 4 - average) / (target * 3)) * 100);
}

export function calculateFluencyScore({
  accuracy = 0,
  averageTimeSeconds = null,
  confidenceAverage = 60,
  targetSeconds = 10,
} = {}) {
  const accuracyComponent = clamp(toNum(accuracy, 0));
  const speedComponent = speedScoreFromAverageTime(averageTimeSeconds, targetSeconds);
  const confidenceComponent = clamp(toNum(confidenceAverage, 60));
  const fluencyScore = round(
    accuracyComponent * 0.6 +
    speedComponent * 0.25 +
    confidenceComponent * 0.15
  );
  return {
    fluencyScore,
    fluencyStatus: fluencyStatusFromScore(fluencyScore),
    components: {
      accuracy: round(accuracyComponent),
      speed: round(speedComponent),
      confidence: round(confidenceComponent),
    },
  };
}

export function normaliseFluencyAttempt(attempt = {}) {
  const start = attempt.questionStartTime || attempt.questionStartedAt || null;
  const submit = attempt.questionSubmitTime || attempt.questionSubmittedAt || attempt.questionEndedAt || null;
  const startDate = start ? new Date(start) : null;
  const submitDate = submit ? new Date(submit) : null;
  const derivedSeconds = startDate && submitDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(submitDate.getTime())
    ? Math.max(0, Math.round((submitDate.getTime() - startDate.getTime()) / 1000))
    : null;
  const explicitSeconds = attempt.timeTakenSeconds ?? attempt.timeSeconds ?? (attempt.timeMs !== undefined ? toNum(attempt.timeMs, 0) / 1000 : null);
  const timeTakenSeconds = derivedSeconds ?? (explicitSeconds === null ? null : round(explicitSeconds));

  return {
    questionId: attempt.questionId || '',
    answered: !attempt.skipped && attempt.answer !== undefined,
    skipped: Boolean(attempt.skipped),
    correct: Boolean(attempt.correct),
    confidence: attempt.confidence || attempt.confidenceLevel || '',
    confidenceValue: normalizeConfidenceValue(attempt.confidence || attempt.confidenceLevel || ''),
    workingSubmitted: Boolean(attempt.workingSubmitted || attempt.workingUploaded || attempt.fullscreenWorkingSubmitted),
    questionStartTime: start,
    questionSubmitTime: submit,
    timeTakenSeconds,
  };
}

export function calculateFluencyMetrics({ skillCode = '', attempts = [], targetSeconds = 10 } = {}) {
  const rows = attempts.map(normaliseFluencyAttempt);
  const totalQuestions = rows.length;
  const answered = rows.filter((row) => !row.skipped);
  const correctRows = rows.filter((row) => row.correct && !row.skipped);
  const timedRows = answered.filter((row) => row.timeTakenSeconds !== null);
  const confidenceRows = answered.filter((row) => row.confidence);
  const workingRows = rows.filter((row) => row.workingSubmitted);
  const correctAnswers = correctRows.length;
  const accuracy = totalQuestions ? round((correctAnswers / totalQuestions) * 100) : 0;
  const averageTimeSeconds = timedRows.length
    ? round(timedRows.reduce((sum, row) => sum + row.timeTakenSeconds, 0) / timedRows.length)
    : null;
  const confidenceAverage = confidenceRows.length
    ? round(confidenceRows.reduce((sum, row) => sum + row.confidenceValue, 0) / confidenceRows.length)
    : 60;
  const workingSubmissionRate = totalQuestions ? round((workingRows.length / totalQuestions) * 100) : 0;
  const score = calculateFluencyScore({ accuracy, averageTimeSeconds, confidenceAverage, targetSeconds });

  return {
    skillCode,
    totalQuestions,
    correctAnswers,
    accuracy,
    averageTimeSeconds,
    confidenceAverage,
    workingSubmissionRate,
    fluencyScore: score.fluencyScore,
    fluencyStatus: score.fluencyStatus,
    components: score.components,
    skippedQuestions: rows.filter((row) => row.skipped).length,
  };
}

export function buildRetentionReviews({ studentId = '', skillCode = '', skillId = null, fluentAt = new Date(), intervals = RETENTION_INTERVALS_DAYS } = {}) {
  const start = fluentAt instanceof Date ? fluentAt : new Date(fluentAt);
  return intervals.map((days) => ({
    studentId,
    skillId,
    skillCode,
    reviewDate: addDays(start, days),
    completed: false,
    retained: false,
    status: 'scheduled',
    intervalDays: days,
  }));
}

export function classifyFluencyBuckets(records = []) {
  const shape = (record) => ({
    skillId: record.skillId,
    skillCode: record.skillCode,
    skillName: record.skillName,
    accuracy: record.accuracy,
    averageTimeSeconds: record.averageTimeSeconds,
    fluencyStatus: record.fluencyStatus,
    fluencyScore: record.fluencyScore,
    interpretation: fluencyInterpretation(record),
  });
  return {
    fluentSkills: records.filter((record) => record.fluencyStatus === STATUS.FLUENT).map(shape),
    developingSkills: records.filter((record) => record.fluencyStatus === STATUS.DEVELOPING).map(shape),
    needsPracticeSkills: records.filter((record) => record.fluencyStatus === STATUS.NOT_FLUENT).map(shape),
  };
}

export function fluencyInterpretation(record = {}) {
  if (record.fluencyStatus === STATUS.FLUENT) {
    return 'This skill is accurate and quick enough for retention review.';
  }
  if (record.accuracy >= 85) {
    return 'Your child understands the concept but needs more practice to answer quickly and confidently.';
  }
  return 'This skill needs more accurate practice before fluency training.';
}

export { STATUS as FLUENCY_STATUS, RETENTION_INTERVALS_DAYS };
