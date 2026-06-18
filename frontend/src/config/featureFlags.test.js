import { describe, it, expect } from 'vitest';
import FEATURE_FLAGS from './featureFlags';

// Guards the comics module's visibility: the Tian 7 Chronicles is gated by
// FEATURE_FLAGS.comics (dashboard card + the /student/comics route's
// FeatureGuard). If this default is ever flipped — or a stray ENABLE_COMICS
// env disables it in a build — the whole feature silently disappears. Pin it.
describe('FEATURE_FLAGS', () => {
  it('enables the comics module by default', () => {
    expect(FEATURE_FLAGS.comics).toBe(true);
  });

  it('keeps the comics sibling student modules enabled', () => {
    // sanity siblings — if these also broke it would point at the flag plumbing
    // rather than the comics line specifically
    expect(FEATURE_FLAGS.psl).toBe(true);
    expect(FEATURE_FLAGS.mathpath).toBe(true);
  });
});
