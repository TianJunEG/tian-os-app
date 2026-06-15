import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initErrorMonitoring, sentryRequestHandler, sentryErrorHandler } from './services/errorMonitoring.js';
import { initCache } from './services/cache.js';
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
import adminPartnerRoutes from './routes/adminPartners.js';
import worksheetRoutes from './routes/worksheets.js';
import studentRoutes from './routes/students.js';
import partnerRoutes from './routes/partners.js';
import resourceRoutes from './routes/resources.js';
import spellingRoutes from './routes/spelling.js';
import learningRoutes from './routes/learning.js';
import scienceRoutes from './routes/science.js';
import contextRoutes from './routes/context.js';
import practiceRoutes from './routes/practice.js';
import fluencyRoutes from './routes/fluency.js';
import mistakeRoutes from './routes/mistakes.js';
import masteryRoutes from './routes/mastery/index.js';
import diagnosticRoutes from './routes/diagnostics.js';
import studentProfileRoutes from './routes/studentProfile.js';
import studentAnalyticsRoutes from './routes/studentAnalytics.js';
import studentCareRoutes from './routes/studentCare.js';
import pilotAnalyticsRoutes from './routes/pilotAnalytics.js';
import telemetryRoutes from './routes/telemetry.js';
import mathpathWorkingRoutes from './routes/mathpathWorking.js';
import mathpathPaperAnalysisRoutes from './routes/mathpathPaperAnalysis.js';
import mathpathAssignmentRoutes from './routes/mathpathAssignments.js';
import mathpathSuccessCentreRoutes from './routes/mathpathSuccessCentre.js';
import interventionRoutes from './routes/interventions.js';
import assignmentRoutes from './routes/assignments.js';
import worksheetGenRoutes from './routes/worksheetsGen.js';
import skillRoutes from './routes/skills.js';
import familyRoutes from './routes/family.js';
import tutorWorkspaceRoutes from './routes/tutor.js';
import tutorInviteRoutes from './routes/tutorInvites.js';
import teacherRoutes from './routes/teacher.js';
import schoolAdminRoutes from './routes/schoolAdmin.js';
import parentInviteRoutes from './routes/parentInvites.js';
import joinRoutes from './routes/join.js';
import billingRoutes from './routes/billing.js';
import lifelabRoutes from './routes/lifelab.js';
import spellingPracticeRoutes from './routes/spellingPractice.js';
import mechanismsRoutes from './routes/mechanisms.js';
import pslRoutes from './routes/psl.js';
import assessmentSpecificationRoutes from './routes/assessmentSpecifications.js';
import assessmentBlueprintRoutes from './routes/assessmentBlueprints.js';
import assessmentUploadRoutes from './routes/assessmentUploads.js';
import notificationRoutes from './routes/notifications.js';
import recordingRoutes from './routes/recordings.js';
import adminLicenceRoutes from './routes/adminLicences.js';
import agencyRoutes from './routes/agency.js';
import studentLinkRoutes from './routes/studentLinks.js';
import remediationSessionRoutes from './routes/remediationSessions.js';
import informalAssessmentRoutes from './routes/informalAssessments.js';
import informalAssessmentStudentRoutes from './routes/informalAssessmentStudent.js';
import { featureGate } from './middleware/featureGate.js';

dotenv.config();

initErrorMonitoring();
initCache();

const app = express();

// Connect to MongoDB
connectDB();

// Sentry request handler must be the first middleware
app.use(sentryRequestHandler());

// Middleware
app.use(helmet({
  // allow the separate-origin frontend to load images served from /uploads
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── Serve the built React frontend's static assets EARLY ──────────────
// Mounted before CORS and rate-limiter so that JS / CSS / image bundles
// from frontend/dist are never rejected by the CORS origin allowlist and
// are not counted against API rate limits.  The SPA catch-all (index.html
// fallback for client-side routing) is mounted later, after all API routes.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, 'frontend', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
}

// Allowed origins come from CORS_ORIGIN (comma-separated); defaults to local dev.
// Vercel preview domains are also allowed by pattern.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const frontendUrl = (process.env.FRONTEND_URL || '').trim();
if (frontendUrl) allowedOrigins.push(frontendUrl);

// When running on Railway, auto-allow the service's own public URL so that
// same-origin browser requests (which still send an Origin header for fetch /
// module-script loads) are not rejected by the CORS middleware.
const railwayPublicDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
if (railwayPublicDomain) allowedOrigins.push(`https://${railwayPublicDomain}`);

const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+(\-[a-z0-9-]+)*\.vercel\.app$/i;
const localDevOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/non-browser requests (no Origin header), explicit allowlist,
    // and Vercel preview deployments (*.vercel.app).
    if (!origin || allowedOrigins.includes(origin) || localDevOriginRegex.test(origin) || vercelPreviewRegex.test(origin)) {
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

// Ops-friendly root health endpoint for Render checks and quick curl tests.
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, service: 'tian-os-api', timestamp: new Date() });
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
app.use('/api/admin/partners', adminPartnerRoutes);
app.use('/api/admin/partners/:pid/licence', adminLicenceRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/student-links', studentLinkRoutes);
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
app.use('/api/fluency', fluencyRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/student-profile', studentProfileRoutes);
app.use('/api/student', studentAnalyticsRoutes);
app.use('/api/student-care', studentCareRoutes);
app.use('/api/admin', pilotAnalyticsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/mastery', masteryRoutes);
app.use('/api/mathpath-working', mathpathWorkingRoutes);
app.use('/api/mathpath/paper-analysis', mathpathPaperAnalysisRoutes);
app.use('/api/mathpath/assignments', mathpathAssignmentRoutes);
app.use('/api/mathpath/success-centre', mathpathSuccessCentreRoutes);
app.use('/api/remediation-sessions', remediationSessionRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/skills', skillRoutes);
// Pilot hotfix: keep family endpoints reachable in v0.1 baseline builds.
app.use('/api/family', featureGate({ feature: 'parent', minVersion: 'v0.1' }), familyRoutes);
app.use('/api/tutor/invites', featureGate({ feature: 'tutor', minVersion: 'v0.1' }), tutorInviteRoutes);
// Mounted before /api/tutor so /recordings isn't shadowed by the workspace router.
app.use('/api/tutor/recordings', featureGate({ feature: 'tutor', minVersion: 'v0.4' }), recordingRoutes);
app.use('/api/tutor', featureGate({ feature: 'tutor', minVersion: 'v0.4' }), tutorWorkspaceRoutes);
// Mounted before /api/teacher so /assessments/* isn't shadowed by the teacher workspace router.
app.use('/api/teacher/assessments', featureGate({ feature: 'teacher', minVersion: 'v0.5' }), informalAssessmentRoutes);
app.use('/api/teacher', featureGate({ feature: 'teacher', minVersion: 'v0.5' }), teacherRoutes);
app.use('/api/assessments/student', informalAssessmentStudentRoutes);
app.use('/api/school-admin', featureGate({ feature: 'teacher', minVersion: 'v0.5' }), schoolAdminRoutes);
app.use('/api/parent-invites', featureGate({ feature: 'parent', minVersion: 'v0.1' }), parentInviteRoutes);
app.use('/api/join', featureGate({ feature: 'teacher', minVersion: 'v0.5' }), joinRoutes);
app.use('/api/billing', featureGate({ feature: 'tutor', minVersion: 'v0.4' }), billingRoutes);
app.use('/api/lifelab', featureGate({ feature: 'lifelab', minVersion: 'v0.6' }), lifelabRoutes);
app.use('/api/spelling-practice', featureGate({ feature: 'spelling', minVersion: 'v0.6' }), spellingPracticeRoutes);
app.use('/api/mechanisms', featureGate({ feature: 'mechanisms', minVersion: 'v0.6' }), mechanismsRoutes);
app.use('/api/psl', featureGate({ feature: 'psl', minVersion: 'v0.7' }), pslRoutes);
app.use('/api/assessment-specifications', assessmentSpecificationRoutes);
app.use('/api/assessment-blueprints', assessmentBlueprintRoutes);
app.use('/api/assessment-uploads', assessmentUploadRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA fallback: every non-API path that didn't match a real static file
// in frontend/dist gets index.html so client-side routing works.
// (express.static is mounted earlier — before CORS — so asset requests
// are already handled by the time we reach here.)
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path === '/healthz'
    ) {
      return next();
    }
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Sentry error handler captures unhandled errors before the app error handler
app.use(sentryErrorHandler());

// Global error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
