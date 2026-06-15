// Shared Redis client (Phase 1 scaling — see docs/architecture/Scaling_Phase1_Redis_JobQueue.md).
//
// Redis backs the distributed rate limiter and (later) the BullMQ job queue, so
// that scale-blocking state lives outside any single process. Redis is OPTIONAL:
// when REDIS_URL is unset we return null and callers fall back to their previous
// in-process behaviour, keeping local dev and tests working without a Redis server.
import Redis from 'ioredis';

let client;
let errorLogged = false;

// Lazily create a singleton ioredis client. Returns null when REDIS_URL is not
// configured (the signal to use the in-process fallback).
//
// Options are tuned to FAIL FAST when Redis is unreachable rather than queueing
// commands or hanging requests: enableOfflineQueue:false rejects immediately while
// disconnected, and maxRetriesPerRequest:1 + a short connectTimeout bound latency.
// Callers must catch and degrade gracefully.
export function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (client) return client;

  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('connect', () => console.log('[redis] connecting…'));
  client.on('ready', () => {
    errorLogged = false;
    console.log('[redis] ready');
  });
  // ioredis emits 'error' on every reconnect attempt; log once per outage so a
  // down Redis does not flood the logs.
  client.on('error', (err) => {
    if (!errorLogged) {
      console.error('[redis] error:', err.message);
      errorLogged = true;
    }
  });

  return client;
}

// True when a Redis URL is configured (i.e. the client path should be attempted).
export function isRedisConfigured() {
  return Boolean(process.env.REDIS_URL);
}

// Close the client during graceful shutdown (WS5). Safe to call when unconfigured.
export async function closeRedis() {
  if (client) {
    try {
      await client.quit();
    } catch {
      // best-effort
    }
    client = null;
  }
}
