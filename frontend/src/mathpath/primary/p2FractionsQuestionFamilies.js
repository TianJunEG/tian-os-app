import { p2FractionsSkillGraph } from './p2FractionsSkillGraph.js';

const SKILL_IDS = new Set(p2FractionsSkillGraph.skillIds);

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
  'P2-FR-01': [
    {
      name: 'Add Like Fractions',
      description: 'Add two fractions with the same denominator where the sum stays within one whole.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['adds_denominators', 'forgets_denominator_stays'],
    },
    {
      name: 'Subtract Like Fractions',
      description: 'Subtract two fractions with the same denominator.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['adds_denominators', 'forgets_denominator_stays'],
    },
    {
      name: 'Add or Subtract Like Fractions (word context)',
      description: 'Solve a simple word problem involving adding or subtracting like fractions.',
      difficulty: 2,
      fluencyTargetSeconds: 15,
      answerType: 'numeric',
      misconceptionTags: ['adds_denominators', 'fraction_greater_than_whole'],
    },
  ],
  'P2-FR-02': [
    {
      name: 'Shaded Parts to Fraction Numerator',
      description: 'Given a shape divided into equal parts with some shaded, identify the numerator of the fraction.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'numeric',
      misconceptionTags: ['confuses_numerator_denominator', 'counts_unshaded_instead'],
    },
    {
      name: 'Fraction to Number of Parts to Shade',
      description: 'Given a fraction, determine how many parts of the shape should be shaded.',
      difficulty: 1,
      fluencyTargetSeconds: 6,
      answerType: 'numeric',
      misconceptionTags: ['confuses_numerator_denominator', 'counts_unshaded_instead'],
    },
  ],
};

export const p2FractionsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(
  p2FractionsQuestionFamilies.map((family) => [family.id, family])
);

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return p2FractionsQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getAllQuestionFamilies() {
  return [...p2FractionsQuestionFamilies];
}

export function getQuestionFamilyCountsBySkill() {
  return p2FractionsSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function validateP2FractionsQuestionFamilies() {
  const ids = p2FractionsQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p2FractionsQuestionFamilies
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
    totalQuestionFamilies: p2FractionsQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage },
    errors,
  };
}

export default {
  domainId: 'p2-fractions',
  version: '1.0.0',
  totalSkills: p2FractionsSkillGraph.skillIds.length,
  totalQuestionFamilies: p2FractionsQuestionFamilies.length,
  families: p2FractionsQuestionFamilies,
};
