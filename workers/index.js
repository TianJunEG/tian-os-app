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
import { processPaperAnalysis } from './paperAnalysisWorker.js';
import { processWorksheetGenerate } from './worksheetGenerateWorker.js';
import { processMarkAnswers } from './markAnswersWorker.js';
import { processReinforce } from './reinforceWorksheetWorker.js';

if (!process.env.REDIS_URL) {
  console.error('[worker] REDIS_URL is required to run the background worker.');
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
  worker.on('completed', (job) => console.log(`[worker:${name}] job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[worker:${name}] job ${job?.id} failed:`, err?.message));
  return worker;
});

console.log(`[worker] started (concurrency=${concurrency}) for queues: ${HANDLERS.map((h) => h.name).join(', ')}`);

// Graceful shutdown: let in-flight jobs finish, then close connections (WS5).
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[worker] ${signal} received, draining jobs…`);
  try {
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues();
  } catch (err) {
    console.error('[worker] error during shutdown:', err?.message);
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
