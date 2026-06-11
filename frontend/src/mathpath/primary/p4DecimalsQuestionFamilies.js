import { p4DecimalsSkillGraph } from './p4DecimalsSkillGraph.js';

const SKILL_IDS = new Set(p4DecimalsSkillGraph.skillIds);

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
  'P4-DEC-01': [
    {
      name: 'Words to Decimal',
      description: 'Convert a decimal expressed in words to its numeric form (up to 3dp).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['misplaces_decimal_point'],
    },
    {
      name: 'Value of a Digit',
      description: 'Identify the place value of a specific digit in a decimal number.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'number',
      mentalMathEligible: true,
      misconceptionTags: ['misplaces_decimal_point'],
    },
  ],
  'P4-DEC-02': [
    {
      name: 'Which Is Greater',
      description: 'Given two decimals, identify the greater number.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['longer_decimal_is_larger'],
    },
    {
      name: 'Order Ascending',
      description: 'Arrange three or four decimals in ascending order.',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'text',
      mentalMathEligible: false,
      misconceptionTags: ['longer_decimal_is_larger'],
    },
  ],
  'P4-DEC-03': [
    {
      name: 'Round to Whole Number',
      description: 'Round a decimal to the nearest whole number.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'number',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction'],
    },
    {
      name: 'Round to 1 Decimal Place',
      description: 'Round a decimal to 1 decimal place.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'number',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction'],
    },
    {
      name: 'Round to 2 Decimal Places',
      description: 'Round a decimal to 2 decimal places.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'number',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction'],
    },
  ],
  'P4-DEC-04': [
    {
      name: 'Add Decimals',
      description: 'Add two decimals (up to 2dp).',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['aligns_rightmost_not_decimal_point', 'misplaces_decimal_point'],
    },
    {
      name: 'Subtract Decimals',
      description: 'Subtract one decimal from another (up to 2dp).',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['aligns_rightmost_not_decimal_point', 'misplaces_decimal_point'],
    },
    {
      name: 'Word Context (Add/Subtract)',
      description: 'Solve a word problem involving adding or subtracting decimals.',
      difficulty: 2,
      fluencyTargetSeconds: 25,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['aligns_rightmost_not_decimal_point'],
    },
  ],
  'P4-DEC-05': [
    {
      name: 'Multiply Decimal by 1-digit',
      description: 'Multiply a decimal (up to 2dp) by a single-digit whole number.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['forgets_to_place_decimal_back', 'misplaces_decimal_point'],
    },
    {
      name: 'Divide Decimal by 1-digit',
      description: 'Divide a decimal (up to 2dp) by a single-digit whole number.',
      difficulty: 3,
      fluencyTargetSeconds: 22,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['forgets_to_place_decimal_back', 'misplaces_decimal_point'],
    },
  ],
  'P4-DEC-06': [
    {
      name: 'Convert Fraction to Decimal',
      description: 'Express a fraction as a decimal when the denominator is a factor of 10 or 100.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'number',
      mentalMathEligible: true,
      misconceptionTags: ['misplaces_decimal_point'],
    },
    {
      name: 'Match Fraction to Decimal',
      description: 'Select the correct decimal equivalent from a set of choices for a given fraction.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['misplaces_decimal_point'],
    },
  ],
};

export const p4DecimalsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p4DecimalsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p4DecimalsQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p4DecimalsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4DecimalsSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP4DecimalsQuestionFamilies() {
  const ids = p4DecimalsQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p4DecimalsQuestionFamilies
    .filter((f) => !SKILL_IDS.has(f.skillId))
    .map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilyCountSkills = Object.entries(skillCoverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');
  if (lowFamilyCountSkills.length) errors.push('Some skills have fewer than 2 question families.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: p4DecimalsQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p4-decimals',
  version: '1.0.0',
  totalSkills: p4DecimalsSkillGraph.skillIds.length,
  totalQuestionFamilies: p4DecimalsQuestionFamilies.length,
  families: p4DecimalsQuestionFamilies,
};
