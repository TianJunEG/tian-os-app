import { getSkill } from '../../shared/mathpath/circles/CirclesSkillGraph.js';
import {
  generateCirclesQuestionSet,
  checkCirclesAnswer,
} from '../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import {
  DOMAIN_ID,
  generateRetentionReview,
  classifyReviewOutcome,
  applyReviewCompletion,
} from '../../shared/mathpath/circles/circlesRetentionEngine.js';

// Thin service: turns the pure circles retention engine into runnable review
// drills, mirroring the Volume / Ratio retention service pattern.

export function buildCirclesRetentionReview({ skillId, previousQuestionFamilyIds = [], count = null } = {}) {
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown circles skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds });
  const questionCount = count == null ? review.recommendedQuestionCount : count;
  const raw = generateCirclesQuestionSet({ skillId, count: questionCount, mode: 'fluency' });
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

export function toClientRetentionQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, ...rest }) => rest);
}

export function scoreCirclesRetentionReview({ skillId, questions = [], responses = [], completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const attempts = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkCirclesAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
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
  buildCirclesRetentionReview,
  toClientRetentionQuestions,
  scoreCirclesRetentionReview,
  DOMAIN_ID,
};
