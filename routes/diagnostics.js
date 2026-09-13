import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import {
  answerAdaptiveDiagnostic,
  startAdaptiveDiagnostic,
  scrubQuestionForClient,
} from '../services/diagnostics/diagnosticRuntime.js';
import {
  getDiagnosticDomain,
  listDiagnosticDomains,
} from '../services/diagnostics/diagnosticDomainRegistry.js';
import {
  getDiagnosticGrowth,
  getDiagnosticHistory,
} from '../services/diagnostics/diagnosticGrowthService.js';
import { getStudentRecheckSummary } from '../services/mathpath/studentRecheckSummaryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function sendDiagnosticError(res, err, fallback = 'Diagnostic request failed.') {
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || fallback,
    code: err.code,
    ...(err.payload || {}),
  });
}

router.get('/domains', protect, (req, res) => {
  res.json({ domains: listDiagnosticDomains() });
});

router.get('/history', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const history = await getDiagnosticHistory({
      studentId: String(student._id),
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, history });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load diagnostic history.');
  }
}));

router.get('/growth', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const growth = await getDiagnosticGrowth({
      studentId: String(student._id),
      subjectId,
      domainId,
      assignmentId: req.query.assignmentId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, ...growth });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load diagnostic growth.');
  }
}));

router.get('/recheck-summary/:sessionId', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
      assignmentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const summary = await getStudentRecheckSummary({
      studentId: String(student._id),
      diagnosticSessionId: req.params.sessionId,
      assignmentId,
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, diagnosticSessionId: req.params.sessionId, summary });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load recheck summary.');
  }
}));

// Returns any in-progress diagnostic session for the authenticated student so the
// frontend can resume after a tab close instead of getting a 409 on a fresh /start.
router.get('/in-progress', protect, asyncHandler(async (req, res) => {
  try {
    const { subjectId = 'math', domainId } = req.query;
    const student = await resolveStudent(req);
    const query = {
      studentId: String(student._id),
      status: 'inProgress',
    };
    if (subjectId) query.subjectId = subjectId;
    if (domainId) query.domainId = domainId;
    const session = await MathPathDiagnosticSession.findOne(query).sort({ createdAt: -1 });
    if (!session) return res.status(404).json({ code: 'NO_ACTIVE_SESSION', message: 'No in-progress diagnostic session.' });
    return res.json({
      sessionId: session.diagnosticSessionId,
      subjectId: session.subjectId,
      domainId: session.domainId,
      status: session.status,
      currentQuestionId: session.currentQuestionId,
      questionCount: session.questionIds?.length || 0,
      answeredCount: session.responses?.length || 0,
      resumable: true,
    });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to check for in-progress diagnostic.');
  }
}));

// Rehydrates an in-progress session so the student can resume after a tab close.
// Returns the minimal state needed to continue without triggering a fresh /start,
// which would hit the 409 DIAGNOSTIC_REPLAY_BLOCKED guard.
router.get('/:sessionId/resume', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
    });
    if (!session) {
      return res.status(404).json({ code: 'SESSION_NOT_FOUND', error: 'Diagnostic session not found.' });
    }
    if (String(session.studentId) !== String(student._id)) {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'This diagnostic session belongs to a different student.' });
    }
    if (session.status === 'completed') {
      return res.status(409).json({
        code: 'SESSION_COMPLETED',
        error: 'This diagnostic session is already completed.',
        result: session.result || {},
      });
    }
    const adaptiveState = session.adaptiveState || {};
    const attemptedIds = new Set((adaptiveState.attemptedQuestionIds || []).map(String));
    const remainingQuestionIds = (adaptiveState.candidateQuestionIds || []).filter(
      (id) => !attemptedIds.has(String(id))
    );

    // Attempt to load the current question object so the frontend can render it
    // immediately without a separate fetch.
    let currentQuestion = null;
    if (session.currentQuestionId) {
      try {
        const domain = getDiagnosticDomain({
          subjectId: session.subjectId || 'math',
          domainId: session.domainId,
        });
        const questionDoc = await domain.getQuestionById(session.currentQuestionId);
        if (questionDoc) {
          // Scrub the answer — the resume payload renders this question for the
          // student to answer, so it must not carry its own solution.
          currentQuestion = scrubQuestionForClient(domain.normaliseQuestion(questionDoc, questionDoc.skillId));
        }
      } catch (_) {
        // Non-fatal: frontend will display a fallback if currentQuestion is null.
      }
    }

    return res.json({
      sessionId: session.diagnosticSessionId,
      subjectId: session.subjectId,
      domainId: session.domainId,
      diagnosticPurpose: session.diagnosticPurpose,
      mode: session.mode,
      studentLevel: session.studentLevel,
      status: session.status,
      currentQuestionId: session.currentQuestionId,
      currentSkillId: session.currentSkillId,
      currentQuestion,
      answeredCount: adaptiveState.answeredCount || 0,
      estimatedQuestionCount: adaptiveState.maxQuestions || 10,
      remainingQuestionIds,
      responses: adaptiveState.responses || [],
    });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to resume diagnostic session.');
  }
}));

// Abandons an in-progress diagnostic so the next entry starts a fresh session
// from question 1. Product decision: an interrupted/exited check-in must RESET —
// progress is discarded, not resumed. Mirrors the PSL abandon pattern
// (PATCH /psl/sessions/:id/abandon).
router.patch('/:sessionId/abandon', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
    });
    if (!session) {
      return res.status(404).json({ code: 'SESSION_NOT_FOUND', error: 'Diagnostic session not found.' });
    }
    if (String(session.studentId) !== String(student._id)) {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'This diagnostic session belongs to a different student.' });
    }
    if (session.status !== 'completed') {
      session.status = 'abandoned';
      await session.save();
    }
    return res.json({ ok: true, sessionId: session.diagnosticSessionId, status: session.status });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to abandon diagnostic session.');
  }
}));

router.post('/start', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      startSkillId = '',
      requestedMode,
      mode,
      studentLevel,
      diagnosticPurpose,
    } = req.body || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req);
    const payload = await startAdaptiveDiagnostic({
      student,
      userId: req.user.id,
      subjectId,
      domainId,
      startSkillId,
      requestedMode: requestedMode || mode,
      studentLevel,
      diagnosticPurpose,
    });
    return res.json(payload);
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to start diagnostic.');
  }
}));

router.post('/:sessionId/answer', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await answerAdaptiveDiagnostic({
      student,
      sessionId: req.params.sessionId,
      body: req.body || {},
    });
    return res.json(payload);
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to process diagnostic answer.');
  }
}));

export default router;
