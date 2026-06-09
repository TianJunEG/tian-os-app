import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1DataQuestionGenerator';
import { validateP1DataSkillGraph, p1DataSkillGraph } from './p1DataSkillGraph';
import { validateP1DataQuestionFamilies, getQuestionFamiliesBySkill } from './p1DataQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p1DataMisconceptionMap';

describe('p1DataSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1DataSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 6 P1-DAT skills', () => {
    expect(p1DataSkillGraph.skills).toHaveLength(6);
    expect(p1DataSkillGraph.domainId).toBe('p1-data');
  });

  it('has no unreachable skills', () => {
    const result = validateP1DataSkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-DAT-01 is the foundation skill (within this domain)', () => {
    const result = validateP1DataSkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-DAT-01');
    expect(result.summary.foundationSkills).toHaveLength(1);
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1DataSkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });

  it('all skills have visualRequirement set to required', () => {
    for (const skill of p1DataSkillGraph.skills) {
      expect(skill.visualRequirement).toBe('required');
    }
  });

  it('P1-DAT-05 depends on both P1-DAT-03 and P1-DAT-04', () => {
    const skill = p1DataSkillGraph.skills.find((s) => s.id === 'P1-DAT-05');
    expect(skill.prerequisites).toContain('P1-DAT-03');
    expect(skill.prerequisites).toContain('P1-DAT-04');
  });
});

describe('p1DataQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1DataQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 12 total families (2 per skill)', () => {
    const result = validateP1DataQuestionFamilies();
    expect(result.totalFamilies).toBe(12);
  });

  it('every skill has exactly two question families', () => {
    for (const skillId of p1DataSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families).toHaveLength(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1DataSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('all families have visual requirement set to required', () => {
    for (const skillId of p1DataSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.visualRequirement).toBe('required');
      }
    }
  });

  it('total and difference families require working', () => {
    for (const skillId of ['P1-DAT-04', 'P1-DAT-05']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.workingRequired).toBe(true);
      }
    }
  });
});

describe('p1DataMisconceptionMap', () => {
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
    const m = getMisconception('graph_counts_all');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Counts all pictures instead of one category');
  });

  it('finds misconceptions for P1-DAT-01', () => {
    const ms = getMisconceptionsForSkill('P1-DAT-01');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('graph_counts_all');
  });

  it('finds misconceptions for comparison skill P1-DAT-03', () => {
    const ms = getMisconceptionsForSkill('P1-DAT-03');
    expect(ms.length).toBeGreaterThanOrEqual(2);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('graph_by_preference');
    expect(tags).toContain('graph_by_label_length');
  });

  it('finds misconceptions for difference skill P1-DAT-05', () => {
    const ms = getMisconceptionsForSkill('P1-DAT-05');
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('graph_adds_instead_of_diff');
    expect(tags).toContain('graph_ignores_question');
  });
});

describe('p1DataQuestionGenerator', () => {
  it('supports all 6 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(6);
  });

  describe('P1-DAT-01: Read simple picture graphs', () => {
    it('generates a 3-category graph question', () => {
      const q = generateQuestion('P1-DAT-01', { questionFamilyId: 'QF_P1-DAT-01_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-DAT-01');
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(8);
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
      expect(q.diagramSpec.data.categories).toHaveLength(3);
    });

    it('generates a 4-category graph question', () => {
      const q = generateQuestion('P1-DAT-01', { questionFamilyId: 'QF_P1-DAT-01_002' });
      expect(q).not.toBeNull();
      expect(q.diagramSpec.data.categories).toHaveLength(4);
    });

    it('prompt mentions the target category', () => {
      const q = generateQuestion('P1-DAT-01');
      const categoryLabels = q.diagramSpec.data.categories.map((c) => c.label);
      const mentionedCategory = categoryLabels.find((label) => q.prompt.includes(label));
      expect(mentionedCategory).toBeDefined();
    });
  });

  describe('P1-DAT-02: Count items in each category', () => {
    it('generates a small-count question (family 1)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-DAT-02', { questionFamilyId: 'QF_P1-DAT-02_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(5);
      }
    });

    it('generates a larger-count question (family 2)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-DAT-02', { questionFamilyId: 'QF_P1-DAT-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(4);
        expect(q.answer).toBeLessThanOrEqual(8);
      }
    });

    it('has picture_collections diagram', () => {
      const q = generateQuestion('P1-DAT-02');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
    });
  });

  describe('P1-DAT-03: Compare categories', () => {
    it('generates a most/fewest question', () => {
      const q = generateQuestion('P1-DAT-03', { questionFamilyId: 'QF_P1-DAT-03_001' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('text');
      expect(q.prompt).toMatch(/most|fewest/);
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a more/fewer comparison question', () => {
      const q = generateQuestion('P1-DAT-03', { questionFamilyId: 'QF_P1-DAT-03_002' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('text');
      expect(q.prompt).toMatch(/more|fewer/);
    });

    it('answer is a valid category label', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-DAT-03');
        const categoryLabels = q.diagramSpec.data.categories.map((c) => c.label);
        expect(categoryLabels).toContain(q.answer);
      }
    });
  });

  describe('P1-DAT-04: Find total from a graph', () => {
    it('generates a 3-category total question', () => {
      const q = generateQuestion('P1-DAT-04', { questionFamilyId: 'QF_P1-DAT-04_001' });
      expect(q).not.toBeNull();
      expect(q.diagramSpec.data.categories).toHaveLength(3);
      const expectedTotal = q.diagramSpec.data.categories.reduce((s, c) => s + c.count, 0);
      expect(q.answer).toBe(expectedTotal);
    });

    it('generates a 4-category total question', () => {
      const q = generateQuestion('P1-DAT-04', { questionFamilyId: 'QF_P1-DAT-04_002' });
      expect(q).not.toBeNull();
      expect(q.diagramSpec.data.categories).toHaveLength(4);
      const expectedTotal = q.diagramSpec.data.categories.reduce((s, c) => s + c.count, 0);
      expect(q.answer).toBe(expectedTotal);
    });

    it('prompt contains "altogether"', () => {
      const q = generateQuestion('P1-DAT-04');
      expect(q.prompt).toContain('altogether');
    });

    it('has a working template', () => {
      const q = generateQuestion('P1-DAT-04');
      expect(q.workingTemplate).toBeDefined();
      expect(q.workingTemplate.operatorCircle).toBe(true);
    });
  });

  describe('P1-DAT-05: Answer simple data questions', () => {
    it('generates a "how many more" question', () => {
      const q = generateQuestion('P1-DAT-05', { questionFamilyId: 'QF_P1-DAT-05_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('more');
      expect(q.answer).toBeGreaterThanOrEqual(0);
    });

    it('generates a "how many fewer" question', () => {
      const q = generateQuestion('P1-DAT-05', { questionFamilyId: 'QF_P1-DAT-05_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('fewer');
      expect(q.answer).toBeGreaterThanOrEqual(0);
    });

    it('uses comparison_model diagram', () => {
      const q = generateQuestion('P1-DAT-05');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('comparison_model');
    });

    it('answer equals the difference between two categories', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-DAT-05');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.solutionText).toContain(String(q.answer));
      }
    });
  });

  describe('P1-DAT-06: Complete a simple picture graph', () => {
    it('generates a "draw given count" question', () => {
      const q = generateQuestion('P1-DAT-06', { questionFamilyId: 'QF_P1-DAT-06_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('How many pictures should you draw');
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(8);
    });

    it('generates a "find missing from total" question', () => {
      const q = generateQuestion('P1-DAT-06', { questionFamilyId: 'QF_P1-DAT-06_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('altogether');
      expect(q.answer).toBeGreaterThanOrEqual(1);
    });

    it('diagram has a hidden category with count 0', () => {
      const q = generateQuestion('P1-DAT-06');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
      const zeroCats = q.diagramSpec.data.categories.filter((c) => c.count === 0);
      expect(zeroCats.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-DAT-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-DAT-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-DAT-01', 'P1-DAT-03', 'P1-DAT-05'];
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
      const q = generateQuestion('P1-DAT-01');
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
