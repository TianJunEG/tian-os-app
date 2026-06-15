// Rate limiter middleware (middleware/rateLimiter.js). The Redis client module is
// mocked so we can exercise three paths without a live Redis: in-process fallback
// (no client), the distributed Redis counter, and graceful degradation when Redis
// throws. Each test imports the module fresh so the in-memory Map / module state
// does not leak between cases.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ client: null }));

vi.mock('../config/redis.js', () => ({
  getRedisClient: () => h.client,
  isRedisConfigured: () => Boolean(h.client),
  closeRedis: async () => {},
}));

// Minimal Express req/res doubles.
function makeReqRes(path = '/api/x', ip = '1.2.3.4') {
  const headers = {};
  const res = {
    statusCode: 200,
    body: null,
    setHeader: (k, v) => { headers[k] = v; },
    getHeader: (k) => headers[k],
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
  };
  return { req: { path, ip }, res, headers };
}

async function run(mw, reqRes) {
  let nextCalled = false;
  await mw(reqRes.req, reqRes.res, () => { nextCalled = true; });
  return nextCalled;
}

let rateLimit;
beforeEach(async () => {
  h.client = null;
  delete process.env.QA_DISABLE_RATE_LIMIT;
  vi.resetModules();
  ({ rateLimit } = await import('../middleware/rateLimiter.js'));
});

describe('in-memory fallback (no Redis configured)', () => {
  it('allows up to the limit then blocks with 429 + headers', async () => {
    const mw = rateLimit(2, 60_000);
    const a = makeReqRes(), b = makeReqRes(), c = makeReqRes();

    expect(await run(mw, a)).toBe(true);
    expect(a.headers['X-RateLimit-Remaining']).toBe(1);

    expect(await run(mw, b)).toBe(true);
    expect(b.headers['X-RateLimit-Remaining']).toBe(0);

    expect(await run(mw, c)).toBe(false); // blocked
    expect(c.res.statusCode).toBe(429);
    expect(c.res.body).toMatchObject({ error: expect.any(String), retryAfter: expect.any(Number) });
    expect(c.headers['X-RateLimit-Limit']).toBe(2);
  });

  it('keys by ip+path — a different path is counted separately', async () => {
    const mw = rateLimit(1, 60_000);
    expect(await run(mw, makeReqRes('/api/a'))).toBe(true);
    expect(await run(mw, makeReqRes('/api/a'))).toBe(false);
    expect(await run(mw, makeReqRes('/api/b'))).toBe(true); // independent bucket
  });
});

describe('distributed Redis path', () => {
  function fakeRedis(counts) {
    // counts: mutable { [key]: number }; emulates INCR + PTTL + PEXPIRE
    return {
      ttls: {},
      multi() {
        const ops = [];
        const self = this;
        const chain = {
          incr(k) { ops.push(['incr', k]); return chain; },
          pttl(k) { ops.push(['pttl', k]); return chain; },
          async exec() {
            return ops.map(([op, k]) => {
              if (op === 'incr') { counts[k] = (counts[k] || 0) + 1; return [null, counts[k]]; }
              if (op === 'pttl') { return [null, self.ttls[k] ?? -1]; }
              return [null, null];
            });
          },
        };
        return chain;
      },
      async pexpire(k, ms) { this.ttls[k] = ms; },
    };
  }

  it('uses Redis counters and blocks once the count exceeds the limit', async () => {
    const counts = {};
    h.client = fakeRedis(counts);
    const mw = rateLimit(2, 60_000);

    expect(await run(mw, makeReqRes())).toBe(true);
    expect(await run(mw, makeReqRes())).toBe(true);
    const third = makeReqRes();
    expect(await run(mw, third)).toBe(false);
    expect(third.res.statusCode).toBe(429);
    expect(counts['ratelimit:1.2.3.4:/api/x']).toBe(3); // INCR ran for the blocked req too
  });
});

describe('graceful degradation when Redis throws', () => {
  it('falls back to the in-memory limiter instead of erroring', async () => {
    h.client = { multi: () => ({ incr() { return this; }, pttl() { return this; }, exec: async () => { throw new Error('redis down'); } }) };
    const mw = rateLimit(1, 60_000);

    const first = makeReqRes();
    expect(await run(mw, first)).toBe(true); // served via fallback, no throw
    expect(first.res.statusCode).toBe(200);
    // fallback still enforces the limit
    expect(await run(mw, makeReqRes())).toBe(false);
  });
});

describe('QA bypass', () => {
  it('skips limiting when QA_DISABLE_RATE_LIMIT=1 outside production', async () => {
    process.env.QA_DISABLE_RATE_LIMIT = '1';
    const mw = rateLimit(0, 60_000); // would block everything if not bypassed
    expect(await run(mw, makeReqRes())).toBe(true);
  });
});
