// Phase 1 WS3: job-queue feature gating (config/queue.js) and the paper-analysis
// worker handler. No live Redis — we assert the OPTIONAL/flag-gated behaviour and
// that the worker delegates to the pipeline by reference (never shipping buffers).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({ runPipeline: vi.fn() }));
vi.mock('../services/mathpath/paperAnalysisPipeline.js', () => ({
  runPaperAnalysisPipeline: (...args) => h.runPipeline(...args),
}));

describe('config/queue.js — feature gating', () => {
  const saved = { url: process.env.REDIS_URL, flag: process.env.JOB_QUEUE_ENABLED };
  let queue;

  beforeEach(async () => {
    vi.resetModules();
    queue = await import('../config/queue.js');
  });
  afterEach(() => {
    if (saved.url === undefined) delete process.env.REDIS_URL; else process.env.REDIS_URL = saved.url;
    if (saved.flag === undefined) delete process.env.JOB_QUEUE_ENABLED; else process.env.JOB_QUEUE_ENABLED = saved.flag;
  });

  it('isQueueEnabled requires BOTH the flag and a configured Redis', () => {
    delete process.env.REDIS_URL;
    delete process.env.JOB_QUEUE_ENABLED;
    expect(queue.isQueueEnabled()).toBe(false);

    process.env.JOB_QUEUE_ENABLED = '1';
    expect(queue.isQueueEnabled()).toBe(false); // flag on but no Redis

    process.env.REDIS_URL = 'redis://localhost:6379';
    expect(queue.isQueueEnabled()).toBe(true);

    process.env.JOB_QUEUE_ENABLED = 'false';
    expect(queue.isQueueEnabled()).toBe(false);
  });

  it('getQueue returns null when Redis is unconfigured (callers run synchronously)', () => {
    delete process.env.REDIS_URL;
    expect(queue.getQueue(queue.QUEUE_NAMES.paperAnalysis)).toBeNull();
  });
});

describe('paperAnalysisWorker — handler', () => {
  const runPipeline = h.runPipeline;

  let processPaperAnalysis;
  beforeEach(async () => {
    runPipeline.mockReset();
    ({ processPaperAnalysis } = await import('../workers/paperAnalysisWorker.js'));
  });

  it('runs the pipeline by reference and returns id + status', async () => {
    runPipeline.mockResolvedValueOnce({ _id: 'analysis_9', status: 'needs_review' });
    const out = await processPaperAnalysis({ data: { analysisId: 'analysis_9', mimeType: 'application/pdf', filename: 'p.pdf' } });

    expect(runPipeline).toHaveBeenCalledWith({ analysisId: 'analysis_9', mimeType: 'application/pdf', filename: 'p.pdf' });
    // payload carries no fileBuffer — the pipeline reads from storageKey on disk
    expect(runPipeline.mock.calls[0][0]).not.toHaveProperty('fileBuffer');
    expect(out).toEqual({ analysisId: 'analysis_9', status: 'needs_review' });
  });

  it('throws on a job missing analysisId (so BullMQ records the failure)', async () => {
    await expect(processPaperAnalysis({ data: {} })).rejects.toThrow(/analysisId/);
    expect(runPipeline).not.toHaveBeenCalled();
  });

  it('propagates a pipeline failure so BullMQ retries', async () => {
    runPipeline.mockRejectedValueOnce(new Error('OCR exploded'));
    await expect(processPaperAnalysis({ data: { analysisId: 'a1' } })).rejects.toThrow('OCR exploded');
  });
});
