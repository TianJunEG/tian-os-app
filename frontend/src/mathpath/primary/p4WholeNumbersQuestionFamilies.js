import { p4WholeNumbersSkillGraph } from './p4WholeNumbersSkillGraph.js';
const SKILL_IDS = new Set(p4WholeNumbersSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`, skillId,
    name: config.name, description: config.description, difficulty: config.difficulty,
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
      name: 'Expanded Form to Number',
      description: 'Given an expanded form (e.g. 30 000 + 4 000 + 500 + 20 + 7), write the number.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
    },
    {
      name: 'Number to Expanded Form',
      description: 'Given a 5-digit number, select the correct expanded form.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit'],
    },
    {
      name: 'Value of a Digit',
      description: 'State the value of a specific digit in a number up to 100 000.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_place_columns_5digit'],
    },
  ],
  'P4-WN-02': [
    {
      name: 'Which Is Greater',
      description: 'Compare two numbers up to 100 000 using > or <.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order_5digit', 'confuses_more_less_symbols_5digit'],
    },
    {
      name: 'Order Ascending',
      description: 'Arrange three numbers up to 100 000 from smallest to largest.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order_5digit'],
    },
    {
      name: 'Order Descending',
      description: 'Arrange three numbers up to 100 000 from largest to smallest.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'ordering',
      mentalMathEligible: true,
      misconceptionTags: ['compares_digit_by_digit_wrong_order_5digit'],
    },
  ],
  'P4-WN-03': [
    {
      name: 'Find Next in Sequence',
      description: 'Continue a number pattern with a constant step in the hundreds or thousands.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large'],
    },
    {
      name: 'Find the Rule',
      description: 'Identify the constant step (add or subtract) in a given number pattern.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large', 'pattern_direction_error_large'],
    },
    {
      name: 'Find Missing Middle Term',
      description: 'Fill in a missing number in the middle of a pattern sequence.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['pattern_step_error_large'],
    },
  ],
  'P4-WN-04': [
    {
      name: 'Round to Nearest 10',
      description: 'Round a number up to 99 999 to the nearest 10.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction', 'truncates_instead_of_rounding'],
    },
    {
      name: 'Round to Nearest 100',
      description: 'Round a number up to 99 999 to the nearest 100.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction', 'rounds_wrong_place'],
    },
    {
      name: 'Round to Nearest 1000',
      description: 'Round a number up to 99 999 to the nearest 1000.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['rounds_wrong_direction', 'rounds_wrong_place'],
    },
  ],
};

export const p4WholeNumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p4WholeNumbersQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p4WholeNumbersQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p4WholeNumbersQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4WholeNumbersSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP4WholeNumbersQuestionFamilies() {
  const ids = p4WholeNumbersQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4WholeNumbersQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4WholeNumbersQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p4-whole-numbers', version: '1.0.0', totalSkills: p4WholeNumbersSkillGraph.skillIds.length, totalQuestionFamilies: p4WholeNumbersQuestionFamilies.length, families: p4WholeNumbersQuestionFamilies };
