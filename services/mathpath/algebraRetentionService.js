import { getSkill } from '../../shared/mathpath/algebra/AlgebraSkillGraph.js';
import {
  generateAlgebraQuestionSet,
  checkAlgebraAnswer,
} from '../../shared/mathpath/algebra/AlgebraQuestionGenerator.js';
import {
  DOMAIN_ID,
  generateRetentionReview,
  classifyReviewOutcome,
  applyReviewCompletion,
} from '../../shared/mathpath/algebra/algebraRetentionEngine.js';

// Thin service that turns the pure algebra retention engine into runnable
// review drills, mirroring algebraFluencyService's build/score split. The
// route persists; this stays persistence-free and answer-aware.

/**
 * Build a retention review drill for a skill: pure engine picks same-concept
 * but different question families, generator materialises the questions.
 */
export function buildAlgebraRetentionReview({ skillId, previousQuestionFamilyIds = [], count = null } = {}) {
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown algebra skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds });
  const questionCount = count == null ? review.recommendedQuestionCount : count;
  const raw = generateAlgebraQuestionSet({ skillId, count: questionCount, mode: 'fluency' });
  if (!raw.length) {
    const err = new Error(`No retention questions available for skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const questions = raw.map((q, index) => ({
    questionId: `${q.questionFamilyId}_r${index}`,
    skillId: q.skillId,
    questionFamilyId: q.questionFamilyId,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices || [],
    answer: q.answer,
    acceptedAnswers: q.acceptedAnswers || [],
    misconceptionTag: q.misconceptionTag || '',
  }));
  return {
    reviewId: review.reviewId,
    domainId: DOMAIN_ID,
    skillId,
    questionFamilyIds: review.questionFamilyIds,
    questions,
  };
}

/** Strip answers for the client copy (same contract as fluency). */
export function toClientRetentionQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, ...rest }) => rest);
}

/**
 * Grade a completed retention review into a retention outcome + the
 * persistence patch for MathPathStudentSkillState.
 */
export function scoreAlgebraRetentionReview({ skillId, questions = [], responses = [], completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const attempts = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkAlgebraAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
      return { correct, timeTaken: Number(r.timeTaken || 0) };
    });

  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const correctTimes = attempts.filter((a) => a.correct).map((a) => a.timeTaken).filter((t) => t > 0);
  const averageTimeSeconds = correctTimes.length
    ? Math.round((correctTimes.reduce((s, t) => s + t, 0) / correctTimes.length) * 10) / 10
    : null;

  const outcome = classifyReviewOutcome({ accuracy, averageTimeSeconds, skillId });
  const completion = applyReviewCompletion({
    skillId, accuracy, averageTimeSeconds, completedIntervalDays, lastIntervalDays, completedAt,
  });

  return {
    skillId,
    domainId: DOMAIN_ID,
    total,
    correct,
    accuracy,
    averageTimeSeconds,
    retained: outcome.retained,
    retentionStatus: outcome.retentionStatus,
    reason: outcome.reason,
    nextIntervalDays: completion.nextIntervalDays,
    set: completion.set,
  };
}

export default {
  buildAlgebraRetentionReview,
  toClientRetentionQuestions,
  scoreAlgebraRetentionReview,
  DOMAIN_ID,
};
