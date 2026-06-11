import { p6PercentageSkillGraph } from './p6PercentageSkillGraph.js';

const SKILL_IDS = new Set(p6PercentageSkillGraph.skillIds);

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
    answerType: config.answerType ?? 'number',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P6-PCT-01': [
    {
      name: 'Percentage Increase',
      description: 'Find the new value after a percentage increase on a given price or amount.',
      difficulty: 4,
      fluencyTargetSeconds: 28,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['adds_percentage_to_value_directly', 'wrong_percentage_fraction'],
    },
    {
      name: 'Percentage Decrease',
      description: 'Find the new value after a percentage decrease on a given price or amount.',
      difficulty: 4,
      fluencyTargetSeconds: 28,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['adds_percentage_to_value_directly', 'confuses_increase_decrease'],
    },
    {
      name: 'Increase or Decrease Word Problem',
      description: 'Solve a word problem involving a percentage increase or decrease in a real-world Singapore context.',
      difficulty: 4,
      fluencyTargetSeconds: 35,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['adds_percentage_to_value_directly', 'confuses_increase_decrease'],
    },
  ],
  'P6-PCT-02': [
    {
      name: 'Single Discount',
      description: 'Calculate the sale price after a single percentage discount.',
      difficulty: 5,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['forgets_subtract_discount', 'percentage_of_wrong_base'],
    },
    {
      name: 'GST Calculation',
      description: 'Calculate the total price including 9% GST.',
      difficulty: 5,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['gst_on_discounted_not_original', 'wrong_percentage_fraction'],
    },
    {
      name: 'Discount Then GST',
      description: 'Calculate the final price after applying a discount and then adding 9% GST.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['gst_on_discounted_not_original', 'forgets_subtract_discount', 'percentage_of_wrong_base'],
    },
  ],
  'P6-PCT-03': [
    {
      name: 'Reverse Percentage Increase',
      description: 'Given the value after a percentage increase, find the original value.',
      difficulty: 5,
      fluencyTargetSeconds: 35,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['reverse_percentage_uses_final_as_base', 'percentage_of_wrong_base'],
    },
    {
      name: 'Reverse Percentage Decrease',
      description: 'Given the value after a percentage decrease (discount), find the original value.',
      difficulty: 5,
      fluencyTargetSeconds: 35,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['reverse_percentage_uses_final_as_base', 'percentage_of_wrong_base'],
    },
    {
      name: 'Reverse Percentage Word Problem',
      description: 'Solve a word problem that requires working backwards from a final percentage-changed value to find the original.',
      difficulty: 5,
      fluencyTargetSeconds: 45,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['reverse_percentage_uses_final_as_base', 'confuses_increase_decrease'],
    },
  ],
};

export const p6PercentageQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p6PercentageQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p6PercentageQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p6PercentageQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6PercentageSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP6PercentageQuestionFamilies() {
  const ids = p6PercentageQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p6PercentageQuestionFamilies
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
    totalQuestionFamilies: p6PercentageQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p6-percentage',
  version: '1.0.0',
  totalSkills: p6PercentageSkillGraph.skillIds.length,
  totalQuestionFamilies: p6PercentageQuestionFamilies.length,
  families: p6PercentageQuestionFamilies,
};
