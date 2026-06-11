import { generateQuestionSet, generateDiagnosticSet, getAllSupportedSkillIds, getDomainForSkill } from './p6Orchestrator.js';
import { checkP6Answer } from './p6AnswerChecker.js';

const P6_PREFIXES = ['P6-ALG', 'P6-AV'];

export function isP6SkillId(skillId) {
  if (!skillId) return false;
  return P6_PREFIXES.some((p) => String(skillId).startsWith(p));
}

export function isP6Domain(domainId) {
  if (!domainId) return false;
  return String(domainId).toLowerCase().startsWith('p6-');
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeSessionType(value) {
  const key = String(value || 'practice').toLowerCase();
  const valid = ['practice', 'diagnostic', 'warmup', 'remediation', 'mastery_check'];
  return valid.includes(key) ? key : 'practice';
}

function resolveSessionCount(sessionType, requested) {
  if (requested && requested > 0) return requested;
  if (sessionType === 'warmup') return 3;
  if (sessionType === 'diagnostic' || sessionType === 'mastery_check') return 10;
  if (sessionType === 'remediation') return 5;
  return 6;
}

const P6_FLOW_STORE = new Map();

export function startP6PracticeFlow(options = {}) {
  const { studentId, sessionType = 'practice', requestedSkillId = null, requestedQuestionFamilyId = null, sessionLength = 6, weakSkillIds = [], recentMistakeTypes = [] } = options;
  if (!studentId) throw new Error('studentId is required.');

  const resolvedSessionType = normalizeSessionType(sessionType);
  const effectiveSessionLength = resolveSessionCount(resolvedSessionType, sessionLength);

  let targetSkillId = requestedSkillId || ((resolvedSessionType === 'warmup' || resolvedSessionType === 'remediation') ? (weakSkillIds[0] || null) : null);
  if (!targetSkillId) {
    const allSkills = getAllSupportedSkillIds();
    targetSkillId = allSkills[0] || 'P6-ALG-01';
  }

  const resolvedDomainId = getDomainForSkill(targetSkillId) || 'p6-algebra';

  let questions;
  if (resolvedSessionType === 'diagnostic') {
    const allSkillIds = getAllSupportedSkillIds();
    questions = generateDiagnosticSet(allSkillIds, 3);
  } else {
    questions = generateQuestionSet(targetSkillId, effectiveSessionLength, { questionFamilyId: requestedQuestionFamilyId || undefined });
  }

  const practiceSessionId = makeId('p6_practice');
  const workingExpected = questions.some((q) => q.workingRequired);
  const workingSessionId = makeId('p6_working');

  const flowSession = {
    practiceSessionId,
    studentId,
    domainId: resolvedDomainId,
    targetSkillId,
    targetQuestionFamilyIds: questions.map((q) => q.questionFamilyId).filter(Boolean),
    sessionType: resolvedSessionType,
    recentMistakeTypes: Array.isArray(recentMistakeTypes) ? recentMistakeTypes : [],
    questions,
    workingExpected,
    workingSessionId,
    startedAt: nowIso(),
  };

  P6_FLOW_STORE.set(practiceSessionId, flowSession);

  return {
    practiceSessionId,
    targetSkillId,
    domainId: resolvedDomainId,
    targetQuestionFamilyIds: flowSession.targetQuestionFamilyIds,
    sessionType: resolvedSessionType,
    sessionLabel: resolvedSessionType === 'diagnostic' ? 'Diagnostic' : resolvedSessionType === 'remediation' ? 'Remediation' : 'Practice',
    questions,
    workingExpected,
    workingSessionId,
    startedAt: flowSession.startedAt,
  };
}

function computeFluencyFlag(correct, timeTaken, estimatedSeconds) {
  if (!correct) return 'incorrect';
  const target = estimatedSeconds || 30;
  if (timeTaken <= target * 0.5) return 'automatic';
  if (timeTaken <= target) return 'accurateAndFluent';
  return 'accurateButSlow';
}

export function submitP6PracticeAttempt(options = {}) {
  const { practiceSessionId, studentId, sessionType = null, responses = [] } = options;
  if (!practiceSessionId || !studentId) throw new Error('practiceSessionId and studentId are required.');

  const session = P6_FLOW_STORE.get(practiceSessionId);
  const questionById = new Map((session?.questions || []).map((q) => [q.questionId, q]));

  const results = responses.map((response) => {
    const question = questionById.get(response.questionId) || {};
    const skipped = Boolean(response.skipped || response._skipped || !String(response.studentAnswer || '').trim());
    const answerCheck = skipped
      ? { correct: false, expected: question.answer }
      : checkP6Answer(question, response.studentAnswer);
    const timeTaken = Number(response.timeTaken || 0);
    const fluencyFlag = computeFluencyFlag(answerCheck.correct, timeTaken, question.fluencyTargetSeconds);
    return {
      attemptId: response.attemptId || '',
      questionId: question.questionId || response.questionId,
      skillId: question.skillId || response.skillId || '',
      questionFamilyId: question.questionFamilyId || '',
      studentAnswer: response.studentAnswer,
      correctAnswer: question.answer,
      correct: answerCheck.correct,
      answerCorrect: answerCheck.correct,
      timeTaken,
      confidence: response.confidence ?? null,
      reflection: response.reflection || response.confidence || '',
      skipped,
      answeredAt: response.timestamp || nowIso(),
      fluencyFlag,
      solutionSteps: question.solutionSteps || [],
      solutionText: question.solutionText || '',
      feedback: answerCheck.correct ? 'Correct!' : "Let's review this skill.",
      workingSubmitted: Boolean(response.workingSubmitted),
      fullscreenWorkingSubmitted: Boolean(response.fullscreenWorkingSubmitted),
      workingUploaded: Boolean(response.workingUploaded || response.workingSubmitted || response.fullscreenWorkingSubmitted),
      workingNotNeeded: Boolean(response.workingNotNeeded),
    };
  });

  const totalAttempted = results.filter((r) => !r.skipped).length;
  const totalCorrect = results.filter((r) => r.correct).length;

  return {
    practiceSessionId,
    sessionType: normalizeSessionType(sessionType || session?.sessionType || 'practice'),
    results,
    summary: {
      totalQuestions: results.length,
      totalAttempted,
      totalCorrect,
      accuracy: totalAttempted > 0 ? totalCorrect / totalAttempted : 0,
    },
  };
}

export function checkP6AnswerForSession({ studentAnswer, correctAnswer, question }) {
  if (question?.answerType) {
    return checkP6Answer(question, studentAnswer);
  }
  const rawValue = typeof correctAnswer === 'object' && correctAnswer !== null
    ? (correctAnswer.value ?? correctAnswer.display)
    : correctAnswer;
  const rawType = typeof rawValue === 'number' ? 'number' : 'text';
  return checkP6Answer({ answer: rawValue, answerType: rawType }, studentAnswer);
}

export default { isP6SkillId, isP6Domain, startP6PracticeFlow, submitP6PracticeAttempt, checkP6AnswerForSession };
