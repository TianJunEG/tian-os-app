import express from 'express';
import fs from 'fs/promises';
import Worksheet from '../models/Worksheet.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import uploadWorksheet from '../middleware/uploadWorksheet.js';
import { analyzeAndGenerateWorksheet, markAnswers, generateReinforcement } from '../utils/aiService.js';
import { SESSION_OFFSETS, buildSessions, recomputeSchedule } from '../utils/practiceSchedule.js';
import { buildReinforcementWorksheet } from '../utils/reinforcement.js';
import { applyMarks } from '../utils/marking.js';
import { canViewWorksheet, redactWorksheetForViewer } from '../utils/worksheetAccess.js';
import { logDiagnosedMisconceptions } from '../utils/misconceptionLog.js';
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';

const router = express.Router();

// Map any failure to a safe HTTP response. Critically, never return 401/403 here:
// the frontend axios interceptor force-logs-out on 401, and an upstream AI auth
// error is a server config problem, not the user's session expiring.
function sendAiError(res, err) {
  console.error('Worksheet generation error:', err.status || '', err.message);
  let status = err.status || 500;
  let message = err.message || 'Failed to generate worksheet';

  if (status === 401 || status === 403) {
    status = 503;
    message = 'The AI service is unavailable right now. Please try again later.';
  } else if (status === 429) {
    message = 'The AI service is busy. Please try again in a moment.';
  } else if (status === 413) {
    status = 400;
    message = 'The image is too large to analyze. Try a smaller or clearer photo.';
  } else if (status >= 500 && status !== 502 && status !== 503) {
    status = 502;
    message = 'The AI service had a problem. Please try again.';
  }
  return res.status(status).json({ error: message });
}

// @route   POST /api/worksheets/generate
// @desc    Upload a photo of marked math work; diagnose misconceptions and
//          generate spaced practice sessions of targeted questions.
// @access  Private (tutor or parent)
router.post(
  '/generate',
  protect,
  authorize('tutor', 'parent'),
  uploadWorksheet.single('work'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a photo of the marked work.' });
    }

    const { studentName, gradeLevel, topicHint, questionsPerSession, studentId } = req.body;
    const perSession = Math.min(Math.max(parseInt(questionsPerSession, 10) || 5, 2), 6);
    const totalQuestions = perSession * SESSION_OFFSETS.length;

    try {
      let assignedStudent = null;
      if (studentId) {
        assignedStudent = await User.findOne({ _id: studentId, linkedTo: req.user.id, role: 'student' });
        if (!assignedStudent) {
          return res.status(400).json({ error: 'Invalid student selection.' });
        }
      }

      const buffer = await fs.readFile(req.file.path);
      const imageBase64 = buffer.toString('base64');

      const result = await analyzeAndGenerateWorksheet({
        imageBase64,
        mimeType: req.file.mimetype,
        gradeLevel,
        topicHint,
        numQuestions: totalQuestions
      });

      const practiceSessions = buildSessions(result.questions);

      const worksheet = new Worksheet({
        userId: req.user.id,
        studentId: assignedStudent ? assignedStudent._id : null,
        studentName: studentName ? String(studentName).slice(0, 100) : assignedStudent?.name,
        subject: 'Math',
        topic: result.topic,
        gradeLevel,
        sourceImageUrl: `/uploads/worksheets/${req.file.filename}`,
        overallSummary: result.overallSummary,
        misconceptions: Array.isArray(result.misconceptions) ? result.misconceptions : [],
        skillsToReinforce: Array.isArray(result.skillsToReinforce) ? result.skillsToReinforce : [],
        practiceSessions
      });
      recomputeSchedule(worksheet);
      await worksheet.save();

      // Log the diagnosed misconceptions against this student (best-effort —
      // never fail the worksheet if this write has a problem).
      try {
        await logDiagnosedMisconceptions({
          result,
          ownerUserId: req.user.id,
          studentUserId: assignedStudent ? assignedStudent._id : null,
          studentName: worksheet.studentName || '',
          worksheetId: worksheet._id,
        });
      } catch (logErr) {
        console.error('Diagnosed-misconception logging failed (non-fatal):', logErr.message);
      }

      return res.status(201).json({
        success: true,
        worksheet,
        readable: result.readable !== false,
        modelUsed: result.modelUsed,
        escalated: result.escalated
      });
    } catch (err) {
      return sendAiError(res, err);
    }
  }
);

// @route   GET /api/worksheets
// @desc    List the current user's worksheets with due-status fields
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'student'
      ? { studentId: req.user.id }
      : { userId: req.user.id };
    if (req.user.role !== 'student' && req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const worksheets = await Worksheet.find(filter)
      .select('studentName studentId subject topic gradeLevel overallSummary nextDueAt sessionsTotal sessionsCompleted createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, count: worksheets.length, worksheets });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/worksheets/mistakes
// @desc    Aggregate every incorrectly-answered question (a student's own, or
//          all of a parent/tutor's — optionally filtered by ?studentId).
// @access  Private
router.get('/mistakes', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'student'
      ? { studentId: req.user.id }
      : { userId: req.user.id };
    if (req.user.role !== 'student' && req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const worksheets = await Worksheet.find(filter).sort({ createdAt: -1 }).limit(100);

    const mistakes = [];
    for (const w of worksheets) {
      for (const session of w.practiceSessions) {
        for (const q of session.questions) {
          if (q.correct === false) {
            mistakes.push({
              worksheetId: w._id,
              topic: w.topic,
              studentName: w.studentName,
              sessionNumber: session.sessionNumber,
              prompt: q.prompt,
              answer: q.answer,
              studentResponse: q.studentResponse,
              feedback: q.feedback,
              misconception: q.targetsMisconception,
              markedAt: q.markedAt
            });
          }
        }
      }
    }
    mistakes.sort((a, b) => new Date(b.markedAt || 0) - new Date(a.markedAt || 0));

    return res.json({ success: true, count: mistakes.length, mistakes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/worksheets/misconceptions
// @desc    The AI-diagnosed misconceptions logged from photo analysis — a
//          student's own, or all of a parent/tutor's (optionally ?studentId).
// @access  Private
router.get('/misconceptions', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'student'
      ? { studentUserId: req.user.id }
      : { ownerUserId: req.user.id };
    if (req.user.role !== 'student' && req.query.studentId) {
      filter.studentUserId = req.query.studentId;
    }
    const misconceptions = await DiagnosedMisconception.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ success: true, count: misconceptions.length, misconceptions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/worksheets/:id
// @desc    Get a single worksheet with all practice sessions
// @access  Private (owner or assigned student)
router.get('/:id', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet || !canViewWorksheet(worksheet, req.user.id)) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, worksheet: redactWorksheetForViewer(worksheet, req.user.id) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/worksheets/:id/sessions/:n
// @desc    Reschedule a practice session and/or mark it complete
// @access  Private (owner only)
router.patch('/:id/sessions/:n', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findOne({ _id: req.params.id, userId: req.user.id });
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }

    const sessionNumber = parseInt(req.params.n, 10);
    const session = worksheet.practiceSessions.find((s) => s.sessionNumber === sessionNumber);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }

    if (req.body.scheduledFor !== undefined) {
      const date = new Date(req.body.scheduledFor);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      session.scheduledFor = date;
    }

    if (req.body.completed !== undefined) {
      session.completed = !!req.body.completed;
      session.completedAt = session.completed ? new Date() : null;
    }

    recomputeSchedule(worksheet);
    worksheet.updatedAt = new Date();
    await worksheet.save();

    return res.json({ success: true, worksheet });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/worksheets/:id/sessions/:n/mark
// @desc    Mark a student's typed/handwritten answers for a session, then
//          auto-complete it. Returns the marked worksheet + missed misconceptions.
// @access  Private (owner only)
router.post('/:id/sessions/:n/mark', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet || !canViewWorksheet(worksheet, req.user.id)) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }

    const sessionNumber = parseInt(req.params.n, 10);
    const session = worksheet.practiceSessions.find((s) => s.sessionNumber === sessionNumber);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const items = [];

    for (const a of answers) {
      const i = parseInt(a.questionIndex, 10);
      const q = session.questions[i];
      if (!q) continue;

      if (a.type === 'image' && typeof a.imageDataUrl === 'string') {
        const match = a.imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
        if (!match) continue;
        items.push({ index: i, prompt: q.prompt, correctAnswer: q.answer, type: 'image', mimeType: match[1], imageBase64: match[2] });
        q.studentResponseType = 'image';
      } else {
        const text = typeof a.text === 'string' ? a.text.trim() : '';
        if (!text) continue;
        items.push({ index: i, prompt: q.prompt, correctAnswer: q.answer, type: 'text', text });
        q.studentResponseType = 'text';
        q.studentResponse = text;
      }
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'No answers were submitted to mark.' });
    }

    const { results, modelUsed, escalated } = await markAnswers({ items });
    applyMarks(session, results);
    recomputeSchedule(worksheet);
    worksheet.updatedAt = new Date();
    await worksheet.save();

    const missedMisconceptions = [
      ...new Set(
        session.questions
          .filter((q) => q.correct === false && q.targetsMisconception)
          .map((q) => q.targetsMisconception)
      )
    ];

    return res.json({ success: true, worksheet: redactWorksheetForViewer(worksheet, req.user.id), score: session.score, missedMisconceptions, modelUsed, escalated });
  } catch (err) {
    return sendAiError(res, err);
  }
});

// @route   POST /api/worksheets/:id/reinforce
// @desc    Generate a new spaced practice plan targeting the same (or missed)
//          misconceptions — no new photo needed.
// @access  Private (owner only)
router.post('/:id/reinforce', protect, async (req, res) => {
  try {
    const source = await Worksheet.findOne({ _id: req.params.id, userId: req.user.id });
    if (!source) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }

    let misconceptions = source.misconceptions || [];
    if (Array.isArray(req.body.misconceptionTitles) && req.body.misconceptionTitles.length) {
      const wanted = new Set(req.body.misconceptionTitles);
      const filtered = misconceptions.filter((m) => wanted.has(m.title));
      if (filtered.length) misconceptions = filtered;
    }

    const perSession = Math.min(Math.max(parseInt(req.body.questionsPerSession, 10) || 5, 2), 6);
    const totalQuestions = perSession * SESSION_OFFSETS.length;

    const questions = await generateReinforcement({
      topic: source.topic,
      misconceptions,
      gradeLevel: source.gradeLevel,
      numQuestions: totalQuestions
    });

    const worksheet = new Worksheet(
      buildReinforcementWorksheet({ source, userId: req.user.id, misconceptions, questions })
    );
    recomputeSchedule(worksheet);
    await worksheet.save();

    return res.status(201).json({ success: true, worksheet });
  } catch (err) {
    return sendAiError(res, err);
  }
});

// @route   DELETE /api/worksheets/:id
// @desc    Delete a worksheet
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, message: 'Worksheet deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
