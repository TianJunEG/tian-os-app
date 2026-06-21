import { getSkill } from '../../shared/mathpath/operations/OperationsSkillGraph.js';
import { generateOperationsQuestionSet, checkOperationsAnswer } from '../../shared/mathpath/operations/OperationsQuestionGenerator.js';
import { DOMAIN_ID, generateRetentionReview, classifyReviewOutcome, applyReviewCompletion } from '../../shared/mathpath/operations/operationsRetentionEngine.js';

export function buildOperationsRetentionReview({ skillId, studentId = null, previousQuestionFamilyIds = [], difficulty = null } = {}) {
  if (!skillId) throw new Error('skillId required');
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Unknown operations skill: ${skillId}`);
  // Canonicalise slug → ID: getSkill accepts both, but the question-family lookup
  // is keyed by ID only, so a slug here would silently yield a 0-question review.
  skillId = skill.id;
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds, difficulty });
  const questions = generateOperationsQuestionSet({ skillId, count: review.recommendedQuestionCount, mode: 'retention', familyIds: review.questionFamilyIds });
  return { ...review, domainId: DOMAIN_ID, skillId, skillName: skill.name, studentId, mode: 'retention', questions, totalQuestions: questions.length, generatedAt: new Date().toISOString() };
}

export function toClientRetentionQuestions(review) {
  return { ...review, questions: review.questions.map(({ answer, ...rest }) => rest) };
}

export function scoreOperationsRetentionReview({ review, answers = [], timingsSeconds = [] } = {}) {
  if (!review) throw new Error('review required');
  const results = review.questions.map((q, i) => {
    const given = answers[i] ?? null;
    const correct = given != null ? checkOperationsAnswer({ question: q, answer: given }) : false;
    return { questionIndex: i, familyId: q.familyId, correct, givenAnswer: given, correctAnswer: q.answer, timeSeconds: timingsSeconds[i] ?? null };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = review.questions.length ? (correctCount / review.questions.length) * 100 : 0;
  const validTimings = timingsSeconds.filter((t) => t != null && Number.isFinite(t));
  const averageTimeSeconds = validTimings.length ? validTimings.reduce((a, b) => a + b, 0) / validTimings.length : null;
  const outcome = classifyReviewOutcome({ accuracy, averageTimeSeconds, skillId: review.skillId });
  const completion = applyReviewCompletion({ skillId: review.skillId, accuracy, averageTimeSeconds, completedIntervalDays: [], lastIntervalDays: null });
  return { domainId: DOMAIN_ID, skillId: review.skillId, skillName: review.skillName, studentId: review.studentId, mode: 'retention', accuracy, correctCount, totalQuestions: review.questions.length, averageTimeSeconds, ...outcome, set: completion.set, nextIntervalDays: completion.nextIntervalDays, results, scoredAt: new Date().toISOString() };
}
