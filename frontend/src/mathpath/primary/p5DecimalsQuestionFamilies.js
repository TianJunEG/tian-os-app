import { p5DecimalsSkillGraph } from './p5DecimalsSkillGraph.js';
const SKILL_IDS = new Set(p5DecimalsSkillGraph.skillIds);

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
  'P5-DEC-01': [
    { name: 'Identify Digit Value', description: 'Identify the value of a digit in a decimal number up to 3 decimal places.', difficulty: 2, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['ignores_decimal_point_in_comparison'] },
    { name: 'Round to 1 Decimal Place', description: 'Round a number with 2 or 3 decimal places to 1 decimal place.', difficulty: 3, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['rounds_wrong_direction', 'forgets_trailing_zeros'] },
    { name: 'Round to 2 Decimal Places', description: 'Round a number with 3 decimal places to 2 decimal places.', difficulty: 3, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['rounds_wrong_direction'] },
  ],
  'P5-DEC-02': [
    { name: 'Add & Subtract Decimals', description: 'Add or subtract two decimals with up to 2 decimal places.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['misaligns_decimal_points_adding', 'forgets_trailing_zeros'] },
    { name: 'Multiply Decimal by Whole Number', description: 'Multiply a decimal (up to 2dp) by a single-digit whole number.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['moves_decimal_wrong_direction_multiplying'] },
    { name: 'Divide Decimal by Whole Number', description: 'Divide a decimal by a single-digit whole number with an exact decimal result.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['moves_decimal_wrong_direction_multiplying', 'forgets_trailing_zeros'] },
  ],
  'P5-DEC-03': [
    { name: 'Fraction to Decimal', description: 'Convert a common fraction (denominator 2, 4, 5, 8, 10, 20, 25) to a decimal.', difficulty: 3, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['confuses_fraction_decimal_conversion'] },
    { name: 'Decimal to Fraction', description: 'Convert a terminating decimal to a fraction in simplest form.', difficulty: 3, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['confuses_fraction_decimal_conversion'] },
    { name: 'Mixed Conversion', description: 'Convert between mixed numbers and decimals, or compare a fraction with a decimal.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['confuses_fraction_decimal_conversion', 'forgets_trailing_zeros'] },
  ],
};

export const p5DecimalsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5DecimalsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5DecimalsQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5DecimalsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5DecimalsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5DecimalsQuestionFamilies() {
  const ids = p5DecimalsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5DecimalsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5DecimalsQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-decimals', version: '1.0.0', totalSkills: p5DecimalsSkillGraph.skillIds.length, totalQuestionFamilies: p5DecimalsQuestionFamilies.length, families: p5DecimalsQuestionFamilies };
