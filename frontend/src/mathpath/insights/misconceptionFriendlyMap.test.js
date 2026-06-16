import { describe, expect, it } from 'vitest';
import { getFriendlyMisconception, humanizeTag } from './misconceptionFriendlyMap.js';

describe('misconceptionFriendlyMap', () => {
  it('returns hand-written parent copy for a seeded tag', () => {
    const friendly = getFriendlyMisconception('frac/add-without-common');
    expect(friendly.plainExplanation).toMatch(/tops and bottoms|same bottom/i);
    expect(friendly.atHomeTip).toBeTruthy();
    // Parents must never see the slug or jargon.
    expect(friendly.plainExplanation).not.toMatch(/frac\/|misconception|incorrect_method/i);
  });

  it('reuses the ratio & rate structured map', () => {
    const friendly = getFriendlyMisconception('rr/order-reversed');
    expect(friendly.plainExplanation).toMatch(/A:B|order|B:A/i);
    expect(friendly.atHomeTip).toBeTruthy();
  });

  it('reuses the percentage catalogue parent note', () => {
    const friendly = getFriendlyMisconception('pct/not-per-hundred');
    expect(friendly.plainExplanation).toMatch(/per hundred|out of 100|ratio/i);
    expect(friendly.atHomeTip).toMatch(/grid|hundred/i);
  });

  it('falls back to a readable phrase + generic tip for an unmapped tag', () => {
    const friendly = getFriendlyMisconception('geo/some-brand-new-slip');
    expect(friendly.plainExplanation).toMatch(/some brand new slip/i);
    // Never an underscore/slash slug or namespace prefix.
    expect(friendly.plainExplanation).not.toMatch(/geo\/|_|-[a-z]+-/);
    expect(friendly.atHomeTip).toMatch(/explain each step aloud/i);
  });

  it('humanizeTag strips the domain prefix and slug separators', () => {
    expect(humanizeTag('add/forgot-carry')).toBe('Forgot carry');
    expect(humanizeTag('pv/zero_placeholder')).toBe('Zero placeholder');
    expect(humanizeTag('')).toBe('');
  });

  it('returns null for an empty tag', () => {
    expect(getFriendlyMisconception('')).toBeNull();
    expect(getFriendlyMisconception(undefined)).toBeNull();
  });
});
