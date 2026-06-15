// Global in-process semaphore for AI API calls.
//
// All worker AI calls — worksheet generation, marking, reinforcement, and paper
// analysis skill mapping — share this pool. Prevents a burst of BullMQ jobs from
// hammering the provider with dozens of concurrent requests, which quickly
// triggers 429s and exhausts the retry budget.
//
// Configure with WORKER_AI_CONCURRENCY (default 3). The web process can set a
// higher value (or leave it uncapped) since it's protected by its own rate limiter.
const MAX = Number(process.env.WORKER_AI_CONCURRENCY) > 0
  ? Number(process.env.WORKER_AI_CONCURRENCY)
  : 3;

let active = 0;
const waiters = [];

function release() {
  if (waiters.length > 0 && active < MAX) {
    waiters.shift()();
  } else {
    active -= 1;
  }
}

function acquire() {
  if (active < MAX) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => { waiters.push(() => { active += 1; resolve(); }); });
}

export async function withAiConcurrency(fn) {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

export function aiConcurrencyStats() {
  return { active, queued: waiters.length, max: MAX };
}
