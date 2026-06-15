import { describe, it, expect } from 'vitest';
import {
  decimalsSkillGraph,
  getSkill,
  getPrerequisites,
  getDependents,
  getRemediationTargets,
  getSkillPath,
  getDependencyMap,
  validateDecimalsSkillGraph,
} from '../shared/mathpath/decimals/decimalsSkillGraph.js';
import {
  decimalsQuestionFamilies,
  getQuestionFamily,
  getQuestionFamiliesBySkill,
  getAllQuestionFamilies,
  validateDecimalsQuestionFamilies,
} from '../shared/mathpath/decimals/decimalsQuestionFamilies.js';
import {
  generateDecimalQuestion,
  generateDecimalQuestionSet,
  checkDecimalAnswer,
  isGeneratableDecimalSkill,
} from '../shared/mathpath/decimals/decimalsQuestionGenerator.js';

describe('Decimals skill graph', () => {
  it('defines exactly 14 skills D001–D014 and validates clean', () => {
    expect(decimalsSkillGraph.domainId).toBe('decimals');
    expect(decimalsSkillGraph.skillIds).toHaveLength(14);
    const result = validateDecimalsSkillGraph();
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('roots at D001 as the only foundation skill', () => {
    const { summary } = validateDecimalsSkillGraph();
    expect(summary.foundationSkills).toEqual(['D001']);
    expect(getPrerequisites('D001')).toEqual([]);
  });

  it('resolves prerequisites, dependents and remediation targets', () => {
    expect(getSkill('D004').name).toBe('Ordering Decimals');
    expect(getPrerequisites('D004')).toEqual(['D003']);
    expect(getDependents('D003')).toContain('D004');
    expect(getRemediationTargets('D008')).toEqual(['D006']);
    expect(getSkill('ZZZ')).toBeNull();
  });

  it('builds a prerequisite path from the foundation to a deep skill', () => {
    const path = getSkillPath('D011');
    expect(path[0]).toBe('D001');
    expect(path[path.length - 1]).toBe('D011');
  });

  it('keeps cross-domain prerequisites as metadata without breaking the graph', () => {
    // D001 has a cross-domain prereq (whole-number place value) but no intra-domain one
    expect(getSkill('D001').crossDomainPrerequisites).toContain('ns.pv.4-5-digit');
    expect(getPrerequisites('D001')).toEqual([]);
  });

  it('exposes a dependency map covering every skill', () => {
    const map = getDependencyMap();
    expect(Object.keys(map)).toHaveLength(14);
    expect(map.D002.prerequisites).toEqual(['D001']);
  });
});

describe('Decimals question families', () => {
  it('validates and cross-references the skill graph cleanly', () => {
    const result = validateDecimalsQuestionFamilies();
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('returns families per skill and resolves a family by id', () => {
    const families = getQuestionFamiliesBySkill('D001');
    expect(families.length).toBeGreaterThanOrEqual(2);
    expect(getQuestionFamily('QF_D001_001').skillId).toBe('D001');
    expect(getQuestionFamily('NOPE')).toBeNull();
  });

  it('every declared family maps to a known generator kind', () => {
    const knownKinds = new Set([
      'decimalPlaceValue', 'decimalNumberLine', 'decimalCompare', 'decimalOrder',
      'decimalRound', 'decimalAddSub', 'decimalScaleByTen', 'decimalMultWhole',
      'decimalMultDecimal', 'decimalDivWhole', 'decimalDivDecimal',
      'decimalToFraction', 'fractionToDecimal', 'decimalMeasureConvert',
    ]);
    for (const family of getAllQuestionFamilies()) {
      expect(knownKinds.has(family.generatorKind)).toBe(true);
    }
  });
});

describe('Decimals question generator', () => {
  it('generates a valid question for every skill', () => {
    for (const skillId of decimalsSkillGraph.skillIds) {
      expect(isGeneratableDecimalSkill(skillId)).toBe(true);
      const q = generateDecimalQuestion({ skillId });
      expect(q.skillId).toBe(skillId);
      expect(typeof q.prompt).toBe('string');
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.answer.display).toBeTruthy();
      expect(Array.isArray(q.solutionSteps)).toBe(true);
      expect(q.solutionSteps.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same (family, mode, variant)', () => {
    const a = generateDecimalQuestion({ questionFamilyId: 'QF_D006_001', variant: 3 });
    const b = generateDecimalQuestion({ questionFamilyId: 'QF_D006_001', variant: 3 });
    expect(a).toEqual(b);
  });

  it('varies the question when the variant changes', () => {
    const prompts = new Set();
    for (let v = 0; v < 8; v++) {
      prompts.add(generateDecimalQuestion({ questionFamilyId: 'QF_D006_001', variant: v }).prompt);
    }
    expect(prompts.size).toBeGreaterThan(1);
  });

  it('produces exact decimal arithmetic with no float noise (add/sub)', () => {
    for (let v = 0; v < 50; v++) {
      const q = generateDecimalQuestion({ questionFamilyId: 'QF_D006_001', variant: v });
      // answer.display must be a clean decimal string, never 0.30000000000000004
      expect(q.answer.display).not.toMatch(/\d{6,}/);
      expect(checkDecimalAnswer({ question: q, studentResponse: q.answer.display }).correct).toBe(true);
    }
  });

  it('multiplies decimals with the correct place count', () => {
    const q = generateDecimalQuestion({ questionFamilyId: 'QF_D009_001', variant: 1 });
    const check = checkDecimalAnswer({ question: q, studentResponse: q.answer.value });
    expect(check.correct).toBe(true);
  });

  it('converts decimals to simplified fractions', () => {
    for (let v = 0; v < 20; v++) {
      const q = generateDecimalQuestion({ questionFamilyId: 'QF_D012_001', variant: v });
      expect(q.answer.display).toMatch(/^\d+\/\d+$/);
      // denominator should be in lowest terms (no common factor with numerator)
      const [num, den] = q.answer.display.split('/').map(Number);
      const g = (a, b) => (b ? g(b, a % b) : a);
      expect(g(num, den)).toBe(1);
    }
  });

  it('generates a question set spread across a skill\'s families', () => {
    const set = generateDecimalQuestionSet({ skillId: 'D007', count: 6 });
    expect(set).toHaveLength(6);
    const families = new Set(set.map((q) => q.questionFamilyId));
    expect(families.size).toBeGreaterThan(1);
  });

  it('checks answers with numeric tolerance and string forms', () => {
    const q = generateDecimalQuestion({ questionFamilyId: 'QF_D005_001', variant: 2 });
    expect(checkDecimalAnswer({ question: q, studentResponse: q.answer.value }).correct).toBe(true);
    expect(checkDecimalAnswer({ question: q, studentResponse: { answer: q.answer.display } }).correct).toBe(true);
    const wrong = checkDecimalAnswer({ question: q, studentResponse: '999.99' });
    expect(wrong.correct).toBe(false);
    expect(wrong.misconceptionTag).toBeTruthy();
  });

  it('rejects unknown skills and families', () => {
    expect(isGeneratableDecimalSkill('ZZZ')).toBe(false);
    expect(() => generateDecimalQuestion({})).toThrow();
    expect(() => generateDecimalQuestion({ skillId: 'ZZZ' })).toThrow();
  });
});
