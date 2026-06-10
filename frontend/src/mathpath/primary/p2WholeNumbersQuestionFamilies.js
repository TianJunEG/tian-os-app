import { p2WholeNumbersSkillGraph } from './p2WholeNumbersSkillGraph.js';

const SKILL_IDS = new Set(p2WholeNumbersSkillGraph.skillIds);

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
  'P2-WN-01': [
    {
      name: 'Decompose into Place Values',
      description: 'Given a 3-digit number, state the number of hundreds, tens, or ones.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_hto_columns'],
    },
    {
      name: 'Compose from Place Values',
      description: 'Given hundreds, tens, and ones, write the 3-digit number.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_hto_columns', 'zero_placeholder_error'],
    },
    {
      name: 'Value of a Digit',
      description: 'State the value of a digit in a 3-digit number (e.g. the 4 in 342 is worth 40).',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_hto_columns'],
    },
  ],
  'P2-WN-02': [
    {
      name: 'Compare Two 3-digit Numbers',
      description: 'Use >, < or = to compare two numbers up to 1000.',
      difficulty: 2,
      fluencyTargetSeconds: 8,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_wrong_order', 'confuses_more_less_symbols'],
    },
    {
      name: 'Order Three Numbers',
      description: 'Arrange three numbers up to 1000 in ascending or descending order.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_wrong_order'],
    },
    {
      name: 'Greatest / Smallest from 3 Digits',
      description: 'Form the greatest or smallest 3-digit number from a given set of digits.',
      difficulty: 3,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['compares_digit_wrong_order', 'confuses_more_less_symbols'],
    },
  ],
  'P2-WN-03': [
    {
      name: 'Identify Odd or Even',
      description: 'Determine whether a given two-digit number is odd or even.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_odd_even'],
    },
    {
      name: 'Next Odd or Even Number',
      description: 'Find the next odd or next even number after a given number.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_odd_even'],
    },
    {
      name: 'Count Odd or Even in a Set',
      description: 'Count how many odd or even numbers appear in a given set of numbers.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_odd_even', 'parity_of_zero'],
    },
  ],
  'P2-WN-04': [
    {
      name: 'Continue an Increasing Pattern',
      description: 'Find the next term in an increasing pattern with a constant step (10-100).',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error'],
    },
    {
      name: 'Continue a Decreasing Pattern',
      description: 'Find the next term in a decreasing pattern with a constant step.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error', 'pattern_direction_error'],
    },
    {
      name: 'Find the Missing Term',
      description: 'Fill in a missing number in the middle of a pattern sequence.',
      difficulty: 3,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error'],
    },
  ],
  'P2-WN-05': [
    {
      name: 'Number to Words',
      description: 'Choose the correct word form for a given 3-digit number.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'mcq',
      mentalMathEligible: false,
      misconceptionTags: ['number_words_and_omission', 'number_words_teen_ty_confusion'],
    },
    {
      name: 'Words to Number',
      description: 'Choose the correct numeral for a given number written in words.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'mcq',
      mentalMathEligible: false,
      misconceptionTags: ['number_words_and_omission', 'number_words_teen_ty_confusion'],
    },
  ],
};

export const p2WholeNumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p2WholeNumbersQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p2WholeNumbersQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p2WholeNumbersQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p2WholeNumbersSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP2WholeNumbersQuestionFamilies() {
  const ids = p2WholeNumbersQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = p2WholeNumbersQuestionFamilies
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
    totalQuestionFamilies: p2WholeNumbersQuestionFamilies.length,
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
  domainId: 'p2-whole-numbers',
  version: '1.0.0',
  totalSkills: p2WholeNumbersSkillGraph.skillIds.length,
  totalQuestionFamilies: p2WholeNumbersQuestionFamilies.length,
  families: p2WholeNumbersQuestionFamilies,
};
