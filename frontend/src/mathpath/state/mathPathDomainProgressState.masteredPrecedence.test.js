import { describe, expect, it } from 'vitest';
import { buildMathPathDomainProgressState } from './mathPathDomainProgressState.js';

// Backend-wins precedence for the mastered-skill list. The reconciliation point must
// derive mastery from backend records (mastered/retained only) and never inherit an
// optimistic/overstated local cache — practice accuracy reaches 'accurate', never mastery.
describe('buildMathPathDomainProgressState — mastered list is backend-authoritative', () => {
  const baseArgs = {
    studentId: 'student_1',
    domainId: 'fractions',
    latestDiagnostic: { hasPlacement: true, completedAt: '2026-01-01T00:00:00.000Z' },
    mistakesPayload: { mistakes: [] },
    topicMapPayload: { topics: [] },
  };

  it('counts only mastered/retained backend records as mastered', () => {
    const state = buildMathPathDomainProgressState({
      ...baseArgs,
      masteryPayload: {
        records: [
          { skillId: 'F001', status: 'mastered' },
          { skillId: 'F002', status: 'retained' },
          { skillId: 'F003', status: 'accurate' },   // practice competence, NOT mastery
          { skillId: 'F004', status: 'learning' },
          { skillId: 'F005', status: 'needs_review' },
        ],
      },
      existingState: null,
    });
    expect(state.masteredSkillIds.sort()).toEqual(['F001', 'F002']);
    expect(state.skillMasteryStatus.F003).toBe('accurate');
  });

  it('overrides an overstated local cache (backend wins, no inherited mastery)', () => {
    const state = buildMathPathDomainProgressState({
      ...baseArgs,
      masteryPayload: { records: [{ skillId: 'F001', status: 'mastered' }] },
      // Optimistic local cache wrongly claims F003/F099 are mastered (e.g. from ≥90%
      // practice accuracy). These must NOT survive reconciliation.
      existingState: { masteredSkillIds: ['F001', 'F003', 'F099'] },
    });
    expect(state.masteredSkillIds).toEqual(['F001']);
    expect(state.masteredSkillIds).not.toContain('F003');
    expect(state.masteredSkillIds).not.toContain('F099');
  });

  it('returns no mastered skills when the backend reports none, ignoring stale local', () => {
    const state = buildMathPathDomainProgressState({
      ...baseArgs,
      masteryPayload: { records: [{ skillId: 'F001', status: 'accurate' }] },
      existingState: { masteredSkillIds: ['F001', 'F002'] },
    });
    expect(state.masteredSkillIds).toEqual([]);
  });
});
