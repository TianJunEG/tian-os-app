import { fractionSkillGraph, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeConfidence(confidence) {
  if (typeof confidence === 'number') return Math.max(1, Math.min(4, confidence));
  const raw = String(confidence || '').toLowerCase();
  if (raw.includes('very')) return 4;
  if (raw.includes('confident')) return 3;
  if (raw.includes('unsure')) return 2;
  if (raw.includes('guess')) return 1;
  return 2.5;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function standardDeviation(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeConsistencyScore(attempts, benchmarkSeconds) {
  if (!attempts.length) return 0;
  const correctAttempts = attempts.filter((a) => a.correct);
  if (!correctAttempts.length) return 0;
  const accuracy = correctAttempts.length / attempts.length;
  const times = correctAttempts.map((a) => toNumber(a.timeTaken, benchmarkSeconds * 2)).sort((a, b) => a - b);
  const median = percentile(times, 50) ?? benchmarkSeconds * 2;
  const sd = standardDeviation(times);
  const relativeSpread = median > 0 ? sd / median : 1;
  const stabilityScore = Math.max(0, 1 - Math.min(1, relativeSpread));
  const volumeScore = Math.min(1, attempts.length / 5);
  const consistency = (accuracy * 0.5 + stabilityScore * 0.3 + volumeScore * 0.2) * 100;
  return Math.round(consistency * 10) / 10;
}

function getBenchmarkBundle(questionFamily) {
  if (questionFamily?.fluencyBenchmarks) return questionFamily.fluencyBenchmarks;
  const base = questionFamily?.fluencyTargetSeconds || 20;
  return {
    bronze: Math.round(base * 1.8),
    silver: Math.round(base * 1.4),
    gold: base,
    platinum: Math.max(4, Math.round(base * 0.7)),
  };
}

export function classifyFluencyLevel(metrics = {}) {
  const accuracy = toNumber(metrics.accuracy);
  const averageTime = toNumber(metrics.averageTime, Number.MAX_SAFE_INTEGER);
  const consistencyScore = toNumber(metrics.consistencyScore);
  const benchmarks = metrics.benchmarks || { bronze: 30, silver: 20, gold: 12, platinum: 8 };
  const attemptsCount = toNumber(metrics.attemptsCount);
  const confidenceAdjusted = toNumber(metrics.confidenceAdjusted, 1);

  if (accuracy < 80 || attemptsCount < 3) return 'notReady';
  if (averageTime <= benchmarks.platinum && accuracy >= 95 && consistencyScore >= 85 && confidenceAdjusted >= 1) return 'platinum';
  if (averageTime <= benchmarks.gold && accuracy >= 92 && consistencyScore >= 75) return 'gold';
  if (averageTime <= benchmarks.silver && accuracy >= 88 && consistencyScore >= 65) return 'silver';
  if (averageTime <= benchmarks.bronze && accuracy >= 85 && consistencyScore >= 55) return 'bronze';
  return 'notReady';
}

export function calculateQuestionFluency(attempt = {}, questionFamily = {}) {
  const benchmarks = getBenchmarkBundle(questionFamily);
  const benchmarkSeconds = benchmarks.gold;
  const correct = Boolean(attempt.correct);
  const skipped = Boolean(attempt.skipped);
  const timeTaken = toNumber(attempt.timeTaken, benchmarkSeconds * 3);
  const confidenceScore = normalizeConfidence(attempt.confidence);
  const confidenceAdjusted = confidenceScore >= 3 ? 1 : confidenceScore <= 1.5 ? 0.8 : 0.9;
  const timeRatio = Math.round((timeTaken / benchmarkSeconds) * 100) / 100;

  let fluencyFlag = 'inaccurate';
  const notes = [];
  if (skipped) {
    fluencyFlag = 'skipped';
  } else if (!correct) {
    fluencyFlag = 'inaccurate';
  } else if (timeTaken <= benchmarks.platinum && confidenceAdjusted >= 1) {
    fluencyFlag = 'automatic';
  } else if (timeTaken <= benchmarks.bronze) {
    fluencyFlag = 'accurateAndFluent';
  } else {
    fluencyFlag = 'accurateButSlow';
  }

  if (confidenceAdjusted < 1) notes.push('Low confidence reduced fluency certainty.');
  if (questionFamily.workingRequired && !questionFamily.mentalMathEligible) {
    notes.push('Working required for full mastery confirmation.');
    if (fluencyFlag === 'automatic') fluencyFlag = 'accurateAndFluent';
  }

  return {
    fluencyFlag,
    timeRatio,
    benchmarkSeconds,
    confidenceAdjusted,
    notes,
  };
}

export function calculateQuestionFamilyFluency(attempts = [], questionFamily = {}) {
  const familyId = questionFamily.id || '';
  const benchmarks = getBenchmarkBundle(questionFamily);
  const scored = attempts.map((attempt) => ({
    attempt,
    score: calculateQuestionFluency(attempt, questionFamily),
  }));

  const nonSkipped = scored.filter((x) => !x.attempt.skipped);
  const correct = nonSkipped.filter((x) => x.attempt.correct);
  const accuracy = nonSkipped.length ? (correct.length / nonSkipped.length) * 100 : 0;
  const times = correct.map((x) => toNumber(x.attempt.timeTaken, benchmarks.bronze * 2)).sort((a, b) => a - b);
  const averageTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
  const medianTime = times.length ? percentile(times, 50) : null;
  const consistencyScore = computeConsistencyScore(nonSkipped.map((x) => x.attempt), benchmarks.gold);
  const avgConfidenceAdj =
    scored.length ? scored.reduce((sum, x) => sum + x.score.confidenceAdjusted, 0) / scored.length : 1;

  const fluencyLevel = classifyFluencyLevel({
    accuracy,
    averageTime,
    consistencyScore,
    benchmarks,
    attemptsCount: nonSkipped.length,
    confidenceAdjusted: avgConfidenceAdj,
  });

  const fluentCount = scored.filter((x) => ['accurateAndFluent', 'automatic'].includes(x.score.fluencyFlag)).length;
  const slowCorrectCount = scored.filter((x) => x.score.fluencyFlag === 'accurateButSlow').length;
  const inaccurateCount = scored.filter((x) => x.score.fluencyFlag === 'inaccurate').length;

  let status = 'learning';
  if (accuracy < 70) status = 'weak';
  else if (accuracy >= 85 && slowCorrectCount > fluentCount) status = 'accurateButSlow';
  else if (fluencyLevel === 'platinum' && consistencyScore >= 85 && nonSkipped.length >= 5) status = 'automatic';
  else if (['gold', 'silver', 'bronze'].includes(fluencyLevel) && accuracy >= 85 && nonSkipped.length >= 5) status = 'fluent';
  else if (accuracy >= 85) status = 'learning';
  if (nonSkipped.length >= 5 && inaccurateCount / nonSkipped.length > 0.4 && ['fluent', 'automatic'].includes(status)) {
    status = 'needsReview';
  }
  if (questionFamily.workingRequired && !questionFamily.mentalMathEligible && status === 'automatic') {
    status = 'fluent';
  }

  return {
    questionFamilyId: familyId,
    accuracy: Math.round(accuracy * 10) / 10,
    averageTime: averageTime === null ? null : Math.round(averageTime * 10) / 10,
    medianTime: medianTime === null ? null : Math.round(medianTime * 10) / 10,
    consistencyScore,
    fluencyLevel,
    status,
  };
}

export function calculateSkillFluency(skillId, questionFamilyResults = []) {
  const familiesForSkill = questionFamilyResults.filter((r) => {
    const family = getQuestionFamily(r.questionFamilyId);
    return family?.skillId === skillId;
  });
  if (!familiesForSkill.length) {
    return {
      skillId,
      overallAccuracy: 0,
      overallAverageTime: null,
      weakestQuestionFamilies: [],
      fluentQuestionFamilies: [],
      skillFluencyLevel: 'notReady',
      status: 'notStarted',
    };
  }

  const overallAccuracy = familiesForSkill.reduce((sum, r) => sum + r.accuracy, 0) / familiesForSkill.length;
  const timeValues = familiesForSkill.map((r) => r.averageTime).filter((v) => v !== null);
  const overallAverageTime = timeValues.length ? timeValues.reduce((a, b) => a + b, 0) / timeValues.length : null;
  const weakestQuestionFamilies = familiesForSkill
    .filter((r) => ['weak', 'accurateButSlow', 'needsReview'].includes(r.status))
    .map((r) => r.questionFamilyId);
  const fluentQuestionFamilies = familiesForSkill
    .filter((r) => ['fluent', 'automatic'].includes(r.status))
    .map((r) => r.questionFamilyId);
  const consistencyScore = familiesForSkill.reduce((sum, r) => sum + r.consistencyScore, 0) / familiesForSkill.length;

  const benchmarks = getBenchmarkBundle(getQuestionFamily(familiesForSkill[0].questionFamilyId));
  const skillFluencyLevel = classifyFluencyLevel({
    accuracy: overallAccuracy,
    averageTime: overallAverageTime ?? benchmarks.bronze * 2,
    consistencyScore,
    benchmarks,
    attemptsCount: Math.max(5, familiesForSkill.length * 3),
    confidenceAdjusted: 1,
  });

  let status = 'learning';
  if (overallAccuracy < 70) status = 'weak';
  else if (weakestQuestionFamilies.length > 0 && fluentQuestionFamilies.length === 0) status = 'needsReview';
  else if (skillFluencyLevel === 'platinum' && weakestQuestionFamilies.length === 0) status = 'automatic';
  else if (['gold', 'silver', 'bronze'].includes(skillFluencyLevel) && weakestQuestionFamilies.length <= 1) status = 'fluent';
  else if (overallAccuracy >= 85 && weakestQuestionFamilies.length > 0) status = 'accurateButSlow';
  else if (overallAccuracy >= 85) status = 'accurate';

  return {
    skillId,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    overallAverageTime: overallAverageTime === null ? null : Math.round(overallAverageTime * 10) / 10,
    weakestQuestionFamilies,
    fluentQuestionFamilies,
    skillFluencyLevel,
    status,
  };
}

export function calculateDomainFluency(domainId, skillResults = []) {
  const relevant = skillResults.filter((r) => r && r.skillId);
  const overallAccuracy = relevant.length ? relevant.reduce((sum, r) => sum + r.overallAccuracy, 0) / relevant.length : 0;
  const fluentSkillIds = relevant.filter((r) => ['fluent', 'automatic'].includes(r.status)).map((r) => r.skillId);
  const weakSkillIds = relevant.filter((r) => ['weak', 'needsReview'].includes(r.status)).map((r) => r.skillId);
  const accurateButSlowSkillIds = relevant.filter((r) => r.status === 'accurateButSlow').map((r) => r.skillId);
  const levelIndex = { notReady: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 };
  const avgLevel = relevant.length
    ? relevant.reduce((sum, r) => sum + (levelIndex[r.skillFluencyLevel] ?? 0), 0) / relevant.length
    : 0;
  const overallFluency = ['notReady', 'bronze', 'silver', 'gold', 'platinum'][Math.round(avgLevel)] || 'notReady';

  return {
    domainId,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    overallFluency,
    fluentSkillIds,
    weakSkillIds,
    accurateButSlowSkillIds,
  };
}

export function getFluencyRecommendation(result = {}) {
  if (!result) return 'continuePractice';
  if (result.status === 'weak' || result.fluencyLevel === 'notReady') return 'reteachConcept';
  if (result.status === 'accurateButSlow') return 'fluencyDrill';
  if (result.status === 'needsReview') return 'continuePractice';
  if (result.status === 'automatic') return 'scheduleRetention';
  if (result.status === 'fluent' && ['gold', 'platinum'].includes(result.fluencyLevel || result.skillFluencyLevel)) return 'advanceSkill';
  return 'continuePractice';
}

export function validateFractionFluencyEngine() {
  const familyFast = getQuestionFamily('QF_F016_001');
  const familyWorking = getQuestionFamily('QF_F003_002');
  const familyMental = getQuestionFamily('QF_F001_001');

  const correctSlow = calculateQuestionFluency({ correct: true, timeTaken: 999, confidence: 'confident', attempts: 1 }, familyFast);
  const correctFast = calculateQuestionFluency({ correct: true, timeTaken: familyFast.fluencyBenchmarks.silver, confidence: 'confident', attempts: 2 }, familyFast);
  const incorrect = calculateQuestionFluency({ correct: false, timeTaken: 5, confidence: 'very confident', attempts: 1 }, familyFast);
  const guessing = calculateQuestionFluency({ correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'guessing', attempts: 1 }, familyFast);
  const workingAutoBlocked = calculateQuestionFluency({ correct: true, timeTaken: familyWorking.fluencyBenchmarks.platinum, confidence: 'very confident', attempts: 2 }, familyWorking);
  const mentalNoWorkingNote = calculateQuestionFluency({ correct: true, timeTaken: familyMental.fluencyBenchmarks.platinum, confidence: 'very confident', attempts: 2 }, familyMental);

  const luckyOneShot = calculateQuestionFamilyFluency(
    [{ correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false }],
    familyFast
  );

  const automaticFamily = calculateQuestionFamilyFluency(
    [
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false },
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false },
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false },
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'confident', skipped: false },
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false },
      { correct: true, timeTaken: familyFast.fluencyBenchmarks.platinum, confidence: 'very confident', skipped: false },
    ],
    familyFast
  );

  const qfResults = [
    automaticFamily,
    calculateQuestionFamilyFluency(
      [
        { correct: true, timeTaken: familyFast.fluencyBenchmarks.bronze + 10, confidence: 'confident', skipped: false },
        { correct: true, timeTaken: familyFast.fluencyBenchmarks.bronze + 9, confidence: 'confident', skipped: false },
        { correct: true, timeTaken: familyFast.fluencyBenchmarks.bronze + 8, confidence: 'confident', skipped: false },
        { correct: true, timeTaken: familyFast.fluencyBenchmarks.bronze + 10, confidence: 'confident', skipped: false },
        { correct: true, timeTaken: familyFast.fluencyBenchmarks.bronze + 11, confidence: 'confident', skipped: false },
      ],
      getQuestionFamily('QF_F016_002')
    ),
  ];
  const skillResult = calculateSkillFluency('F016', qfResults);
  const domainResult = calculateDomainFluency('fractions', [skillResult]);

  const checks = {
    correctButSlowIsFlagged: correctSlow.fluencyFlag === 'accurateButSlow',
    correctWithinBenchmarkFluent: correctFast.fluencyFlag === 'accurateAndFluent',
    veryFastConsistentAutomatic: automaticFamily.status === 'automatic',
    incorrectIsInaccurate: incorrect.fluencyFlag === 'inaccurate',
    guessingReducesConfidence: guessing.confidenceAdjusted < 1,
    oneLuckyFastNotFluent: !['fluent', 'automatic'].includes(luckyOneShot.status),
    workingRequiredBlocksAutomatic: workingAutoBlocked.fluencyFlag !== 'automatic' && workingAutoBlocked.notes.some((n) => n.includes('Working required')),
    mentalMathNoWorkingNote: mentalNoWorkingNote.notes.every((n) => !n.includes('Working required')),
    skillAndDomainComputed: Boolean(skillResult.skillId) && domainResult.domainId === 'fractions',
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    samples: {
      correctSlow,
      correctFast,
      luckyOneShot,
      automaticFamily,
      skillResult,
      domainResult,
      recommendation: getFluencyRecommendation(automaticFamily),
    },
  };
}

export const fractionFluencyEngine = {
  calculateQuestionFluency,
  calculateQuestionFamilyFluency,
  calculateSkillFluency,
  calculateDomainFluency,
  classifyFluencyLevel,
  getFluencyRecommendation,
  validateFractionFluencyEngine,
};

export default fractionFluencyEngine;
