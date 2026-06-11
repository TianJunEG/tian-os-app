import { p4FractionsSkillGraph } from './p4FractionsSkillGraph.js';
const SKILL_IDS = new Set(p4FractionsSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`, skillId,
    name: config.name, description: config.description, difficulty: config.difficulty,
    recommendedQuestionCount: 20, fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: 90, masteryQuestionCount: 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: true, mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? true,
    answerType: config.answerType ?? 'numeric',
    fluencyBenchmarks: {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const blueprint = {
  'P4-FR-01': [
    { name: 'Mixed \u2192 improper', description: 'Convert a mixed number to an improper fraction.', difficulty: 3, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['mixed_to_improper_add_error'] },
    { name: 'Improper \u2192 mixed', description: 'Convert an improper fraction to a mixed number.', difficulty: 3, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['improper_to_mixed_remainder_error'] },
    { name: 'Compare forms', description: 'Determine if a mixed number equals a given improper fraction.', difficulty: 3, fluencyTargetSeconds: 16, answerType: 'mcq', misconceptionTags: ['mixed_to_improper_add_error'] },
  ],
  'P4-FR-02': [
    { name: 'Unit fraction of set', description: 'Find 1/n of a set.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['fraction_of_set_forgets_multiply'] },
    { name: 'Non-unit fraction of set', description: 'Find a/b of a set where a > 1.', difficulty: 3, fluencyTargetSeconds: 16, misconceptionTags: ['fraction_of_set_divides_by_numerator'] },
    { name: 'Word problem context', description: 'Solve fraction-of-set word problem.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['fraction_of_set_divides_by_numerator'] },
  ],
  'P4-FR-03': [
    { name: 'Add unlike fractions', description: 'Add two fractions with different denominators.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['adds_denominators', 'wrong_common_denominator'] },
    { name: 'Subtract unlike fractions', description: 'Subtract two fractions with different denominators.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['adds_denominators'] },
    { name: 'Add/sub with simplify', description: 'Add or subtract and simplify result.', difficulty: 4, fluencyTargetSeconds: 22, misconceptionTags: ['forgets_to_simplify'] },
  ],
};

export const p4FractionsQuestionFamilies = Object.entries(blueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p4FractionsQuestionFamilies.map((f) => [f.id, f]));
export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(sid) { return p4FractionsQuestionFamilies.filter((f) => f.skillId === sid); }
export function getAllQuestionFamilies() { return [...p4FractionsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() { return p4FractionsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {}); }

export function validateP4FractionsQuestionFamilies() {
  const ids = p4FractionsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4FractionsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId));
  const coverage = getQuestionFamilyCountsBySkill();
  const errors = [];
  if (dupes.length) errors.push('Duplicate IDs.');
  if (badRefs.length) errors.push('Bad skill refs.');
  if (Object.values(coverage).some((c) => c === 0)) errors.push('Skills with no families.');
  if (Object.values(coverage).some((c) => c < 2)) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4FractionsQuestionFamilies.length, familiesPerSkill: coverage, errors };
}

export default { domainId: 'p4-fractions', version: '1.0.0', totalSkills: p4FractionsSkillGraph.skillIds.length, totalQuestionFamilies: p4FractionsQuestionFamilies.length, families: p4FractionsQuestionFamilies };
