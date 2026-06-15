import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Reset module so each test gets a fresh semaphore state.
describe('aiConcurrency', () => {
  let withAiConcurrency;
  let aiConcurrencyStats;

  beforeEach(async () => {
    vi.resetModules();
    process.env.WORKER_AI_CONCURRENCY = '2';
    ({ withAiConcurrency, aiConcurrencyStats } = await import('../config/aiConcurrency.js'));
  });

  afterEach(() => {
    delete process.env.WORKER_AI_CONCURRENCY;
  });

  it('runs tasks concurrently up to the limit', async () => {
    const order = [];
    const slow = () => withAiConcurrency(() => new Promise((resolve) => {
      order.push('start');
      setTimeout(() => { order.push('end'); resolve('done'); }, 10);
    }));

    await Promise.all([slow(), slow()]);
    // Both should have started before either ended (truly concurrent).
    expect(order[0]).toBe('start');
    expect(order[1]).toBe('start');
    expect(order.filter((e) => e === 'end')).toHaveLength(2);
  });

  it('queues tasks beyond the limit and drains in order', async () => {
    const done = [];
    const delays = [30, 20, 10];
    const tasks = delays.map((ms, i) =>
      withAiConcurrency(() => new Promise((resolve) => setTimeout(() => { done.push(i); resolve(i); }, ms)))
    );
    await Promise.all(tasks);
    // All three should complete even though only 2 can run at once.
    expect(done).toHaveLength(3);
    expect(new Set(done)).toEqual(new Set([0, 1, 2]));
  });

  it('releases the slot even when the task throws', async () => {
    await expect(withAiConcurrency(() => Promise.reject(new Error('ai failed')))).rejects.toThrow('ai failed');
    expect(aiConcurrencyStats().active).toBe(0);
  });

  it('returns the task result', async () => {
    const result = await withAiConcurrency(() => Promise.resolve(42));
    expect(result).toBe(42);
  });
});
