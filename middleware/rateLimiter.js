/**
 * Rate limiting middleware
 * Simple in-memory rate limiter for MVP
 * For production, use Redis-based rate limiter
 */

// Store request counts: { "ip:path": [timestamps] }
const requestCounts = new Map();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestCounts.entries()) {
    // Remove timestamps older than 1 hour
    const filtered = timestamps.filter(t => now - t < 60 * 60 * 1000);
    if (filtered.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, filtered);
    }
  }
}, 60 * 60 * 1000);

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Max requests allowed per window
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // QA-only bypass for local pilot automation. Keep disabled in production.
    if (process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    // Get existing timestamps
    let timestamps = requestCounts.get(key) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000)
      });
    }

    // Add current timestamp
    timestamps.push(now);
    requestCounts.set(key, timestamps);

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - timestamps.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Stricter rate limiting for auth routes
 * Prevents brute force attacks
 */
export const authRateLimit = rateLimit(
  envNumber('AUTH_RATE_LIMIT_MAX', 10),
  envNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000)
); // defaults to 10 requests per 15 minutes

/**
 * Standard API rate limiting
 */
export const apiRateLimit = rateLimit(
  envNumber('API_RATE_LIMIT_MAX', 100),
  envNumber('API_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000)
); // defaults to 100 requests per 15 minutes

/**
 * Strict rate limiting for sensitive operations
 */
export const strictRateLimit = rateLimit(5, 60 * 1000); // 5 requests per minute
