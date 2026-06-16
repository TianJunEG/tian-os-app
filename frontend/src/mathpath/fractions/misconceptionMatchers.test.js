import { describe, it, expect } from 'vitest';
import { diagnoseMisconception, getMisconceptionFromAnswer } from './misconceptionMatchers';

describe('diagnoseMisconception (precise)', () => {
  it('detects denominator-larger on a same-numerator comparison', () => {
    // 2/5 vs 2/7: 2/5 is larger; picking 2/7 (larger denominator) is the mistake.
    const res = diagnoseMisconception({ prompt: 'Which is greater: 2/5 or 2/7?', skillId: 'F006' }, '2/7');
    expect(res?.misconceptionId).toBe('frac_denominator_larger_means_larger');
  });

  it('does NOT fire when the comparison answer is correct', () => {
    expect(diagnoseMisconception({ prompt: 'Which is greater: 2/5 or 2/7?', skillId: 'F006' }, '2/5')).toBeNull();
  });

  it('detects adding across (numerators AND denominators)', () => {
    // 1/4 + 1/4 -> correct 2/4; "added across" gives 2/8 == 1/4.
    const res = diagnoseMisconception({ prompt: '1/4 + 1/4', skillId: 'F016' }, '1/4');
    expect(res?.misconceptionId).toBe('frac_operation_procedure_gap');
    expect(res?.hint).toMatch(/bottom numbers too/i);
  });

  it('detects subtracting across', () => {
    // 3/4 - 1/2 -> "across" gives 2/2 == 1/1.
    const res = diagnoseMisconception({ prompt: '3/4 - 1/2', skillId: 'F017' }, '1/1');
    expect(res?.misconceptionId).toBe('frac_operation_procedure_gap');
    expect(res?.hint).toMatch(/subtracted the bottom/i);
  });

  it('returns null on an unparseable / unmatched prompt', () => {
    expect(diagnoseMisconception({ prompt: 'What fraction of the shape is shaded?', skillId: 'F001' }, '1/2')).toBeNull();
    expect(diagnoseMisconception({ prompt: '', skillId: 'F001' }, '')).toBeNull();
  });
});

describe('getMisconceptionFromAnswer (precise-first, skill-level fallback)', () => {
  it('falls back to the skill-level hint when no matcher fires', () => {
    const res = getMisconceptionFromAnswer({ prompt: 'What fraction is shaded?', skillId: 'F001' }, '1/2');
    expect(res?.misconceptionId).toBe('frac_part_whole_model_gap'); // skill-level (#244)
  });

  it('prefers the precise diagnosis when a matcher fires', () => {
    const res = getMisconceptionFromAnswer({ prompt: '1/4 + 1/4', skillId: 'F016' }, '1/4');
    expect(res?.hint).toMatch(/bottom numbers too/i);
  });
});
