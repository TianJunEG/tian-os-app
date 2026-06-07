import { describe, expect, it } from 'vitest';
import {
  auditQuestionSkillIntegrity,
  buildCanonicalReferenceTable,
  buildFractionsSkillIntegrityReport,
  validateQuestionSkillMapping,
} from '../services/mathpath/questionSkillIntegrityService.js';
import { listCanonicalFractionSkills } from '../frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js';
import { fractionQuestionFamilies } from '../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';

const canonicalSkills = listCanonicalFractionSkills();

describe('Fractions question-to-skill integrity service', () => {
  it('loads F001-F026 canonical definitions', () => {
    const table = buildCanonicalReferenceTable(canonicalSkills);
    expect(table).toHaveLength(26);
    expect(table[0]).toMatchObject({
      skillId: 'F001',
      expectedQuestionTypes: expect.arrayContaining(['visual_identification']),
    });
    expect(table.find((row) => row.skillId === 'F026')).toMatchObject({
      expectedQuestionTypes: expect.arrayContaining(['mastery_challenge']),
    });
  });

  it('validates a correctly mapped same-denominator addition question', () => {
    const result = validateQuestionSkillMapping({
      questionId: 'q_add_like',
      skillId: 'F016',
      prompt: 'Add fractions with the same denominator: 2/7 + 3/7.',
      misconceptionTags: ['adds_denominators_directly'],
    });
    expect(result.classification).toBe('Correct Mapping');
    expect(result.risk).toBe('Low');
  });

  it('detects same-numerator comparison mapped to simplification as drift', () => {
    const result = validateQuestionSkillMapping({
      questionId: 'q_bad_same_numerator',
      skillId: 'F012',
      prompt: 'Compare same numerator fractions through part-size reasoning.',
      misconceptionTags: ['compares_denominators_only'],
    });
    expect(result.classification).toMatch(/Questionable|Incorrect/);
    expect(result.issues.map((issue) => issue.code)).toContain('strong_cross_skill_signal');
    expect(result.inferredSkillIds).toContain('F008');
  });

  it('detects out-of-scope signed fraction content', () => {
    const result = validateQuestionSkillMapping({
      questionId: 'q_signed',
      skillId: 'F013',
      prompt: 'Compare signed fractions around zero, including -1/3 and 1/4.',
      misconceptionTags: ['whole_number_thinking'],
    });
    expect(result.risk).toBe('High');
    expect(result.issues.map((issue) => issue.code)).toContain('out_of_scope');
  });

  it('validates diagnostic question mapping', () => {
    const result = validateQuestionSkillMapping({
      questionId: 'diag_f018_1',
      sourceType: 'diagnostic_item',
      skillCode: 'F018',
      questionText: 'Add unlike fractions by finding a common denominator first: 1/2 + 1/3.',
      metadata: { diagnosticPurpose: 'main_skill_probe', misconceptionTags: ['common_denominator_missing'] },
    });
    expect(result.classification).toBe('Correct Mapping');
  });

  it('validates recovery pack and recheck question mapping', () => {
    const recovery = validateQuestionSkillMapping({
      questionId: 'recovery_f020_1',
      sourceType: 'recovery_pack_question',
      skillId: 'F020',
      stem: 'Find the fraction of quantity: 3/4 of 24 stickers.',
      misconceptionTags: ['fraction_of_quantity_whole_error'],
    });
    const recheck = validateQuestionSkillMapping({
      questionId: 'recheck_f024_1',
      sourceType: 'recheck_question',
      skillId: 'F024',
      stem: 'Solve this two-step fraction problem and show the sequence clearly.',
      misconceptionTags: ['skipped_step'],
    });
    expect(recovery.risk).toBe('Low');
    expect(recheck.risk).toBe('Low');
  });

  it('validates worksheet question mapping and flags weak misconception alignment', () => {
    const result = validateQuestionSkillMapping({
      questionId: 'worksheet_f019_1',
      sourceType: 'worksheet_question',
      skillId: 'F019',
      stem: 'Subtract unlike fractions by converting to a common denominator: 5/6 - 1/4.',
      misconceptionTags: [],
    });
    expect(result.issues.map((issue) => issue.code)).toContain('misconception_alignment_weak');
  });

  it('audits current static question families and reports drift warnings', () => {
    const report = buildFractionsSkillIntegrityReport({
      canonicalSkills,
      questionFamilies: fractionQuestionFamilies,
    });
    expect(report.auditedQuestions).toBeGreaterThanOrEqual(80);
    expect(report.canonicalReference).toHaveLength(26);
    expect(report.byClassification['Incorrect Mapping']).toBeGreaterThan(0);
    expect(report.pilotBlockers.some((row) => row.questionId === 'QF_F025_005')).toBe(true);
  });

  it('builds a mixed-source integrity audit', () => {
    const report = auditQuestionSkillIntegrity({
      canonicalSkills,
      questions: [
        {
          questionId: 'diag_ok',
          sourceType: 'diagnostic_item',
          skillId: 'F010',
          questionText: 'Recognise equivalent fractions that show the same value.',
          misconceptionTags: ['equivalence_scale_error'],
        },
        {
          questionId: 'worksheet_bad',
          sourceType: 'worksheet_question',
          skillId: 'F025',
          questionText: 'Convert between percentage, fraction and decimal forms.',
          misconceptionTags: ['calculation_error'],
        },
      ],
    });
    expect(report.auditedQuestions).toBe(2);
    expect(report.byClassification['Incorrect Mapping']).toBe(1);
    expect(report.pilotBlockers[0]).toMatchObject({ questionId: 'worksheet_bad' });
  });
});
