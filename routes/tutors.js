import express from 'express';
import { body, validationResult } from 'express-validator';
import TutorProfile from '../models/TutorProfile.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   POST /api/tutors/upload-credentials
// @desc    Upload credential documents (PDF or image)
// @access  Private (tutor only)
router.post(
  '/upload-credentials',
  protect,
  authorize('tutor'),
  upload.single('credentials'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Build file URL
      const fileUrl = `/uploads/credentials/${req.file.filename}`;

      // Update tutor profile with credentials URL
      const tutorProfile = await TutorProfile.findOneAndUpdate(
        { userId: req.user.id },
        { credentialsUrl: fileUrl, updatedAt: new Date() },
        { new: true }
      );

      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor profile not found' });
      }

      res.json({
        success: true,
        message: 'Credentials uploaded successfully',
        credentialsUrl: fileUrl,
        tutorProfile
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/tutors/profile
// @desc    Create/update tutor profile
// @access  Private (tutor only)
router.post(
  '/profile',
  protect,
  authorize('tutor'),
  [
    body('headline', 'Headline is required').trim().notEmpty(),
    body('hourlyRate', 'Hourly rate is required and must be valid').isFloat({ min: 5, max: 500 }),
    body('specialties', 'At least one specialty is required').isArray({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        headline,
        description,
        qualifications,
        specialties,
        grades,
        hourlyRate,
        languages,
        experience,
        certifications
      } = req.body;

      let tutorProfile = await TutorProfile.findOne({ userId: req.user.id });

      if (tutorProfile) {
        // Update existing profile
        tutorProfile = await TutorProfile.findByIdAndUpdate(
          tutorProfile._id,
          {
            headline,
            description,
            qualifications,
            specialties,
            grades,
            hourlyRate,
            languages,
            experience,
            certifications,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new profile
        tutorProfile = new TutorProfile({
          userId: req.user.id,
          headline,
          description,
          qualifications,
          specialties,
          grades,
          hourlyRate,
          languages,
          experience,
          certifications
        });
        await tutorProfile.save();
      }

      res.status(201).json({ success: true, tutorProfile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/tutors/:id
// @desc    Get tutor profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ userId: req.params.id })
      .populate('userId', 'name email avatar bio location');

    if (!tutorProfile) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    res.json({ success: true, tutorProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tutors
// @desc    Get all tutors with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialty, grade, maxRate, minRating, location } = req.query;
    let filter = { isActive: true };

    if (specialty) {
      filter.specialties = specialty;
    }
    if (grade) {
      filter.grades = grade;
    }
    if (maxRate) {
      filter.hourlyRate = { $lte: parseInt(maxRate) };
    }
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }

    const tutors = await TutorProfile.find(filter)
      .populate('userId', 'name email avatar bio location phone')
      .sort({ 'rating.average': -1, totalHoursTaught: -1 })
      .limit(50);

    res.json({ success: true, count: tutors.length, tutors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/tutors/availability
// @desc    Update tutor availability (by day)
// @access  Private (tutor only)
router.put(
  '/availability',
  protect,
  authorize('tutor'),
  [
    body('day', 'Day is required').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    body('available', 'Available status must be boolean').isBoolean(),
    body('start', 'Start time must be in HH:mm format').matches(/^\d{2}:\d{2}$/).optional(),
    body('end', 'End time must be in HH:mm format').matches(/^\d{2}:\d{2}$/).optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { day, available, start, end } = req.body;

      const tutorProfile = await TutorProfile.findOne({ userId: req.user.id });
      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor profile not found' });
      }

      // Update specific day availability
      if (!tutorProfile.availability) {
        tutorProfile.availability = {};
      }

      tutorProfile.availability[day] = {
        available,
        start: start || '09:00',
        end: end || '17:00'
      };

      tutorProfile.updatedAt = new Date();
      await tutorProfile.save();

      res.json({ success: true, tutorProfile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/tutors/me/availability
// @desc    Get current tutor's availability
// @access  Private (tutor only)
router.get(
  '/me/availability',
  protect,
  authorize('tutor'),
  async (req, res) => {
    try {
      const tutorProfile = await TutorProfile.findOne({ userId: req.user.id });
      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor profile not found' });
      }

      res.json({
        success: true,
        availability: tutorProfile.availability
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/tutors/me/availability/bulk
// @desc    Bulk update availability for multiple days
// @access  Private (tutor only)
router.post(
  '/me/availability/bulk',
  protect,
  authorize('tutor'),
  [
    body('availability', 'Availability object is required').isObject()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { availability } = req.body;

      // Validate structure
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of Object.keys(availability)) {
        if (!validDays.includes(day)) {
          return res.status(400).json({ error: `Invalid day: ${day}` });
        }
        const dayAvailability = availability[day];
        if (typeof dayAvailability.available !== 'boolean') {
          return res.status(400).json({ error: `${day}.available must be boolean` });
        }
        if (dayAvailability.start && !dayAvailability.start.match(/^\d{2}:\d{2}$/)) {
          return res.status(400).json({ error: `${day}.start must be in HH:mm format` });
        }
        if (dayAvailability.end && !dayAvailability.end.match(/^\d{2}:\d{2}$/)) {
          return res.status(400).json({ error: `${day}.end must be in HH:mm format` });
        }
      }

      const tutorProfile = await TutorProfile.findOneAndUpdate(
        { userId: req.user.id },
        { availability, updatedAt: new Date() },
        { new: true }
      );

      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor profile not found' });
      }

      res.json({ success: true, tutorProfile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/tutors/me/profile
// @desc    Get current tutor's profile
// @access  Private (tutor only)
router.get('/me/profile', protect, authorize('tutor'), async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ userId: req.user.id })
      .populate('userId', 'name email avatar bio location phone');

    if (!tutorProfile) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    res.json({ success: true, tutorProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tutors/onboarding
// @desc    Complete tutor onboarding (5-step form)
// @access  Private (tutor only)
router.post(
  '/onboarding',
  protect,
  authorize('tutor'),
  async (req, res) => {
    try {
      const {
        specialties,
        gradeLevel,
        hourlyRate,
        bio,
        education,
        experience,
        certifications,
        credentialsUrl,
        availability,
        bankingInfo
      } = req.body;

      // Validate required fields
      if (!specialties || !specialties.length) {
        return res.status(400).json({ message: 'Please select at least one specialty' });
      }
      if (!gradeLevel || !gradeLevel.length) {
        return res.status(400).json({ message: 'Please select at least one grade level' });
      }
      if (!hourlyRate || hourlyRate < 10) {
        return res.status(400).json({ message: 'Hourly rate must be at least $10' });
      }
      if (!bio || bio.length < 50) {
        return res.status(400).json({ message: 'Bio must be at least 50 characters' });
      }
      if (!education) {
        return res.status(400).json({ message: 'Please specify your education level' });
      }
      if (experience === undefined || experience < 0) {
        return res.status(400).json({ message: 'Please provide years of experience' });
      }
      if (!credentialsUrl) {
        return res.status(400).json({ message: 'Please upload credentials document' });
      }
      if (!bankingInfo || !bankingInfo.accountName || !bankingInfo.routingNumber || !bankingInfo.accountNumber) {
        return res.status(400).json({ message: 'Please provide complete banking information' });
      }

      // Check if tutor profile already exists
      let tutorProfile = await TutorProfile.findOne({ userId: req.user.id });

      if (!tutorProfile) {
        // Create new tutor profile
        tutorProfile = new TutorProfile({
          userId: req.user.id,
          specialties,
          gradeLevel,
          hourlyRate,
          bio,
          education,
          experience,
          certifications: certifications || '',
          credentialsUrl,
          availability: availability || {},
          bankingInfo: {
            accountName: bankingInfo.accountName,
            routingNumber: bankingInfo.routingNumber,
            accountNumber: bankingInfo.accountNumber,
            accountType: bankingInfo.accountType || 'checking'
          },
          status: 'pending_verification',
          onboardingCompletedAt: new Date()
        });
        await tutorProfile.save();
      } else {
        // Update existing profile (if completing onboarding again)
        tutorProfile = await TutorProfile.findByIdAndUpdate(
          tutorProfile._id,
          {
            specialties,
            gradeLevel,
            hourlyRate,
            bio,
            education,
            experience,
            certifications: certifications || '',
            credentialsUrl,
            availability: availability || {},
            bankingInfo: {
              accountName: bankingInfo.accountName,
              routingNumber: bankingInfo.routingNumber,
              accountNumber: bankingInfo.accountNumber,
              accountType: bankingInfo.accountType || 'checking'
            },
            status: 'pending_verification',
            onboardingCompletedAt: new Date(),
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
      }

      // Update user status
      await User.findByIdAndUpdate(
        req.user.id,
        {
          profileComplete: true,
          status: 'pending_verification'
        }
      );

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully! We will review it within 24-48 hours.',
        tutorProfile
      });
    } catch (error) {
      console.error('Tutor onboarding error:', error);
      res.status(500).json({
        message: 'Error submitting application',
        error: error.message
      });
    }
  }
);

export default router;
