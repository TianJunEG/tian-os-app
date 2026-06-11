import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import TutorProfile from '../models/TutorProfile.js';
import Booking from '../models/Booking.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import Mistake from '../models/Mistake.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathWorkingSession from '../models/mathpath/MathPathWorkingSession.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendTutorApprovalEmail, sendTutorRejectionEmail } from '../utils/emailService.js';
import {
  getAdminBillingOverview,
  getPartnerBillingSummary,
  setBillingSubscription,
} from '../services/billing/billingAdminService.js';
import { getDomainHealthReport } from '../services/domains/domainRegistry.js';
import { buildMisconceptionCoverageMatrix, buildMisconceptionDensityReport } from '../services/mathpath/misconceptionCoverageService.js';
import { auditMisconceptionInterventionCoverage } from '../services/mathpath/misconceptionInterventionMap.js';
import { getDiagnosticValidationReport } from '../services/mathpath/diagnosticValidationEngine.js';
import { getLearningPathQualityReport } from '../services/mathpath/learningPathService.js';
import { auditMasteryInflationRisk } from '../services/mathpath/mistakeCorrectionFlow.js';
import { getLegacyMistakeEvidenceAudit } from '../services/mathpath/legacyMistakeEvidenceAuditService.js';
import { buildFractionsSkillIntegrityReport } from '../services/mathpath/questionSkillIntegrityService.js';
import { listCanonicalFractionSkills } from '../shared/mathpath/curriculum/fractionCanonicalSkillMap.js';
import { fractionQuestionFamilies } from '../shared/mathpath/fractions/fractionQuestionFamilies.js';

const router = express.Router();

// Middleware: Only admin can access
const adminOnly = [protect, authorize('admin')];

function toDateValue(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function latestDate(...values) {
  const dates = values.map(toDateValue).filter(Boolean);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function riskForStudent({ diagnosticStatus, practiceCompleted, mistakes, workingPending, helpRequests, lastActivityAt }) {
  if (!lastActivityAt) return 'Needs follow-up';
  if (helpRequests >= 3 || workingPending >= 2 || mistakes >= 5) return 'Needs follow-up';
  if (diagnosticStatus !== 'completed' || practiceCompleted === 0 || mistakes >= 2 || helpRequests > 0 || workingPending > 0) return 'Watch';
  return 'OK';
}

// ============================================================================
// BILLING READINESS
// ============================================================================

router.get('/billing', adminOnly, async (req, res) => {
  try {
    const overview = await getAdminBillingOverview({
      ownerType: req.query.ownerType || '',
      limit: req.query.limit || 30,
    });
    res.json(overview);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load billing overview.' });
  }
});

router.get('/billing/partner/:partnerId', adminOnly, async (req, res) => {
  try {
    const billing = await getPartnerBillingSummary(req.params.partnerId);
    res.json({ billing });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load partner billing.' });
  }
});

router.post(
  '/billing/subscriptions',
  adminOnly,
  [
    body('ownerType').isIn(['user', 'partner']).withMessage('ownerType must be user or partner.'),
    body('ownerId').trim().notEmpty().withMessage('ownerId is required.'),
    body('planType').trim().notEmpty().withMessage('planType is required.'),
    body('status').optional().isIn(['trial', 'active', 'paused', 'cancelled', 'expired']).withMessage('Invalid subscription status.'),
    body('pilotOverride.type').optional().isIn(['', 'internal_pilot', 'free_pilot', 'paid_pilot', 'extended_trial']).withMessage('Invalid pilot override.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const subscription = await setBillingSubscription({
        ownerType: req.body.ownerType,
        ownerId: req.body.ownerId,
        planType: req.body.planType,
        status: req.body.status || 'trial',
        studentLimit: req.body.studentLimit,
        staffLimit: req.body.staffLimit,
        pilotOverride: req.body.pilotOverride || {},
        updatedByUserId: req.user.id,
      });
      res.status(201).json({ subscription });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to save subscription.' });
    }
  }
);

// ============================================================================
// DOMAIN HEALTH
// ============================================================================

router.get('/domain-health', adminOnly, async (req, res) => {
  try {
    res.json(getDomainHealthReport());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load domain health.' });
  }
});

router.get('/misconception-coverage', adminOnly, async (req, res) => {
  try {
    res.json(buildMisconceptionCoverageMatrix());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load misconception coverage.' });
  }
});

router.get('/fractions-misconception-integrity', adminOnly, async (req, res) => {
  try {
    const coverage = buildMisconceptionCoverageMatrix();
    const density = buildMisconceptionDensityReport();
    const interventions = auditMisconceptionInterventionCoverage();
    const weakRechecks = interventions.rows
      .filter((row) => !row.recheckStrategy || row.recheckStrategy === 'skill_recheck')
      .map((row) => row.misconceptionId);
    const weakInterventions = interventions.missingInterventions.map((row) => ({
      misconceptionId: row.misconceptionId,
      missing: row.missing,
    }));
    res.json({
      generatedAt: new Date().toISOString(),
      coveragePercent: coverage.coveragePercent,
      sparseSkills: density.sparseSkills,
      unreferencedMisconceptions: density.unreferencedMisconceptions,
      weakRechecks,
      weakInterventions,
      confidenceDistribution: {
        strongSkills: coverage.rows.filter((r) => r.coverageBand === 'strong').length,
        partialSkills: coverage.rows.filter((r) => r.coverageBand === 'partial').length,
        thinSkills: coverage.rows.filter((r) => r.coverageBand === 'thin').length,
      },
      totalMisconceptions: density.totalMisconceptions,
      totalSkills: coverage.skillCount,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load misconception integrity report.' });
  }
});

router.get('/fractions-skill-integrity', adminOnly, async (req, res) => {
  try {
    res.json(buildFractionsSkillIntegrityReport({
      canonicalSkills: listCanonicalFractionSkills(),
      questionFamilies: fractionQuestionFamilies,
    }));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load Fractions skill integrity report.' });
  }
});

router.get('/diagnostic-validation', adminOnly, async (req, res) => {
  try {
    const report = await getDiagnosticValidationReport({
      studentId: req.query.studentId,
      subjectId: req.query.subjectId || 'math',
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 50,
    });
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load diagnostic validation.' });
  }
});

router.get('/learning-path-quality', adminOnly, async (req, res) => {
  try {
    const report = await getLearningPathQualityReport({
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 100,
    });
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load learning path quality.' });
  }
});

router.get('/mistake-learning-audit', adminOnly, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const mistakes = await Mistake.find({ module: req.query.module || 'MathPath' })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean();
    const audit = auditMasteryInflationRisk({ mistakes });
    const reviewedWithoutEvidence = mistakes.filter((mistake) => (
      mistake.reviewed
      && !mistake.masteryEvidence?.evidenceType
      && !mistake.understandingCheck?.passed
      && mistake.learningStatus !== 'mastered'
    ));
    const resolvedWithoutEvidence = mistakes.filter((mistake) => (
      (mistake.status === 'resolved' || mistake.resolved)
      && !mistake.masteryEvidence?.evidenceType
    ));
    res.json({
      generatedAt: new Date().toISOString(),
      checkedMistakes: mistakes.length,
      ...audit,
      rows: [...reviewedWithoutEvidence, ...resolvedWithoutEvidence].slice(0, 50).map((mistake) => ({
        mistakeId: String(mistake._id),
        studentId: String(mistake.studentId || ''),
        skillCode: mistake.skillCode || '',
        learningStatus: mistake.learningStatus || (mistake.reviewed ? 'acknowledged' : 'new'),
        status: mistake.status,
        reviewed: Boolean(mistake.reviewed),
        hasUnderstandingEvidence: Boolean(mistake.understandingCheck?.passed),
        hasMasteryEvidence: Boolean(mistake.masteryEvidence?.evidenceType),
        riskType: (mistake.status === 'resolved' || mistake.resolved) && !mistake.masteryEvidence?.evidenceType
          ? 'resolved_without_evidence'
          : 'reviewed_without_evidence',
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistake learning audit.' });
  }
});

router.get('/mathpath/legacy-mistake-evidence-audit', adminOnly, async (req, res) => {
  try {
    const report = await getLegacyMistakeEvidenceAudit({
      MistakeModel: Mistake,
      module: req.query.module || 'MathPath',
      studentId: req.query.studentId || '',
      limit: req.query.limit || 500,
      exportRows: req.query.export === '1' || req.query.export === 'true',
    });
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load legacy mistake evidence audit.' });
  }
});

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
    const { status = 'pending_verification', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const tutorProfiles = await TutorProfile.find({ status: status })
      .populate('userId', 'name email phone avatar')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await TutorProfile.countDocuments({ status: status });

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
        gradeLevel: t.gradeLevel,
        hourlyRate: t.hourlyRate,
        totalHoursTaught: t.totalHoursTaught,
        status: t.status,
        credentialsUrl: t.credentialsUrl,
        submittedAt: t.createdAt,
        bio: t.bio,
        education: t.education,
        experience: t.experience
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
          status: action === 'approve' ? 'verified' : 'rejected',
          verificationNotes: notes,
          verifiedAt: new Date(),
          verifiedBy: req.user.id
        },
        { new: true }
      ).populate('userId', 'name email');

      if (!tutorProfile) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      // Send email to tutor with decision
      try {
        if (action === 'approve') {
          await sendTutorApprovalEmail({
            name: tutorProfile.userId.name,
            email: tutorProfile.userId.email
          });
        } else {
          await sendTutorRejectionEmail({
            name: tutorProfile.userId.name,
            email: tutorProfile.userId.email
          }, notes);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: `Tutor ${action === 'approve' ? 'verified' : 'rejected'}`,
        tutor: {
          name: tutorProfile.userId.name,
          email: tutorProfile.userId.email,
          status: tutorProfile.status
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
    const verifiedTutors = await TutorProfile.countDocuments({ status: 'verified' });
    const pendingVerification = await TutorProfile.countDocuments({ status: 'pending_verification' });

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
      { $match: { status: 'verified' } },
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
    ]);

    const avgMatchSuccess = await TutorProfile.aggregate([
      { $match: { status: 'verified' } },
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

// @route   GET /api/admin/mathpath-pilot
// @desc    Lightweight internal MathPath Fractions pilot monitor
// @access  Private (admin only)
router.get('/mathpath-pilot', adminOnly, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const maxStudents = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const students = await User.find({
      $and: [
        { $or: [{ role: 'student' }, { roles: 'student' }] },
        {
          $or: [
            { is_test_account: true },
            { email: /@tianos\.test$/i },
          ],
        },
      ],
    })
      .select('name email is_test_account lastLogin createdAt')
      .sort({ createdAt: -1 })
      .limit(maxStudents)
      .lean();

    const studentIds = students.map((student) => String(student._id));
    const [
      diagnostics,
      practiceSessions,
      attempts,
      mistakes,
      workings,
      helpRequests,
    ] = await Promise.all([
      MathPathDiagnosticSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
      MathPathPracticeSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
      MathPathAttempt.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ createdAt: -1 }).lean(),
      MathPathMistakeRecord.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ lastSeenAt: -1 }).lean(),
      MathPathWorkingSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
      MathPathAttempt.find({ studentId: { $in: studentIds }, domainId: 'fractions', helpRequested: true }).sort({ createdAt: -1 }).lean(),
    ]);

    const byStudent = (items) => items.reduce((acc, item) => {
      const id = String(item.studentId || '');
      if (!acc.has(id)) acc.set(id, []);
      acc.get(id).push(item);
      return acc;
    }, new Map());

    const diagnosticsByStudent = byStudent(diagnostics);
    const practiceByStudent = byStudent(practiceSessions);
    const attemptsByStudent = byStudent(attempts);
    const mistakesByStudent = byStudent(mistakes);
    const workingsByStudent = byStudent(workings);
    const helpByStudent = byStudent(helpRequests);

    const pilotStudents = students.map((student) => {
      const id = String(student._id);
      const ds = diagnosticsByStudent.get(id) || [];
      const ps = practiceByStudent.get(id) || [];
      const as = attemptsByStudent.get(id) || [];
      const ms = mistakesByStudent.get(id) || [];
      const ws = workingsByStudent.get(id) || [];
      const hs = helpByStudent.get(id) || [];
      const latestDiagnostic = ds[0] || null;
      const latestPractice = ps[0] || null;
      const latestAttempt = as[0] || null;
      const latestWorking = ws[0] || null;
      const workingSubmitted = ws.filter((working) => ['submitted', 'mapped', 'analysisReady'].includes(working.status)).length;
      const workingPending = ws.filter((working) => working.status === 'pending' || working.analysisStatus === 'pending_analysis').length;
      const practiceCompleted = ps.filter((session) => session.status === 'completed').length;
      const diagnosticStatus = latestDiagnostic?.status || 'notStarted';
      const currentSkillId = latestPractice?.targetSkillId || latestAttempt?.skillId || latestDiagnostic?.targetSkillIds?.[0] || '';
      const lastActivityAt = latestDate(
        student.lastLogin,
        latestDiagnostic?.updatedAt,
        latestDiagnostic?.completedAt,
        latestPractice?.updatedAt,
        latestPractice?.completedAt,
        latestAttempt?.createdAt,
        latestWorking?.updatedAt,
        latestWorking?.submittedAt
      );
      const correctAttempts = as.filter((attempt) => attempt.correct).length;
      const accuracy = as.length ? Math.round((correctAttempts / as.length) * 100) : null;
      const risk = riskForStudent({
        diagnosticStatus,
        practiceCompleted,
        mistakes: ms.length,
        workingPending,
        helpRequests: hs.length,
        lastActivityAt,
      });

      return {
        studentId: id,
        name: student.name,
        email: student.email,
        isTestAccount: !!student.is_test_account,
        lastLogin: student.lastLogin || null,
        lastActivityAt,
        diagnosticStatus,
        diagnosticCompleted: ds.filter((session) => session.status === 'completed').length,
        practiceSessions: ps.length,
        practiceCompleted,
        attempts: as.length,
        accuracy,
        currentSkillId,
        mistakesCaptured: ms.length,
        highSeverityMistakes: ms.filter((mistake) => mistake.severity === 'high').length,
        workingSessions: ws.length,
        workingSubmitted,
        workingPending,
        helpRequests: hs.length,
        risk,
        links: {
          studentProfile: `/admin/users/${id}`,
          mathPathProgress: `/student/mathpath`,
          workingReview: `/student/mathpath/working/upload`,
        },
      };
    });

    const summary = {
      totalStudents: pilotStudents.length,
      diagnosticsCompleted: pilotStudents.filter((student) => student.diagnosticStatus === 'completed').length,
      practiceCompleted: pilotStudents.reduce((sum, student) => sum + student.practiceCompleted, 0),
      attempts: pilotStudents.reduce((sum, student) => sum + student.attempts, 0),
      mistakesCaptured: pilotStudents.reduce((sum, student) => sum + student.mistakesCaptured, 0),
      workingSubmitted: pilotStudents.reduce((sum, student) => sum + student.workingSubmitted, 0),
      helpRequests: pilotStudents.reduce((sum, student) => sum + student.helpRequests, 0),
      riskCounts: pilotStudents.reduce((acc, student) => {
        acc[student.risk] = (acc[student.risk] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary,
      students: pilotStudents,
    });
  } catch (error) {
    console.error('MathPath pilot monitor error:', error);
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
