import { p4FractionsSkillGraph } from './p4FractionsSkillGraph.js';
const SKILL_IDS = new Set(p4FractionsSkillGraph.skillIds);

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
  'P4-FR-01': [
    { name: 'Convert to Improper Fraction', description: 'Convert a mixed number to an improper fraction (numeric answer).', difficulty: 2, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['multiplies_whole_but_forgets_numerator'] },
    { name: 'Convert to Improper (Word Context)', description: 'Convert a mixed number to an improper fraction in a word-problem context.', difficulty: 2, fluencyTargetSeconds: 18, misconceptionTags: ['multiplies_whole_but_forgets_numerator'] },
  ],
  'P4-FR-02': [
    { name: 'Compute Fraction of a Set', description: 'Find the value of a fraction of a given number of objects.', difficulty: 2, fluencyTargetSeconds: 16, misconceptionTags: ['divides_set_by_numerator_not_denominator'] },
    { name: 'Fraction of a Set (Word Context)', description: 'Fraction-of-a-set presented in a word-problem scenario.', difficulty: 2, fluencyTargetSeconds: 20, misconceptionTags: ['divides_set_by_numerator_not_denominator'] },
  ],
  'P4-FR-03': [
    { name: 'Add Unlike Fractions', description: 'Add two fractions with different denominators and give the numerator over the LCD.', difficulty: 3, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'] },
    { name: 'Subtract Unlike Fractions', description: 'Subtract two fractions with different denominators and give the numerator over the LCD.', difficulty: 3, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'] },
    { name: 'Unlike Fractions (Word Context)', description: 'Add or subtract unlike fractions in a word-problem context.', difficulty: 3, fluencyTargetSeconds: 24, workingRequired: true, misconceptionTags: ['adds_unlike_numerators_directly', 'wrong_lcd'] },
  ],
};

export const p4FractionsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p4FractionsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p4FractionsQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p4FractionsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4FractionsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP4FractionsQuestionFamilies() {
  const ids = p4FractionsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4FractionsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4FractionsQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p4-fractions', version: '1.0.0', totalSkills: p4FractionsSkillGraph.skillIds.length, totalQuestionFamilies: p4FractionsQuestionFamilies.length, families: p4FractionsQuestionFamilies };
