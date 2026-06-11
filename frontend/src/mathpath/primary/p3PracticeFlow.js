// ---------------------------------------------------------------------------
// P3 Practice Flow
// ---------------------------------------------------------------------------
// Mirrors fractionPracticeFlow.js but uses the P3 orchestrator to generate
// questions across all 8 P3 domains (Whole Numbers, Add/Sub, Mul/Div, Money,
// Measurement & Time, Area & Perimeter, Statistics, Word Problems).
//
// Returns the same session shape so PracticeSession.jsx can use either flow
// interchangeably based on skill ID prefix.
// ---------------------------------------------------------------------------

import { generateQuestionSet, getDomainForSkill, getAllSupportedSkillIds } from './p3Orchestrator.js';
import { checkP3Answer } from './p3AnswerChecker.js';
import {
  createWorkingSession,
  markWorkingExpected,
  createQuestionWorkingMap,
} from '../working/workingUploadWorkflow.js';

const P3_FLOW_STORE = new Map();

const SESSION_TYPE_CONFIG = {
  diagnostic: { min: 8, max: 12, defaultCount: 10, label: 'Check-In' },
  warmup: { min: 2, max: 3, defaultCount: 3, label: 'Quick Warm-up' },
  practice: { min: 4, max: 12, defaultCount: 6, label: 'Practice' },
  remediation: { min: 4, max: 8, defaultCount: 5, label: 'Remediation' },
  mastery_check: { min: 8, max: 12, defaultCount: 10, label: 'Mastery Check' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function normalizeSessionType(value) {
  const key = String(value || 'practice').toLowerCase();
  return SESSION_TYPE_CONFIG[key] ? key : 'practice';
}

function resolveSessionCount(sessionType, requestedLength) {
  const cfg = SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.practice;
  const wanted = Number(requestedLength);
  if (!wanted || !Number.isFinite(wanted)) return cfg.defaultCount;
  return Math.max(cfg.min, Math.min(cfg.max, Math.floor(wanted)));
}

function normalizeWorkingRequirementLevel(value) {
  const normalized = String(value || '').toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH'].includes(normalized) ? normalized : 'MEDIUM';
}

function isHighConfidence(value) {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'i_know_this' || normalized === 'high' || normalized.includes('confident') || normalized.includes('know');
}

// ---------------------------------------------------------------------------
// Question normalizer
// ---------------------------------------------------------------------------
// P3 generators return:   { answer: 5, answerType: 'number', options: [...], prompt, solutionText, ... }
// PracticeSession expects: { answer: { display: '5', type: 'whole' }, type: 'mcq'?, choices: [...], stem/prompt, solutionSteps, ... }

function normalizeP3Question(raw) {
  const normalized = { ...raw };

  // Normalize answer to { display, type, value } object
  if (raw.answerType === 'number' || typeof raw.answer === 'number') {
    normalized.answer = {
      display: String(raw.answer),
      type: 'whole',
      value: Number(raw.answer),
    };
  } else if (raw.answerType === 'choice') {
    normalized.answer = {
      display: String(raw.answer),
      type: 'text',
      value: raw.answer,
    };
    // Map to MCQ rendering
    normalized.type = 'mcq';
    normalized.choices = raw.options || [];
  } else if (raw.answerType === 'text') {
    normalized.answer = {
      display: String(raw.answer),
      type: 'text',
      value: raw.answer,
    };
  } else {
    // Fallback
    normalized.answer = {
      display: String(raw.answer ?? ''),
      type: 'text',
      value: raw.answer,
    };
  }

  // Ensure stem is available (PracticeSession uses both prompt and stem)
  if (!normalized.stem && normalized.prompt) {
    normalized.stem = normalized.prompt;
  }

  // Normalize solutionText → solutionSteps array
  if (!normalized.solutionSteps && normalized.solutionText) {
    normalized.solutionSteps = [normalized.solutionText];
  }

  // Normalize instructionHint → hint
  if (!normalized.hint && normalized.instructionHint) {
    normalized.hint = normalized.instructionHint;
  }

  // Set estimatedSeconds from fluencyTargetSeconds
  if (!normalized.estimatedSeconds && normalized.fluencyTargetSeconds) {
    normalized.estimatedSeconds = normalized.fluencyTargetSeconds;
  }

  // Keep the original raw answer for the checker
  normalized._rawAnswer = raw.answer;
  normalized._rawAnswerType = raw.answerType;

  return normalized;
}

// ---------------------------------------------------------------------------
// Detect P3 skill IDs
// ---------------------------------------------------------------------------

const P3_PREFIXES = ['P3-WN', 'P3-AS', 'P3-MD', 'P3-MON', 'P3-MT', 'P3-AP', 'P3-ST', 'P3-WP'];
const P3_SPECIAL_IDS = ['P3-DIAGNOSTIC'];

export function isP3SkillId(skillId) {
  if (!skillId) return false;
  if (P3_SPECIAL_IDS.includes(skillId)) return true;
  return P3_PREFIXES.some((prefix) => skillId.startsWith(prefix));
}

export function isP3Domain(domainId) {
  if (!domainId) return false;
  const d = domainId.toLowerCase();
  return d.startsWith('p3-') || d === 'wholenumbers' || d === 'addsub' || d === 'muldiv' || d === 'money'
    || d === 'meastime' || d === 'areaperim' || d === 'stat' || d === 'wordprob';
}

// ---------------------------------------------------------------------------
// Start P3 practice flow
// ---------------------------------------------------------------------------

export function startP3PracticeFlow(options = {}) {
  const {
    studentId,
    domainId = null,
    sessionType = 'practice',
    requestedSkillId = null,
    requestedQuestionFamilyId = null,
    sessionLength = 6,
    weakSkillIds = [],
    recentMistakeTypes = [],
  } = options;

  if (!studentId) throw new Error('studentId is required.');

  const resolvedSessionType = normalizeSessionType(sessionType);
  const effectiveSessionLength = resolveSessionCount(resolvedSessionType, sessionLength);

  // Resolve the target skill
  const preferredSkillId = requestedSkillId
    || ((resolvedSessionType === 'warmup' || resolvedSessionType === 'remediation') ? weakSkillIds[0] : null);

  let targetSkillId = preferredSkillId;

  // If no specific skill requested, pick a default from the domain (or first available)
  if (!targetSkillId) {
    const allSkills = getAllSupportedSkillIds();
    targetSkillId = allSkills[0] || 'P3-WN-01';
  }

  const resolvedDomainId = domainId || getDomainForSkill(targetSkillId) || 'p3-wholenumbers';

  // Generate questions using the orchestrator
  const rawQuestions = generateQuestionSet(targetSkillId, effectiveSessionLength, {
    questionFamilyId: requestedQuestionFamilyId || undefined,
  });

  // Normalize each question for PracticeSession compatibility
  const questions = rawQuestions.map(normalizeP3Question);

  // Build working session
  const practiceSessionId = makeId('p3_practice');

  const workingRequiredMap = {};
  questions.forEach((q) => {
    workingRequiredMap[q.questionId] = markWorkingExpected(q.questionId, q.questionFamilyId);
  });
  const workingExpected = Object.values(workingRequiredMap).some((w) => w.workingRequired);

  const workingSession = createWorkingSession({
    studentId,
    practiceSessionId,
    domainId: resolvedDomainId,
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
    practiceSessionId,
    studentId,
    domainId: resolvedDomainId,
    targetSkillId,
    targetQuestionFamilyIds: questions.map((q) => q.questionFamilyId).filter(Boolean),
    sessionType: resolvedSessionType,
    recentMistakeTypes: Array.isArray(recentMistakeTypes) ? recentMistakeTypes : [],
    questions,
    workingExpectedMap: workingRequiredMap,
    workingExpected,
    workingSessionId: workingSession.workingSessionId,
    startedAt: nowIso(),
  };

  P3_FLOW_STORE.set(practiceSessionId, flowSession);

  return {
    practiceSessionId,
    targetSkillId,
    targetQuestionFamilyIds: flowSession.targetQuestionFamilyIds,
    sessionType: resolvedSessionType,
    sessionLabel: SESSION_TYPE_CONFIG[resolvedSessionType]?.label || 'Practice',
    questions,
    workingExpected,
    workingSessionId: workingSession.workingSessionId,
    startedAt: flowSession.startedAt,
  };
}

// ---------------------------------------------------------------------------
// Build feedback
// ---------------------------------------------------------------------------

function buildP3PracticeFeedback(result = {}) {
  if (!result.correct) return 'Let’s review this skill before moving on.';
  if (result.fluencyFlag === 'accurateButSlow') return 'Correct! Let’s practise for speed.';
  if (result.fluencyFlag === 'accurateAndFluent' || result.fluencyFlag === 'automatic') {
    return 'Fast and accurate — impressive!';
  }
  return 'Correct!';
}

// ---------------------------------------------------------------------------
// Fluency helpers (simplified — no dependency on fraction fluency engine)
// ---------------------------------------------------------------------------

function computeFluencyFlag(correct, timeTaken, estimatedSeconds) {
  if (!correct) return 'incorrect';
  const target = estimatedSeconds || 30;
  if (timeTaken <= target * 0.5) return 'automatic';
  if (timeTaken <= target) return 'accurateAndFluent';
  return 'accurateButSlow';
}

function computeP3FamilySummary(results = []) {
  const byFamily = new Map();
  results.forEach((r) => {
    if (!byFamily.has(r.questionFamilyId)) byFamily.set(r.questionFamilyId, []);
    byFamily.get(r.questionFamilyId).push(r);
  });

  return [...byFamily.entries()].map(([questionFamilyId, familyResults]) => {
    const correctCount = familyResults.filter((r) => r.correct).length;
    const accuracy = familyResults.length ? correctCount / familyResults.length : 0;
    const avgTime = average(familyResults.map((r) => r.timeTaken));
    const estimatedSeconds = familyResults[0]?.estimatedSeconds || 30;

    let status;
    if (accuracy < 0.5) status = 'weak';
    else if (accuracy < 0.8) status = 'needsReview';
    else if (avgTime > estimatedSeconds * 1.5) status = 'accurateButSlow';
    else if (avgTime <= estimatedSeconds * 0.5) status = 'automatic';
    else status = 'fluent';

    let recommendation;
    if (status === 'weak' || status === 'needsReview') recommendation = 'practiceMore';
    else if (status === 'accurateButSlow') recommendation = 'speedDrill';
    else recommendation = 'advance';

    return {
      questionFamilyId,
      questionFamilyName: questionFamilyId,
      skillId: familyResults[0]?.skillId || null,
      status,
      accuracy: Math.round(accuracy * 1000) / 10,
      averageSeconds: avgTime,
      recommendation,
    };
  });
}

function computeNextAction({ familyFluencySummary = [] }) {
  const weakFamily = familyFluencySummary.find((f) => ['weak', 'needsReview'].includes(f.status));
  if (weakFamily) return 'reviewNeeded';
  const slowFamily = familyFluencySummary.find((f) => f.status === 'accurateButSlow');
  if (slowFamily) return 'startFluency';
  const fluentFamilies = familyFluencySummary.filter((f) => ['fluent', 'automatic'].includes(f.status)).length;
  if (fluentFamilies === familyFluencySummary.length && fluentFamilies > 0) return 'readyForFluency';
  return 'continuePractice';
}

// ---------------------------------------------------------------------------
// Submit P3 practice attempt
// ---------------------------------------------------------------------------

export function submitP3PracticeAttempt(options = {}) {
  const {
    practiceSessionId,
    studentId,
    sessionType = null,
    responses = [],
  } = options;

  if (!practiceSessionId || !studentId) throw new Error('practiceSessionId and studentId are required.');
  const session = P3_FLOW_STORE.get(practiceSessionId);
  if (!session) throw new Error('Practice session not found.');
  if (session.studentId !== studentId) throw new Error('studentId does not match practice session.');
  const resolvedSessionType = normalizeSessionType(sessionType || session.sessionType || 'practice');

  const questionById = new Map(session.questions.map((q) => [q.questionId, q]));

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

    // Use the P3 answer checker with the raw answer info
    const answerCheck = skipped
      ? { correct: false, normalizedStudentAnswer: null, normalizedCorrectAnswer: question.answer?.display || null }
      : checkP3Answer({
          studentAnswer: response.studentAnswer,
          question: {
            answer: question._rawAnswer ?? question.answer?.value ?? question.answer,
            answerType: question._rawAnswerType ?? question.answerType ?? 'text',
          },
        });

    const timeTaken = Number(response.timeTaken || 0);
    const fluencyFlag = computeFluencyFlag(answerCheck.correct, timeTaken, question.estimatedSeconds);

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
      timeTaken,
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
      fluencyFlag,
      estimatedSeconds: question.estimatedSeconds || null,
      feedback: buildP3PracticeFeedback({ correct: answerCheck.correct, fluencyFlag }),
      solutionSteps: question.solutionSteps || [],
    };
  });

  // Score (exclude phantom rows that didn't match a question)
  const scoredResults = results.filter((r) => !r.error);
  const correctCount = scoredResults.filter((r) => r.correct).length;
  const accuracyPct = scoredResults.length ? Math.round((correctCount / scoredResults.length) * 1000) / 10 : 0;
  const avgTime = average(scoredResults.map((r) => r.timeTaken));
  const familyFluencySummary = computeP3FamilySummary(scoredResults);

  const accuracySummary = {
    totalQuestions: scoredResults.length,
    correctCount,
    incorrectCount: Math.max(0, scoredResults.length - correctCount),
    accuracyPercentage: accuracyPct,
    averageSeconds: avgTime,
  };

  const fluencySummary = {
    averageSeconds: avgTime,
    familyFluencySummary,
    accurateButSlowCount: scoredResults.filter((r) => r.fluencyFlag === 'accurateButSlow').length,
    fluentCount: scoredResults.filter((r) => ['accurateAndFluent', 'automatic'].includes(r.fluencyFlag)).length,
  };

  const hasWorkingSubmittedFn = (result = {}) => Boolean(result.workingSubmitted || result.workingUploaded || result.fullscreenWorkingSubmitted);
  const hasWorkingDecisionFn = (result = {}) => Boolean(hasWorkingSubmittedFn(result) || result.workingOnPaper || result.workingNotNeeded);
  const workingSubmittedResults = scoredResults.filter(hasWorkingSubmittedFn);
  const workingOnPaperResults = scoredResults.filter((r) => r.workingOnPaper);
  const mentalFluencyResults = scoredResults.filter((r) => r.workingNotNeeded);
  const overconfidentNoWorkingResults = scoredResults.filter((r) => !r.correct && r.workingNotNeeded && isHighConfidence(r.confidence));
  const highRequirementNoWorkingIncorrect = scoredResults.filter((r) => !r.correct && r.workingNotNeeded && r.workingRequirementLevel === 'HIGH');

  const workingEvidenceMetrics = {
    studentWorkingRate: scoredResults.length ? Math.round((workingSubmittedResults.length / scoredResults.length) * 1000) / 10 : 0,
    workingAccuracy: workingSubmittedResults.length
      ? Math.round((workingSubmittedResults.filter((r) => r.correct).length / workingSubmittedResults.length) * 1000) / 10
      : null,
    mentalFluencyAccuracy: mentalFluencyResults.length
      ? Math.round((mentalFluencyResults.filter((r) => r.correct).length / mentalFluencyResults.length) * 1000) / 10
      : null,
    overconfidenceRate: scoredResults.length ? Math.round((overconfidentNoWorkingResults.length / scoredResults.length) * 1000) / 10 : 0,
    highRequirementNoWorkingIncorrectCount: highRequirementNoWorkingIncorrect.length,
    interventionPriorityRaised: highRequirementNoWorkingIncorrect.length > 0,
  };

  const requiredQuestionIds = new Set(session.questions
    .filter((question) => session.workingExpectedMap?.[question.questionId]?.workingRequired)
    .map((question) => question.questionId));
  const requiredResults = results.filter((result) => requiredQuestionIds.has(result.questionId));
  const missingWorkingResults = requiredResults.filter((result) => !hasWorkingDecisionFn(result));
  const paperOnlyResults = requiredResults.filter((result) => result.workingOnPaper && !hasWorkingSubmittedFn(result));
  const workingUploadRequired = Boolean(
    session.workingExpected &&
    resolvedSessionType !== 'warmup' &&
    (missingWorkingResults.length > 0 || paperOnlyResults.length > 0)
  );

  let nextRecommendedAction = computeNextAction({ familyFluencySummary });
  if (resolvedSessionType === 'warmup') nextRecommendedAction = 'continuePractice';
  if (resolvedSessionType === 'remediation' && accuracySummary.accuracyPercentage >= 85) nextRecommendedAction = 'continuePractice';
  if (resolvedSessionType === 'mastery_check') nextRecommendedAction = accuracySummary.accuracyPercentage >= 85 ? 'advanceSkill' : 'reviewNeeded';

  const studentProgressState = {
    studentId,
    currentSkillId: session.targetSkillId,
    domainId: session.domainId,
    weakSkillIds: accuracySummary.accuracyPercentage < 85 ? [session.targetSkillId] : [],
    masteredSkillIds: accuracySummary.accuracyPercentage >= 90 ? [session.targetSkillId] : [],
    fluentSkillIds: familyFluencySummary
      .filter((f) => ['fluent', 'automatic'].includes(f.status))
      .map((f) => f.skillId)
      .filter(Boolean),
  };

  return {
    sessionType: resolvedSessionType,
    sessionLabel: SESSION_TYPE_CONFIG[resolvedSessionType]?.label || 'Practice',
    results,
    accuracySummary,
    fluencySummary,
    workingEvidenceMetrics,
    updatedPracticeState: {
      studentId,
      currentSkillId: session.targetSkillId,
      targetQuestionFamilyIds: session.targetQuestionFamilyIds,
      lastSessionId: practiceSessionId,
      latestAccuracy: accuracySummary.accuracyPercentage,
      latestAverageSeconds: accuracySummary.averageSeconds,
    },
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
        : paperOnlyResults.length > 0
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
          workingRequired: Boolean(session.workingExpectedMap?.[question.questionId]?.workingRequired),
          workingSubmitted: Boolean(match && hasWorkingSubmittedFn(match)),
          workingOnPaper: Boolean(match?.workingOnPaper),
          workingNotNeeded: Boolean(match?.workingNotNeeded),
        };
      }),
    },
    nextRecommendedAction,
    studentProgressState,
  };
}

// ---------------------------------------------------------------------------
// Check answer (for inline use in PracticeSession)
// ---------------------------------------------------------------------------
// Wraps checkP3Answer to accept the same { studentAnswer, correctAnswer, acceptedAnswers }
// signature that PracticeSession uses for checkFractionAnswer.

export function checkP3AnswerForSession({ studentAnswer, correctAnswer, acceptedAnswers = [], question }) {
  // If we have a normalized question with _rawAnswer, use it
  if (question?._rawAnswer !== undefined) {
    return checkP3Answer({
      studentAnswer,
      question: {
        answer: question._rawAnswer,
        answerType: question._rawAnswerType || 'text',
      },
    });
  }

  // Fallback: use the answer object
  if (typeof correctAnswer === 'object' && correctAnswer !== null) {
    const rawValue = correctAnswer.value ?? correctAnswer.display;
    const rawType = correctAnswer.type === 'whole' ? 'number' : 'text';
    return checkP3Answer({
      studentAnswer,
      question: { answer: rawValue, answerType: rawType },
    });
  }

  // Simple fallback
  return checkP3Answer({
    studentAnswer,
    question: { answer: correctAnswer, answerType: typeof correctAnswer === 'number' ? 'number' : 'text' },
  });
}

export default {
  isP3SkillId,
  isP3Domain,
  startP3PracticeFlow,
  submitP3PracticeAttempt,
  checkP3AnswerForSession,
};
