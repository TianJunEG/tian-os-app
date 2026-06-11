import { p5FractionsSkillGraph } from './p5FractionsSkillGraph.js';
const SKILL_IDS = new Set(p5FractionsSkillGraph.skillIds);

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
    answerType: config.answerType ?? 'text',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P5-FR-01': [
    { name: 'Add Unlike Fractions', description: 'Add two proper fractions with unlike denominators and simplify.', difficulty: 3, fluencyTargetSeconds: 22, workingRequired: true, answerType: 'text', misconceptionTags: ['adds_numerators_and_denominators', 'forgets_to_find_lcd'] },
    { name: 'Subtract Unlike Fractions', description: 'Subtract two proper fractions with unlike denominators and simplify.', difficulty: 3, fluencyTargetSeconds: 22, workingRequired: true, answerType: 'text', misconceptionTags: ['adds_numerators_and_denominators', 'forgets_to_find_lcd'] },
    { name: 'Mixed Number Add/Subtract', description: 'Add or subtract mixed numbers with unlike denominators.', difficulty: 4, fluencyTargetSeconds: 30, workingRequired: true, answerType: 'text', misconceptionTags: ['wrong_mixed_number_conversion', 'forgets_to_find_lcd', 'forgets_to_simplify'] },
  ],
  'P5-FR-02': [
    { name: 'Fraction of Whole (Simple)', description: 'Find a unit or simple fraction of a whole number, e.g. 2/3 of 12.', difficulty: 3, fluencyTargetSeconds: 16, workingRequired: true, answerType: 'number', misconceptionTags: ['multiplies_whole_by_both_num_and_den'] },
    { name: 'Fraction of Quantity', description: 'Find a fraction of a larger quantity, e.g. 3/5 of 45.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, answerType: 'number', misconceptionTags: ['multiplies_whole_by_both_num_and_den', 'forgets_to_simplify'] },
    { name: 'Mixed Number Times Whole', description: 'Multiply a mixed number by a whole number, e.g. 1 2/3 × 6.', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, answerType: 'number', misconceptionTags: ['wrong_mixed_number_conversion', 'multiplies_whole_by_both_num_and_den'] },
  ],
  'P5-FR-03': [
    { name: 'Fraction Times Fraction', description: 'Multiply two proper fractions and simplify.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, answerType: 'text', misconceptionTags: ['adds_numerators_and_denominators', 'forgets_to_simplify'] },
    { name: 'Whole Divided by Fraction', description: 'Divide a whole number by a proper fraction, e.g. 6 ÷ 2/3.', difficulty: 5, fluencyTargetSeconds: 25, workingRequired: true, answerType: 'number', misconceptionTags: ['inverts_wrong_fraction_in_division'] },
    { name: 'Fraction Divided by Whole', description: 'Divide a proper fraction by a whole number and simplify.', difficulty: 4, fluencyTargetSeconds: 22, workingRequired: true, answerType: 'text', misconceptionTags: ['inverts_wrong_fraction_in_division', 'forgets_to_simplify'] },
  ],
};

export const p5FractionsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5FractionsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5FractionsQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5FractionsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5FractionsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5FractionsQuestionFamilies() {
  const ids = p5FractionsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5FractionsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5FractionsQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-fractions', version: '1.0.0', totalSkills: p5FractionsSkillGraph.skillIds.length, totalQuestionFamilies: p5FractionsQuestionFamilies.length, families: p5FractionsQuestionFamilies };
