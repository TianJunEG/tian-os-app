import {
  generateDecimalQuestionSet,
  checkDecimalAnswer,
} from '../../shared/mathpath/decimals/decimalsQuestionGenerator.js';
import {
  selectNextDecimalPracticeTarget,
} from '../../shared/mathpath/decimals/decimalsPracticeEngine.js';
import { getSkill } from '../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { copyWorkingEvidenceFields } from './workingEvidenceFields.js';

// Pure server-side Decimals practice service. No DB / Express here — the route
// layer persists what these functions return. Keeping the build + grade logic
// pure makes the whole practice loop unit-testable without a database.

export const DOMAIN_ID = 'decimals';

function statusFromAccuracy(accuracy) {
  if (accuracy >= 90) return 'mastered';
  if (accuracy >= 60) return 'learning';
  return 'needsReview';
}

// Build a practice question set for a target skill (or the engine-recommended
// next skill). Returns full questions (answers included) for the route to
// persist; the route is responsible for stripping answers from the client copy.
export function buildDecimalsPracticeSession({
  targetSkillId = null,
  masteredSkillIds = [],
  weakSkillIds = [],
  questionCount = 6,
  mode = 'practice',
} = {}) {
  let skillId = targetSkillId;
  if (!skillId || !getSkill(skillId)) {
    skillId = selectNextDecimalPracticeTarget({ masteredSkillIds, weakSkillIds }).skillId;
  }
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown decimals skill: ${targetSkillId}`);
    err.status = 400;
    throw err;
  }

  const raw = generateDecimalQuestionSet({ skillId, count: questionCount, mode, sessionSalt: Date.now().toString() });
  const questions = raw.map((q, index) => ({
    questionId: `${q.questionFamilyId}_${index}`,
    skillId: q.skillId,
    questionFamilyId: q.questionFamilyId,
    type: q.type,
    prompt: q.prompt,
    unit: q.unit || '',
    choices: q.choices || [],
    answer: q.answer,
    acceptedAnswers: q.acceptedAnswers || [],
    solutionSteps: q.solutionSteps || [],
    misconceptionTag: q.misconceptionTag || '',
    difficulty: q.difficulty,
    workingRequired: Boolean(q.workingRequired),
    answerFormat: q.answerFormat,
  }));

  return {
    domainId: DOMAIN_ID,
    targetSkillId: skillId,
    targetQuestionFamilyIds: [...new Set(questions.map((q) => q.questionFamilyId))],
    questions,
  };
}

// Strip answers/solutions before sending questions to the client.
export function toClientQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, solutionSteps, ...rest }) => rest);
}

// Grade a submission against the persisted questions. Pure: no DB writes.
export function scoreDecimalsSubmission({ questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));

  const results = responses
    .filter((r) => r && r.questionId != null)
    .map((r) => {
      const question = byId.get(String(r.questionId));
      if (!question) {
        return { questionId: r.questionId, error: 'unknown_question', correct: false };
      }
      const verdict = checkDecimalAnswer({ question, studentResponse: r.studentAnswer ?? r.answer });
      return {
        questionId: question.questionId,
        skillId: question.skillId,
        questionFamilyId: question.questionFamilyId,
        studentAnswer: String(r.studentAnswer ?? r.answer ?? ''),
        correctAnswer: question.answer?.display ?? '',
        correct: verdict.correct,
        misconceptionTag: verdict.correct ? '' : (question.misconceptionTag || ''),
        confidence: r.confidence || '',
        timeTaken: Number(r.timeTaken || 0),
        ...copyWorkingEvidenceFields(r),
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

  return {
    results,
    perSkill,
    mistakes: graded.filter((r) => !r.correct),
    accuracySummary: { total, correct, accuracyPercentage: total ? Math.round((correct / total) * 100) : 0 },
  };
}

export default { buildDecimalsPracticeSession, toClientQuestions, scoreDecimalsSubmission, DOMAIN_ID };
