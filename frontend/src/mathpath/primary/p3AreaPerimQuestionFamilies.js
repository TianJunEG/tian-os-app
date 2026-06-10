import { p3AreaPerimSkillGraph } from './p3AreaPerimSkillGraph.js';

const SKILL_IDS = new Set(p3AreaPerimSkillGraph.skillIds);

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
  'P3-AP-01': [
    {
      name: 'Area of a Rectangle',
      description: 'Find the area of a rectangle given length and width.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_area_perimeter', 'adds_instead_of_multiplies', 'forgets_square_units'],
    },
    {
      name: 'Area of a Square',
      description: 'Find the area of a square given its side length.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_area_perimeter', 'forgets_square_units'],
    },
    {
      name: 'Find a Missing Side from Area',
      description: 'Given the area and one side of a rectangle, find the other side.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      misconceptionTags: ['confuses_area_perimeter'],
    },
  ],
  'P3-AP-02': [
    {
      name: 'Perimeter of a Rectangle',
      description: 'Find the perimeter of a rectangle given length and width.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_area_perimeter', 'forgets_two_pairs', 'only_adds_two_sides'],
    },
    {
      name: 'Perimeter of a Square',
      description: 'Find the perimeter of a square given its side length.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_area_perimeter'],
    },
    {
      name: 'Find a Missing Side from Perimeter',
      description: 'Given the perimeter and one side of a rectangle, find the other side.',
      difficulty: 3,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      misconceptionTags: ['forgets_two_pairs'],
    },
  ],
};

export const p3AreaPerimQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3AreaPerimQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3AreaPerimQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3AreaPerimQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3AreaPerimSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3AreaPerimQuestionFamilies() {
  const ids = p3AreaPerimQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3AreaPerimQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3AreaPerimQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-area-perimeter',
  version: '1.0.0',
  totalSkills: p3AreaPerimSkillGraph.skillIds.length,
  totalQuestionFamilies: p3AreaPerimQuestionFamilies.length,
  families: p3AreaPerimQuestionFamilies,
};
