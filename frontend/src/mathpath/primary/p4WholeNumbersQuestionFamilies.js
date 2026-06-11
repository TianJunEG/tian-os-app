import { p4WholeNumbersSkillGraph } from './p4WholeNumbersSkillGraph.js';

const SKILL_IDS = new Set(p4WholeNumbersSkillGraph.skillIds);

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
  'P4-WN-01': [
    {
      name: 'Decompose into Place Values (5-digit)',
      description: 'Given a 5-digit number, state the value of each place (ten thousands, thousands, hundreds, tens, ones).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit'],
    },
    {
      name: 'Compose from Place Values (5-digit)',
      description: 'Given ten thousands, thousands, hundreds, tens, and ones, write the 5-digit number.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
    },
    {
      name: 'Value of a Digit (5-digit)',
      description: 'State the value of an underlined digit in a 5-digit number (e.g. the 4 in 34 720 is worth 4000).',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit'],
    },
    {
      name: 'Number with Zero Placeholders (5-digit)',
      description: 'Read or write numbers that contain zero in one or more places (e.g. 50 302, 40 070).',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['zero_placeholder_error_5digit'],
    },
  ],
  'P4-WN-02': [
    {
      name: 'Compare Two 5-digit Numbers',
      description: 'Use >, < or = to compare two numbers up to 100 000.',
      difficulty: 2,
      fluencyTargetSeconds: 11,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order_5digit', 'confuses_more_less_symbols'],
    },
    {
      name: 'Order Three Numbers (to 100 000)',
      description: 'Arrange three numbers up to 100 000 in ascending or descending order.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order_5digit'],
    },
    {
      name: 'Greatest / Smallest from Digits (5-digit)',
      description: 'Form the greatest or smallest 5-digit number from a given set of digits.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
    },
  ],
  'P4-WN-03': [
    {
      name: 'Continue an Increasing Pattern (large steps)',
      description: 'Find the next term in an increasing pattern with a constant step (250\u20132500).',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large'],
    },
    {
      name: 'Continue a Decreasing Pattern (large steps)',
      description: 'Find the next term in a decreasing pattern with a constant step (250\u20132500).',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large', 'pattern_direction_error'],
    },
    {
      name: 'Find the Missing Term (large numbers)',
      description: 'Fill in a missing number in the middle of a pattern sequence with numbers up to 100 000.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large'],
    },
  ],
  'P4-WN-04': [
    {
      name: 'Round to Nearest 10',
      description: 'Round a 3- or 4-digit number to the nearest 10.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounding_direction_error', 'rounding_five_goes_down'],
    },
    {
      name: 'Round to Nearest 100',
      description: 'Round a 3- or 4-digit number to the nearest 100.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounding_direction_error', 'rounding_wrong_place'],
    },
    {
      name: 'Round to Nearest 1000',
      description: 'Round a 4-digit number to the nearest 1000.',
      difficulty: 2,
      fluencyTargetSeconds: 13,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounding_direction_error', 'rounding_wrong_place', 'rounding_five_goes_down'],
    },
  ],
};

export const p4WholeNumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p4WholeNumbersQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p4WholeNumbersQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p4WholeNumbersQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p4WholeNumbersSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP4WholeNumbersQuestionFamilies() {
  const ids = p4WholeNumbersQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = p4WholeNumbersQuestionFamilies
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
    totalQuestionFamilies: p4WholeNumbersQuestionFamilies.length,
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
  domainId: 'p4-whole-numbers',
  version: '1.0.0',
  totalSkills: p4WholeNumbersSkillGraph.skillIds.length,
  totalQuestionFamilies: p4WholeNumbersQuestionFamilies.length,
  families: p4WholeNumbersQuestionFamilies,
};
