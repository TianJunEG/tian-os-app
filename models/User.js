import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['parent', 'tutor', 'teacher', 'admin', 'student'],
    default: 'parent'
  },
  // Tian OS multi-role model: a single account may hold several roles
  // (e.g. a school teacher who is also a private tutor). `role` above is the
  // legacy primary role, kept for backward compatibility; `roles` is the source
  // of truth for feature access going forward. See docs/tian-os-master-product-spec.md §4.
  roles: {
    type: [String],
    enum: ['parent', 'tutor', 'teacher', 'admin', 'student'],
    default: undefined
  },
  // The workspace a user lands in by default after login.
  defaultWorkspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null
  },
  // For student accounts: the parent/tutor who provisioned and owns them.
  linkedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  phone: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending_verification', 'verified', 'suspended'],
    default: 'active'
  },
  parentProfile: {
    studentName: String,
    studentAge: Number,
    gradeLevel: String,
    primarySubject: String,
    otherSubjects: [String],
    learningGoals: String,
    specificChallenges: String,
    preferredTutorGender: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any'
    },
    learningStyle: {
      type: String,
      enum: ['adaptive', 'visual', 'auditory', 'kinesthetic', 'mixed'],
      default: 'adaptive'
    },
    preferredSessionType: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'online'
    },
    timezone: String,
    budget: Number,
    availability: mongoose.Schema.Types.Mixed
  },
  // Children/learners a parent manages — each gets its own cross-app learning profile.
  children: [{
    name: { type: String, required: true, trim: true },
    level: { type: String, default: '' }, // e.g. "Primary 5", "Secondary 3"
    createdAt: { type: Date, default: Date.now }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
