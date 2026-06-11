import { p6FractionsSkillGraph } from './p6FractionsSkillGraph.js';
const SKILL_IDS = new Set(p6FractionsSkillGraph.skillIds);

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
  'P6-FR-01': [
    { name: 'Mixed Number Multiplication', description: 'Multiply a mixed number by a whole number (e.g. 2 3/4 × 4).', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['forgets_to_convert_mixed', 'incorrect_mixed_to_improper', 'forgets_to_simplify'] },
    { name: 'Fraction Division', description: 'Divide a fraction by a whole number or a whole number by a fraction.', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['wrong_reciprocal_in_division', 'forgets_to_simplify'] },
    { name: 'Mixed Number ÷ Fraction', description: 'Divide a mixed number by a proper fraction.', difficulty: 4, fluencyTargetSeconds: 30, workingRequired: true, misconceptionTags: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division', 'incorrect_mixed_to_improper'] },
  ],
  'P6-FR-02': [
    { name: 'Spend & Remainder', description: 'Multi-step: spend a fraction, then a fraction of remainder on something else. Find how much was spent on the second item.', difficulty: 4, fluencyTargetSeconds: 40, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'wrong_common_denominator'] },
    { name: 'Share Among Friends', description: 'A quantity is shared: a fraction to one person, a fraction of remainder to another. Find how much one person gets.', difficulty: 4, fluencyTargetSeconds: 40, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'forgets_to_simplify'] },
    { name: 'Two-Step Fraction of Quantity', description: 'Find a fraction of a quantity then perform a second operation on the result.', difficulty: 4, fluencyTargetSeconds: 35, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'wrong_common_denominator'] },
  ],
  'P6-FR-03': [
    { name: 'Sold Then Gave Away', description: 'Fraction-of-remainder chain: sold a/b, then gave c/d of the remainder. Find how many are left.', difficulty: 5, fluencyTargetSeconds: 50, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'] },
    { name: 'Three-Step Remainder Chain', description: 'Three successive fraction-of-remainder steps. Find the final leftover.', difficulty: 5, fluencyTargetSeconds: 55, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole', 'forgets_to_simplify'] },
    { name: 'Remainder Chain — Find Original', description: 'Given the final leftover count, work backwards to find the original total.', difficulty: 5, fluencyTargetSeconds: 55, workingRequired: true, misconceptionTags: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'] },
  ],
};

export const p6FractionsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p6FractionsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6FractionsQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6FractionsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6FractionsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP6FractionsQuestionFamilies() {
  const ids = p6FractionsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6FractionsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6FractionsQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p6-fractions', version: '1.0.0', totalSkills: p6FractionsSkillGraph.skillIds.length, totalQuestionFamilies: p6FractionsQuestionFamilies.length, families: p6FractionsQuestionFamilies };
