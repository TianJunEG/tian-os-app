import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isChunkLoadError, reloadOnceForChunkError } from './chunkError';

describe('isChunkLoadError — matches every browser\'s stale-chunk wording', () => {
  it('detects the dynamic-import failure across Chrome, Firefox, Safari and webpack', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://x/a.js'))).toBe(true); // Chrome
    expect(isChunkLoadError(new Error('error loading dynamically imported module: https://x/a.js'))).toBe(true);   // Firefox
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);                            // Safari
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true);                                      // webpack
    expect(isChunkLoadError(new Error('Loading CSS chunk 7 failed'))).toBe(true);
    expect(isChunkLoadError(Object.assign(new Error('x'), { name: 'ChunkLoadError' }))).toBe(true);
  });

  it('does not flag ordinary runtime errors', () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined (reading 'map')"))).toBe(false);
    expect(isChunkLoadError(new TypeError('x is not a function'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('reloadOnceForChunkError — reload once, then stop (no loop)', () => {
  let reload;
  beforeEach(() => {
    window.sessionStorage.clear();
    reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
  });

  it('reloads on the first chunk error', () => {
    expect(reloadOnceForChunkError(1000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload again within the guard window (prevents a reload loop)', () => {
    expect(reloadOnceForChunkError(1000)).toBe(true);
    expect(reloadOnceForChunkError(5000)).toBe(false);   // 4s later — still guarded
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the guard window has passed', () => {
    expect(reloadOnceForChunkError(1000)).toBe(true);
    expect(reloadOnceForChunkError(30000)).toBe(true);   // 29s later — fresh
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
