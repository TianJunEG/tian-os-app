import Redis from 'ioredis';

let client = null;
let connected = false;

export function initCache() {
  const url = process.env.REDIS_URL;
  if (!url) return;

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  client.on('connect', () => { connected = true; });
  client.on('error', () => { connected = false; });
  client.on('close', () => { connected = false; });

  client.connect().catch(() => {});
}

export async function cacheGet(key) {
  if (!connected) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  if (!connected) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore — cache is best-effort
  }
}

export async function cacheDel(key) {
  if (!connected) return;
  try {
    await client.del(key);
  } catch {}
}

export function workspaceCacheKey(userId, workspaceId) {
  return `ws:${userId}:${workspaceId}`;
}
