import { p5GeometrySkillGraph } from './p5GeometrySkillGraph.js';
const SKILL_IDS = new Set(p5GeometrySkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`, skillId,
    name: config.name, description: config.description, difficulty: config.difficulty,
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
  'P5-GEO-01': [
    { name: 'Unknown Angle on a Straight Line', description: 'Given two angles on a straight line, find the third angle (sum = 180°).', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['forgets_angles_on_line_sum_180'] },
    { name: 'Vertically Opposite Angles', description: 'Given one angle formed by two intersecting lines, find the vertically opposite angle.', difficulty: 2, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['confuses_vertically_opposite_with_adjacent'] },
    { name: 'Unknown Angle at a Point', description: 'Given three angles at a point, find the fourth angle (sum = 360°).', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['forgets_angles_at_point_sum_360'] },
  ],
  'P5-GEO-02': [
    { name: 'Unknown Angle in a Triangle', description: 'Given two angles in a triangle, find the third angle (sum = 180°).', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['wrong_triangle_angle_sum'] },
    { name: 'Isosceles Triangle Unknown Angle', description: 'Find the unknown angle in an isosceles triangle given one base angle or the apex angle.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['forgets_isosceles_has_two_equal_angles'] },
    { name: 'Equilateral Triangle Properties', description: 'Verify or apply the property that all angles in an equilateral triangle are 60°.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['assumes_all_triangles_equilateral'] },
  ],
  'P5-GEO-03': [
    { name: 'Unknown Angle in a Parallelogram', description: 'Find unknown angles in a parallelogram using opposite-angles-equal and adjacent-angles-sum-to-180° properties.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['confuses_parallelogram_properties'] },
    { name: 'Rhombus Angle Properties', description: 'Find unknown angles in a rhombus using opposite-angles-equal and adjacent-angles-sum-to-180° properties.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['confuses_parallelogram_properties'] },
    { name: 'Angle Using Parallel Line Properties', description: 'Find unknown angles using co-interior angles on parallel lines (sum = 180°).', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['wrong_co_interior_angle_sum'] },
  ],
};

export const p5GeometryQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5GeometryQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5GeometryQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5GeometryQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5GeometrySkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5GeometryQuestionFamilies() {
  const ids = p5GeometryQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5GeometryQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5GeometryQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-geometry', version: '1.0.0', totalSkills: p5GeometrySkillGraph.skillIds.length, totalQuestionFamilies: p5GeometryQuestionFamilies.length, families: p5GeometryQuestionFamilies };
