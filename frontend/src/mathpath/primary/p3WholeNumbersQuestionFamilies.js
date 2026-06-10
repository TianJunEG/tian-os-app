import { p3WholeNumbersSkillGraph } from './p3WholeNumbersSkillGraph.js';

const SKILL_IDS = new Set(p3WholeNumbersSkillGraph.skillIds);

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
  'P3-WN-01': [
    {
      name: 'Decompose into Place Values',
      description: 'Given a 4-digit number, state the value of each place (thousands, hundreds, tens, ones).',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns'],
    },
    {
      name: 'Compose from Place Values',
      description: 'Given thousands, hundreds, tens, and ones, write the 4-digit number.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns', 'zero_placeholder_error'],
    },
    {
      name: 'Value of a Digit',
      description: 'State the value of an underlined digit in a 4-digit number (e.g. the 4 in 3472 is worth 400).',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns'],
    },
    {
      name: 'Number with Zero Placeholders',
      description: 'Read or write numbers that contain zero in one or more places (e.g. 5007, 3060).',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['zero_placeholder_error'],
    },
  ],
  'P3-WN-02': [
    {
      name: 'Compare Two 4-digit Numbers',
      description: 'Use >, < or = to compare two numbers up to 10 000.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order', 'confuses_more_less_symbols'],
    },
    {
      name: 'Order Three Numbers',
      description: 'Arrange three numbers up to 10 000 in ascending or descending order.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order'],
    },
    {
      name: 'Greatest / Smallest from Digits',
      description: 'Form the greatest or smallest 4-digit number from a given set of digits.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_place_columns', 'zero_placeholder_error'],
    },
  ],
  'P3-WN-03': [
    {
      name: 'Continue an Increasing Pattern',
      description: 'Find the next term in an increasing pattern with a constant step (25-1000).',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error'],
    },
    {
      name: 'Continue a Decreasing Pattern',
      description: 'Find the next term in a decreasing pattern with a constant step.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error', 'pattern_direction_error'],
    },
    {
      name: 'Find the Missing Term',
      description: 'Fill in a missing number in the middle of a pattern sequence.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error'],
    },
  ],
};

export const p3WholeNumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p3WholeNumbersQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p3WholeNumbersQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p3WholeNumbersQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p3WholeNumbersSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP3WholeNumbersQuestionFamilies() {
  const ids = p3WholeNumbersQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = p3WholeNumbersQuestionFamilies
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
    totalQuestionFamilies: p3WholeNumbersQuestionFamilies.length,
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
  domainId: 'p3-whole-numbers',
  version: '1.0.0',
  totalSkills: p3WholeNumbersSkillGraph.skillIds.length,
  totalQuestionFamilies: p3WholeNumbersQuestionFamilies.length,
  families: p3WholeNumbersQuestionFamilies,
};
