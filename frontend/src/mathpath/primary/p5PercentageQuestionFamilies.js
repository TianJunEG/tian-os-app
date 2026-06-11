import { p5PercentageSkillGraph } from './p5PercentageSkillGraph.js';
const SKILL_IDS = new Set(p5PercentageSkillGraph.skillIds);

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
  'P5-PCT-01': [
    { name: 'Percent to Fraction (Simplified)', description: 'Convert a percentage to a fraction in simplest form.', difficulty: 3, fluencyTargetSeconds: 14, workingRequired: true, answerType: 'fraction', misconceptionTags: ['forgets_to_simplify_percent_fraction', 'divides_by_wrong_base_for_percent'] },
    { name: 'Percent to Decimal', description: 'Convert a percentage to its decimal equivalent.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['moves_decimal_wrong_way'] },
    { name: 'Fraction/Decimal to Percent', description: 'Convert a fraction or decimal to a percentage.', difficulty: 3, fluencyTargetSeconds: 14, workingRequired: true, misconceptionTags: ['moves_decimal_wrong_way', 'divides_by_wrong_base_for_percent'] },
  ],
  'P5-PCT-02': [
    { name: 'Find X% of Y', description: 'Calculate a given percentage of a whole number.', difficulty: 3, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['divides_by_wrong_base_for_percent', 'moves_decimal_wrong_way'] },
    { name: 'Find What Percentage', description: 'Determine what percentage one number is of another.', difficulty: 4, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['divides_by_wrong_base_for_percent', 'finds_percent_of_wrong_total'] },
    { name: 'Find the Whole from a Percentage', description: 'Given a part and its percentage, find the whole.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, misconceptionTags: ['divides_by_wrong_base_for_percent', 'finds_percent_of_wrong_total'] },
  ],
  'P5-PCT-03': [
    { name: 'Spending/Saving Word Problems', description: 'Multi-step problems involving spending or saving a percentage and finding the remainder.', difficulty: 4, fluencyTargetSeconds: 30, workingRequired: true, misconceptionTags: ['finds_percent_of_wrong_total', 'confuses_percent_increase_with_percent_of'] },
    { name: 'Composition Percentage Problems', description: 'Problems where items are split by percentages and a remaining quantity must be found.', difficulty: 5, fluencyTargetSeconds: 35, workingRequired: true, misconceptionTags: ['finds_percent_of_wrong_total', 'confuses_percent_increase_with_percent_of'] },
    { name: 'Discount and Increase Problems', description: 'Problems involving percentage discounts or increases on prices or quantities.', difficulty: 5, fluencyTargetSeconds: 35, workingRequired: true, misconceptionTags: ['confuses_percent_increase_with_percent_of', 'finds_percent_of_wrong_total'] },
  ],
};

export const p5PercentageQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5PercentageQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5PercentageQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5PercentageQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5PercentageSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5PercentageQuestionFamilies() {
  const ids = p5PercentageQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5PercentageQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5PercentageQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-percentage', version: '1.0.0', totalSkills: p5PercentageSkillGraph.skillIds.length, totalQuestionFamilies: p5PercentageQuestionFamilies.length, families: p5PercentageQuestionFamilies };
