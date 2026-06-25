import { describe, it, expect } from 'vitest';
import {
  earlyNumeracySkillGraph,
  getSkill,
  getPrerequisites,
  validateEarlyNumeracySkillGraph,
} from './EarlyNumeracySkillGraph.js';

describe('EarlyNumeracySkillGraph', () => {
  it('is a valid acyclic graph with the canonical domain id', () => {
    const result = validateEarlyNumeracySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(earlyNumeracySkillGraph.domainId).toBe('early_numeracy');
    expect(earlyNumeracySkillGraph.skillIds.length).toBe(20);
  });

  it('groups skills into the four K2 numeracy strands', () => {
    const strands = new Set(earlyNumeracySkillGraph.skills.map((s) => s.strand));
    expect(strands).toEqual(new Set(['Counting & Number', 'Patterns', 'Shapes & Space', 'Measuring']));
    expect(getPrerequisites('EN012')).toContain('EN011'); // "what's missing" needs "what comes next"
    expect(getPrerequisites('EN014')).toContain('EN013'); // shape attributes need shape recognition
  });

  it('resolves skills by id and by slug', () => {
    expect(getSkill('EN001')?.name).toBe('Counting to 10');
    expect(getSkill('en.count.to10')?.id).toBe('EN001');
    expect(getSkill('nope')).toBeNull();
  });

  it('uses en.* slugs (so /mastery domainId tagging resolves to early_numeracy)', () => {
    expect(earlyNumeracySkillGraph.skills.every((s) => /^en\./.test(s.slug))).toBe(true);
    expect(earlyNumeracySkillGraph.skills.every((s) => (s.singaporeLevel || []).includes('K2'))).toBe(true);
  });

  it('orders prerequisites so number bonds precede add/subtract within 10', () => {
    expect(getPrerequisites('EN007')).toContain('EN006'); // add needs bonds
    expect(getPrerequisites('EN008')).toContain('EN006'); // subtract needs bonds
    expect(getPrerequisites('EN006')).toContain('EN004'); // bonds need numerals
    expect(getPrerequisites('EN001')).toEqual([]); // counting to 10 is foundational
  });
});
