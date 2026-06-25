import { describe, it, expect } from 'vitest';
import { generateQuestionSet, generateQuestion, getDomainForSkill } from './p4Orchestrator';
import { isP4SkillId } from './p4PracticeFlow';

// Regression: the P4 "Quick Diagnostic" button navigates with skillId
// 'P4-DIAGNOSTIC', but the orchestrator's findGenerator() prefix-match returned
// null for it. So generateQuestionSet → [] and the practice route silently fell
// through to a fractions session. This builds a real cross-domain set instead.

describe('P4 Quick Diagnostic — P4-DIAGNOSTIC special id', () => {
  it('isP4SkillId recognizes P4-DIAGNOSTIC', () => {
    expect(isP4SkillId('P4-DIAGNOSTIC')).toBe(true);
  });
  it('getDomainForSkill returns a real p4 marker (not null)', () => {
    expect(getDomainForSkill('P4-DIAGNOSTIC')).toBe('p4-diagnostic');
  });
  it('generateQuestionSet returns a real cross-domain set (not [])', () => {
    const set = generateQuestionSet('P4-DIAGNOSTIC', 6);
    expect(set.length).toBeGreaterThan(0);
    // Each question has a real skillId (and they span more than one P4 domain).
    const skillIds = set.map((q) => q.skillId).filter(Boolean);
    expect(skillIds.length).toBe(set.length);
    const uniquePrefixes = new Set(skillIds.map((id) => id.slice(0, 5)));
    expect(uniquePrefixes.size).toBeGreaterThan(1);
  });
  it('generateQuestion returns a single question for P4-DIAGNOSTIC', () => {
    const q = generateQuestion('P4-DIAGNOSTIC');
    expect(q).toBeTruthy();
  });
});
