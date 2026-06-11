import { p6CirclesSkillGraph } from './p6CirclesSkillGraph.js';
const SKILL_IDS = new Set(p6CirclesSkillGraph.skillIds);

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
  'P6-CIR-01': [
    { name: 'Circumference from Diameter', description: 'Find the circumference of a circle given its diameter. (Take π = 22/7)', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['uses_diameter_as_radius', 'pi_approximation_error'] },
    { name: 'Circumference from Radius', description: 'Find the circumference of a circle given its radius. (Take π = 22/7)', difficulty: 4, fluencyTargetSeconds: 22, workingRequired: true, misconceptionTags: ['uses_diameter_as_radius', 'pi_approximation_error'] },
    { name: 'Circumference with π = 3.14', description: 'Find the circumference of a circle using π = 3.14.', difficulty: 4, fluencyTargetSeconds: 24, workingRequired: true, misconceptionTags: ['pi_approximation_error', 'confuses_circumference_area_formulas'] },
  ],
  'P6-CIR-02': [
    { name: 'Area from Radius', description: 'Find the area of a circle given its radius. (Take π = 22/7)', difficulty: 4, fluencyTargetSeconds: 22, workingRequired: true, misconceptionTags: ['area_uses_diameter_not_radius', 'confuses_circumference_area_formulas'] },
    { name: 'Area from Diameter', description: 'Find the area of a circle given its diameter. (Take π = 22/7)', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['area_uses_diameter_not_radius', 'pi_approximation_error'] },
    { name: 'Area with π = 3.14', description: 'Find the area of a circle using π = 3.14.', difficulty: 4, fluencyTargetSeconds: 26, workingRequired: true, misconceptionTags: ['area_uses_diameter_not_radius', 'pi_approximation_error'] },
  ],
  'P6-CIR-03': [
    { name: 'Perimeter of Semicircle', description: 'Find the perimeter of a semicircle (half the circumference plus the diameter). (Take π = 22/7)', difficulty: 5, fluencyTargetSeconds: 30, workingRequired: true, misconceptionTags: ['forgets_straight_edge_in_semicircle', 'forgets_to_halve_for_semicircle'] },
    { name: 'Area of Quadrant', description: 'Find the area of a quarter-circle (quadrant). (Take π = 22/7)', difficulty: 5, fluencyTargetSeconds: 30, workingRequired: true, misconceptionTags: ['wrong_fraction_for_quadrant', 'area_uses_diameter_not_radius'] },
    { name: 'Composite Square with Semicircles', description: 'Find the perimeter or area of a composite figure made of a square with semicircles. (Take π = 22/7)', difficulty: 5, fluencyTargetSeconds: 40, workingRequired: true, misconceptionTags: ['adds_full_circumference_to_semicircle', 'forgets_straight_edge_in_semicircle', 'forgets_to_halve_for_semicircle'] },
  ],
};

export const p6CirclesQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p6CirclesQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6CirclesQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6CirclesQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6CirclesSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP6CirclesQuestionFamilies() {
  const ids = p6CirclesQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6CirclesQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6CirclesQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p6-circles', version: '1.0.0', totalSkills: p6CirclesSkillGraph.skillIds.length, totalQuestionFamilies: p6CirclesQuestionFamilies.length, families: p6CirclesQuestionFamilies };
