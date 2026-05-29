import express from 'express';
import Worksheet from '../models/Worksheet.js';
import Assignment from '../models/Assignment.js';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import { generateWorksheet } from '../utils/worksheetGen.js';

// Structured (non-photo) Mastery Worksheet Generator. Mounted at
// /api/worksheets/gen so the legacy photo flow in routes/worksheets.js is
// untouched. Stores STRUCTURED content (never PDF-only).
const router = express.Router();

// @route POST /api/worksheets/gen/generate
// @desc  body: { studentId, mode(recent_mistakes|weak_skills|selected_topic),
//        skillIds[]?, topicId?, difficulty?, questionCount?, includesSolutions?, includesMistakeReview? }
// @access Private
router.post('/generate', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body.studentId);
    const {
      mode = 'weak_skills', skillIds = [], topicId = null,
      misconceptionTag = '',
      difficulty = 'medium', questionCount = 10,
      includesSolutions = true, includesMistakeReview = false,
      subject: subjectInput,
    } = req.body;

    // Normalize the subject so 'science'/'Science' both resolve, and anything
    // else falls back to Math (the historical default).
    const subject = /^science$/i.test(String(subjectInput || '')) ? 'Science' : 'Math';

    const { skillIds: targetSkillIds, topicIds, content } = await generateWorksheet({
      mode, studentId: student._id, studentName: student.name,
      skillIds, topicId, misconceptionTag, difficulty, questionCount, includesSolutions, includesMistakeReview,
      subject,
    });

    if (!content.questions.length) {
      return res.status(400).json({ error: 'No questions available for the selected skills yet. Seed the question bank or pick another topic.' });
    }

    const worksheet = await Worksheet.create({
      userId: req.user.id,
      studentId: student._id,
      studentName: student.name,
      subject,
      workspaceId: student.workspaceId,
      generatedByUserId: req.user.id,
      generatedByRole: req.user.role || 'parent',
      topicIds, skillIds: targetSkillIds,
      sourceMode: mode, difficulty, questionCount,
      includesSolutions, includesMistakeReview,
      generatedContent: content,
      assignedStatus: 'unassigned',
    });

    res.status(201).json({ worksheet: shape(worksheet) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to generate worksheet.' });
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
      difficulty: w.difficulty,
      dueDate: req.body.dueDate || null,
      status: 'not_started',
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
    sourceMode: w.sourceMode, difficulty: w.difficulty, questionCount: w.questionCount,
    assignedStatus: w.assignedStatus, linkedAssignmentId: w.linkedAssignmentId,
    skillNames: w.generatedContent?.skillNames || [], createdAt: w.createdAt,
  };
}
function shape(w) {
  return { ...shapeSummary(w), includesSolutions: w.includesSolutions, includesMistakeReview: w.includesMistakeReview, content: w.generatedContent };
}

export default router;
