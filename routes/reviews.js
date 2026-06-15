import express from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import TutorProfile from '../models/TutorProfile.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post(
  '/',
  protect,
  [
    body('bookingId', 'Booking ID is required').notEmpty(),
    body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    body('comment', 'Comment is required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookingId, rating, comment, title } = req.body;

      // Get booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Determine reviewer role and subject
      let authorRole;
      let subjectId;

      if (booking.parentId.toString() === req.user.id) {
        authorRole = 'parent';
        subjectId = booking.tutorId;
      } else if (booking.tutorId.toString() === req.user.id) {
        authorRole = 'tutor';
        subjectId = booking.parentId;
      } else {
        return res.status(403).json({ error: 'Not authorized to review this booking' });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        bookingId,
        authorId: req.user.id
      });

      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this booking' });
      }

      // Create review
      const review = new Review({
        bookingId,
        authorId: req.user.id,
        subjectId,
        rating,
        title,
        comment,
        authorRole
      });

      await review.save();

      // Update tutor rating if review is for tutor
      if (authorRole === 'parent') {
        const tutorProfile = await TutorProfile.findOne({ userId: subjectId });
        if (tutorProfile) {
          const allReviews = await Review.find({ subjectId });
          const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
          tutorProfile.rating.average = parseFloat(avgRating.toFixed(1));
          tutorProfile.rating.count = allReviews.length;
          await tutorProfile.save();
        }
      }

      await review.populate('authorId', 'name avatar');
      await review.populate('subjectId', 'name avatar');

      res.status(201).json({ success: true, review });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const reviews = await Review.find({ subjectId: req.params.userId })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const totalCount = await Review.countDocuments({ subjectId: req.params.userId });

    res.json({
      success: true,
      count: reviews.length,
      total: totalCount,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('authorId', 'name avatar')
      .populate('subjectId', 'name avatar')
      .populate('bookingId', 'subject scheduledDate status');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put(
  '/:id',
  protect,
  [
    body('rating', 'Rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    body('comment', 'Comment cannot be empty').optional().trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (review.authorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this review' });
      }

      const { rating, comment, title } = req.body;

      if (rating) review.rating = rating;
      if (comment) review.comment = comment;
      if (title) review.title = title;
      review.updatedAt = new Date();

      await review.save();

      // Recalculate tutor rating
      const allReviews = await Review.find({ subjectId: review.subjectId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      const tutorProfile = await TutorProfile.findOne({ userId: review.subjectId });
      if (tutorProfile) {
        tutorProfile.rating.average = parseFloat(avgRating.toFixed(1));
        tutorProfile.rating.count = allReviews.length;
        await tutorProfile.save();
      }

      res.json({ success: true, review });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already marked as helpful
    if (review.helpful.userIds.includes(req.user.id)) {
      return res.status(400).json({ error: 'You already marked this review as helpful' });
    }

    review.helpful.count += 1;
    review.helpful.userIds.push(req.user.id);
    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const subjectId = review.subjectId;
    await Review.deleteOne({ _id: req.params.id });

    // Recalculate tutor rating
    const allReviews = await Review.find({ subjectId });
    const tutorProfile = await TutorProfile.findOne({ userId: subjectId });
    if (tutorProfile) {
      if (allReviews.length > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        tutorProfile.rating.average = parseFloat(avgRating.toFixed(1));
      } else {
        tutorProfile.rating.average = 0;
      }
      tutorProfile.rating.count = allReviews.length;
      await tutorProfile.save();
    }

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
