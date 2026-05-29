import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimit, authRateLimit } from './middleware/rateLimiter.js';
import { sanitizeInputs } from './middleware/validation.js';
import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutors.js';
import parentRoutes from './routes/parents.js';
import searchRoutes from './routes/search.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import messageRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import worksheetRoutes from './routes/worksheets.js';
import studentRoutes from './routes/students.js';
import partnerRoutes from './routes/partners.js';
import resourceRoutes from './routes/resources.js';
import spellingRoutes from './routes/spelling.js';
import learningRoutes from './routes/learning.js';
import scienceRoutes from './routes/science.js';
import contextRoutes from './routes/context.js';
import practiceRoutes from './routes/practice.js';
import mistakeRoutes from './routes/mistakes.js';
import masteryRoutes from './routes/mastery.js';
import assignmentRoutes from './routes/assignments.js';
import worksheetGenRoutes from './routes/worksheetsGen.js';
import skillRoutes from './routes/skills.js';
import familyRoutes from './routes/family.js';
import tutorWorkspaceRoutes from './routes/tutor.js';
import teacherRoutes from './routes/teacher.js';
import lifelabRoutes from './routes/lifelab.js';
import spellingPracticeRoutes from './routes/spellingPractice.js';
import mechanismsRoutes from './routes/mechanisms.js';
import { featureGate } from './middleware/featureGate.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  // allow the separate-origin frontend to load images served from /uploads
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Allowed origins come from CORS_ORIGIN (comma-separated); defaults to local dev.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/non-browser requests (no Origin header) and whitelisted origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security & Validation Middleware
app.use(sanitizeInputs);
app.use(apiRateLimit);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Routes
// authRateLimit (10 req / 15min) is applied inside routes/auth.js only to the
// brute-force-sensitive endpoints (/login, /register, /forgot-password).
// Token-protected reads like /auth/me inherit the standard apiRateLimit
// (100/15min). Putting the strict limit on the whole /api/auth prefix used
// to log users out after ~10 page reloads since every app boot fires /me.
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
// Structured worksheet generator must mount BEFORE the legacy /api/worksheets
// router so /gen/* is not captured by its /:id route.
app.use('/api/worksheets/gen', featureGate({ feature: 'worksheets', minVersion: 'v0.2' }), worksheetGenRoutes);
app.use('/api/worksheets', featureGate({ feature: 'worksheets', minVersion: 'v0.2' }), worksheetRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/spelling', spellingRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/science', featureGate({ feature: 'science', minVersion: 'v0.6' }), scienceRoutes);
// Tian OS unified platform — role/workspace context
app.use('/api/context', contextRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/mastery', masteryRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/family', featureGate({ feature: 'parent', minVersion: 'v0.3' }), familyRoutes);
app.use('/api/tutor', featureGate({ feature: 'tutor', minVersion: 'v0.4' }), tutorWorkspaceRoutes);
app.use('/api/teacher', featureGate({ feature: 'teacher', minVersion: 'v0.5' }), teacherRoutes);
app.use('/api/lifelab', featureGate({ feature: 'lifelab', minVersion: 'v0.6' }), lifelabRoutes);
app.use('/api/spelling-practice', featureGate({ feature: 'spelling', minVersion: 'v0.6' }), spellingPracticeRoutes);
app.use('/api/mechanisms', featureGate({ feature: 'mechanisms', minVersion: 'v0.6' }), mechanismsRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
