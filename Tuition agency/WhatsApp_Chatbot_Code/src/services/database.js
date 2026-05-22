/**
 * Database Service
 * Handles all PostgreSQL interactions
 */

const pool = require('./pg-pool');
const logger = require('../utils/logger');

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Database connection successful', {
      timestamp: result.rows[0].now,
    });
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Create chatbot_sessions table if it doesn't exist
 */
async function createSessionsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS chatbot_sessions (
      id VARCHAR(50) PRIMARY KEY,
      parent_phone_number VARCHAR(20) NOT NULL,
      parent_name VARCHAR(100),
      child_age INTEGER,
      initial_subject VARCHAR(50),
      current_step VARCHAR(50) DEFAULT 'START',
      conversation_state JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      handoff_tutor_id INTEGER,
      handoff_timestamp TIMESTAMP,
      INDEX idx_phone (parent_phone_number),
      INDEX idx_status (status)
    );
  `;

  try {
    await pool.query(query);
    logger.info('Sessions table ready');
  } catch (error) {
    logger.error('Failed to create sessions table', { error: error.message });
    throw error;
  }
}

/**
 * Create chatbot_interactions table if it doesn't exist
 */
async function createInteractionsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS chatbot_interactions (
      id BIGSERIAL PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      step VARCHAR(50),
      user_input TEXT,
      bot_response TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      response_time_ms INTEGER,
      FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id),
      INDEX idx_session (session_id),
      INDEX idx_timestamp (timestamp)
    );
  `;

  try {
    await pool.query(query);
    logger.info('Interactions table ready');
  } catch (error) {
    logger.error('Failed to create interactions table', { error: error.message });
    throw error;
  }
}

/**
 * Search for tutors matching criteria
 */
async function searchTutors({ subject, level, area, limit = 4 }) {
  const query = `
    SELECT
      id,
      name,
      rate,
      experience_years as experience,
      rating,
      specializations,
      whatsapp_number,
      moe_teacher,
      bio
    FROM tutors
    WHERE
      status = 'active'
      AND specializations @> $1::jsonb
      AND (area ILIKE $2 OR service_areas @> $3::jsonb)
      AND (subject_level_mapping @> jsonb_build_object($4, $5))
    ORDER BY rating DESC, experience_years DESC
    LIMIT $6;
  `;

  try {
    const specializations = JSON.stringify([subject]);
    const areaJson = JSON.stringify([area]);
    const subjectLevelKey = `${subject}_${level}`;

    const result = await pool.query(query, [
      specializations,
      `%${area}%`,
      areaJson,
      subject,
      level,
      limit,
    ]);

    logger.info('Tutor search completed', {
      subject,
      level,
      area,
      count: result.rows.length,
    });

    return result.rows;
  } catch (error) {
    logger.error('Tutor search failed', {
      error: error.message,
      subject,
      level,
      area,
    });

    // Return mock data for development if database fails
    if (process.env.NODE_ENV === 'development') {
      return getMockTutors(subject, level, area);
    }

    throw error;
  }
}

/**
 * Get mock tutors for development/testing
 */
function getMockTutors(subject, level, area) {
  const tutors = [
    {
      id: 1,
      name: 'Ms Sarah',
      rate: 40,
      experience: 8,
      rating: 4.9,
      specializations: [subject],
      whatsapp_number: '+6591234567',
      moe_teacher: true,
      bio: 'MOE Teacher, Expert in writing skills',
    },
    {
      id: 2,
      name: 'Mr Raj',
      rate: 35,
      experience: 5,
      rating: 4.8,
      specializations: [subject],
      whatsapp_number: '+6591234568',
      moe_teacher: true,
      bio: 'Ex-MOE, Focuses on comprehension and grammar',
    },
    {
      id: 3,
      name: 'Ms Priya',
      rate: 38,
      experience: 6,
      rating: 4.7,
      specializations: [subject],
      whatsapp_number: '+6591234569',
      moe_teacher: false,
      bio: 'University graduate, patient with slower learners',
    },
    {
      id: 4,
      name: 'Mr David',
      rate: 42,
      experience: 10,
      rating: 4.9,
      specializations: [subject],
      whatsapp_number: '+6591234570',
      moe_teacher: true,
      bio: 'Specialized in exam preparation',
    },
  ];

  return tutors;
}

/**
 * Get tutor by ID
 */
async function getTutorById(tutorId) {
  const query = `
    SELECT * FROM tutors WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [tutorId]);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get tutor', {
      error: error.message,
      tutorId,
    });
    throw error;
  }
}

/**
 * Log chatbot interaction
 */
async function logInteraction({
  session_id,
  step,
  user_input,
  bot_response,
  message_id,
  response_time_ms = 0,
}) {
  const query = `
    INSERT INTO chatbot_interactions
      (session_id, step, user_input, bot_response, response_time_ms)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(query, [
      session_id,
      step,
      user_input,
      bot_response,
      response_time_ms,
    ]);

    logger.debug('Interaction logged', {
      sessionId: session_id,
      step,
    });
  } catch (error) {
    logger.error('Failed to log interaction', {
      error: error.message,
      sessionId: session_id,
    });
    // Don't throw - logging should not block conversation
  }
}

/**
 * Get conversation analytics
 */
async function getConversationAnalytics(startDate, endDate) {
  const query = `
    SELECT
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(CASE WHEN current_step = 'SUBJECT_SELECTED' THEN 1 END) as step1_count,
      COUNT(CASE WHEN current_step = 'LEVEL_SELECTED' THEN 1 END) as step2_count,
      COUNT(CASE WHEN current_step = 'FREQUENCY_SELECTED' THEN 1 END) as step3_count,
      COUNT(CASE WHEN current_step = 'TUTOR_DISPLAYED' THEN 1 END) as step4_count,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_conversations,
      AVG(EXTRACT(EPOCH FROM (last_interaction - created_at))) as avg_duration_seconds
    FROM chatbot_sessions
    WHERE created_at >= $1 AND created_at <= $2;
  `;

  try {
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get analytics', {
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  createSessionsTable,
  createInteractionsTable,
  searchTutors,
  getTutorById,
  logInteraction,
  getConversationAnalytics,
  pool,
};
