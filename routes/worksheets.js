import express from 'express';
import Worksheet from '../models/Worksheet.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Mistake from '../models/Mistake.js';
import { protect, authorize } from '../middleware/auth.js';
import uploadWorksheet from '../middleware/uploadWorksheet.js';
import { analyzeAndGenerateWorksheet, markAnswers, generateReinforcement } from '../utils/aiService.js';
import { SESSION_OFFSETS, recomputeSchedule } from '../utils/practiceSchedule.js';
import { buildReinforcementWorksheet } from '../utils/reinforcement.js';
import { canViewWorksheet, redactWorksheetForViewer } from '../utils/worksheetAccess.js';
import { getQueue, isQueueEnabled, QUEUE_NAMES } from '../config/queue.js';
import { photoWorksheetFields, logPhotoMisconceptions } from '../services/worksheets/photoWorksheet.js';
import { buildMarkItems, missedMisconceptions, applyMarkResults } from '../services/worksheets/markSession.js';
import { persistUploadFile } from '../services/storage/objectStore.js';
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';
import { commonMistakes } from '../utils/commonMistakes.js';
import { resolveStudent } from '../utils/studentContext.js';
import { generateWorksheet } from '../utils/worksheetGen.js';
import { isCorrectWithContext } from '../utils/answerCheck.js';
import { recordAttempt } from '../utils/masteryEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import LearningResult from '../models/LearningResult.js';

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
  authorize('tutor', 'parent', 'teacher'),
  uploadWorksheet.single('work'),
  async (req, res) => {
    if (!req.file) {
      return generateStructuredWorksheet(req, res);
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

      const imageBase64 = req.file.buffer.toString('base64');
      const { fileUrl: sourceImageUrl } = await persistUploadFile(req.file, 'worksheets');
      const studentUserId = assignedStudent ? assignedStudent._id : null;
      const resolvedStudentName = studentName ? String(studentName).slice(0, 100) : assignedStudent?.name;
      const base = {
        userId: req.user.id,
        studentId: studentUserId,
        studentName: resolvedStudentName,
        subject: 'Math',
        gradeLevel,
        sourceImageUrl,
      };

      // Async path: create a pending worksheet, hand the photo to the worker, and
      // return 202 so the request doesn't block on the 5-30s AI call. The client
      // polls GET /:id until generationStatus becomes 'ready'/'failed'.
      const queue = isQueueEnabled() ? getQueue(QUEUE_NAMES.worksheetGenerate) : null;
      if (queue) {
        let pending = null;
        try {
          pending = await Worksheet.create({ ...base, generationStatus: 'pending', practiceSessions: [] });
          await queue.add('run', {
            worksheetId: String(pending._id),
            imageBase64,
            mimeType: req.file.mimetype,
            gradeLevel,
            topicHint,
            totalQuestions,
            ownerUserId: String(req.user.id),
            studentUserId: studentUserId ? String(studentUserId) : null,
            studentName: resolvedStudentName,
          });
          return res.status(202).json({ success: true, worksheet: pending, queued: true });
        } catch (queueErr) {
          // Enqueue failed — drop the orphan pending doc and run inline instead.
          console.error('Worksheet enqueue failed, running inline:', queueErr.message);
          if (pending) await Worksheet.findByIdAndDelete(pending._id).catch(() => {});
        }
      }

      // Synchronous path (queue disabled or enqueue failed) — unchanged behaviour.
      const result = await analyzeAndGenerateWorksheet({
        imageBase64,
        mimeType: req.file.mimetype,
        gradeLevel,
        topicHint,
        numQuestions: totalQuestions
      });
      const worksheet = new Worksheet({ ...base, ...photoWorksheetFields(result) });
      recomputeSchedule(worksheet);
      await worksheet.save();
      await logPhotoMisconceptions({
        result,
        ownerUserId: req.user.id,
        studentUserId,
        studentName: worksheet.studentName || '',
        worksheetId: worksheet._id,
      });

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

async function generateStructuredWorksheet(req, res) {
  try {
    const student = await resolveStudent(req, req.body.studentId, { write: true });
    const {
      worksheetType = 'recommended',
      mode = worksheetType,
      domain = 'fractions',
      generatedFor = null,
      skillIds = [],
      topicId = null,
      misconceptionTag = '',
      difficulty = 'medium',
      questionCount = 10,
      includesSolutions = true,
      includesMistakeReview = true,
      subject: subjectInput,
    } = req.body;
    const subject = /^science$/i.test(String(subjectInput || '')) ? 'Science' : 'Math';
    const generated = await generateWorksheet({
      mode,
      worksheetType,
      studentId: student._id,
      studentName: student.name,
      skillIds,
      topicId,
      misconceptionTag,
      difficulty,
      questionCount,
      includesSolutions,
      includesMistakeReview,
      subject,
      domain,
      generatedFor,
    });
    if (!generated.content.questions.length) {
      return res.status(400).json({ error: structuredEmptyMessage(generated.sourceMode) });
    }
    const worksheet = await Worksheet.create({
      userId: req.user.id,
      studentId: student._id,
      studentName: student.name,
      subject,
      workspaceId: student.workspaceId,
      generatedByUserId: req.user.id,
      generatedByRole: req.user.role || 'parent',
      generatedFor: generatedFor || { studentId: student._id, studentName: student.name },
      worksheetType: generated.worksheetType,
      domain,
      topicIds: generated.topicIds,
      skillIds: generated.skillIds,
      sourceMode: generated.sourceMode,
      difficulty,
      questionCount,
      estimatedMinutes: generated.estimatedMinutes,
      includesSolutions,
      includesMistakeReview,
      generatedContent: generated.content,
      answerKey: generated.answerKey,
      assignedStatus: 'unassigned',
    });
    return res.status(201).json({ success: true, worksheet: shapeStructuredWorksheet(worksheet) });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to generate worksheet.' });
  }
}

function structuredEmptyMessage(sourceMode) {
  if (sourceMode === 'recommended') return 'Great work. No recommended worksheet is needed right now.';
  if (sourceMode === 'fluency') return 'Your fluency practice worksheet will appear when a skill enters fluency training.';
  if (sourceMode === 'retention') return 'Retention review worksheets will appear when review dates are scheduled.';
  return 'No questions available for the selected skills yet. Seed the question bank or pick another topic.';
}

// @route   GET /api/worksheets
// @desc    List the current user's worksheets with due-status fields
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
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
}));

// @route   GET /api/worksheets/mistakes
// @desc    Aggregate every incorrectly-answered question (a student's own, or
//          all of a parent/tutor's — optionally filtered by ?studentId).
// @access  Private
router.get('/mistakes', protect, asyncHandler(async (req, res) => {
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
}));

// @route   GET /api/worksheets/misconceptions
// @desc    The AI-diagnosed misconceptions logged from photo analysis — a
//          student's own, or all of a parent/tutor's (optionally ?studentId).
// @access  Private
router.get('/misconceptions', protect, asyncHandler(async (req, res) => {
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
}));

// @route   GET /api/worksheets/common-mistakes
// @desc    The misconceptions that recur most across a parent/tutor/teacher's
//          students (optionally one student via ?studentId, or one ?topic).
// @access  Private (not students)
router.get('/common-mistakes', protect, asyncHandler(async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'The common-mistakes view is for parents, tutors and teachers.' });
    }
    const rows = await commonMistakes({
      ownerUserId: req.user.id,
      studentUserId: req.query.studentId || null,
      topic: req.query.topic || null,
      limit: req.query.limit,
    });
    return res.json({ success: true, count: rows.length, commonMistakes: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}));

// @route   GET /api/worksheets/:id/answers
// @desc    Answer key for a generated worksheet
// @access  Private (owner/adult only)
router.get('/:id/answers', protect, asyncHandler(async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet || !worksheet.sourceMode) return res.status(404).json({ error: 'Worksheet not found' });
    await resolveStudent(req, worksheet.studentId);
    return res.json({ worksheetId: worksheet._id, answerKey: worksheet.answerKey || worksheet.generatedContent?.answerKey || [] });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load answer key.' });
  }
}));

// @route   GET /api/worksheets/:id/pdf
// @desc    Lightweight printable PDF export for generated worksheets
// @access  Private
router.get('/:id/pdf', protect, asyncHandler(async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet || !worksheet.sourceMode) return res.status(404).json({ error: 'Worksheet not found' });
    await resolveStudent(req, worksheet.studentId);
    const includeAnswers = String(req.query.answers || '') === '1';
    const pdf = createWorksheetPdf(worksheet, { includeAnswers });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${String(worksheet.generatedContent?.title || 'worksheet').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to export worksheet PDF.' });
  }
}));

// @route   POST /api/worksheets/:id/submit
// @desc    Submit answers for a generated worksheet and update mastery
// @access  Private
router.post('/:id/submit', protect, asyncHandler(async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (!worksheet || !worksheet.sourceMode) return res.status(404).json({ error: 'Worksheet not found' });
    const student = await resolveStudent(req, worksheet.studentId, { write: true });
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (!answers.length) return res.status(400).json({ error: 'Submit at least one answer.' });

    const answerByKey = new Map();
    answers.forEach((answer) => {
      if (answer.questionId) answerByKey.set(String(answer.questionId), answer);
      if (answer.n) answerByKey.set(`n:${answer.n}`, answer);
    });

    const questions = worksheet.generatedContent?.questions || [];
    const results = [];
    let correctCount = 0;
    const improved = new Set();
    const workingSubmitted = answers.some((answer) => answer.workingSubmitted || answer.workingUploaded || answer.fullscreenWorkingSubmitted);

    for (const q of questions) {
      const submitted = answerByKey.get(String(q.questionId)) || answerByKey.get(`n:${q.n}`) || {};
      if (submitted.answer === undefined && submitted.text === undefined) continue;
      const response = String(submitted.answer ?? submitted.text ?? '').trim();
      const correct = isCorrectWithContext(response, q.answer, q.stem);
      if (correct) {
        correctCount += 1;
        if (q.skillId) improved.add(String(q.skillId));
      }
      q.studentAnswer = response;
      q.correct = correct;
      q.markedAt = new Date();
      results.push({ n: q.n, questionId: String(q.questionId), answer: response, correct, expected: q.answer, skillId: q.skillId });
      if (q.skillId) {
        await recordAttempt({
          studentId: student._id,
          skillId: q.skillId,
          workspaceId: student.workspaceId,
          correct,
          module: 'Mastery Worksheet',
          subject: worksheet.subject || 'Math',
        });
      }
      if (!correct && q.questionId && q.skillId) {
        await Mistake.create({
          studentId: student._id,
          workspaceId: student.workspaceId,
          questionId: q.questionId,
          skillId: q.skillId,
          module: 'Mastery Worksheet',
          questionStem: q.stem,
          workedSolution: q.workedSolution || '',
          studentAnswer: response,
          correctAnswer: q.answer,
          source: 'practice-incorrect',
          status: 'open',
        });
      }
    }

    const attempted = results.length;
    const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;
    const now = new Date();
    worksheet.completion = {
      startedAt: worksheet.completion?.startedAt || now,
      completedAt: now,
      accuracy,
      skillsImproved: [...improved],
      workingSubmitted,
    };
    worksheet.sessionsCompleted = 1;
    worksheet.sessionsTotal = 1;
    worksheet.updatedAt = now;
    await worksheet.save();

    const startedAt = worksheet.completion.startedAt;
    const minutes = startedAt ? Math.max(1, Math.round((now - new Date(startedAt)) / 60000)) : 1;
    await LearningResult.create({
      user: student._id,
      source: 'worksheet',
      subject: worksheet.subject || 'emath',
      topic: worksheet.domain || worksheet.topic || 'general',
      accuracy,
      mastered: accuracy >= 85,
      minutes,
    }).catch(() => {});

    if (worksheet.linkedAssignmentId) {
      await Assignment.findByIdAndUpdate(worksheet.linkedAssignmentId, {
        status: 'completed',
        completionDate: now,
        score: accuracy,
        'timestamps.completedAt': now,
      });
    }

    return res.json({
      success: true,
      worksheetId: worksheet._id,
      accuracy,
      correctAnswers: correctCount,
      totalAnswered: attempted,
      skillsImproved: [...improved],
      workingSubmitted,
      results,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to submit worksheet.' });
  }
}));

// @route   GET /api/worksheets/:id
// @desc    Get a single worksheet with all practice sessions
// @access  Private (owner or assigned student)
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);
    if (worksheet?.sourceMode) {
      await resolveStudent(req, worksheet.studentId);
      return res.json({ success: true, worksheet: shapeStructuredWorksheet(worksheet) });
    }
    if (!worksheet || !canViewWorksheet(worksheet, req.user.id)) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, worksheet: redactWorksheetForViewer(worksheet, req.user.id) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}));

function shapeStructuredWorksheet(w) {
  return {
    id: w._id,
    worksheetId: w._id,
    title: w.generatedContent?.title || 'Worksheet',
    generatedFor: w.generatedFor || { studentId: w.studentId, studentName: w.studentName },
    generatedBy: { userId: w.generatedByUserId || w.userId, role: w.generatedByRole },
    worksheetType: w.worksheetType || w.sourceMode,
    domain: w.domain || 'fractions',
    studentName: w.studentName,
    subject: w.subject,
    skillIds: w.skillIds,
    skills: w.generatedContent?.skillNames || [],
    questionCount: w.questionCount,
    estimatedMinutes: w.estimatedMinutes,
    difficulty: w.difficulty,
    createdAt: w.createdAt,
    completion: w.completion || null,
    answerKey: w.answerKey || w.generatedContent?.answerKey || [],
    content: w.generatedContent,
  };
}

function pdfEscape(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function createWorksheetPdf(worksheet, { includeAnswers = false } = {}) {
  const c = worksheet.generatedContent || {};
  const sectionLines = Array.isArray(c.sections) && c.sections.length
    ? c.sections.flatMap((section) => [
      section.title || 'Practice Section',
      ...(section.questions || []).flatMap((q) => [
        `${q.n}. ${q.stem}`,
        q.visual || q.diagramSpec ? 'Diagram/model: included in digital worksheet preview.' : '',
        'Working: ________________________________',
        '__________________________________________',
        '',
      ]),
    ])
    : (c.questions || []).flatMap((q) => [
      `${q.n}. ${q.stem}`,
      'Working: ________________________________',
      '__________________________________________',
      '',
    ]);
  const lines = [
    c.title || 'Worksheet',
    `Student: ${worksheet.studentName || c.studentName || ''}`,
    `Date generated: ${new Date(worksheet.createdAt || Date.now()).toLocaleDateString('en-SG')}`,
    ...(c.skillNames?.length ? [`Skills targeted: ${c.skillNames.join(', ')}`] : []),
    ...(worksheet.interventionRationale?.whyGenerated ? [`Why this worksheet: ${worksheet.interventionRationale.whyGenerated}`] : []),
    '',
    ...sectionLines,
    ...(c.reflection?.prompt ? ['Reflection', c.reflection.prompt, '__________________________________________', ''] : []),
  ];
  if (includeAnswers) {
    lines.push('Answer Key', ...(worksheet.answerKey || c.answerKey || []).map((row) => `${row.n}. ${row.answer}${row.workedSolution || row.explanation ? ` - ${row.workedSolution || row.explanation}` : ''}`));
  }
  const content = ['BT', '/F1 12 Tf', '50 790 Td']
    .concat(lines.slice(0, 55).flatMap((line, index) => [
      index === 0 ? '/F1 18 Tf' : index === 1 ? '/F1 12 Tf' : '',
      `(${pdfEscape(line).slice(0, 92)}) Tj`,
      '0 -16 Td',
    ]))
    .concat(['ET'])
    .filter(Boolean)
    .join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${obj}\n`;
  });
  const xrefAt = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return Buffer.from(pdf);
}

// @route   PATCH /api/worksheets/:id/sessions/:n
// @desc    Reschedule a practice session and/or mark it complete
// @access  Private (owner only)
router.patch('/:id/sessions/:n', protect, asyncHandler(async (req, res) => {
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
}));

// @route   POST /api/worksheets/:id/sessions/:n/mark
// @desc    Mark a student's typed/handwritten answers for a session, then
//          auto-complete it. Returns the marked worksheet + missed misconceptions.
// @access  Private (owner only)
router.post('/:id/sessions/:n/mark', protect, asyncHandler(async (req, res) => {
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
    const items = buildMarkItems(session, answers);

    if (items.length === 0) {
      return res.status(400).json({ error: 'No answers were submitted to mark.' });
    }

    // Async path: hand the 3-15s AI marking to the worker, return 202; the client
    // polls GET /:id for the session's markingStatus / score.
    const queue = isQueueEnabled() ? getQueue(QUEUE_NAMES.markAnswers) : null;
    if (queue) {
      try {
        session.markingStatus = 'marking';
        await worksheet.save();
        await queue.add('run', { worksheetId: String(worksheet._id), sessionNumber, answers });
        return res.status(202).json({ success: true, queued: true, worksheetId: String(worksheet._id), sessionNumber });
      } catch (queueErr) {
        console.error('Mark enqueue failed, running inline:', queueErr.message);
        session.markingStatus = 'idle';
        await worksheet.save().catch(() => {});
      }
    }

    // Synchronous path (queue disabled or enqueue failed) — unchanged behaviour.
    const { results, modelUsed, escalated } = await markAnswers({ items });
    applyMarkResults(worksheet, session, results);
    await worksheet.save();

    return res.json({
      success: true,
      worksheet: redactWorksheetForViewer(worksheet, req.user.id),
      score: session.score,
      missedMisconceptions: missedMisconceptions(session),
      modelUsed,
      escalated,
    });
  } catch (err) {
    return sendAiError(res, err);
  }
}));

// @route   POST /api/worksheets/:id/reinforce
// @desc    Generate a new spaced practice plan targeting the same (or missed)
//          misconceptions — no new photo needed.
// @access  Private (owner only)
router.post('/:id/reinforce', protect, asyncHandler(async (req, res) => {
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

    // Async path: create a pending reinforcement worksheet (source-derived fields,
    // no questions yet), enqueue, and return 202; the client polls generationStatus.
    const queue = isQueueEnabled() ? getQueue(QUEUE_NAMES.reinforce) : null;
    if (queue) {
      let pending = null;
      try {
        pending = await Worksheet.create({
          ...buildReinforcementWorksheet({ source, userId: req.user.id, misconceptions, questions: [] }),
          generationStatus: 'pending',
        });
        await queue.add('run', {
          worksheetId: String(pending._id),
          topic: source.topic,
          misconceptions,
          gradeLevel: source.gradeLevel,
          totalQuestions,
        });
        return res.status(202).json({ success: true, worksheet: pending, queued: true });
      } catch (queueErr) {
        console.error('Reinforcement enqueue failed, running inline:', queueErr.message);
        if (pending) await Worksheet.findByIdAndDelete(pending._id).catch(() => {});
      }
    }

    // Synchronous path (queue disabled or enqueue failed) — unchanged behaviour.
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
}));

// @route   DELETE /api/worksheets/:id
// @desc    Delete a worksheet
// @access  Private (owner only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const worksheet = await Worksheet.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, message: 'Worksheet deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}));

export default router;
