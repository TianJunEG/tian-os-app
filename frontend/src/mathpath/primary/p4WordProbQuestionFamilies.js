import { p4WordProbSkillGraph } from './p4WordProbSkillGraph.js';

const SKILL_IDS = new Set(p4WordProbSkillGraph.skillIds);

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
    workingRequired: config.workingRequired ?? true,
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
  'P4-WP-01': [
    {
      name: 'Unit fraction of a quantity',
      description: 'Find a unit fraction (1/n) of a given quantity in a word problem context.',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: true,
      workingRequired: true,
      misconceptionTags: ['fraction_bar_model_confusion'],
    },
    {
      name: 'Non-unit fraction of a quantity',
      description: 'Find a/b of a quantity where a > 1 using a bar model approach.',
      difficulty: 3,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['fraction_bar_model_confusion', 'wrong_operation_choice'],
    },
    {
      name: 'Fraction of quantity with context',
      description: 'Solve a word problem requiring fraction of a quantity (money, objects, distance).',
      difficulty: 3,
      fluencyTargetSeconds: 25,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['doesnt_identify_what_to_find', 'fraction_bar_model_confusion'],
    },
  ],
  'P4-WP-02': [
    {
      name: 'Subtract twice from a total',
      description: 'Start with a total, subtract two amounts, find the remainder.',
      difficulty: 3,
      fluencyTargetSeconds: 25,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['forgets_second_step', 'wrong_operation_choice'],
    },
    {
      name: 'Buy items then find change',
      description: 'Buy N items at $X each, pay with $Y, find the change.',
      difficulty: 4,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['doesnt_identify_what_to_find', 'forgets_second_step'],
    },
    {
      name: 'Combined operations word problem',
      description: 'Solve a two-step word problem combining addition/subtraction or multiplication/subtraction.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['doesnt_identify_what_to_find', 'wrong_operation_choice', 'forgets_second_step'],
    },
  ],
};

export const p4WordProbQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p4WordProbQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p4WordProbQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p4WordProbQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4WordProbSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP4WordProbQuestionFamilies() {
  const ids = p4WordProbQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p4WordProbQuestionFamilies
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
    totalQuestionFamilies: p4WordProbQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p4-word-problems',
  version: '1.0.0',
  totalSkills: p4WordProbSkillGraph.skillIds.length,
  totalQuestionFamilies: p4WordProbQuestionFamilies.length,
  families: p4WordProbQuestionFamilies,
};
