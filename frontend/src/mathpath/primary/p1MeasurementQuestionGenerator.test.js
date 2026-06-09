import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1MeasurementQuestionGenerator';
import { validateP1MeasurementSkillGraph, p1MeasurementSkillGraph } from './p1MeasurementSkillGraph';
import { validateP1MeasurementQuestionFamilies, getQuestionFamiliesBySkill } from './p1MeasurementQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p1MeasurementMisconceptionMap';

describe('p1MeasurementSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1MeasurementSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 7 P1-MEA skills', () => {
    expect(p1MeasurementSkillGraph.skills).toHaveLength(7);
    expect(p1MeasurementSkillGraph.domainId).toBe('p1-measurement');
  });

  it('has no unreachable skills', () => {
    const result = validateP1MeasurementSkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-MEA-01 through P1-MEA-05 are foundation skills (within this domain)', () => {
    const result = validateP1MeasurementSkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-MEA-01');
    expect(result.summary.foundationSkills).toContain('P1-MEA-02');
    expect(result.summary.foundationSkills).toContain('P1-MEA-03');
    expect(result.summary.foundationSkills).toContain('P1-MEA-04');
    expect(result.summary.foundationSkills).toContain('P1-MEA-05');
  });

  it('P1-MEA-06 depends on P1-MEA-05', () => {
    const skill = p1MeasurementSkillGraph.skills.find((s) => s.id === 'P1-MEA-06');
    expect(skill.prerequisites).toContain('P1-MEA-05');
  });

  it('P1-MEA-07 depends on P1-MEA-01', () => {
    const skill = p1MeasurementSkillGraph.skills.find((s) => s.id === 'P1-MEA-07');
    expect(skill.prerequisites).toContain('P1-MEA-01');
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1MeasurementSkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });
});

describe('p1MeasurementQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1MeasurementQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 14 total families', () => {
    const result = validateP1MeasurementQuestionFamilies();
    expect(result.totalFamilies).toBe(14);
  });

  it('every skill has exactly two question families', () => {
    for (const skillId of p1MeasurementSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families).toHaveLength(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1MeasurementSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('comparison families require visual', () => {
    for (const skillId of ['P1-MEA-01', 'P1-MEA-02', 'P1-MEA-03']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.visualRequirement).toBe('required');
      }
    }
  });
});

describe('p1MeasurementMisconceptionMap', () => {
  it('has all 14 misconception tags', () => {
    const all = getAllMisconceptions();
    expect(all.length).toBe(14);
  });

  it('every misconception has remediation data', () => {
    for (const m of getAllMisconceptions()) {
      expect(m.remediationExplanation).toBeTruthy();
      expect(m.recheckPattern).toBeTruthy();
      expect(m.parentNote).toBeTruthy();
    }
  });

  it('looks up misconception by tag', () => {
    const m = getMisconception('mass_by_size');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Thinks bigger means heavier');
  });

  it('finds misconceptions for P1-MEA-01', () => {
    const ms = getMisconceptionsForSkill('P1-MEA-01');
    expect(ms.length).toBeGreaterThanOrEqual(2);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('length_by_position');
    expect(tags).toContain('length_by_thickness');
  });

  it('finds misconceptions for clock skills', () => {
    expect(getMisconceptionsForSkill('P1-MEA-05').length).toBeGreaterThanOrEqual(2);
    expect(getMisconceptionsForSkill('P1-MEA-06').length).toBeGreaterThanOrEqual(2);
    const tags06 = getMisconceptionsForSkill('P1-MEA-06').map((m) => m.tag);
    expect(tags06).toContain('half_past_reads_wrong_hour');
    expect(tags06).toContain('half_past_writes_06');
  });

  it('finds misconceptions for P1-MEA-07', () => {
    const ms = getMisconceptionsForSkill('P1-MEA-07');
    expect(ms.length).toBeGreaterThanOrEqual(2);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('units_gaps_overlaps');
    expect(tags).toContain('units_mixed_sizes');
  });
});

describe('p1MeasurementQuestionGenerator', () => {
  it('supports all 7 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(7);
  });

  describe('P1-MEA-01: Compare length', () => {
    it('generates a longer/shorter comparison', () => {
      const q = generateQuestion('P1-MEA-01', { questionFamilyId: 'QF_P1-MEA-01_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-01');
      expect(q.answerType).toBe('choice');
      expect(q.prompt).toMatch(/longer|shorter/);
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('comparison_model');
    });

    it('generates a taller/shorter comparison', () => {
      const q = generateQuestion('P1-MEA-01', { questionFamilyId: 'QF_P1-MEA-01_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/taller|shorter/);
      expect(q.diagramSpec).toBeDefined();
    });

    it('answer is one of the mentioned objects', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-MEA-01');
        expect(q.prompt).toContain(q.answer);
      }
    });
  });

  describe('P1-MEA-02: Compare mass', () => {
    it('generates a heavier/lighter comparison', () => {
      const q = generateQuestion('P1-MEA-02', { questionFamilyId: 'QF_P1-MEA-02_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-02');
      expect(q.prompt).toMatch(/heavier|lighter/);
    });

    it('generates an arrange by mass question', () => {
      const q = generateQuestion('P1-MEA-02', { questionFamilyId: 'QF_P1-MEA-02_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/Arrange/);
    });

    it('has comparison diagram', () => {
      const q = generateQuestion('P1-MEA-02');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('comparison_model');
    });
  });

  describe('P1-MEA-03: Compare capacity', () => {
    it('generates a more/less water comparison', () => {
      const q = generateQuestion('P1-MEA-03', { questionFamilyId: 'QF_P1-MEA-03_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-03');
      expect(q.prompt).toMatch(/more|less/);
    });

    it('generates a full/empty identification', () => {
      const q = generateQuestion('P1-MEA-03', { questionFamilyId: 'QF_P1-MEA-03_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/full|empty/);
      expect(q.answer).toBe('full');
    });
  });

  describe('P1-MEA-04: Sequence events', () => {
    it('generates a sequence three events question', () => {
      const q = generateQuestion('P1-MEA-04', { questionFamilyId: 'QF_P1-MEA-04_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-04');
      expect(q.prompt).toContain('correct order');
    });

    it('generates a before/after question', () => {
      const q = generateQuestion('P1-MEA-04', { questionFamilyId: 'QF_P1-MEA-04_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/before|after/);
    });
  });

  describe('P1-MEA-05: Tell time to o\'clock', () => {
    it('generates a read from description question', () => {
      const q = generateQuestion('P1-MEA-05', { questionFamilyId: 'QF_P1-MEA-05_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-05');
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(12);
      expect(q.prompt).toContain('short hand');
    });

    it('generates a what time is shown question', () => {
      const q = generateQuestion('P1-MEA-05', { questionFamilyId: 'QF_P1-MEA-05_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain("o'clock");
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(12);
    });

    it('includes a clock diagram', () => {
      const q = generateQuestion('P1-MEA-05');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('clock');
    });
  });

  describe('P1-MEA-06: Tell time to half past', () => {
    it('generates a read half-past time question', () => {
      const q = generateQuestion('P1-MEA-06', { questionFamilyId: 'QF_P1-MEA-06_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-06');
      expect(q.prompt).toContain('long hand points to 6');
      expect(q.answer).toMatch(/half past/);
    });

    it('generates a digital time question', () => {
      const q = generateQuestion('P1-MEA-06', { questionFamilyId: 'QF_P1-MEA-06_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('half past');
      expect(q.answer).toMatch(/:30$/);
    });

    it('includes a clock diagram', () => {
      const q = generateQuestion('P1-MEA-06');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('clock');
    });
  });

  describe('P1-MEA-07: Use non-standard units', () => {
    it('generates a paper clips measurement question', () => {
      const q = generateQuestion('P1-MEA-07', { questionFamilyId: 'QF_P1-MEA-07_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MEA-07');
      expect(q.answerType).toBe('number');
      expect(q.prompt).toContain('paper clips');
      expect(q.answer).toBeGreaterThanOrEqual(4);
      expect(q.answer).toBeLessThanOrEqual(12);
    });

    it('generates a cubes measurement question', () => {
      const q = generateQuestion('P1-MEA-07', { questionFamilyId: 'QF_P1-MEA-07_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('cubes');
      expect(q.answer).toBeGreaterThanOrEqual(4);
      expect(q.answer).toBeLessThanOrEqual(12);
    });

    it('has length measurement diagram', () => {
      const q = generateQuestion('P1-MEA-07');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('length_measurement');
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-MEA-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-MEA-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-MEA-01', 'P1-MEA-02', 'P1-MEA-05'];
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
      const q = generateQuestion('P1-MEA-01');
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
});
