/**
 * WhatsApp Chatbot Server
 * Main Express application for handling WhatsApp messages and tutor matching
 */

const express = require('express');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { verifyTwilioRequest } = require('./utils/validators');
const webhookRouter = require('./routes/webhook');
const { initializeDatabase, initializeRedis } = require('./services');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WhatsApp webhook routes
app.use('/webhook', webhookRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize services and start server
async function start() {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('✓ Database connected');

    // Initialize Redis connection
    logger.info('Initializing Redis connection...');
    await initializeRedis();
    logger.info('✓ Redis connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 WhatsApp Chatbot Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Webhook URL: POST http://localhost:${PORT}/webhook/message`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the application
start();

module.exports = app;
