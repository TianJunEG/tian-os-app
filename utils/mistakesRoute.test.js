import { describe, expect, it } from 'vitest';
import { buildWeakSkillAggregation } from '../routes/mistakes.js';

describe('mistakes route aggregation helpers', () => {
  it('aggregates real mistakes by skill with latest date and confidence risk', () => {
    const weak = buildWeakSkillAggregation([
      {
        skillId: 'skill-1',
        skillCode: 'F001',
        skillName: 'Identify Fractions',
        confidence: 'i_know_this',
        timestamp: '2026-06-04T01:00:00.000Z',
      },
      {
        skillId: 'skill-1',
        skillCode: 'F001',
        skillName: 'Identify Fractions',
        confidence: 'not_sure',
        timestamp: '2026-06-04T01:10:00.000Z',
      },
      {
        skillId: 'skill-2',
        skillCode: 'F002',
        skillName: 'Equivalent Fractions',
        confidence: 'high',
        timestamp: '2026-06-03T01:00:00.000Z',
      },
    ]);

    expect(weak).toHaveLength(2);
    expect(weak[0]).toMatchObject({
      skillId: 'skill-1',
      skillCode: 'F001',
      skillName: 'Identify Fractions',
      count: 2,
      latestMistakeDate: '2026-06-04T01:10:00.000Z',
      confidenceRiskCount: 1,
    });
    expect(weak[1]).toMatchObject({
      skillId: 'skill-2',
      count: 1,
      confidenceRiskCount: 1,
    });
  });
});
