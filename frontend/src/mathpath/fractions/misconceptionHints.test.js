import { describe, it, expect } from 'vitest';
import { getMisconceptionHintForSkill, getMisconceptionFromAnswer, STUDENT_HINTS } from './misconceptionHints';
import { FRACTION_MISCONCEPTION_LIBRARY } from './fractionDiagnosticExplainabilityEngine';

// ── getMisconceptionHintForSkill (skill-level, unchanged) ────────────────────

describe('getMisconceptionHintForSkill', () => {
  it('returns a kid-friendly hint for a skill with a known misconception', () => {
    const res = getMisconceptionHintForSkill('F006');
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function mkQ(skillId, prompt, answerValue) {
  return {
    skillId,
    prompt,
    answer: { type: 'text', value: String(answerValue), display: String(answerValue) },
  };
}

// ── add_across — unlike denominators ─────────────────────────────────────────

describe('getMisconceptionFromAnswer — add_across', () => {
  const question = mkQ('F018', 'Compute: 1/3 + 1/4', '7/12');

  it('detects add_across: student computes (1+1)/(3+4) = 2/7', () => {
    const r = getMisconceptionFromAnswer(question, '2/7');
    expect(r?.misconceptionId).toBe('add_across');
    expect(r?.precise).toBe(true);
    expect(r?.hint).toBeTruthy();
  });

  it('does not fire add_across for the correct answer 7/12', () => {
    const r = getMisconceptionFromAnswer(question, '7/12');
    expect(r?.misconceptionId).not.toBe('add_across');
  });

  it('does not fire add_across for an unrelated wrong answer', () => {
    const r = getMisconceptionFromAnswer(question, '1/2');
    expect(r?.misconceptionId).not.toBe('add_across');
  });
});

// ── keep_denominator_doubled — same denominators ──────────────────────────────

describe('getMisconceptionFromAnswer — keep_denominator_doubled', () => {
  const question = mkQ('F016', 'Compute: 1/4 + 1/4', '2/4');

  it('detects keep_denominator_doubled: 1/4 + 1/4 → student gives 2/8', () => {
    const r = getMisconceptionFromAnswer(question, '2/8');
    expect(r?.misconceptionId).toBe('keep_denominator_doubled');
    expect(r?.precise).toBe(true);
  });

  it('does not fire for correct answer 2/4', () => {
    const r = getMisconceptionFromAnswer(question, '2/4');
    expect(r?.misconceptionId).not.toBe('keep_denominator_doubled');
  });

  it('1/12 + 2/12 → 3/24 fires keep_denominator_doubled (not add_across)', () => {
    const q2 = mkQ('F016', 'Compute: 1/12 + 2/12', '3/12');
    const r = getMisconceptionFromAnswer(q2, '3/24');
    expect(r?.misconceptionId).toBe('keep_denominator_doubled');
  });
});

// ── subtract_across — unlike denominators ────────────────────────────────────

describe('getMisconceptionFromAnswer — subtract_across', () => {
  const question = mkQ('F018', 'Compute: 3/4 - 1/2', '1/4');

  it('detects subtract_across: |3-1|/|4-2| = 2/2', () => {
    const r = getMisconceptionFromAnswer(question, '2/2');
    expect(r?.misconceptionId).toBe('subtract_across');
    expect(r?.precise).toBe(true);
  });

  it('does not fire subtract_across for same-denominator subtraction (denom diff = 0)', () => {
    const sameQ = mkQ('F017', 'Compute: 3/8 - 1/8', '2/8');
    // denominator difference is 0, so matcher must skip
    const r = getMisconceptionFromAnswer(sameQ, '2/0');
    expect(r?.misconceptionId).not.toBe('subtract_across');
  });
});

// ── denominator_larger_is_bigger — F006 (unit fractions, symbol answer) ───────

describe('getMisconceptionFromAnswer — denominator_larger_is_bigger (F006)', () => {
  // "Which is greater: 1/3 or 1/4?" → correct ">"  (1/3 > 1/4)
  const question = mkQ('F006', 'Which is greater: 1/3 or 1/4?', '>');

  it('fires when student says < (thinks 1/4 is bigger because denominator 4 > 3)', () => {
    const r = getMisconceptionFromAnswer(question, '<');
    expect(r?.misconceptionId).toBe('denominator_larger_is_bigger');
    expect(r?.precise).toBe(true);
  });

  it('does not fire when student is correct', () => {
    const r = getMisconceptionFromAnswer(question, '>');
    expect(r?.misconceptionId).not.toBe('denominator_larger_is_bigger');
  });

  it('"Which is greater: 1/5 or 1/2?" — student says > (thinks 1/5 bigger)', () => {
    // correct is < (1/5 < 1/2), student says > → fires
    const q2 = mkQ('F006', 'Which is greater: 1/5 or 1/2?', '<');
    const r = getMisconceptionFromAnswer(q2, '>');
    expect(r?.misconceptionId).toBe('denominator_larger_is_bigger');
  });
});

// ── denominator_larger_is_bigger — F008 (same numerator, fraction answer) ─────

describe('getMisconceptionFromAnswer — denominator_larger_is_bigger (F008)', () => {
  // "Compare 2/5 and 2/7. Which fraction is greater?" → correct "2/5"
  const question = mkQ('F008', 'Compare 2/5 and 2/7. Which fraction is greater?', '2/5');

  it('fires when student picks 2/7 (larger denominator)', () => {
    const r = getMisconceptionFromAnswer(question, '2/7');
    expect(r?.misconceptionId).toBe('denominator_larger_is_bigger');
    expect(r?.precise).toBe(true);
  });

  it('does not fire when student picks the correct answer 2/5', () => {
    const r = getMisconceptionFromAnswer(question, '2/5');
    expect(r?.misconceptionId).not.toBe('denominator_larger_is_bigger');
  });
});

// ── Fallback to skill-level hint ─────────────────────────────────────────────

describe('getMisconceptionFromAnswer — skill-level fallback', () => {
  it('falls back when no computed matcher fires', () => {
    // F016 with a wrong answer that is not add_across or doubled
    const question = mkQ('F016', 'Compute: 2/5 + 1/5', '3/5');
    const r = getMisconceptionFromAnswer(question, '1/5');
    expect(r).not.toBeNull();
    expect(r?.precise).toBeFalsy(); // skill-level, not precise
  });

  it('returns null for skill with no catalogued hint and no matcher match', () => {
    const question = mkQ('F099', 'Compute: 1/2 + 1/3', '5/6');
    const r = getMisconceptionFromAnswer(question, '2/5');
    expect(r).toBeNull();
  });

  it('falls through to skill-level hint when studentAnswer is empty string', () => {
    const question = mkQ('F006', 'Which is greater: 1/3 or 1/4?', '>');
    const r = getMisconceptionFromAnswer(question, '');
    expect(r?.misconceptionId).toBe('frac_denominator_larger_means_larger');
  });

  it('handles null question gracefully', () => {
    expect(getMisconceptionFromAnswer(null, '2/7')).toBeNull();
  });

  it('handles null studentAnswer gracefully', () => {
    const question = mkQ('F006', 'Which is greater: 1/3 or 1/4?', '>');
    const r = getMisconceptionFromAnswer(question, null);
    expect(r?.misconceptionId).toBe('frac_denominator_larger_means_larger');
  });
});
