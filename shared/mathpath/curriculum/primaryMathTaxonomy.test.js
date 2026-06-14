import { describe, it, expect } from 'vitest';
import {
  TOPICS,
  SKILLS,
  STRANDS,
  QUESTION_TYPES,
  MISCONCEPTION_TAGS,
  getTopicsByLevel,
  getSkillsByTopic,
  getSkillById,
  getTopicById,
  getSkillsByLevel,
  getPrerequisites,
  getPrerequisiteTree,
  getExamPrepTopics,
  getWeaknessDrillSkills,
  getSkillByFractionsAlias,
  getTopicsByStrand,
  getAllLevels,
  getTaxonomyStats,
} from './primaryMathTaxonomy.js';

const LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

describe('Primary Math Taxonomy — structure', () => {
  it('all P1–P6 levels exist in topics', () => {
    for (const level of LEVELS) {
      const topics = getTopicsByLevel(level);
      expect(topics.length).toBeGreaterThan(0);
    }
  });

  it('all P1–P6 levels exist in skills', () => {
    for (const level of LEVELS) {
      const skills = getSkillsByLevel(level);
      expect(skills.length).toBeGreaterThan(0);
    }
  });

  it('every topic has at least one skill', () => {
    for (const topic of TOPICS) {
      const skills = getSkillsByTopic(topic.topicId);
      expect(skills.length, `topic ${topic.topicId} has no skills`).toBeGreaterThan(0);
    }
  });

  it('every topic has a valid level', () => {
    for (const topic of TOPICS) {
      expect(LEVELS).toContain(topic.level);
    }
  });

  it('every topic has a valid strand', () => {
    const validStrands = Object.values(STRANDS);
    for (const topic of TOPICS) {
      expect(validStrands, `topic ${topic.topicId} has invalid strand "${topic.strand}"`).toContain(topic.strand);
    }
  });

  it('every skill has a unique skillId', () => {
    const ids = SKILLS.map((s) => s.skillId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every topic has a unique topicId', () => {
    const ids = TOPICS.map((t) => t.topicId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every skill references a valid topicId', () => {
    for (const skill of SKILLS) {
      expect(getTopicById(skill.topicId), `skill ${skill.skillId} references invalid topic ${skill.topicId}`).not.toBeNull();
    }
  });

  it('every skill has at least one questionType', () => {
    for (const skill of SKILLS) {
      expect(skill.questionTypes.length, `skill ${skill.skillId} has no questionTypes`).toBeGreaterThan(0);
    }
  });

  it('every skill questionType is from the allowed list', () => {
    for (const skill of SKILLS) {
      for (const qt of skill.questionTypes) {
        expect(QUESTION_TYPES, `skill ${skill.skillId} has invalid questionType "${qt}"`).toContain(qt);
      }
    }
  });

  it('every skill misconceptionTag is from the allowed list', () => {
    for (const skill of SKILLS) {
      for (const tag of skill.misconceptionTags) {
        expect(MISCONCEPTION_TAGS, `skill ${skill.skillId} has invalid misconceptionTag "${tag}"`).toContain(tag);
      }
    }
  });

  it('every skill has difficultyBands with foundation, standard, and stretch', () => {
    for (const skill of SKILLS) {
      expect(skill.difficultyBands).toHaveProperty('foundation');
      expect(skill.difficultyBands).toHaveProperty('standard');
      expect(skill.difficultyBands).toHaveProperty('stretch');
    }
  });

  it('every skill has a valid examRelevance', () => {
    for (const skill of SKILLS) {
      expect(['foundation', 'standard']).toContain(skill.examRelevance);
    }
  });

  it('every skill level matches its topic level', () => {
    for (const skill of SKILLS) {
      const topic = getTopicById(skill.topicId);
      expect(skill.level, `skill ${skill.skillId} level ${skill.level} != topic level ${topic.level}`).toBe(topic.level);
    }
  });
});

describe('Primary Math Taxonomy — prerequisites', () => {
  it('prerequisites reference valid skillIds or are empty', () => {
    for (const skill of SKILLS) {
      for (const preId of skill.prerequisites) {
        expect(getSkillById(preId), `skill ${skill.skillId} has invalid prerequisite "${preId}"`).not.toBeNull();
      }
    }
  });

  it('no skill is a prerequisite of itself', () => {
    for (const skill of SKILLS) {
      expect(skill.prerequisites).not.toContain(skill.skillId);
    }
  });

  it('prerequisite graph has no cycles (spot check deep tree)', () => {
    const tree = getPrerequisiteTree('p6-frac-division-word-problems');
    const ids = tree.map((s) => s.skillId);
    expect(ids).not.toContain('p6-frac-division-word-problems');
  });
});

describe('Primary Math Taxonomy — helpers', () => {
  it('getTopicsByLevel returns correct topics for P1', () => {
    const topics = getTopicsByLevel('P1');
    expect(topics.length).toBe(8);
    expect(topics.map((t) => t.topicId)).toContain('p1-numbers');
  });

  it('getSkillsByTopic returns skills for a known topic', () => {
    const skills = getSkillsByTopic('p1-numbers');
    expect(skills.length).toBeGreaterThanOrEqual(4);
    expect(skills.every((s) => s.topicId === 'p1-numbers')).toBe(true);
  });

  it('getSkillById returns the correct skill', () => {
    const skill = getSkillById('p5-pct-gst');
    expect(skill).not.toBeNull();
    expect(skill.skillName).toBe('GST');
  });

  it('getSkillById returns null for unknown id', () => {
    expect(getSkillById('nonexistent')).toBeNull();
  });

  it('getPrerequisites returns skill objects', () => {
    const prereqs = getPrerequisites('p4-frac-add-sub-unlike');
    expect(prereqs.length).toBeGreaterThan(0);
    expect(prereqs[0]).toHaveProperty('skillId');
  });

  it('getPrerequisiteTree walks the full chain', () => {
    const tree = getPrerequisiteTree('p3-add-sub-4digit');
    const ids = tree.map((s) => s.skillId);
    expect(ids).toContain('p2-add-3digit');
    expect(ids).toContain('p1-add-sub-within-100');
  });

  it('getExamPrepTopics filters to standard relevance', () => {
    const topics = getExamPrepTopics('P5');
    expect(topics.length).toBeGreaterThan(0);
    for (const t of topics) {
      expect(t.examSkillCount).toBeGreaterThan(0);
      expect(t.skills.every((s) => s.examRelevance === 'standard')).toBe(true);
    }
  });

  it('getWeaknessDrillSkills filters by misconception tags', () => {
    const skills = getWeaknessDrillSkills('P4', ['fraction_whole_confusion']);
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every((s) => s.misconceptionTags.includes('fraction_whole_confusion'))).toBe(true);
  });

  it('getWeaknessDrillSkills returns all skills when no tags given', () => {
    const all = getWeaknessDrillSkills('P3');
    const level = getSkillsByLevel('P3');
    expect(all.length).toBe(level.length);
  });

  it('getSkillByFractionsAlias resolves F001 to p2-frac-of-whole', () => {
    const skill = getSkillByFractionsAlias('F001');
    expect(skill).not.toBeNull();
    expect(skill.skillId).toBe('p2-frac-of-whole');
  });

  it('getTopicsByStrand filters correctly', () => {
    const stats = getTopicsByStrand('P3', STRANDS.STATISTICS);
    expect(stats.length).toBe(1);
    expect(stats[0].topicId).toBe('p3-bar-graphs');
  });

  it('getAllLevels returns P1–P6', () => {
    expect(getAllLevels()).toEqual(LEVELS);
  });

  it('getTaxonomyStats gives correct shape', () => {
    const stats = getTaxonomyStats();
    expect(stats.length).toBe(6);
    for (const row of stats) {
      expect(row).toHaveProperty('level');
      expect(row).toHaveProperty('topicCount');
      expect(row).toHaveProperty('skillCount');
      expect(row.topicCount).toBeGreaterThan(0);
      expect(row.skillCount).toBeGreaterThan(0);
    }
  });
});

describe('Primary Math Taxonomy — coverage', () => {
  it('has substantial skill counts per level', () => {
    const minimums = { P1: 20, P2: 15, P3: 15, P4: 15, P5: 15, P6: 15 };
    for (const level of LEVELS) {
      const count = getSkillsByLevel(level).length;
      expect(count, `${level} has only ${count} skills`).toBeGreaterThanOrEqual(minimums[level]);
    }
  });

  it('total skill count exceeds 100', () => {
    expect(SKILLS.length).toBeGreaterThan(100);
  });

  it('total topic count covers all content areas', () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(40);
  });

  it('fractions alias mappings exist for key F-codes', () => {
    const expected = ['F001', 'F004', 'F009', 'F010', 'F013', 'F014', 'F015'];
    for (const fCode of expected) {
      expect(getSkillByFractionsAlias(fCode), `missing alias for ${fCode}`).not.toBeNull();
    }
  });
});
