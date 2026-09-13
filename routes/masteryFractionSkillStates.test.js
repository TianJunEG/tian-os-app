// Fractions practice/recheck persists to MathPathStudentSkillState (unified domain
// model), NOT MasteryRecord. GET /mastery used to read only MasteryRecord, so a
// 100%-correct fractions session left the dashboard + learning path stuck at 0%
// mastered. buildFractionSkillStateRecords surfaces those skill states as /mastery
// records keyed by the F-code, which is what every fractions consumer matches on
// (record.skillCode || record.frameworkSkillId || record.skillId) + record.status.
import { describe, it, expect } from 'vitest';
import { buildFractionSkillStateRecords } from './mastery.js';

describe('buildFractionSkillStateRecords', () => {
  it('keys each record by the F-code under skillId/frameworkSkillId/skillCode', () => {
    const [rec] = buildFractionSkillStateRecords({
      fractionStates: [{ skillId: 'F001', status: 'accurate', accuracy: 100, attemptCount: 8 }],
    });
    expect(rec.skillId).toBe('F001');
    expect(rec.frameworkSkillId).toBe('F001');
    expect(rec.skillCode).toBe('F001');
    expect(rec.domainId).toBe('fractions');
    expect(rec.score).toBe(100);
    expect(rec.attempts).toBe(8);
  });

  it('carries the raw status so consumers can classify mastered/fluent/weak', () => {
    const records = buildFractionSkillStateRecords({
      fractionStates: [
        { skillId: 'F001', status: 'accurate' },   // -> mastered
        { skillId: 'F002', status: 'fluent' },      // -> mastered + fluent
        { skillId: 'F003', status: 'retained' },    // -> mastered + fluent + retained
        { skillId: 'F004', status: 'needsReview' }, // -> weak (lowercased: needsreview)
        { skillId: 'F005', status: 'learning' },    // -> in-progress (neither)
      ],
    });
    const statusByCode = Object.fromEntries(records.map((r) => [r.skillId, r.status]));
    expect(statusByCode).toEqual({
      F001: 'accurate', F002: 'fluent', F003: 'retained', F004: 'needsReview', F005: 'learning',
    });
    // masteryState mirrors status so the dashboard's `status || masteryState` works.
    expect(records.every((r) => r.masteryState === r.status)).toBe(true);
  });

  it('lets a legacy MasteryRecord for the same F-code win (no double-count)', () => {
    const existingRecords = [{ frameworkSkillId: 'F001', status: 'mastered' }];
    const out = buildFractionSkillStateRecords({
      fractionStates: [
        { skillId: 'F001', status: 'learning' }, // skipped — legacy F001 already present
        { skillId: 'F002', status: 'accurate' },
      ],
      existingRecords,
    });
    expect(out.map((r) => r.skillId)).toEqual(['F002']);
  });

  it('dedupes repeated F-codes within the same batch', () => {
    const out = buildFractionSkillStateRecords({
      fractionStates: [
        { skillId: 'F010', status: 'accurate' },
        { skillId: 'F010', status: 'learning' },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('accurate');
  });

  it('skips states without a skillId and tolerates empty input', () => {
    expect(buildFractionSkillStateRecords({ fractionStates: [{ status: 'accurate' }] })).toEqual([]);
    expect(buildFractionSkillStateRecords({})).toEqual([]);
    expect(buildFractionSkillStateRecords()).toEqual([]);
  });
});
