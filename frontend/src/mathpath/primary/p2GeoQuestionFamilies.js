import { p2GeoSkillGraph } from './p2GeoSkillGraph.js';

const SKILL_IDS = new Set(p2GeoSkillGraph.skillIds);

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
  'P2-GEO-01': [
    {
      name: 'Everyday Object to Solid Name',
      description: 'Given the name of an everyday object, identify the 3D solid it resembles.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_cube_cuboid', 'confuses_cone_cylinder'],
    },
    {
      name: 'Properties to Solid Name',
      description: 'Given a description of faces, edges, or shape properties, identify the 3D solid.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'text',
      misconceptionTags: ['confuses_cube_cuboid', 'confuses_2d_3d_names', 'confuses_cone_cylinder'],
    },
  ],
};

export const p2GeoQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2GeoQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2GeoQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2GeoQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2GeoSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2GeoQuestionFamilies() {
  const ids = p2GeoQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2GeoQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2GeoQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-geometry',
  version: '1.0.0',
  totalSkills: p2GeoSkillGraph.skillIds.length,
  totalQuestionFamilies: p2GeoQuestionFamilies.length,
  families: p2GeoQuestionFamilies,
};
