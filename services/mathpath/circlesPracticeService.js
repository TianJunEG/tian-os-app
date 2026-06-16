import {
  generateCirclesQuestionSet,
  checkCirclesAnswer,
} from '../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import { selectNextCirclesPracticeTarget } from '../../shared/mathpath/circles/CirclesPracticeEngine.js';
import { getSkill } from '../../shared/mathpath/circles/CirclesSkillGraph.js';

export const DOMAIN_ID = 'circles';

function statusFromAccuracy(accuracy) {
  if (accuracy >= 90) return 'mastered';
  if (accuracy >= 60) return 'learning';
  return 'needsReview';
}

export function buildCirclesPracticeSession({
  targetSkillId = null, masteredSkillIds = [], weakSkillIds = [], questionCount = 6, mode = 'practice',
} = {}) {
  let skillId = targetSkillId;
  if (!skillId || !getSkill(skillId)) {
    skillId = selectNextCirclesPracticeTarget({ masteredSkillIds, weakSkillIds }).skillId;
  }
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown circles skill: ${targetSkillId}`);
    err.status = 400;
    throw err;
  }
  const raw = generateCirclesQuestionSet({ skillId, count: questionCount, mode });
  const questions = raw.map((q, index) => ({
    questionId: `${q.questionFamilyId}_${index}`,
    skillId: q.skillId,
    questionFamilyId: q.questionFamilyId,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices || [],
    answer: q.answer,
    acceptedAnswers: q.acceptedAnswers || [],
    solutionSteps: q.solutionSteps || [],
    misconceptionTag: q.misconceptionTag || '',
    difficulty: q.difficulty,
    workingRequired: Boolean(q.workingRequired),
  }));
  return {
    domainId: DOMAIN_ID,
    targetSkillId: skillId,
    targetQuestionFamilyIds: [...new Set(questions.map((q) => q.questionFamilyId))],
    questions,
  };
}

export function toClientQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, solutionSteps, ...rest }) => rest);
}

export function scoreCirclesSubmission({ questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const results = responses.filter((r) => r && r.questionId != null).map((r) => {
    const question = byId.get(String(r.questionId));
    if (!question) return { questionId: r.questionId, error: 'unknown_question', correct: false };
    const verdict = checkCirclesAnswer({ question, studentResponse: r.studentAnswer ?? r.answer });
    return {
      questionId: question.questionId, skillId: question.skillId,
      questionFamilyId: question.questionFamilyId,
      studentAnswer: String(r.studentAnswer ?? r.answer ?? ''),
      correctAnswer: question.answer?.display ?? '',
      correct: verdict.correct,
      misconceptionTag: verdict.correct ? '' : (question.misconceptionTag || ''),
      confidence: r.confidence || '', timeTaken: Number(r.timeTaken || 0),
    };
  });
  const graded = results.filter((r) => !r.error);
  const perSkill = {};
  for (const r of graded) {
    if (!r.skillId) continue;
    if (!perSkill[r.skillId]) perSkill[r.skillId] = { total: 0, correct: 0 };
    perSkill[r.skillId].total += 1;
    if (r.correct) perSkill[r.skillId].correct += 1;
  }
  for (const skillId of Object.keys(perSkill)) {
    const s = perSkill[skillId];
    s.accuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    s.status = statusFromAccuracy(s.accuracy);
  }
  const total = graded.length;
  const correct = graded.filter((r) => r.correct).length;
  return { results, perSkill, mistakes: graded.filter((r) => !r.correct), accuracySummary: { total, correct, accuracyPercentage: total ? Math.round((correct / total) * 100) : 0 } };
}

export default { buildCirclesPracticeSession, toClientQuestions, scoreCirclesSubmission, DOMAIN_ID };
