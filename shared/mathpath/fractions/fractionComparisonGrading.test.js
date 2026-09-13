// Regression: fraction-comparison questions had a stem/answer mismatch and
// graded too strictly:
//   F015_004 prompt "Which is greater: <mixed> or <imp>/d?" but expected "<"/">".
//     A student who answered with the actual greater value got marked wrong.
//   F006/F007/F008 prompt "Write > or < to compare: X and Y" — the symbol is the
//     intended answer, but a student who reads it as "which is greater" and
//     writes the greater fraction was marked wrong.
// Fix: F015_004 stem now matches answer (greater value). All four templates
// also accept the greater fraction as an alternative.
import { describe, it, expect } from 'vitest';
import { generateFractionQuestion, checkFractionAnswer } from './fractionQuestionGenerator.js';

const grade = (q, student) => checkFractionAnswer({
  studentAnswer: student,
  correctAnswer: q.answer,
  acceptedAnswers: q.acceptedAnswers,
}).correct;

describe('fraction comparison — F015_004 stem now matches the expected answer', () => {
  it('returns the greater value as the primary answer (not the symbol)', () => {
    const q = generateFractionQuestion({ skillId: 'F015', questionFamilyId: 'QF_F015_004', variant: 0, mode: 'practice' });
    expect(q.prompt).toMatch(/Which is greater/);
    // primary answer is a fraction string, not a symbol
    expect(q.answer.value).not.toMatch(/^[<>=]$/);
    expect(q.answer.value).toMatch(/\d/);
  });

  it('accepts the greater value AND the comparison symbol', () => {
    const q = generateFractionQuestion({ skillId: 'F015', questionFamilyId: 'QF_F015_004', variant: 0, mode: 'practice' });
    // primary answer must be accepted
    expect(grade(q, q.answer.value)).toBe(true);
    // the corresponding comparison symbol is also accepted (back-compat)
    expect(q.acceptedAnswers.some((a) => /^[<>=]$/.test(String(a)))).toBe(true);
  });
});

describe('fraction comparison — F006/F007/F008 accept the greater fraction as an alternative', () => {
  const samples = [
    { skillId: 'F006', familyId: 'QF_F006_001' },
    { skillId: 'F007', familyId: 'QF_F007_001' },
    { skillId: 'F008', familyId: 'QF_F008_001' },
  ];
  for (const { skillId, familyId } of samples) {
    it(`${skillId} accepts both the symbol AND the greater fraction`, () => {
      const q = generateFractionQuestion({ skillId, questionFamilyId: familyId, variant: 0, mode: 'practice' });
      const primary = String(q.answer.value);
      expect(['<', '>']).toContain(primary);
      // The symbol is accepted (preserves existing behavior).
      expect(grade(q, primary)).toBe(true);
      // And there's at least one accepted answer that is a fraction (the greater value).
      expect(q.acceptedAnswers.some((a) => /\d+\/\d+/.test(String(a)))).toBe(true);
    });
  }
});
