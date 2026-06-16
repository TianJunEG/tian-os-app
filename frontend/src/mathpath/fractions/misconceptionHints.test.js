import { describe, it, expect } from 'vitest';
import { getMisconceptionHintForSkill, STUDENT_HINTS } from './misconceptionHints';
import { FRACTION_MISCONCEPTION_LIBRARY } from './fractionDiagnosticExplainabilityEngine';

describe('getMisconceptionHintForSkill', () => {
  it('returns a kid-friendly hint for a skill with a known misconception', () => {
    const res = getMisconceptionHintForSkill('F006'); // denominator-larger misconception
    expect(res).toBeTruthy();
    expect(res.misconceptionId).toBe('frac_denominator_larger_means_larger');
    expect(res.hint).toMatch(/smaller/i);
  });

  it('maps a foundation skill to the part-whole model hint', () => {
    const res = getMisconceptionHintForSkill('F001');
    expect(res?.misconceptionId).toBe('frac_part_whole_model_gap');
  });

  it('returns null for an unknown / uncatalogued skill', () => {
    expect(getMisconceptionHintForSkill('F999')).toBeNull();
    expect(getMisconceptionHintForSkill('')).toBeNull();
    expect(getMisconceptionHintForSkill(undefined)).toBeNull();
  });

  it('has student copy for every misconception in the library', () => {
    for (const m of FRACTION_MISCONCEPTION_LIBRARY) {
      expect(STUDENT_HINTS[m.misconceptionId], `missing hint for ${m.misconceptionId}`).toBeTruthy();
    }
  });
});
