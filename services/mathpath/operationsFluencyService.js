import { getSkill } from '../../shared/mathpath/operations/OperationsSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../../shared/mathpath/operations/OperationsQuestionFamilies.js';
import { generateOperationsQuestionSet, checkOperationsAnswer } from '../../shared/mathpath/operations/OperationsQuestionGenerator.js';

const DOMAIN_ID = 'four_operations';

function getFluencyBenchmarks(skillId) {
  const skill = getSkill(skillId);
  return { targetAverageSeconds: skill?.fluency?.targetAverageSeconds ?? 8, targetAccuracy: skill?.fluency?.targetAccuracy ?? 80, consistencyWindow: skill?.fluency?.consistencyWindow ?? 5 };
}

function computeConsistencyScore(timings) {
  if (!timings || timings.length < 2) return 1;
  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
  const variance = timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timings.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  return Math.max(0, 1 - cv);
}

function classifyFluency({ accuracy, averageTime, consistencyScore, benchmarks }) {
  const { targetAverageSeconds, targetAccuracy } = benchmarks;
  if (accuracy >= targetAccuracy + 10 && averageTime <= targetAverageSeconds * 0.8 && consistencyScore >= 0.85) return 'platinum';
  if (accuracy >= targetAccuracy + 5 && averageTime <= targetAverageSeconds && consistencyScore >= 0.7) return 'gold';
  if (accuracy >= targetAccuracy && averageTime <= targetAverageSeconds * 1.5) return 'silver';
  if (accuracy >= targetAccuracy * 0.8) return 'bronze';
  return 'developing';
}

export function buildOperationsFluencyDrill({ skillId, studentId = null, count = 8 } = {}) {
  if (!skillId) throw new Error('skillId required');
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Unknown operations skill: ${skillId}`);
  const benchmarks = getFluencyBenchmarks(skillId);
  const questions = generateOperationsQuestionSet({ skillId, count, mode: 'fluency' });
  return { domainId: DOMAIN_ID, skillId, skillName: skill.name, studentId, benchmarks, mode: 'fluency', questions, totalQuestions: questions.length, generatedAt: new Date().toISOString() };
}

export function toClientFluencyQuestions(drill) {
  return { ...drill, questions: drill.questions.map(({ answer, ...rest }) => rest) };
}

export function scoreOperationsFluencyDrill({ drill, answers = [], timingsSeconds = [] } = {}) {
  if (!drill) throw new Error('drill required');
  const results = drill.questions.map((q, i) => {
    const given = answers[i] ?? null;
    const correct = given != null ? checkOperationsAnswer({ question: q, answer: given }) : false;
    return { questionIndex: i, familyId: q.familyId, correct, givenAnswer: given, correctAnswer: q.answer, timeSeconds: timingsSeconds[i] ?? null };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = drill.questions.length ? (correctCount / drill.questions.length) * 100 : 0;
  const validTimings = timingsSeconds.filter((t) => t != null && Number.isFinite(t));
  const averageTime = validTimings.length ? validTimings.reduce((a, b) => a + b, 0) / validTimings.length : null;
  const consistencyScore = computeConsistencyScore(validTimings);
  const benchmarks = getFluencyBenchmarks(drill.skillId);
  const fluencyLevel = classifyFluency({ accuracy, averageTime: averageTime ?? benchmarks.targetAverageSeconds, consistencyScore, benchmarks });
  return { domainId: DOMAIN_ID, skillId: drill.skillId, skillName: drill.skillName, studentId: drill.studentId, mode: 'fluency', accuracy, correctCount, totalQuestions: drill.questions.length, averageTimeSeconds: averageTime, consistencyScore, fluencyLevel, benchmarks, results, scoredAt: new Date().toISOString() };
}
