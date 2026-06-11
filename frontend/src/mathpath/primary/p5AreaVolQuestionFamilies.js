import { p5AreaVolSkillGraph } from './p5AreaVolSkillGraph.js';
const SKILL_IDS = new Set(p5AreaVolSkillGraph.skillIds);

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
  'P5-AV-01': [
    { name: 'Triangle Area (base × height)', description: 'Calculate the area of a triangle given base and height using 1/2 × base × height.', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['forgets_half_for_triangle_area', 'confuses_base_and_height'] },
    { name: 'Triangle Find Missing Dimension', description: 'Given the area and one dimension of a triangle, find the missing base or height.', difficulty: 3, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['forgets_half_for_triangle_area'] },
    { name: 'Right-Triangle Area', description: 'Calculate the area of a right-angled triangle using its two perpendicular sides.', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['forgets_half_for_triangle_area', 'confuses_area_and_perimeter'] },
  ],
  'P5-AV-02': [
    { name: 'Cuboid Volume', description: 'Calculate the volume of a cuboid given length, width and height.', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'] },
    { name: 'Cube Volume', description: 'Calculate the volume of a cube given its side length.', difficulty: 2, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['uses_wrong_volume_formula'] },
    { name: 'Find Missing Dimension', description: 'Given the volume and two dimensions, find the missing dimension.', difficulty: 3, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'] },
  ],
  'P5-AV-03': [
    { name: 'L-Shaped Figure Area', description: 'Find the area of an L-shaped figure by splitting into two rectangles.', difficulty: 3, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['confuses_area_and_perimeter'] },
    { name: 'Area with Triangle Cut Out', description: 'Find the area of a rectangle with a triangular section removed.', difficulty: 4, fluencyTargetSeconds: 28, workingRequired: true, misconceptionTags: ['forgets_half_for_triangle_area', 'confuses_area_and_perimeter'] },
    { name: 'Combined Cuboid Volume', description: 'Find the total volume of two joined cuboids.', difficulty: 3, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'] },
  ],
};

export const p5AreaVolQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5AreaVolQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5AreaVolQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5AreaVolQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5AreaVolSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5AreaVolQuestionFamilies() {
  const ids = p5AreaVolQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5AreaVolQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5AreaVolQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-areavol', version: '1.0.0', totalSkills: p5AreaVolSkillGraph.skillIds.length, totalQuestionFamilies: p5AreaVolQuestionFamilies.length, families: p5AreaVolQuestionFamilies };
