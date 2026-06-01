import express from 'express';
import { protect } from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import Skill from '../models/Skill.js';
import { resolveStudent } from '../utils/studentContext.js';

const router = express.Router();

// @route POST /api/assignments
// @desc  Create an assignment (parent/tutor/teacher/system). body:
//        { studentId, module, feature?, subject?, topicId?, skillIds[], questionCount?,
//          difficulty?, dueDate?, intervention metadata }
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body.studentId);
    const assignedByRole = req.body.assignedByRole || req.user.role || 'parent';
    const a = await Assignment.create({
      workspaceId: student.workspaceId,
      studentId: student._id,
      assignedByUserId: req.user.id,
      assignedByRole,
      module: req.body.module || 'MathPath',
      subject: req.body.subject || 'Math',
      topicId: req.body.topicId || null,
      skillIds: req.body.skillIds || [],
      questionCount: req.body.questionCount || 10,
      difficulty: req.body.difficulty || 'medium',
      dueDate: req.body.dueDate || null,
      interventionId: req.body.interventionId || '',
      interventionType: req.body.interventionType || '',
      linkedMisconceptions: req.body.linkedMisconceptions || [],
      priority: req.body.priority || 'medium',
      assignedToType: req.body.assignedToType || 'student',
      assignedToId: req.body.assignedToId || student._id,
      templateId: req.body.templateId || '',
      playbookId: req.body.playbookId || '',
      nextAction: req.body.nextAction || '',
      schedule: req.body.schedule || {},
      aiPlanningContext: req.body.aiPlanningContext || {},
      notificationState: req.body.notificationState || {},
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
      interventionId: a.interventionId, interventionType: a.interventionType,
      linkedMisconceptions: a.linkedMisconceptions, priority: a.priority,
      assignedByRole: a.assignedByRole, assignedToType: a.assignedToType,
      templateId: a.templateId, playbookId: a.playbookId, nextAction: a.nextAction,
      schedule: a.schedule, timestamps: a.timestamps, reassessmentOutcome: a.reassessmentOutcome,
      effectivenessSnapshot: a.effectivenessSnapshot,
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
      completionDate: a.completionDate, interventionId: a.interventionId, interventionType: a.interventionType,
      linkedMisconceptions: a.linkedMisconceptions, priority: a.priority,
      assignedByRole: a.assignedByRole, assignedToType: a.assignedToType,
      templateId: a.templateId, playbookId: a.playbookId, nextAction: a.nextAction,
      schedule: a.schedule, timestamps: a.timestamps, reassessmentOutcome: a.reassessmentOutcome,
      effectivenessSnapshot: a.effectivenessSnapshot,
    } });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load assignment.' });
  }
});

// @route PATCH /api/assignments/:id/status
// @desc  Update assignment completion state with timestamps.
// @access Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Assignment not found.' });
    await resolveStudent(req, a.studentId);

    const allowed = ['not_started', 'started', 'in_progress', 'completed', 'skipped', 'expired', 'overdue'];
    const status = allowed.includes(req.body.status) ? req.body.status : a.status;
    const now = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    a.status = status;
    if (status === 'started') a.timestamps.startedAt = a.timestamps.startedAt || now;
    if (status === 'in_progress') a.timestamps.inProgressAt = a.timestamps.inProgressAt || now;
    if (status === 'completed') {
      a.timestamps.completedAt = now;
      a.completionDate = now;
    }
    if (status === 'skipped') a.timestamps.skippedAt = now;
    if (status === 'expired') a.timestamps.expiredAt = now;
    if (status === 'overdue') a.timestamps.overdueAt = now;
    if (req.body.score !== undefined) a.score = req.body.score;
    if (req.body.reassessmentOutcome !== undefined) a.reassessmentOutcome = req.body.reassessmentOutcome;
    if (req.body.effectivenessSnapshot !== undefined) a.effectivenessSnapshot = req.body.effectivenessSnapshot;
    if (req.body.feedbackSummary !== undefined) a.feedbackSummary = req.body.feedbackSummary;
    await a.save();
    res.json({ assignment: a });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update assignment.' });
  }
});

export default router;
