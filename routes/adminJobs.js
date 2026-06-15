import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { QUEUE_NAMES, getFailedJobs, retryFailedJob, discardFailedJob, isQueueEnabled } from '../config/queue.js';

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

const ALL_QUEUES = Object.values(QUEUE_NAMES);

// GET /api/admin/jobs/failed?queue=paper-analysis&limit=50&start=0
// List failed jobs across all queues (or a specific one).
router.get('/failed', adminOnly, asyncHandler(async (req, res) => {
  if (!isQueueEnabled()) return res.json({ jobs: [], queueEnabled: false });
  const { queue, start = 0, limit = 50 } = req.query;
  const names = queue ? [queue] : ALL_QUEUES;
  const results = await Promise.all(
    names.map((name) => getFailedJobs(name, { start: Number(start), limit: Number(limit) }))
  );
  res.json({ jobs: results.flat(), queueEnabled: true });
}));

// POST /api/admin/jobs/:queue/:jobId/retry
router.post('/:queue/:jobId/retry', adminOnly, asyncHandler(async (req, res) => {
  if (!isQueueEnabled()) return res.status(503).json({ error: 'Queue not enabled.' });
  await retryFailedJob(req.params.queue, req.params.jobId);
  res.json({ retried: true, queue: req.params.queue, jobId: req.params.jobId });
}));

// DELETE /api/admin/jobs/:queue/:jobId
router.delete('/:queue/:jobId', adminOnly, asyncHandler(async (req, res) => {
  if (!isQueueEnabled()) return res.status(503).json({ error: 'Queue not enabled.' });
  await discardFailedJob(req.params.queue, req.params.jobId);
  res.json({ discarded: true, queue: req.params.queue, jobId: req.params.jobId });
}));

export default router;
