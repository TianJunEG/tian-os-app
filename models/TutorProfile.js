import mongoose from 'mongoose';

const tutorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  headline: {
    type: String,
    maxlength: [100, 'Headline cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  qualifications: {
    type: String,
    maxlength: [500, 'Qualifications cannot exceed 500 characters']
  },
  specialties: [{
    type: String,
    enum: [
      'Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics',
      'History', 'Geography', 'Economics', 'Spanish', 'French', 'Chinese',
      'SAT Prep', 'ACT Prep', 'AP Exam Prep', 'GMAT', 'GRE', 'Music',
      'Art', 'Computer Science', 'Programming',
      'Math', 'Test Prep', 'Business', 'Arts', 'Sports', 'Other'
    ]
  }],
  grades: [{
    type: String,
    enum: [
      'Elementary', 'Middle School', 'High School', 'College',
      'Adult Learner', 'All Levels'
    ]
  }],
  gradeLevel: [{
    type: String,
    enum: [
      'K-2', 'Grade 3-5', 'Grade 6-8', 'Grade 9-10', 'Grade 11-12', 'College', 'Adult'
    ],
    default: []
  }],
  education: {
    type: String,
    enum: ['high_school', 'associates', 'bachelors', 'masters', 'phd'],
    default: ''
  },
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Please provide hourly rate'],
    min: [5, 'Rate must be at least $5'],
    max: [500, 'Rate cannot exceed $500']
  },
  availability: {
    monday: {
      available: { type: Boolean, default: true },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    tuesday: {
      available: { type: Boolean, default: true },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    wednesday: {
      available: { type: Boolean, default: true },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    thursday: {
      available: { type: Boolean, default: true },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    friday: {
      available: { type: Boolean, default: true },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    saturday: {
      available: { type: Boolean, default: false },
      start: { type: String, default: '10:00' },
      end: { type: String, default: '16:00' }
    },
    sunday: {
      available: { type: Boolean, default: false },
      start: { type: String, default: '10:00' },
      end: { type: String, default: '16:00' }
    },
    timeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalHoursTaught: {
    type: Number,
    default: 0
  },
  matchSuccessRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  responseTime: {
    type: String,
    enum: ['< 1 hour', '1-5 hours', '5-24 hours', '> 24 hours'],
    default: '< 1 hour'
  },
  languages: [{
    type: String
  }],
  certifications: {
    type: String,
    default: ''
  },
  credentialsUrl: {
    type: String,
    default: null
  },
  bankingInfo: {
    accountName: String,
    routingNumber: String,
    accountNumber: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings'],
      default: 'checking'
    }
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'suspended'],
    default: 'pending_verification'
  },
  verificationNotes: {
    type: String,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  cancelledBookings: {
    type: Number,
    default: 0
  },
  onboardingCompletedAt: {
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

// Index for verification queue
tutorProfileSchema.index({ status: 1, createdAt: -1 });
tutorProfileSchema.index({ userId: 1 });

export default mongoose.model('TutorProfile', tutorProfileSchema);
