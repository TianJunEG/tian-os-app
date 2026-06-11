import { p5RatioSkillGraph } from './p5RatioSkillGraph.js';
const SKILL_IDS = new Set(p5RatioSkillGraph.skillIds);

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
  'P5-RAT-01': [
    { name: 'Simplify a Ratio', description: 'Express a ratio in its simplest form by dividing both terms by the HCF.', difficulty: 3, fluencyTargetSeconds: 16, workingRequired: true, answerType: 'text', misconceptionTags: ['forgets_to_simplify_ratio', 'adds_instead_of_divides_for_ratio'] },
    { name: 'Find Missing Term', description: 'Find the missing term in a pair of equivalent ratios.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['adds_instead_of_divides_for_ratio'] },
    { name: 'Express as a Ratio', description: 'Express two quantities as a ratio in simplest form.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, answerType: 'text', misconceptionTags: ['reverses_ratio_order', 'forgets_to_simplify_ratio'] },
  ],
  'P5-RAT-02': [
    { name: 'Fraction of the Total', description: 'Given a ratio a : b, express one part as a fraction of the total.', difficulty: 4, fluencyTargetSeconds: 18, workingRequired: true, answerType: 'text', misconceptionTags: ['confuses_ratio_with_fraction', 'divides_total_by_one_part'] },
    { name: 'Fraction of the Other Part', description: 'Given a ratio a : b, express one part as a fraction of the other.', difficulty: 4, fluencyTargetSeconds: 18, workingRequired: true, answerType: 'text', misconceptionTags: ['confuses_ratio_with_fraction', 'reverses_ratio_order'] },
    { name: 'From Fraction to Ratio', description: 'Given that one quantity is a fraction of the total, find the ratio.', difficulty: 4, fluencyTargetSeconds: 20, workingRequired: true, answerType: 'text', misconceptionTags: ['confuses_ratio_with_fraction'] },
  ],
  'P5-RAT-03': [
    { name: 'Share in a Given Ratio', description: 'Divide a quantity into two parts in a given ratio and find each share.', difficulty: 5, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['divides_total_by_one_part', 'adds_instead_of_divides_for_ratio'] },
    { name: 'Find Total from One Share', description: 'Given one share and the ratio, find the total quantity.', difficulty: 5, fluencyTargetSeconds: 25, workingRequired: true, misconceptionTags: ['divides_total_by_one_part'] },
    { name: 'Compare Quantities', description: 'Given a ratio and one quantity, find the other quantity or the difference.', difficulty: 5, fluencyTargetSeconds: 28, workingRequired: true, misconceptionTags: ['reverses_ratio_order', 'divides_total_by_one_part'] },
  ],
};

export const p5RatioQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5RatioQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5RatioQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5RatioQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5RatioSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5RatioQuestionFamilies() {
  const ids = p5RatioQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5RatioQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5RatioQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-ratio', version: '1.0.0', totalSkills: p5RatioSkillGraph.skillIds.length, totalQuestionFamilies: p5RatioQuestionFamilies.length, families: p5RatioQuestionFamilies };
