import { p3AddSubSkillGraph } from './p3AddSubSkillGraph.js';

const SKILL_IDS = new Set(p3AddSubSkillGraph.skillIds);

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
  'P3-AS-01': [
    {
      name: 'Add Two 2-Digit (no carry)',
      description: 'Add two 2-digit numbers mentally where ones do not exceed 9.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['adds_ones_to_tens'],
    },
    {
      name: 'Add Two 2-Digit (with carry)',
      description: 'Add two 2-digit numbers mentally where ones sum exceeds 9.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_add_carry_error'],
    },
    {
      name: 'Add Two 2-Digit (near doubles/tens)',
      description: 'Add two 2-digit numbers where a near-doubles or make-ten strategy is efficient.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_add_carry_error', 'adds_ones_to_tens'],
    },
  ],
  'P3-AS-02': [
    {
      name: 'Subtract Two 2-Digit (no regroup)',
      description: 'Subtract two 2-digit numbers mentally where no regrouping is needed.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['subtracts_smaller_from_larger_digit'],
    },
    {
      name: 'Subtract Two 2-Digit (with regroup)',
      description: 'Subtract two 2-digit numbers mentally where regrouping is needed.',
      difficulty: 2,
      fluencyTargetSeconds: 13,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_sub_regroup_error'],
    },
    {
      name: 'Subtract Two 2-Digit (complement strategy)',
      description: 'Subtract using the add-up/complement strategy (e.g. 83-47: count up from 47).',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_sub_regroup_error', 'subtracts_smaller_from_larger_digit'],
    },
  ],
  'P3-AS-03': [
    {
      name: 'Column Addition (no carry)',
      description: 'Add two numbers up to 4 digits using column method with no carrying.',
      difficulty: 1,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['column_alignment_error'],
    },
    {
      name: 'Column Addition (single carry)',
      description: 'Add two numbers up to 4 digits requiring one carry.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_carry', 'column_alignment_error'],
    },
    {
      name: 'Column Addition (multiple carries)',
      description: 'Add two numbers up to 4 digits requiring two or more carries.',
      difficulty: 3,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_carry'],
    },
  ],
  'P3-AS-04': [
    {
      name: 'Column Subtraction (no borrow)',
      description: 'Subtract two numbers up to 4 digits with no borrowing needed.',
      difficulty: 1,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['column_alignment_error'],
    },
    {
      name: 'Column Subtraction (with borrows)',
      description: 'Subtract two numbers up to 4 digits requiring one or more borrows.',
      difficulty: 2,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_borrow', 'subtracts_smaller_from_larger_digit'],
    },
    {
      name: 'Column Subtraction (borrow across zeros)',
      description: 'Subtract where the top number has zeros requiring chained borrowing (e.g. 5003-1247).',
      difficulty: 3,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['borrow_across_zero', 'forgets_borrow'],
    },
  ],
};

export const p3AddSubQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p3AddSubQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p3AddSubQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p3AddSubQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p3AddSubSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP3AddSubQuestionFamilies() {
  const ids = p3AddSubQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p3AddSubQuestionFamilies
    .filter((f) => !SKILL_IDS.has(f.skillId))
    .map((f) => ({ familyId: f.id, skillId: f.skillId }));

  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage)
    .filter(([, count]) => count === 0)
    .map(([skillId]) => skillId);

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: p3AddSubQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage },
    errors,
  };
}

export default {
  domainId: 'p3-addsub',
  version: '1.0.0',
  totalSkills: p3AddSubSkillGraph.skillIds.length,
  totalQuestionFamilies: p3AddSubQuestionFamilies.length,
  families: p3AddSubQuestionFamilies,
};
