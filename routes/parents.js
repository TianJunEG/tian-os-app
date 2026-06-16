import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateParentNarration } from '../utils/aiService.js';

const router = express.Router();

// @route   POST /api/parents/mathpath-narration
// @desc    Tier 2: warm, LLM-generated "Chelya's update" from a progress snapshot
// @access  Private (parent only)
router.post('/mathpath-narration', protect, authorize('parent'), async (req, res) => {
  try {
    const { childName, summary } = req.body || {};
    const narration = await generateParentNarration({ childName, summary: summary || {} });
    res.json({ success: true, narration });
  } catch (error) {
    // Client falls back to the deterministic Tier 1 composer.
    res.status(502).json({ success: false, error: 'narration_unavailable' });
  }
});

// @route   POST /api/parents/profile
// @desc    Create/update parent profile
// @access  Private (parent only)
router.post(
  '/profile',
  protect,
  authorize('parent'),
  async (req, res) => {
    try {
      const {
        studentName,
        studentAge,
        gradeLevel,
        primarySubject,
        otherSubjects,
        learningGoals,
        specificChallenges,
        preferredTutorGender,
        learningStyle,
        preferredSessionType,
        timezone,
        budget,
        availability
      } = req.body;

      // Validate required fields
      if (!studentName || studentName.length < 2) {
        return res.status(400).json({ message: 'Student name is required' });
      }
      if (!studentAge || studentAge < 5 || studentAge > 80) {
        return res.status(400).json({ message: 'Valid student age is required' });
      }
      if (!gradeLevel) {
        return res.status(400).json({ message: 'Grade level is required' });
      }
      if (!primarySubject) {
        return res.status(400).json({ message: 'Primary subject is required' });
      }
      if (!learningGoals || learningGoals.length < 20) {
        return res.status(400).json({ message: 'Learning goals are required (20+ characters)' });
      }
      if (!budget || budget < 10) {
        return res.status(400).json({ message: 'Budget must be at least $10/hour' });
      }

      // Update user with parent profile info
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          parentProfile: {
            studentName,
            studentAge: parseInt(studentAge),
            gradeLevel,
            primarySubject,
            otherSubjects: otherSubjects || [],
            learningGoals,
            specificChallenges: specificChallenges || '',
            preferredTutorGender: preferredTutorGender || 'any',
            learningStyle: learningStyle || 'adaptive',
            preferredSessionType: preferredSessionType || 'online',
            timezone: timezone || 'America/New_York',
            budget: parseFloat(budget),
            availability: availability || {}
          },
          profileComplete: true
        },
        { new: true, runValidators: true }
      );

      res.status(201).json({
        success: true,
        message: 'Parent profile created successfully',
        user
      });
    } catch (error) {
      console.error('Parent profile error:', error);
      res.status(500).json({
        message: 'Error creating parent profile',
        error: error.message
      });
    }
  }
);

// @route   GET /api/parents/profile
// @desc    Get current parent's profile
// @access  Private (parent only)
router.get(
  '/profile',
  protect,
  authorize('parent'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user || !user.parentProfile) {
        return res.status(404).json({ error: 'Parent profile not found' });
      }

      res.json({ success: true, profile: user.parentProfile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PUT /api/parents/profile
// @desc    Update parent profile
// @access  Private (parent only)
router.put(
  '/profile',
  protect,
  authorize('parent'),
  async (req, res) => {
    try {
      const {
        studentName,
        studentAge,
        gradeLevel,
        primarySubject,
        otherSubjects,
        learningGoals,
        specificChallenges,
        preferredTutorGender,
        learningStyle,
        preferredSessionType,
        budget,
        availability
      } = req.body;

      const updateData = {};

      if (studentName) updateData['parentProfile.studentName'] = studentName;
      if (studentAge) updateData['parentProfile.studentAge'] = parseInt(studentAge);
      if (gradeLevel) updateData['parentProfile.gradeLevel'] = gradeLevel;
      if (primarySubject) updateData['parentProfile.primarySubject'] = primarySubject;
      if (otherSubjects) updateData['parentProfile.otherSubjects'] = otherSubjects;
      if (learningGoals) updateData['parentProfile.learningGoals'] = learningGoals;
      if (specificChallenges !== undefined) updateData['parentProfile.specificChallenges'] = specificChallenges;
      if (preferredTutorGender) updateData['parentProfile.preferredTutorGender'] = preferredTutorGender;
      if (learningStyle) updateData['parentProfile.learningStyle'] = learningStyle;
      if (preferredSessionType) updateData['parentProfile.preferredSessionType'] = preferredSessionType;
      if (budget) updateData['parentProfile.budget'] = parseFloat(budget);
      if (availability) updateData['parentProfile.availability'] = availability;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Parent profile updated successfully',
        profile: user.parentProfile
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error updating parent profile',
        error: error.message
      });
    }
  }
);

export default router;
