/**
 * Rate limiting middleware
 *
 * Distributed when REDIS_URL is configured (fixed-window counters in Redis, so
 * limits hold across multiple instances), otherwise an in-process Map fallback.
 * If Redis is configured but unreachable, each request degrades to the in-memory
 * path rather than failing — the limiter must never take the site down.
 * See docs/architecture/Scaling_Phase1_Redis_JobQueue.md (WS2).
 */
import { getRedisClient } from '../config/redis.js';

// In-memory fallback store: { "ip:path": [timestamps] }
const requestCounts = new Map();

// Cleanup old entries every hour (fallback store only)
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

// Shared decision shape returned by both backends:
//   { allowed, remaining, resetMs (epoch ms when the window resets), retryAfterSec }

// In-process sliding window over recorded timestamps.
function inMemoryDecision(key, maxRequests, windowMs, now) {
  let timestamps = requestCounts.get(key) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: timestamps[0] + windowMs,
      retryAfterSec: Math.ceil((timestamps[0] + windowMs - now) / 1000),
    };
  }

  timestamps.push(now);
  requestCounts.set(key, timestamps);
  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    resetMs: now + windowMs,
    retryAfterSec: Math.ceil(windowMs / 1000),
  };
}

// Distributed fixed-window counter in Redis: INCR the per-(ip,path,window) key and
// set its TTL on first hit. One round trip via a pipeline (INCR + PTTL); the TTL is
// (re)applied when the key is new or has no expiry. Throws if Redis is unreachable
// so the caller can fall back to the in-memory path.
async function redisDecision(redis, key, maxRequests, windowMs, now) {
  const redisKey = `ratelimit:${key}`;
  const [[, count], [, pttl]] = await redis.multi().incr(redisKey).pttl(redisKey).exec();

  let ttl = pttl;
  if (count === 1 || pttl < 0) {
    await redis.pexpire(redisKey, windowMs);
    ttl = windowMs;
  }

  const resetMs = now + ttl;
  if (count > maxRequests) {
    return { allowed: false, remaining: 0, resetMs, retryAfterSec: Math.ceil(ttl / 1000) };
  }
  return { allowed: true, remaining: Math.max(0, maxRequests - count), resetMs, retryAfterSec: Math.ceil(ttl / 1000) };
}

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Max requests allowed per window
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    // QA-only bypass for local pilot automation. Keep disabled in production.
    if (process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    let decision;
    const redis = getRedisClient();
    if (redis) {
      try {
        decision = await redisDecision(redis, key, maxRequests, windowMs, now);
      } catch {
        // Redis unreachable — degrade to the in-process limiter for this request.
        decision = inMemoryDecision(key, maxRequests, windowMs, now);
      }
    } else {
      decision = inMemoryDecision(key, maxRequests, windowMs, now);
    }

    // Rate limit info headers (unchanged contract)
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', decision.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(decision.resetMs).toISOString());

    if (!decision.allowed) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: decision.retryAfterSec,
      });
    }

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
