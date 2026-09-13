import { getSkill } from '../../shared/mathpath/geometry/GeometrySkillGraph.js';
import {
  generateGeometryQuestionSet,
  checkGeometryAnswer,
} from '../../shared/mathpath/geometry/GeometryQuestionGenerator.js';
import {
  DOMAIN_ID,
  generateRetentionReview,
  classifyReviewOutcome,
  applyReviewCompletion,
} from '../../shared/mathpath/geometry/geometryRetentionEngine.js';

// Thin service that turns the pure geometry retention engine into runnable
// review drills, mirroring geometryFluencyService's build/score split and the
// algebra retention pilot (algebraRetentionService.js). The route persists;
// this stays persistence-free and answer-aware. Geometry questions are visual —
// we keep the full question shape the generator returns (answer object, choices,
// visual payload) intact, exactly as the fluency service does.

/**
 * Build a retention review drill for a skill: pure engine picks same-concept
 * but different question families, generator materialises the questions.
 */
export function buildGeometryRetentionReview({ skillId, previousQuestionFamilyIds = [], count = null } = {}) {
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown geometry skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds });
  const questionCount = count == null ? review.recommendedQuestionCount : count;
  const raw = generateGeometryQuestionSet({ skillId, count: questionCount, mode: 'fluency', sessionSalt: Date.now().toString() });
  if (!raw.length) {
    const err = new Error(`No retention questions available for skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const questions = raw.map((q, index) => ({
    ...q,
    questionId: `${q.questionFamilyId}_r${index}`,
    skillId: q.skillId,
    questionFamilyId: q.questionFamilyId,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices || [],
    answer: q.answer,
    acceptedAnswers: q.acceptedAnswers || [],
    solutionSteps: q.solutionSteps || [],
    misconceptionTag: q.misconceptionTag || '',
    workingRequired: Boolean(q.workingRequired),
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
  return questions.map(({ answer, acceptedAnswers, solutionSteps, ...rest }) => rest);
}

/**
 * Grade a completed retention review into a retention outcome + the
 * persistence patch for MathPathStudentSkillState.
 */
export function scoreGeometryRetentionReview({ skillId, questions = [], responses = [], completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const attempts = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkGeometryAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
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
  buildGeometryRetentionReview,
  toClientRetentionQuestions,
  scoreGeometryRetentionReview,
  DOMAIN_ID,
};
