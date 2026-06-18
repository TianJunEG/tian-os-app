import { describe, expect, it } from 'vitest';
import { buildWeakSkillAggregation } from './mistakes.js';

describe('buildWeakSkillAggregation', () => {
  it('groups MathPath mistakes with domain metadata and adult next actions', () => {
    const rows = buildWeakSkillAggregation([
      {
        skillId: 'skill-1',
        skillCode: 'STAT001',
        skillName: 'Read tables',
        topicName: 'Data',
        domainId: 'statistics',
        confidence: 'i_know_this',
        occurredAt: new Date('2026-06-01T00:00:00Z'),
      },
      {
        skillId: 'skill-1',
        skillCode: 'STAT001',
        skillName: 'Read tables',
        topicName: 'Data',
        domainId: 'statistics',
        confidence: 'i_need_help',
        occurredAt: new Date('2026-06-02T00:00:00Z'),
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      skillId: 'skill-1',
      skillCode: 'STAT001',
      skillName: 'Read tables',
      domainId: 'statistics',
      count: 2,
      confidenceRiskCount: 1,
    });
    expect(rows[0].nextAction).toContain('Statistics');
    expect(rows[0].nextAction).toContain('Read tables');
  });
});
