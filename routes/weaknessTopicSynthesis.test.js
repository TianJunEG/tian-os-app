import { describe, it, expect } from 'vitest';
import { synthesizeWeaknessTopicRows } from './assessmentSpecifications.js';

describe('synthesizeWeaknessTopicRows', () => {
  it('groups weak skills into one row per domain', () => {
    const rows = synthesizeWeaknessTopicRows(
      ['F010', 'F011', 'F020'],
      { F010: 'fractions', F011: 'fractions', F020: 'ratio' }
    );
    expect(rows).toHaveLength(2);
    const fractions = rows.find((r) => r.domainId === 'fractions');
    const ratio = rows.find((r) => r.domainId === 'ratio');
    expect(fractions.skillIds).toEqual(['F010', 'F011']);
    expect(ratio.skillIds).toEqual(['F020']);
  });

  it('weights marks by the number of weak skills in each domain', () => {
    const rows = synthesizeWeaknessTopicRows(
      ['F010', 'F011', 'F020'],
      { F010: 'fractions', F011: 'fractions', F020: 'ratio' }
    );
    expect(rows.find((r) => r.domainId === 'fractions').marks).toBe(2);
    expect(rows.find((r) => r.domainId === 'ratio').marks).toBe(1);
  });

  it('places skills with unknown domain under a blank domainId (mixed)', () => {
    const rows = synthesizeWeaknessTopicRows(['X1', 'X2'], {});
    expect(rows).toHaveLength(1);
    expect(rows[0].domainId).toBe('');
    expect(rows[0].topicName).toContain('mixed');
    expect(rows[0].skillIds).toEqual(['X1', 'X2']);
  });

  it('always produces mixed-difficulty rows carrying the skill ids', () => {
    const rows = synthesizeWeaknessTopicRows(['F001'], { F001: 'time' });
    expect(rows[0].difficulty).toBe('mixed');
    expect(rows[0].skillIds).toContain('F001');
  });

  it('returns nothing for an empty weak set', () => {
    expect(synthesizeWeaknessTopicRows([], {})).toEqual([]);
  });
});
