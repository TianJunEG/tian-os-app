import express from 'express';
import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import TutorProfile from '../models/TutorProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (parent only)
router.post(
  '/',
  protect,
  authorize('parent'),
  [
    body('tutorId', 'Tutor ID is required').notEmpty(),
    body('subject', 'Subject is required').trim().notEmpty(),
    body('duration', 'Duration must be between 0.5 and 4 hours').isFloat({ min: 0.5, max: 4 }),
    body('scheduledDate', 'Valid date is required').isISO8601(),
    body('startTime', 'Start time is required').matches(/^\d{2}:\d{2}$/),
    body('endTime', 'End time is required').matches(/^\d{2}:\d{2}$/)
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        tutorId,
        subject,
        duration,
        scheduledDate,
        startTime,
        endTime,
        sessionType = 'online',
        notes,
        location,
        meetingLink
      } = req.body;

      // Get tutor profile to get hourly rate
      const tutorProfile = await TutorProfile.findOne({ userId: tutorId });
      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      const totalCost = tutorProfile.hourlyRate * duration;

      // Create booking
      const booking = new Booking({
        parentId: req.user.id,
        tutorId,
        subject,
        duration,
        scheduledDate: new Date(scheduledDate),
        startTime,
        endTime,
        sessionType,
        notes,
        location,
        meetingLink,
        hourlyRate: tutorProfile.hourlyRate,
        totalCost,
        status: 'pending'
      });

      await booking.save();

      // Populate user data
      await booking.populate([
        { path: 'parentId', select: 'name email' },
        { path: 'tutorId', select: 'name email' }
      ]);

      res.status(201).json({ success: true, booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    const { status, role = 'parent' } = req.query;

    let filter = {};
    if (role === 'parent') {
      filter.parentId = req.user.id;
    } else if (role === 'tutor') {
      filter.tutorId = req.user.id;
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('parentId', 'name email avatar')
      .populate('tutorId', 'name email avatar')
      .sort({ scheduledDate: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// @route   GET /api/bookings/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parentId', 'name email avatar phone')
      .populate('tutorId', 'name email avatar phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (
      booking.parentId._id.toString() !== req.user.id &&
      booking.tutorId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm booking (tutor accepts)
// @access  Private (tutor only)
router.put(
  '/:id/confirm',
  protect,
  authorize('tutor'),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.tutorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      booking.status = 'confirmed';
      await booking.save();

      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put(
  '/:id/cancel',
  protect,
  [
    body('cancellationReason', 'Reason is required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check authorization
      if (
        booking.parentId.toString() !== req.user.id &&
        booking.tutorId.toString() !== req.user.id
      ) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      booking.status = 'cancelled';
      booking.cancellationReason = req.body.cancellationReason;
      await booking.save();

      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PUT /api/bookings/:id/checkin
// @desc    Tutor starts session (check-in)
// @access  Private (tutor only)
router.put(
  '/:id/checkin',
  protect,
  authorize('tutor'),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.tutorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (booking.status !== 'confirmed') {
        return res.status(400).json({ error: 'Can only check in for confirmed bookings' });
      }

      booking.status = 'in_progress';
      booking.actualStartTime = new Date();
      await booking.save();

      res.json({
        success: true,
        message: 'Session started',
        booking
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/bookings/:id/notes
// @desc    Tutor submits session notes and completes session
// @access  Private (tutor only)
router.post(
  '/:id/notes',
  protect,
  authorize('tutor'),
  [
    body('topicsCovered', 'Topics covered is required').isArray({ min: 1 }),
    body('studentUnderstanding', 'Understanding level required (struggling/ok/mastered)').isIn(['struggling', 'ok', 'mastered']),
    body('homeworkAssigned', 'Homework assigned is required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.tutorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (booking.status !== 'in_progress') {
        return res.status(400).json({ error: 'Session not in progress' });
      }

      const {
        topicsCovered,
        studentUnderstanding,
        homeworkAssigned,
        dueDate,
        parentActionItems,
        redFlags,
        additionalNotes
      } = req.body;

      // Record session notes
      booking.status = 'completed';
      booking.actualEndTime = new Date();
      booking.sessionNotes = {
        topicsCovered,
        studentUnderstanding,
        homeworkAssigned,
        dueDate: dueDate || null,
        parentActionItems: parentActionItems || [],
        redFlags: redFlags || [],
        additionalNotes: additionalNotes || '',
        submittedAt: new Date(),
        submittedBy: req.user.id
      };

      // Calculate actual duration
      if (booking.actualStartTime && booking.actualEndTime) {
        const durationMs = booking.actualEndTime - booking.actualStartTime;
        booking.actualDuration = durationMs / (1000 * 60 * 60); // Convert to hours
      }

      await booking.save();

      // Update tutor stats
      const tutorProfile = await TutorProfile.findOne({ userId: booking.tutorId });
      if (tutorProfile) {
        tutorProfile.totalHoursTaught += (booking.actualDuration || booking.duration);
        tutorProfile.completedBookings = (tutorProfile.completedBookings || 0) + 1;

        // Update match success rate based on understanding
        const currentRate = tutorProfile.matchSuccessRate || 0;
        const successWeight = studentUnderstanding === 'mastered' ? 100 :
                            studentUnderstanding === 'ok' ? 70 : 40;
        tutorProfile.matchSuccessRate = Math.round(
          (currentRate * (tutorProfile.completedBookings - 1) + successWeight) /
          tutorProfile.completedBookings
        );

        await tutorProfile.save();
      }

      res.json({
        success: true,
        message: 'Session notes submitted and session completed',
        booking: {
          _id: booking._id,
          status: booking.status,
          sessionNotes: booking.sessionNotes,
          actualDuration: booking.actualDuration
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/bookings/:id/notes
// @desc    Get session notes (parent/tutor view)
// @access  Private
router.get(
  '/:id/notes',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('parentId', 'name email')
        .populate('tutorId', 'name email');

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check authorization
      if (
        booking.parentId._id.toString() !== req.user.id &&
        booking.tutorId._id.toString() !== req.user.id
      ) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (!booking.sessionNotes) {
        return res.status(404).json({ error: 'Session notes not yet submitted' });
      }

      res.json({
        success: true,
        booking: {
          _id: booking._id,
          tutor: booking.tutorId.name,
          subject: booking.subject,
          date: booking.scheduledDate,
          duration: booking.actualDuration || booking.duration,
          sessionNotes: booking.sessionNotes
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

// @route   GET /api/bookings/student/:studentId/progress
// @desc    Get parent's progress tracking (all completed sessions)
// @access  Private
router.get(
  '/parent/:parentId/progress',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { parentId } = req.params;

      // Verify authorization
      if (parentId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const completedBookings = await Booking.find({
        parentId,
        status: 'completed',
        sessionNotes: { $exists: true }
      })
        .populate('tutorId', 'name avatar')
        .sort({ 'sessionNotes.submittedAt': -1 });

      // Calculate progress stats
      const progressStats = {
        totalSessions: completedBookings.length,
        totalHours: completedBookings.reduce((sum, b) => sum + (b.actualDuration || b.duration), 0),
        topicsCovered: [],
        masterCount: 0,
        okCount: 0,
        strugglingCount: 0,
        averageProgress: 0
      };

      completedBookings.forEach(booking => {
        if (booking.sessionNotes) {
          progressStats.topicsCovered.push(...booking.sessionNotes.topicsCovered);

          if (booking.sessionNotes.studentUnderstanding === 'mastered') {
            progressStats.masterCount++;
          } else if (booking.sessionNotes.studentUnderstanding === 'ok') {
            progressStats.okCount++;
          } else {
            progressStats.strugglingCount++;
          }
        }
      });

      // Calculate average progress percentage
      if (progressStats.totalSessions > 0) {
        progressStats.averageProgress = Math.round(
          (progressStats.masterCount * 100 + progressStats.okCount * 70 + progressStats.strugglingCount * 40) /
          (progressStats.totalSessions * 100) * 100
        );
      }

      // Remove duplicates from topics
      progressStats.topicsCovered = [...new Set(progressStats.topicsCovered)];

      res.json({
        success: true,
        progress: progressStats,
        sessions: completedBookings.map(b => ({
          _id: b._id,
          tutor: b.tutorId.name,
          date: b.sessionNotes.submittedAt,
          understanding: b.sessionNotes.studentUnderstanding,
          topicsCovered: b.sessionNotes.topicsCovered,
          homework: b.sessionNotes.homeworkAssigned,
          redFlags: b.sessionNotes.redFlags
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  })
);

// @route   PUT /api/bookings/:id/complete
// @desc    Mark booking as completed (legacy, use /notes instead)
// @access  Private (tutor only)
router.put(
  '/:id/complete',
  protect,
  authorize('tutor'),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.tutorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      booking.status = 'completed';
      booking.actualEndTime = new Date();
      await booking.save();

      // Update tutor stats
      const tutorProfile = await TutorProfile.findOne({ userId: booking.tutorId });
      if (tutorProfile) {
        tutorProfile.totalHoursTaught += booking.duration;
        tutorProfile.completedBookings = (tutorProfile.completedBookings || 0) + 1;
        await tutorProfile.save();
      }

      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
