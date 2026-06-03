import { DIAGNOSTIC_DECISIONS } from './adaptiveDiagnosticDecisionEngine.js';

function toId(value) {
  return String(value?.skillId || value?.id || value?._id || value || '').trim();
}

function toQuestionId(value) {
  return String(value?.questionId || value?.id || value?._id || '').trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function questionDifficulty(question = {}) {
  const raw = question.difficultyLevel ?? question.metadata?.difficultyLevel ?? question.difficulty;
  if (typeof raw === 'string') {
    const map = { easy: 1, medium: 2, hard: 3 };
    return map[raw.toLowerCase()] || toNumber(raw, 0);
  }
  return toNumber(raw, 0);
}

function attemptedQuestionIds(studentEvidence = {}, sessionState = {}) {
  return new Set([
    ...(studentEvidence.attemptedQuestionIds || []),
    ...(sessionState.attemptedQuestionIds || []),
    ...(sessionState.responses || []).map((r) => r.questionId),
  ].map(String).filter(Boolean));
}

function normalizeBank(questionBank = []) {
  if (Array.isArray(questionBank)) return questionBank;
  if (questionBank instanceof Map) return [...questionBank.values()];
  return Object.values(questionBank || {});
}

function scoreQuestion(question, { decision, sessionState }) {
  let score = 0;
  if (toId(question) === decision.nextSkillId) score += 50;
  if (decision.nextDifficulty != null && questionDifficulty(question) === Number(decision.nextDifficulty)) score += 10;
  if (decision.decisionType === DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE) {
    const supported = question.errorTagsSupported || question.metadata?.errorTagsSupported || question.commonMistakes || [];
    if (supported.some((tag) => (decision.detectedErrorTags || []).includes(tag))) score += 25;
    if (question.diagnosticPurpose === 'misconception_probe' || question.metadata?.diagnosticPurpose === 'misconception_probe') score += 20;
  }
  if (decision.decisionType === DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION && question.hasParallelItem) score += 15;
  if (decision.decisionType === DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE && question.diagnosticPurpose === 'prerequisite_probe') score += 15;
  if (sessionState.currentQuestionFamilyId && question.questionFamilyId && question.questionFamilyId !== sessionState.currentQuestionFamilyId) score += 3;
  return score;
}

export function selectNextDiagnosticQuestion({
  decision,
  skillGraph = [],
  questionBank = [],
  studentEvidence = {},
  sessionState = {},
} = {}) {
  const questions = normalizeBank(questionBank);
  const attempted = attemptedQuestionIds(studentEvidence, sessionState);
  const currentQuestionId = String(decision?.currentQuestionId || sessionState.currentQuestionId || '');

  if (!decision || decision.shouldStopDiagnostic) return null;
  if (!decision.nextSkillId && [
    DIAGNOSTIC_DECISIONS.MARK_SECURE,
    DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE,
    DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION,
  ].includes(decision.decisionType)) return null;

  if (decision.decisionType === DIAGNOSTIC_DECISIONS.REPHRASE_ONCE) {
    const current = questions.find((q) => toQuestionId(q) === currentQuestionId);
    if (!current) return null;
    return {
      ...current,
      questionId: toQuestionId(current),
      isRephrase: true,
      prompt: current.rephrasedPrompt || current.metadata?.rephrasedPrompt || current.prompt || current.stem,
    };
  }

  const targetSkillId = decision.nextSkillId || decision.currentSkillId;
  const candidates = questions
    .filter((q) => toId(q) === targetSkillId)
    .filter((q) => !attempted.has(toQuestionId(q)))
    .filter((q) => toQuestionId(q) !== currentQuestionId)
    .sort((a, b) => scoreQuestion(b, { decision, skillGraph, sessionState }) - scoreQuestion(a, { decision, skillGraph, sessionState }));

  return candidates[0] || null;
}

export default {
  selectNextDiagnosticQuestion,
};
