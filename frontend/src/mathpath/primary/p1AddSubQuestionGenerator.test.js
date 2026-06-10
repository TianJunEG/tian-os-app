import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1AddSubQuestionGenerator';
import { validateP1AddSubSkillGraph, p1AddSubSkillGraph } from './p1AddSubSkillGraph';
import { validateP1AddSubQuestionFamilies, getQuestionFamiliesBySkill } from './p1AddSubQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag } from './p1AddSubMisconceptionMap';

describe('p1AddSubSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1AddSubSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 10 P1-ADD skills', () => {
    expect(p1AddSubSkillGraph.skills).toHaveLength(10);
    expect(p1AddSubSkillGraph.domainId).toBe('p1-addsub');
  });

  it('has no unreachable skills', () => {
    const result = validateP1AddSubSkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-ADD-01 is the foundation skill', () => {
    const result = validateP1AddSubSkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-ADD-01');
    expect(result.summary.foundationSkills).toHaveLength(1);
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1AddSubSkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });

  it('prerequisite chain is correct', () => {
    const skill02 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-02');
    expect(skill02.prerequisites).toContain('P1-ADD-01');

    const skill03 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-03');
    expect(skill03.prerequisites).toContain('P1-ADD-01');

    const skill04 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-04');
    expect(skill04.prerequisites).toContain('P1-ADD-02');

    const skill05 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-05');
    expect(skill05.prerequisites).toContain('P1-ADD-03');

    const skill06 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-06');
    expect(skill06.prerequisites).toContain('P1-ADD-04');

    const skill07 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-07');
    expect(skill07.prerequisites).toContain('P1-ADD-05');

    const skill08 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-08');
    expect(skill08.prerequisites).toContain('P1-ADD-06');

    const skill09 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-09');
    expect(skill09.prerequisites).toContain('P1-ADD-05');
    expect(skill09.prerequisites).toContain('P1-ADD-06');

    const skill10 = p1AddSubSkillGraph.skills.find((s) => s.id === 'P1-ADD-10');
    expect(skill10.prerequisites).toContain('P1-ADD-03');
    expect(skill10.prerequisites).toContain('P1-ADD-04');
  });
});

describe('p1AddSubQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1AddSubQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 20 total families', () => {
    const result = validateP1AddSubQuestionFamilies();
    expect(result.totalFamilies).toBe(20);
  });

  it('every skill has exactly two question families', () => {
    for (const skillId of p1AddSubSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families).toHaveLength(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1AddSubSkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('word problem and column families require working', () => {
    for (const skillId of ['P1-ADD-09']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.workingRequired).toBe(true);
      }
    }
  });

  it('fluency drill families are mental math eligible', () => {
    for (const skillId of ['P1-ADD-03', 'P1-ADD-04']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.mentalMathEligible).toBe(true);
      }
    }
  });
});

describe('p1AddSubMisconceptionMap', () => {
  it('has all 7 misconception tags', () => {
    const all = getAllMisconceptions();
    expect(all.length).toBe(7);
  });

  it('every misconception has remediation data', () => {
    for (const m of getAllMisconceptions()) {
      expect(m.remediationExplanation).toBeTruthy();
      expect(m.recheckPattern).toBeTruthy();
      expect(m.parentNote).toBeTruthy();
    }
  });

  it('looks up misconception by tag', () => {
    const m = getMisconception('counts_from_one');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Counts from 1 instead of counting on');
  });

  it('finds misconceptions for P1-ADD-01', () => {
    const ms = getMisconceptionsForSkill('P1-ADD-01');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('counts_from_one');
  });

  it('finds misconceptions for P1-ADD-09', () => {
    const ms = getMisconceptionsForSkill('P1-ADD-09');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('wrong_operation_word_problem');
  });

  it('finds misconceptions for P1-ADD-10', () => {
    const ms = getMisconceptionsForSkill('P1-ADD-10');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('missing_number_adds_all');
  });

  it('getRemediationForTag returns structured remediation', () => {
    const r = getRemediationForTag('counts_from_one');
    expect(r).not.toBeNull();
    expect(r.tag).toBe('counts_from_one');
    expect(r.explanation).toBeTruthy();
    expect(r.visualScaffold).toBeTruthy();
    expect(r.recheckPattern).toBeTruthy();
    expect(r.parentNote).toBeTruthy();
  });

  it('getRemediationForTag returns null for unknown tag', () => {
    expect(getRemediationForTag('fake_tag')).toBeNull();
  });
});

describe('p1AddSubQuestionGenerator', () => {
  it('supports all 10 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(10);
  });

  describe('P1-ADD-01: Addition Within 10', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-01');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    it('generates picture-based addition', () => {
      const q = generateQuestion('P1-ADD-01', { questionFamilyId: 'QF_P1-ADD-01_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('altogether');
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates equation fill-in', () => {
      const q = generateQuestion('P1-ADD-01', { questionFamilyId: 'QF_P1-ADD-01_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('+');
    });
  });

  describe('P1-ADD-02: Subtraction Within 10', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-02');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(9);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('picture_collections');
      }
    });

    it('generates take-away with pictures', () => {
      const q = generateQuestion('P1-ADD-02', { questionFamilyId: 'QF_P1-ADD-02_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('taken away');
    });

    it('generates equation fill-in', () => {
      const q = generateQuestion('P1-ADD-02', { questionFamilyId: 'QF_P1-ADD-02_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('-');
    });
  });

  describe('P1-ADD-03: Addition Facts to 10 (fluency)', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-03');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-03');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(10);
        expect(q.diagramSpec).toBeUndefined();
      }
    });
  });

  describe('P1-ADD-04: Subtraction Facts to 10 (fluency)', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-04');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-04');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(10);
        expect(q.diagramSpec).toBeUndefined();
      }
    });
  });

  describe('P1-ADD-05: Addition Within 20 (no regrouping)', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-05');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-05');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(11);
        expect(q.answer).toBeLessThanOrEqual(20);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates teen and ones variant', () => {
      const q = generateQuestion('P1-ADD-05', { questionFamilyId: 'QF_P1-ADD-05_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('+');
      expect(q.diagramSpec.type).toBe('number_line');
    });
  });

  describe('P1-ADD-06: Subtraction Within 20 (no regrouping)', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-06');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-06');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(10);
        expect(q.answer).toBeLessThanOrEqual(19);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates subtract from teen variant', () => {
      const q = generateQuestion('P1-ADD-06', { questionFamilyId: 'QF_P1-ADD-06_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('-');
      expect(q.diagramSpec.type).toBe('number_line');
    });
  });

  describe('P1-ADD-07: Addition Within 40', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-07');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-07');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(16);
        expect(q.answer).toBeLessThanOrEqual(40);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('table');
      }
    });
  });

  describe('P1-ADD-08: Subtraction Within 40', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-08');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-08');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(40);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('table');
      }
    });
  });

  describe('P1-ADD-09: Word Problems (within 20)', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-09');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-09');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(20);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('comparison_model');
      }
    });

    it('generates a join word problem', () => {
      const q = generateQuestion('P1-ADD-09', { questionFamilyId: 'QF_P1-ADD-09_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('more');
      expect(q.prompt).toContain('now');
    });

    it('generates a separate word problem', () => {
      const q = generateQuestion('P1-ADD-09', { questionFamilyId: 'QF_P1-ADD-09_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('gives away');
      expect(q.prompt).toContain('left');
    });

    it('uses known names', () => {
      const allNames = ['Tom', 'Ravi', 'Ali', 'Eric', 'Kumar', 'Peter', 'Amin', 'Bala', 'Siti', 'Lynn', 'Jane', 'Alice', 'Susan', 'Mei', 'Priya', 'Mrs Lee'];
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-ADD-09');
        const hasName = allNames.some((name) => q.prompt.includes(name));
        expect(hasName).toBe(true);
      }
    });
  });

  describe('P1-ADD-10: Missing Number in Equation', () => {
    it('generates valid questions', () => {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion('P1-ADD-10');
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P1-ADD-10');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
        expect(q.diagramSpec).toBeDefined();
      }
    });

    it('generates a missing addend question', () => {
      const q = generateQuestion('P1-ADD-10', { questionFamilyId: 'QF_P1-ADD-10_001' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('+');
      expect(q.prompt).toContain('?');
    });

    it('generates a missing subtrahend question', () => {
      const q = generateQuestion('P1-ADD-10', { questionFamilyId: 'QF_P1-ADD-10_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('-');
      expect(q.prompt).toContain('?');
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-ADD-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-ADD-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-ADD-01', 'P1-ADD-05', 'P1-ADD-09'];
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
      const q = generateQuestion('P1-ADD-01');
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

  it('no question uses visualHint (uses diagramSpec instead)', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.visualHint).toBeUndefined();
      }
    }
  });
});
