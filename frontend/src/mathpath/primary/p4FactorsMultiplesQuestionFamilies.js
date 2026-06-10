import { p4FactorsMultiplesSkillGraph } from './p4FactorsMultiplesSkillGraph.js';

const SKILL_IDS = new Set(p4FactorsMultiplesSkillGraph.skillIds);

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
  'P4-FM-01': [
    {
      name: 'List All Factors',
      description: 'List all the factors of a given number (up to 48).',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['misses_factor_pair', 'forgets_1_is_a_factor'],
    },
    {
      name: 'Find Common Factors of Two Numbers',
      description: 'List the common factors of two numbers and identify the HCF.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_factors_and_multiples', 'misses_factor_pair'],
    },
    {
      name: 'Greatest Common Factor (HCF)',
      description: 'Find the greatest common factor of two numbers.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_factors_and_multiples'],
    },
  ],
  'P4-FM-02': [
    {
      name: 'List First N Multiples',
      description: 'List the first several multiples of a given 1-digit number.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_factors_and_multiples'],
    },
    {
      name: 'Find Common Multiples of Two Numbers',
      description: 'List common multiples of two 1-digit numbers up to a given limit.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['confuses_factors_and_multiples', 'stops_listing_too_early'],
    },
    {
      name: 'Lowest Common Multiple (LCM)',
      description: 'Find the lowest common multiple of two 1-digit numbers.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: false,
      workingRequired: true,
      misconceptionTags: ['multiplies_instead_of_finding_lcm'],
    },
  ],
};

export const p4FactorsMultiplesQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p4FactorsMultiplesQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p4FactorsMultiplesQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p4FactorsMultiplesQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4FactorsMultiplesSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP4FactorsMultiplesQuestionFamilies() {
  const ids = p4FactorsMultiplesQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p4FactorsMultiplesQuestionFamilies
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
    totalQuestionFamilies: p4FactorsMultiplesQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p4-factors-multiples',
  version: '1.0.0',
  totalSkills: p4FactorsMultiplesSkillGraph.skillIds.length,
  totalQuestionFamilies: p4FactorsMultiplesQuestionFamilies.length,
  families: p4FactorsMultiplesQuestionFamilies,
};
