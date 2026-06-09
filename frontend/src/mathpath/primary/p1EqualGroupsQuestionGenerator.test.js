import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1EqualGroupsQuestionGenerator';
import { validateP1EqualGroupsSkillGraph, p1EqualGroupsSkillGraph } from './p1EqualGroupsSkillGraph';
import { validateP1EqualGroupsQuestionFamilies, getQuestionFamiliesBySkill } from './p1EqualGroupsQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p1EqualGroupsMisconceptionMap';

describe('p1EqualGroupsSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1EqualGroupsSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 5 P1-EQG skills', () => {
    expect(p1EqualGroupsSkillGraph.skills).toHaveLength(5);
    expect(p1EqualGroupsSkillGraph.domainId).toBe('p1-equalgroups');
  });

  it('has no unreachable skills', () => {
    const result = validateP1EqualGroupsSkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-EQG-01 and P1-EQG-04 are foundation skills (within this domain)', () => {
    const result = validateP1EqualGroupsSkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-EQG-01');
    expect(result.summary.foundationSkills).toContain('P1-EQG-04');
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1EqualGroupsSkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });
});

describe('p1EqualGroupsQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1EqualGroupsQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 10 total families', () => {
    const result = validateP1EqualGroupsQuestionFamilies();
    expect(result.totalFamilies).toBe(10);
  });

  it('every skill has at least two question families', () => {
    for (const skillId of p1EqualGroupsSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1EqualGroupsSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('all families have visual requirement set to required', () => {
    for (const skillId of p1EqualGroupsSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.visualRequirement).toBe('required');
      }
    }
  });
});

describe('p1EqualGroupsMisconceptionMap', () => {
  it('has all 10 misconception tags', () => {
    const all = getAllMisconceptions();
    expect(all.length).toBe(10);
  });

  it('every misconception has remediation data', () => {
    for (const m of getAllMisconceptions()) {
      expect(m.remediationExplanation).toBeTruthy();
      expect(m.recheckPattern).toBeTruthy();
      expect(m.parentNote).toBeTruthy();
    }
  });

  it('looks up misconception by tag', () => {
    const m = getMisconception('equal_groups_uneven');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Makes groups with different counts');
  });

  it('finds misconceptions for P1-EQG-01', () => {
    const ms = getMisconceptionsForSkill('P1-EQG-01');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('equal_groups_uneven');
  });

  it('finds misconceptions for sharing skills', () => {
    expect(getMisconceptionsForSkill('P1-EQG-04').length).toBeGreaterThanOrEqual(2);
    expect(getMisconceptionsForSkill('P1-EQG-05').length).toBeGreaterThanOrEqual(2);
    const tags05 = getMisconceptionsForSkill('P1-EQG-05').map((m) => m.tag);
    expect(tags05).toContain('leftover_ignored');
  });

  it('finds misconceptions for repeated addition skill', () => {
    const ms = getMisconceptionsForSkill('P1-EQG-03');
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('repeated_add_counts_groups');
    expect(tags).toContain('repeated_add_one_group');
  });
});

describe('p1EqualGroupsQuestionGenerator', () => {
  it('supports all 5 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(5);
  });

  describe('P1-EQG-01: Make equal groups', () => {
    it('generates a small equal-groups question', () => {
      const q = generateQuestion('P1-EQG-01', { questionFamilyId: 'QF_P1-EQG-01_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-EQG-01');
      expect(q.answerType).toBe('number');
      expect(q.prompt).toContain('equal groups');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('equal_groups');
    });

    it('small family keeps total in 6–12 range', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-01', { questionFamilyId: 'QF_P1-EQG-01_001' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        const total = nums[0];
        expect(total).toBeGreaterThanOrEqual(6);
        expect(total).toBeLessThanOrEqual(12);
      }
    });

    it('larger family keeps total in 12–20 range', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-01', { questionFamilyId: 'QF_P1-EQG-01_002' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        const total = nums[0];
        expect(total).toBeGreaterThanOrEqual(12);
        expect(total).toBeLessThanOrEqual(20);
      }
    });

    it('answer times groups equals total', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-01');
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(q.answer * nums[1]).toBe(nums[0]);
      }
    });
  });

  describe('P1-EQG-02: Identify unequal groups', () => {
    it('generates a choose-equal-groups question', () => {
      const q = generateQuestion('P1-EQG-02', { questionFamilyId: 'QF_P1-EQG-02_001' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('choice');
      expect(q.choices).toBeDefined();
      expect(q.prompt).toContain('equal groups');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
    });

    it('generates an are-these-equal question', () => {
      const q = generateQuestion('P1-EQG-02', { questionFamilyId: 'QF_P1-EQG-02_002' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('choice');
      expect(q.choices).toContain('Yes');
      expect(q.choices).toContain('No');
      expect(q.prompt).toContain('equal');
    });

    it('answer is always Yes or No for family 2', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-02', { questionFamilyId: 'QF_P1-EQG-02_002' });
        expect(['Yes', 'No']).toContain(q.answer);
      }
    });
  });

  describe('P1-EQG-03: Repeated addition readiness', () => {
    it('generates a repeated addition question', () => {
      const q = generateQuestion('P1-EQG-03', { questionFamilyId: 'QF_P1-EQG-03_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-EQG-03');
      expect(q.prompt).toContain('groups of');
      expect(q.prompt).toContain('altogether');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('equal_groups');
    });

    it('small family has 2–3 groups', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-03', { questionFamilyId: 'QF_P1-EQG-03_001' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(nums[0]).toBeGreaterThanOrEqual(2);
        expect(nums[0]).toBeLessThanOrEqual(3);
      }
    });

    it('larger family has 3–5 groups', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-03', { questionFamilyId: 'QF_P1-EQG-03_002' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(nums[0]).toBeGreaterThanOrEqual(3);
        expect(nums[0]).toBeLessThanOrEqual(5);
      }
    });

    it('answer equals groups times items per group', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-03');
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(q.answer).toBe(nums[0] * nums[1]);
      }
    });
  });

  describe('P1-EQG-04: Share objects equally', () => {
    it('generates an exact sharing question', () => {
      const q = generateQuestion('P1-EQG-04', { questionFamilyId: 'QF_P1-EQG-04_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-EQG-04');
      expect(q.answerType).toBe('number');
      expect(q.prompt).toContain('equally');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('equal_groups');
    });

    it('sharing is always exact (no remainder)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-04');
        const nums = q.prompt.match(/\d+/g).map(Number);
        const total = nums[0];
        const people = nums[1];
        expect(total % people).toBe(0);
        expect(q.answer).toBe(total / people);
      }
    });

    it('shares among 2–4 children', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-04');
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(nums[1]).toBeGreaterThanOrEqual(2);
        expect(nums[1]).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('P1-EQG-05: Identify leftovers', () => {
    it('generates a find-leftover question', () => {
      const q = generateQuestion('P1-EQG-05', { questionFamilyId: 'QF_P1-EQG-05_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-EQG-05');
      expect(q.answerType).toBe('number');
      expect(q.prompt).toContain('left over');
      expect(q.diagramSpec).toBeDefined();
    });

    it('leftover is always 1 to people-1 for family 1', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-EQG-05', { questionFamilyId: 'QF_P1-EQG-05_001' });
        expect(q.answer).toBeGreaterThanOrEqual(1);
        const nums = q.prompt.match(/\d+/g).map(Number);
        expect(q.answer).toBeLessThan(nums[1]);
      }
    });

    it('generates an exact-or-leftover question', () => {
      const q = generateQuestion('P1-EQG-05', { questionFamilyId: 'QF_P1-EQG-05_002' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('choice');
      expect(q.choices).toContain('Exact');
      expect(q.choices).toContain('Leftovers');
    });

    it('exact-or-leftover answer matches the numbers', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P1-EQG-05', { questionFamilyId: 'QF_P1-EQG-05_002' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        const total = nums[0];
        const people = nums[1];
        if (total % people === 0) {
          expect(q.answer).toBe('Exact');
        } else {
          expect(q.answer).toBe('Leftovers');
        }
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-EQG-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-EQG-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-EQG-01', 'P1-EQG-03', 'P1-EQG-05'];
      const set = generateDiagnosticSet(skills, 2);
      expect(set).toHaveLength(6);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(3);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
  });

  it('every generated question has a unique questionId', () => {
    const ids = new Set();
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P1-EQG-01');
      expect(ids.has(q.questionId)).toBe(false);
      ids.add(q.questionId);
    }
  });

  it('every generated question has misconception traps', () => {
    for (const skillId of getSupportedSkillIds()) {
      const q = generateQuestion(skillId);
      expect(q.misconceptionTraps).toBeDefined();
      expect(q.misconceptionTraps.length).toBeGreaterThan(0);
    }
  });

  it('every generated question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      const q = generateQuestion(skillId);
      expect(q.solutionText).toBeDefined();
      expect(q.solutionText.length).toBeGreaterThan(0);
    }
  });

  it('every generated question has a diagramSpec', () => {
    for (const skillId of getSupportedSkillIds()) {
      const q = generateQuestion(skillId);
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBeTruthy();
    }
  });
});
