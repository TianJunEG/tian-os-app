/**
 * PostgreSQL Connection Pool
 * Manages database connections
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tuition_platform',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (error) => {
  logger.error('Pool error', { error: error.message });
});

pool.on('connect', () => {
  logger.debug('New connection established');
});

module.exports = pool;
