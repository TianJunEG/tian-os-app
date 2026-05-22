import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  authorRole: {
    type: String,
    enum: ['parent', 'tutor'],
    required: true
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
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

reviewSchema.index({ subjectId: 1, createdAt: -1 });
reviewSchema.index({ authorId: 1 });
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ rating: 1 });

export default mongoose.model('Review', reviewSchema);
