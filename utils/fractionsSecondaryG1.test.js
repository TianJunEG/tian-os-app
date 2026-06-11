import { describe, it, expect } from 'vitest';
import {
  fractionCurriculumMappings,
  getVisibleSkillsForStudentLevel,
  getSkillCurriculumMapping,
  normalizeCurriculum,
} from '../shared/mathpath/curriculum/index.js';
import {
  generateFractionQuestion,
  checkFractionAnswer,
} from '../shared/mathpath/fractions/fractionQuestionGenerator.js';
import { getSec1G1FractionsWorksheetSkillPlan } from './worksheetGen.js';

describe('SG Secondary 1 G1 fractions curriculum mapping', () => {
  it('resolves SG secondary curriculum from S1 level', () => {
    expect(normalizeCurriculum('', 'S1')).toBe('MOE_SECONDARY_G1_MATH_2021');
  });

  it('maps N1.3 / N2.3 / N3.1 / N5.2 syllabus references', () => {
    const rows = fractionCurriculumMappings.filter(
      (row) => row.country === 'SG' && row.curriculum === 'MOE_SECONDARY_G1_MATH_2021'
    );
    const refs = new Set(rows.map((row) => row.syllabusRef));
    expect(refs.has('N1.3')).toBe(true);
    expect(refs.has('N2.3')).toBe(true);
    expect(refs.has('N3.1')).toBe(true);
    expect(refs.has('N5.2')).toBe(true);
  });

  it('shows Sec 1 G1 visible skills through selector path', () => {
    const rows = getVisibleSkillsForStudentLevel({
      country: 'SG',
      curriculum: 'MOE_SECONDARY_G1_MATH_2021',
      domain: 'fractions',
      studentLevel: 'S1',
    });
    const ids = new Set(rows.map((row) => row.frameworkSkillId));
    expect(ids.has('F017')).toBe(true);
    expect(ids.has('F018')).toBe(true);
    expect(ids.has('F023')).toBe(true);
    expect(ids.has('F025')).toBe(true);
    expect(ids.has('F026')).toBe(true);
  });

  it('keeps primary mapping intact for F001-F026', () => {
    const primaryRows = fractionCurriculumMappings.filter(
      (row) => row.country === 'SG' && row.curriculum === 'MOE_PRIMARY_MATH_2021'
    );
    expect(primaryRows.length).toBe(26);
    const f010 = getSkillCurriculumMapping('F010', { country: 'SG', curriculum: 'MOE_PRIMARY_MATH_2021' });
    expect(f010?.phase).toBe('Primary');
  });
});

describe('SG Secondary 1 G1 fraction question variants', () => {
  it('supports signed fraction addition variant', () => {
    const q = generateFractionQuestion({
      skillId: 'F017',
      questionFamilyId: 'QF_F017_004',
      mode: 'practice',
      difficulty: 4,
      variant: 1,
    });
    const check = checkFractionAnswer({
      studentAnswer: q.answer.display,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers,
    });
    expect(check.correct).toBe(true);
  });

  it('supports percentage conversion variant', () => {
    const q = generateFractionQuestion({
      skillId: 'F025',
      questionFamilyId: 'QF_F025_005',
      mode: 'practice',
      difficulty: 4,
      variant: 2,
    });
    const check = checkFractionAnswer({
      studentAnswer: q.answer.display,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers,
    });
    expect(check.correct).toBe(true);
  });
});

describe('SG Secondary 1 G1 worksheet support', () => {
  it('returns worksheet plan buckets for sec1 g1 fractions', () => {
    const plan = getSec1G1FractionsWorksheetSkillPlan();
    expect(plan.allSkillIds).toContain('F023');
    expect(plan.percentFractionDecimal).toContain('F025');
    expect(plan.algebraicFractionNotation).toContain('F026');
  });
});

