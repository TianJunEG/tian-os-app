import { p2AddSubSkillGraph } from './p2AddSubSkillGraph.js';

const SKILL_IDS = new Set(p2AddSubSkillGraph.skillIds);

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
  'P2-AS-01': [
    {
      name: 'Add Ones to 3-Digit',
      description: 'Add a single-digit number to a 3-digit number mentally (e.g. 340 + 5).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_add_place_error'],
    },
    {
      name: 'Add Tens to 3-Digit',
      description: 'Add a multiple of 10 to a 3-digit number mentally (e.g. 340 + 50).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_add_place_error'],
    },
    {
      name: 'Add Hundreds to 3-Digit',
      description: 'Add a multiple of 100 to a 3-digit number mentally (e.g. 340 + 200).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_add_place_error'],
    },
  ],
  'P2-AS-02': [
    {
      name: 'Subtract Ones from 3-Digit',
      description: 'Subtract a single-digit number from a 3-digit number mentally (e.g. 476 - 3).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_sub_place_error'],
    },
    {
      name: 'Subtract Tens from 3-Digit',
      description: 'Subtract a multiple of 10 from a 3-digit number mentally (e.g. 476 - 30).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_sub_place_error'],
    },
    {
      name: 'Subtract Hundreds from 3-Digit',
      description: 'Subtract a multiple of 100 from a 3-digit number mentally (e.g. 476 - 200).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['mental_sub_place_error'],
    },
  ],
  'P2-AS-03': [
    {
      name: 'Column Addition (no regrouping)',
      description: 'Add two numbers within 1000 using the column method where no regrouping is needed.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['regroups_wrong_column'],
    },
    {
      name: 'Column Addition (with regrouping)',
      description: 'Add two numbers within 1000 using the column method with one or more regroupings.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_to_regroup', 'regroups_wrong_column'],
    },
    {
      name: 'Addition Word Context',
      description: 'Solve an addition word problem within 1000.',
      difficulty: 2,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_to_regroup'],
    },
  ],
  'P2-AS-04': [
    {
      name: 'Column Subtraction (no borrowing)',
      description: 'Subtract two numbers within 1000 using the column method where no borrowing is needed.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['subtracts_smaller_from_larger'],
    },
    {
      name: 'Column Subtraction (with borrowing)',
      description: 'Subtract two numbers within 1000 using the column method with one or more borrows.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['borrows_incorrectly', 'subtracts_smaller_from_larger'],
    },
    {
      name: 'Subtraction Word Context',
      description: 'Solve a subtraction word problem within 1000.',
      difficulty: 2,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['borrows_incorrectly'],
    },
  ],
};

export const p2AddSubQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p2AddSubQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p2AddSubQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p2AddSubQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p2AddSubSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP2AddSubQuestionFamilies() {
  const ids = p2AddSubQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p2AddSubQuestionFamilies
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
    totalQuestionFamilies: p2AddSubQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage },
    errors,
  };
}

export default {
  domainId: 'p2-addsub',
  version: '1.0.0',
  totalSkills: p2AddSubSkillGraph.skillIds.length,
  totalQuestionFamilies: p2AddSubQuestionFamilies.length,
  families: p2AddSubQuestionFamilies,
};
