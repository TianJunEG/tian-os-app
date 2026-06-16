import { describe, expect, it } from 'vitest';
import {
  getParentMisconception,
  describeMistakeForParent,
} from './parentMisconceptionExplanations.js';

const SLUG_RE = /_|\//; // a raw tag/slug always contains an underscore or slash

describe('parentMisconceptionExplanations', () => {
  it('returns a curated explanation and at-home tip for a known tag', () => {
    const result = getParentMisconception('frac/add-denominators');
    expect(result.matched).toBe('tag');
    expect(result.plainExplanation).toMatch(/common denominator|top and bottom/i);
    expect(result.atHomeTip).toMatch(/strip|quarter|denominator/i);
  });

  it('is case-insensitive and trims the tag', () => {
    const result = getParentMisconception('  GEO/Triangle-No-Half  ');
    expect(result.matched).toBe('tag');
    expect(result.plainExplanation).toMatch(/triangle/i);
  });

  it('falls back to a friendly domain line for an unmapped tag in a known domain', () => {
    const result = getParentMisconception('frac/some-brand-new-tag');
    expect(result.matched).toBe('domain');
    expect(result.plainExplanation).toMatch(/fractions/i);
    expect(result.plainExplanation).not.toMatch(SLUG_RE);
  });

  it('returns null for an empty or fully unknown-domain tag', () => {
    expect(getParentMisconception('')).toBeNull();
    expect(getParentMisconception('zzz/whatever')).toBeNull();
  });

  it('never surfaces the raw slug in any curated explanation or tip', () => {
    // Sample a spread of tags across domains.
    const tags = [
      'add/forgot-carry', 'sub/smaller-from-larger', 'mult/missing-placeholder',
      'div/ignore-remainder', 'pv/digit-vs-value', 'alg/3n-means-3-plus-n',
      'geo/perimeter-vs-area', 'mea/time-base-60', 'rr/avg-of-speeds',
      'psl/wrong-operation', 'stat/mean-not-divide',
    ];
    for (const tag of tags) {
      const result = getParentMisconception(tag);
      expect(result, tag).not.toBeNull();
      expect(result.plainExplanation, tag).not.toMatch(SLUG_RE);
      expect(result.atHomeTip, tag).toBeTruthy();
    }
  });

  describe('describeMistakeForParent', () => {
    it('prefers the curated tag mapping', () => {
      const out = describeMistakeForParent({ misconceptionTag: 'geo/radius-diameter-confuse' });
      expect(out.source).toBe('tag');
      expect(out.plainExplanation).toMatch(/diameter/i);
      expect(out.atHomeTip).toBeTruthy();
    });

    it('uses the domain fallback when the tag is unmapped but the domain is known', () => {
      const out = describeMistakeForParent({ misconceptionTag: 'geo/brand-new' });
      expect(out.source).toBe('domain');
      expect(out.plainExplanation).not.toMatch(SLUG_RE);
    });

    it('falls back to a generic plain-English line when no tag resolves', () => {
      const out = describeMistakeForParent({
        misconceptionTag: 'unknownns/mystery',
        skillName: 'Equivalent Fractions',
        confidence: 'high',
        answerCorrect: false,
      });
      expect(out.source).toBe('generic');
      expect(out.plainExplanation).toBeTruthy();
      expect(out.plainExplanation).not.toMatch(SLUG_RE);
      expect(out.atHomeTip).toMatch(/review|explain|step/i);
    });

    it('prefers a backend human label over the generic builder when present', () => {
      const out = describeMistakeForParent({
        misconceptionTag: 'unknownns/mystery',
        mistakeTypeLabel: 'Added numerators and denominators directly',
      });
      expect(out.source).toBe('generic');
      expect(out.plainExplanation).toBe('Added numerators and denominators directly');
    });
  });
});
