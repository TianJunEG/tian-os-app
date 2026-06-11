import { describe, it, expect } from 'vitest';
import { MISCONCEPTIONS, CATEGORY_ORDER, getMisconception, getFeedback } from './misconceptionCatalog.js';

describe('MISCONCEPTIONS catalog', () => {
  it('has at least 50 entries', () => {
    expect(Object.keys(MISCONCEPTIONS).length).toBeGreaterThanOrEqual(50);
  });

  it('every entry has label, category, tip, and feedback', () => {
    for (const [tag, entry] of Object.entries(MISCONCEPTIONS)) {
      expect(entry.label, `${tag} missing label`).toBeTruthy();
      expect(entry.category, `${tag} missing category`).toBeTruthy();
      expect(typeof entry.tip, `${tag} tip not string`).toBe('string');
      expect(entry.feedback, `${tag} missing feedback`).toBeTruthy();
    }
  });

  it('every tag starts with psl/', () => {
    for (const tag of Object.keys(MISCONCEPTIONS)) {
      expect(tag.startsWith('psl/')).toBe(true);
    }
  });

  it('every category is in CATEGORY_ORDER', () => {
    const validCategories = new Set(CATEGORY_ORDER);
    for (const [tag, entry] of Object.entries(MISCONCEPTIONS)) {
      expect(validCategories.has(entry.category), `${tag} has unknown category "${entry.category}"`).toBe(true);
    }
  });
});

describe('CATEGORY_ORDER', () => {
  it('has 5 categories in pedagogical order', () => {
    expect(CATEGORY_ORDER).toEqual(['Reading', 'Understanding', 'Planning', 'Solving', 'Checking']);
  });
});

describe('getMisconception', () => {
  it('returns the entry for a known tag', () => {
    const m = getMisconception('psl/arithmetic-error');
    expect(m.label).toBe('Arithmetic error');
    expect(m.category).toBe('Solving');
    expect(m.tip).toBeTruthy();
    expect(m.feedback).toBeTruthy();
  });

  it('returns fallback for unknown tag', () => {
    const m = getMisconception('psl/totally-new-error');
    expect(m.label).toBe('totally new error');
    expect(m.category).toBe('Other');
    expect(m.feedback).toBe('Not quite right. Review your work and try again.');
  });

  it('fallback strips psl/ prefix and replaces dashes', () => {
    const m = getMisconception('psl/some-complex-tag');
    expect(m.label).toBe('some complex tag');
  });
});

describe('getFeedback', () => {
  it('returns feedback string for known tag', () => {
    const fb = getFeedback('psl/missed-number', false);
    expect(fb).toContain('missed an important number');
  });

  it('returns tip-based string for partial', () => {
    const fb = getFeedback('psl/missed-number', true);
    expect(fb).toMatch(/^Almost!/);
    expect(fb).toContain('Re-read the story');
  });

  it('returns generic feedback for unknown tag', () => {
    const fb = getFeedback('psl/unknown-tag', false);
    expect(fb).toBe('Not quite right. Review your work and try again.');
  });

  it('returns tip-based partial for unknown tag', () => {
    const fb = getFeedback('psl/unknown-tag', true);
    expect(fb).toMatch(/^Almost!/);
  });
});
