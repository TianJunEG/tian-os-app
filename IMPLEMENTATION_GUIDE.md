# AEO Platform - Complete Implementation Guide

## Overview

AEO is a full-stack tutor matching and marketplace platform built with React, Node.js, Express, and MongoDB. This guide covers setup, architecture, deployment, and key features.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Stripe Account (for payments)
- AWS S3 Account (for file uploads)
- SendGrid Account (for emails)

### Backend Setup

```bash
# Create project directory
mkdir aeo-backend && cd aeo-backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors dotenv mongoose bcryptjs jsonwebtoken stripe multer aws-sdk sendgrid

# Create folder structure
mkdir config models routes controllers middleware services utils
touch server.js .env

# Start with template files (see backend-setup.md)
```

### Frontend Setup

```bash
# Create React app
npx create-react-app aeo-frontend
cd aeo-frontend

# Install dependencies
npm install react-router-dom axios lucide-react

# Place components
cp landing-page.jsx src/pages/
cp frontend-auth-components.jsx src/components/
cp tutor-search-marketplace.jsx src/components/
cp booking-system.jsx src/components/
```

### Environment Configuration

Create `.env` file in backend root:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aeo
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
SENDGRID_API_KEY=SG...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
FRONTEND_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
aeo/
├── aeo-backend/
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── stripe.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Parent.js
│   │   ├── Tutor.js
│   │   ├── Admin.js
│   │   ├── Session.js
│   │   ├── Review.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tutor.js
│   │   ├── parent.js
│   │   ├── search.js
│   │   └── payments.js
│   ├── controllers/
│   │   └── (one per route)
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── matchingService.js
│   │   └── paymentService.js
│   ├── server.js
│   └── package.json
│
├── aeo-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── TutorDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   ├── AuthFlow.jsx
│   │   │   ├── TutorSearch.jsx
│   │   │   ├── BookingSystem.jsx
│   │   │   └── (shared components)
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
└── docs/
    ├── API.md
    ├── DATABASE.md
    └── DEPLOYMENT.md
```

---

## 🔑 Key Components & Flows

### 1. Authentication System

Three separate login flows with role-based access:

#### Parent Flow:
1. Sign Up → Enter basic info → Email verification → Dashboard
2. Sign In → Search tutors → Book sessions → Track progress

#### Tutor Flow:
1. Sign Up → Step 1 (Basic info) → Step 2 (Qualifications) → Step 3 (Banking) → Dashboard
2. Manage availability, view bookings, respond to messages

#### Admin Flow:
1. Sign In → Admin Dashboard
2. Manage users, approve tutors, handle disputes, view analytics

**Implementation (Backend):**

```javascript
// routes/auth.js
router.post('/parent-signup', async (req, res) => {
  const { email, password, firstName, lastName, city, state } = req.body;

  // Validate input
  if (!email || !password) return res.status(400).json({ message: 'Missing required fields' });

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ message: 'User already exists' });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create parent user
  const user = new User({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: 'parent'
  });

  const parent = new Parent({
    userId: user._id,
    address: { city, state }
  });

  await user.save();
  await parent.save();

  // Generate JWT token
  const token = jwt.sign({ userId: user._id, role: 'parent' }, process.env.JWT_SECRET);

  res.status(201).json({
    token,
    user: { id: user._id, email, role: 'parent', name: firstName }
  });
});
```

### 2. Tutor Search & Matching

**Smart Matching Algorithm:**

```javascript
// services/matchingService.js
async function findMatchedTutors(parentProfile) {
  const tutors = await Tutor.find()
    .populate('userId')
    .populate('subjects');

  const scoredTutors = tutors.map(tutor => {
    let score = 0;

    // Subject match (30 points max)
    const subjectMatch = parentProfile.subjects.filter(s =>
      tutor.subjects.find(ts => ts._id.equals(s))
    );
    score += (subjectMatch.length / parentProfile.subjects.length) * 30;

    // Rating match (20 points max)
    score += (tutor.averageRating / 5) * 20;

    // Availability match (20 points)
    if (hasOverlappingAvailability(tutor, parentProfile)) {
      score += 20;
    }

    // Price match (15 points)
    if (tutor.hourlyRate <= parentProfile.maxRate) {
      score += 15;
    }

    // Experience match (15 points)
    if (tutor.yearsOfExperience >= parentProfile.preferredExperience) {
      score += 15;
    }

    return { tutor, score };
  });

  return scoredTutors
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.tutor);
}
```

### 3. Booking System

**Steps:**
1. Parent selects tutor
2. Chooses date/time from tutor's availability
3. Enters session details
4. Processes payment via Stripe
5. Confirmation sent to both parties

**Implementation:**

```javascript
// routes/sessions.js
router.post('/sessions/book', authenticateToken, async (req, res) => {
  const { tutorId, date, startTime, endTime, subject, sessionType, description } = req.body;

  // Create session
  const session = new Session({
    parentId: req.user.id,
    tutorId,
    subject,
    scheduledDate: date,
    startTime: new Date(`${date}T${startTime}`),
    endTime: new Date(`${date}T${endTime}`),
    type: sessionType,
    status: 'scheduled',
    totalPrice: calculatePrice(startTime, endTime)
  });

  await session.save();

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(session.totalPrice * 100),
    currency: 'usd',
    customer: parent.stripeCustomerId,
    description: `Tutor session with ${tutor.userId.firstName}`
  });

  session.stripePaymentIntentId = paymentIntent.id;
  await session.save();

  res.status(201).json({ session, clientSecret: paymentIntent.client_secret });
});
```

### 4. Payment Processing

Uses Stripe for secure payments:

```javascript
// services/paymentService.js
async function processSessionPayment(sessionId, paymentIntentId) {
  const session = await Session.findById(sessionId);
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    // Create payment record
    const payment = new Payment({
      sessionId,
      parentId: session.parentId,
      tutorId: session.tutorId,
      amount: session.totalPrice,
      platformFee: session.totalPrice * 0.15, // 15% commission
      tutorPayout: session.totalPrice * 0.85,
      stripePaymentIntentId: paymentIntentId,
      status: 'succeeded'
    });

    await payment.save();
    session.paymentStatus = 'completed';
    session.paymentId = payment._id;
    await session.save();

    return payment;
  }
}

// Schedule payout to tutor (weekly)
async function processTutorPayouts() {
  const tutors = await Tutor.find();

  for (const tutor of tutors) {
    const unpaidPayments = await Payment.find({
      tutorId: tutor._id,
      payoutStatus: 'pending'
    });

    if (unpaidPayments.length === 0) continue;

    const totalPayout = unpaidPayments.reduce((sum, p) => sum + p.tutorPayout, 0);

    // Transfer to tutor's Stripe account
    await stripe.transfers.create({
      amount: Math.round(totalPayout * 100),
      currency: 'usd',
      destination: tutor.bankAccount.stripeConnectId,
      description: 'Weekly tutor payout'
    });

    // Mark as scheduled
    await Payment.updateMany(
      { _id: { $in: unpaidPayments.map(p => p._id) } },
      { payoutStatus: 'scheduled' }
    );
  }
}
```

### 5. Real-time Features

Using Socket.io for real-time updates:

```javascript
// server.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.userId;
    next();
  });
});

io.on('connection', (socket) => {
  // User comes online
  socket.join(`user:${socket.userId}`);

  // Handle session updates
  socket.on('session:updated', (sessionData) => {
    io.emit(`session:${sessionData.id}`, sessionData);
  });

  // Tutor goes online
  socket.on('tutor:online', (tutorId) => {
    io.emit('tutor:status', { tutorId, status: 'online' });
  });
});
```

---

## 🎨 Frontend Architecture

### Page Routes

```javascript
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ParentAuthFlow from './components/ParentAuth';
import TutorAuthFlow from './components/TutorAuth';
import TutorSearch from './components/TutorSearch';
import BookingSystem from './components/BookingSystem';
import ParentDashboard from './pages/ParentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/parent" element={<ParentAuthFlow />} />
        <Route path="/auth/tutor" element={<TutorAuthFlow />} />
        <Route path="/search" element={<TutorSearch />} />
        <Route path="/book/:tutorId" element={<BookingSystem />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
```

### API Service Layer

```javascript
// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  parentSignup: (data) => API.post('/auth/parent-signup', data),
  parentLogin: (data) => API.post('/auth/login', data),
  tutorSignup: (data) => API.post('/auth/tutor-signup', data),
  tutorLogin: (data) => API.post('/auth/login', data)
};

export const searchService = {
  getTutors: (filters) => API.get('/search/tutors', { params: filters }),
  getTutorById: (id) => API.get(`/tutors/${id}`),
  getTutorAvailability: (id) => API.get(`/tutors/${id}/availability`)
};

export const bookingService = {
  bookSession: (data) => API.post('/sessions/book', data),
  getParentSessions: () => API.get('/sessions'),
  getTutorSessions: () => API.get('/tutor/sessions'),
  cancelSession: (id, reason) => API.patch(`/sessions/${id}/cancel`, { reason })
};

export const paymentService = {
  createPaymentIntent: (sessionId) => API.post('/payments/create-intent', { sessionId }),
  confirmPayment: (paymentIntentId) => API.post('/payments/confirm', { paymentIntentId })
};

export default API;
```

---

## 📊 Database Relationships

```
User (base)
├── Parent (extends User)
│   ├── Sessions (many)
│   ├── Reviews (many) - reviews given
│   └── Payments (many)
├── Tutor (extends User)
│   ├── Sessions (many)
│   ├── Reviews (many) - reviews received
│   ├── Availability (many)
│   └── Payments (many) - payouts
└── Admin (extends User)
    └── ActivityLog (many)

Subject (lookup)
├── Tutors (many)
└── Sessions (many)

Session
├── Parent
├── Tutor
├── Subject
├── Reviews (optional)
└── Payment

Review
├── Reviewer (Parent/Tutor)
└── Reviewee (Tutor/Parent)

Payment
├── Session
├── Parent
└── Tutor
```

---

## 🔐 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Refresh tokens for extended sessions
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Email verification for new accounts

### Data Protection
- HTTPS enforced
- MongoDB injection prevention with Mongoose
- XSS protection with input validation
- CORS properly configured
- Sensitive data encrypted

### Tutor Verification
- Background checks required
- Identity verification via government ID
- Professional credentials validation
- Student reviews & ratings system
- Admin approval before going live

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or Netlify
netlify deploy --prod --dir=build
```

### Backend (Heroku/Railway)

```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Deploy to Heroku
heroku create aeo-api
git push heroku main

# Or Railway
railway link
railway up
```

### Database (MongoDB Atlas)

1. Create cluster on MongoDB Atlas
2. Add IP whitelist
3. Create database user
4. Get connection string
5. Set in `.env` as `MONGODB_URI`

### Environment Setup (Production)

Update all environment variables:
- `NODE_ENV=production`
- `FRONTEND_URL=https://yourdomain.com`
- Production Stripe keys
- Production SendGrid credentials
- Production AWS credentials
- Secure JWT secret

---

## 📈 Scaling Considerations

### Caching
- Redis for session storage
- Cache tutor search results (10 min TTL)
- Cache user profiles

### Database Optimization
- Indexes on frequently queried fields
- Archive old sessions (6+ months)
- Partition payments table by date

### Load Balancing
- Use load balancer (AWS ELB, Nginx)
- Multiple backend instances
- Session affinity for Socket.io

### CDN
- Cloudflare for static assets
- Image optimization for tutor avatars
- Video hosting for recorded sessions

---

## 🧪 Testing

### Unit Tests
```bash
npm install --save-dev jest supertest
```

### Integration Tests
- Test auth flows
- Test booking flow
- Test payment processing
- Test search/matching

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:5000/api/tutors

# Using locust for complex scenarios
```

---

## 📱 Mobile Considerations

- Responsive design (mobile-first)
- Touch-friendly buttons (44px minimum)
- Fast load times (lazy loading)
- Offline-first for critical features
- Push notifications for booking updates

---

## 🎯 Next Features (Roadmap)

1. **Video Conferencing** - Integrated Zoom/Jitsi
2. **Whiteboard** - Collaborative drawing tool
3. **AI Tutor Assistant** - Supplementary AI tutor
4. **Group Sessions** - Multiple students with one tutor
5. **Progress Analytics** - Detailed student progress charts
6. **Mobile Apps** - iOS and Android native apps
7. **Subscription Plans** - Monthly packages
8. **Referral Program** - Incentive system

---

## 📞 Support & Maintenance

### Monitoring
- Sentry for error tracking
- DataDog for performance monitoring
- Uptime Robot for availability monitoring

### Maintenance
- Weekly database backups
- Monthly security updates
- Quarterly performance audits

### Customer Support
- In-app chat support
- Email support (support@aeo.app)
- FAQ/Help center
- Community forum

---

## 📄 License & Legal

- Terms of Service
- Privacy Policy
- Cancellation Policy (24 hours free cancellation)
- Dispute Resolution Process
- GDPR Compliance (for EU users)

---

## 🎉 Conclusion

You now have a complete blueprint for the AEO tutor marketplace platform. Start with authentication, then build out search/matching, booking, and payments. Test thoroughly before launching.

For questions or issues, refer to:
- API Documentation (API.md)
- Database Schema (DATABASE.md)
- Deployment Guide (DEPLOYMENT.md)

Good luck building! 🚀
