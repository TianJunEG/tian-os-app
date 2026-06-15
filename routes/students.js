import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import FluencyRecord from '../models/FluencyRecord.js';
import RetentionReview from '../models/RetentionReview.js';
import Worksheet from '../models/Worksheet.js';
import { resolveStudent } from '../utils/studentContext.js';
import { classifyFluencyBuckets } from '../utils/fluencyEngine.js';

const router = express.Router();

// @route   POST /api/students
// @desc    Create a student login linked to the current parent/tutor
// @access  Private (parent or tutor)
router.post(
  '/',
  protect,
  authorize('parent', 'tutor'),
  [
    body('name', 'Name is required').trim().notEmpty(),
    body('email', 'A valid email/login is required').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, level } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'That email/login is already taken' });
      }

      const student = new User({
        name,
        email,
        password,
        role: 'student',
        linkedTo: req.user.id,
        ...(level ? { studentLevel: level } : {}),
      });
      await student.save();

      return res.status(201).json({
        success: true,
        student: { id: student._id, name: student.name, email: student.email }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// @route   GET /api/students
// @desc    List the current parent/tutor's student logins
// @access  Private (parent or tutor)
router.get('/', protect, authorize('parent', 'tutor'), async (req, res) => {
  try {
    const students = await User.find({ linkedTo: req.user.id, role: 'student' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/students/:studentId/fluency
// @desc    Fluency status buckets for student/parent/tutor/teacher visibility
// @access  Private
router.get('/:studentId/fluency', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const records = await FluencyRecord.find({ studentId: student._id }).sort({ updatedAt: -1 }).lean();
    const summary = classifyFluencyBuckets(records.map((record) => ({ ...record, skillId: String(record.skillId) })));
    const hasData = Boolean(summary.fluentSkills.length || summary.developingSkills.length || summary.needsPracticeSkills.length);
    return res.json({
      ...summary,
      emptyState: hasData ? null : 'Complete more practice to begin fluency tracking.',
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load fluency.' });
  }
});

// @route   GET /api/students/:studentId/retention
// @desc    Retention review schedule and history
// @access  Private
router.get('/:studentId/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const now = new Date();
    const reviews = await RetentionReview.find({ studentId: student._id }).sort({ reviewDate: 1 }).lean();
    const publicReview = (review) => ({
      id: String(review._id),
      skillId: String(review.skillId),
      skillCode: review.skillCode,
      skillName: review.skillName,
      reviewDate: review.reviewDate,
      completed: review.completed,
      retained: review.retained,
      status: review.status,
      metrics: review.metrics || null,
    });
    const upcomingReviews = reviews.filter((review) => !review.completed && new Date(review.reviewDate) >= now).map(publicReview);
    const overdueReviews = reviews.filter((review) => !review.completed && new Date(review.reviewDate) < now).map(publicReview);
    const retentionHistory = reviews.filter((review) => review.completed).map(publicReview);
    return res.json({
      upcomingReviews,
      overdueReviews,
      retentionHistory,
      emptyState: reviews.length ? null : 'Retention reviews will appear after a skill becomes fluent.',
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load retention.' });
  }
});

// @route   GET /api/students/:studentId/worksheets
// @desc    Generated worksheets for a student
// @access  Private
router.get('/:studentId/worksheets', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const worksheets = await Worksheet.find({ studentId: student._id, sourceMode: { $ne: null } }).sort({ createdAt: -1 }).limit(50);
    return res.json({
      worksheets: worksheets.map((worksheet) => ({
        worksheetId: worksheet._id,
        id: worksheet._id,
        title: worksheet.generatedContent?.title || 'Worksheet',
        generatedFor: worksheet.generatedFor || { studentId: student._id, studentName: student.name },
        generatedBy: { userId: worksheet.generatedByUserId || worksheet.userId, role: worksheet.generatedByRole },
        worksheetType: worksheet.worksheetType || worksheet.sourceMode,
        domain: worksheet.domain || 'fractions',
        skills: worksheet.generatedContent?.skillNames || [],
        questionCount: worksheet.questionCount,
        estimatedMinutes: worksheet.estimatedMinutes,
        difficulty: worksheet.difficulty,
        assignedStatus: worksheet.assignedStatus,
        completion: worksheet.completion || null,
        createdAt: worksheet.createdAt,
      })),
      emptyState: worksheets.length ? null : 'No worksheets have been generated for this student yet.',
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load worksheets.' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Remove a student login owned by the current parent/tutor
// @access  Private (parent or tutor)
router.delete('/:id', protect, authorize('parent', 'tutor'), async (req, res) => {
  try {
    const student = await User.findOneAndDelete({
      _id: req.params.id,
      linkedTo: req.user.id,
      role: 'student'
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json({ success: true, message: 'Student removed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
