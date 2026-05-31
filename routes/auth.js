import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, getSignedToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

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
    body('email', 'Please provide a valid email').isEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user and select password
      const user = await User.findOne({ email }).select('+password');

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
          avatar: user.avatar
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
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, bio, phone, location, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, phone, location, avatar, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
