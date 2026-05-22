/**
 * Conversation Model
 * Manages conversation state and session lifecycle
 */

const { v4: uuidv4 } = require('uuid');
const pool = require('../services/pg-pool');
const { getRedisClient, setSessionState, getSessionState } = require('../services/redis');
const logger = require('../utils/logger');

/**
 * Create a new conversation session
 */
async function createSession(phoneNumber, senderName = null) {
  const sessionId = uuidv4();

  try {
    // Insert into database
    const query = `
      INSERT INTO chatbot_sessions
        (id, parent_phone_number, parent_name, current_step, status, conversation_state)
      VALUES ($1, $2, $3, 'START', 'ACTIVE', '{}')
      RETURNING *;
    `;

    const result = await pool.query(query, [sessionId, phoneNumber, senderName]);
    const session = result.rows[0];

    // Store in Redis for quick access
    await setSessionState(sessionId, {
      subject: null,
      level: null,
      frequency: null,
      area: null,
    });

    logger.info('New session created', {
      sessionId,
      phoneNumber,
    });

    return session;
  } catch (error) {
    logger.error('Failed to create session', {
      error: error.message,
      phoneNumber,
    });
    throw error;
  }
}

/**
 * Get session by phone number (if active)
 */
async function getSessionByPhone(phoneNumber) {
  try {
    const query = `
      SELECT * FROM chatbot_sessions
      WHERE parent_phone_number = $1 AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Failed to get session by phone', {
      error: error.message,
      phoneNumber,
    });
    throw error;
  }
}

/**
 * Get or create session for phone number
 */
async function getOrCreateSession(phoneNumber, senderName = null) {
  try {
    // Check for existing active session
    let session = await getSessionByPhone(phoneNumber);

    if (session) {
      logger.info('Retrieved existing session', {
        sessionId: session.id,
        phoneNumber,
      });
      return session;
    }

    // Create new session
    session = await createSession(phoneNumber, senderName);
    return session;
  } catch (error) {
    logger.error('Failed to get or create session', {
      error: error.message,
      phoneNumber,
    });
    throw error;
  }
}

/**
 * Update conversation step
 */
async function updateSessionStep(sessionId, step) {
  try {
    const query = `
      UPDATE chatbot_sessions
      SET current_step = $1, last_interaction = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [step, sessionId]);
    const session = result.rows[0];

    logger.debug('Session step updated', {
      sessionId,
      step,
    });

    return session;
  } catch (error) {
    logger.error('Failed to update session step', {
      error: error.message,
      sessionId,
      step,
    });
    throw error;
  }
}

/**
 * Update conversation state
 */
async function updateSessionState(sessionId, state) {
  try {
    // Update in Redis for quick access
    await setSessionState(sessionId, state);

    // Update in database for persistence
    const query = `
      UPDATE chatbot_sessions
      SET conversation_state = $1, last_interaction = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [JSON.stringify(state), sessionId]);
    const session = result.rows[0];

    logger.debug('Session state updated', {
      sessionId,
      stateKeys: Object.keys(state),
    });

    return session;
  } catch (error) {
    logger.error('Failed to update session state', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Get conversation state
 */
async function getSessionState(sessionId) {
  try {
    // Try Redis first
    let state = await getSessionState(sessionId);
    if (state) {
      return state;
    }

    // Fall back to database
    const query = `
      SELECT conversation_state FROM chatbot_sessions WHERE id = $1;
    `;

    const result = await pool.query(query, [sessionId]);
    if (!result.rows[0]) {
      return null;
    }

    return result.rows[0].conversation_state;
  } catch (error) {
    logger.error('Failed to get session state', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Complete session and handoff to tutor
 */
async function completeSession(sessionId, tutorId) {
  try {
    const query = `
      UPDATE chatbot_sessions
      SET
        status = 'COMPLETED',
        handoff_tutor_id = $1,
        handoff_timestamp = CURRENT_TIMESTAMP,
        current_step = 'HANDOFF'
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [tutorId, sessionId]);
    const session = result.rows[0];

    logger.info('Session completed', {
      sessionId,
      tutorId,
    });

    // Clean up Redis
    const redis = await getRedisClient();
    await redis.del(`session:${sessionId}:state`);

    return session;
  } catch (error) {
    logger.error('Failed to complete session', {
      error: error.message,
      sessionId,
      tutorId,
    });
    throw error;
  }
}

/**
 * Abandon session (user stopped responding)
 */
async function abandonSession(sessionId, reason = null) {
  try {
    const query = `
      UPDATE chatbot_sessions
      SET status = 'ABANDONED', conversation_state = jsonb_set(conversation_state, '{abandon_reason}', to_jsonb($1::text))
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [reason, sessionId]);

    logger.info('Session abandoned', {
      sessionId,
      reason,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to abandon session', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Get session statistics
 */
async function getSessionStats(startDate, endDate) {
  try {
    const query = `
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN status = 'ABANDONED' THEN 1 END) as abandoned_sessions,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_sessions,
        AVG(EXTRACT(EPOCH FROM (last_interaction - created_at))) as avg_duration_seconds,
        COUNT(DISTINCT parent_phone_number) as unique_parents
      FROM chatbot_sessions
      WHERE created_at >= $1 AND created_at <= $2;
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get session stats', {
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  createSession,
  getSessionByPhone,
  getOrCreateSession,
  updateSessionStep,
  updateSessionState,
  getSessionState,
  completeSession,
  abandonSession,
  getSessionStats,
};
