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
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['parent', 'tutor', 'admin'],
    default: 'parent'
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
