import { p6AreaVolSkillGraph } from './p6AreaVolSkillGraph.js';

const SKILL_IDS = new Set(p6AreaVolSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 20,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 85,
    masteryQuestionCount: config.masteryQuestionCount ?? 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? true,
    answerType: config.answerType ?? 'number',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(5, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P6-AV-01': [
    {
      name: 'L-Shape Composite Area',
      description: 'Find the area of an L-shaped figure by subtracting a rectangular cut-out from a larger rectangle.',
      difficulty: 4,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['confuses_area_perimeter', 'forgets_subtract_cutout'],
    },
    {
      name: 'T-Shape Composite Area',
      description: 'Find the area of a T-shaped figure formed by joining two rectangles.',
      difficulty: 4,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['uses_wrong_dimensions_for_composite', 'forgets_subtract_cutout'],
    },
    {
      name: 'Rectangle Plus Triangle Composite',
      description: 'Find the area of a composite figure formed by a rectangle with a right triangle attached.',
      difficulty: 5,
      fluencyTargetSeconds: 45,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['confuses_area_perimeter', 'uses_wrong_dimensions_for_composite'],
    },
  ],
  'P6-AV-02': [
    {
      name: 'Volume of a Cuboid',
      description: 'Calculate the volume of a cuboid given its three dimensions.',
      difficulty: 4,
      fluencyTargetSeconds: 25,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['volume_uses_area_formula'],
    },
    {
      name: 'Missing Dimension from Volume',
      description: 'Find a missing dimension of a cuboid given its volume and the other two dimensions.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['wrong_dimension_for_missing_side', 'volume_uses_area_formula'],
    },
    {
      name: 'Composite Solid Volume',
      description: 'Find the total volume of a solid formed by joining two cuboids.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['adds_volumes_incorrectly', 'volume_uses_area_formula'],
    },
  ],
  'P6-AV-03': [
    {
      name: 'Water Level Rise',
      description: 'Find the rise in water level when an object is fully submerged in a rectangular tank.',
      difficulty: 5,
      fluencyTargetSeconds: 45,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['water_rise_uses_total_volume', 'forgets_object_displaces_water'],
    },
    {
      name: 'Volume of Water in Tank',
      description: 'Calculate the volume of water in a rectangular tank given the water level.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['volume_uses_area_formula'],
    },
    {
      name: 'Fraction of Container Filled',
      description: 'Determine what fraction of a rectangular container is filled with water given the water height and container height.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['water_rise_uses_total_volume', 'forgets_object_displaces_water'],
    },
  ],
};

export const p6AreaVolQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p6AreaVolQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p6AreaVolQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p6AreaVolQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6AreaVolSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP6AreaVolQuestionFamilies() {
  const ids = p6AreaVolQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p6AreaVolQuestionFamilies
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
    totalQuestionFamilies: p6AreaVolQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p6-area-volume',
  version: '1.0.0',
  totalSkills: p6AreaVolSkillGraph.skillIds.length,
  totalQuestionFamilies: p6AreaVolQuestionFamilies.length,
  families: p6AreaVolQuestionFamilies,
};
