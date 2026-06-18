import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { protect, getSignedToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// For a logged-in student, the canonical learner profile lives on the Student
// record (set by the parent/teacher who created the account), not on the User.
// The dashboard derives its visual skin from the student's level, so surface the
// Student record's level here. We prefer it over the denormalised
// User.studentLevel, which can drift (e.g. demo.student: User="P1" but the
// learner record says "Primary 4").
//
// A child can have a Student record in more than one workspace (school + tutor),
// possibly at different levels, so scope to the active workspace when one is
// supplied (the X-Workspace-Id header on /me). At login there is no active
// workspace yet; sort by createdAt so the fallback record is at least stable.
async function resolveStudentLevel(user, workspaceId) {
  if (user?.role !== 'student') return user?.studentLevel || '';
  const query = { userId: user._id };
  if (workspaceId && mongoose.isValidObjectId(workspaceId)) query.workspaceId = workspaceId;
  const student = await Student.findOne(query).select('level').sort({ createdAt: 1 }).lean();
  return student?.level || user?.studentLevel || '';
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  authRateLimit,
  [
    body('name', 'Name is required').trim().notEmpty(),
    body('email', 'Please provide a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'Role must be either parent or tutor')
      .isIn(['parent', 'tutor'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists with that email' });
      }

      // Create user
      user = new User({
        name,
        email,
        password,
        role
      });

      await user.save();

      // Generate token
      const token = getSignedToken(user._id, user.role);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  authRateLimit,
  [
    // Accept either `email` (legacy) or `identifier` (email or username).
    body('password', 'Password is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, identifier, password } = req.body;
      const loginId = (identifier || email || '').trim().toLowerCase();
      if (!loginId) return res.status(400).json({ error: 'Email or username is required' });

      // Find user by email or username
      const user = await User.findOne(
        loginId.includes('@') ? { email: loginId } : { username: loginId }
      ).select('+password');

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been suspended' });
      }

      // Generate token
      const token = getSignedToken(user._id, user.role);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_test_account: Boolean(user.is_test_account),
          avatar: user.avatar,
          studentLevel: await resolveStudentLevel(user)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userObj = user.toObject();
    userObj.studentLevel = await resolveStudentLevel(user, req.headers['x-workspace-id']);
    res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, asyncHandler(async (req, res) => {
  try {
    // Only update fields that were actually provided. Building the update from
    // the raw body would write `undefined` for omitted keys, which can wipe
    // required fields (e.g. an avatar-only update nulling `name`).
    const updatable = ['name', 'bio', 'phone', 'location', 'avatar'];
    const updates = { updatedAt: new Date() };
    for (const key of updatable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

router.post('/forgot-password', authRateLimit, asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const baseUrl = process.env.FRONTEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Could not send reset email. Try again later.' });
  }
}));

router.post('/reset-password/:token', authRateLimit, asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = getSignedToken(user._id, user.role);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
