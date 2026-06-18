import { getSkill } from '../../shared/mathpath/circles/CirclesSkillGraph.js';
import { generateCirclesQuestionSet, checkCirclesAnswer } from '../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import { DOMAIN_ID, generateRetentionReview, classifyReviewOutcome, applyReviewCompletion } from '../../shared/mathpath/circles/circlesRetentionEngine.js';

export function buildCirclesRetentionReview({ skillId, studentId = null, previousQuestionFamilyIds = [], difficulty = null } = {}) {
  if (!skillId) throw new Error('skillId required');
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Unknown circles skill: ${skillId}`);
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds, difficulty });
  const questions = generateCirclesQuestionSet({ skillId, count: review.recommendedQuestionCount, mode: 'retention', familyIds: review.questionFamilyIds });
  return { ...review, domainId: DOMAIN_ID, skillId, skillName: skill.name, studentId, mode: 'retention', questions, totalQuestions: questions.length, generatedAt: new Date().toISOString() };
}

export function toClientRetentionQuestions(review) {
  return { ...review, questions: review.questions.map(({ answer, ...rest }) => rest) };
}

export function scoreCirclesRetentionReview({ review, answers = [], timingsSeconds = [] } = {}) {
  if (!review) throw new Error('review required');
  const results = review.questions.map((q, i) => {
    const given = answers[i] ?? null;
    const correct = given != null ? checkCirclesAnswer({ question: q, studentResponse: given }) : false;
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
