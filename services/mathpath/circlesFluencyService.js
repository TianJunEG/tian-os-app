import { getSkill } from '../../shared/mathpath/circles/CirclesSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../../shared/mathpath/circles/CirclesQuestionFamilies.js';
import {
  generateCirclesQuestionSet,
  checkCirclesAnswer,
} from '../../shared/mathpath/circles/CirclesQuestionGenerator.js';

// Pure Circles fluency-drill service. Mirrors the Volume fluency service:
// score accuracy + time + consistency → band (bronze → platinum).

const DOMAIN_ID = 'circles';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

export function getFluencyBenchmarks(family = {}) {
  if (family.fluencyBenchmarks) return family.fluencyBenchmarks;
  const base = family.fluencyTargetSeconds || 15;
  return {
    bronze: Math.round(base * 1.8),
    silver: Math.round(base * 1.4),
    gold: base,
    platinum: Math.max(4, Math.round(base * 0.7)),
  };
}

export function computeConsistencyScore(attempts = [], benchmarkSeconds = 15) {
  if (!attempts.length) return 0;
  const correct = attempts.filter((a) => a.correct);
  if (!correct.length) return 0;
  const accuracy = correct.length / attempts.length;
  const times = correct.map((a) => toNumber(a.timeTaken, benchmarkSeconds * 2)).sort((a, b) => a - b);
  const median = percentile(times, 50) ?? benchmarkSeconds * 2;
  const sd = standardDeviation(times);
  const relativeSpread = median > 0 ? sd / median : 1;
  const stabilityScore = Math.max(0, 1 - Math.min(1, relativeSpread));
  const volumeScore = Math.min(1, attempts.length / 5);
  return Math.round((accuracy * 0.5 + stabilityScore * 0.3 + volumeScore * 0.2) * 100 * 10) / 10;
}

export function classifyFluency(metrics = {}) {
  const accuracy = toNumber(metrics.accuracy);
  const averageTime = toNumber(metrics.averageTime, Number.MAX_SAFE_INTEGER);
  const consistencyScore = toNumber(metrics.consistencyScore);
  const benchmarks = metrics.benchmarks || { bronze: 27, silver: 21, gold: 15, platinum: 10 };
  const attemptsCount = toNumber(metrics.attemptsCount);

  if (accuracy < 80 || attemptsCount < 3) return 'notReady';
  if (averageTime <= benchmarks.platinum && accuracy >= 95 && consistencyScore >= 85) return 'platinum';
  if (averageTime <= benchmarks.gold && accuracy >= 92 && consistencyScore >= 75) return 'gold';
  if (averageTime <= benchmarks.silver && accuracy >= 88 && consistencyScore >= 65) return 'silver';
  if (averageTime <= benchmarks.bronze && accuracy >= 85 && consistencyScore >= 55) return 'bronze';
  return 'notReady';
}

function fluencyFamiliesFor(skillId) {
  return getQuestionFamiliesBySkill(skillId)
    .slice()
    .sort((a, b) => (Number(b.mentalMathEligible) - Number(a.mentalMathEligible)) || (a.fluencyTargetSeconds - b.fluencyTargetSeconds));
}

export function buildCirclesFluencyDrill({ skillId, count = 8 } = {}) {
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown circles skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const families = fluencyFamiliesFor(skillId);
  if (!families.length) {
    const err = new Error(`No fluency families for skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const benchmarks = getFluencyBenchmarks(families[0]);
  const familyTarget = new Map(families.map((f) => [f.id, f.fluencyTargetSeconds]));
  const raw = generateCirclesQuestionSet({ skillId, count, mode: 'fluency', sessionSalt: Date.now().toString() });
  const questions = raw.map((q, index) => ({
    questionId: `${q.questionFamilyId}_f${index}`,
    skillId: q.skillId,
    questionFamilyId: q.questionFamilyId,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices || [],
    answer: q.answer,
    acceptedAnswers: q.acceptedAnswers || [],
    misconceptionTag: q.misconceptionTag || '',
    fluencyTargetSeconds: familyTarget.get(q.questionFamilyId) ?? families[0].fluencyTargetSeconds,
  }));
  return { domainId: DOMAIN_ID, skillId, benchmarks, targetSeconds: families[0].fluencyTargetSeconds, questions };
}

export function toClientFluencyQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, ...rest }) => rest);
}

export function scoreCirclesFluencyDrill({ skillId, questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const benchmarks = questions[0]
    ? getFluencyBenchmarks({ fluencyTargetSeconds: questions[0].fluencyTargetSeconds })
    : { bronze: 27, silver: 21, gold: 15, platinum: 10 };

  const attempts = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkCirclesAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
      return { questionId: q.questionId, skillId: q.skillId, correct, timeTaken: Number(r.timeTaken || 0) };
    });

  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const correctTimes = attempts.filter((a) => a.correct).map((a) => a.timeTaken);
  const averageTime = correctTimes.length
    ? Math.round((correctTimes.reduce((s, t) => s + t, 0) / correctTimes.length) * 10) / 10
    : null;
  const consistencyScore = computeConsistencyScore(attempts, benchmarks.gold);
  const band = classifyFluency({ accuracy, averageTime: averageTime ?? Number.MAX_SAFE_INTEGER, consistencyScore, benchmarks, attemptsCount: total });

  return {
    skillId,
    domainId: DOMAIN_ID,
    total,
    correct,
    accuracy,
    averageTime,
    consistencyScore,
    benchmarks,
    band,
  };
}

export default {
  getFluencyBenchmarks,
  computeConsistencyScore,
  classifyFluency,
  buildCirclesFluencyDrill,
  toClientFluencyQuestions,
  scoreCirclesFluencyDrill,
  DOMAIN_ID,
};
