import { describe, it, expect } from 'vitest';
import { levelOrdinal, visibleSkillLevel } from './skillLevel';

describe('levelOrdinal', () => {
  it('parses primary, kindergarten and secondary levels', () => {
    expect(levelOrdinal('Primary 1')).toBe(1);
    expect(levelOrdinal('P5')).toBe(5);
    expect(levelOrdinal('K2')).toBe(0);
    expect(levelOrdinal('Secondary G1')).toBe(7);
    expect(levelOrdinal('')).toBe(null);
  });
});

describe('visibleSkillLevel', () => {
  it('hides a level below the student level (no demoralising remedial tag)', () => {
    expect(visibleSkillLevel('Primary 1', 'P5')).toBe('');
    expect(visibleSkillLevel('P3', 'Primary 5')).toBe('');
  });
  it('shows a level at or above the student level', () => {
    expect(visibleSkillLevel('Primary 5', 'P5')).toBe('Primary 5');
    expect(visibleSkillLevel('P6', 'P5')).toBe('P6');
  });
  it('shows the tag when either level is unknown', () => {
    expect(visibleSkillLevel('Primary 1', '')).toBe('Primary 1');
  });
});
