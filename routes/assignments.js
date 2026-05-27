import express from 'express';
import { protect } from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import Skill from '../models/Skill.js';
import { resolveStudent } from '../utils/studentContext.js';

const router = express.Router();

// @route POST /api/assignments
// @desc  Create an assignment (parent/tutor/teacher/system). body:
//        { studentId, module, feature?, subject?, topicId?, skillIds[], questionCount?,
//          difficulty?, dueDate?, worksheetId? }
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body.studentId);
    const a = await Assignment.create({
      workspaceId: student.workspaceId,
      studentId: student._id,
      assignedByUserId: req.user.id,
      assignedByRole: req.body.assignedByRole || req.user.role || 'parent',
      module: req.body.module || 'MathPath',
      subject: req.body.subject || 'Math',
      topicId: req.body.topicId || null,
      skillIds: req.body.skillIds || [],
      questionCount: req.body.questionCount || 10,
      difficulty: req.body.difficulty || 'medium',
      dueDate: req.body.dueDate || null,
      status: 'not_started',
    });
    res.status(201).json({ assignment: a });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to create assignment.' });
  }
});

// @route GET /api/assignments?studentId=&status=
// @desc  List a student's assignments (student dashboard + parent list).
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const filter = { studentId: student._id };
    if (req.query.status) filter.status = req.query.status;
    const list = await Assignment.find(filter)
      .populate({ path: 'skillIds', model: Skill })
      .sort({ createdAt: -1 });
    res.json({ assignments: list.map((a) => ({
      id: a._id, module: a.module, subject: a.subject, status: a.status,
      skillIds: a.skillIds.map((s) => s._id), skillNames: a.skillIds.map((s) => s.name),
      questionCount: a.questionCount, difficulty: a.difficulty, dueDate: a.dueDate,
      score: a.score, completionDate: a.completionDate, createdAt: a.createdAt,
    })) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load assignments.' });
  }
});

// @route GET /api/assignments/:id
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).populate({ path: 'skillIds', model: Skill });
    if (!a) return res.status(404).json({ error: 'Assignment not found.' });
    await resolveStudent(req, a.studentId); // access check
    res.json({ assignment: {
      id: a._id, module: a.module, subject: a.subject, status: a.status,
      skillIds: a.skillIds.map((s) => s._id), skillNames: a.skillIds.map((s) => s.name),
      questionCount: a.questionCount, difficulty: a.difficulty, dueDate: a.dueDate, score: a.score,
    } });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load assignment.' });
  }
});

export default router;
