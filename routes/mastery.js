import express from 'express';
import { protect } from '../middleware/auth.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Mistake from '../models/Mistake.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathAssessmentSession from '../models/mathpath/MathPathAssessmentSession.js';
import MathPathWorkingSession from '../models/mathpath/MathPathWorkingSession.js';
import MathPathWorkingIntelligence from '../models/mathpath/MathPathWorkingIntelligence.js';
import LearningTelemetryEvent from '../models/LearningTelemetryEvent.js';
import StudentLearningEvent from '../models/studentProfile/StudentLearningEvent.js';
import StudentXP from '../models/studentProfile/StudentXP.js';
import StudentAchievement from '../models/studentProfile/StudentAchievement.js';
import FluencyRecord from '../models/FluencyRecord.js';
import RetentionReview from '../models/RetentionReview.js';
import { resolveStudent } from '../utils/studentContext.js';
import { weakSkills, recommendNextSkill, deriveMastery, MASTERY_LABEL, fluencyLabel, isStale } from '../utils/masteryEngine.js';
import { buildSkillGraphView } from '../utils/skillGraphView.js';
import { runPlacement } from '../utils/placementEngine.js';
import { normalizeDiagnosticModeForLevel, resolveFractionsStartingSkill } from '../utils/fractionPlacementResolver.js';
import { studentMathAnalytics, studentMathPathTimingAnalytics } from '../utils/analytics.js';
import { buildRemediationPlan } from '../utils/remediationEngine.js';
import { isCorrectWithContext } from '../utils/answerCheck.js';
import {
  answerAdaptiveDiagnostic,
  startAdaptiveDiagnostic,
} from '../services/diagnostics/diagnosticRuntime.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getDiagnosticGrowth,
  getDiagnosticHistory,
} from '../services/diagnostics/diagnosticGrowthService.js';
import { classifyFractionMistake } from '../shared/mathpath/fractions/fractionMistakeToMasteryEngine.js';
import { calculateQuestionTiming } from '../shared/mathpath/fractions/fractionFluencyRetentionEngine.js';
import {
  getFractionsModelTrainerForSkill,
  getFractionsModelTrainerTemplate,
  listFractionsModelTrainerTemplates,
} from '../services/mathpath/fractionsModelTrainer.js';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from '../shared/mathpath/fractions/fractionPracticeFlow.js';
import { fractionSkillGraph } from '../shared/mathpath/fractions/fractionSkillGraph.js';
import {
  approvePracticeSet,
  extractQuestionPattern,
  generateVariantsFromPattern,
  getPracticeSet,
  listApprovedPracticeSets,
  startSimilarQuestionPractice,
  submitSimilarQuestionPractice,
} from '../services/mathpath/questionPatternTrainer.js';
import { normalizeConfidence, recordLearningEvents } from '../services/telemetry/learningTelemetryService.js';
import { createLinkId } from '../services/mathpath/workingLinkageService.js';
import {
  getAssignmentById,
  updateAssignmentProgress,
} from '../services/mathpath/mathPathAssignmentService.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';

// Word-problem F-codes that map to PSL heuristics. Procedural skills (F001–F022) have no PSL content.
const FCODE_TO_HEURISTIC = {
  F023: 'bar-model',
  F024: 'bar-model',
  F025: 'bar-model',
  F026: 'bar-model',
};

const router = express.Router();

const STATUS_LABEL = { not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning', mastered: 'fluent' };

function canTrainQuestionPatterns(user = {}) {
  const roles = new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
  return roles.has('admin') || roles.has('teacher') || roles.has('tutor');
}

function answerInputTypeFor(answer = '') {
  const raw = String(answer || '').trim();
  if (raw.includes(',') && /\d+\s*\/\s*\d+/.test(raw)) return 'ordering';
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(raw)) return 'mixed';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(raw)) return 'fraction';
  if (/^-?\d+\.\d+$/.test(raw)) return 'decimal';
  if (/^-?\d+$/.test(raw)) return 'whole_number';
  return '';
}

function toDateLike(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeTimeSpentSeconds(value, questionStartedAt, questionEndedAt) {
  const raw = Number(value);
  if (Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  const start = toDateLike(questionStartedAt);
  const end = toDateLike(questionEndedAt) || new Date();
  if (!start) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function buildPracticeLifecycleLog({
  sessionId = '',
  studentId = '',
  questionId = '',
  attemptSaved = false,
  mistakeCreated = false,
  progressUpdated = false,
  answeredQuestions = 0,
  targetQuestions = 0,
  completionReason = 'in_progress',
} = {}) {
  return {
    sessionId: String(sessionId || ''),
    studentId: String(studentId || ''),
    questionId: String(questionId || ''),
    attemptSaved: Boolean(attemptSaved),
    mistakeCreated: Boolean(mistakeCreated),
    progressUpdated: Boolean(progressUpdated),
    answeredQuestions: Math.max(0, Number(answeredQuestions) || 0),
    targetQuestions: Math.max(0, Number(targetQuestions) || 0),
    completionReason,
  };
}

function logPracticeLifecycle(payload = {}) {
  const entry = buildPracticeLifecycleLog(payload);
  console.info('[practice:lifecycle]', entry);
  return entry;
}

async function resolveSkillObjectIdForCode(skillCode) {
  if (!skillCode) return null;
  const skill = await Skill.findOne({
    $or: [
      { 'metadata.mathPathSkillId': skillCode },
      { 'metadata.frameworkCode': skillCode },
      { slug: skillCode },
      { name: skillCode },
    ],
  }).select('_id');
  return skill?._id || null;
}

export function practiceAttemptDoc({ studentId, result, sessionId, sessionType, question = {}, assignmentId = '' } = {}) {
  const timing = calculateQuestionTiming({
    ...result,
    timeTaken: result.timeTaken,
    timeSpentSeconds: result.timeTaken,
    answerSubmittedAt: result.answeredAt || result.timestamp,
  });
  const workingSubmitted = Boolean(result.workingSubmitted || result.workingUploaded || result.fullscreenWorkingSubmitted);
  return {
    attemptId: result.attemptId || createLinkId('attempt'),
    studentId,
    domainId: 'fractions',
    skillId: result.skillId || question.skillId || '',
    questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
    questionId: result.questionId,
    sessionId,
    assignmentId: String(assignmentId || ''),
    sessionType,
    answer: String(result.answer ?? result.studentAnswer ?? ''),
    answerCorrect: Boolean(result.answerCorrect ?? result.correct),
    studentAnswer: String(result.studentAnswer ?? result.answer ?? ''),
    correctAnswer: String(result.correctAnswer ?? question.answer?.display ?? ''),
    correct: Boolean(result.correct),
    timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
    timeSpentSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
    rawTimeSeconds: timing.rawTimeSeconds,
    effectiveAnswerTimeSeconds: timing.effectiveAnswerTimeSeconds,
    totalQuestionTimeSeconds: timing.totalQuestionTimeSeconds,
    reviewTimeSeconds: timing.reviewTimeSeconds,
    skillTimingSnapshot: timing,
    confidence: String(result.confidence || result.confidenceLevel || result.reflection || ''),
    confidenceLevel: String(result.confidenceLevel || result.confidence || result.reflection || ''),
    reflection: String(result.reflection || result.confidence || ''),
    helpRequested: Boolean(result.helpRequested),
    confidenceCalibration: String(result.confidenceCalibration || ''),
    possibleMisconception: Boolean(result.possibleMisconception),
    skipped: Boolean(result.skipped),
    timedOut: Boolean(result.timedOut),
    questionStartedAt: toDateLike(result.questionStartedAt),
    questionEndedAt: toDateLike(result.questionEndedAt) || toDateLike(result.answeredAt) || new Date(),
    timestamp: toDateLike(result.timestamp) || toDateLike(result.answeredAt) || new Date(),
    attemptNumber: Number(result.attemptNumber || 1),
    workingExpected: true,
    workingUploaded: Boolean(result.workingUploaded || workingSubmitted),
    workingOnPaper: Boolean(result.workingOnPaper),
    workingSubmitted,
    workingSubmittedAt: toDateLike(result.workingSubmittedAt),
    workingImage: String(result.workingImage || ''),
    workingStrokes: Array.isArray(result.workingStrokes) ? result.workingStrokes : [],
    workingMathObjects: Array.isArray(result.workingMathObjects) ? result.workingMathObjects : [],
    workingNotNeeded: Boolean(result.workingNotNeeded),
    workingRequirementLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(String(result.workingRequirementLevel || '').toUpperCase())
      ? String(result.workingRequirementLevel).toUpperCase()
      : '',
    fullscreenWorkingImage: String(result.fullscreenWorkingImage || ''),
    fullscreenWorkingStrokes: Array.isArray(result.fullscreenWorkingStrokes) ? result.fullscreenWorkingStrokes : [],
    fullscreenWorkingMathObjects: Array.isArray(result.fullscreenWorkingMathObjects) ? result.fullscreenWorkingMathObjects : [],
    fullscreenWorkingSubmitted: Boolean(result.fullscreenWorkingSubmitted),
    fullscreenWorkingSubmittedAt: toDateLike(result.fullscreenWorkingSubmittedAt),
    workingEvidence: Array.isArray(result.workingEvidence) ? result.workingEvidence : [],
    workingCode: String(result.workingCode || ''),
    workingSessionId: String(result.workingSessionId || ''),
    workingId: String(result.workingId || ''),
  };
}

export function buildPracticeMistakeSnapshot({
  student,
  result = {},
  question = {},
  attempt = {},
  sessionId = '',
  skillObjectId = null,
  mistakeTag = 'practice_error',
} = {}) {
  const questionText = String(question.prompt || question.stem || result.questionText || '').trim();
  const studentAnswer = String(result.studentAnswer ?? result.answer ?? '').trim();
  const correctAnswer = String(result.correctAnswer ?? question.answer?.display ?? '').trim();
  return {
    studentId: student?._id,
    workspaceId: student?.workspaceId,
    questionId: result.questionId,
    sessionId,
    attemptId: attempt?.attemptId || result.attemptId || '',
    skillId: skillObjectId || null,
    skillCode: result.skillId || question.skillId || '',
    module: 'MathPath',
    questionText,
    questionStem: questionText,
    workedSolution: Array.isArray(question.solutionSteps) ? question.solutionSteps.join('\n') : '',
    studentAnswer,
    correctAnswer,
    answerCorrect: Boolean(result.answerCorrect ?? result.correct),
    confidence: String(result.confidence || result.confidenceLevel || result.reflection || ''),
    workingSubmitted: Boolean(result.workingSubmitted),
    workingOnPaper: Boolean(result.workingOnPaper),
    workingNotNeeded: Boolean(result.workingNotNeeded),
    workingSessionId: String(result.workingSessionId || ''),
    workingId: String(result.workingId || result.workingSessionId || ''),
    workingImage: String(result.workingImage || result.fullscreenWorkingImage || ''),
    workingPreviewImage: String(result.workingImage || result.fullscreenWorkingImage || ''),
    workingStrokes: Array.isArray(result.workingStrokes) ? result.workingStrokes : [],
    timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
    mistakeType: 'unknown',
    misconceptionTag: mistakeTag,
    status: 'open',
    source: 'practice-incorrect',
    occurredAt: new Date(),
    timestamp: new Date(),
    createdAt: new Date(),
  };
}

export function shouldCreatePracticeMistake(result = {}) {
  return Boolean(result && !result.correct && !result.error);
}

function normalizeSkillGraphStatus(status = '') {
  const value = String(status || '').toLowerCase();
  // Mastery requires retention/recheck evidence. Practice competence (accurate/fluent) is
  // surfaced as "in progress" until a passing recheck/retention promotes the skill to retained.
  if (['mastered', 'retained'].includes(value)) return 'mastered';
  if (['accurate', 'fluent', 'learning', 'in_progress'].includes(value)) return 'learning';
  if (['needsreview', 'needs_review', 'weak', 'forgotten'].includes(value)) return 'needs_review';
  return 'not_started';
}

function buildFractionsGraphTopicsFromAuthoredMap() {
  const topicsByName = new Map();
  for (const skill of fractionSkillGraph.skills || []) {
    const topicName = skill.strand || 'Fractions';
    if (!topicsByName.has(topicName)) {
      topicsByName.set(topicName, {
        topicId: `fractions-${topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: topicName,
        moeLevel: 'P4 Fractions',
        skills: [],
      });
    }
    topicsByName.get(topicName).skills.push({
      _id: skill.id,
      skillId: skill.id,
      name: skill.name,
      moeLevel: Array.isArray(skill.singaporeLevel) ? skill.singaporeLevel.join(', ') : 'P4',
      prerequisiteSkillIds: skill.prerequisites || [],
    });
  }
  return [...topicsByName.values()];
}

export function buildFractionsPersistedSkillGraphView(skillStates = []) {
  const recordsBySkill = new Map();
  for (const row of skillStates || []) {
    recordsBySkill.set(String(row.skillId), {
      status: normalizeSkillGraphStatus(row.status),
      score: row.accuracy || 0,
      attempts: row.attemptCount || 0,
      lastPracticedAt: row.lastPractisedAt || null,
      fluencyStatus: row.fluencyLevel || 'unknown',
      streak: 0,
    });
  }
  const masteredIds = new Set(
    (skillStates || [])
      .filter((row) => normalizeSkillGraphStatus(row.status) === 'mastered')
      .map((row) => String(row.skillId))
  );
  return buildSkillGraphView({
    topics: buildFractionsGraphTopicsFromAuthoredMap(),
    recordsBySkill,
    masteredIds,
  });
}

// Build the MathPathPracticeSession fields for a client-generated ("offline
// recovery") session that is being persisted for the first time at submit time.
// Returns null when the self-contained payload is missing required data
// (questions + a target skill), in which case the submit should stay a 404.
export function buildOfflineRecoveryPracticeSessionFields({ practiceSessionId, studentId, body = {} } = {}) {
  const ingestQuestions = Array.isArray(body?.questions) ? body.questions : [];
  const ingestSkillId = String(body?.targetSkillId || ingestQuestions[0]?.skillId || '').trim();
  if (!ingestQuestions.length || !ingestSkillId) return null;
  return {
    practiceSessionId,
    studentId,
    domainId: 'fractions',
    targetSkillId: ingestSkillId,
    targetQuestionFamilyIds: Array.isArray(body?.targetQuestionFamilyIds) ? body.targetQuestionFamilyIds : [],
    sessionGoal: 'offline_recovery',
    estimatedQuestionCount: ingestQuestions.length,
    questions: ingestQuestions,
    assignmentId: String(body?.assignmentId || '').trim(),
    status: 'inProgress',
  };
}

export function buildResetStudentStateDeletionPlan({ studentId, studentObjectId, mathPathSessionIds = [] } = {}) {
  return [
    { key: 'diagnostics', model: MathPathDiagnosticSession, query: { studentId, domainId: 'fractions' } },
    { key: 'attempts', model: MathPathAttempt, query: { studentId, domainId: 'fractions' } },
    { key: 'mistakes', model: Mistake, query: { studentId: studentObjectId, module: 'MathPath' } },
    { key: 'mistakeRecords', model: MathPathMistakeRecord, query: { studentId, domainId: 'fractions' } },
    { key: 'skillStates', model: MathPathStudentSkillState, query: { studentId, domainId: 'fractions' } },
    { key: 'sessions', model: PracticeSession, query: { studentId: studentObjectId, module: 'MathPath' } },
    { key: 'practiceAttempts', model: PracticeAttempt, query: { studentId: studentObjectId, sessionId: { $in: mathPathSessionIds } } },
    { key: 'masteryRecords', model: MasteryRecord, query: { studentId: studentObjectId, module: 'MathPath' } },
    { key: 'mathPathPracticeSessions', model: MathPathPracticeSession, query: { studentId, domainId: 'fractions' } },
    { key: 'assessmentSessions', model: MathPathAssessmentSession, query: { studentId, domainId: 'fractions' } },
    { key: 'workingSessions', model: MathPathWorkingSession, query: { studentId, domainId: 'fractions' } },
    { key: 'workingIntelligence', model: MathPathWorkingIntelligence, query: { studentId } },
    { key: 'telemetryEvents', model: LearningTelemetryEvent, query: { studentId } },
    { key: 'learningEvents', model: StudentLearningEvent, query: { studentId: studentObjectId } },
    { key: 'xpRecords', model: StudentXP, query: { studentId: studentObjectId } },
    { key: 'achievements', model: StudentAchievement, query: { studentId: studentObjectId } },
    { key: 'fluencyRecords', model: FluencyRecord, query: { studentId: studentObjectId } },
    { key: 'retentionReviews', model: RetentionReview, query: { studentId: studentObjectId } },
  ];
}

router.get('/fractions/model-trainer', protect, asyncHandler(async (req, res) => {
  try {
    res.json({
      templates: listFractionsModelTrainerTemplates({ skillId: req.query.skillId }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
}));

router.get('/fractions/model-trainer/skill/:skillId', protect, asyncHandler(async (req, res) => {
  try {
    res.json({
      skillId: String(req.params.skillId || '').toUpperCase(),
      templates: getFractionsModelTrainerForSkill(req.params.skillId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
}));

router.get('/fractions/model-trainer/:templateId', protect, asyncHandler(async (req, res) => {
  try {
    const template = getFractionsModelTrainerTemplate(req.params.templateId);
    if (!template) return res.status(404).json({ error: 'Model trainer template not found.' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer template.' });
  }
}));

router.post('/fractions/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const assignmentId = String(req.body?.assignmentId || '');
    let assignment = null;
    if (assignmentId) {
      assignment = await getAssignmentById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'MathPath assignment not found.' });
      await resolveStudent(req, assignment.studentId);
      if (String(assignment.studentId) !== studentId) return res.status(403).json({ error: 'Assignment does not belong to this student.' });
    }
    const started = startFractionPracticeFlow({
      studentId,
      domainId: 'fractions',
      sessionType: req.body?.sessionType || 'practice',
      requestedSkillId: req.body?.skillId || req.body?.requestedSkillId || assignment?.skillIds?.[0] || null,
      requestedQuestionFamilyId: req.body?.questionFamilyId || null,
      sessionLength: req.body?.questionCount || req.body?.sessionLength || assignment?.targetQuestionCount || 6,
      weakSkillIds: Array.isArray(req.body?.weakSkillIds) ? req.body.weakSkillIds : (assignment?.skillIds || []),
      recentMistakeTypes: Array.isArray(req.body?.recentMistakeTypes) ? req.body.recentMistakeTypes : [],
    });
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: started.practiceSessionId,
      studentId,
      targetQuestions: started.questions?.length || 0,
      completionReason: 'in_progress',
    });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId: started.practiceSessionId },
      {
        $setOnInsert: {
          practiceSessionId: started.practiceSessionId,
          studentId,
          domainId: 'fractions',
          targetSkillId: started.targetSkillId || '',
          targetQuestionFamilyIds: started.targetQuestionFamilyIds || [],
          workingSessionId: started.workingSessionId || '',
          assignmentId,
          sessionGoal: started.sessionLabel || 'Practice',
          estimatedQuestionCount: started.questions?.length || 0,
          workingExpected: Boolean(started.workingExpected),
          questions: started.questions || [],
          responses: [],
          status: 'inProgress',
          startedAt: new Date(),
        },
        $set: { lifecycleLog, ...(assignmentId ? { assignmentId } : {}) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      {
        studentId,
        eventType: 'session_started',
        domain: 'fractions',
        sessionId: started.practiceSessionId,
        metadata: { source: 'mathpath_practice', sessionType: started.sessionType, targetSkillId: started.targetSkillId },
      },
      {
        studentId,
        eventType: 'practice_started',
        domain: 'fractions',
        sessionId: started.practiceSessionId,
        metadata: { source: 'mathpath_practice', sessionType: started.sessionType, targetSkillId: started.targetSkillId },
      },
    ]);
    res.json({ ...started, studentId, assignmentId, persisted: true, lifecycleLog });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start practice.' });
  }
}));

router.get('/fractions/practice/:practiceSessionId', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    }).lean();
    if (!session) return res.status(404).json({ error: 'Practice session not found.' });
    res.json({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      domainId: session.domainId,
      targetSkillId: session.targetSkillId,
      targetQuestionFamilyIds: session.targetQuestionFamilyIds || [],
      workingSessionId: session.workingSessionId || '',
      assignmentId: session.assignmentId || '',
      sessionType: session.summary?.sessionType || 'practice',
      questions: session.questions || [],
      responses: session.responses || [],
      status: session.status,
      summary: session.summary || {},
      lifecycleLog: session.lifecycleLog || {},
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load practice session.' });
  }
}));

router.post('/fractions/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    let existing = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
      domainId: 'fractions',
    });
    if (!existing) {
      // Backend-down fallback recovery: when the start API was unreachable the
      // session is generated client-side, so no record exists. If the submit
      // carries the self-contained payload (the client-generated questions),
      // recreate the session here so attempts and skill-state are persisted now
      // that the backend is reachable again. Without a payload this stays a 404.
      const recoveryFields = buildOfflineRecoveryPracticeSessionFields({
        practiceSessionId: req.params.practiceSessionId,
        studentId,
        body: req.body,
      });
      if (!recoveryFields) {
        return res.status(404).json({ error: 'Practice session not found.' });
      }
      existing = new MathPathPracticeSession({ ...recoveryFields, startedAt: new Date() });
      await existing.save();
    }
    if (existing.status === 'completed' && existing.summary?.results?.length) {
      return res.json({ ...existing.summary, persisted: true, duplicateIgnored: true, lifecycleLog: existing.lifecycleLog || {} });
    }

    const submitted = submitFractionPracticeAttempt({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
      sessionType: req.body?.sessionType || existing.summary?.sessionType || 'practice',
      responses: Array.isArray(req.body?.responses) ? req.body.responses : [],
    });
    const results = submitted.results || [];
    const questionsById = new Map((existing.questions || []).map((question) => [String(question.questionId), question]));
    const attemptDocs = results
      .filter((result) => result.questionId && !result.error)
      .map((result) => practiceAttemptDoc({
        studentId,
        result,
        sessionId: req.params.practiceSessionId,
        sessionType: submitted.sessionType || 'practice',
        question: questionsById.get(String(result.questionId)) || {},
        assignmentId: existing.assignmentId || '',
      }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(
        attemptDocs.map((doc) => ({
          updateOne: {
            filter: { attemptId: doc.attemptId },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }

    const wrongResults = results.filter(shouldCreatePracticeMistake);
    const skillObjectIds = new Map();
    await Promise.all([...new Set(wrongResults.map((result) => result.skillId).filter(Boolean))]
      .map(async (skillCode) => {
        skillObjectIds.set(skillCode, await resolveSkillObjectIdForCode(skillCode));
      }));
    const createdMistakes = [];
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId,
          domainId: 'fractions',
          mistakeCode: mistakeTag,
          skillId: result.skillId || question.skillId || '',
          questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistakeTag,
            severity: result.confidence === 'i_know_this' ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: 'practice-incorrect',
              questionId: result.questionId,
              sessionId: req.params.practiceSessionId,
              attemptId: attempt?.attemptId || result.attemptId || '',
              prompt: question.prompt || question.stem || '',
              studentAnswer: result.studentAnswer || result.answer || '',
              correctAnswer: result.correctAnswer || question.answer?.display || '',
              answerCorrect: false,
              confidence: result.confidence || '',
              workingSubmitted: Boolean(result.workingSubmitted),
              workingOnPaper: Boolean(result.workingOnPaper),
              workingNotNeeded: Boolean(result.workingNotNeeded),
              workingSessionId: String(result.workingSessionId || ''),
              workingImage: String(result.workingImage || result.fullscreenWorkingImage || ''),
              workingStrokes: Array.isArray(result.workingStrokes) ? result.workingStrokes : [],
              timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const sharedMistake = await Mistake.findOneAndUpdate(
        { studentId: student._id, attemptId: attempt?.attemptId || '', module: 'MathPath' },
        {
          $setOnInsert: buildPracticeMistakeSnapshot({
            student,
            result,
            question,
            attempt,
            sessionId: req.params.practiceSessionId,
            skillObjectId: skillObjectIds.get(result.skillId) || null,
            mistakeTag,
          }),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdMistakes.push(sharedMistake);
    }

    const bySkill = results.filter((result) => !result.error).reduce((acc, result) => {
      const skillId = result.skillId || '';
      if (!skillId) return acc;
      if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
      acc[skillId].total += 1;
      if (result.correct) acc[skillId].correct += 1;
      return acc;
    }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      // Practice accuracy establishes competence (accurate), never mastery. Mastery requires a
      // passing recheck/retention, which is the only writer of the retained status + masteredAt.
      const set = {
        status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview',
        accuracy,
        lastPractisedAt: new Date(),
      };
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: 'fractions', skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: req.params.practiceSessionId,
      studentId,
      questionId: results.at(-1)?.questionId || '',
      attemptSaved,
      mistakeCreated: createdMistakes.length > 0,
      progressUpdated,
      answeredQuestions: results.length,
      targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length,
      completionReason: 'target_reached',
    });

    // Find the weakest word-problem F-code skill and suggest PSL if content exists.
    const weakestWordProblem = Object.entries(bySkill)
      .filter(([fcode, s]) => FCODE_TO_HEURISTIC[fcode] && s.total > 0 && s.accuracy < 80)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)[0];
    let pslSuggestion = null;
    if (weakestWordProblem) {
      const heuristic = FCODE_TO_HEURISTIC[weakestWordProblem[0]];
      if (skillHasPSLContent(heuristic)) {
        pslSuggestion = { skillSlug: 'fr.word-problems', heuristic };
      }
    }

    const summary = { ...submitted, persisted: true, lifecycleLog, ...(pslSuggestion && { pslSuggestion }) };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = req.body?.responses || [];
    existing.summary = summary;
    existing.lifecycleLog = lifecycleLog;
    await existing.save();
    let assignmentProgress = null;
    if (existing.assignmentId) {
      assignmentProgress = await updateAssignmentProgress({ assignmentId: existing.assignmentId });
    }
    logPracticeLifecycle(lifecycleLog);

    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({
        studentId,
        eventType: attempt.skipped ? 'question_skipped' : 'question_answered',
        domain: 'fractions',
        skillCode: attempt.skillId,
        questionId: attempt.questionId,
        sessionId: req.params.practiceSessionId,
        metadata: {
          answerCorrect: attempt.correct,
          confidence: normalizeConfidence(attempt.confidence),
          timeTakenSeconds: attempt.timeTaken,
          workingSubmitted: attempt.workingSubmitted,
          workingOnPaper: attempt.workingOnPaper,
          workingNotNeeded: attempt.workingNotNeeded,
          skipped: attempt.skipped,
        },
      })),
      {
        studentId,
        eventType: 'session_completed',
        domain: 'fractions',
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_practice', total: results.length, correct: results.filter((r) => r.correct).length },
      },
      {
        studentId,
        eventType: 'practice_completed',
        domain: 'fractions',
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_practice', total: results.length, correct: results.filter((r) => r.correct).length },
      },
    ]);

    res.json({ ...summary, assignmentProgress });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit practice.' });
  }
}));

// =========================================================================
// P1 Practice — persists client-generated P1 sessions using the same
// domain-agnostic MathPath models (MathPathPracticeSession, MathPathAttempt,
// MathPathStudentSkillState). Questions are generated on the frontend;
// the backend just stores sessions, scores, and updates mastery state.
// =========================================================================

const P1_DOMAIN_PREFIXES = ['P1-NUM', 'P1-ADD', 'P1-MON', 'P1-MEA', 'P1-GEO', 'P1-EQG', 'P1-DAT'];
function isP1DomainId(domainId) {
  return String(domainId || '').startsWith('p1-');
}

function isP3DomainId(domainId) {
  return String(domainId || '').startsWith('p3-');
}
function isP1SkillId(skillId) {
  return P1_DOMAIN_PREFIXES.some((p) => String(skillId || '').startsWith(p));
}
function resolveP1DomainId(skillId) {
  const sid = String(skillId || '');
  if (sid.startsWith('P1-NUM')) return 'p1-numbers';
  if (sid.startsWith('P1-ADD')) return 'p1-addsub';
  if (sid.startsWith('P1-MON')) return 'p1-money';
  if (sid.startsWith('P1-MEA')) return 'p1-measurement';
  if (sid.startsWith('P1-GEO')) return 'p1-geometry';
  if (sid.startsWith('P1-EQG')) return 'p1-equalgroups';
  if (sid.startsWith('P1-DAT')) return 'p1-data';
  return 'p1-numbers';
}

function p1PracticeAttemptDoc({ studentId, result, sessionId, sessionType, domainId, question = {} } = {}) {
  return {
    attemptId: result.attemptId || `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    studentId,
    domainId,
    skillId: result.skillId || question.skillId || '',
    questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
    questionId: result.questionId,
    sessionId,
    assignmentId: '',
    sessionType,
    answer: String(result.answer ?? result.studentAnswer ?? ''),
    answerCorrect: Boolean(result.answerCorrect ?? result.correct),
    studentAnswer: String(result.studentAnswer ?? result.answer ?? ''),
    correctAnswer: String(result.correctAnswer ?? ''),
    correct: Boolean(result.correct ?? result.answerCorrect),
    timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
    timeSpentSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
    confidence: String(result.confidence || result.confidenceLevel || result.reflection || ''),
    confidenceLevel: String(result.confidenceLevel || result.confidence || result.reflection || ''),
    reflection: String(result.reflection || result.confidence || ''),
    helpRequested: Boolean(result.helpRequested),
    confidenceCalibration: String(result.confidenceCalibration || ''),
    possibleMisconception: Boolean(result.possibleMisconception),
    skipped: Boolean(result.skipped),
    timedOut: Boolean(result.timedOut),
    questionStartedAt: toDateLike(result.questionStartedAt),
    questionEndedAt: toDateLike(result.questionEndedAt) || toDateLike(result.answeredAt) || new Date(),
    timestamp: toDateLike(result.timestamp) || toDateLike(result.answeredAt) || new Date(),
    attemptNumber: Number(result.attemptNumber || 1),
    workingExpected: false,
    workingUploaded: false,
    workingOnPaper: false,
    workingSubmitted: false,
    workingNotNeeded: true,
  };
}

router.post('/p1/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const {
      practiceSessionId,
      domainId,
      targetSkillId,
      sessionType = 'practice',
      sessionLabel = 'Practice',
      questions = [],
    } = req.body || {};

    if (!practiceSessionId || !targetSkillId) {
      return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    }
    const resolvedDomainId = domainId || resolveP1DomainId(targetSkillId);

    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: practiceSessionId,
      studentId,
      targetQuestions: questions.length || 0,
      completionReason: 'in_progress',
    });

    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      {
        $setOnInsert: {
          practiceSessionId,
          studentId,
          domainId: resolvedDomainId,
          targetSkillId,
          targetQuestionFamilyIds: [],
          workingSessionId: '',
          assignmentId: '',
          sessionGoal: sessionLabel,
          estimatedQuestionCount: questions.length,
          workingExpected: false,
          questions,
          responses: [],
          status: 'inProgress',
          startedAt: new Date(),
        },
        $set: { lifecycleLog },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);

    await recordLearningEvents([
      {
        studentId,
        eventType: 'session_started',
        domain: resolvedDomainId,
        sessionId: practiceSessionId,
        metadata: { source: 'mathpath_p1_practice', sessionType, targetSkillId },
      },
      {
        studentId,
        eventType: 'practice_started',
        domain: resolvedDomainId,
        sessionId: practiceSessionId,
        metadata: { source: 'mathpath_p1_practice', sessionType, targetSkillId },
      },
    ]);

    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start P1 practice.' });
  }
}));

router.get('/p1/practice/:practiceSessionId', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId: String(student._id),
    }).lean();
    if (!session) return res.status(404).json({ error: 'P1 practice session not found.' });
    if (!isP1DomainId(session.domainId)) return res.status(404).json({ error: 'Session is not a P1 session.' });
    res.json({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      domainId: session.domainId,
      targetSkillId: session.targetSkillId,
      sessionType: session.summary?.sessionType || 'practice',
      questions: session.questions || [],
      responses: session.responses || [],
      status: session.status,
      summary: session.summary || {},
      lifecycleLog: session.lifecycleLog || {},
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load P1 practice session.' });
  }
}));

router.post('/p1/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
    });
    if (!existing) return res.status(404).json({ error: 'P1 practice session not found.' });
    if (!isP1DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P1 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map(
      (existing.questions || []).map((q) => [String(q.questionId), q])
    );

    // Build attempt documents
    const attemptDocs = results
      .filter((r) => r.questionId)
      .map((r) => p1PracticeAttemptDoc({
        studentId,
        result: r,
        sessionId: req.params.practiceSessionId,
        sessionType,
        domainId,
        question: questionsById.get(String(r.questionId)) || {},
      }));

    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(
        attemptDocs.map((doc) => ({
          updateOne: {
            filter: { attemptId: doc.attemptId },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }

    // Create mistake records for wrong answers
    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId,
          domainId,
          mistakeCode: mistakeTag,
          skillId: result.skillId || question.skillId || '',
          questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistakeTag,
            severity: result.confidence === 'i_know_this' ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: 'practice-incorrect',
              questionId: result.questionId,
              sessionId: req.params.practiceSessionId,
              attemptId: attempt?.attemptId || result.attemptId || '',
              prompt: question.prompt || question.stem || '',
              studentAnswer: result.studentAnswer || result.answer || '',
              correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''),
              answerCorrect: false,
              confidence: result.confidence || '',
              timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Update per-skill mastery state
    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => {
      const skillId = r.skillId || '';
      if (!skillId) return acc;
      if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
      acc[skillId].total += 1;
      if (r.correct) acc[skillId].correct += 1;
      return acc;
    }, {});

    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = {
        status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview',
        accuracy,
        lastPractisedAt: new Date(),
      };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId, skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }));

    const progressUpdated = Object.keys(bySkill).length > 0;
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: req.params.practiceSessionId,
      studentId,
      questionId: results.at(-1)?.questionId || '',
      attemptSaved,
      mistakeCreated: wrongResults.length > 0,
      progressUpdated,
      answeredQuestions: results.length,
      targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length,
      completionReason: 'target_reached',
    });

    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

    const summary = {
      practiceSessionId: req.params.practiceSessionId,
      sessionType,
      results,
      accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy },
      persisted: true,
      lifecycleLog,
    };

    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = req.body?.responses || [];
    existing.summary = summary;
    existing.lifecycleLog = lifecycleLog;
    await existing.save();

    logPracticeLifecycle(lifecycleLog);

    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({
        studentId,
        eventType: attempt.skipped ? 'question_skipped' : 'question_answered',
        domain: domainId,
        skillCode: attempt.skillId,
        questionId: attempt.questionId,
        sessionId: req.params.practiceSessionId,
        metadata: {
          answerCorrect: attempt.correct,
          confidence: normalizeConfidence(attempt.confidence),
          timeTakenSeconds: attempt.timeTaken,
          skipped: attempt.skipped,
        },
      })),
      {
        studentId,
        eventType: 'session_completed',
        domain: domainId,
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_p1_practice', total, correct: correctCount },
      },
      {
        studentId,
        eventType: 'practice_completed',
        domain: domainId,
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_p1_practice', total, correct: correctCount },
      },
    ]);

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit P1 practice.' });
  }
}));

// Get P1 skill states for a student (for mastery badges on skill cards)
router.get('/p1/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const states = await MathPathStudentSkillState.find({
      studentId,
      domainId: { $regex: /^p1-/ },
    }).lean();
    res.json({ skillStates: states });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load P1 skill states.' });
  }
}));

// =========================================================================
// P2 Practice — start route
// =========================================================================
router.post('/p2/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
    if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    const resolvedDomainId = domainId || 'p2-unknown';
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      { $setOnInsert: { practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId, targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '', sessionGoal: sessionLabel, estimatedQuestionCount: questions.length, workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date() }, $set: { lifecycleLog } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p2_practice', sessionType, targetSkillId } },
      { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p2_practice', sessionType, targetSkillId } },
    ]);
    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start P2 practice.' }); }
}));

// =========================================================================
// P3 Practice — start route
// =========================================================================
router.post('/p3/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
    if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    const resolvedDomainId = domainId || 'p3-unknown';
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      { $setOnInsert: { practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId, targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '', sessionGoal: sessionLabel, estimatedQuestionCount: questions.length, workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date() }, $set: { lifecycleLog } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p3_practice', sessionType, targetSkillId } },
      { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p3_practice', sessionType, targetSkillId } },
    ]);
    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start P3 practice.' }); }
}));

// =========================================================================
// P2 Practice — submit route
// =========================================================================
function isP2DomainId(domainId) {
  return String(domainId || '').startsWith('p2-');
}

router.post('/p2/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'P2 practice session not found.' });
    if (!isP2DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P2 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map((existing.questions || []).map((q) => [String(q.questionId), q]));
    const attemptDocs = results.filter((r) => r.questionId).map((r) => p1PracticeAttemptDoc({ studentId, result: r, sessionId: req.params.practiceSessionId, sessionType, domainId, question: questionsById.get(String(r.questionId)) || {} }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(attemptDocs.map((doc) => ({ updateOne: { filter: { attemptId: doc.attemptId }, update: { $setOnInsert: doc }, upsert: true } })), { ordered: false });
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }
    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId, mistakeCode: mistakeTag, skillId: result.skillId || question.skillId || '', questionFamilyId: result.questionFamilyId || question.questionFamilyId || '' },
        { $inc: { frequency: 1 }, $set: { mistakeName: mistakeTag, severity: result.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: { source: 'practice-incorrect', questionId: result.questionId, sessionId: req.params.practiceSessionId, attemptId: attempt?.attemptId || result.attemptId || '', prompt: question.prompt || question.stem || '', studentAnswer: result.studentAnswer || result.answer || '', correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''), answerCorrect: false, confidence: result.confidence || '', timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt), seenAt: new Date() } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => { const skillId = r.skillId || ''; if (!skillId) return acc; if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 }; acc[skillId].total += 1; if (r.correct) acc[skillId].correct += 1; return acc; }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = { status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview', accuracy, lastPractisedAt: new Date() };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate({ studentId, domainId, skillId }, { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: req.params.practiceSessionId, studentId, questionId: results.at(-1)?.questionId || '', attemptSaved, mistakeCreated: wrongResults.length > 0, progressUpdated, answeredQuestions: results.length, targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length, completionReason: 'target_reached' });
    const summary = { practiceSessionId: req.params.practiceSessionId, sessionType, results, accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy }, persisted: true, lifecycleLog };
    existing.status = 'completed'; existing.completedAt = new Date(); existing.responses = req.body?.responses || []; existing.summary = summary; existing.lifecycleLog = lifecycleLog;
    await existing.save();
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({ studentId, eventType: attempt.skipped ? 'question_skipped' : 'question_answered', domain: domainId, skillCode: attempt.skillId, questionId: attempt.questionId, sessionId: req.params.practiceSessionId, metadata: { answerCorrect: attempt.correct, confidence: normalizeConfidence(attempt.confidence), timeTakenSeconds: attempt.timeTaken, skipped: attempt.skipped } })),
      { studentId, eventType: 'session_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p2_practice', total, correct: correctCount } },
      { studentId, eventType: 'practice_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p2_practice', total, correct: correctCount } },
    ]);
    res.json(summary);
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to submit P2 practice.' }); }
}));

// P2 skill states
router.get('/p2/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: { $regex: /^p2-/ } }).lean();
    res.json({ skillStates: states });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load P2 skill states.' }); }
}));

// P3 submit route
router.post('/p3/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
    });
    if (!existing) return res.status(404).json({ error: 'P3 practice session not found.' });
    if (!isP3DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P3 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map(
      (existing.questions || []).map((q) => [String(q.questionId), q])
    );

    const attemptDocs = results
      .filter((r) => r.questionId)
      .map((r) => p1PracticeAttemptDoc({
        studentId,
        result: r,
        sessionId: req.params.practiceSessionId,
        sessionType,
        domainId,
        question: questionsById.get(String(r.questionId)) || {},
      }));

    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(
        attemptDocs.map((doc) => ({
          updateOne: {
            filter: { attemptId: doc.attemptId },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }

    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId,
          domainId,
          mistakeCode: mistakeTag,
          skillId: result.skillId || question.skillId || '',
          questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistakeTag,
            severity: result.confidence === 'i_know_this' ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: 'practice-incorrect',
              questionId: result.questionId,
              sessionId: req.params.practiceSessionId,
              attemptId: attempt?.attemptId || result.attemptId || '',
              prompt: question.prompt || question.stem || '',
              studentAnswer: result.studentAnswer || result.answer || '',
              correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''),
              answerCorrect: false,
              confidence: result.confidence || '',
              timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => {
      const skillId = r.skillId || '';
      if (!skillId) return acc;
      if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
      acc[skillId].total += 1;
      if (r.correct) acc[skillId].correct += 1;
      return acc;
    }, {});

    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = {
        status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview',
        accuracy,
        lastPractisedAt: new Date(),
      };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId, skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }));

    const progressUpdated = Object.keys(bySkill).length > 0;
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: req.params.practiceSessionId,
      studentId,
      questionId: results.at(-1)?.questionId || '',
      attemptSaved,
      mistakeCreated: wrongResults.length > 0,
      progressUpdated,
      answeredQuestions: results.length,
      targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length,
      completionReason: 'target_reached',
    });

    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

    const summary = {
      practiceSessionId: req.params.practiceSessionId,
      sessionType,
      results,
      accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy },
      persisted: true,
      lifecycleLog,
    };

    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = req.body?.responses || [];
    existing.summary = summary;
    existing.lifecycleLog = lifecycleLog;
    await existing.save();

    logPracticeLifecycle(lifecycleLog);

    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({
        studentId,
        eventType: attempt.skipped ? 'question_skipped' : 'question_answered',
        domain: domainId,
        skillCode: attempt.skillId,
        questionId: attempt.questionId,
        sessionId: req.params.practiceSessionId,
        metadata: {
          answerCorrect: attempt.correct,
          confidence: normalizeConfidence(attempt.confidence),
          timeTakenSeconds: attempt.timeTaken,
          skipped: attempt.skipped,
        },
      })),
      {
        studentId,
        eventType: 'session_completed',
        domain: domainId,
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_p3_practice', total, correct: correctCount },
      },
      {
        studentId,
        eventType: 'practice_completed',
        domain: domainId,
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_p3_practice', total, correct: correctCount },
      },
    ]);

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit P3 practice.' });
  }
}));

router.get('/p3/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const states = await MathPathStudentSkillState.find({
      studentId,
      domainId: { $regex: /^p3-/ },
    }).lean();
    res.json({ skillStates: states });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load P3 skill states.' });
  }
}));

router.post('/fractions/question-patterns/analyze', protect, asyncHandler(async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can train question patterns.' });
    const pattern = extractQuestionPattern({
      sourceExamples: req.body?.sourceQuestions || req.body?.sourceExamples || [],
      targetSkillId: req.body?.skillId || req.body?.targetSkillId || '',
      level: req.body?.level || '',
      curriculumTags: [req.body?.curriculum, req.body?.level].filter(Boolean),
      topic: req.body?.topic || '',
      subtopic: req.body?.subtopic || '',
      compatibleSessionTypes: req.body?.compatibleSessionTypes || [],
      worksheetCompatible: req.body?.worksheetCompatible !== false,
      generatedVariantTarget: req.body?.generatedVariantTarget || req.body?.difficultyMix || {},
      variantCount: req.body?.variantCount,
    });
    const generated = generateVariantsFromPattern(pattern);
    res.json({ pattern, preview: generated.variants.slice(0, 12), quality: generated.quality });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to analyze question pattern.' });
  }
}));

router.post('/fractions/question-patterns/generate', protect, asyncHandler(async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can generate question patterns.' });
    const pattern = req.body?.pattern || extractQuestionPattern(req.body || {});
    const generated = generateVariantsFromPattern(pattern, {
      generatedVariantTarget: req.body?.generatedVariantTarget || req.body?.difficultyMix || {},
    });
    res.json(generated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate similar questions.' });
  }
}));

router.post('/fractions/question-patterns/approve', protect, asyncHandler(async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can approve generated practice sets.' });
    const pattern = req.body?.pattern || extractQuestionPattern(req.body || {});
    const generated = req.body?.variants ? { pattern, variants: req.body.variants } : null;
    const practiceSet = await approvePracticeSet({
      patternInput: pattern,
      generated,
      userId: req.user?.id || null,
      title: req.body?.title || '',
      persist: true,
    });
    res.json({ practiceSet });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to approve practice set.' });
  }
}));

router.get('/fractions/similar-practice-sets', protect, asyncHandler(async (req, res) => {
  try {
    const sets = await listApprovedPracticeSets({
      domain: 'fractions',
      skillId: req.query.skillId ? String(req.query.skillId).toUpperCase() : '',
    });
    res.json({ practiceSets: sets });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load practice sets.' });
  }
}));

router.get('/fractions/similar-practice-sets/:practiceSetId', protect, asyncHandler(async (req, res) => {
  try {
    const practiceSet = await getPracticeSet(req.params.practiceSetId, { allowDraft: canTrainQuestionPatterns(req.user) });
    if (!practiceSet) return res.status(404).json({ error: 'Practice set not found.' });
    res.json({ practiceSet });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load practice set.' });
  }
}));

router.post('/fractions/similar-practice-sets/:practiceSetId/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const started = await startSimilarQuestionPractice({
      practiceSetId: req.params.practiceSetId,
      studentId: String(student._id),
      limit: req.body?.limit || 10,
    });
    await recordLearningEvents([
      {
        studentId: String(student._id),
        eventType: 'session_started',
        domain: 'fractions',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      },
      {
        studentId: String(student._id),
        eventType: 'practice_started',
        domain: 'fractions',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      },
      ...((started.questions || started.items || []).map((question) => ({
        studentId: String(student._id),
        eventType: 'question_viewed',
        domain: 'fractions',
        skillCode: question.skillId || '',
        questionId: question.variantId || question.questionId || '',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      }))),
    ]);
    res.json(started);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start similar question practice.' });
  }
}));

router.post('/fractions/similar-practice/:sessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const submitted = await submitSimilarQuestionPractice({
      sessionId: req.params.sessionId,
      studentId: String(student._id),
      responses: req.body?.responses || [],
    });
    const studentId = String(student._id);
    const results = submitted.results || [];
    if (results.length) {
      await MathPathAttempt.insertMany(
        results.map((result) => {
          const timing = calculateQuestionTiming({
            ...result,
            timeTaken: result.timeTaken,
            timeSpentSeconds: result.timeTaken,
            answerSubmittedAt: result.questionEndedAt,
          });
          return ({
          studentId,
          domainId: 'fractions',
          skillId: result.skillId || 'F023',
          questionFamilyId: result.questionFamilyId || `TRAINED_${result.skillId || 'F023'}`,
          questionId: result.variantId,
          sessionId: req.params.sessionId,
          sessionType: 'practice',
          answer: result.studentAnswer || '',
          studentAnswer: result.studentAnswer || '',
          correctAnswer: result.correctAnswer || '',
          correct: Boolean(result.correct),
          timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
          timeSpentSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
          rawTimeSeconds: timing.rawTimeSeconds,
          effectiveAnswerTimeSeconds: timing.effectiveAnswerTimeSeconds,
          totalQuestionTimeSeconds: timing.totalQuestionTimeSeconds,
          reviewTimeSeconds: timing.reviewTimeSeconds,
          skillTimingSnapshot: timing,
          confidenceLevel: result.confidenceLevel || '',
          confidence: result.confidence || '',
          timestamp: toDateLike(result.timestamp) || toDateLike(result.questionEndedAt) || new Date(),
          attemptNumber: Number(result.attemptNumber || 1),
          skipped: Boolean(result.skipped),
          timedOut: Boolean(result.timedOut),
          questionStartedAt: toDateLike(result.questionStartedAt) || null,
          questionEndedAt: toDateLike(result.questionEndedAt) || null,
          workingUploaded: Boolean(result.workingUploaded),
          });
        }),
        { ordered: false }
      );

      const bySkill = results.reduce((acc, result) => {
        const skillId = result.skillId || 'F023';
        if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
        acc[skillId].total += 1;
        if (result.correct) acc[skillId].correct += 1;
        return acc;
      }, {});
      await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
        const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
        // Practice accuracy establishes competence (accurate), never mastery. masteredAt is set
        // only by a passing recheck/retention (see recheckMasteryEvidenceService).
        const skillStateSet = {
          status: accuracy >= 85 ? 'accurate' : accuracy >= 50 ? 'learning' : 'needsReview',
          accuracy,
          lastPractisedAt: new Date(),
        };
        return MathPathStudentSkillState.findOneAndUpdate(
          { studentId, domainId: 'fractions', skillId },
          {
            $inc: { attemptCount: counts.total, correctCount: counts.correct },
            $set: skillStateSet,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }));

      const wrongResults = results.filter((result) => !result.correct);
      await Promise.all(wrongResults.flatMap((result) => {
        const tags = result.misconceptionTags?.length ? result.misconceptionTags : ['M010'];
        return tags.map((tag) => MathPathMistakeRecord.findOneAndUpdate(
          {
            studentId,
            domainId: 'fractions',
            mistakeCode: tag,
            skillId: result.skillId || 'F023',
            questionFamilyId: result.questionFamilyId || '',
          },
          {
            $inc: { frequency: 1 },
            $set: {
              mistakeName: tag,
              severity: submitted.summary?.scorePct < 50 ? 'high' : 'medium',
              remediationSkillIds: result.remediationSkillIds || [],
              lastSeenAt: new Date(),
            },
            $push: {
              evidence: {
                questionId: result.variantId,
                prompt: result.prompt,
                studentAnswer: result.studentAnswer,
                correctAnswer: result.correctAnswer,
                seenAt: new Date(),
              },
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ));
      }));
    }
    if (results.length) {
      const sessionId = req.params.sessionId;
      const correct = results.filter((result) => result.correct).length;
      await recordLearningEvents([
        ...results.map((result) => {
          const confidence = normalizeConfidence(result.confidence || result.confidenceLevel || '');
          return {
            studentId,
            eventType: result.skipped ? 'question_skipped' : 'question_answered',
            domain: 'fractions',
            skillCode: result.skillId || '',
            questionId: result.variantId || result.questionId || '',
            sessionId,
            metadata: {
              answerCorrect: Boolean(result.correct),
              confidence,
              timeTakenSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              workingSubmitted: Boolean(result.workingUploaded || result.workingSubmitted || result.fullscreenWorkingSubmitted),
              workingNotNeeded: Boolean(result.workingNotNeeded),
              skipped: Boolean(result.skipped),
            },
          };
        }),
        ...results
          .map((result) => normalizeConfidence(result.confidence || result.confidenceLevel || '') ? ({
            studentId,
            eventType: 'confidence_selected',
            domain: 'fractions',
            skillCode: result.skillId || '',
            questionId: result.variantId || result.questionId || '',
            sessionId,
            metadata: { confidence: normalizeConfidence(result.confidence || result.confidenceLevel || '') },
          }) : null)
          .filter(Boolean),
        {
          studentId,
          eventType: 'session_completed',
          domain: 'fractions',
          sessionId,
          metadata: { source: 'similar_question_practice', total: results.length, correct, scorePct: results.length ? Math.round((correct / results.length) * 100) : 0 },
        },
        {
          studentId,
          eventType: 'practice_completed',
          domain: 'fractions',
          sessionId,
          metadata: { source: 'similar_question_practice', total: results.length, correct, scorePct: results.length ? Math.round((correct / results.length) * 100) : 0 },
        },
      ]);
    }
    res.json(submitted);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit similar question practice.' });
  }
}));

function mapPlacementReadiness(profile = []) {
  if (!profile.length) return 'Beginner';
  const mastered = profile.filter((p) => p.mastery === 'mastered').length;
  const developing = profile.filter((p) => p.mastery === 'developing').length;
  const notSecure = profile.filter((p) => p.mastery === 'not-secure').length;
  const ratio = mastered / profile.length;
  if (ratio >= 0.85 && notSecure <= 1) return 'Advanced';
  if (ratio >= 0.65 && notSecure <= 2) return 'Ready';
  if (ratio >= 0.4 || developing >= 3) return 'Progressing';
  if (notSecure >= Math.ceil(profile.length * 0.5)) return 'Beginner';
  return 'Developing';
}

function parentPlacementSummary({ recommendedStartingSkill, weakSkills = [] }) {
  const weakNames = weakSkills.slice(0, 2).map((s) => s.name).filter(Boolean);
  const weakText = weakNames.length
    ? `needs more support with ${weakNames.join(' and ')}`
    : 'has some areas that need support';
  return `Your child understands parts of fractions but ${weakText}. We recommend starting at ${recommendedStartingSkill?.name || 'the recommended skill'} before moving to harder operations.`;
}

function buildStudentPlacementReport(payload = {}) {
  const strengths = (payload.masteredSkills || []).slice(0, 4).map((s) => s.name);
  const improve = (payload.weakSkills || []).slice(0, 4).map((s) => s.name);
  const start = payload.recommendedStartingSkill?.name || 'Fractions Foundations';
  return {
    strengths,
    areasToImprove: improve,
    recommendedStartingPoint: start,
    estimatedDifficulty: payload.readinessLevel || 'Developing',
    suggestedFirstSession: `Start with ${start} practice (8–10 questions).`,
  };
}

function readinessBandFromLevel(level = '') {
  const l = String(level || '').toLowerCase();
  if (l === 'advanced') return 'advanced';
  if (l === 'ready') return 'ready';
  if (l === 'progressing') return 'progressing';
  if (l === 'developing') return 'developing';
  return 'beginner';
}

async function loadFractionsSkills() {
  const skills = await Skill.find({ slug: /^fr\./ }).sort({ order: 1 });
  const byFrameworkId = new Map();
  const byObjectId = new Map();
  for (const s of skills) {
    const fid = s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '';
    if (fid) byFrameworkId.set(String(fid).toUpperCase(), s);
    byObjectId.set(String(s._id), s);
  }
  return { skills, byFrameworkId, byObjectId };
}

// @route GET /api/mastery?studentId=&skillIds=a,b
// @desc  Mastery records + weak skills + a recommended next skill. Used by the
//        MathPath progress, Fluency home, and Mistake-to-Mastery home.
// @access Private
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);

    // MathPath progress only — spelling/other-module mastery lives on its own surface.
    let recFilter = { studentId: student._id, module: 'MathPath' };
    if (req.query.skillIds) recFilter.skillId = { $in: req.query.skillIds.split(',') };
    const records = await MasteryRecord.find(recFilter).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });

    const shaped = records.map((r) => {
      const masteryState = deriveMastery(r);
      return {
        skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
        moeLevel: r.skillId?.moeLevel || '', score: r.score, attempts: r.attempts,
        status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status, lastPracticedAt: r.lastPracticedAt,
        // mastery v2 (derived): 5-state ladder + 3-state fluency label + estimate quality
        masteryState, masteryLabel: MASTERY_LABEL[masteryState], fluency: fluencyLabel(r.fluencyStatus),
        fluencyStatus: r.fluencyStatus || 'unknown', streak: r.streak || 0, bestStreak: r.bestStreak || 0,
        confidence: r.confidence ?? 0, consistency: r.consistency ?? 1, stale: isStale(r),
      };
    });

    const weak = await weakSkills(student._id, { limit: 5 });
    const weakShaped = weak.map((r) => ({
      skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
      score: r.score, status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status,
    }));

    // Recommendation is prerequisite-aware: it targets the weakest in-progress
    // skill (else the next un-mastered skill in curriculum order) and then descends
    // the prerequisite chain to the earliest gap the student is ready for, so we
    // never recommend a skill whose foundations aren't yet mastered. See
    // recommendNextSkill in utils/masteryEngine.js.
    const rec = await recommendNextSkill(student._id);
    const recStatus = rec?.record?.status || 'not_started';
    const recommended = rec ? {
      skillId: rec.skill._id, skillName: rec.skill.name, topicName: rec.skill.topicId?.name || '',
      score: rec.record?.score ?? 0, status: recStatus, statusLabel: STATUS_LABEL[recStatus] || recStatus,
      reason: rec.reason, target: rec.target, mode: rec.mode, masteryState: rec.masteryState,
      masteryLabel: MASTERY_LABEL[rec.masteryState], confidence: rec.confidence,
    } : null;
    const recentMistakes = await Mistake.countDocuments({ studentId: student._id, module: 'MathPath', status: { $ne: 'resolved' } });

    res.json({ studentId: student._id, records: shaped, weakSkills: weakShaped, recommended, recentMistakeCount: recentMistakes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mastery.' });
  }
}));

// @route GET /api/mastery/map?studentId=
// @desc  The Math topic→skill map merged with this student's mastery, for the
//        MathPath home topic list and the Topic Detail page. Not-started skills
//        are included (they have no MasteryRecord yet).
// @access Private
router.get('/map', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const math = await Subject.findOne({ key: 'math' });
    if (!math) return res.json({ studentId: student._id, topics: [] });

    const topics = await Topic.find({ subjectId: math._id }).sort({ order: 1 });
    const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 });
    const records = await MasteryRecord.find({ studentId: student._id });
    const recMap = new Map(records.map((r) => [String(r.skillId), r]));

    const topicList = topics.map((t) => {
      const ts = skills.filter((s) => String(s.topicId) === String(t._id)).map((s) => {
        const r = recMap.get(String(s._id));
        const status = r?.status || 'not_started';
        return { skillId: s._id, name: s.name, moeLevel: s.moeLevel, score: r?.score || 0, attempts: r?.attempts || 0, status, statusLabel: STATUS_LABEL[status] || status, masteryState: deriveMastery(r || {}), fluency: fluencyLabel(r?.fluencyStatus), fluencyStatus: r?.fluencyStatus || 'unknown', streak: r?.streak || 0 };
      });
      const attempted = ts.filter((s) => s.attempts > 0);
      return {
        topicId: t._id, name: t.name, moeLevel: t.moeLevel, skills: ts, total: ts.length,
        masteredCount: ts.filter((s) => s.status === 'mastered').length,
        avgScore: attempted.length ? Math.round(attempted.reduce((a, s) => a + s.score, 0) / attempted.length) : 0,
      };
    });

    res.json({ studentId: student._id, topics: topicList });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load topic map.' });
  }
}));

// @route POST /api/mastery/placement
// @desc  Estimate placement from diagnostic attempts — analyses speed, hesitation,
//        retries and misconception patterns (not just correctness) into a mastery
//        profile + recommended start skills, remediation paths and fluency recs.
//        body: { attempts: [{ slug, correct, responseMs, hesitationMs, retries, misconceptionTag }] }
// @access Private
router.post('/placement', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const attempts = Array.isArray(req.body?.attempts) ? req.body.attempts : [];
    const result = await runPlacement(student._id, attempts);
    res.json({ studentId: student._id, ...(result || { masteryProfile: [] }) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Placement failed.' });
  }
}));

// @route POST /api/mastery/diagnostic/start
// @desc  Backward-compatible MathPath Fractions diagnostic start.
// @access Private
router.post('/diagnostic/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await startAdaptiveDiagnostic({
      student,
      userId: req.user.id,
      subjectId: 'math',
      domainId: 'fractions',
      requestedMode: req.body?.requestedMode || req.body?.mode,
      startSkillId: req.body?.startSkillId || '',
      studentLevel: req.body?.studentLevel,
      diagnosticPurpose: req.body?.diagnosticPurpose,
    });
    return res.json(payload);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to start diagnostic.',
      code: err.code,
      ...(err.payload || {}),
    });
  }
}));

// @route POST /api/mastery/diagnostic/:sessionId/answer
// @desc  Backward-compatible adaptive diagnostic answer endpoint.
// @access Private
router.post('/diagnostic/:sessionId/answer', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await answerAdaptiveDiagnostic({
      student,
      sessionId: req.params.sessionId,
      body: req.body || {},
    });
    return res.json(payload);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to process adaptive diagnostic answer.',
      code: err.code,
      ...(err.payload || {}),
    });
  }
}));

// @route POST /api/mastery/diagnostic/:sessionId/submit
// @desc  Save diagnostic attempts, execute existing placement engine, persist result.
// @access Private
router.post('/diagnostic/:sessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    if (!responses.length) return res.status(400).json({ error: 'No diagnostic responses submitted.' });

    const questionIds = responses.map((r) => r.questionId).filter(Boolean);
    const questions = await Question.find({ _id: { $in: questionIds } }).populate('skillId');
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const attemptsForPlacement = [];
    const masteryProfileHints = [];
    const savedAttempts = [];
    const mistakesFromDiagnostic = [];

    for (const r of responses) {
      const q = qMap.get(String(r.questionId));
      if (!q || !q.skillId) continue;
      const skill = q.skillId;
      const skillFid = String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || '').toUpperCase();
      const studentAnswer = String(r.studentAnswer ?? '');
      const skipped = Boolean(r.skipped);
      const timedOut = Boolean(r.timedOut);
      const correct = skipped ? false : isCorrectWithContext(studentAnswer, q.answer, q.stem);
      const retries = Math.max(0, Number(r.attemptNumber || 1) - 1);
      const timeTakenSeconds = normalizeTimeSpentSeconds(r.timeTaken, r.questionStartedAt, r.questionEndedAt);
      const responseMs = Math.max(0, Number(timeTakenSeconds || 0) * 1000);
      const confidence = String(r.confidence || '');
      const reflection = String(r.reflection || r.confidence || '');
      const helpRequested = Boolean(r.helpRequested || r.help_requested);
      const confidenceCalibration = String(r.confidenceCalibration || '');
      const possibleMisconception = Boolean(r.possibleMisconception || (!correct && (reflection === 'i_know_this' || /very/i.test(confidence))));
      const questionFamilyId = String(r.questionFamilyId || `QF_${skillFid || 'UNK'}_${String(q._id).slice(-4).toUpperCase()}`);
      const attemptId = String(r.attemptId || createLinkId('attempt'));
      const startedAt = toDateLike(r.questionStartedAt);
      const endedAt = toDateLike(r.questionEndedAt) || new Date();
      const eventTimestamp = toDateLike(r.timestamp) || endedAt || new Date();
      const timing = calculateQuestionTiming({
        ...r,
        timeTaken: timeTakenSeconds,
        timeSpentSeconds: timeTakenSeconds,
        questionStartedAt: startedAt,
        questionEndedAt: endedAt,
        answerSubmittedAt: endedAt,
      });

      attemptsForPlacement.push({
        slug: skill.slug,
        correct,
        responseMs,
        hesitationMs: 0,
        retries,
        misconceptionTag: correct ? '' : (q.misconceptionTag || ''),
      });

      masteryProfileHints.push({
        skillId: skillFid,
        skillName: skill.name,
        correct,
        confidence,
        skipped,
        timeTaken: Number(timeTakenSeconds || 0),
        timedOut,
      });

      savedAttempts.push({
        attemptId,
        studentId: String(student._id),
        domainId: 'fractions',
        skillId: skillFid || skill.slug || String(skill._id),
        questionFamilyId,
        questionId: String(q._id),
        sessionId: session.diagnosticSessionId,
        sessionType: 'diagnostic',
        answer: studentAnswer,
        answerCorrect: correct,
        studentAnswer,
        correctAnswer: String(q.answer || ''),
        correct,
        timeTaken: Number.isFinite(Number(timeTakenSeconds)) ? Number(timeTakenSeconds) : null,
        timeSpentSeconds: Number.isFinite(Number(timeTakenSeconds)) ? Number(timeTakenSeconds) : null,
        rawTimeSeconds: timing.rawTimeSeconds,
        effectiveAnswerTimeSeconds: timing.effectiveAnswerTimeSeconds,
        totalQuestionTimeSeconds: timing.totalQuestionTimeSeconds,
        reviewTimeSeconds: timing.reviewTimeSeconds,
        skillTimingSnapshot: timing,
        timestamp: eventTimestamp,
        confidenceLevel: confidence,
        confidence,
        reflection,
        helpRequested,
        confidenceCalibration,
        possibleMisconception,
        attemptNumber: Number(r.attemptNumber || 1),
        skipped,
        timedOut,
        questionStartedAt: startedAt || null,
        questionEndedAt: endedAt || null,
        workingUploaded: Boolean(r.workingUploaded || r.workingSubmitted || r.fullscreenWorkingSubmitted),
        workingSubmitted: Boolean(r.workingSubmitted),
        workingSubmittedAt: toDateLike(r.workingSubmittedAt),
        workingImage: String(r.workingImage || ''),
        workingStrokes: Array.isArray(r.workingStrokes) ? r.workingStrokes : [],
        workingMathObjects: Array.isArray(r.workingMathObjects) ? r.workingMathObjects : [],
        workingNotNeeded: Boolean(r.workingNotNeeded),
        workingRequirementLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(String(r.workingRequirementLevel || '').toUpperCase())
          ? String(r.workingRequirementLevel).toUpperCase()
          : '',
        fullscreenWorkingImage: String(r.fullscreenWorkingImage || ''),
        fullscreenWorkingStrokes: Array.isArray(r.fullscreenWorkingStrokes) ? r.fullscreenWorkingStrokes : [],
        fullscreenWorkingMathObjects: Array.isArray(r.fullscreenWorkingMathObjects) ? r.fullscreenWorkingMathObjects : [],
        fullscreenWorkingSubmitted: Boolean(r.fullscreenWorkingSubmitted),
        fullscreenWorkingSubmittedAt: toDateLike(r.fullscreenWorkingSubmittedAt),
        workingEvidence: Array.isArray(r.workingEvidence) ? r.workingEvidence : [],
        workingCode: String(r.workingCode || ''),
        workingSessionId: String(r.workingSessionId || ''),
        workingId: String(r.workingId || ''),
        workingExpected: true,
        });

      if (!correct) {
        const misconceptionTag = q.misconceptionTag || '';
        const mistakeClassification = classifyFractionMistake({
          skillId: skillFid,
          questionFamilyId,
          studentAnswer,
          correctAnswer: String(q.modelAnswer || q.answer || ''),
          confidence,
          timeTaken: timeTakenSeconds,
          workingAnalysisResult: {
            calculatorIntegrityFlags: Boolean(r.workingUploaded || r.workingSubmitted || r.fullscreenWorkingSubmitted)
              ? []
              : [{ flagType: 'missingWorking' }],
          },
        });
        const mistakeType = skipped
          ? 'careless'
          : (misconceptionTag === 'frac/add-without-common' || misconceptionTag === 'frac/add-denominators')
            ? 'method_error'
            : 'unknown';
        mistakesFromDiagnostic.push({
          studentId: student._id,
          workspaceId: student.workspaceId,
          questionId: q._id,
          skillId: q.skillId._id || q.skillId,
          attemptId,
          workingId: String(r.workingId || ''),
          module: 'MathPath',
          questionStem: q.stem,
          workedSolution: q.modelAnswer || q.workedSolution || '',
          studentAnswer,
          correctAnswer: String(q.modelAnswer || q.answer || ''),
          mistakeId: mistakeClassification.mistakeId,
          mistakeCategory: mistakeClassification.mistakeCategory,
          severity: mistakeClassification.severityLevel,
          mistakeType,
          misconceptionTag,
          rootCauseMapping: mistakeClassification.rootCauseMapping,
          skillMapping: mistakeClassification.skillMapping,
          firstOccurredAt: new Date(),
          mostRecentOccurredAt: new Date(),
          frequency: 1,
          attemptsSinceOccurrence: 0,
          improvementTrend: 'insufficient_evidence',
          resolved: false,
          interventionPathway: mistakeClassification.interventionPathway?.sequence || [],
          nextAction: mistakeClassification.nextAction,
          auditTrail: [mistakeClassification.auditEvent].filter(Boolean),
          confidence,
          reflection,
          helpRequested,
          confidenceCalibration,
          possibleMisconception,
          status: 'open',
          occurredAt: new Date(),
          source: skipped ? 'diagnostic-skipped' : 'diagnostic-incorrect',
        });
      }
    }

    if (!savedAttempts.length) return res.status(400).json({ error: 'Submitted responses do not match valid diagnostic questions.' });
    await MathPathAttempt.insertMany(savedAttempts);
    if (mistakesFromDiagnostic.length) {
      // Link to the most recent unresolved mistake per skill (e.g. re-diagnostic).
      const diagSkillIds = [...new Set(mistakesFromDiagnostic.map((d) => d.skillId).filter(Boolean))];
      if (diagSkillIds.length) {
        const priorMistakes = await Mistake.find(
          { studentId: student._id, skillId: { $in: diagSkillIds }, status: { $ne: 'resolved' } },
          { _id: 1, skillId: 1 },
          { sort: { createdAt: -1 } },
        );
        const originBySkill = new Map();
        for (const m of priorMistakes) {
          const key = String(m.skillId);
          if (!originBySkill.has(key)) originBySkill.set(key, m._id);
        }
        for (const doc of mistakesFromDiagnostic) {
          doc.originMistakeId = (doc.skillId && originBySkill.get(String(doc.skillId))) || null;
        }
      }
      await Mistake.insertMany(mistakesFromDiagnostic);
      await Promise.all(mistakesFromDiagnostic.map((mistake) => MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId: String(student._id),
          domainId: 'fractions',
          mistakeCode: mistake.mistakeId || mistake.misconceptionTag || 'M010',
          skillId: savedAttempts.find((attempt) => String(attempt.questionId) === String(mistake.questionId))?.skillId || '',
          questionFamilyId: savedAttempts.find((attempt) => String(attempt.questionId) === String(mistake.questionId))?.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistake.mistakeCategory || mistake.mistakeType || 'Diagnostic mistake',
            severity: ['critical', 'major'].includes(mistake.severity) ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: mistake.source,
              questionId: String(mistake.questionId),
              prompt: mistake.questionStem,
              studentAnswer: mistake.studentAnswer,
              correctAnswer: mistake.correctAnswer,
              confidence: mistake.confidence || '',
              reflection: mistake.reflection || '',
              helpRequested: Boolean(mistake.helpRequested),
              confidenceCalibration: mistake.confidenceCalibration || '',
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )));
    }

    const placement = await runPlacement(student._id, attemptsForPlacement);
    const { byFrameworkId } = await loadFractionsSkills();
    const mapSlugToF = (slug) => {
      const skill = [...byFrameworkId.values()].find((s) => s.slug === slug);
      return skill ? {
        skillId: String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || ''),
        name: skill.name,
        slug: skill.slug,
      } : { skillId: '', name: slug, slug };
    };

    const placementRecommended = placement?.recommendedStartSkills?.[0]
      ? mapSlugToF(placement.recommendedStartSkills[0].slug)
      : null;
    const masteredSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'mastered')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const weakSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'not-secure' || p.mastery === 'developing')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const fluencyRecommendations = (placement?.fluencyRecommendations || []).map((f) => mapSlugToF(f.slug));
    const prerequisiteGaps = (placement?.prerequisiteGaps || []).map((g) => ({
      skill: mapSlugToF(g.slug),
      rootGap: mapSlugToF(g.rootGap),
    }));
    const remediationRecommendations = (placement?.remediationPathways || []).map((r) => ({
      skill: mapSlugToF(r.slug),
      reinforce: (r.reinforce || []).map((slug) => mapSlugToF(slug)).filter((s) => s.skillId),
      misconception: r.misconception || null,
    }));
    const readinessLevel = mapPlacementReadiness(placement?.masteryProfile || []);

    const recommendedSkillId = resolveFractionsStartingSkill({
      mode: session.mode,
      weakSkills,
      prerequisiteGaps,
      placementRecommended,
      targetSkillIds: session.targetSkillIds || [],
    });
    const recommended = mapSlugToF(
      [...byFrameworkId.values()].find(
        (s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '').toUpperCase() === String(recommendedSkillId).toUpperCase()
      )?.slug || ''
    );
    const safeRecommended = recommended?.skillId ? recommended : {
      skillId: recommendedSkillId,
      name: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.name || recommendedSkillId,
      slug: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.slug || '',
    };

    const totalExpected = Array.isArray(session.result?.questionIds) ? session.result.questionIds.length : savedAttempts.length;
    const correctCount = savedAttempts.filter((attempt) => attempt.correct).length;
    const answeredCount = savedAttempts.filter((attempt) => !attempt.skipped).length;
    const readinessScore = savedAttempts.length ? Math.round((correctCount / savedAttempts.length) * 100) : 0;
    const completionRatio = totalExpected > 0 ? Math.min(1, savedAttempts.length / totalExpected) : 1;
    const confidenceScore = Math.round(Math.min(1, (placement?.overallConfidence || 0) * completionRatio) * 100) / 100;
    const fluencyGaps = fluencyRecommendations.filter((f) => f?.skillId);

    const result = {
      readinessBand: readinessBandFromLevel(readinessLevel),
      recommendedStartingSkill: safeRecommended,
      recommendedStartingSkillName: safeRecommended?.name || '',
      recommendedStartingTopic: 'Fractions',
      masteryProfile: placement?.masteryProfile || [],
      masteredSkills,
      weakSkills,
      prerequisiteGaps,
      fluencyRecommendations,
      fluencyGaps,
      remediationRecommendations,
      confidenceScore,
      overallFractionReadinessScore: readinessScore,
      questionsCorrect: correctCount,
      questionsAnswered: answeredCount,
      totalQuestions: savedAttempts.length,
      confidenceCalibrationSummary: {
        masterySignals: savedAttempts.filter((a) => a.correct && /very/i.test(a.confidence || '')).length,
        luckyCorrect: savedAttempts.filter((a) => a.correct && /guess/i.test(a.confidence || '')).length,
        misconceptionAlerts: savedAttempts.filter((a) => !a.correct && /very/i.test(a.confidence || '')).length,
        learningGaps: savedAttempts.filter((a) => !a.correct && /unsure/i.test(a.confidence || '')).length,
      },
      readinessLevel,
      diagnosticCompleted: true,
      diagnosticCompletedAt: new Date().toISOString(),
      lastSessionAt: new Date().toISOString(),
      currentSkillId: safeRecommended?.skillId || null,
      skillMasteryStatus: (placement?.masteryProfile || []).reduce((acc, row) => {
        const key = mapSlugToF(row.slug)?.skillId;
        if (key) acc[key] = row.mastery || 'developing';
        return acc;
      }, {}),
      recentMistakeTypes: [],
      needsRecheck: false,
      masteryCheckCompleted: false,
      completedAt: new Date().toISOString(),
      nextPracticePayload: {
        skillId: safeRecommended?.skillId || 'F001',
        source: 'diagnostic-placement',
        mode: session.mode,
        questionCount: 8,
      },
    };
    result.studentPlacementReport = buildStudentPlacementReport(result);
    result.parentPlacementSummary = parentPlacementSummary(result);
    result.parentSummary = result.parentPlacementSummary;

    const completedBefore = await MathPathDiagnosticSession.find({
      studentId: String(student._id),
      subjectId: session.subjectId || 'math',
      domainId: session.domainId || 'fractions',
      status: 'completed',
      diagnosticSessionId: { $ne: session.diagnosticSessionId },
    }).sort({ completedAt: 1, createdAt: 1 }).lean();
    const baseline = completedBefore.find((row) => row.isBaseline)
      || completedBefore.find((row) => row.diagnosticPurpose === 'baseline')
      || completedBefore[0]
      || null;
    const previous = completedBefore[completedBefore.length - 1] || null;
    session.diagnosticPurpose = session.diagnosticPurpose || session.result?.diagnosticPurpose || 'baseline';
    session.attemptNumber = session.attemptNumber || completedBefore.length + 1;
    session.isBaseline = Boolean(session.isBaseline || !baseline);
    session.baselineDiagnosticId = session.isBaseline ? session.diagnosticSessionId : (session.baselineDiagnosticId || baseline?.diagnosticSessionId || '');
    session.previousDiagnosticId = session.previousDiagnosticId || previous?.diagnosticSessionId || '';
    session.perSkillSnapshot = Object.entries(result.skillBreakdown || {}).map(([skillId, row]) => ({
      skillId,
      skillName: row.name || '',
      questionsAnswered: Number(row.attempts || 0),
      correctCount: Number(row.correct || 0),
      score: Number(row.percentage || 0),
      confidenceScore: null,
      averageTimeTaken: null,
      workingSubmittedRate: null,
      misconceptionTags: [],
      evidenceQuestionIds: [],
    }));
    session.status = 'completed';
    session.completedAt = new Date();
    session.result = result;
    session.resultPayload = result;
    session.readinessScore = readinessScore;
    await session.save();

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      diagnosticPurpose: session.diagnosticPurpose || session.result?.diagnosticPurpose || 'baseline',
      assignmentId: session.assignmentId || '',
      studentLevel: session.studentLevel,
      ...result,
      recommendedStartingSkillId: safeRecommended?.skillId || null,
      studentFriendlySummary: `You are doing well in parts of fractions. Start with ${safeRecommended?.name || 'the recommended skill'} to build stronger confidence.`,
      parentFriendlySummary: result.parentPlacementSummary,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to complete diagnostic.' });
  }
}));

router.get('/diagnostic/history', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const subjectId = req.query.subjectId || 'math';
    const domainId = req.query.domainId || 'fractions';
    const history = await getDiagnosticHistory({
      studentId: String(student._id),
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, history });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load diagnostic history.' });
  }
}));

router.get('/diagnostic/growth', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const subjectId = req.query.subjectId || 'math';
    const domainId = req.query.domainId || 'fractions';
    const growth = await getDiagnosticGrowth({
      studentId: String(student._id),
      subjectId,
      domainId,
      assignmentId: req.query.assignmentId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, ...growth });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load diagnostic growth.' });
  }
}));

// @route GET /api/mastery/diagnostic/latest?studentId=
// @desc  Latest completed Fractions diagnostic/placement result for dashboard use.
// @access Private (student self, parent guardian, tutor/teacher workspace member)
router.get('/diagnostic/latest', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const latest = await MathPathDiagnosticSession.findOne({
      studentId: String(student._id),
      domainId: 'fractions',
      status: 'completed',
    }).sort({ completedAt: -1, createdAt: -1 });

    if (!latest) {
      return res.json({ hasPlacement: false, result: null });
    }

    return res.json({
      hasPlacement: true,
      diagnosticCompleted: true,
      sessionId: latest.diagnosticSessionId,
      mode: latest.mode,
      studentLevel: latest.studentLevel,
      completionReason: latest.completionReason || latest.result?.completionReason || '',
      lifecycleLog: latest.lifecycleLog || {},
      completedAt: latest.completedAt,
      lastSessionAt: latest.completedAt,
      timingAnalytics: latest.diagnosticSessionId
        ? await studentMathPathTimingAnalytics(student._id, { sessionId: latest.diagnosticSessionId })
        : null,
      result: latest.result || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load latest diagnostic.' });
  }
}));

// @route POST /api/mastery/test/reset-state
// @desc  Reset MathPath state for seeded QA/test student accounts.
// @access Private (the test student themself or admin)
router.post('/test/reset-state', protect, asyncHandler(async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    const requesterRoles = new Set([requester?.role, ...(Array.isArray(requester?.roles) ? requester.roles : [])].filter(Boolean));
    const isAdmin = requesterRoles.has('admin');
    const targetStudent = isAdmin && req.body?.studentId
      ? await resolveStudent(req, req.body.studentId)
      : await resolveStudent(req);
    const targetUser = targetStudent?.userId ? await User.findById(targetStudent.userId) : null;
    const allowed = isAdmin || Boolean(requester?.is_test_account) || Boolean(targetUser?.is_test_account);
    if (!allowed) {
      return res.status(403).json({ error: 'Reset Student State is available only for admin or test accounts.' });
    }

    const studentId = String(targetStudent._id);
    const mathPathSessions = await PracticeSession.find({ studentId: targetStudent._id, module: 'MathPath' }).select('_id');
    const mathPathSessionIds = mathPathSessions.map((session) => session._id);
    const deletionPlan = buildResetStudentStateDeletionPlan({
      studentId,
      studentObjectId: targetStudent._id,
      mathPathSessionIds,
    });
    const deletionResults = await Promise.all(deletionPlan.map((item) => item.model.deleteMany(item.query)));
    const deleted = deletionPlan.reduce((acc, item, index) => {
      acc[item.key] = deletionResults[index]?.deletedCount || 0;
      return acc;
    }, {});

    return res.json({
      ok: true,
      studentId,
      deleted,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to reset student state.' });
  }
}));

// @route GET /api/mastery/diagnostic/:sessionId
// @desc  Read persisted diagnostic session result.
// @access Private
router.get('/diagnostic/:sessionId', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });
    let questions = [];
    const storedIds = Array.isArray(session.result?.questionIds) ? session.result.questionIds : [];
    if (storedIds.length) {
      const docs = await Question.find({ _id: { $in: storedIds } });
      const byId = new Map(docs.map((q) => [String(q._id), q]));
      const metaById = new Map((session.result?.questionMeta || []).map((m) => [String(m.questionId), m]));
      questions = storedIds
        .map((qid) => {
          const q = byId.get(String(qid));
          if (!q) return null;
          const meta = metaById.get(String(qid)) || {};
          return {
            questionId: String(q._id),
            skillId: meta.skillId || '',
            questionFamilyId: meta.questionFamilyId || '',
            prompt: q.stem,
            type: q.type,
            choices: q.choices || [],
            visual: q.visual || null,
            hasFigure: !!q.hasFigure,
            figureUrl: q.figureUrl || '',
            figureAlt: q.figureAlt || '',
            answerInputType: answerInputTypeFor(q.answer),
            workingRequired: true,
          };
        })
        .filter(Boolean);
    }

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      studentLevel: session.studentLevel,
      status: session.status,
      completionReason: session.completionReason || session.result?.completionReason || '',
      lifecycleLog: session.lifecycleLog || {},
      timingAnalytics: await studentMathPathTimingAnalytics(student._id, { sessionId: session.diagnosticSessionId }),
      result: session.result || {},
      completedAt: session.completedAt,
      questions,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load diagnostic session.' });
  }
}));

// @route POST /api/mastery/remediation
// @desc  A calm, progressively-disclosed remediation plan for a skill the student
//        keeps missing: likely misconception → prerequisite warm-up → worked
//        example → guided replication → retry.
//        body: { skillSlug | skillId, recentAttempts?: [{ correct, misconceptionTag }] }
// @access Private
router.post('/remediation', protect, asyncHandler(async (req, res) => {
  try {
    const { skillSlug, skillId, recentAttempts = [] } = req.body || {};
    const skill = skillSlug ? await Skill.findOne({ slug: skillSlug }) : (skillId ? await Skill.findById(skillId) : null);
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    const prereqSkills = await Skill.find({ _id: { $in: skill.prerequisiteSkillIds || [] } });
    const plan = buildRemediationPlan({ skill, recentAttempts, prereqSkills });
    if (plan?.workingEvidenceUsed) {
      const student = await resolveStudent(req).catch(() => null);
      await recordLearningEvents([{
        studentId: String(student?._id || req.user?.id || req.user?._id || ''),
        eventType: 'working_used_for_remediation',
        domain: 'fractions',
        skillCode: skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || skill.slug || '',
        metadata: {
          skillId: String(skill._id),
          detectedMethod: plan.workingInsight?.detectedMethod || '',
          detectedIssue: plan.workingInsight?.detectedIssue || '',
          qualityBand: plan.workingInsight?.qualityBand || '',
        },
      }]);
    }
    res.json(plan);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Remediation failed.' });
  }
}));

// @route GET /api/mastery/analytics?studentId=&days=30
// @desc  Lightweight, dashboard-ready MathPath analytics (response times,
//        accuracy, consistency, mastery velocity, fluency trends, top
//        misconceptions, remediation triggers) for parent/tutor views + AI.
// @access Private
router.get('/analytics', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const sinceDays = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const [summary, timingAnalytics] = await Promise.all([
      studentMathAnalytics(student._id, { sinceDays }),
      studentMathPathTimingAnalytics(student._id, { sinceDays }),
    ]);
    res.json({ studentId: student._id, ...summary, timingAnalytics });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Analytics failed.' });
  }
}));

// @route GET /api/mastery/graph?studentId=
// @desc  The Math curriculum graph + this student's mastery, with prerequisite-
//        aware lock/ready state and a "ready to learn next" list. Powers the
//        student Skill Graph page. Math (MathPath) only — that's where the
//        prerequisite graph is authored. A skill is `ready` when all its
//        prerequisites are mastered (stale mastery doesn't count, matching
//        recommendNextSkill), and `locked` when it's not yet started and a
//        prerequisite is still missing.
// @access Private
router.get('/graph', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const skillStates = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: 'fractions' }).lean();
    const view = buildFractionsPersistedSkillGraphView(skillStates);

    res.json({ studentId: student._id, ...view });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skill graph.' });
  }
}));


// =========================================================================
// P4 Practice — start route
// =========================================================================
function isP4DomainId(domainId) {
  return String(domainId || '').startsWith('p4-');
}

router.post('/p4/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
    if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    const resolvedDomainId = domainId || 'p4-unknown';
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      { $setOnInsert: { practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId, targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '', sessionGoal: sessionLabel, estimatedQuestionCount: questions.length, workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date() }, $set: { lifecycleLog } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p4_practice', sessionType, targetSkillId } },
      { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p4_practice', sessionType, targetSkillId } },
    ]);
    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start P4 practice.' }); }
}));

// =========================================================================
// P4 Practice — submit route
// =========================================================================
router.post('/p4/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'P4 practice session not found.' });
    if (!isP4DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P4 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map((existing.questions || []).map((q) => [String(q.questionId), q]));
    const attemptDocs = results.filter((r) => r.questionId).map((r) => p1PracticeAttemptDoc({ studentId, result: r, sessionId: req.params.practiceSessionId, sessionType, domainId, question: questionsById.get(String(r.questionId)) || {} }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(attemptDocs.map((doc) => ({ updateOne: { filter: { attemptId: doc.attemptId }, update: { $setOnInsert: doc }, upsert: true } })), { ordered: false });
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }
    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId, mistakeCode: mistakeTag, skillId: result.skillId || question.skillId || '', questionFamilyId: result.questionFamilyId || question.questionFamilyId || '' },
        { $inc: { frequency: 1 }, $set: { mistakeName: mistakeTag, severity: result.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: { source: 'practice-incorrect', questionId: result.questionId, sessionId: req.params.practiceSessionId, attemptId: attempt?.attemptId || result.attemptId || '', prompt: question.prompt || question.stem || '', studentAnswer: result.studentAnswer || result.answer || '', correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''), answerCorrect: false, confidence: result.confidence || '', timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt), seenAt: new Date() } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => { const skillId = r.skillId || ''; if (!skillId) return acc; if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 }; acc[skillId].total += 1; if (r.correct) acc[skillId].correct += 1; return acc; }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = { status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview', accuracy, lastPractisedAt: new Date() };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate({ studentId, domainId, skillId }, { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: req.params.practiceSessionId, studentId, questionId: results.at(-1)?.questionId || '', attemptSaved, mistakeCreated: wrongResults.length > 0, progressUpdated, answeredQuestions: results.length, targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length, completionReason: 'target_reached' });
    const summary = { practiceSessionId: req.params.practiceSessionId, sessionType, results, accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy }, persisted: true, lifecycleLog };
    existing.status = 'completed'; existing.completedAt = new Date(); existing.responses = req.body?.responses || []; existing.summary = summary; existing.lifecycleLog = lifecycleLog;
    await existing.save();
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({ studentId, eventType: attempt.skipped ? 'question_skipped' : 'question_answered', domain: domainId, skillCode: attempt.skillId, questionId: attempt.questionId, sessionId: req.params.practiceSessionId, metadata: { answerCorrect: attempt.correct, confidence: normalizeConfidence(attempt.confidence), timeTakenSeconds: attempt.timeTaken, skipped: attempt.skipped } })),
      { studentId, eventType: 'session_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p4_practice', total, correct: correctCount } },
      { studentId, eventType: 'practice_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p4_practice', total, correct: correctCount } },
    ]);
    res.json(summary);
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to submit P4 practice.' }); }
}));

// P4 skill states
router.get('/p4/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: { $regex: /^p4-/ } }).lean();
    res.json({ skillStates: states });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load P4 skill states.' }); }
}));

// =========================================================================
// P5 Practice — start route
// =========================================================================
function isP5DomainId(domainId) {
  return String(domainId || '').startsWith('p5-');
}

router.post('/p5/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
    if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    const resolvedDomainId = domainId || 'p5-unknown';
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      { $setOnInsert: { practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId, targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '', sessionGoal: sessionLabel, estimatedQuestionCount: questions.length, workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date() }, $set: { lifecycleLog } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p5_practice', sessionType, targetSkillId } },
      { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p5_practice', sessionType, targetSkillId } },
    ]);
    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start P5 practice.' }); }
}));

// =========================================================================
// P5 Practice — submit route
// =========================================================================
router.post('/p5/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'P5 practice session not found.' });
    if (!isP5DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P5 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map((existing.questions || []).map((q) => [String(q.questionId), q]));
    const attemptDocs = results.filter((r) => r.questionId).map((r) => p1PracticeAttemptDoc({ studentId, result: r, sessionId: req.params.practiceSessionId, sessionType, domainId, question: questionsById.get(String(r.questionId)) || {} }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(attemptDocs.map((doc) => ({ updateOne: { filter: { attemptId: doc.attemptId }, update: { $setOnInsert: doc }, upsert: true } })), { ordered: false });
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }
    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId, mistakeCode: mistakeTag, skillId: result.skillId || question.skillId || '', questionFamilyId: result.questionFamilyId || question.questionFamilyId || '' },
        { $inc: { frequency: 1 }, $set: { mistakeName: mistakeTag, severity: result.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: { source: 'practice-incorrect', questionId: result.questionId, sessionId: req.params.practiceSessionId, attemptId: attempt?.attemptId || result.attemptId || '', prompt: question.prompt || question.stem || '', studentAnswer: result.studentAnswer || result.answer || '', correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''), answerCorrect: false, confidence: result.confidence || '', timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt), seenAt: new Date() } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => { const skillId = r.skillId || ''; if (!skillId) return acc; if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 }; acc[skillId].total += 1; if (r.correct) acc[skillId].correct += 1; return acc; }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = { status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview', accuracy, lastPractisedAt: new Date() };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate({ studentId, domainId, skillId }, { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: req.params.practiceSessionId, studentId, questionId: results.at(-1)?.questionId || '', attemptSaved, mistakeCreated: wrongResults.length > 0, progressUpdated, answeredQuestions: results.length, targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length, completionReason: 'target_reached' });
    const summary = { practiceSessionId: req.params.practiceSessionId, sessionType, results, accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy }, persisted: true, lifecycleLog };
    existing.status = 'completed'; existing.completedAt = new Date(); existing.responses = req.body?.responses || []; existing.summary = summary; existing.lifecycleLog = lifecycleLog;
    await existing.save();
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({ studentId, eventType: attempt.skipped ? 'question_skipped' : 'question_answered', domain: domainId, skillCode: attempt.skillId, questionId: attempt.questionId, sessionId: req.params.practiceSessionId, metadata: { answerCorrect: attempt.correct, confidence: normalizeConfidence(attempt.confidence), timeTakenSeconds: attempt.timeTaken, skipped: attempt.skipped } })),
      { studentId, eventType: 'session_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p5_practice', total, correct: correctCount } },
      { studentId, eventType: 'practice_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p5_practice', total, correct: correctCount } },
    ]);
    res.json(summary);
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to submit P5 practice.' }); }
}));

// P5 skill states
router.get('/p5/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: { $regex: /^p5-/ } }).lean();
    res.json({ skillStates: states });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load P5 skill states.' }); }
}));


// =========================================================================
// P6 Practice — start route
// =========================================================================
function isP6DomainId(domainId) {
  return String(domainId || '').startsWith('p6-');
}

router.post('/p6/practice/start', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
    if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
    const resolvedDomainId = domainId || 'p6-unknown';
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId },
      { $setOnInsert: { practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId, targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '', sessionGoal: sessionLabel, estimatedQuestionCount: questions.length, workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date() }, $set: { lifecycleLog } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p6_practice', sessionType, targetSkillId } },
      { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source: 'mathpath_p6_practice', sessionType, targetSkillId } },
    ]);
    res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start P6 practice.' }); }
}));

// =========================================================================
// P6 Practice — submit route
// =========================================================================
router.post('/p6/practice/:practiceSessionId/submit', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'P6 practice session not found.' });
    if (!isP6DomainId(existing.domainId)) return res.status(400).json({ error: 'Session is not a P6 session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const submitted = req.body || {};
    const sessionType = submitted.sessionType || 'practice';
    const results = Array.isArray(submitted.responses) ? submitted.responses : [];
    const domainId = existing.domainId;
    const questionsById = new Map((existing.questions || []).map((q) => [String(q.questionId), q]));
    const attemptDocs = results.filter((r) => r.questionId).map((r) => p1PracticeAttemptDoc({ studentId, result: r, sessionId: req.params.practiceSessionId, sessionType, domainId, question: questionsById.get(String(r.questionId)) || {} }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(attemptDocs.map((doc) => ({ updateOne: { filter: { attemptId: doc.attemptId }, update: { $setOnInsert: doc }, upsert: true } })), { ordered: false });
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }
    const wrongResults = results.filter(shouldCreatePracticeMistake);
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId, mistakeCode: mistakeTag, skillId: result.skillId || question.skillId || '', questionFamilyId: result.questionFamilyId || question.questionFamilyId || '' },
        { $inc: { frequency: 1 }, $set: { mistakeName: mistakeTag, severity: result.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: { source: 'practice-incorrect', questionId: result.questionId, sessionId: req.params.practiceSessionId, attemptId: attempt?.attemptId || result.attemptId || '', prompt: question.prompt || question.stem || '', studentAnswer: result.studentAnswer || result.answer || '', correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''), answerCorrect: false, confidence: result.confidence || '', timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt), seenAt: new Date() } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const bySkill = results.filter((r) => !r.error).reduce((acc, r) => { const skillId = r.skillId || ''; if (!skillId) return acc; if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 }; acc[skillId].total += 1; if (r.correct) acc[skillId].correct += 1; return acc; }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = { status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview', accuracy, lastPractisedAt: new Date() };
      if (accuracy >= 90) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate({ studentId, domainId, skillId }, { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const total = results.length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const lifecycleLog = buildPracticeLifecycleLog({ sessionId: req.params.practiceSessionId, studentId, questionId: results.at(-1)?.questionId || '', attemptSaved, mistakeCreated: wrongResults.length > 0, progressUpdated, answeredQuestions: results.length, targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length, completionReason: 'target_reached' });
    const summary = { practiceSessionId: req.params.practiceSessionId, sessionType, results, accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy }, persisted: true, lifecycleLog };
    existing.status = 'completed'; existing.completedAt = new Date(); existing.responses = req.body?.responses || []; existing.summary = summary; existing.lifecycleLog = lifecycleLog;
    await existing.save();
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({ studentId, eventType: attempt.skipped ? 'question_skipped' : 'question_answered', domain: domainId, skillCode: attempt.skillId, questionId: attempt.questionId, sessionId: req.params.practiceSessionId, metadata: { answerCorrect: attempt.correct, confidence: normalizeConfidence(attempt.confidence), timeTakenSeconds: attempt.timeTaken, skipped: attempt.skipped } })),
      { studentId, eventType: 'session_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p6_practice', total, correct: correctCount } },
      { studentId, eventType: 'practice_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source: 'mathpath_p6_practice', total, correct: correctCount } },
    ]);
    res.json(summary);
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to submit P6 practice.' }); }
}));

// P6 skill states
router.get('/p6/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: { $regex: /^p6-/ } }).lean();
    res.json({ skillStates: states });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load P6 skill states.' }); }
}));

// @route GET /api/mastery/skill-states?studentId=X&domainIds=p1-money,p2-money
// @desc  Return MathPathStudentSkillState records for specific domainIds.
//        Tutor-accessible via resolveStudent (pass ?studentId= for a tutored student).
// @access Private
router.get('/skill-states', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const rawIds = req.query.domainIds ? String(req.query.domainIds).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const filter = { studentId: String(student._id) };
    if (rawIds.length) filter.domainId = { $in: rawIds };
    const states = await MathPathStudentSkillState.find(filter).lean();
    res.json({ skillStates: states, studentId: String(student._id) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skill states.' });
  }
}));

export default router;

