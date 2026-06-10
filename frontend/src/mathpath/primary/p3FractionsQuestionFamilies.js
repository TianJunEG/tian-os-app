import { p3FractionsSkillGraph } from './p3FractionsSkillGraph.js';

const SKILL_IDS = new Set(p3FractionsSkillGraph.skillIds);

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
  'P3-FR-01': [
    {
      name: 'Find Missing Numerator',
      description: 'Given a/b = ?/d where d is a multiple of b, find the missing numerator.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['multiplies_only_one_part', 'uses_additive_instead_of_multiplicative'],
    },
    {
      name: 'Find Missing Denominator',
      description: 'Given a/b = c/? where c is a multiple of a, find the missing denominator.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['divides_only_one_part', 'uses_additive_instead_of_multiplicative'],
    },
    {
      name: 'Are These Equivalent?',
      description: 'True or false: determine whether two given fractions are equivalent.',
      difficulty: 2,
      fluencyTargetSeconds: 10,
      answerType: 'choice',
      mentalMathEligible: true,
      misconceptionTags: ['multiplies_only_one_part'],
    },
  ],
  'P3-FR-02': [
    {
      name: 'Add Related Fractions',
      description: 'Add two fractions where one denominator is a multiple of the other; give the numerator of the answer.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['adds_unlike_numerators_directly', 'wrong_common_denominator'],
    },
    {
      name: 'Subtract Related Fractions',
      description: 'Subtract two related fractions (larger minus smaller); give the numerator of the answer.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['adds_unlike_numerators_directly', 'forgets_to_rename_numerator'],
    },
    {
      name: 'Add or Subtract Related Fractions (Word Context)',
      description: 'Solve a word problem involving adding or subtracting related fractions.',
      difficulty: 3,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['adds_unlike_numerators_directly', 'wrong_common_denominator', 'forgets_to_rename_numerator'],
    },
  ],
};

export const p3FractionsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p3FractionsQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p3FractionsQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p3FractionsQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p3FractionsSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP3FractionsQuestionFamilies() {
  const ids = p3FractionsQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p3FractionsQuestionFamilies
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
    totalQuestionFamilies: p3FractionsQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage },
    errors,
  };
}

export default {
  domainId: 'p3-fractions',
  version: '1.0.0',
  totalSkills: p3FractionsSkillGraph.skillIds.length,
  totalQuestionFamilies: p3FractionsQuestionFamilies.length,
  families: p3FractionsQuestionFamilies,
};
