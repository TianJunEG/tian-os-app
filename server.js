import express from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worksheets', worksheetRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
