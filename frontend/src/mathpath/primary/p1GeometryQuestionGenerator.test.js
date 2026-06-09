import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1GeometryQuestionGenerator';
import { validateP1GeometrySkillGraph, p1GeometrySkillGraph } from './p1GeometrySkillGraph';
import { validateP1GeometryQuestionFamilies, getQuestionFamiliesBySkill } from './p1GeometryQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag } from './p1GeometryMisconceptionMap';

describe('p1GeometrySkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1GeometrySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 7 P1-GEO skills', () => {
    expect(p1GeometrySkillGraph.skills).toHaveLength(7);
    expect(p1GeometrySkillGraph.domainId).toBe('p1-geometry');
  });

  it('has no unreachable skills', () => {
    const result = validateP1GeometrySkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-GEO-01, P1-GEO-02, and P1-GEO-06 are foundation skills (within this domain)', () => {
    const result = validateP1GeometrySkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-GEO-01');
    expect(result.summary.foundationSkills).toContain('P1-GEO-02');
    expect(result.summary.foundationSkills).toContain('P1-GEO-06');
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1GeometrySkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });

  it('P1-GEO-07 depends on both P1-GEO-01 and P1-GEO-02', () => {
    const skill = p1GeometrySkillGraph.skills.find((s) => s.id === 'P1-GEO-07');
    expect(skill.prerequisites).toContain('P1-GEO-01');
    expect(skill.prerequisites).toContain('P1-GEO-02');
  });
});

describe('p1GeometryQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1GeometryQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 14 total families', () => {
    const result = validateP1GeometryQuestionFamilies();
    expect(result.totalFamilies).toBe(14);
  });

  it('every skill has exactly two question families', () => {
    for (const skillId of p1GeometrySkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families).toHaveLength(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1GeometrySkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('GEO-01 family 002 has number answer type for counting', () => {
    const families = getQuestionFamiliesBySkill('P1-GEO-01');
    const countFamily = families.find((f) => f.id === 'QF_P1-GEO-01_002');
    expect(countFamily.answerType).toBe('number');
  });
});

describe('p1GeometryMisconceptionMap', () => {
  it('has all 8 misconception tags', () => {
    const all = getAllMisconceptions();
    expect(all.length).toBe(8);
  });

  it('every misconception has remediation data', () => {
    for (const m of getAllMisconceptions()) {
      expect(m.remediationExplanation).toBeTruthy();
      expect(m.recheckPattern).toBeTruthy();
      expect(m.parentNote).toBeTruthy();
    }
  });

  it('looks up misconception by tag', () => {
    const m = getMisconception('shape_orientation_dependence');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Relies on orientation to identify shapes');
  });

  it('finds misconceptions for P1-GEO-01', () => {
    const ms = getMisconceptionsForSkill('P1-GEO-01');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('shape_orientation_dependence');
  });

  it('finds misconceptions for P1-GEO-06 (position words)', () => {
    const ms = getMisconceptionsForSkill('P1-GEO-06');
    expect(ms.length).toBeGreaterThanOrEqual(2);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('confuses_left_right');
    expect(tags).toContain('confuses_between_beside');
  });

  it('confuses_2d_3d relates to GEO-01, GEO-02, and GEO-07', () => {
    const m = getMisconception('confuses_2d_3d');
    expect(m.relatedSkills).toContain('P1-GEO-01');
    expect(m.relatedSkills).toContain('P1-GEO-02');
    expect(m.relatedSkills).toContain('P1-GEO-07');
  });

  it('getRemediationForTag returns structured remediation', () => {
    const r = getRemediationForTag('pattern_looks_only_at_last');
    expect(r).not.toBeNull();
    expect(r.tag).toBe('pattern_looks_only_at_last');
    expect(r.explanation).toBeTruthy();
    expect(r.parentNote).toBeTruthy();
  });

  it('getRemediationForTag returns null for unknown tag', () => {
    expect(getRemediationForTag('fake_tag')).toBeNull();
  });
});

describe('p1GeometryQuestionGenerator', () => {
  it('supports all 7 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(7);
  });

  describe('P1-GEO-01: Identify basic 2D shapes', () => {
    it('generates an identify-shape-by-name question', () => {
      const q = generateQuestion('P1-GEO-01', { questionFamilyId: 'QF_P1-GEO-01_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-01');
      expect(q.answerType).toBe('choice');
      expect(['circle', 'triangle', 'square', 'rectangle']).toContain(q.answer);
      expect(q.choices).toBeDefined();
      expect(q.choices).toContain(q.answer);
    });

    it('generates a count-sides-or-corners question', () => {
      const q = generateQuestion('P1-GEO-01', { questionFamilyId: 'QF_P1-GEO-01_002' });
      expect(q).not.toBeNull();
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(4);
      expect(q.prompt).toMatch(/sides|corners/);
    });
  });

  describe('P1-GEO-02: Identify basic 3D objects', () => {
    it('generates an identify-3D-object question', () => {
      const q = generateQuestion('P1-GEO-02', { questionFamilyId: 'QF_P1-GEO-02_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-02');
      expect(q.answerType).toBe('choice');
      expect(['cube', 'cuboid', 'sphere', 'cone', 'cylinder']).toContain(q.answer);
      expect(q.choices).toContain(q.answer);
    });

    it('generates a match-to-description question', () => {
      const q = generateQuestion('P1-GEO-02', { questionFamilyId: 'QF_P1-GEO-02_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('description');
      expect(q.choices).toContain(q.answer);
    });
  });

  describe('P1-GEO-03: Sort shapes by properties', () => {
    it('generates a sort-by-sides question', () => {
      const q = generateQuestion('P1-GEO-03', { questionFamilyId: 'QF_P1-GEO-03_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-03');
      expect(q.prompt).toMatch(/sides/);
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
    });

    it('generates a sort-by-curved-or-straight question', () => {
      const q = generateQuestion('P1-GEO-03', { questionFamilyId: 'QF_P1-GEO-03_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/curved|straight/);
      expect(q.diagramSpec).toBeDefined();
    });
  });

  describe('P1-GEO-04: Continue shape patterns', () => {
    it('generates an AB pattern question', () => {
      const q = generateQuestion('P1-GEO-04', { questionFamilyId: 'QF_P1-GEO-04_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-04');
      expect(q.prompt).toContain('What comes next');
      expect(q.choices).toContain(q.answer);
    });

    it('generates an ABC pattern question', () => {
      const q = generateQuestion('P1-GEO-04', { questionFamilyId: 'QF_P1-GEO-04_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('What comes next');
      expect(q.solutionText).toMatch(/repeats/);
    });

    it('pattern answer is consistent with the pattern', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-GEO-04', { questionFamilyId: 'QF_P1-GEO-04_001' });
        const parts = q.prompt.replace('What comes next? ', '').replace(', ___', '').split(', ');
        // AB pattern: answer should equal the first element
        expect(q.answer).toBe(parts[0]);
      }
    });
  });

  describe('P1-GEO-05: Create simple repeating patterns', () => {
    it('generates an AB pattern creation question', () => {
      const q = generateQuestion('P1-GEO-05', { questionFamilyId: 'QF_P1-GEO-05_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-05');
      expect(q.prompt).toContain('AB pattern');
      expect(q.choices).toContain(q.answer);
    });

    it('generates an ABB pattern creation question', () => {
      const q = generateQuestion('P1-GEO-05', { questionFamilyId: 'QF_P1-GEO-05_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('ABB pattern');
    });
  });

  describe('P1-GEO-06: Use position words', () => {
    it('generates an above/below question', () => {
      const q = generateQuestion('P1-GEO-06', { questionFamilyId: 'QF_P1-GEO-06_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-06');
      expect(q.prompt).toMatch(/above|below/);
      expect(q.choices).toContain(q.answer);
    });

    it('generates a left/right/between question', () => {
      const q = generateQuestion('P1-GEO-06', { questionFamilyId: 'QF_P1-GEO-06_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toMatch(/left|right|between/);
      expect(q.choices).toContain(q.answer);
    });
  });

  describe('P1-GEO-07: Match real objects to shapes', () => {
    it('generates a match-to-2D-shape question', () => {
      const q = generateQuestion('P1-GEO-07', { questionFamilyId: 'QF_P1-GEO-07_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-GEO-07');
      expect(q.prompt).toContain('looks most like which shape');
      expect(['circle', 'triangle', 'square', 'rectangle']).toContain(q.answer);
      expect(q.choices).toContain(q.answer);
    });

    it('generates a match-to-3D-object question', () => {
      const q = generateQuestion('P1-GEO-07', { questionFamilyId: 'QF_P1-GEO-07_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('most like which 3D object');
      expect(['cube', 'cuboid', 'sphere', 'cone', 'cylinder']).toContain(q.answer);
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-GEO-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-GEO-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-GEO-01', 'P1-GEO-02', 'P1-GEO-06'];
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
      const q = generateQuestion('P1-GEO-01');
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
