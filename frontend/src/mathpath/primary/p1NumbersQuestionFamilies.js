import { p1NumbersSkillGraph } from './p1SkillGraph.js';

const SKILL_IDS = new Set(p1NumbersSkillGraph.skillIds);

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
  'P1-NUM-01': [
    {
      name: 'Count Arranged Objects',
      description: 'Count objects arranged in a row or grid up to 10.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['skip_count_objects'],
    },
    {
      name: 'Count Scattered Objects',
      description: 'Count objects scattered randomly up to 10.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['skip_count_objects'],
    },
  ],
  'P1-NUM-02': [
    {
      name: 'Numeral from Word',
      description: 'Given a number word (zero to ten), select or write the matching numeral.',
      difficulty: 1,
      fluencyTargetSeconds: 5,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
    {
      name: 'Word from Numeral',
      description: 'Given a numeral (0-10), select or write the matching number word.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
  ],
  'P1-NUM-03': [
    {
      name: 'Count Arranged Objects 11-20',
      description: 'Count objects arranged in rows from 11 to 20.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['teens_counting_error'],
    },
    {
      name: 'Count Scattered Objects 11-20',
      description: 'Count objects scattered randomly from 11 to 20.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['teens_counting_error'],
    },
  ],
  'P1-NUM-04': [
    {
      name: 'Numeral from Word 11-20',
      description: 'Given a number word (eleven to twenty), select or write the matching numeral.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
    {
      name: 'Word from Numeral 11-20',
      description: 'Given a numeral (11-20), select or write the matching number word.',
      difficulty: 1,
      fluencyTargetSeconds: 7,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
  ],
  'P1-NUM-05': [
    {
      name: 'Count Grouped Objects to 40',
      description: 'Count objects grouped in tens and ones up to 40.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['loses_count_past_20'],
    },
    {
      name: 'Count Scattered Objects to 40',
      description: 'Count objects scattered randomly up to 40.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: false,
      misconceptionTags: ['loses_count_past_20'],
    },
  ],
  'P1-NUM-06': [
    {
      name: 'Numeral from Word to 40',
      description: 'Given a number word (twenty-one to forty), write the matching numeral.',
      difficulty: 2,
      fluencyTargetSeconds: 6,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
    {
      name: 'Word from Numeral to 40',
      description: 'Given a numeral (21-40), select the matching number word.',
      difficulty: 2,
      fluencyTargetSeconds: 7,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
  ],
  'P1-NUM-07': [
    {
      name: 'Count Grouped Objects to 100',
      description: 'Count objects grouped in tens and ones up to 100.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: false,
      misconceptionTags: ['loses_count_past_20'],
    },
    {
      name: 'Count Scattered Objects to 100',
      description: 'Count objects scattered randomly up to 100.',
      difficulty: 2,
      fluencyTargetSeconds: 15,
      answerType: 'numeric',
      mentalMathEligible: false,
      misconceptionTags: ['loses_count_past_20'],
    },
  ],
  'P1-NUM-08': [
    {
      name: 'Numeral from Word to 100',
      description: 'Given a number word (up to one hundred), write the matching numeral.',
      difficulty: 2,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
    {
      name: 'Word from Numeral to 100',
      description: 'Given a numeral (up to 100), select the matching number word.',
      difficulty: 2,
      fluencyTargetSeconds: 9,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['reverses_digits'],
    },
  ],
  'P1-NUM-09': [
    {
      name: 'Missing Addend in Bond to 10',
      description: 'Given one part of a number bond to 10, find the missing addend.',
      difficulty: 2,
      fluencyTargetSeconds: 5,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['number_bond_recall_error'],
    },
    {
      name: 'Find the Pair that Makes 10',
      description: 'Select or identify which two numbers from a set add to 10.',
      difficulty: 2,
      fluencyTargetSeconds: 6,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['number_bond_recall_error'],
    },
  ],
  'P1-NUM-10': [
    {
      name: 'Compare Two Numbers to 20',
      description: 'Use >, < or = to compare two numbers up to 20.',
      difficulty: 2,
      fluencyTargetSeconds: 8,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_more_less_symbols'],
    },
    {
      name: 'Order Three Numbers to 20',
      description: 'Arrange three numbers up to 20 in ascending or descending order.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_more_less_symbols'],
    },
  ],
  'P1-NUM-11': [
    {
      name: 'Compare Two Numbers to 100',
      description: 'Use >, < or = to compare two numbers up to 100.',
      difficulty: 3,
      fluencyTargetSeconds: 10,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_more_less_symbols'],
    },
    {
      name: 'Order Three Numbers to 100',
      description: 'Arrange three numbers up to 100 in ascending or descending order.',
      difficulty: 3,
      fluencyTargetSeconds: 12,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_more_less_symbols'],
    },
  ],
  'P1-NUM-12': [
    {
      name: 'Fill Missing Number Counting Forward',
      description: 'Fill in missing numbers in a forward counting-by-1 sequence.',
      difficulty: 2,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_direction_error'],
    },
    {
      name: 'Fill Missing Number Counting Backward',
      description: 'Fill in missing numbers in a backward counting-by-1 sequence.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_direction_error'],
    },
  ],
  'P1-NUM-13': [
    {
      name: 'Skip-Count Forward by 2s, 5s, or 10s',
      description: 'Complete a forward skip-counting sequence by 2s, 5s, or 10s.',
      difficulty: 3,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['skip_count_reverts_to_ones'],
    },
    {
      name: 'Identify the Skip-Count Rule',
      description: 'Given a skip-counting sequence, identify the counting rule (by 2s, 5s, or 10s).',
      difficulty: 3,
      fluencyTargetSeconds: 12,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['skip_count_reverts_to_ones'],
    },
  ],
  'P1-NUM-14': [
    {
      name: 'How Many Tens and Ones',
      description: 'Given a number up to 40, state how many tens and ones it has.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['swaps_tens_ones'],
    },
    {
      name: 'What Number from Tens and Ones',
      description: 'Given a count of tens and ones, write the number (up to 40).',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['swaps_tens_ones'],
    },
  ],
  'P1-NUM-15': [
    {
      name: 'How Many Tens and Ones to 100',
      description: 'Given a number up to 100, state how many tens and ones it has.',
      difficulty: 3,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['swaps_tens_ones'],
    },
    {
      name: 'What Number from Tens and Ones to 100',
      description: 'Given a count of tens and ones, write the number (up to 100).',
      difficulty: 3,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['swaps_tens_ones'],
    },
  ],
  'P1-NUM-16': [
    {
      name: 'Position from Left',
      description: 'Identify which object is at a given ordinal position counting from the left.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['ordinal_cardinal_confusion'],
    },
    {
      name: 'Position from Right',
      description: 'Identify which object is at a given ordinal position counting from the right.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['ordinal_cardinal_confusion'],
    },
  ],
};

export const p1NumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p1NumbersQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p1NumbersQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p1NumbersQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p1NumbersSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP1NumbersQuestionFamilies() {
  const ids = p1NumbersQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = p1NumbersQuestionFamilies
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
    totalQuestionFamilies: p1NumbersQuestionFamilies.length,
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
  domainId: 'p1-numbers',
  version: '1.0.0',
  totalSkills: p1NumbersSkillGraph.skillIds.length,
  totalQuestionFamilies: p1NumbersQuestionFamilies.length,
  families: p1NumbersQuestionFamilies,
};
