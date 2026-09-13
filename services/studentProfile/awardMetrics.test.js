import { describe, it, expect } from 'vitest';
import { computeAwardMetrics } from './studentProfileService.js';

const sess = (skill, total, correct) => ({
  targetSkillId: skill,
  summary: { accuracySummary: { total, correct, accuracyPercentage: Math.round((correct / total) * 100) } },
});

describe('computeAwardMetrics', () => {
  it('counts perfect sessions (100% on 5+ questions)', () => {
    const r = computeAwardMetrics([sess('A', 5, 5), sess('B', 6, 6), sess('C', 4, 4) /* <5 Qs */, sess('D', 5, 4)]);
    expect(r.perfectSessions).toBe(2);
  });

  it('first attempt on a skill is never a re-practice', () => {
    const r = computeAwardMetrics([sess('A', 10, 7)]);
    expect(r.rePracticeSessions).toBe(0);
    expect(r.accuracyImprovedSessions).toBe(0);
    expect(r.rePracticeImprovedSessions).toBe(0);
  });

  it('a redo of a skill counts as re-practice; beating the prior best counts as improved', () => {
    // A: 60 → 80 (redo, new best, beat last) ; 80 → 70 (redo, not a best, worse than last)
    const r = computeAwardMetrics([sess('A', 10, 6), sess('A', 10, 8), sess('A', 10, 7)]);
    expect(r.rePracticeSessions).toBe(2); // 2nd and 3rd sessions are redos
    expect(r.accuracyImprovedSessions).toBe(1); // only 80 beat the running best (60)
    expect(r.rePracticeImprovedSessions).toBe(1); // 80 > 60 (prev); 70 < 80 (prev) → only one
  });

  it('improved is measured against the running best, not just the last', () => {
    // 90 then 80: 80 is a redo and beats the LAST? no (80<90). beats best? no.
    const r = computeAwardMetrics([sess('A', 10, 9), sess('A', 10, 8)]);
    expect(r.rePracticeSessions).toBe(1);
    expect(r.accuracyImprovedSessions).toBe(0);
    expect(r.rePracticeImprovedSessions).toBe(0);
  });

  it('different skills are tracked independently', () => {
    const r = computeAwardMetrics([sess('A', 10, 5), sess('B', 10, 5), sess('A', 10, 9)]);
    expect(r.rePracticeSessions).toBe(1); // only the 2nd A
    expect(r.accuracyImprovedSessions).toBe(1);
  });

  it('ignores sessions with no accuracy summary or too few questions for retry logic', () => {
    const r = computeAwardMetrics([
      { targetSkillId: 'A' }, // no summary
      sess('A', 2, 2), // <3 Qs → not counted for retry tracking
      sess('A', 2, 2),
    ]);
    expect(r.rePracticeSessions).toBe(0);
  });
});
