import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p1MoneyQuestionGenerator';
import { validateP1MoneySkillGraph, p1MoneySkillGraph } from './p1MoneySkillGraph';
import { validateP1MoneyQuestionFamilies, getQuestionFamiliesBySkill } from './p1MoneyQuestionFamilies';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag } from './p1MoneyMisconceptionMap';

describe('p1MoneySkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP1MoneySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 7 P1-MON skills', () => {
    expect(p1MoneySkillGraph.skills).toHaveLength(7);
    expect(p1MoneySkillGraph.domainId).toBe('p1-money');
  });

  it('has no unreachable skills', () => {
    const result = validateP1MoneySkillGraph();
    expect(result.summary.unreachableSkills).toHaveLength(0);
  });

  it('P1-MON-01 is the foundation skill', () => {
    const result = validateP1MoneySkillGraph();
    expect(result.summary.foundationSkills).toContain('P1-MON-01');
    expect(result.summary.foundationSkills).toHaveLength(1);
  });

  it('every skill has mastery and fluency targets', () => {
    for (const skill of p1MoneySkillGraph.skills) {
      expect(skill.mastery.minimumAccuracy).toBeGreaterThan(0);
      expect(skill.mastery.minimumQuestions).toBeGreaterThan(0);
      expect(skill.fluency.targetAccuracy).toBeGreaterThan(0);
      expect(skill.fluency.targetAverageSeconds).toBeGreaterThan(0);
    }
  });

  it('prerequisite chain is correct', () => {
    const skill02 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-02');
    expect(skill02.prerequisites).toContain('P1-MON-01');

    const skill03 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-03');
    expect(skill03.prerequisites).toContain('P1-MON-01');

    const skill04 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-04');
    expect(skill04.prerequisites).toContain('P1-MON-03');

    const skill05 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-05');
    expect(skill05.prerequisites).toContain('P1-MON-03');

    const skill06 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-06');
    expect(skill06.prerequisites).toContain('P1-MON-03');

    const skill07 = p1MoneySkillGraph.skills.find((s) => s.id === 'P1-MON-07');
    expect(skill07.prerequisites).toContain('P1-MON-04');
  });
});

describe('p1MoneyQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP1MoneyQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.orphanFamilies).toHaveLength(0);
    expect(result.duplicateIds).toHaveLength(0);
    expect(result.skillsMissingFamilies).toHaveLength(0);
  });

  it('has 14 total families', () => {
    const result = validateP1MoneyQuestionFamilies();
    expect(result.totalFamilies).toBe(14);
  });

  it('every skill has exactly two question families', () => {
    for (const skillId of p1MoneySkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      expect(families).toHaveLength(2);
    }
  });

  it('every family has fluency benchmarks', () => {
    for (const skillId of p1MoneySkillGraph.skillIds) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.fluencyBenchmarks).toBeDefined();
        expect(family.fluencyBenchmarks.gold).toBe(family.fluencyTargetSeconds);
        expect(family.fluencyBenchmarks.bronze).toBeGreaterThan(family.fluencyBenchmarks.gold);
      }
    }
  });

  it('addition and change families require working', () => {
    for (const skillId of ['P1-MON-05', 'P1-MON-06']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.workingRequired).toBe(true);
      }
    }
  });

  it('recognition families use choice answer type', () => {
    for (const skillId of ['P1-MON-01', 'P1-MON-02']) {
      const families = getQuestionFamiliesBySkill(skillId);
      for (const family of families) {
        expect(family.answerType).toBe('choice');
      }
    }
  });
});

describe('p1MoneyMisconceptionMap', () => {
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
    const m = getMisconception('coin_size_value_confusion');
    expect(m).not.toBeNull();
    expect(m.label).toBe('Thinks larger coin means larger value');
  });

  it('finds misconceptions for P1-MON-01', () => {
    const ms = getMisconceptionsForSkill('P1-MON-01');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('coin_size_value_confusion');
  });

  it('finds misconceptions for P1-MON-03', () => {
    const ms = getMisconceptionsForSkill('P1-MON-03');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('counts_coins_not_value');
  });

  it('finds misconceptions for P1-MON-06', () => {
    const ms = getMisconceptionsForSkill('P1-MON-06');
    expect(ms.length).toBeGreaterThanOrEqual(1);
    const tags = ms.map((m) => m.tag);
    expect(tags).toContain('change_adds_cost_and_paid');
  });

  it('getRemediationForTag returns structured remediation', () => {
    const r = getRemediationForTag('counts_coins_not_value');
    expect(r).not.toBeNull();
    expect(r.tag).toBe('counts_coins_not_value');
    expect(r.explanation).toBeTruthy();
    expect(r.visualScaffold).toBeTruthy();
    expect(r.recheckPattern).toBeTruthy();
    expect(r.parentNote).toBeTruthy();
  });

  it('getRemediationForTag returns null for unknown tag', () => {
    expect(getRemediationForTag('fake_tag')).toBeNull();
  });
});

describe('p1MoneyQuestionGenerator', () => {
  it('supports all 7 skill IDs', () => {
    expect(getSupportedSkillIds()).toHaveLength(7);
  });

  describe('P1-MON-01: Recognise Singapore coins and notes', () => {
    it('generates a coin recognition question', () => {
      const q = generateQuestion('P1-MON-01', { questionFamilyId: 'QF_P1-MON-01_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-01');
      expect(q.answerType).toBe('choice');
      expect(q.prompt).toContain('coin');
      expect(q.answer).toContain('coin');
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a note recognition question', () => {
      const q = generateQuestion('P1-MON-01', { questionFamilyId: 'QF_P1-MON-01_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('note');
      expect(q.answer).toContain('note');
      expect(q.diagramSpec).toBeDefined();
    });
  });

  describe('P1-MON-02: Match coins/notes to values', () => {
    it('generates a coin-to-value matching question', () => {
      const q = generateQuestion('P1-MON-02', { questionFamilyId: 'QF_P1-MON-02_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-02');
      expect(q.answerType).toBe('choice');
      expect(q.prompt).toContain('coin');
      expect(q.answer).toContain('¢');
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a note-to-value matching question', () => {
      const q = generateQuestion('P1-MON-02', { questionFamilyId: 'QF_P1-MON-02_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('note');
      expect(q.answer).toContain('$');
      expect(q.diagramSpec).toBeDefined();
    });
  });

  describe('P1-MON-03: Count simple money amounts', () => {
    it('generates a coins-only counting question', () => {
      const q = generateQuestion('P1-MON-03', { questionFamilyId: 'QF_P1-MON-03_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-03');
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThan(0);
      expect(q.prompt).toContain('Count');
      expect(q.diagramSpec).toBeDefined();
      expect(q.diagramSpec.type).toBe('picture_collections');
    });

    it('generates a mixed coins and notes counting question', () => {
      const q = generateQuestion('P1-MON-03', { questionFamilyId: 'QF_P1-MON-03_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('note');
      expect(q.answer).toBeGreaterThanOrEqual(100);
      expect(q.diagramSpec).toBeDefined();
    });
  });

  describe('P1-MON-04: Compare money amounts', () => {
    it('generates a two-coin-set comparison question', () => {
      const q = generateQuestion('P1-MON-04', { questionFamilyId: 'QF_P1-MON-04_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-04');
      expect(q.answerType).toBe('choice');
      expect(['Set A', 'Set B']).toContain(q.answer);
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a coin-set vs note comparison question', () => {
      const q = generateQuestion('P1-MON-04', { questionFamilyId: 'QF_P1-MON-04_002' });
      expect(q).not.toBeNull();
      expect(['The note', 'The coins']).toContain(q.answer);
      expect(q.diagramSpec).toBeDefined();
    });
  });

  describe('P1-MON-05: Add simple amounts', () => {
    it('generates a cents-only addition question', () => {
      const q = generateQuestion('P1-MON-05', { questionFamilyId: 'QF_P1-MON-05_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-05');
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThan(0);
      expect(q.prompt).toContain('¢');
      expect(q.prompt).toContain('altogether');
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a dollars-and-cents addition question', () => {
      const q = generateQuestion('P1-MON-05', { questionFamilyId: 'QF_P1-MON-05_002' });
      expect(q).not.toBeNull();
      expect(q.prompt).toContain('$');
      expect(q.prompt).toContain('altogether');
      expect(q.answer).toBeGreaterThan(0);
    });

    it('uses realistic item names', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P1-MON-05');
        const hasItem = ['pencil', 'eraser', 'ruler', 'notebook', 'sticker'].some((item) => q.prompt.includes(item));
        expect(hasItem).toBe(true);
      }
    });
  });

  describe('P1-MON-06: Find simple change', () => {
    it('generates a change-from-$1 question', () => {
      const q = generateQuestion('P1-MON-06', { questionFamilyId: 'QF_P1-MON-06_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-06');
      expect(q.answerType).toBe('number');
      expect(q.answer).toBeGreaterThan(0);
      expect(q.answer).toBeLessThan(100);
      expect(q.prompt).toContain('$1');
      expect(q.prompt).toContain('change');
      expect(q.diagramSpec).toBeDefined();
    });

    it('generates a change-from-$5-or-$10 question', () => {
      const q = generateQuestion('P1-MON-06', { questionFamilyId: 'QF_P1-MON-06_002' });
      expect(q).not.toBeNull();
      expect(q.answer).toBeGreaterThan(0);
      expect(q.prompt).toContain('change');
      const hasLargeNote = q.prompt.includes('$5') || q.prompt.includes('$10');
      expect(hasLargeNote).toBe(true);
    });

    it('change is always positive', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-MON-06');
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  describe('P1-MON-07: Choose enough money', () => {
    it('generates an enough-for-one-item question', () => {
      const q = generateQuestion('P1-MON-07', { questionFamilyId: 'QF_P1-MON-07_001' });
      expect(q).not.toBeNull();
      expect(q.skillId).toBe('P1-MON-07');
      expect(q.answerType).toBe('choice');
      expect(['Yes', 'No']).toContain(q.answer);
      expect(q.prompt).toContain('enough');
    });

    it('generates an enough-for-two-items question', () => {
      const q = generateQuestion('P1-MON-07', { questionFamilyId: 'QF_P1-MON-07_002' });
      expect(q).not.toBeNull();
      expect(['Yes', 'No']).toContain(q.answer);
      expect(q.prompt).toContain('both');
    });

    it('answer matches the comparison logic', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P1-MON-07', { questionFamilyId: 'QF_P1-MON-07_001' });
        const nums = q.prompt.match(/\d+/g).map(Number);
        const price = nums[0];
        const money = nums[1];
        expect(q.answer).toBe(money >= price ? 'Yes' : 'No');
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P1-MON-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P1-MON-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across multiple skills', () => {
      const skills = ['P1-MON-01', 'P1-MON-03', 'P1-MON-06'];
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
      const q = generateQuestion('P1-MON-01');
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
