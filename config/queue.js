// BullMQ job queues (Phase 1 scaling — WS3). Heavy, slow operations (OCR/paper
// analysis, and later AI worksheet generation + marking) are enqueued here by the
// web process and executed by a separate worker process (workers/index.js), so the
// web event loop never blocks on them.
//
// Queues are OPTIONAL and feature-flagged:
//   - REDIS_URL unset  → getQueue() returns null (callers run synchronously).
//   - JOB_QUEUE_ENABLED off → routes keep the synchronous path even if Redis is up.
// See docs/architecture/Scaling_Phase1_Redis_JobQueue.md.
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

export const QUEUE_NAMES = {
  paperAnalysis: 'paper-analysis',
  worksheetGenerate: 'worksheet-generate',
  markAnswers: 'mark-answers',
};

// Whether routes should enqueue instead of running inline. Requires the flag AND a
// configured Redis (getQueue still null-guards if Redis is absent).
export function isQueueEnabled() {
  const flag = (process.env.JOB_QUEUE_ENABLED || '').toLowerCase();
  return (flag === '1' || flag === 'true') && Boolean(process.env.REDIS_URL);
}

// A dedicated ioredis connection for BullMQ. BullMQ REQUIRES maxRetriesPerRequest:
// null on its connection (blocking commands), so this is separate from the rate
// limiter's fail-fast client in config/redis.js.
let bullConnection;
export function getBullConnection() {
  if (!process.env.REDIS_URL) return null;
  if (!bullConnection) {
    bullConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    let logged = false;
    bullConnection.on('error', (err) => {
      if (!logged) { console.error('[queue] redis error:', err.message); logged = true; }
    });
    bullConnection.on('ready', () => { logged = false; });
  }
  return bullConnection;
}

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

const queues = {};

// Get (or lazily create) a producer Queue. Returns null when Redis is unconfigured
// so callers can fall back to running the work synchronously.
export function getQueue(name) {
  const connection = getBullConnection();
  if (!connection) return null;
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
  }
  return queues[name];
}

// Close queues + the shared connection during graceful shutdown (WS5).
export async function closeQueues() {
  await Promise.all(Object.values(queues).map((q) => q.close().catch(() => {})));
  for (const k of Object.keys(queues)) delete queues[k];
  if (bullConnection) {
    try { await bullConnection.quit(); } catch { /* best-effort */ }
    bullConnection = null;
  }
}
