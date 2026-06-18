import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import Mistake from '../../models/Mistake.js';
import Skill from '../../models/Skill.js';
import { normalizeConfidence, recordLearningEvents } from '../telemetry/learningTelemetryService.js';

function safeId(value = '') {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function toDateLike(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function seconds(value, start, end) {
  const direct = Number(value);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const startedAt = toDateLike(start);
  const endedAt = toDateLike(end);
  if (startedAt && endedAt) return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  return 0;
}

function solutionText(question = {}) {
  if (Array.isArray(question.solutionSteps)) return question.solutionSteps.join('\n');
  if (Array.isArray(question.steps)) return question.steps.join('\n');
  return String(question.workedSolution || question.solution || '');
}

function correctAnswer(question = {}, result = {}) {
  return String(
    result.correctAnswer
    ?? question.answer?.display
    ?? question.answer?.value
    ?? question.answer
    ?? ''
  );
}

function responseFor(responsesById, questionId) {
  return responsesById.get(String(questionId)) || {};
}

function mergedResult({ result = {}, question = {}, response = {} }) {
  const skipped = Boolean(response.skipped || response.blankAnswer);
  const workingSubmitted = Boolean(response.workingSubmitted || response.workingUploaded || response.fullscreenWorkingSubmitted);
  return {
    ...result,
    studentAnswer: String(response.studentAnswer ?? response.answer ?? result.studentAnswer ?? result.answer ?? ''),
    correctAnswer: correctAnswer(question, result),
    skipped,
    confidence: String(response.confidence || result.confidence || ''),
    timeTaken: seconds(result.timeTaken ?? response.timeTaken, response.questionStartedAt, response.questionEndedAt),
    questionStartedAt: response.questionStartedAt || null,
    questionEndedAt: response.questionEndedAt || response.answeredAt || null,
    answeredAt: response.answeredAt || null,
    workingSubmitted,
    workingUploaded: Boolean(response.workingUploaded || workingSubmitted),
    workingOnPaper: Boolean(response.workingOnPaper),
    workingNotNeeded: Boolean(response.workingNotNeeded),
    workingSubmittedAt: response.workingSubmittedAt || null,
    workingSessionId: String(response.workingSessionId || ''),
    workingId: String(response.workingId || response.workingSessionId || ''),
    workingImage: String(response.workingImage || response.fullscreenWorkingImage || ''),
    workingPreviewImage: String(response.workingImage || response.fullscreenWorkingImage || ''),
    workingStrokes: Array.isArray(response.workingStrokes) ? response.workingStrokes : [],
    workingMathObjects: Array.isArray(response.workingMathObjects) ? response.workingMathObjects : [],
    fullscreenWorkingSubmitted: Boolean(response.fullscreenWorkingSubmitted),
    fullscreenWorkingImage: String(response.fullscreenWorkingImage || ''),
    fullscreenWorkingStrokes: Array.isArray(response.fullscreenWorkingStrokes) ? response.fullscreenWorkingStrokes : [],
    fullscreenWorkingMathObjects: Array.isArray(response.fullscreenWorkingMathObjects) ? response.fullscreenWorkingMathObjects : [],
    fullscreenWorkingSubmittedAt: response.fullscreenWorkingSubmittedAt || null,
    workingEvidence: Array.isArray(response.workingEvidence) ? response.workingEvidence : [],
    workingRequirementLevel: String(response.workingRequirementLevel || question.workingRequirementLevel || ''),
    solutionSteps: Array.isArray(question.solutionSteps) ? question.solutionSteps : [],
    workedSolution: solutionText(question),
    prompt: String(question.prompt || question.stem || ''),
  };
}

async function resolveSkillObjectIds(skillIds = []) {
  const unique = [...new Set(skillIds.filter(Boolean))];
  if (!unique.length) return new Map();
  const docs = await Skill.find({
    $or: [
      { 'metadata.mathPathSkillId': { $in: unique } },
      { 'metadata.frameworkCode': { $in: unique } },
      { slug: { $in: unique } },
      { name: { $in: unique } },
    ],
  }).select('_id slug name metadata').lean();
  const map = new Map();
  for (const doc of docs) {
    [doc.slug, doc.name, doc.metadata?.mathPathSkillId, doc.metadata?.frameworkCode]
      .filter(Boolean)
      .forEach((key) => map.set(String(key), doc._id));
  }
  return map;
}

function attemptDoc({ student, domainId, session, result, question, attemptId }) {
  const timeTaken = seconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt);
  const timestamp = toDateLike(result.answeredAt) || toDateLike(result.questionEndedAt) || new Date();
  return {
    attemptId,
    studentId: String(student._id),
    domainId,
    skillId: result.skillId || question.skillId || '',
    questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
    questionId: String(result.questionId || question.questionId || ''),
    sessionId: session.practiceSessionId,
    assignmentId: String(session.assignmentId || ''),
    sessionType: 'practice',
    answer: result.studentAnswer || '',
    answerCorrect: Boolean(result.correct),
    studentAnswer: result.studentAnswer || '',
    correctAnswer: result.correctAnswer || '',
    correct: Boolean(result.correct),
    timeTaken,
    timeSpentSeconds: timeTaken,
    rawTimeSeconds: timeTaken,
    effectiveAnswerTimeSeconds: timeTaken,
    totalQuestionTimeSeconds: timeTaken,
    confidence: result.confidence || '',
    confidenceLevel: result.confidence || '',
    reflection: result.confidence || '',
    helpRequested: result.confidence === 'i_need_help',
    confidenceCalibration: result.correct ? 'accurate' : '',
    possibleMisconception: !result.correct && result.confidence === 'i_know_this',
    skipped: Boolean(result.skipped),
    questionStartedAt: toDateLike(result.questionStartedAt),
    questionEndedAt: toDateLike(result.questionEndedAt) || timestamp,
    timestamp,
    workingExpected: Boolean(question.workingRequired || session.workingExpected),
    workingUploaded: Boolean(result.workingUploaded),
    workingOnPaper: Boolean(result.workingOnPaper),
    workingSubmitted: Boolean(result.workingSubmitted),
    workingSubmittedAt: toDateLike(result.workingSubmittedAt),
    workingImage: result.workingImage || '',
    workingStrokes: result.workingStrokes || [],
    workingMathObjects: result.workingMathObjects || [],
    workingNotNeeded: Boolean(result.workingNotNeeded),
    workingRequirementLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(result.workingRequirementLevel) ? result.workingRequirementLevel : '',
    fullscreenWorkingImage: result.fullscreenWorkingImage || '',
    fullscreenWorkingStrokes: result.fullscreenWorkingStrokes || [],
    fullscreenWorkingMathObjects: result.fullscreenWorkingMathObjects || [],
    fullscreenWorkingSubmitted: Boolean(result.fullscreenWorkingSubmitted),
    fullscreenWorkingSubmittedAt: toDateLike(result.fullscreenWorkingSubmittedAt),
    workingEvidence: result.workingEvidence || [],
    workingSessionId: result.workingSessionId || '',
    workingId: result.workingId || '',
  };
}

function mistakeSnapshot({ student, domainId, result, question, session, attempt, skillObjectId }) {
  const tag = result.skipped ? 'skipped_answer' : (result.misconceptionTag || 'practice_error');
  return {
    studentId: student._id,
    workspaceId: student.workspaceId,
    questionId: String(result.questionId || question.questionId || ''),
    sessionId: session.practiceSessionId,
    attemptId: attempt.attemptId,
    domainId,
    skillId: skillObjectId || null,
    skillCode: result.skillId || question.skillId || '',
    module: 'MathPath',
    questionText: result.prompt || question.prompt || question.stem || '',
    questionStem: result.prompt || question.prompt || question.stem || '',
    workedSolution: result.workedSolution || solutionText(question),
    studentAnswer: result.studentAnswer || '',
    correctAnswer: result.correctAnswer || '',
    answerCorrect: false,
    confidence: result.confidence || '',
    workingSubmitted: Boolean(result.workingSubmitted),
    workingOnPaper: Boolean(result.workingOnPaper),
    workingNotNeeded: Boolean(result.workingNotNeeded),
    workingSessionId: result.workingSessionId || '',
    workingId: result.workingId || result.workingSessionId || '',
    workingImage: result.workingImage || '',
    workingPreviewImage: result.workingPreviewImage || result.workingImage || '',
    workingStrokes: result.workingStrokes || [],
    timeTaken: result.timeTaken,
    mistakeCategory: result.skipped ? 'knowledge_gap' : 'conceptual_misconception',
    mistakeType: 'unknown',
    misconceptionTag: tag,
    source: 'practice-incorrect',
    status: 'open',
    nextAction: result.skipped
      ? 'Review the worked solution, then retry one similar question.'
      : 'Review the worked solution and working, then assign a similar question.',
    occurredAt: new Date(),
    timestamp: new Date(),
    createdAt: new Date(),
    auditTrail: [{
      event: 'mathpath_practice_mistake_created',
      domainId,
      at: new Date(),
    }],
  };
}

export async function persistDomainPracticeEvidence({
  student,
  domainId,
  session,
  scored = {},
  responses = [],
} = {}) {
  const questions = Array.isArray(session?.questions) ? session.questions : [];
  const byQuestionId = new Map(questions.map((q) => [String(q.questionId), q]));
  const responsesById = new Map((responses || []).filter((r) => r?.questionId != null).map((r) => [String(r.questionId), r]));
  const enrichedResults = (scored.results || []).map((result) => {
    const question = byQuestionId.get(String(result.questionId)) || {};
    return mergedResult({ result, question, response: responseFor(responsesById, result.questionId) });
  });
  const skillObjectIds = await resolveSkillObjectIds(enrichedResults.map((r) => r.skillId));

  const attempts = [];
  const mistakes = [];
  for (const result of enrichedResults.filter((r) => !r.error)) {
    const question = byQuestionId.get(String(result.questionId)) || {};
    const attemptId = result.attemptId || `attempt_${safeId(domainId)}_${safeId(session.practiceSessionId)}_${safeId(result.questionId)}`;
    const doc = attemptDoc({ student, domainId, session, result, question, attemptId });
    const attempt = await MathPathAttempt.findOneAndUpdate(
      { attemptId },
      { $setOnInsert: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    attempts.push(attempt);

    if (!result.correct && student?.workspaceId) {
      const sharedMistake = await Mistake.findOneAndUpdate(
        { studentId: student._id, attemptId, module: 'MathPath' },
        {
          $setOnInsert: mistakeSnapshot({
            student,
            domainId,
            result,
            question,
            session,
            attempt,
            skillObjectId: skillObjectIds.get(result.skillId) || null,
          }),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      mistakes.push(sharedMistake);
    }
  }

  await recordLearningEvents([
    ...enrichedResults.filter((r) => !r.error).map((result) => ({
      studentId: String(student._id),
      eventType: result.skipped ? 'question_skipped' : 'question_answered',
      domain: domainId,
      skillCode: result.skillId,
      questionId: result.questionId,
      sessionId: session.practiceSessionId,
      metadata: {
        answerCorrect: Boolean(result.correct),
        confidence: normalizeConfidence(result.confidence),
        timeTakenSeconds: result.timeTaken,
        workingSubmitted: Boolean(result.workingSubmitted),
        workingOnPaper: Boolean(result.workingOnPaper),
        workingNotNeeded: Boolean(result.workingNotNeeded),
      },
    })),
    {
      studentId: String(student._id),
      eventType: 'practice_completed',
      domain: domainId,
      sessionId: session.practiceSessionId,
      metadata: {
        total: scored.accuracySummary?.total || 0,
        correct: scored.accuracySummary?.correct || 0,
        accuracyPercentage: scored.accuracySummary?.accuracyPercentage || 0,
        attemptsPersisted: attempts.length,
        mistakesPersisted: mistakes.length,
      },
    },
  ]);

  return {
    results: enrichedResults,
    attemptsPersisted: attempts.length,
    sharedMistakesPersisted: mistakes.length,
  };
}

export default { persistDomainPracticeEvidence };
