/**
 * Validators
 * Input validation, security checks, and data sanitization
 */

const crypto = require('crypto');
const logger = require('./logger');

/**
 * Verify Twilio webhook request signature
 * Ensures request came from Twilio
 */
function verifyTwilioRequest(req, res, next) {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_VERIFY === 'true') {
    logger.warn('Skipping Twilio signature verification in development');
    return next();
  }

  const twilioSignature = req.get('X-Twilio-Signature');
  const url = `${process.env.TWILIO_WEBHOOK_URL}${req.baseUrl}${req.path}`;
  const params = req.body;

  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => key + params[key])
    .join('');

  // Hash with auth token
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const hash = crypto
    .createHmac('sha1', authToken)
    .update(url + sortedParams)
    .digest('base64');

  // Verify signature
  if (hash !== twilioSignature) {
    logger.warn('Invalid Twilio signature', {
      url,
      expectedSignature: twilioSignature,
      calculatedHash: hash,
    });

    return res.status(403).json({
      error: 'Invalid signature',
    });
  }

  logger.debug('Twilio signature verified');
  next();
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phoneNumber) {
  // WhatsApp format: +6512345678
  const phoneRegex = /^\+\d{10,15}$/;

  if (!phoneRegex.test(phoneNumber)) {
    logger.warn('Invalid phone number format', { phoneNumber });
    return false;
  }

  return true;
}

/**
 * Sanitize text input
 * Remove potentially harmful characters
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Remove special characters except basic punctuation
  sanitized = sanitized.replace(/[<>\"{}|\\^`]/g, '');

  // Limit length
  sanitized = sanitized.substring(0, 500);

  return sanitized;
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate subject input
 */
function validateSubject(subject) {
  const validSubjects = ['English', 'Math', 'Science', 'Chinese', 'Malay'];
  return validSubjects.includes(subject);
}

/**
 * Validate level input
 */
function validateLevel(level) {
  const validLevels = ['Primary', 'Secondary', 'O-Level', 'A-Level', 'IB'];
  return validLevels.includes(level);
}

/**
 * Validate frequency input
 */
function validateFrequency(frequency) {
  const freq = parseInt(frequency);
  return freq >= 1 && freq <= 3;
}

/**
 * Check rate limiting
 */
async function checkRateLimit(phoneNumber, maxRequests = 10, windowSeconds = 60) {
  // This would typically use Redis
  // For now, just return true
  return true;
}

/**
 * Validate session ID format
 */
function validateSessionId(sessionId) {
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Validate tutor ID
 */
function validateTutorId(tutorId) {
  const id = parseInt(tutorId);
  return id > 0 && id < 2147483647; // Max int32
}

module.exports = {
  verifyTwilioRequest,
  validatePhoneNumber,
  sanitizeInput,
  validateEmail,
  validateSubject,
  validateLevel,
  validateFrequency,
  checkRateLimit,
  validateSessionId,
  validateTutorId,
};
