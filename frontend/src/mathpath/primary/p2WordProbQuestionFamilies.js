import { p2WordProbSkillGraph } from './p2WordProbSkillGraph.js';

const SKILL_IDS = new Set(p2WordProbSkillGraph.skillIds);

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
  'P2-WP-01': [
    {
      name: 'Find the Larger Quantity',
      description: 'Given one quantity and how many more the other person has, find the larger quantity.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      misconceptionTags: ['subtracts_when_should_add', 'confuses_total_with_difference'],
    },
    {
      name: 'Find the Smaller Quantity',
      description: 'Given one quantity and how many fewer the other person has, find the smaller quantity.',
      difficulty: 2,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      misconceptionTags: ['adds_when_should_subtract', 'confuses_total_with_difference'],
    },
    {
      name: 'Find the Difference',
      description: 'Given two quantities, find how many more or fewer one has compared to the other.',
      difficulty: 1,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['adds_when_should_subtract', 'confuses_total_with_difference'],
    },
  ],
  'P2-WP-02': [
    {
      name: 'Find the Total from Equal Groups',
      description: 'Given the number of groups and items per group, find the total.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['multiplies_wrong_numbers', 'confuses_groups_with_per_group'],
    },
    {
      name: 'Find the Number of Groups',
      description: 'Given a total and items per group, find how many groups there are.',
      difficulty: 2,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      misconceptionTags: ['multiplies_wrong_numbers', 'confuses_groups_with_per_group'],
    },
  ],
};

export const p2WordProbQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2WordProbQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2WordProbQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2WordProbQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2WordProbSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2WordProbQuestionFamilies() {
  const ids = p2WordProbQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2WordProbQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2WordProbQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-word-problems',
  version: '1.0.0',
  totalSkills: p2WordProbSkillGraph.skillIds.length,
  totalQuestionFamilies: p2WordProbQuestionFamilies.length,
  families: p2WordProbQuestionFamilies,
};
