import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import StudentGuardian from '../../models/StudentGuardian.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import Skill from '../../models/Skill.js';
import { evaluateDiagnosticReplayPolicy } from '../../utils/diagnosticReplayPolicy.js';
import {
  calculateDiagnosticReadinessScore,
  decideNextDiagnosticStep,
  DIAGNOSTIC_DECISIONS,
} from '../../utils/adaptiveDiagnosticDecisionEngine.js';
import { selectNextDiagnosticQuestion } from '../../utils/selectNextDiagnosticQuestion.js';
import { getDiagnosticDomain } from './diagnosticDomainRegistry.js';
import {
  normalizeConfidence,
  recordLearningEvents,
} from '../telemetry/learningTelemetryService.js';
import {
  applyDiagnosticCompletionMetadata,
  resolveDiagnosticLineage,
} from './diagnosticGrowthService.js';
import { createAssignmentFromDiagnostic } from '../mathpath/mathPathAssignmentService.js';
import { applyRecheckMasteryEvidence } from '../mathpath/recheckMasteryEvidenceService.js';
import Mistake from '../../models/Mistake.js';
import { notify } from '../notifications/notificationService.js';
import logger from '../../config/logger.js';

const DIAG_PURPOSES = new Set(['baseline', 'recheck', 'assigned']);
const COMPLETION_REASONS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  TARGET_REACHED: 'target_reached',
  PLACEMENT_CONFIDENT: 'placement_confident',
  COVERAGE_COMPLETE: 'coverage_complete',
  QUESTION_GENERATION_FAILED: 'question_generation_failed',
});

function toDateLike(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safePurpose(value = '') {
  const raw = String(value || '').toLowerCase();
  return DIAG_PURPOSES.has(raw) ? raw : 'baseline';
}

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function resolveMinimumQuestionCount({ adaptiveState = {}, maxQuestions = 10, domain, mode = 'core', purpose = 'baseline' } = {}) {
  const resolved = domain?.resolveMinimumDiagnosticCount?.(mode, purpose);
  return Math.min(
    maxQuestions,
    toPositiveInt(
      adaptiveState.minimumQuestions ?? adaptiveState.minQuestions ?? resolved,
      maxQuestions
    )
  );
}

export function buildDiagnosticLifecycleLog({
  sessionId = '',
  studentId = '',
  targetQuestions = 0,
  answeredQuestions,
  questionsAnswered,
  completionReason = COMPLETION_REASONS.IN_PROGRESS,
} = {}) {
  const target = Math.max(0, Number(targetQuestions) || 0);
  const answered = Math.max(0, Number(answeredQuestions ?? questionsAnswered) || 0);
  return {
    sessionId,
    studentId: String(studentId || ''),
    targetQuestions: target,
    answeredQuestions: answered,
    questionsAnswered: answered,
    questionsRemaining: Math.max(0, target - answered),
    completionReason,
  };
}

function logDiagnosticLifecycle(payload = {}) {
  const entry = buildDiagnosticLifecycleLog(payload);
  logger.info({ event: 'diagnostic:lifecycle', ...entry });
  return entry;
}

function completionReasonFromDecision(decision = {}) {
  const type = String(decision.decisionType || '');
  if (type === DIAGNOSTIC_DECISIONS.MARK_SECURE && !decision.nextSkillId) return COMPLETION_REASONS.PLACEMENT_CONFIDENT;
  if (type === DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE || type === DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION) {
    return COMPLETION_REASONS.PLACEMENT_CONFIDENT;
  }
  return decision.completionReason || COMPLETION_REASONS.COVERAGE_COMPLETE;
}

export function resolveDiagnosticCompletion({
  answeredCount = 0,
  maxQuestions = 10,
  minimumQuestions = maxQuestions,
  decision = {},
  nextQuestionAvailable = false,
  generationFailed = false,
} = {}) {
  const answered = Math.max(0, Number(answeredCount) || 0);
  const target = Math.max(1, Number(maxQuestions) || 10);
  const min = Math.min(target, Math.max(1, Number(minimumQuestions) || target));
  if (answered >= target) {
    return {
      sessionComplete: true,
      completionReason: COMPLETION_REASONS.TARGET_REACHED,
      adaptiveStopDeferred: false,
    };
  }
  if (generationFailed) {
    // The question bank was exhausted before the target was reached — common in
    // visual-heavy domains with thin diagnostic banks (e.g. volume), where an
    // adaptive STEP_DOWN can leave no easier item to serve. If the student has
    // already answered at least one question we have enough signal to place them,
    // so finish as a coverage-complete placement rather than trapping them with a
    // retryable error (a retry can't conjure a question that doesn't exist). Only
    // surface the hard error when nothing has been answered (a genuine setup gap).
    if (answered >= 1) {
      return {
        sessionComplete: true,
        completionReason: COMPLETION_REASONS.COVERAGE_COMPLETE,
        adaptiveStopDeferred: false,
      };
    }
    return {
      sessionComplete: false,
      completionReason: COMPLETION_REASONS.QUESTION_GENERATION_FAILED,
      adaptiveStopDeferred: false,
    };
  }
  if (decision?.shouldStopDiagnostic) {
    if (answered >= min) {
      return {
        sessionComplete: true,
        completionReason: completionReasonFromDecision(decision),
        adaptiveStopDeferred: false,
      };
    }
    return {
      sessionComplete: false,
      completionReason: COMPLETION_REASONS.IN_PROGRESS,
      adaptiveStopDeferred: Boolean(nextQuestionAvailable),
    };
  }
  return {
    sessionComplete: false,
    completionReason: COMPLETION_REASONS.IN_PROGRESS,
    adaptiveStopDeferred: false,
  };
}

function isTestRequester(user = {}) {
  return Boolean(user?.is_test_account || /^test\.student\d+@tianos\.test$/i.test(user?.email || ''));
}

function sessionCodeFor(domainId = 'diagnostic') {
  const safe = String(domainId || 'diagnostic').replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'diagnostic';
  return `${safe}diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Cap client-supplied arrays so a hostile request (notably on the unauthenticated
// kiosk path) can't persist unbounded working evidence. Generous limits — real
// usage never approaches them; the express 10mb body limit is the primary bound.
function boundedArray(value, cap) {
  return Array.isArray(value) ? value.slice(0, cap) : [];
}

function normalizeResponseBody(body = {}, question = {}) {
  const answer = String(body.answer ?? body.studentAnswer ?? '');
  const skipped = Boolean(body.skipped);
  const blankAnswer = Boolean(body.blankAnswer || (!skipped && !answer.trim()));
  const timeTakenMs = Math.max(0, Number(body.timeTakenMs ?? body.timeMs ?? 0) || 0);
  return {
    answer,
    studentAnswer: answer,
    confidence: String(body.confidence || body.reflection || ''),
    skipped,
    blankAnswer,
    timeTakenMs,
    timeTakenSeconds: Math.max(1, Math.round(timeTakenMs / 1000)),
    attemptNumber: Math.max(1, Number(body.attempts || body.attemptNumber || 1)),
    questionFamilyId: String(body.questionFamilyId || question.questionFamilyId || ''),
    startedAt: toDateLike(body.questionStartedAt) || new Date(Date.now() - timeTakenMs),
    endedAt: toDateLike(body.questionEndedAt) || new Date(),
    workingSubmitted: Boolean(body.workingSubmitted || body.workingUploaded || body.fullscreenWorkingSubmitted),
    workingSubmittedAt: toDateLike(body.workingSubmittedAt),
    workingImage: String(body.workingImage || ''),
    workingStrokes: boundedArray(body.workingStrokes, 10000),
    workingNotNeeded: Boolean(body.workingNotNeeded),
    workingRequirementLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(String(body.workingRequirementLevel || '').toUpperCase())
      ? String(body.workingRequirementLevel).toUpperCase()
      : '',
    workingMathObjects: boundedArray(body.workingMathObjects, 2000),
    fullscreenWorkingImage: String(body.fullscreenWorkingImage || ''),
    fullscreenWorkingStrokes: boundedArray(body.fullscreenWorkingStrokes, 10000),
    fullscreenWorkingMathObjects: boundedArray(body.fullscreenWorkingMathObjects, 2000),
    fullscreenWorkingSubmitted: Boolean(body.fullscreenWorkingSubmitted),
    fullscreenWorkingSubmittedAt: toDateLike(body.fullscreenWorkingSubmittedAt),
    workingEvidence: boundedArray(body.workingEvidence, 500),
    helpRequested: Boolean(body.helpRequested),
    timedOut: Boolean(body.timedOut),
    detectedErrorTags: boundedArray(body.detectedErrorTags, 200),
  };
}

function confidenceCalibration(correct, confidence) {
  if (correct && confidence === 'i_know_this') return 'mastery_signal';
  if (!correct && confidence === 'i_know_this') return 'overconfidence';
  if (correct && confidence !== 'i_know_this') return 'fragile_correct';
  return 'needs_review';
}

function questionIdOf(question = {}) {
  return String(question.questionId || question.id || question._id || '').trim();
}

function skillIdOf(question = {}) {
  return String(question.skillId || question.id || question._id || question || '').trim();
}

export function selectFallbackDiagnosticQuestion({
  questionBank = [],
  attemptedQuestionIds = [],
  candidateQuestionIds = [],
  preferredSkillIds = [],
} = {}) {
  const attempted = new Set((attemptedQuestionIds || []).map(String));
  const candidateOrder = new Map((candidateQuestionIds || []).map((id, index) => [String(id), index]));
  const preferredSkills = new Set((preferredSkillIds || []).map(String).filter(Boolean));
  const available = (questionBank || [])
    .filter((question) => {
      const questionId = questionIdOf(question);
      return questionId && !attempted.has(questionId);
    })
    .sort((a, b) => {
      const aPreferred = preferredSkills.has(skillIdOf(a)) ? 0 : 1;
      const bPreferred = preferredSkills.has(skillIdOf(b)) ? 0 : 1;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;
      const aOrder = candidateOrder.has(questionIdOf(a)) ? candidateOrder.get(questionIdOf(a)) : Number.MAX_SAFE_INTEGER;
      const bOrder = candidateOrder.has(questionIdOf(b)) ? candidateOrder.get(questionIdOf(b)) : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
  return available[0] || null;
}

async function maybePersistAttempt({ student, session, question, skillId, response, correct }) {
  const qid = question?._id || question?.questionId;
  if (!qid) return;
  await MathPathAttempt.create({
    studentId: String(student._id),
    domainId: session.domainId,
    skillId,
    questionFamilyId: response.questionFamilyId,
    questionId: String(qid),
    sessionId: session.diagnosticSessionId,
    sessionType: 'diagnostic',
    answer: response.answer,
    answerCorrect: correct,
    studentAnswer: response.answer,
    correctAnswer: String(question.answer || ''),
    correct,
    timeTaken: response.timeTakenSeconds,
    timeSpentSeconds: response.timeTakenSeconds,
    timestamp: response.endedAt,
    confidence: response.confidence,
    confidenceLevel: response.confidence,
    reflection: response.confidence,
    helpRequested: response.confidence === 'i_need_help' || response.helpRequested,
    confidenceCalibration: confidenceCalibration(correct, response.confidence),
    possibleMisconception: !correct && response.confidence === 'i_know_this',
    skipped: response.skipped,
    timedOut: response.timedOut,
    questionStartedAt: response.startedAt,
    questionEndedAt: response.endedAt,
    attemptNumber: response.attemptNumber,
    workingExpected: true,
    workingUploaded: response.workingSubmitted,
    workingSubmitted: response.workingSubmitted,
    workingSubmittedAt: response.workingSubmittedAt,
    workingImage: response.workingImage,
    workingStrokes: response.workingStrokes,
    workingMathObjects: response.workingMathObjects,
    workingNotNeeded: response.workingNotNeeded,
    workingRequirementLevel: response.workingRequirementLevel,
    fullscreenWorkingSubmitted: response.fullscreenWorkingSubmitted,
    fullscreenWorkingImage: response.fullscreenWorkingImage,
    fullscreenWorkingStrokes: response.fullscreenWorkingStrokes,
    fullscreenWorkingMathObjects: response.fullscreenWorkingMathObjects,
    fullscreenWorkingSubmittedAt: response.fullscreenWorkingSubmittedAt,
    workingEvidence: response.workingEvidence,
    workingDecision: '',
    workingReason: '',
  });
}

async function maybePersistMistake({ student, session, question, skillId, response, correct, detectedErrorTags }) {
  const qid = question?._id || question?.questionId;
  if (correct || !qid) return;
  const mistakeCode = question.misconceptionTag || detectedErrorTags[0] || 'diagnostic_error';

  // Write to the shared Mistake collection so student mistakes UI picks it up
  if (student.workspaceId) {
    await Mistake.findOneAndUpdate(
      { studentId: student._id, questionId: String(qid), sessionId: session.diagnosticSessionId || '' },
      {
        $setOnInsert: {
          studentId: student._id,
          workspaceId: student.workspaceId,
          questionId: String(qid),
          sessionId: session.diagnosticSessionId || '',
          skillCode: skillId || '',
          module: 'MathPath',
          questionText: question.stem || question.prompt || '',
          questionStem: question.stem || question.prompt || '',
          // Carry a walkthrough so the review shows worked steps instead of the
          // generic "Review the method" fallback for diagnostic-sourced mistakes.
          workedSolution: String(question.workedSolution || question.explanation || question.modelAnswer || ''),
          solutionSteps: Array.isArray(question.solutionSteps) ? question.solutionSteps : [],
          studentAnswer: String(response.answer || ''),
          correctAnswer: String(question.answer || ''),
          confidence: response.confidence || '',
          answerCorrect: false,
          mistakeCategory: 'knowledge_gap',
          timestamp: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch((err) => logger.warn({ err: err.message }, 'diagnostic Mistake upsert skipped'));
  }

  await MathPathMistakeRecord.findOneAndUpdate(
    {
      studentId: String(student._id),
      domainId: session.domainId,
      skillId,
      questionFamilyId: response.questionFamilyId,
      mistakeCode,
    },
    {
      $inc: { frequency: 1 },
      $set: {
        mistakeName: mistakeCode,
        severity: response.confidence === 'i_know_this' ? 'high' : 'medium',
        lastSeenAt: new Date(),
      },
      $push: {
        evidence: {
          source: response.skipped ? 'diagnostic-skipped' : 'diagnostic-adaptive',
          questionId: String(qid),
          prompt: question.stem || question.prompt || '',
          studentAnswer: response.answer,
          correctAnswer: String(question.answer || ''),
          confidence: response.confidence,
          seenAt: new Date(),
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function enforceReplayPolicy({ student, userId, subjectId, domainId, purpose }) {
  const latestCompleted = await MathPathDiagnosticSession.findOne({
    studentId: String(student._id),
    subjectId,
    domainId,
    status: 'completed',
  }).sort({ completedAt: -1, createdAt: -1 });

  // Product decision: an interrupted/exited check-in must RESET. Rather than
  // resuming, abandon every lingering in-progress session for this domain so the
  // student always begins a fresh session from question 1 on the next entry.
  await MathPathDiagnosticSession.updateMany(
    {
      studentId: String(student._id),
      subjectId,
      domainId,
      status: 'inProgress',
    },
    { $set: { status: 'abandoned' } }
  );

  const requester = userId ? await User.findById(userId).select('is_test_account email') : null;
  const replayPolicy = evaluateDiagnosticReplayPolicy({
    diagnosticPurpose: purpose,
    latestCompletedSession: latestCompleted,
  });
  if (!isTestRequester(requester) && !replayPolicy.allowed) {
    const err = new Error('Diagnostic replay is currently blocked. Continue from your saved placement or run a re-check.');
    err.status = 409;
    err.code = 'DIAGNOSTIC_REPLAY_BLOCKED';
    err.payload = {
      code: err.code,
      replayPolicy,
      latestPlacement: latestCompleted
        ? {
            sessionId: latestCompleted.diagnosticSessionId,
            completedAt: latestCompleted.completedAt,
            result: latestCompleted.result || {},
          }
        : null,
    };
    throw err;
  }
}

export async function startAdaptiveDiagnostic({
  student,
  userId = '',
  subjectId = 'math',
  domainId = 'fractions',
  requestedMode = '',
  startSkillId = '',
  studentLevel = '',
  diagnosticPurpose = 'baseline',
  enforceReplay = true,
} = {}) {
  const domain = getDiagnosticDomain({ subjectId, domainId });
  const purpose = safePurpose(diagnosticPurpose);
  const levelTag = domain.normalizeLevelTag ? domain.normalizeLevelTag(studentLevel || student?.level || '') : String(studentLevel || student?.level || '');
  const mode = domain.normalizeDiagnosticModeForLevel
    ? domain.normalizeDiagnosticModeForLevel(levelTag, String(requestedMode || '').toLowerCase())
    : (requestedMode || 'core');

  if (enforceReplay) {
    await enforceReplayPolicy({ student, userId, subjectId: domain.subjectId, domainId: domain.domainId, purpose });
  }

  const { skills, byFrameworkId } = await domain.loadSkills({ student, mode, startSkillId, studentLevel: levelTag });
  if (!skills?.length) {
    const err = new Error(`${domain.displayName || domain.domainId} skills are not seeded yet.`);
    err.status = 400;
    throw err;
  }
  const targetSkills = startSkillId
    ? [byFrameworkId?.get(String(startSkillId).toUpperCase())].filter(Boolean)
    : domain.selectTargetSkills({ skills, mode, startSkillId, studentLevel: levelTag });
  if (!targetSkills.length) {
    const err = new Error(`No ${domain.displayName || domain.domainId} skills available for this diagnostic mode.`);
    err.status = 400;
    throw err;
  }

  const targetSkillIds = targetSkills.map((skill) => String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || skill.frameworkSkillId || ''));
  const count = domain.resolveDiagnosticCount ? domain.resolveDiagnosticCount(mode, purpose) : 10;
  const minimumQuestions = resolveMinimumQuestionCount({
    adaptiveState: {},
    maxQuestions: count,
    domain,
    mode,
    purpose,
  });
  const rawQuestions = await domain.selectInitialQuestions({
    targetSkills,
    count,
    mode,
    purpose,
    studentLevel: levelTag,
    startSkillId,
  });
  if (!rawQuestions?.length) {
    const err = new Error(`No diagnostic questions available yet for ${domain.displayName || domain.domainId}.`);
    err.status = 400;
    throw err;
  }

  const qSkillIds = [];
  const qFamilyIds = [];
  const mappedQuestions = rawQuestions.map((question) => {
    const skill = targetSkills.find((s) => String(s._id) === String(question.skillId)) || question.skillId || null;
    const shaped = domain.normaliseQuestion(question, skill);
    if (shaped.skillId) qSkillIds.push(shaped.skillId);
    if (shaped.questionFamilyId) qFamilyIds.push(shaped.questionFamilyId);
    return shaped;
  }).filter((q) => q.skillId);

  const firstQuestion = mappedQuestions[0] || null;
  const diagnosticSessionId = sessionCodeFor(domain.domainId);
  const lineage = await resolveDiagnosticLineage({
    studentId: String(student._id),
    subjectId: domain.subjectId,
    domainId: domain.domainId,
    diagnosticSessionId,
  });
  const doc = await MathPathDiagnosticSession.create({
    diagnosticSessionId,
    studentId: String(student._id),
    subjectId: domain.subjectId,
    domainId: domain.domainId,
    domainVersion: domain.domainVersion || '',
    mode,
    diagnosticPurpose: purpose,
    attemptNumber: lineage.attemptNumber,
    isBaseline: lineage.isBaseline,
    baselineDiagnosticId: lineage.isBaseline ? diagnosticSessionId : lineage.baselineDiagnosticId,
    previousDiagnosticId: lineage.previousDiagnosticId,
    studentLevel: levelTag || '',
    targetSkillIds: [...new Set(qSkillIds.length ? qSkillIds : targetSkillIds)],
    targetQuestionFamilyIds: [...new Set(qFamilyIds)],
    currentSkillId: firstQuestion?.skillId || '',
    currentQuestionId: firstQuestion?.questionId || '',
    adaptiveState: {
      attemptedQuestionIds: [],
      responses: [],
      decisionHistory: [],
      rephraseUsedByQuestion: {},
      candidateQuestionIds: mappedQuestions.map((q) => q.questionId),
      maxQuestions: count,
      minimumQuestions,
      answeredCount: 0,
    },
    lifecycleLog: buildDiagnosticLifecycleLog({
      sessionId: diagnosticSessionId,
      studentId: String(student._id),
      targetQuestions: count,
      answeredQuestions: 0,
      completionReason: COMPLETION_REASONS.IN_PROGRESS,
    }),
    status: 'inProgress',
    startedAt: new Date(),
    result: {
      diagnosticPurpose: purpose,
      questionIds: mappedQuestions.map((q) => q.questionId),
      questionMeta: mappedQuestions.map((q) => ({
        questionId: q.questionId,
        skillId: q.skillId,
        questionFamilyId: q.questionFamilyId,
        answerInputType: q.answerInputType || '',
      })),
    },
  });

  const enrichmentOnly = ['P1', 'P2'].includes((levelTag || '').toUpperCase());
  logDiagnosticLifecycle({
    sessionId: doc.diagnosticSessionId,
    studentId: String(student._id),
    targetQuestions: count,
    answeredQuestions: 0,
    completionReason: COMPLETION_REASONS.IN_PROGRESS,
  });
  await recordLearningEvents([
    {
      studentId: String(student._id),
      eventType: 'session_started',
      subjectId: domain.subjectId,
      domain: domain.domainId,
      sessionId: doc.diagnosticSessionId,
      metadata: { mode, diagnosticPurpose: purpose, estimatedQuestionCount: count },
    },
    {
      studentId: String(student._id),
      eventType: 'diagnostic_started',
      subjectId: domain.subjectId,
      domain: domain.domainId,
      sessionId: doc.diagnosticSessionId,
      metadata: { mode, diagnosticPurpose: purpose, estimatedQuestionCount: count },
    },
    ...(firstQuestion ? [{
      studentId: String(student._id),
      eventType: 'question_viewed',
      subjectId: domain.subjectId,
      domain: domain.domainId,
      skillCode: firstQuestion.skillId,
      questionId: firstQuestion.questionId,
      sessionId: doc.diagnosticSessionId,
      metadata: { questionFamilyId: firstQuestion.questionFamilyId, answerInputType: firstQuestion.answerInputType || '' },
    }] : []),
  ]);
  return {
    sessionId: doc.diagnosticSessionId,
    subjectId: domain.subjectId,
    domainId: domain.domainId,
    currentQuestion: firstQuestion,
    nextQuestion: firstQuestion,
    questions: firstQuestion ? [firstQuestion] : [],
    progress: {
      answeredCount: 0,
      estimatedQuestionCount: count,
      readinessScore: 0,
    },
    diagnosticConfig: {
      mode,
      diagnosticPurpose: purpose,
      studentLevel: levelTag || '',
      enrichmentOnly,
      targetSkillIds: doc.targetSkillIds,
      targetQuestionFamilyIds: doc.targetQuestionFamilyIds,
      estimatedQuestionCount: count,
      minimumQuestionCount: minimumQuestions,
      adaptive: true,
      displayName: domain.displayName || domain.domainId,
    },
    session: {
      sessionId: doc.diagnosticSessionId,
      subjectId: domain.subjectId,
      domainId: domain.domainId,
      mode,
      diagnosticPurpose: purpose,
      studentLevel: levelTag || '',
      enrichmentOnly,
      targetSkillIds: doc.targetSkillIds,
      targetQuestionFamilyIds: doc.targetQuestionFamilyIds,
      estimatedQuestionCount: count,
      minimumQuestionCount: minimumQuestions,
      adaptive: true,
    },
  };
}

export async function answerAdaptiveDiagnostic({ student, sessionId, body = {} } = {}) {
  const session = await MathPathDiagnosticSession.findOne({
    diagnosticSessionId: sessionId,
    studentId: String(student._id),
    status: 'inProgress',
  });
  if (!session) {
    const err = new Error('Active diagnostic session not found.');
    err.status = 404;
    throw err;
  }

  const domain = getDiagnosticDomain({
    subjectId: session.subjectId || 'math',
    domainId: session.domainId,
  });
  const questionId = String(body.questionId || session.currentQuestionId || '');
  const question = await domain.getQuestionById(questionId);
  if (!question || !question.skillId) {
    const err = new Error('Diagnostic question not found.');
    err.status = 404;
    throw err;
  }

  const skill = question.skillId;
  const currentGenericQuestion = domain.toGenericQuestion(question, skill);
  const skillId = currentGenericQuestion.skillId;
  const response = normalizeResponseBody(body, currentGenericQuestion);
  response.questionFamilyId = response.questionFamilyId || currentGenericQuestion.questionFamilyId;
  const correct = domain.scoreAnswer(question, response);
  const detectedErrorTags = domain.detectErrorTags(question, response, correct);

  await maybePersistAttempt({ student, session, question, skillId, response, correct });
  await maybePersistMistake({ student, session, question, skillId, response, correct, detectedErrorTags });

  const { skills } = await domain.loadSkills({ student, mode: session.mode, studentLevel: session.studentLevel });
  const skillGraph = domain.buildSkillGraph(skills);
  const currentSkill = skillGraph.find((s) => s.skillId === skillId);
  const { docs: bankDocs, bank: questionBank, skillByDbId, skillsByFrameworkId } = await domain.getQuestionBank({
    targetSkillIds: session.targetSkillIds || [],
    session,
  });
  const adaptiveState = session.adaptiveState || {};
  const responses = Array.isArray(adaptiveState.responses) ? adaptiveState.responses : [];
  const attemptedQuestionIds = [...new Set([...(adaptiveState.attemptedQuestionIds || []), questionId])];
  const priorWrong = Number(adaptiveState.currentSkillWrongCountBySkill?.[skillId] || 0);
  const currentSkillWrongCountBySkill = {
    ...(adaptiveState.currentSkillWrongCountBySkill || {}),
    [skillId]: correct ? 0 : priorWrong + 1,
  };
  const responseRecord = {
    questionId,
    skillId,
    slug: skill.slug,
    questionFamilyId: response.questionFamilyId,
    correct,
    confidence: response.confidence,
    timeTakenMs: response.timeTakenMs,
    responseMs: response.timeTakenMs,
    skipped: response.skipped,
    blankAnswer: response.blankAnswer,
    workingSubmitted: response.workingSubmitted,
    detectedErrorTags,
    attemptNumber: response.attemptNumber,
    studentAnswer: response.answer,
  };

  const decision = decideNextDiagnosticStep({
    sessionId: session.diagnosticSessionId,
    studentId: String(student._id),
    currentSkill,
    currentQuestion: currentGenericQuestion,
    response: {
      correct,
      confidence: response.confidence,
      timeTakenMs: response.timeTakenMs,
      attempts: response.attemptNumber,
      skipped: response.skipped,
      blankAnswer: response.blankAnswer,
      studentAnswer: response.answer,
      workingSubmitted: response.workingSubmitted,
      detectedErrorTags,
    },
    studentEvidence: {
      attemptedQuestionIds,
      consecutiveWrong: priorWrong,
    },
    skillGraph,
    questionBank,
    sessionState: {
      ...(adaptiveState || {}),
      attemptedQuestionIds,
      currentQuestionId: questionId,
      currentQuestionFamilyId: response.questionFamilyId,
      currentSkillWrongCount: priorWrong,
      repeatedWrongLimit: 3,
    },
  });

  const answeredCount = responses.length + 1;
  const maxQuestions = Number(adaptiveState.maxQuestions || domain.resolveDiagnosticCount?.(session.mode, session.result?.diagnosticPurpose) || 10);
  const minimumQuestions = resolveMinimumQuestionCount({
    adaptiveState,
    maxQuestions,
    domain,
    mode: session.mode,
    purpose: session.result?.diagnosticPurpose,
  });
  const selectionSessionState = {
    ...(adaptiveState || {}),
    attemptedQuestionIds,
    currentQuestionId: questionId,
    currentQuestionFamilyId: response.questionFamilyId,
  };
  let nextGeneric = selectNextDiagnosticQuestion({
    decision,
    skillGraph,
    questionBank,
    studentEvidence: { attemptedQuestionIds },
    sessionState: selectionSessionState,
  });
  if (decision.shouldStopDiagnostic && answeredCount < minimumQuestions) {
    const fallback = selectFallbackDiagnosticQuestion({
      questionBank,
      attemptedQuestionIds,
      candidateQuestionIds: adaptiveState.candidateQuestionIds || [],
      preferredSkillIds: [
        decision.nextSkillId,
        skillId,
        ...(session.targetSkillIds || []),
      ],
    });
    if (fallback) {
      nextGeneric = fallback;
      decision.adaptiveStopDeferred = true;
      decision.originalShouldStopDiagnostic = true;
      decision.shouldStopDiagnostic = false;
      decision.reason = `${decision.reason || 'Adaptive stop requested.'} Continuing until the diagnostic minimum question count is reached.`;
    }
  }

  let completion = resolveDiagnosticCompletion({
    answeredCount,
    maxQuestions,
    minimumQuestions,
    decision,
    nextQuestionAvailable: Boolean(nextGeneric),
  });
  let sessionComplete = completion.sessionComplete;
  let completionReason = completion.completionReason;
  if (!nextGeneric && !sessionComplete) {
    const fallback = answeredCount < minimumQuestions
      ? selectFallbackDiagnosticQuestion({
        questionBank,
        attemptedQuestionIds,
        candidateQuestionIds: adaptiveState.candidateQuestionIds || [],
        preferredSkillIds: [
          skillId,
          decision.nextSkillId,
          ...(session.targetSkillIds || []),
        ],
      })
      : null;
    if (fallback) {
      nextGeneric = fallback;
      decision.fallbackQuestionSelected = true;
      decision.unavailableNextSkillId = decision.nextSkillId || '';
      decision.nextSkillId = fallback.skillId || decision.nextSkillId || skillId;
      decision.reason = `${decision.reason || 'No direct adaptive next question was available.'} Continuing with another unattempted diagnostic item to meet the target question count.`;
      completion = resolveDiagnosticCompletion({
        answeredCount,
        maxQuestions,
        minimumQuestions,
        decision,
        nextQuestionAvailable: true,
      });
      sessionComplete = completion.sessionComplete;
      completionReason = completion.completionReason;
    } else {
      decision.decisionType = DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE;
      decision.shouldStopDiagnostic = true;
      decision.assignedPracticeSkillIds = [...new Set([...(decision.assignedPracticeSkillIds || []), decision.nextSkillId || skillId].filter(Boolean))];
      decision.reason = 'No valid next diagnostic question was available. Stop testing and assign targeted practice.';
      completion = resolveDiagnosticCompletion({
        answeredCount,
        maxQuestions,
        minimumQuestions,
        decision,
        nextQuestionAvailable: false,
        generationFailed: true,
      });
      sessionComplete = completion.sessionComplete;
      completionReason = completion.completionReason;
    }
  }

  let nextQuestion = null;
  if (!sessionComplete && nextGeneric) {
    const nextGenericId = questionIdOf(nextGeneric);
    const nextDoc = nextGeneric.isRephrase
      ? question
      : bankDocs.find((doc) => questionIdOf(doc) === nextGenericId);
    if (!nextDoc) {
      decision.decisionType = DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE;
      decision.shouldStopDiagnostic = true;
      decision.assignedPracticeSkillIds = [...new Set([...(decision.assignedPracticeSkillIds || []), decision.nextSkillId || skillId].filter(Boolean))];
      decision.reason = 'The selected next diagnostic item could not be resolved. Stop testing and assign targeted practice.';
      completion = resolveDiagnosticCompletion({
        answeredCount,
        maxQuestions,
        minimumQuestions,
        decision,
        nextQuestionAvailable: false,
        generationFailed: true,
      });
      sessionComplete = completion.sessionComplete;
      completionReason = completion.completionReason;
    } else {
      const nextSkillDoc = nextGeneric.isRephrase
        ? skill
        : skillByDbId.get(String(nextDoc.skillId));
      nextQuestion = domain.normaliseQuestion(nextDoc, nextSkillDoc, {
        prompt: nextGeneric.prompt,
        isRephrase: nextGeneric.isRephrase,
      });
    }
  }

  const decisionHistory = [...(adaptiveState.decisionHistory || []), decision];
  const nextResponses = [...responses, responseRecord];
  const readinessScores = nextResponses.map((r) => calculateDiagnosticReadinessScore({
    correct: r.correct,
    confidence: r.confidence,
    timeTakenMs: r.timeTakenMs,
    difficulty: currentSkill?.difficulty || 1,
    attempts: r.attemptNumber || 1,
    skipped: r.skipped,
    blankAnswer: r.blankAnswer,
  }));
  const readinessScore = readinessScores.length
    ? Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length)
    : 0;
  const assignedPracticeSkillIds = [...new Set([
    ...(adaptiveState.assignedPracticeSkillIds || []),
    ...(decision.assignedPracticeSkillIds || []),
  ].filter(Boolean))];

  session.currentDecision = decision;
  session.currentSkillId = nextQuestion?.skillId || decision.nextSkillId || skillId;
  session.currentQuestionId = nextQuestion?.questionId || '';
  session.decisionHistory = decisionHistory;
  session.assignedPracticeSkillIds = assignedPracticeSkillIds;
  session.metadataGaps = [...new Set([...(session.metadataGaps || []), ...(decision.metadataGaps || [])])];
  session.readinessScore = readinessScore;
  session.adaptiveState = {
    ...(adaptiveState || {}),
    attemptedQuestionIds,
    responses: nextResponses,
    decisionHistory,
    assignedPracticeSkillIds,
    currentSkillWrongCountBySkill,
    answeredCount,
    rephraseUsedByQuestion: {
      ...(adaptiveState.rephraseUsedByQuestion || {}),
      ...(decision.shouldRephrase ? { [questionId]: true } : {}),
    },
    maxQuestions,
    minimumQuestions,
    completionReason,
    questionsRemaining: Math.max(0, maxQuestions - answeredCount),
  };
  session.lifecycleLog = buildDiagnosticLifecycleLog({
    sessionId: session.diagnosticSessionId,
    studentId: String(student._id),
    targetQuestions: maxQuestions,
    answeredQuestions: answeredCount,
    completionReason,
  });

  if (sessionComplete) {
    session.status = 'completed';
    session.completedAt = new Date();
    session.completionReason = completionReason;
    await applyDiagnosticCompletionMetadata(session, {
      responses: nextResponses,
      skillsByFrameworkId,
    });
    session.result = domain.buildResult({
      session,
      responses: nextResponses,
      decisionHistory,
      readinessScore,
      assignedPracticeSkillIds,
      skillsByFrameworkId,
    });
    session.result.completionReason = completionReason;
    session.resultPayload = session.result;
  }
  await session.save();
  if (sessionComplete) {
    handleDiagnosticCompletion({ student, session }).catch((err) =>
      logger.warn({ err: err.message }, 'handleDiagnosticCompletion error')
    );
  }
  const lifecycleLog = logDiagnosticLifecycle({
    sessionId: session.diagnosticSessionId,
    studentId: String(student._id),
    targetQuestions: maxQuestions,
    answeredQuestions: answeredCount,
    completionReason,
  });

  const confidence = normalizeConfidence(response.confidence);
  const telemetryEvents = [
    {
      studentId: String(student._id),
      eventType: response.skipped ? 'question_skipped' : 'question_answered',
      subjectId: session.subjectId || '',
      domain: session.domainId,
      skillCode: skillId,
      questionId,
      sessionId: session.diagnosticSessionId,
      timestamp: response.endedAt,
      metadata: {
        answerCorrect: correct,
        confidence,
        timeTakenSeconds: response.timeTakenSeconds,
        workingSubmitted: response.workingSubmitted,
        workingNotNeeded: response.workingNotNeeded,
        helpRequested: response.helpRequested || response.confidence === 'i_need_help',
        skipped: response.skipped,
        blankAnswer: response.blankAnswer,
        decisionType: decision.decisionType,
        completionReason,
        questionsRemaining: lifecycleLog.questionsRemaining,
      },
    },
  ];
  if (confidence) {
    telemetryEvents.push({
      studentId: String(student._id),
      eventType: 'confidence_selected',
      subjectId: session.subjectId || '',
      domain: session.domainId,
      skillCode: skillId,
      questionId,
      sessionId: session.diagnosticSessionId,
      timestamp: response.endedAt,
      metadata: { confidence },
    });
  }
  if (nextQuestion) {
    telemetryEvents.push({
      studentId: String(student._id),
      eventType: 'question_viewed',
      subjectId: session.subjectId || '',
      domain: session.domainId,
      skillCode: nextQuestion.skillId,
      questionId: nextQuestion.questionId,
      sessionId: session.diagnosticSessionId,
      metadata: { questionFamilyId: nextQuestion.questionFamilyId, answerInputType: nextQuestion.answerInputType || '' },
    });
  }
  if (sessionComplete) {
    const sessionLengthSeconds = session.startedAt && session.completedAt
      ? Math.max(0, Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000))
      : null;
    telemetryEvents.push(
      {
        studentId: String(student._id),
        eventType: 'session_completed',
        subjectId: session.subjectId || '',
        domain: session.domainId,
        sessionId: session.diagnosticSessionId,
        metadata: { answeredCount, readinessScore, sessionLengthSeconds, mode: session.mode, completionReason },
      },
      {
        studentId: String(student._id),
        eventType: 'diagnostic_completed',
        subjectId: session.subjectId || '',
        domain: session.domainId,
        sessionId: session.diagnosticSessionId,
        metadata: { answeredCount, readinessScore, sessionLengthSeconds, mode: session.mode, completionReason },
      }
    );
  }
  await recordLearningEvents(telemetryEvents);

  if (completionReason === COMPLETION_REASONS.QUESTION_GENERATION_FAILED) {
    const err = new Error('We could not load the next diagnostic question. Please try again.');
    err.status = 409;
    err.code = 'DIAGNOSTIC_NEXT_QUESTION_FAILED';
    err.payload = {
      sessionId: session.diagnosticSessionId,
      sessionComplete: false,
      completionReason,
      progress: {
        answeredCount,
        estimatedQuestionCount: maxQuestions,
        questionsRemaining: lifecycleLog.questionsRemaining,
        readinessScore,
        completionReason,
      },
    };
    throw err;
  }

  return {
    isCorrect: correct,
    decision,
    nextQuestion,
    progress: {
      answeredCount,
      estimatedQuestionCount: maxQuestions,
      questionsRemaining: lifecycleLog.questionsRemaining,
      readinessScore,
      completionReason,
    },
    sessionComplete,
    completionReason,
    assignedPracticeSkillIds,
    supportiveCopy: domain.getSupportiveCopy(decision.decisionType),
    result: sessionComplete ? session.result : null,
  };
}

async function handleDiagnosticCompletion({ student, session }) {
  const studentId = String(student._id);
  const diagnosticSessionId = session.diagnosticSessionId;
  const result = session.result || {};

  // 0. Apply recheck mastery evidence and fire recheck_completed telemetry
  try {
    const recheckResult = await applyRecheckMasteryEvidence({ session });
    if (session.diagnosticPurpose === 'recheck') {
      await recordLearningEvents([{
        studentId,
        eventType: 'recheck_completed',
        subjectId: session.subjectId || 'math',
        domain: session.domainId || '',
        sessionId: session.diagnosticSessionId,
        metadata: {
          skillsPromoted: recheckResult.skillIds || [],
          promoted: recheckResult.applied || false,
          readinessScore: result.readinessScore || 0,
        },
      }]).catch((err) => logger.warn({ err: err.message }, 'recheck_completed telemetry skipped'));
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'post-diagnostic recheck mastery evidence skipped');
  }

  // 1. Auto-assign recovery pack from weak skills
  try {
    const weakSkills = result.weakSkillIds || result.weakSkills || [];
    if (weakSkills.length) {
      await createAssignmentFromDiagnostic({
        studentId,
        diagnosticSessionId,
        assignedByUserId: studentId,
        assignedByRole: 'system',
      });
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'post-diagnostic auto-assignment skipped');
  }

  // 2. Seed mastery records from per-skill diagnostic evidence
  try {
    const snapshots = session.perSkillSnapshots || result.perSkillSnapshots || [];
    if (snapshots.length) {
      const studentDoc = await Student.findById(studentId).select('workspaceId');
      const workspaceId = studentDoc?.workspaceId;
      if (workspaceId) {
        for (const snap of snapshots) {
          const frameworkId = snap.skillId || snap.frameworkSkillId || '';
          if (!frameworkId) continue;
          const dbSkill = await Skill.findOne({
            $or: [
              { 'metadata.mathPathSkillId': frameworkId },
              { 'metadata.frameworkCode': frameworkId },
            ],
          }).select('_id');
          if (!dbSkill) continue;
          const existing = await MasteryRecord.findOne({ studentId, skillId: dbSkill._id });
          if (existing) continue;
          const score = snap.readinessScore ?? snap.score ?? 0;
          const status = score >= 80 ? 'mastered' : score >= 50 ? 'learning' : score > 0 ? 'needs_review' : 'not_started';
          await MasteryRecord.create({
            studentId,
            skillId: dbSkill._id,
            workspaceId,
            module: 'MathPath',
            subject: 'Math',
            score,
            status,
            attempts: snap.attempts ?? 1,
            lastPracticedAt: session.completedAt,
          });
        }
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'post-diagnostic mastery seeding skipped');
  }

  // 3. Notify linked parents/tutors
  try {
    const band = result.readinessBand || result.overallReadinessBand || '';
    const guardians = await StudentGuardian.find({ studentId }).select('guardianUserId');
    for (const g of guardians) {
      await notify({
        recipientUserId: g.guardianUserId,
        type: 'diagnostic_completed',
        title: `${student.name || 'Your child'} completed a diagnostic`,
        body: band
          ? `Readiness band: ${band}. Check their dashboard for details and next steps.`
          : 'Check their dashboard for results and recommended practice.',
        linkPath: `/parent/mathpath/dashboard`,
        sourceType: 'diagnostic',
        sourceId: diagnosticSessionId,
      });
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'post-diagnostic notification skipped');
  }
}

export default {
  startAdaptiveDiagnostic,
  answerAdaptiveDiagnostic,
};
