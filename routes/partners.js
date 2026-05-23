import express from 'express';
import { body, validationResult } from 'express-validator';
import PartnerInquiry from '../models/PartnerInquiry.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendPartnerInquiryNotificationEmail } from '../utils/emailService.js';

const router = express.Router();

// @route   POST /api/partners/inquiries
// @desc    Submit a partnership inquiry
// @access  Public
router.post(
  '/inquiries',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    body('organization').optional().trim().isLength({ max: 150 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, organization, email, message } = req.body;
      const inquiry = await PartnerInquiry.create({ name, organization, email, message });

      // Notify the team, but don't fail the submission if email is unavailable.
      try {
        await sendPartnerInquiryNotificationEmail(inquiry);
      } catch (emailError) {
        console.error('Partner inquiry notification failed:', emailError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Thank you for your interest. Our team will be in touch.',
        inquiryId: inquiry._id
      });
    } catch (error) {
      console.error('Partner inquiry error:', error);
      res.status(500).json({ message: 'Could not submit inquiry. Please try again.' });
    }
  }
);

// @route   GET /api/partners/inquiries
// @desc    List partnership inquiries
// @access  Private (admin only)
router.get('/inquiries', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inquiries, total] = await Promise.all([
      PartnerInquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      PartnerInquiry.countDocuments(filter)
    ]);

    res.json({
      inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (error) {
    console.error('List partner inquiries error:', error);
    res.status(500).json({ message: 'Error fetching inquiries' });
  }
});

export default router;
