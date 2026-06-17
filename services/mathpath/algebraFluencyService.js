import { getSkill } from '../../shared/mathpath/algebra/AlgebraSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../../shared/mathpath/algebra/AlgebraQuestionFamilies.js';
import {
  generateAlgebraQuestionSet,
  checkAlgebraAnswer,
} from '../../shared/mathpath/algebra/AlgebraQuestionGenerator.js';

// Pure Algebra fluency-drill service. A fluency drill is a short, speed-focused
// set of questions on one skill, scored into a fluency band (bronze → platinum)
// from accuracy + time + consistency. The band thresholds and benchmark
// derivation mirror the Decimals/Fractions fluency engines so the domains rate
// fluency on the same scale. Skill-state is persisted under the same domainId
// the algebra practice service uses ('algebra'), so fluency + practice unify.

const DOMAIN_ID = 'algebra';

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

// Bronze/silver/gold/platinum second targets for a family.
export function getFluencyBenchmarks(family = {}) {
  if (family.fluencyBenchmarks) return family.fluencyBenchmarks;
  const base = family.fluencyTargetSeconds || 20;
  return {
    bronze: Math.round(base * 1.8),
    silver: Math.round(base * 1.4),
    gold: base,
    platinum: Math.max(4, Math.round(base * 0.7)),
  };
}

export function computeConsistencyScore(attempts = [], benchmarkSeconds = 20) {
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

// accuracy is a 0–100 percentage; averageTime in seconds.
export function classifyFluency(metrics = {}) {
  const accuracy = toNumber(metrics.accuracy);
  const averageTime = toNumber(metrics.averageTime, Number.MAX_SAFE_INTEGER);
  const consistencyScore = toNumber(metrics.consistencyScore);
  const benchmarks = metrics.benchmarks || { bronze: 30, silver: 20, gold: 12, platinum: 8 };
  const attemptsCount = toNumber(metrics.attemptsCount);

  if (accuracy < 80 || attemptsCount < 3) return 'notReady';
  if (averageTime <= benchmarks.platinum && accuracy >= 95 && consistencyScore >= 85) return 'platinum';
  if (averageTime <= benchmarks.gold && accuracy >= 92 && consistencyScore >= 75) return 'gold';
  if (averageTime <= benchmarks.silver && accuracy >= 88 && consistencyScore >= 65) return 'silver';
  if (averageTime <= benchmarks.bronze && accuracy >= 85 && consistencyScore >= 55) return 'bronze';
  return 'notReady';
}

// Fluency-appropriate families first: fastest targets, mental-math eligible.
function fluencyFamiliesFor(skillId) {
  return getQuestionFamiliesBySkill(skillId)
    .slice()
    .sort((a, b) => (Number(b.mentalMathEligible) - Number(a.mentalMathEligible)) || (a.fluencyTargetSeconds - b.fluencyTargetSeconds));
}

// Build a short timed drill for a skill. Returns full questions (answers
// included) for the route to persist; the route strips answers for the client.
export function buildAlgebraFluencyDrill({ skillId, count = 8 } = {}) {
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown algebra skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const families = fluencyFamiliesFor(skillId);
  if (!families.length) {
    const err = new Error(`No fluency families for skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const fastestTargetSeconds = families[0].fluencyTargetSeconds;
  const benchmarks = getFluencyBenchmarks(families[0]);
  const raw = generateAlgebraQuestionSet({ skillId, count, mode: 'fluency' });
  const questions = raw.map((q, index) => {
    const family = families.find((f) => f.id === q.questionFamilyId) || families[0];
    return {
      questionId: `${q.questionFamilyId}_f${index}`,
      skillId: q.skillId,
      questionFamilyId: q.questionFamilyId,
      type: q.type,
      prompt: q.prompt,
      choices: q.choices || [],
      answer: q.answer,
      acceptedAnswers: q.acceptedAnswers || [],
      misconceptionTag: q.misconceptionTag || '',
      fluencyTargetSeconds: family.fluencyTargetSeconds,
    };
  });
  return { domainId: DOMAIN_ID, skillId, benchmarks, targetSeconds: fastestTargetSeconds, questions };
}

export function toClientFluencyQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, ...rest }) => rest);
}

// Grade a drill: accuracy + average correct-answer time + consistency → band.
export function scoreAlgebraFluencyDrill({ skillId, questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const benchmarks = questions[0]
    ? getFluencyBenchmarks({ fluencyTargetSeconds: questions[0].fluencyTargetSeconds })
    : { bronze: 30, silver: 20, gold: 12, platinum: 8 };

  const attempts = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkAlgebraAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
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
  buildAlgebraFluencyDrill,
  toClientFluencyQuestions,
  scoreAlgebraFluencyDrill,
  DOMAIN_ID,
};
