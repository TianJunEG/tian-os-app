import { describe, it, expect } from 'vitest';
import { getHintsForStep } from './hintGenerator.js';

describe('getHintsForStep — generic step hints', () => {
  it('returns first hint for understand at index 0', () => {
    const r = getHintsForStep('understand', null, 0);
    expect(r.hint).toEqual({ title: 'Read again', text: 'Read the story once more — what is happening? Who is involved?' });
    expect(r.hintIndex).toBe(0);
    expect(r.exhausted).toBe(false);
  });

  it('returns second hint for understand at index 1', () => {
    const r = getHintsForStep('understand', null, 1);
    expect(r.hint).toEqual({ title: 'What kind of action?', text: 'Think about what kind of action the story describes: combining, removing, comparing, or sharing?' });
    expect(r.hintIndex).toBe(1);
    expect(r.exhausted).toBe(false);
  });

  it('returns hints for identify_info', () => {
    const r = getHintsForStep('identify_info', null, 0);
    expect(r.hint.text).toContain('numbers');
    expect(r.totalAvailable).toBe(2);
  });

  it('returns hints for identify_question', () => {
    const r = getHintsForStep('identify_question', null, 0);
    expect(r.hint.text).toContain('last sentence');
    expect(r.totalAvailable).toBe(2);
  });

  it('returns hints for plan', () => {
    const r = getHintsForStep('plan', null, 0);
    expect(r.hint.text).toContain('operation');
    expect(r.totalAvailable).toBe(2);
  });

  it('returns hints for solve', () => {
    const r = getHintsForStep('solve', null, 0);
    expect(r.hint.text).toContain('number sentence');
    expect(r.totalAvailable).toBe(2);
  });

  it('returns hints for check', () => {
    const r = getHintsForStep('check', null, 0);
    expect(r.hint.text).toContain('Read the story one more time');
    expect(r.totalAvailable).toBe(2);
  });
});

describe('getHintsForStep — heuristic-specific hints', () => {
  it('bar-model plan hints come before generic plan hints', () => {
    const r = getHintsForStep('plan', 'bar-model', 0);
    expect(r.hint.text).toBe('Think about the bar model — are you looking for the whole bar, or a missing part?');
    expect(r.totalAvailable).toBe(4); // 2 bar-model plan + 2 generic plan
  });

  it('bar-model solve prepends heuristic hints', () => {
    const r = getHintsForStep('solve', 'bar-model', 0);
    expect(r.hint.text).toContain('part-whole model');
    expect(r.totalAvailable).toBe(3); // 1 bar-model solve + 2 generic solve
  });

  it('work-backwards plan hints come first', () => {
    const r = getHintsForStep('plan', 'work-backwards', 0);
    expect(r.hint.text).toContain('Start from the end result');
  });

  it('work-backwards solve hints come first', () => {
    const r = getHintsForStep('solve', 'work-backwards', 0);
    expect(r.hint.text).toContain('undo');
  });

  it('ratio plan hints come first', () => {
    const r = getHintsForStep('plan', 'ratio', 0);
    expect(r.hint.text).toContain('total number of parts');
    expect(r.totalAvailable).toBe(4); // 2 ratio plan + 2 generic plan
  });

  it('guess-check plan hints come first', () => {
    const r = getHintsForStep('plan', 'guess-check', 0);
    expect(r.hint.text).toContain('starting guess');
  });

  it('assumption plan hints come first', () => {
    const r = getHintsForStep('plan', 'assumption', 0);
    expect(r.hint.text).toContain('assuming all items are the same type');
  });

  it('data-interpretation identify_info hints come first', () => {
    const r = getHintsForStep('identify_info', 'data-interpretation', 0);
    expect(r.hint.text).toContain('chart labels');
    expect(r.totalAvailable).toBe(3); // 1 data-interp + 2 generic
  });

  it('heuristic with no step-specific hints falls back to generic', () => {
    // bar-model has no identify_info hints
    const r = getHintsForStep('identify_info', 'bar-model', 0);
    expect(r.hint.text).toContain('numbers');
    expect(r.totalAvailable).toBe(2); // only generic
  });
});

describe('getHintsForStep — heuristic key stripping', () => {
  it('strips colon-suffixed variant from heuristic key', () => {
    // "bar-model:comparison" should match "bar-model"
    const r = getHintsForStep('plan', 'bar-model:comparison', 0);
    expect(r.hint.text).toBe('Think about the bar model — are you looking for the whole bar, or a missing part?');
    expect(r.totalAvailable).toBe(4);
  });

  it('handles heuristic with colon but empty suffix', () => {
    const r = getHintsForStep('plan', 'ratio:', 0);
    expect(r.hint.text).toContain('total number of parts');
  });
});

describe('getHintsForStep — 3-tier progression', () => {
  it('generic step: index 0 = first hint (nudge)', () => {
    const r = getHintsForStep('understand', null, 0);
    expect(r.hint).toBeTruthy();
    expect(r.hintIndex).toBe(0);
  });

  it('generic step: index 1 = second hint (clue)', () => {
    const r = getHintsForStep('understand', null, 1);
    expect(r.hint).toBeTruthy();
    expect(r.hintIndex).toBe(1);
  });

  it('heuristic step: walks through all available hints in order', () => {
    // bar-model plan has 4 hints total (2 heuristic + 2 generic)
    const hints = [];
    for (let i = 0; i < 4; i++) {
      const r = getHintsForStep('plan', 'bar-model', i);
      expect(r.exhausted).toBe(false);
      hints.push(r.hint);
    }
    // All hints are distinct
    expect(new Set(hints.map(h => h.text)).size).toBe(4);
    // Heuristic hints come first
    expect(hints[0].text).toContain('bar model');
    expect(hints[1].text).toContain('bars');
    // Generic hints come after
    expect(hints[2].text).toContain('operation');
  });
});

describe('getHintsForStep — exhaustion behavior', () => {
  it('returns exhausted when index equals total hints (generic)', () => {
    const r = getHintsForStep('understand', null, 2);
    expect(r.exhausted).toBe(true);
    expect(r.hint).toBeNull();
    expect(r.totalAvailable).toBe(2);
  });

  it('returns exhausted when index exceeds total hints', () => {
    const r = getHintsForStep('understand', null, 5);
    expect(r.exhausted).toBe(true);
    expect(r.hint).toBeNull();
  });

  it('returns exhausted for heuristic-augmented step after all hints used', () => {
    // bar-model plan = 4 total hints
    const r = getHintsForStep('plan', 'bar-model', 4);
    expect(r.exhausted).toBe(true);
    expect(r.hint).toBeNull();
    expect(r.totalAvailable).toBe(4);
  });

  it('does not include hintIndex when exhausted', () => {
    const r = getHintsForStep('understand', null, 2);
    expect(r.hintIndex).toBeUndefined();
  });
});

describe('getHintsForStep — totalAvailable accuracy', () => {
  it('generic-only step reports 2 hints available', () => {
    const r = getHintsForStep('check', null, 0);
    expect(r.totalAvailable).toBe(2);
  });

  it('heuristic step reports combined count', () => {
    // work-backwards plan: 2 heuristic + 2 generic = 4
    const r = getHintsForStep('plan', 'work-backwards', 0);
    expect(r.totalAvailable).toBe(4);
  });

  it('heuristic step with single-hint step reports correct count', () => {
    // excess-shortage plan: 1 heuristic + 2 generic = 3
    const r = getHintsForStep('plan', 'excess-shortage', 0);
    expect(r.totalAvailable).toBe(3);
  });
});

describe('getHintsForStep — edge cases', () => {
  it('unknown step returns empty with exhausted', () => {
    const r = getHintsForStep('bogus', null, 0);
    expect(r.exhausted).toBe(true);
    expect(r.hint).toBeNull();
    expect(r.totalAvailable).toBe(0);
  });

  it('unknown heuristic falls back to generic hints', () => {
    const r = getHintsForStep('plan', 'nonexistent-heuristic', 0);
    expect(r.hint.text).toContain('operation');
    expect(r.totalAvailable).toBe(2); // generic only
  });

  it('null heuristic uses generic hints', () => {
    const r = getHintsForStep('solve', null, 0);
    expect(r.hint).toBeTruthy();
    expect(r.hint.text).toBeTruthy();
    expect(r.totalAvailable).toBe(2);
  });

  it('undefined heuristic uses generic hints', () => {
    const r = getHintsForStep('solve', undefined, 0);
    expect(r.hint).toBeTruthy();
    expect(r.hint.text).toBeTruthy();
    expect(r.totalAvailable).toBe(2);
  });

  it('default hintsUsedCount is 0', () => {
    const r = getHintsForStep('understand');
    expect(r.hint).toBeTruthy();
    expect(r.hintIndex).toBe(0);
  });

  it('deduplicates if heuristic and generic share the same hint text', () => {
    // This is a structural test: combined uses Set for dedup
    // With distinct hints we should get the sum
    const r = getHintsForStep('plan', 'bar-model', 0);
    expect(r.totalAvailable).toBe(4); // no overlap expected
  });
});
