import {
  generateRatioRateQuestionSet,
  checkRatioRateAnswer,
} from '../../shared/mathpath/ratioRate/ratioRateQuestionGenerator.js';
import { ratioRateSkillGraph, getSkill } from '../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';

// Pure server-side Ratio & Rate practice service. No DB / Express here — the
// route layer persists what these functions return. Mirrors percentagePracticeService.js
// exactly (s/percentage/ratioRate/g, s/Percentage/RatioRate/g, s/P00/R0/g).

export const DOMAIN_ID = 'ratio';

function statusFromAccuracy(accuracy) {
  if (accuracy >= 90) return 'mastered';
  if (accuracy >= 60) return 'learning';
  return 'needsReview';
}

function selectNextTarget({ masteredSkillIds = [], weakSkillIds = [] } = {}) {
  const mastered = new Set(masteredSkillIds);
  const weak = new Set(weakSkillIds);
  const skills = ratioRateSkillGraph.skills || [];

  // Prefer weak skills first.
  const weakUnmastered = skills.filter((s) => weak.has(s.id) && !mastered.has(s.id));
  if (weakUnmastered.length) return weakUnmastered[0].id;

  // Then first unmastered skill in graph order (prerequisites already mastered or first).
  const unmastered = skills.filter((s) => !mastered.has(s.id));
  if (unmastered.length) return unmastered[0].id;

  // All mastered: return last skill to allow continued practice.
  return skills[skills.length - 1]?.id || 'R001';
}

export function buildRatioRatePracticeSession({
  targetSkillId = null,
  masteredSkillIds = [],
  weakSkillIds = [],
  questionCount = 6,
  mode = 'practice',
} = {}) {
  let skillId = targetSkillId;
  if (!skillId || !getSkill(skillId)) {
    skillId = selectNextTarget({ masteredSkillIds, weakSkillIds });
  }
  if (!getSkill(skillId)) {
    const err = new Error(`Unknown ratioRate skill: ${targetSkillId}`);
    err.status = 400;
    throw err;
  }

  const raw = generateRatioRateQuestionSet({ skillId, count: questionCount, mode });
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
    ...(q.diagram ? { diagram: q.diagram } : {}),
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

export function scoreRatioRateSubmission({ questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));

  const results = responses
    .filter((r) => r && r.questionId != null)
    .map((r) => {
      const question = byId.get(String(r.questionId));
      if (!question) {
        return { questionId: r.questionId, error: 'unknown_question', correct: false };
      }
      const verdict = checkRatioRateAnswer({ question, studentResponse: r.studentAnswer ?? r.answer });
      return {
        questionId: question.questionId,
        skillId: question.skillId,
        questionFamilyId: question.questionFamilyId,
        studentAnswer: String(r.studentAnswer ?? r.answer ?? ''),
        correctAnswer: question.answer?.display ?? String(question.answer ?? ''),
        correct: verdict.correct,
        misconceptionTag: verdict.correct ? '' : (question.misconceptionTag || ''),
        confidence: r.confidence || '',
        timeTaken: Number(r.timeTaken || 0),
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

export default { buildRatioRatePracticeSession, toClientQuestions, scoreRatioRateSubmission, DOMAIN_ID };
