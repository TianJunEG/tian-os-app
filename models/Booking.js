import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Please specify the subject']
  },
  duration: {
    type: Number,
    required: [true, 'Please specify duration in hours'],
    min: [0.5, 'Minimum duration is 0.5 hours'],
    max: [4, 'Maximum duration is 4 hours']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Please schedule a date']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  // Session timing and tracking
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  actualDuration: {
    type: Number,
    default: null // Will be calculated from actual start/end times
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  sessionType: {
    type: String,
    enum: ['in-person', 'online'],
    default: 'online'
  },
  meetingLink: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  parentRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    createdAt: Date
  },
  tutorRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    createdAt: Date
  },
  cancellationReason: {
    type: String,
    default: null
  },
  // Session notes (mandatory after session completion)
  sessionNotes: {
    type: {
      topicsCovered: [String],          // Topics covered in session (dropdown options)
      studentUnderstanding: {            // Level of understanding
        type: String,
        enum: ['struggling', 'ok', 'mastered']
      },
      homeworkAssigned: String,          // Homework given to student
      dueDate: Date,                      // When homework is due
      parentActionItems: [String],       // What parent should do at home
      redFlags: [String],                 // Any concerns (struggling with X, fell behind, etc)
      additionalNotes: String,            // Any other notes
      submittedAt: Date,                  // When notes were submitted
      submittedBy: {                      // Which tutor submitted
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    default: null
  },
  // Dispute resolution
  dispute: {
    type: {
      flaggedAt: Date,
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,                     // 'payment', 'quality', 'cancellation', 'no-show', other
      description: String,
      status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
      },
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolution: String,                 // Admin's resolution
      action: {                            // Action taken
        type: String,
        enum: ['refund', 'keep', 'other']
      }
    },
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

// Index for faster queries
bookingSchema.index({ parentId: 1, createdAt: -1 });
bookingSchema.index({ tutorId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.model('Booking', bookingSchema);
