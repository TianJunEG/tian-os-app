import { getQuestionFamily } from './fractionQuestionFamilies.js';
import {
  buildFractionPracticeSession,
  updateFractionPracticeState,
} from './fractionPracticeEngine.js';
import {
  generatePracticeQuestionSet,
  checkFractionAnswer,
} from './fractionQuestionGenerator.js';
import {
  calculateQuestionFamilyFluency,
  getFluencyRecommendation,
} from './fractionFluencyEngine.js';
import {
  createWorkingSession,
  markWorkingExpected,
  createQuestionWorkingMap,
} from '../working/workingUploadWorkflow.js';
import { buildStudentProgressState } from '../state/mathPathStudentProgressEngine.js';

const PRACTICE_FLOW_STORE = new Map();
const SESSION_TYPE_CONFIG = {
  diagnostic: { min: 8, max: 12, defaultCount: 10, label: 'Fractions Check-In' },
  warmup: { min: 2, max: 3, defaultCount: 3, label: 'Quick Warm-up' },
  practice: { min: 4, max: 12, defaultCount: 6, label: 'Practice' },
  remediation: { min: 4, max: 8, defaultCount: 5, label: 'Remediation' },
  mastery_check: { min: 8, max: 12, defaultCount: 10, label: 'Mastery Check' },
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function average(values = []) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, n) => sum + Number(n || 0), 0) / values.length) * 10) / 10;
}

function normalizeWorkingRequirementLevel(value) {
  const normalized = String(value || '').toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH'].includes(normalized) ? normalized : 'MEDIUM';
}

function isHighConfidence(value) {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'i_know_this' || normalized === 'high' || normalized.includes('confident') || normalized.includes('know');
}

function normalizeSessionType(value) {
  const key = String(value || 'practice').toLowerCase();
  return SESSION_TYPE_CONFIG[key] ? key : 'practice';
}

function resolveSessionCount(sessionType, requestedLength) {
  const cfg = SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.practice;
  const wanted = Number(requestedLength);
  if (!Number.isFinite(wanted)) return cfg.defaultCount;
  return Math.max(cfg.min, Math.min(cfg.max, Math.floor(wanted)));
}

function toFamilySummary(results = []) {
  const byFamily = new Map();
  results.forEach((r) => {
    if (!byFamily.has(r.questionFamilyId)) byFamily.set(r.questionFamilyId, []);
    byFamily.get(r.questionFamilyId).push(r);
  });

  return [...byFamily.entries()].map(([questionFamilyId, familyResults]) => {
    const family = getQuestionFamily(questionFamilyId);
    const fluency = calculateQuestionFamilyFluency(
      familyResults.map((r) => ({
        correct: r.correct,
        timeTaken: r.timeTaken,
        confidence: r.confidence,
        skipped: Boolean(r.skipped),
      })),
      family
    );
    return {
      questionFamilyId,
      questionFamilyName: family?.name || questionFamilyId,
      skillId: family?.skillId || familyResults[0]?.skillId || null,
      ...fluency,
      recommendation: getFluencyRecommendation(fluency),
    };
  });
}

function computeNextAction({ familyFluencySummary = [], updateResults = [] }) {
  const fromPractice = updateResults.at(-1)?.nextRecommendedAction;
  if (fromPractice === 'startFluency') return 'startFluency';
  if (fromPractice === 'remediatePrerequisite') return 'reviewNeeded';
  if (fromPractice === 'requireWorkingUpload') return 'uploadWorking';

  const weakFamily = familyFluencySummary.find((f) => ['weak', 'needsReview'].includes(f.status));
  if (weakFamily) return 'reviewNeeded';
  const slowFamily = familyFluencySummary.find((f) => f.status === 'accurateButSlow');
  if (slowFamily) return 'startFluency';
  const fluentFamilies = familyFluencySummary.filter((f) => ['fluent', 'automatic'].includes(f.status)).length;
  if (fluentFamilies === familyFluencySummary.length && fluentFamilies > 0) return 'readyForFluency';
  return 'continuePractice';
}

export function buildFractionPracticeFeedback(result = {}) {
  if (!result.correct) return 'Let’s review this skill before moving on.';
  if (result.fluencyFlag === 'accurateButSlow') return 'You got it correct. Let’s practise for speed.';
  if (result.fluencyFlag === 'accurateAndFluent' || result.fluencyFlag === 'automatic') {
    return 'Well done — you answered accurately and quickly.';
  }
  return 'Correct.';
}

export function startFractionPracticeFlow(options = {}) {
  const {
    studentId,
    domainId = 'fractions',
    sessionType = 'practice',
    requestedSkillId = null,
    requestedQuestionFamilyId = null,
    sessionLength = 6,
    weakSkillIds = [],
    recentMistakeTypes = [],
  } = options;

  if (!studentId) throw new Error('studentId is required.');
  if (domainId !== 'fractions') throw new Error('Only fractions domain is supported.');
  const resolvedSessionType = normalizeSessionType(sessionType);
  const effectiveSessionLength = resolveSessionCount(resolvedSessionType, sessionLength);
  const preferredSkillId = requestedSkillId
    || ((resolvedSessionType === 'warmup' || resolvedSessionType === 'remediation') ? weakSkillIds[0] : null);

  const practiceSession = buildFractionPracticeSession({
    studentId,
    currentSkillId: preferredSkillId || null,
    sessionLength: effectiveSessionLength,
  });

  const targetSkillId = preferredSkillId || practiceSession.targetSkillId;
  const targetQuestionFamilyIds = requestedQuestionFamilyId
    ? [requestedQuestionFamilyId]
    : (practiceSession.targetQuestionFamilyIds || []).filter(Boolean);

  const practiceQueue = targetQuestionFamilyIds.map((id) => ({
    skillId: targetSkillId,
    questionFamilyId: id,
    questionFamilyIds: [id],
  }));

  const questions = generatePracticeQuestionSet({
    practiceQueue,
    count: effectiveSessionLength,
  });

  const workingRequiredMap = {};
  questions.forEach((q) => {
    workingRequiredMap[q.questionId] = markWorkingExpected(q.questionId, q.questionFamilyId);
  });
  const workingExpected = Object.values(workingRequiredMap).some((w) => w.workingRequired);

  const workingSession = createWorkingSession({
    studentId,
    practiceSessionId: practiceSession.sessionId,
    domainId,
    skillIds: [targetSkillId],
    questionIds: questions.map((q) => q.questionId),
    inputMethod: 'paper',
  });
  createQuestionWorkingMap({
    workingSessionId: workingSession.workingSessionId,
    questionIds: questions.map((q) => q.questionId),
    workingRequiredMap,
  });

  const flowSession = {
    practiceSessionId: practiceSession.sessionId,
    studentId,
    domainId,
    targetSkillId,
    targetQuestionFamilyIds,
    sessionType: resolvedSessionType,
    recentMistakeTypes: Array.isArray(recentMistakeTypes) ? recentMistakeTypes : [],
    questions,
    workingExpectedMap: workingRequiredMap,
    workingExpected,
    workingSessionId: workingSession.workingSessionId,
    startedAt: nowIso(),
  };
  PRACTICE_FLOW_STORE.set(practiceSession.sessionId, flowSession);

  return {
    practiceSessionId: practiceSession.sessionId,
    targetSkillId,
    targetQuestionFamilyIds,
    sessionType: resolvedSessionType,
    sessionLabel: SESSION_TYPE_CONFIG[resolvedSessionType]?.label || 'Practice',
    questions,
    workingExpected,
    workingSessionId: workingSession.workingSessionId,
    startedAt: flowSession.startedAt,
  };
}

export function submitFractionPracticeAttempt(options = {}) {
  const {
    practiceSessionId,
    studentId,
    sessionType = null,
    responses = [],
  } = options;

  if (!practiceSessionId || !studentId) throw new Error('practiceSessionId and studentId are required.');
  const session = PRACTICE_FLOW_STORE.get(practiceSessionId);
  if (!session) throw new Error('Practice session not found.');
  if (session.studentId !== studentId) throw new Error('studentId does not match practice session.');
  const resolvedSessionType = normalizeSessionType(sessionType || session.sessionType || 'practice');

  const questionById = new Map(session.questions.map((q) => [q.questionId, q]));
  const updateResults = [];

  const results = responses.map((response) => {
    const question = questionById.get(response.questionId);
    if (!question) {
      return {
        questionId: response.questionId,
        error: 'Question not found in practice session.',
        correct: false,
      };
    }

    const skipped = Boolean(response.skipped || response._skipped || !String(response.studentAnswer || '').trim());
    const answerCheck = skipped
      ? { correct: false, normalizedStudentAnswer: null, normalizedCorrectAnswer: question.answer?.display || null }
      : checkFractionAnswer({
          studentAnswer: response.studentAnswer,
          correctAnswer: question.answer,
          acceptedAnswers: question.acceptedAnswers || [],
        });

    const stateUpdate = updateFractionPracticeState({
      studentId,
      skillId: question.skillId,
      questionFamilyId: question.questionFamilyId,
      correct: answerCheck.correct,
      timeTaken: Number(response.timeTaken || 0),
      confidence: response.confidence ?? null,
      skipped,
      workingUploaded: Boolean(response.workingUploaded || response.workingSubmitted || response.fullscreenWorkingSubmitted),
      attemptNumber: Number(response.attemptNumber || 1),
    });
    updateResults.push(stateUpdate);

    return {
      attemptId: response.attemptId || '',
      questionId: question.questionId,
      skillId: question.skillId,
      questionFamilyId: question.questionFamilyId,
      answer: response.answer ?? response.studentAnswer,
      answerCorrect: answerCheck.correct,
      studentAnswer: response.studentAnswer,
      correctAnswer: question.answer?.display || null,
      normalizedStudentAnswer: answerCheck.normalizedStudentAnswer,
      normalizedCorrectAnswer: answerCheck.normalizedCorrectAnswer,
      correct: answerCheck.correct,
      timeTaken: Number(response.timeTaken || 0),
      confidence: response.confidence ?? null,
      reflection: response.reflection || response.confidence || '',
      helpRequested: Boolean(response.helpRequested),
      confidenceCalibration: response.confidenceCalibration || '',
      possibleMisconception: Boolean(response.possibleMisconception),
      workingImage: response.workingImage || '',
      workingStrokes: Array.isArray(response.workingStrokes) ? response.workingStrokes : [],
      workingMathObjects: Array.isArray(response.workingMathObjects) ? response.workingMathObjects : [],
      workingSubmitted: Boolean(response.workingSubmitted),
      workingSubmittedAt: response.workingSubmittedAt || null,
      workingOnPaper: Boolean(response.workingOnPaper),
      workingNotNeeded: Boolean(response.workingNotNeeded),
      workingRequirementLevel: normalizeWorkingRequirementLevel(response.workingRequirementLevel),
      workingUploaded: Boolean(response.workingUploaded || response.workingSubmitted || response.fullscreenWorkingSubmitted),
      fullscreenWorkingImage: response.fullscreenWorkingImage || '',
      fullscreenWorkingStrokes: Array.isArray(response.fullscreenWorkingStrokes) ? response.fullscreenWorkingStrokes : [],
      fullscreenWorkingMathObjects: Array.isArray(response.fullscreenWorkingMathObjects) ? response.fullscreenWorkingMathObjects : [],
      fullscreenWorkingSubmitted: Boolean(response.fullscreenWorkingSubmitted),
      fullscreenWorkingSubmittedAt: response.fullscreenWorkingSubmittedAt || null,
      workingEvidence: Array.isArray(response.workingEvidence) ? response.workingEvidence : [],
      skipped,
      answeredAt: response.timestamp || nowIso(),
      fluencyFlag: stateUpdate.fluencyFlag,
      feedback: buildFractionPracticeFeedback({
        correct: answerCheck.correct,
        fluencyFlag: stateUpdate.fluencyFlag,
      }),
      solutionSteps: question.solutionSteps || [],
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const accuracyPct = results.length ? Math.round((correctCount / results.length) * 1000) / 10 : 0;
  const avgTime = average(results.map((r) => r.timeTaken));
  const familyFluencySummary = toFamilySummary(results.filter((r) => !r.error));

  const accuracySummary = {
    totalQuestions: results.length,
    correctCount,
    incorrectCount: Math.max(0, results.length - correctCount),
    accuracyPercentage: accuracyPct,
    averageSeconds: avgTime,
  };

  const fluencySummary = {
    averageSeconds: avgTime,
    familyFluencySummary,
    accurateButSlowCount: results.filter((r) => r.fluencyFlag === 'accurateButSlow').length,
    fluentCount: results.filter((r) => ['accurateAndFluent', 'automatic'].includes(r.fluencyFlag)).length,
  };
  const hasWorkingSubmitted = (result = {}) => Boolean(result.workingSubmitted || result.workingUploaded || result.fullscreenWorkingSubmitted);
  const hasWorkingDecision = (result = {}) => Boolean(hasWorkingSubmitted(result) || result.workingOnPaper || result.workingNotNeeded);
  const workingSubmittedResults = results.filter(hasWorkingSubmitted);
  const workingOnPaperResults = results.filter((r) => r.workingOnPaper);
  const mentalFluencyResults = results.filter((r) => r.workingNotNeeded);
  const overconfidentNoWorkingResults = results.filter((r) => !r.correct && r.workingNotNeeded && isHighConfidence(r.confidence));
  const highRequirementNoWorkingIncorrect = results.filter((r) => !r.correct && r.workingNotNeeded && r.workingRequirementLevel === 'HIGH');
  const workingEvidenceMetrics = {
    studentWorkingRate: results.length ? Math.round((workingSubmittedResults.length / results.length) * 1000) / 10 : 0,
    workingAccuracy: workingSubmittedResults.length
      ? Math.round((workingSubmittedResults.filter((r) => r.correct).length / workingSubmittedResults.length) * 1000) / 10
      : null,
    mentalFluencyAccuracy: mentalFluencyResults.length
      ? Math.round((mentalFluencyResults.filter((r) => r.correct).length / mentalFluencyResults.length) * 1000) / 10
      : null,
    overconfidenceRate: results.length ? Math.round((overconfidentNoWorkingResults.length / results.length) * 1000) / 10 : 0,
    highRequirementNoWorkingIncorrectCount: highRequirementNoWorkingIncorrect.length,
    interventionPriorityRaised: highRequirementNoWorkingIncorrect.length > 0,
  };

  const updatedPracticeState = {
    studentId,
    currentSkillId: session.targetSkillId,
    targetQuestionFamilyIds: session.targetQuestionFamilyIds,
    lastSessionId: practiceSessionId,
    latestAccuracy: accuracySummary.accuracyPercentage,
    latestAverageSeconds: accuracySummary.averageSeconds,
    latestQuestionFamilyStatuses: familyFluencySummary.map((f) => ({
      questionFamilyId: f.questionFamilyId,
      status: f.status,
      recommendation: f.recommendation,
    })),
  };

  const requiredQuestionIds = new Set(session.questions
    .filter((question) => session.workingExpectedMap?.[question.questionId]?.workingRequired)
    .map((question) => question.questionId));
  const requiredResults = results.filter((result) => requiredQuestionIds.has(result.questionId));
  const missingWorkingResults = requiredResults.filter((result) => !hasWorkingDecision(result));
  const paperWorkingResults = requiredResults.filter((result) => result.workingOnPaper && !hasWorkingSubmitted(result));
  const workingUploadRequired = Boolean(
    session.workingExpected &&
    resolvedSessionType !== 'warmup' &&
    (missingWorkingResults.length > 0 || paperWorkingResults.length > 0)
  );
  let nextRecommendedAction = computeNextAction({ familyFluencySummary, updateResults });
  if (resolvedSessionType === 'warmup') nextRecommendedAction = 'continuePractice';
  if (resolvedSessionType === 'remediation' && accuracySummary.accuracyPercentage >= 85) nextRecommendedAction = 'continuePractice';
  if (resolvedSessionType === 'mastery_check') nextRecommendedAction = accuracySummary.accuracyPercentage >= 85 ? 'advanceSkill' : 'reviewNeeded';

  const studentProgressState = buildStudentProgressState({
    studentId,
    practiceState: {
      currentSkillId: session.targetSkillId,
      weakSkillIds: accuracySummary.accuracyPercentage < 85 ? [session.targetSkillId] : [],
      masteredSkillIds: accuracySummary.accuracyPercentage >= 90 ? [session.targetSkillId] : [],
      fluentSkillIds: familyFluencySummary
        .filter((f) => ['fluent', 'automatic'].includes(f.status))
        .map((f) => f.skillId)
        .filter(Boolean),
    },
    fluencyState: {
      fluentSkillIds: familyFluencySummary
        .filter((f) => ['fluent', 'automatic'].includes(f.status))
        .map((f) => f.skillId)
        .filter(Boolean),
      accurateButSlowAreas: familyFluencySummary
        .filter((f) => f.status === 'accurateButSlow')
        .map((f) => f.questionFamilyName),
    },
    retentionState: {},
    assessmentResults: [],
    mistakePlans: [],
    workingAnalysisSummary: {
      missingWorkingCount: missingWorkingResults.length,
    },
  });

  return {
    sessionType: resolvedSessionType,
    sessionLabel: SESSION_TYPE_CONFIG[resolvedSessionType]?.label || 'Practice',
    results,
    accuracySummary,
    fluencySummary,
    workingEvidenceMetrics,
    updatedPracticeState,
    workingUploadRequired,
    workingSessionId: session.workingSessionId,
    questionWorkingSummary: {
      totalQuestions: session.questions.length,
      requiringWorking: requiredQuestionIds.size,
      workingSubmitted: workingSubmittedResults.length,
      workingOnPaper: workingOnPaperResults.length,
      workingNotNeeded: mentalFluencyResults.length,
      missingWorking: missingWorkingResults.length,
      status: missingWorkingResults.length > 0
        ? 'Missing working'
        : paperWorkingResults.length > 0
          ? 'Upload paper working'
          : 'Ready to continue',
      allNoWorkingDeclarations: results.length > 0 && results.every((result) => result.workingNotNeeded),
      questionRefs: session.questions.map((question) => {
        const match = results.find((result) => result.questionId === question.questionId);
        return {
          questionId: question.questionId,
          questionFamilyId: question.questionFamilyId,
          skillId: question.skillId,
          prompt: question.prompt,
          answerGiven: match?.studentAnswer || match?.answer || '',
          correctAnswer: question.answer?.display || '',
          answerCorrect: Boolean(match?.correct),
          confidenceLevel: match?.confidence || match?.reflection || '',
          solutionSteps: question.solutionSteps || [],
          expectedStepCount: Array.isArray(question.solutionSteps) ? question.solutionSteps.length : null,
          workingRequired: Boolean(session.workingExpectedMap?.[question.questionId]?.workingRequired),
          mentalMathEligible: Boolean(question.mentalMathEligible),
          workingSubmitted: Boolean(match && hasWorkingSubmitted(match)),
          workingOnPaper: Boolean(match?.workingOnPaper),
          workingNotNeeded: Boolean(match?.workingNotNeeded),
        };
      }),
    },
    nextRecommendedAction,
    studentProgressState,
  };
}

export function validateFractionPracticeFlow() {
  const start = startFractionPracticeFlow({
    studentId: 'practice_flow_validation_student',
    domainId: 'fractions',
    sessionLength: 5,
  });

  const responses = start.questions.slice(0, 5).map((q, i) => ({
    questionId: q.questionId,
    studentAnswer: i === 0 ? '0/1' : q.answer?.display || (q.acceptedAnswers?.[0] || ''),
    timeTaken: 10 + i * 2,
    confidence: i % 2 === 0 ? 'confident' : 'unsure',
    attemptNumber: 1,
  }));

  const submit = submitFractionPracticeAttempt({
    practiceSessionId: start.practiceSessionId,
    studentId: 'practice_flow_validation_student',
    responses,
  });

  const checks = {
    practiceSessionStarts: Boolean(start.practiceSessionId && start.questions.length),
    answersChecked: submit.results.length === responses.length,
    timePerQuestionRecorded: submit.results.every((r) => Number.isFinite(Number(r.timeTaken))),
    fluencyEvaluated: Array.isArray(submit.fluencySummary.familyFluencySummary),
    workingUploadReturned: typeof submit.workingUploadRequired === 'boolean',
    progressUpdated: Boolean(submit.studentProgressState?.studentId),
    nextActionReturned: Boolean(submit.nextRecommendedAction),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: {
      start,
      submit,
    },
  };
}

export const fractionPracticeFlow = {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
  buildFractionPracticeFeedback,
  validateFractionPracticeFlow,
};

export default fractionPracticeFlow;
