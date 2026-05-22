# AEO Backend Architecture
## Node.js + Express + MongoDB

### Project Structure

```
aeo-backend/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── jwt.js               # JWT configuration
│   └── stripe.js            # Stripe API setup
├── middleware/
│   ├── auth.js              # JWT verification, role-based access
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # Parent/Tutor/Admin base model
│   ├── Parent.js            # Parent-specific schema
│   ├── Tutor.js             # Tutor-specific schema with qualifications
│   ├── Admin.js             # Admin schema
│   ├── Subject.js           # Tutoring subjects
│   ├── Session.js           # Booking sessions
│   ├── Review.js            # Ratings & reviews
│   ├── Payment.js           # Payment records
│   └── Availability.js      # Tutor availability slots
├── routes/
│   ├── auth.js              # Login/signup/password reset
│   ├── parent.js            # Parent operations
│   ├── tutor.js             # Tutor operations
│   ├── admin.js             # Admin operations
│   ├── search.js            # Tutor search & matching
│   ├── sessions.js          # Booking & session management
│   ├── payments.js          # Payment processing
│   └── reviews.js           # Review management
├── controllers/
│   └── (controller files for each route)
├── services/
│   ├── authService.js       # Authentication logic
│   ├── matchingService.js   # Smart tutor matching algorithm
│   ├── paymentService.js    # Payment processing
│   └── emailService.js      # Email notifications
├── utils/
│   ├── logger.js            # Logging
│   └── helpers.js           # Helper functions
├── .env                     # Environment variables
├── server.js                # Main app entry point
└── package.json
```

---

## Database Schemas

### 1. User (Base Document)
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  profileImage: String (URL),
  role: String ('parent', 'tutor', 'admin'),
  
  // Auth
  emailVerified: Boolean,
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Account
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean,
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: { type: 'Point', coordinates: [longitude, latitude] }
  }
}
```

### 2. Parent (Extends User)
```javascript
{
  // Inherits from User
  userId: ObjectId (ref: User),
  
  // Student Info
  students: [{
    name: String,
    grade: String,
    school: String,
    learningStyle: String ('visual', 'auditory', 'kinesthetic', 'reading-writing'),
    subjects: [ObjectId] (ref: Subject),
    goals: [String],
    preferredTutorQualities: [String]
  }],
  
  // Payment
  stripeCustomerId: String,
  paymentMethods: [{
    stripePaymentMethodId: String,
    isDefault: Boolean,
    last4: String,
    expMonth: Number,
    expYear: Number
  }],
  
  // Preferences
  preferences: {
    maxHourlyRate: Number,
    preferredSessionDuration: Number (in minutes),
    timezone: String,
    communicationPreference: String ('email', 'sms', 'both')
  },
  
  // Activity
  savedTutors: [ObjectId] (ref: Tutor),
  sessionHistory: [ObjectId] (ref: Session),
  totalSessionsCompleted: Number,
  averageRating: Number
}
```

### 3. Tutor (Extends User)
```javascript
{
  // Inherits from User
  userId: ObjectId (ref: User),
  
  // Professional Info
  bio: String,
  subjects: [{
    subjectId: ObjectId (ref: Subject),
    proficiencyLevel: String ('beginner', 'intermediate', 'advanced', 'expert'),
    yearsOfExperience: Number,
    certifications: [String]
  }],
  
  // Qualifications
  education: [{
    degree: String,
    field: String,
    institution: String,
    graduationYear: Number
  }],
  
  // Verification
  backgroundCheckStatus: String ('pending', 'approved', 'rejected'),
  backgroundCheckDate: Date,
  identityVerified: Boolean,
  identityVerificationDate: Date,
  
  // Pricing
  hourlyRate: Number (base rate),
  specializedRates: [{
    subjectId: ObjectId,
    rate: Number
  }],
  groupSessionRate: Number,
  
  // Availability
  timezone: String,
  availability: [{
    dayOfWeek: Number (0-6),
    startTime: String (HH:mm),
    endTime: String (HH:mm),
    isAvailable: Boolean
  }],
  
  // Performance
  totalSessionsCompleted: Number,
  totalHoursTaught: Number,
  averageRating: Number,
  responseTime: Number (in minutes),
  cancellationRate: Number,
  
  // Bank Info (for payments)
  bankAccount: {
    stripeConnectId: String,
    accountHolderName: String,
    last4: String,
    verified: Boolean
  },
  
  // Preferences
  preferredStudentAge: { min: Number, max: Number },
  teachingStyle: [String],
  maxStudentsPerMonth: Number,
  specialties: [String],
  
  // Activity
  bookedSessions: [ObjectId] (ref: Session),
  reviews: [ObjectId] (ref: Review),
  messageCount: Number
}
```

### 4. Admin
```javascript
{
  // Inherits from User
  userId: ObjectId (ref: User),
  
  // Permissions
  permissions: [String],
  role: String ('moderator', 'content_admin', 'financial_admin', 'super_admin'),
  
  // Activity Log
  activityLog: [{
    action: String,
    targetUser: ObjectId,
    targetModel: String,
    description: String,
    timestamp: Date
  }],
  
  // Moderation
  reportsHandled: Number,
  disputesResolved: Number,
  tutorsApproved: Number,
  tutorsRejected: Number
}
```

### 5. Subject
```javascript
{
  _id: ObjectId,
  name: String (unique),
  category: String ('math', 'science', 'languages', 'test-prep', 'arts', 'other'),
  description: String,
  icon: String (emoji or icon name),
  popularGrades: [String],
  isActive: Boolean,
  tutorCount: Number,
  createdAt: Date
}
```

### 6. Session (Booking)
```javascript
{
  _id: ObjectId,
  
  // Participants
  parentId: ObjectId (ref: Parent),
  studentName: String,
  tutorId: ObjectId (ref: Tutor),
  
  // Session Details
  subject: ObjectId (ref: Subject),
  title: String,
  description: String,
  
  // Scheduling
  scheduledDate: Date,
  startTime: Date (ISO 8601),
  endTime: Date (ISO 8601),
  durationMinutes: Number,
  
  // Status
  status: String ('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'),
  cancellationReason: String,
  cancelledBy: String ('parent', 'tutor', 'admin'),
  cancelledAt: Date,
  
  // Location/Method
  type: String ('online', 'in-person'),
  location: {
    address: String,
    coordinates: { type: 'Point', coordinates: [longitude, latitude] }
  },
  meetingLink: String (Zoom/Meet link),
  
  // Payment
  hourlyRate: Number,
  totalPrice: Number,
  paymentStatus: String ('pending', 'completed', 'refunded'),
  paymentId: ObjectId (ref: Payment),
  
  // Completion
  actualStartTime: Date,
  actualEndTime: Date,
  notes: String,
  homeworkAssigned: String,
  
  // Feedback
  parentFeedback: {
    rating: Number (1-5),
    review: String,
    submittedAt: Date
  },
  tutorFeedback: {
    studentEngagement: String,
    topicsCoversed: [String],
    homeworkGiven: String,
    submittedAt: Date
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Review
```javascript
{
  _id: ObjectId,
  
  // Parties
  reviewerId: ObjectId (ref: Parent or Tutor),
  revieweeId: ObjectId (ref: Tutor or Parent),
  reviewerRole: String ('parent', 'tutor'),
  
  // Session Reference
  sessionId: ObjectId (ref: Session),
  
  // Review Content
  rating: Number (1-5, required),
  title: String,
  comment: String,
  
  // Aspects (for tutors)
  teachingQuality: Number (1-5),
  communication: Number (1-5),
  timeliness: Number (1-5),
  professionalism: Number (1-5),
  
  // Aspects (for parents)
  studentEngagement: Number (1-5),
  studentProgress: Number (1-5),
  
  // Moderation
  isVerified: Boolean,
  isFlagged: Boolean,
  flagReason: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Payment
```javascript
{
  _id: ObjectId,
  
  // Transaction Details
  sessionId: ObjectId (ref: Session),
  parentId: ObjectId (ref: Parent),
  tutorId: ObjectId (ref: Tutor),
  
  // Amount
  amount: Number,
  currency: String ('USD'),
  platformFee: Number (AEO's commission),
  tutorPayout: Number,
  
  // Stripe Details
  stripePaymentIntentId: String,
  stripePaymentMethodId: String,
  
  // Status
  status: String ('pending', 'succeeded', 'failed', 'refunded'),
  failureReason: String,
  
  // Payout
  payoutStatus: String ('pending', 'scheduled', 'completed'),
  payoutDate: Date,
  payoutAmount: Number,
  stripeManagedAccountId: String,
  
  // Timestamps
  createdAt: Date,
  processedAt: Date
}
```

### 9. Availability (Tutor Slots)
```javascript
{
  _id: ObjectId,
  tutorId: ObjectId (ref: Tutor),
  
  // Recurring Availability
  dayOfWeek: Number (0=Sunday, 6=Saturday),
  startTime: String (HH:mm, 24-hour),
  endTime: String (HH:mm, 24-hour),
  isRecurring: Boolean,
  
  // One-off Availability
  specificDate: Date,
  specificStartTime: Date (ISO),
  specificEndTime: Date (ISO),
  
  // Booking Status
  bookedSlots: [{
    sessionId: ObjectId (ref: Session),
    startTime: Date,
    endTime: Date
  }],
  
  // Preferences
  acceptsGroupSessions: Boolean,
  minimumNoticeHours: Number,
  bufferTimeMinutes: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints Structure

### Authentication Routes
```
POST   /api/auth/parent-signup
POST   /api/auth/tutor-signup
POST   /api/auth/admin-login
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token
POST   /api/auth/verify-email/:token
```

### Tutor Search & Matching
```
GET    /api/search/tutors (filters: subject, rate, location, rating, availability)
GET    /api/tutors/:id
GET    /api/tutors/:id/availability
POST   /api/tutors/:id/favorite
GET    /api/parent/saved-tutors
GET    /api/match/recommended (returns matched tutors for parent)
```

### Booking & Sessions
```
POST   /api/sessions/book
GET    /api/sessions (parent's sessions)
GET    /api/tutor/sessions (tutor's sessions)
GET    /api/sessions/:id
PATCH  /api/sessions/:id/reschedule
PATCH  /api/sessions/:id/cancel
PATCH  /api/sessions/:id/complete
POST   /api/sessions/:id/notes
```

### Messaging
```
POST   /api/messages
GET    /api/messages/:conversationId
GET    /api/conversations
POST   /api/conversations/create
```

### Reviews & Ratings
```
POST   /api/reviews/session/:sessionId
GET    /api/tutors/:id/reviews
PATCH  /api/reviews/:id (tutor can respond to reviews)
POST   /api/reviews/:id/flag (report inappropriate review)
```

### Payments
```
POST   /api/payments/create-intent (initiate Stripe payment)
POST   /api/payments/webhook (Stripe webhook)
GET    /api/payments/history
GET    /api/tutor/payouts
POST   /api/tutor/withdraw (request payout)
```

### User Profile
```
GET    /api/profile
PATCH  /api/profile
PATCH  /api/profile/availability (tutors)
POST   /api/profile/upload-avatar
GET    /api/parent/dashboard
GET    /api/tutor/dashboard
```

### Admin Routes
```
GET    /api/admin/users (paginated)
GET    /api/admin/tutors/pending-approval
PATCH  /api/admin/tutors/:id/approve
PATCH  /api/admin/tutors/:id/reject
GET    /api/admin/sessions (all sessions)
GET    /api/admin/disputes
POST   /api/admin/disputes/:id/resolve
GET    /api/admin/analytics
POST   /api/admin/users/:id/suspend
```

---

## Environment Variables (.env)
```
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/aeo

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@aeo.app
SENDGRID_TEMPLATES_ID=...

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=aeo-uploads
AWS_REGION=us-east-1

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

---

## Key Features Implementation

### 1. Smart Matching Algorithm
- Subject expertise match
- Teaching style compatibility
- Availability alignment
- Geographic proximity (if in-person)
- Student personality compatibility
- Tutor availability and capacity
- Price range matching
- Rating/experience filtering

### 2. Payment Processing
- Stripe integration for secure payments
- Commission structure (platform takes 15-20%)
- Payout system for tutors (monthly or on-demand)
- Refund handling
- Invoice generation

### 3. Authentication
- JWT-based auth for all roles
- Email verification for new users
- Password reset flow
- Refresh tokens for extended sessions
- Role-based access control (RBAC)

### 4. Real-time Features
- Availability calendar
- Booking confirmations
- Message notifications
- Session reminders (24 hour before)

---

## Security Best Practices
- Password hashing (bcrypt)
- JWT expiration and refresh
- Rate limiting on auth endpoints
- CORS configuration
- MongoDB injection prevention
- XSS protection
- HTTPS enforcement
- Background check integration
- Identity verification for tutors
