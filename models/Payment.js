import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true,
    default: function() {
      return this.amount * 0.1; // 10% platform fee
    }
  },
  tutorPayout: {
    type: Number,
    required: true,
    default: function() {
      return this.amount - this.platformFee;
    }
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeChargeId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer'],
    default: 'card'
  },
  refundReason: {
    type: String,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ parentId: 1, createdAt: -1 });
paymentSchema.index({ tutorId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);
