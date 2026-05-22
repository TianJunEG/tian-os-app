/**
 * Redis Service
 * Handles session state management and caching
 */

const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
    });

    redisClient.on('connect', () => {
      logger.info('✓ Redis connected successfully');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get Redis client instance
 */
async function getRedisClient() {
  if (!redisClient) {
    await initializeRedis();
  }
  return redisClient;
}

/**
 * Store session state
 */
async function setSessionState(sessionId, state, ttl = 86400) {
  // ttl default: 24 hours
  try {
    const key = `session:${sessionId}:state`;
    const value = JSON.stringify(state);

    if (ttl) {
      await redisClient.setex(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }

    logger.debug('Session state stored', { sessionId, ttl });
    return true;
  } catch (error) {
    logger.error('Failed to store session state', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Get session state
 */
async function getSessionState(sessionId) {
  try {
    const key = `session:${sessionId}:state`;
    const value = await redisClient.get(key);

    if (!value) {
      logger.debug('Session state not found', { sessionId });
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    logger.error('Failed to get session state', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Delete session state
 */
async function deleteSessionState(sessionId) {
  try {
    const key = `session:${sessionId}:state`;
    await redisClient.del(key);

    logger.debug('Session state deleted', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to delete session state', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Store conversation step
 */
async function setConversationStep(sessionId, step, ttl = 86400) {
  try {
    const key = `session:${sessionId}:step`;

    if (ttl) {
      await redisClient.setex(key, ttl, step);
    } else {
      await redisClient.set(key, step);
    }

    logger.debug('Conversation step stored', { sessionId, step });
    return true;
  } catch (error) {
    logger.error('Failed to store conversation step', {
      error: error.message,
      sessionId,
      step,
    });
    throw error;
  }
}

/**
 * Get conversation step
 */
async function getConversationStep(sessionId) {
  try {
    const key = `session:${sessionId}:step`;
    const step = await redisClient.get(key);

    if (!step) {
      logger.debug('Conversation step not found, defaulting to START', { sessionId });
      return 'START';
    }

    return step;
  } catch (error) {
    logger.error('Failed to get conversation step', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Cache tutor search results
 */
async function cacheTutorSearch(searchKey, tutors, ttl = 3600) {
  // ttl default: 1 hour
  try {
    const key = `search:${searchKey}`;
    const value = JSON.stringify(tutors);

    if (ttl) {
      await redisClient.setex(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }

    logger.debug('Tutor search cached', { searchKey, count: tutors.length, ttl });
    return true;
  } catch (error) {
    logger.error('Failed to cache tutor search', {
      error: error.message,
      searchKey,
    });
    throw error;
  }
}

/**
 * Get cached tutor search results
 */
async function getCachedTutorSearch(searchKey) {
  try {
    const key = `search:${searchKey}`;
    const value = await redisClient.get(key);

    if (!value) {
      logger.debug('Tutor search cache miss', { searchKey });
      return null;
    }

    logger.debug('Tutor search cache hit', { searchKey });
    return JSON.parse(value);
  } catch (error) {
    logger.error('Failed to get cached tutor search', {
      error: error.message,
      searchKey,
    });
    throw error;
  }
}

/**
 * Track active sessions
 */
async function trackActiveSession(phoneNumber, sessionId, ttl = 86400) {
  try {
    const key = `active:${phoneNumber}`;

    if (ttl) {
      await redisClient.setex(key, ttl, sessionId);
    } else {
      await redisClient.set(key, sessionId);
    }

    logger.debug('Active session tracked', { phoneNumber, sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to track active session', {
      error: error.message,
      phoneNumber,
    });
    throw error;
  }
}

/**
 * Get active session for phone number
 */
async function getActiveSession(phoneNumber) {
  try {
    const key = `active:${phoneNumber}`;
    const sessionId = await redisClient.get(key);

    if (!sessionId) {
      logger.debug('No active session found', { phoneNumber });
      return null;
    }

    return sessionId;
  } catch (error) {
    logger.error('Failed to get active session', {
      error: error.message,
      phoneNumber,
    });
    throw error;
  }
}

/**
 * Increment counter (for rate limiting, analytics)
 */
async function incrementCounter(key, ttl = 3600) {
  try {
    const value = await redisClient.incr(key);

    // Set TTL only on first increment
    if (value === 1 && ttl) {
      await redisClient.expire(key, ttl);
    }

    return value;
  } catch (error) {
    logger.error('Failed to increment counter', {
      error: error.message,
      key,
    });
    throw error;
  }
}

/**
 * Get counter value
 */
async function getCounter(key) {
  try {
    const value = await redisClient.get(key);
    return value ? parseInt(value) : 0;
  } catch (error) {
    logger.error('Failed to get counter', {
      error: error.message,
      key,
    });
    throw error;
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  setSessionState,
  getSessionState,
  deleteSessionState,
  setConversationStep,
  getConversationStep,
  cacheTutorSearch,
  getCachedTutorSearch,
  trackActiveSession,
  getActiveSession,
  incrementCounter,
  getCounter,
};
