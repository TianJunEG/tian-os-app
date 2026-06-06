import express from 'express';
import Worksheet from '../models/Worksheet.js';
import Assignment from '../models/Assignment.js';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import { generateWorksheet } from '../utils/worksheetGen.js';
import {
  generateInterventionWorksheet,
  getInterventionWorksheetHistory,
} from '../services/mathpath/worksheetGenerationEngine.js';

// Structured (non-photo) Mastery Worksheet Generator. Mounted at
// /api/worksheets/gen so the legacy photo flow in routes/worksheets.js is
// untouched. Stores STRUCTURED content (never PDF-only).
const router = express.Router();

// @route POST /api/worksheets/gen/generate
// @desc  body: { studentId, mode(recent_mistakes|weak_skills|diagnostic_results|selected_topic),
//        skillIds[]?, topicId?, difficulty?, questionCount?, includesSolutions?, includesMistakeReview? }
// @access Private
router.post('/generate', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body.studentId);
    const {
      mode = 'recommended', worksheetType = '', domain = 'fractions', generatedFor = null,
      skillIds = [], topicId = null,
      misconceptionTag = '',
      difficulty = 'medium', questionCount = 10,
      includesSolutions = true, includesMistakeReview = false,
      subject: subjectInput,
    } = req.body;

    // Normalize the subject so 'science'/'Science' both resolve, and anything
    // else falls back to Math (the historical default).
    const subject = /^science$/i.test(String(subjectInput || '')) ? 'Science' : 'Math';

    const { skillIds: targetSkillIds, topicIds, content, answerKey, sourceMode, estimatedMinutes, worksheetType: resolvedWorksheetType } = await generateWorksheet({
      mode, studentId: student._id, studentName: student.name,
      skillIds, topicId, misconceptionTag, difficulty, questionCount, includesSolutions, includesMistakeReview,
      subject, worksheetType, domain, generatedFor,
    });

    if (!content.questions.length) {
      return res.status(400).json({ error: emptyMessage(sourceMode) || 'No questions available for the selected skills yet. Seed the question bank or pick another topic.' });
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
      topicIds, skillIds: targetSkillIds,
      sourceMode, worksheetType: resolvedWorksheetType, domain, difficulty, questionCount, estimatedMinutes,
      includesSolutions, includesMistakeReview,
      generatedContent: content,
      answerKey,
      assignedStatus: 'unassigned',
    });

    res.status(201).json({ worksheet: shape(worksheet) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to generate worksheet.' });
  }
});

// @route POST /api/worksheets/gen/intervention
// @desc  Generate an intervention-driven worksheet from diagnostic, Recovery Pack,
//        paper analysis, tutor lesson, student care intervention, parent support,
//        or manual skill selection evidence.
// @access Private
router.post('/intervention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body?.studentId);
    const result = await generateInterventionWorksheet({
      studentId: student._id,
      sourceType: req.body?.sourceType || 'manual',
      sourceId: req.body?.sourceId || '',
      skillIds: req.body?.skillIds || [],
      worksheetType: req.body?.worksheetType || '',
      questionCount: req.body?.questionCount || 12,
      generatedByUserId: req.user?.id || req.user?._id,
      generatedByRole: req.user?.role || 'system',
      subject: /^science$/i.test(String(req.body?.subject || '')) ? 'Science' : 'Math',
      domain: req.body?.domain || 'fractions',
      generatedFor: req.body?.generatedFor || null,
      difficulty: req.body?.difficulty || 'adaptive',
      includeReflection: req.body?.includeReflection !== false,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to generate intervention worksheet.' });
  }
});

// @route GET /api/worksheets/gen/intervention/history?studentId=&sourceType=&sourceId=
// @access Private
router.get('/intervention/history', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.query?.studentId);
    const worksheets = await getInterventionWorksheetHistory({
      studentId: student._id,
      sourceType: req.query?.sourceType || '',
      sourceId: req.query?.sourceId || '',
    });
    return res.json({ worksheets });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load intervention worksheet history.' });
  }
});

// @route GET /api/worksheets/gen?studentId=
// @desc  List generated (structured) worksheets for a student.
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const list = await Worksheet.find({ studentId: student._id, sourceMode: { $ne: null } }).sort({ createdAt: -1 }).limit(50);
    res.json({ worksheets: list.map(shapeSummary) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load worksheets.' });
  }
});

// @route GET /api/worksheets/gen/:id
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const w = await Worksheet.findById(req.params.id);
    if (!w || !w.sourceMode) return res.status(404).json({ error: 'Worksheet not found.' });
    await resolveStudent(req, w.studentId); // access check
    res.json({ worksheet: shape(w) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load worksheet.' });
  }
});

// @route POST /api/worksheets/gen/:id/assign
// @desc  Assign a generated worksheet to the child (creates an Assignment).
// @access Private
router.post('/:id/assign', protect, async (req, res) => {
  try {
    const w = await Worksheet.findById(req.params.id);
    if (!w || !w.sourceMode) return res.status(404).json({ error: 'Worksheet not found.' });
    const student = await resolveStudent(req, w.studentId);

    // Mastery Worksheet stays the module so practice.js can pull the exact
    // generated questions via linkedAssignmentId; the worksheet's subject
    // travels onto the assignment so attempts route to the right bucket when
    // answered.
    const assignment = await Assignment.create({
      workspaceId: w.workspaceId || student.workspaceId,
      studentId: student._id,
      assignedByUserId: req.user.id,
      assignedByRole: req.user.role || 'parent',
      module: 'Mastery Worksheet',
      subject: w.subject || 'Math',
      topicId: w.topicIds[0] || null,
      skillIds: w.skillIds,
      questionCount: w.questionCount,
      difficulty: w.difficulty === 'adaptive' ? 'medium' : w.difficulty,
      dueDate: req.body.dueDate || null,
      status: 'not_started',
      interventionType: w.sourceMode === 'retention' ? 'retention_review' : w.sourceMode === 'fluency' ? 'fluency_drill' : 'worksheet',
    });

    w.assignedStatus = 'assigned';
    w.linkedAssignmentId = assignment._id;
    await w.save();

    res.json({ worksheet: shape(w), assignmentId: assignment._id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to assign worksheet.' });
  }
});

function shapeSummary(w) {
  return {
    id: w._id, title: w.generatedContent?.title || 'Worksheet', studentName: w.studentName,
    sourceMode: w.sourceMode, worksheetType: w.worksheetType, domain: w.domain,
    difficulty: w.difficulty, questionCount: w.questionCount, estimatedMinutes: w.estimatedMinutes,
    assignedStatus: w.assignedStatus, linkedAssignmentId: w.linkedAssignmentId,
    completion: w.completion || null,
    skillNames: w.generatedContent?.skillNames || [], createdAt: w.createdAt,
    personalization: w.generatedContent?.personalization || null,
    interventionSourceType: w.interventionSourceType || '',
    interventionSourceId: w.interventionSourceId || '',
    interventionRationale: w.interventionRationale || null,
  };
}

function shape(w, { includeAnswerKey = true } = {}) {
  return {
    ...shapeSummary(w),
    includesSolutions: w.includesSolutions,
    includesMistakeReview: w.includesMistakeReview,
    answerKey: includeAnswerKey ? (w.answerKey || w.generatedContent?.answerKey || []) : undefined,
    content: w.generatedContent,
  };
}

function emptyMessage(sourceMode) {
  if (sourceMode === 'recommended') return 'Great work. No recommended worksheet is needed right now.';
  if (sourceMode === 'fluency') return 'Your fluency practice worksheet will appear when a skill enters fluency training.';
  if (sourceMode === 'retention') return 'Retention review worksheets will appear when review dates are scheduled.';
  return '';
}

export default router;
