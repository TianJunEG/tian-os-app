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
      name: 'Fraction of a Quantity',
      description: 'Find a fraction of a given set size (e.g. 3/8 of 24).',
      difficulty: 3,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      misconceptionTags: ['uses_wrong_operation', 'computes_fraction_wrong'],
    },
    {
      name: 'Find Remainder After Taking Fraction',
      description: 'Find how many are left after a fraction of the quantity is taken away.',
      difficulty: 3,
      fluencyTargetSeconds: 36,
      answerType: 'numeric',
      misconceptionTags: ['uses_wrong_operation', 'computes_fraction_wrong'],
    },
  ],
  'P4-WP-02': [
    {
      name: 'Two-Step Subtraction',
      description: 'Start with a total, subtract two amounts, find what remains (150–2500 range).',
      difficulty: 3,
      fluencyTargetSeconds: 44,
      answerType: 'numeric',
      misconceptionTags: ['stops_after_one_step', 'adds_instead_of_subtracts'],
    },
    {
      name: 'Two-Step Mixed Operations',
      description: 'Combine addition and subtraction across two steps to find a final amount (150–2500 range).',
      difficulty: 3,
      fluencyTargetSeconds: 48,
      answerType: 'numeric',
      misconceptionTags: ['stops_after_one_step', 'adds_instead_of_subtracts'],
    },
  ],
};

export const p4WordProbQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p4WordProbQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p4WordProbQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p4WordProbQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p4WordProbSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP4WordProbQuestionFamilies() {
  const ids = p4WordProbQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4WordProbQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4WordProbQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p4-word-problems',
  version: '1.0.0',
  totalSkills: p4WordProbSkillGraph.skillIds.length,
  totalQuestionFamilies: p4WordProbQuestionFamilies.length,
  families: p4WordProbQuestionFamilies,
};
