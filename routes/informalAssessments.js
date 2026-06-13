import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import Class from '../models/Class.js';
import InformalAssessment from '../models/InformalAssessment.js';
import {
  generateAssessmentQuestions,
  assignAssessment,
  buildClassResults,
} from '../services/teacher/informalAssessmentService.js';

const router = express.Router();
router.use(protect, requireWorkspace);

function ensureTeacher(req, res) {
  if (req.workspaceRole !== 'teacher') { res.status(403).json({ error: 'Not a teacher workspace.' }); return false; }
  return true;
}

async function getOwnedClass(req) {
  const classId = req.params.classId || req.body.classId || req.query.classId;
  if (!classId) return null;
  return Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
}

// Preview: generate questions without saving
router.post('/preview', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  try {
    const { module, skillIds, difficulty, questionCount } = req.body;
    const questions = await generateAssessmentQuestions({
      module, skillIds, difficulty: difficulty || 'medium', questionCount: questionCount || 10,
    });
    res.json({ questions });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Create assessment in draft status
router.post('/', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  try {
    const { classId, title, module, skillIds, difficulty, questionCount, timeLimitMinutes, dueDate } = req.body;
    const cls = await Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
    if (!cls) return res.status(404).json({ error: 'Class not found.' });

    const questions = await generateAssessmentQuestions({
      module, skillIds, difficulty: difficulty || 'medium', questionCount: questionCount || 10,
    });

    const assessment = await InformalAssessment.create({
      workspaceId: req.workspaceId,
      classId,
      createdByUserId: req.user.id,
      title: title || `${module} Quick Check`,
      module,
      skillIds,
      difficulty: difficulty || 'medium',
      questionCount: questions.length,
      timeLimitMinutes: timeLimitMinutes || null,
      dueDate: dueDate || null,
      questions,
    });

    res.status(201).json({ assessment });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// List assessments for a class
router.get('/', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ error: 'classId query param required.' });
  const cls = await Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
  if (!cls) return res.status(404).json({ error: 'Class not found.' });

  const assessments = await InformalAssessment.find({ classId, workspaceId: req.workspaceId })
    .select('-questions')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ assessments });
});

// Get single assessment with questions (teacher view, includes answers)
router.get('/:id', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const assessment = await InformalAssessment.findOne({ _id: req.params.id, workspaceId: req.workspaceId }).lean();
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
  res.json({ assessment });
});

// Assign to class/group/student
router.post('/:id/assign', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  try {
    const assessment = await InformalAssessment.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    if (assessment.status === 'closed') return res.status(409).json({ error: 'Assessment is closed.' });

    const target = req.body.target || { type: 'class' };
    const result = await assignAssessment({
      assessment,
      target,
      classId: assessment.classId,
      workspaceId: req.workspaceId,
      teacherUserId: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Class results
router.get('/:id/results', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  try {
    const assessment = await InformalAssessment.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    const results = await buildClassResults(req.params.id);
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Close assessment
router.post('/:id/close', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const assessment = await InformalAssessment.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
  assessment.status = 'closed';
  assessment.closedAt = new Date();
  await assessment.save();
  res.json({ status: 'closed' });
});

// Delete draft
router.delete('/:id', async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const assessment = await InformalAssessment.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
  if (assessment.status !== 'draft') return res.status(409).json({ error: 'Only draft assessments can be deleted.' });
  await assessment.deleteOne();
  res.json({ deleted: true });
});

export default router;
