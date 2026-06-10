import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import AgencyTutorCharge from '../models/AgencyTutorCharge.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import TutorProfile from '../models/TutorProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendPaymentConfirmationEmail } from '../utils/emailService.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/payments/create-intent
// @desc    Create a Stripe payment intent for a booking
// @access  Private (parent only)
router.post(
  '/create-intent',
  protect,
  authorize('parent'),
  [
    body('bookingId', 'Booking ID is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookingId } = req.body;

      // Get booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Verify ownership
      if (booking.parentId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if already paid
      if (booking.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'Booking already paid' });
      }

      // Create payment record
      let payment = await Payment.findOne({ bookingId });

      if (!payment) {
        payment = new Payment({
          bookingId,
          parentId: req.user.id,
          tutorId: booking.tutorId,
          amount: booking.totalCost,
          platformFee: booking.totalCost * 0.12,
          tutorPayout: booking.totalCost * 0.88
        });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.totalCost * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          bookingId: booking._id.toString(),
          parentId: req.user.id
        }
      });

      payment.stripePaymentIntentId = paymentIntent.id;
      payment.status = 'pending';
      await payment.save();

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        amount: booking.totalCost
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/payments/confirm
// @desc    Confirm payment after Stripe processing
// @access  Private
router.post(
  '/confirm',
  protect,
  [
    body('paymentIntentId', 'Payment intent ID is required').notEmpty(),
    body('bookingId', 'Booking ID is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentIntentId, bookingId } = req.body;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Payment was not successful' });
      }

      // Update payment record
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      payment.status = 'succeeded';
      payment.stripeChargeId =
        paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id || null;
      await payment.save();

      // Update booking
      const booking = await Booking.findById(bookingId);
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id;
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();

      // Send payment confirmation email
      try {
        const parent = await User.findById(payment.parentId);
        if (parent) {
          await sendPaymentConfirmationEmail(parent, booking, payment.amount);
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the payment if email fails
      }

      res.json({
        success: true,
        payment,
        message: 'Payment successful. Booking confirmed.'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/payments/:bookingId
// @desc    Get payment details
// @access  Private
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check authorization
    if (
      payment.parentId.toString() !== req.user.id &&
      payment.tutorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/payments/refund
// @desc    Refund a payment
// @access  Private (admin or tutor/parent of the payment)
router.post(
  '/refund',
  protect,
  [
    body('paymentId', 'Payment ID is required').notEmpty(),
    body('reason', 'Refund reason is required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentId, reason } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Verify authorization
      if (payment.parentId.toString() !== req.user.id && payment.tutorId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to refund this payment' });
      }

      if (payment.status !== 'succeeded') {
        return res.status(400).json({ error: 'Can only refund succeeded payments' });
      }

      if (payment.status === 'refunded') {
        return res.status(400).json({ error: 'Payment already refunded' });
      }

      // Process refund with Stripe
      try {
        await stripe.refunds.create({
          charge: payment.stripeChargeId
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ error: 'Failed to process refund with payment processor' });
      }

      // Update payment record
      payment.status = 'refunded';
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      await payment.save();

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        payment
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/payments/history
// @desc    Get payment history for authenticated user
// @access  Private
router.get('/history/:role', protect, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (role === 'parent') {
      filter.parentId = req.user.id;
    } else if (role === 'tutor') {
      filter.tutorId = req.user.id;
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'subject scheduledDate')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      payments: payments.map(p => ({
        _id: p._id,
        amount: p.amount,
        platformFee: p.platformFee,
        tutorPayout: p.tutorPayout,
        status: p.status,
        booking: p.bookingId,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook for payment events
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment succeeded - update booking
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({
          stripePaymentIntentId: paymentIntent.id
        });
        if (payment) {
          payment.status = 'succeeded';
          await payment.save();

          const booking = await Booking.findById(payment.bookingId);
          if (booking) {
            booking.paymentStatus = 'paid';
            await booking.save();
          }
        }
        // Gap B: finalise an agency→tutor charge (direct charge on a connected
        // account, matched by PaymentIntent id) and activate its subscription.
        {
          const agencyCharge = await AgencyTutorCharge.findOne({
            stripePaymentIntentId: paymentIntent.id,
            status: { $ne: 'succeeded' },
          });
          if (agencyCharge) {
            agencyCharge.status = 'succeeded';
            await agencyCharge.save();
            if (agencyCharge.subscriptionId) {
              await Subscription.findByIdAndUpdate(agencyCharge.subscriptionId, {
                $set: {
                  status: 'active',
                  currentPeriodStart: agencyCharge.periodStart,
                  currentPeriodEnd: agencyCharge.periodEnd,
                },
              });
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        // Payment failed
        const failedIntent = event.data.object;
        const failedPayment = await Payment.findOne({
          stripePaymentIntentId: failedIntent.id
        });
        if (failedPayment) {
          failedPayment.status = 'failed';
          await failedPayment.save();
        }
        await AgencyTutorCharge.findOneAndUpdate(
          { stripePaymentIntentId: failedIntent.id, status: { $ne: 'succeeded' } },
          { $set: { status: 'failed' } }
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
