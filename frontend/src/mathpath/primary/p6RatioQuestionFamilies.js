import { p6RatioSkillGraph } from './p6RatioSkillGraph.js';
const SKILL_IDS = new Set(p6RatioSkillGraph.skillIds);

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
    answerType: config.answerType ?? 'number',
    visualRequirement: config.visualRequirement ?? undefined,
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P6-RAT-01': [
    { name: 'Simplify a Ratio', description: 'Express a two-term ratio in its simplest form.', difficulty: 4, fluencyTargetSeconds: 15, answerType: 'text', mentalMathEligible: true, misconceptionTags: ['simplifies_only_one_term', 'ratio_order_reversed'] },
    { name: 'Find Missing Term in Equivalent Ratio', description: 'Given a : b = c : ?, find the missing term.', difficulty: 4, fluencyTargetSeconds: 18, answerType: 'number', mentalMathEligible: true, misconceptionTags: ['ratio_order_reversed'] },
    { name: 'Three-Quantity Ratio', description: 'Express a three-quantity ratio in simplest form.', difficulty: 4, fluencyTargetSeconds: 20, answerType: 'text', misconceptionTags: ['simplifies_only_one_term', 'three_quantity_ratio_error'] },
  ],
  'P6-RAT-02': [
    { name: 'Share in a Given Ratio', description: 'Share an amount between two people in a given ratio.', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['divides_by_wrong_total', 'forgets_ratio_sum'] },
    { name: 'Find Total from Ratio', description: 'Given a ratio and one share, find the total.', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['forgets_ratio_sum', 'confuses_ratio_fraction'] },
    { name: 'Ratio with Total Given', description: 'Given a ratio and total, find how many of one type.', difficulty: 4, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['divides_by_wrong_total', 'forgets_ratio_sum'] },
  ],
  'P6-RAT-03': [
    { name: 'Before-After: One Person Spends', description: 'Ratio changes after one person spends or loses an amount. Find original amounts.', difficulty: 5, fluencyTargetSeconds: 45, workingRequired: true, misconceptionTags: ['before_after_wrong_constant', 'subtracts_ratio_parts'] },
    { name: 'Before-After: One Person Receives', description: 'Ratio changes after one person receives an amount. Find original or new amounts.', difficulty: 5, fluencyTargetSeconds: 45, workingRequired: true, misconceptionTags: ['before_after_wrong_constant', 'subtracts_ratio_parts'] },
    { name: 'Before-After: Transfer Between Two', description: 'An amount is transferred from one person to another, changing the ratio. Find original amounts.', difficulty: 5, fluencyTargetSeconds: 50, workingRequired: true, misconceptionTags: ['before_after_wrong_constant', 'confuses_ratio_fraction'] },
  ],
};

export const p6RatioQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p6RatioQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6RatioQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6RatioQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6RatioSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP6RatioQuestionFamilies() {
  const ids = p6RatioQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6RatioQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6RatioQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p6-ratio', version: '1.0.0', totalSkills: p6RatioSkillGraph.skillIds.length, totalQuestionFamilies: p6RatioQuestionFamilies.length, families: p6RatioQuestionFamilies };
