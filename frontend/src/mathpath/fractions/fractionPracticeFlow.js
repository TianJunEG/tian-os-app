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
        skipped: false,
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
    requestedSkillId = null,
    requestedQuestionFamilyId = null,
    sessionLength = 6,
  } = options;

  if (!studentId) throw new Error('studentId is required.');
  if (domainId !== 'fractions') throw new Error('Only fractions domain is supported.');

  const practiceSession = buildFractionPracticeSession({
    studentId,
    currentSkillId: requestedSkillId || null,
    sessionLength,
  });

  const targetSkillId = requestedSkillId || practiceSession.targetSkillId;
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
    count: Math.max(4, Number(sessionLength) || 6),
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
    responses = [],
  } = options;

  if (!practiceSessionId || !studentId) throw new Error('practiceSessionId and studentId are required.');
  const session = PRACTICE_FLOW_STORE.get(practiceSessionId);
  if (!session) throw new Error('Practice session not found.');
  if (session.studentId !== studentId) throw new Error('studentId does not match practice session.');

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

    const answerCheck = checkFractionAnswer({
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
      workingUploaded: false,
      attemptNumber: Number(response.attemptNumber || 1),
    });
    updateResults.push(stateUpdate);

    return {
      questionId: question.questionId,
      skillId: question.skillId,
      questionFamilyId: question.questionFamilyId,
      studentAnswer: response.studentAnswer,
      correctAnswer: question.answer?.display || null,
      normalizedStudentAnswer: answerCheck.normalizedStudentAnswer,
      normalizedCorrectAnswer: answerCheck.normalizedCorrectAnswer,
      correct: answerCheck.correct,
      timeTaken: Number(response.timeTaken || 0),
      confidence: response.confidence ?? null,
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

  const workingUploadRequired = Boolean(session.workingExpected);
  const nextRecommendedAction = computeNextAction({ familyFluencySummary, updateResults });

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
      missingWorkingCount: workingUploadRequired ? 1 : 0,
    },
  });

  return {
    results,
    accuracySummary,
    fluencySummary,
    updatedPracticeState,
    workingUploadRequired,
    workingSessionId: session.workingSessionId,
    questionWorkingSummary: {
      totalQuestions: session.questions.length,
      requiringWorking: session.questions.filter((question) => session.workingExpectedMap?.[question.questionId]?.workingRequired).length,
      questionRefs: session.questions.map((question) => ({
        questionId: question.questionId,
        questionFamilyId: question.questionFamilyId,
        skillId: question.skillId,
        prompt: question.prompt,
        workingRequired: Boolean(session.workingExpectedMap?.[question.questionId]?.workingRequired),
        mentalMathEligible: Boolean(question.mentalMathEligible),
      })),
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
