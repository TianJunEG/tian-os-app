import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import TutorProfile from '../models/TutorProfile.js';
import Booking from '../models/Booking.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Only admin can access
const adminOnly = [protect, authorize('admin')];

// ============================================================================
// 1. USER MANAGEMENT
// ============================================================================

// @route   GET /api/admin/users
// @desc    Get all users (paginated, filtered by role)
// @access  Private (admin only)
router.get('/users', adminOnly, async (req, res) => {
  try {
    const { role, status = 'active', page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (role) filter.role = role; // 'parent', 'tutor', 'admin'
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get detailed user profile
// @access  Private (admin only)
router.get('/users/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profileData = null;
    if (user.role === 'tutor') {
      profileData = await TutorProfile.findOne({ userId: req.params.id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile: profileData
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/activate
// @desc    Activate/deactivate user
// @access  Private (admin only)
router.put(
  '/users/:id/activate',
  adminOnly,
  [body('isActive', 'isActive must be boolean').isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: user.isActive ? 'User activated' : 'User deactivated',
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// 2. TUTOR VERIFICATION QUEUE
// ============================================================================

// @route   GET /api/admin/verification-queue
// @desc    Get pending tutor verification applications
// @access  Private (admin only)
router.get('/verification-queue', adminOnly, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const tutorProfiles = await TutorProfile.find({ verificationStatus: status })
      .populate('userId', 'name email phone avatar')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await TutorProfile.countDocuments({ verificationStatus: status });

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      tutors: tutorProfiles.map(t => ({
        _id: t._id,
        userId: t.userId._id,
        name: t.userId.name,
        email: t.userId.email,
        phone: t.userId.phone,
        specialties: t.specialties,
        grades: t.grades,
        hourlyRate: t.hourlyRate,
        totalHoursTaught: t.totalHoursTaught,
        verificationStatus: t.verificationStatus,
        credentialsSubmitted: t.credentialsSubmitted,
        submittedAt: t.createdAt,
        background: t.background,
        teachingPhilosophy: t.teachingPhilosophy
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/verification/:tutorId
// @desc    Approve or reject tutor verification
// @access  Private (admin only)
router.put(
  '/verification/:tutorId',
  adminOnly,
  [
    body('action', 'Action must be approve or reject').isIn(['approve', 'reject']),
    body('notes', 'Notes required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { action, notes } = req.body;

      const tutorProfile = await TutorProfile.findByIdAndUpdate(
        req.params.tutorId,
        {
          verificationStatus: action === 'approve' ? 'verified' : 'rejected',
          verificationNotes: notes,
          verificationReviewedAt: new Date(),
          verificationReviewedBy: req.user.id
        },
        { new: true }
      ).populate('userId', 'name email');

      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      // TODO: Send email to tutor with decision

      res.json({
        success: true,
        message: `Tutor ${action === 'approve' ? 'verified' : 'rejected'}`,
        tutor: {
          name: tutorProfile.userId.name,
          email: tutorProfile.userId.email,
          status: tutorProfile.verificationStatus
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// 3. BOOKING OVERVIEW & MANAGEMENT
// ============================================================================

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (admin only)
router.get('/bookings', adminOnly, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    // Date range filter
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate('parentId', 'name email')
      .populate('tutorId', 'name email')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ scheduledDate: -1 });

    const total = await Booking.countDocuments(filter);

    // Calculate status breakdown
    const statusCounts = await Booking.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statusBreakdown: statusCounts.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      bookings: bookings.map(b => ({
        _id: b._id,
        parent: b.parentId?.name,
        tutor: b.tutorId?.name,
        subject: b.subject,
        date: b.scheduledDate,
        time: `${b.startTime} - ${b.endTime}`,
        duration: b.duration,
        totalCost: b.totalCost,
        status: b.status,
        sessionNotes: b.sessionNotes ? 'Submitted' : 'Pending'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/bookings/:id
// @desc    Get booking details
// @access  Private (admin only)
router.get('/bookings/:id', adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parentId', 'name email phone avatar')
      .populate('tutorId', 'name email phone avatar');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        status: booking.status,
        sessionNotes: booking.sessionNotes || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 4. PLATFORM METRICS & ANALYTICS
// ============================================================================

// @route   GET /api/admin/dashboard
// @desc    Get platform overview metrics
// @access  Private (admin only)
router.get('/dashboard', adminOnly, async (req, res) => {
  try {
    // Count users by role
    const parentCount = await User.countDocuments({ role: 'parent', isActive: true });
    const tutorCount = await User.countDocuments({ role: 'tutor', isActive: true });
    const totalUsers = parentCount + tutorCount;

    // Count verified tutors
    const verifiedTutors = await TutorProfile.countDocuments({ verificationStatus: 'verified' });
    const pendingVerification = await TutorProfile.countDocuments({ verificationStatus: 'pending' });

    // Booking stats
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress', 'in-progress'] }
    });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const totalBookings = completedBookings + activeBookings + cancelledBookings;

    // Revenue calculation
    const revenuePipeline = [
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCost' },
          platformFee: {
            $sum: { $multiply: ['$totalCost', 0.12] } // 12% commission
          },
          tutorPayouts: {
            $sum: { $multiply: ['$totalCost', 0.88] } // 88% to tutors
          }
        }
      }
    ];

    const revenueData = await Booking.aggregate(revenuePipeline);
    const revenue = revenueData[0] || {
      totalRevenue: 0,
      platformFee: 0,
      tutorPayouts: 0
    };

    // Average metrics
    const avgRating = await TutorProfile.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
    ]);

    const avgMatchSuccess = await TutorProfile.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: null, avgSuccess: { $avg: '$matchSuccessRate' } } }
    ]);

    // Monthly booking trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      dashboard: {
        users: {
          parents: parentCount,
          tutors: tutorCount,
          verified: verifiedTutors,
          pendingVerification,
          total: totalUsers
        },
        bookings: {
          completed: completedBookings,
          active: activeBookings,
          cancelled: cancelledBookings,
          total: totalBookings,
          completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
        },
        revenue: {
          total: Math.round(revenue.totalRevenue * 100) / 100,
          platformFee: Math.round(revenue.platformFee * 100) / 100,
          tutorPayouts: Math.round(revenue.tutorPayouts * 100) / 100
        },
        quality: {
          avgTutorRating: Math.round((avgRating[0]?.avgRating || 0) * 10) / 10,
          avgMatchSuccess: Math.round((avgMatchSuccess[0]?.avgSuccess || 0) * 100) / 100,
          verificationRate: tutorCount > 0 ? Math.round((verifiedTutors / tutorCount) * 100) : 0
        },
        trends: {
          monthlyBookings
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 5. DISPUTE RESOLUTION
// ============================================================================

// @route   POST /api/admin/disputes
// @desc    Flag a booking as disputed
// @access  Private (parent or tutor)
router.post(
  '/disputes',
  protect,
  [
    body('bookingId', 'Booking ID required').notEmpty(),
    body('reason', 'Reason required').trim().notEmpty(),
    body('description', 'Description required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookingId, reason, description } = req.body;

      const booking = await Booking.findById(bookingId);
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

      // Flag the booking with dispute info
      booking.dispute = {
        flaggedAt: new Date(),
        flaggedBy: req.user.id,
        reason,
        description,
        status: 'open',
        resolvedAt: null,
        resolution: null
      };

      await booking.save();

      res.json({
        success: true,
        message: 'Dispute flagged for admin review',
        booking: {
          _id: booking._id,
          dispute: booking.dispute
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/admin/disputes
// @desc    Get all open disputes
// @access  Private (admin only)
router.get('/disputes', adminOnly, async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const disputes = await Booking.find({ 'dispute.status': status })
      .populate('parentId', 'name email')
      .populate('tutorId', 'name email')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ 'dispute.flaggedAt': -1 });

    const total = await Booking.countDocuments({ 'dispute.status': status });

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      disputes: disputes.map(b => ({
        _id: b._id,
        parent: b.parentId?.name,
        tutor: b.tutorId?.name,
        flaggedAt: b.dispute.flaggedAt,
        reason: b.dispute.reason,
        description: b.dispute.description,
        status: b.dispute.status,
        hoursOpen: Math.round((Date.now() - b.dispute.flaggedAt) / (1000 * 60 * 60))
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/disputes/:id/resolve
// @desc    Resolve a dispute
// @access  Private (admin only)
router.put(
  '/disputes/:id/resolve',
  adminOnly,
  [
    body('resolution', 'Resolution required').trim().notEmpty(),
    body('action', 'Action required (refund/keep/other)').isIn(['refund', 'keep', 'other'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { resolution, action } = req.body;

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
          'dispute.status': 'resolved',
          'dispute.resolvedAt': new Date(),
          'dispute.resolution': resolution,
          'dispute.action': action,
          'dispute.resolvedBy': req.user.id
        },
        { new: true }
      ).populate('parentId', 'email').populate('tutorId', 'email');

      // TODO: Send resolution email to both parties

      res.json({
        success: true,
        message: 'Dispute resolved',
        booking: {
          _id: booking._id,
          dispute: booking.dispute
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
