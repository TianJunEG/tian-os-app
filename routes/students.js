import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

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
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'That email/login is already taken' });
      }

      const student = new User({
        name,
        email,
        password,
        role: 'student',
        linkedTo: req.user.id
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
