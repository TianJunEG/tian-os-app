import { describe, it, expect } from 'vitest';
import {
  fractionQuestionFamilies,
  getQuestionFamiliesBySkill,
} from '../shared/mathpath/fractions/fractionQuestionFamilies.js';
import {
  generateFractionQuestion,
  checkFractionAnswer,
} from '../shared/mathpath/fractions/fractionQuestionGenerator.js';
import {
  classifyFractionMistake,
  getRemediationForMistake,
} from '../shared/mathpath/fractions/fractionMistakeToMasteryEngine.js';
import {
  getFractionsMvpDepthWorksheetPlan,
  getSec1G1FractionsWorksheetSkillPlan,
} from './worksheetGen.js';
import { getVisibleSkillsForStudentLevel } from '../shared/mathpath/curriculum/curriculumMappingSelectors.js';

describe('fractions depth pass: family and misconception coverage', () => {
  it('keeps all F001-F026 accessible with at least one family each', () => {
    for (let i = 1; i <= 26; i += 1) {
      const id = `F${String(i).padStart(3, '0')}`;
      const families = getQuestionFamiliesBySkill(id);
      expect(families.length).toBeGreaterThan(0);
    }
  });

  it('deepens shallow priority skills with richer family depth', () => {
    // getQuestionFamiliesBySkill returns only ACTIVE (non-quarantined) families. The content
    // integrity quarantine (FRACTIONS_QUESTION_SKILL_INTEGRITY_AUDIT) removed mis-mapped
    // comparison families from F011 and F012, so their student-facing depth is lower than the
    // raw blueprint. Every priority skill must still expose enough correctly-mapped depth
    // (at least the validator minimum of 3 families) with multiple misconception signals.
    const targets = ['F001', 'F002', 'F011', 'F012', 'F015'];
    for (const id of targets) {
      const families = getQuestionFamiliesBySkill(id);
      expect(families.length).toBeGreaterThanOrEqual(3);
      const tags = [...new Set(families.flatMap((f) => f.misconceptionTags || []))];
      expect(tags.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('fractions depth pass: targeted generator variants', () => {
  it('generates and checks F023 set-based variant', () => {
    const q = generateFractionQuestion({
      skillId: 'F023',
      questionFamilyId: 'QF_F023_006',
      difficulty: 3,
      mode: 'practice',
      variant: 1,
    });
    const checked = checkFractionAnswer({
      studentAnswer: q.answer.display,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers,
    });
    expect(checked.correct).toBe(true);
  });

  it('generates and checks F018 simplify-check variant', () => {
    const q = generateFractionQuestion({
      skillId: 'F018',
      questionFamilyId: 'QF_F018_006',
      difficulty: 4,
      mode: 'practice',
      variant: 2,
    });
    const checked = checkFractionAnswer({
      studentAnswer: q.answer.display,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers,
    });
    expect(checked.correct).toBe(true);
  });
});

describe('fractions depth pass: mistake tagging and remediation routing', () => {
  it('routes denominator-addition error in F015 to common-denominator remediation', () => {
    const result = classifyFractionMistake({
      skillId: 'F015',
      questionFamilyId: 'QF_F015_004',
      studentAnswer: '5/8',
      correctAnswer: '5/4',
      promptOperands: ['2/4', '3/4'],
      confidence: 'confident',
    });
    expect(result.suspectedMistakeCode).toBe('M007');
    const remediation = getRemediationForMistake(result.suspectedMistakeCode);
    expect(remediation.remediationSkillIds.length).toBeGreaterThan(0);
  });

  it('routes unlike subtraction denominator error in F018', () => {
    const result = classifyFractionMistake({
      skillId: 'F018',
      questionFamilyId: 'QF_F018_001',
      studentAnswer: '2/5',
      correctAnswer: '5/6',
      promptOperands: ['1/2', '1/3'],
      confidence: 'unsure',
    });
    expect(['M001', 'M007', 'M010']).toContain(result.suspectedMistakeCode);
  });
});

describe('fractions depth pass: worksheet and selector readiness', () => {
  it('includes priority skills in worksheet plans', () => {
    const plan = getFractionsMvpDepthWorksheetPlan();
    expect(plan.foundationalShallow).toContain('F001');
    expect(plan.foundationalShallow).toContain('F015');
    expect(plan.highRiskMvp).toEqual(expect.arrayContaining(['F018', 'F023']));
  });

  it('keeps sec1 g1 mapped skills visible in selector', () => {
    const sec = getVisibleSkillsForStudentLevel({
      country: 'SG',
      curriculum: 'MOE_SECONDARY_G1_MATH_2021',
      domain: 'fractions',
      studentLevel: 'S1',
    }).map((row) => row.frameworkSkillId);
    expect(sec).toEqual(expect.arrayContaining(['F010', 'F013', 'F014', 'F017', 'F018', 'F021', 'F022', 'F023', 'F025', 'F026']));
  });

  it('sanity-checks family list still includes all skill IDs', () => {
    const skills = new Set(fractionQuestionFamilies.map((f) => f.skillId));
    for (let i = 1; i <= 26; i += 1) {
      expect(skills.has(`F${String(i).padStart(3, '0')}`)).toBe(true);
    }
  });

  it('keeps sec1 worksheet plan support for F018/F023', () => {
    const secPlan = getSec1G1FractionsWorksheetSkillPlan();
    expect(secPlan.arithmeticFractions).toContain('F018');
    expect(secPlan.ratioFractionsDecimals).toContain('F023');
  });
});

