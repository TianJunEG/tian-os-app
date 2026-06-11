import { p6GeometrySkillGraph } from './p6GeometrySkillGraph.js';

const SKILL_IDS = new Set(p6GeometrySkillGraph.skillIds);

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
    answerType: config.answerType ?? 'number',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P6-GEO-01': [
    {
      name: 'Corresponding Angles',
      description: 'Given one angle at a transversal-parallel-line intersection, find its corresponding angle.',
      difficulty: 4,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      misconceptionTags: ['confuses_corresponding_alternate', 'forgets_co_interior_sum'],
    },
    {
      name: 'Alternate Angles',
      description: 'Given one angle at a transversal-parallel-line intersection, find its alternate angle.',
      difficulty: 4,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      misconceptionTags: ['confuses_corresponding_alternate', 'confuses_supplementary_complementary'],
    },
    {
      name: 'Co-interior Angles',
      description: 'Given one co-interior angle at a transversal-parallel-line intersection, find the other co-interior angle.',
      difficulty: 4,
      fluencyTargetSeconds: 25,
      answerType: 'number',
      misconceptionTags: ['forgets_co_interior_sum', 'confuses_supplementary_complementary'],
    },
  ],
  'P6-GEO-02': [
    {
      name: 'Parallelogram Opposite Angles',
      description: 'Given one angle of a parallelogram, find the opposite angle or an adjacent angle.',
      difficulty: 4,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      misconceptionTags: ['assumes_all_angles_equal_in_parallelogram', 'wrong_angle_sum_quadrilateral'],
    },
    {
      name: 'Parallelogram Adjacent Angles',
      description: 'Given one angle of a parallelogram, find the adjacent (supplementary) angle.',
      difficulty: 4,
      fluencyTargetSeconds: 22,
      answerType: 'number',
      misconceptionTags: ['assumes_all_angles_equal_in_parallelogram', 'confuses_supplementary_complementary'],
    },
    {
      name: 'Trapezium Angle Sum',
      description: 'Given three angles of a trapezium, find the fourth angle using the 360° angle sum.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      misconceptionTags: ['wrong_angle_sum_quadrilateral'],
    },
  ],
  'P6-GEO-03': [
    {
      name: 'Isosceles Triangle with Parallelogram',
      description: 'Multi-step: find an unknown angle using isosceles triangle base angles and parallelogram properties.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      workingRequired: true,
      answerType: 'number',
      misconceptionTags: ['forgets_isosceles_base_angles', 'assumes_all_angles_equal_in_parallelogram'],
    },
    {
      name: 'Angles on a Straight Line with Vertically Opposite',
      description: 'Multi-step: combine angles on a straight line (180°) and vertically opposite angles to find unknowns.',
      difficulty: 5,
      fluencyTargetSeconds: 35,
      workingRequired: true,
      answerType: 'number',
      misconceptionTags: ['vertically_opposite_adds_to_180', 'straight_line_angle_wrong_pair'],
    },
    {
      name: 'Triangle Angle Sum with Exterior Angle',
      description: 'Multi-step: use triangle angle sum and the exterior-angle theorem to find unknown angles.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      workingRequired: true,
      answerType: 'number',
      misconceptionTags: ['triangle_exterior_angle_error', 'straight_line_angle_wrong_pair'],
    },
  ],
};

export const p6GeometryQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p6GeometryQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6GeometryQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6GeometryQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p6GeometrySkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP6GeometryQuestionFamilies() {
  const ids = p6GeometryQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6GeometryQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6GeometryQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p6-geometry',
  version: '1.0.0',
  totalSkills: p6GeometrySkillGraph.skillIds.length,
  totalQuestionFamilies: p6GeometryQuestionFamilies.length,
  families: p6GeometryQuestionFamilies,
};
