// Background worker entrypoint (Phase 1 WS3). Run as a SEPARATE process from the
// web server (`npm run worker`) so OCR / AI / parsing never block the HTTP event
// loop. Each BullMQ Worker pulls jobs from its queue and runs the same service
// code the synchronous path uses.
//
// Requires REDIS_URL. Connects to the same MongoDB as the web process.
import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import connectDB from '../config/db.js';
import { getBullConnection, QUEUE_NAMES, closeQueues } from '../config/queue.js';
import logger from '../config/logger.js';
import { processPaperAnalysis } from './paperAnalysisWorker.js';
import { processWorksheetGenerate } from './worksheetGenerateWorker.js';
import { processMarkAnswers } from './markAnswersWorker.js';
import { processReinforce } from './reinforceWorksheetWorker.js';

if (!process.env.REDIS_URL) {
  logger.fatal('REDIS_URL is required to run the background worker.');
  process.exit(1);
}

await connectDB();

const connection = getBullConnection();
const concurrency = Number(process.env.WORKER_CONCURRENCY) > 0 ? Number(process.env.WORKER_CONCURRENCY) : 2;

// One Worker per queue. Add new job types here as later WS3 steps land
// (worksheet-generate, mark-answers).
const HANDLERS = [
  { name: QUEUE_NAMES.paperAnalysis, processor: processPaperAnalysis },
  { name: QUEUE_NAMES.worksheetGenerate, processor: processWorksheetGenerate },
  { name: QUEUE_NAMES.markAnswers, processor: processMarkAnswers },
  { name: QUEUE_NAMES.reinforce, processor: processReinforce },
];

const workers = HANDLERS.map(({ name, processor }) => {
  const worker = new Worker(name, processor, { connection, concurrency });
  const workerLog = logger.child({ worker: name });
  worker.on('completed', (job) => {
    workerLog.info({ jobId: job.id, event: 'completed' });
  });
  worker.on('failed', (job, err) => {
    const attempts = job?.attemptsMade ?? '?';
    const maxAttempts = job?.opts?.attempts ?? '?';
    const exhausted = job?.attemptsMade >= (job?.opts?.attempts ?? Infinity);
    workerLog.error({
      jobId: job?.id,
      event: exhausted ? 'failed:exhausted' : 'failed:retrying',
      attempt: `${attempts}/${maxAttempts}`,
      err: err?.message,
      ref: job?.data ? { analysisId: job.data.analysisId, worksheetId: job.data.worksheetId } : undefined,
    });
  });
  return worker;
});

logger.info({ concurrency, queues: HANDLERS.map((h) => h.name) }, 'worker started');

// Graceful shutdown: let in-flight jobs finish, then close connections (WS5).
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'draining jobs…');
  try {
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues();
  } catch (err) {
    logger.error({ err: err?.message }, 'error during shutdown');
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
