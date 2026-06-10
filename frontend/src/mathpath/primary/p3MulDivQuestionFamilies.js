import { p3MulDivSkillGraph } from './p3MulDivSkillGraph.js';

const SKILL_IDS = new Set(p3MulDivSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 20,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 90,
    masteryQuestionCount: config.masteryQuestionCount ?? 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? false,
    answerType: config.answerType ?? 'numeric',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P3-MD-01': [
    {
      name: 'Table Fact (a x b)',
      description: 'Recall a multiplication fact from the 6, 7, 8, or 9 times table.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['table_fact_confusion', 'counts_instead_of_recall'],
    },
    {
      name: 'Table Fact (b x a — commutative)',
      description: 'Recall the same fact in reversed order (e.g. 8x7 instead of 7x8).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['table_fact_confusion'],
    },
    {
      name: 'Missing Factor',
      description: 'Find the missing factor: ? x 8 = 56.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['table_fact_confusion'],
    },
  ],
  'P3-MD-02': [
    {
      name: 'Exact Division (tables 6-9)',
      description: 'Divide a product from the 6-9 tables by its factor.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['division_as_subtraction', 'table_fact_confusion'],
    },
    {
      name: 'Division as Missing Factor',
      description: 'Frame division as finding the missing factor: 54 / 6 = ? means ? x 6 = 54.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['division_as_subtraction'],
    },
    {
      name: 'Related Multiplication and Division',
      description: 'Given a multiplication fact, write the two related division facts.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['table_fact_confusion'],
    },
  ],
  'P3-MD-03': [
    {
      name: 'Find the Remainder (small divisor)',
      description: 'Divide with remainder using divisors 3-5.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['remainder_equals_quotient', 'remainder_larger_than_divisor'],
    },
    {
      name: 'Find the Remainder (larger divisor)',
      description: 'Divide with remainder using divisors 6-9.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['remainder_equals_quotient', 'remainder_larger_than_divisor'],
    },
    {
      name: 'Quotient and Remainder',
      description: 'State both the quotient and the remainder.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      misconceptionTags: ['remainder_equals_quotient'],
    },
  ],
  'P3-MD-04': [
    {
      name: 'Multiply 2-digit by 1-digit (no carry)',
      description: 'Multiply a 2-digit number by a 1-digit number with no carrying.',
      difficulty: 1,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['multiplies_digit_by_digit'],
    },
    {
      name: 'Multiply 2-digit by 1-digit (with carry)',
      description: 'Multiply a 2-digit number by a 1-digit number requiring carries.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_carry_in_multiplication'],
    },
    {
      name: 'Multiply 3-digit by 1-digit',
      description: 'Multiply a 3-digit number by a 1-digit number.',
      difficulty: 3,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_carry_in_multiplication', 'multiplies_digit_by_digit'],
    },
  ],
  'P3-MD-05': [
    {
      name: 'Divide 2-digit by 1-digit (exact)',
      description: 'Divide a 2-digit number exactly by a 1-digit number.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_bring_down'],
    },
    {
      name: 'Divide 3-digit by 1-digit (exact)',
      description: 'Divide a 3-digit number exactly by a 1-digit number.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['long_div_place_value_skip', 'forgets_bring_down'],
    },
    {
      name: 'Divide 3-digit by 1-digit (quotient has zero)',
      description: 'Divide a 3-digit number where the quotient contains a zero (e.g. 612/6=102).',
      difficulty: 3,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['long_div_place_value_skip'],
    },
  ],
};

export const p3MulDivQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3MulDivQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3MulDivQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3MulDivQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3MulDivSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3MulDivQuestionFamilies() {
  const ids = p3MulDivQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3MulDivQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3MulDivQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-muldiv',
  version: '1.0.0',
  totalSkills: p3MulDivSkillGraph.skillIds.length,
  totalQuestionFamilies: p3MulDivQuestionFamilies.length,
  families: p3MulDivQuestionFamilies,
};
