import { p5WordProbSkillGraph } from './p5WordProbSkillGraph.js';

const SKILL_IDS = new Set(p5WordProbSkillGraph.skillIds);

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
  'P5-WP-01': [
    {
      name: 'Shopping with change',
      description: 'Buy multiple items at given prices, pay with a larger amount, find the change.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['uses_wrong_operation', 'skips_intermediate_step'],
    },
    {
      name: 'Distribute equally with remainder',
      description: 'Distribute items equally among groups and find how many are left over.',
      difficulty: 5,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['uses_wrong_operation', 'skips_intermediate_step'],
    },
    {
      name: 'Multi-step comparison',
      description: 'Compare two quantities after a series of operations to find a difference or total.',
      difficulty: 5,
      fluencyTargetSeconds: 35,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['uses_wrong_operation', 'skips_intermediate_step'],
    },
  ],
  'P5-WP-02': [
    {
      name: 'Give-and-receive sequence',
      description: 'Start with a quantity, give away some, receive some, find the final amount.',
      difficulty: 5,
      fluencyTargetSeconds: 32,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misreads_before_after', 'skips_intermediate_step'],
    },
    {
      name: 'Find amount spent',
      description: 'Given an initial amount and a remaining amount, find how much was spent.',
      difficulty: 5,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misreads_before_after', 'uses_wrong_operation'],
    },
    {
      name: 'Find original amount',
      description: 'Given changes and a final amount, work backwards to find the original amount.',
      difficulty: 6,
      fluencyTargetSeconds: 35,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misreads_before_after', 'uses_wrong_operation', 'skips_intermediate_step'],
    },
  ],
  'P5-WP-03': [
    {
      name: 'Find unit cost',
      description: 'Given the total cost of several items, find the cost of one item.',
      difficulty: 4,
      fluencyTargetSeconds: 25,
      answerType: 'numeric',
      mentalMathEligible: true,
      workingRequired: true,
      misconceptionTags: ['confuses_unit_rate_with_total'],
    },
    {
      name: 'Find speed from distance and time',
      description: 'Given distance and time, calculate the speed (unit rate).',
      difficulty: 5,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_unit_rate_with_total', 'uses_wrong_operation'],
    },
    {
      name: 'Compare two rates',
      description: 'Compare unit costs or speeds to determine which is cheaper or faster.',
      difficulty: 6,
      fluencyTargetSeconds: 35,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['wrong_comparison_direction', 'confuses_unit_rate_with_total', 'uses_wrong_operation'],
    },
  ],
};

export const p5WordProbQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p5WordProbQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p5WordProbQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p5WordProbQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5WordProbSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP5WordProbQuestionFamilies() {
  const ids = p5WordProbQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p5WordProbQuestionFamilies
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
    totalQuestionFamilies: p5WordProbQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p5-wordprob',
  version: '1.0.0',
  totalSkills: p5WordProbSkillGraph.skillIds.length,
  totalQuestionFamilies: p5WordProbQuestionFamilies.length,
  families: p5WordProbQuestionFamilies,
};
