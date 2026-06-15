import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import MathPathAssessmentSession from '../../models/mathpath/MathPathAssessmentSession.js';
import MathPathWorkingSession from '../../models/mathpath/MathPathWorkingSession.js';
import MathPathWorkingIntelligence from '../../models/mathpath/MathPathWorkingIntelligence.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import Mistake from '../../models/Mistake.js';
import PracticeSession from '../../models/PracticeSession.js';
import PracticeAttempt from '../../models/PracticeAttempt.js';
import LearningTelemetryEvent from '../../models/LearningTelemetryEvent.js';
import StudentLearningEvent from '../../models/studentProfile/StudentLearningEvent.js';
import StudentXP from '../../models/studentProfile/StudentXP.js';
import StudentAchievement from '../../models/studentProfile/StudentAchievement.js';
import FluencyRecord from '../../models/FluencyRecord.js';
import RetentionReview from '../../models/RetentionReview.js';
import { calculateQuestionTiming } from '../../shared/mathpath/fractions/fractionFluencyRetentionEngine.js';
import { createLinkId } from '../../services/mathpath/workingLinkageService.js';
import { fractionSkillGraph } from '../../shared/mathpath/fractions/fractionSkillGraph.js';
import { buildSkillGraphView } from '../../utils/skillGraphView.js';

export const STATUS_LABEL = { not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning', mastered: 'fluent' };

export function canTrainQuestionPatterns(user = {}) {
  const roles = new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
  return roles.has('admin') || roles.has('teacher') || roles.has('tutor');
}

export function answerInputTypeFor(answer = '') {
  const raw = String(answer || '').trim();
  if (raw.includes(',') && /\d+\s*\/\s*\d+/.test(raw)) return 'ordering';
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(raw)) return 'mixed';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(raw)) return 'fraction';
  if (/^-?\d+\.\d+$/.test(raw)) return 'decimal';
  if (/^-?\d+$/.test(raw)) return 'whole_number';
  return '';
}

export function toDateLike(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeTimeSpentSeconds(value, questionStartedAt, questionEndedAt) {
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

export function logPracticeLifecycle(payload = {}) {
  const entry = buildPracticeLifecycleLog(payload);
  console.info('[practice:lifecycle]', entry);
  return entry;
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

export function p1PracticeAttemptDoc({ studentId, result, sessionId, sessionType, domainId, question = {} } = {}) {
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

const P1_DOMAIN_PREFIXES = ['P1-NUM', 'P1-ADD', 'P1-MON', 'P1-MEA', 'P1-GEO', 'P1-EQG', 'P1-DAT'];

export function isP1SkillId(skillId) {
  return P1_DOMAIN_PREFIXES.some((p) => String(skillId || '').startsWith(p));
}

export function resolveP1DomainId(skillId) {
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

export async function resolveSkillObjectIdForCode(skillCode) {
  const Skill = (await import('../../models/Skill.js')).default;
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

export function mapPlacementReadiness(profile = []) {
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

export function parentPlacementSummary({ recommendedStartingSkill, weakSkills = [] }) {
  const weakNames = weakSkills.slice(0, 2).map((s) => s.name).filter(Boolean);
  const weakText = weakNames.length
    ? `needs more support with ${weakNames.join(' and ')}`
    : 'has some areas that need support';
  return `Your child understands parts of fractions but ${weakText}. We recommend starting at ${recommendedStartingSkill?.name || 'the recommended skill'} before moving to harder operations.`;
}

export function buildStudentPlacementReport(payload = {}) {
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

export function readinessBandFromLevel(level = '') {
  const l = String(level || '').toLowerCase();
  if (l === 'advanced') return 'advanced';
  if (l === 'ready') return 'ready';
  if (l === 'progressing') return 'progressing';
  if (l === 'developing') return 'developing';
  return 'beginner';
}

export async function loadFractionsSkills() {
  const Skill = (await import('../../models/Skill.js')).default;
  const skills = await Skill.find({ slug: /^fr\./i }).sort({ order: 1 });
  const byFrameworkId = new Map();
  const byObjectId = new Map();
  for (const s of skills) {
    const fid = s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '';
    if (fid) byFrameworkId.set(String(fid).toUpperCase(), s);
    byObjectId.set(String(s._id), s);
  }
  return { skills, byFrameworkId, byObjectId };
}
