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
      name: 'Decompose Decimal into Place Values',
      description: 'Given a decimal, state how many tenths, hundredths, or thousandths.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_decimal_columns'],
    },
    {
      name: 'Compose Decimal from Place Values',
      description: 'Given ones, tenths, hundredths, and thousandths, write the decimal.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_decimal_columns', 'ignores_decimal_point'],
    },
    {
      name: 'Value of a Decimal Digit',
      description: 'State the value of an underlined digit in a decimal number (e.g. the 4 in 3.472 is worth 0.4).',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_decimal_columns'],
    },
  ],
  'P4-DEC-02': [
    {
      name: 'Compare Two Decimals',
      description: 'Use >, < or = to compare two decimals.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['more_digits_means_larger', 'ignores_decimal_point'],
    },
    {
      name: 'Order Three Decimals',
      description: 'Arrange three decimals in ascending or descending order.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['more_digits_means_larger'],
    },
    {
      name: 'Decimals on a Number Line',
      description: 'Identify or place a decimal on a number line between two whole numbers.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_decimal_columns', 'ignores_decimal_point'],
    },
  ],
  'P4-DEC-03': [
    {
      name: 'Round to Nearest Whole Number',
      description: 'Round a decimal to the nearest whole number.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction'],
    },
    {
      name: 'Round to 1 Decimal Place',
      description: 'Round a decimal to 1 decimal place.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction', 'confuses_decimal_columns'],
    },
    {
      name: 'Round to 2 Decimal Places',
      description: 'Round a decimal to 2 decimal places.',
      difficulty: 3,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction', 'confuses_decimal_columns'],
    },
  ],
  'P4-DEC-04': [
    {
      name: 'Add Two Decimals (up to 2 dp)',
      description: 'Add two decimals, each with up to 2 decimal places.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misaligns_decimal_points'],
    },
    {
      name: 'Subtract Two Decimals (up to 2 dp)',
      description: 'Subtract two decimals, each with up to 2 decimal places.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misaligns_decimal_points'],
    },
    {
      name: 'Add/Subtract with Different Decimal Places',
      description: 'Add or subtract decimals where one has 1 dp and the other has 2 dp.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misaligns_decimal_points', 'ignores_decimal_point'],
    },
  ],
  'P4-DEC-05': [
    {
      name: 'Multiply Decimal by 1-digit Number',
      description: 'Multiply a decimal (up to 2 dp) by a single-digit whole number.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['decimal_point_wrong_after_multiply'],
    },
    {
      name: 'Divide Decimal by 1-digit Number',
      description: 'Divide a decimal (up to 2 dp) by a single-digit whole number with an exact answer.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['decimal_point_wrong_after_multiply', 'ignores_decimal_point'],
    },
    {
      name: 'Multiply/Divide Decimal — Mixed',
      description: 'Mixed practice multiplying or dividing a decimal by a 1-digit whole number.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['decimal_point_wrong_after_multiply'],
    },
  ],
  'P4-DEC-06': [
    {
      name: 'Fraction to Decimal (denominator 10)',
      description: 'Convert a fraction with denominator 10 to a decimal.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['fraction_denominator_conversion_error'],
    },
    {
      name: 'Fraction to Decimal (denominator 100)',
      description: 'Convert a fraction with denominator 100 to a decimal.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['fraction_denominator_conversion_error', 'confuses_decimal_columns'],
    },
    {
      name: 'Fraction to Decimal (equivalent denominator)',
      description: 'Convert a fraction whose denominator is a factor of 10 or 100 (e.g. 2, 4, 5, 20, 25, 50) to a decimal.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['fraction_denominator_conversion_error', 'confuses_decimal_columns'],
    },
  ],
};

export const p4DecimalsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p4DecimalsQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p4DecimalsQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p4DecimalsQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p4DecimalsSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP4DecimalsQuestionFamilies() {
  const ids = p4DecimalsQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = p4DecimalsQuestionFamilies
    .filter((family) => !SKILL_IDS.has(family.skillId))
    .map((family) => ({ familyId: family.id, skillId: family.skillId }));

  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage)
    .filter(([, count]) => count === 0)
    .map(([skillId]) => skillId);

  const lowFamilyCountSkills = Object.entries(skillCoverage)
    .filter(([, count]) => count < 2)
    .map(([skillId, count]) => ({ skillId, count }));

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');
  if (lowFamilyCountSkills.length) errors.push('Some skills have fewer than 2 question families.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: p4DecimalsQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: {
      duplicateIds: [...new Set(duplicateIds)],
      invalidSkillRefs,
      missingSkillCoverage,
      lowFamilyCountSkills,
    },
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
