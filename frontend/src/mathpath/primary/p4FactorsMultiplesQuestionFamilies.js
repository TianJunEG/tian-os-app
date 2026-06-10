import { p4FactorsMultiplesSkillGraph } from './p4FactorsMultiplesSkillGraph.js';
const SKILL_IDS = new Set(p4FactorsMultiplesSkillGraph.skillIds);

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
  'P4-FM-01': [
    { name: 'List All Factors', description: 'List all the factors of a given number (up to 48).', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: true, misconceptionTags: ['misses_factor_pair', 'forgets_1_is_a_factor'] },
    { name: 'Find Common Factors', description: 'List the common factors of two numbers and identify the HCF.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['confuses_factors_and_multiples', 'misses_factor_pair'] },
    { name: 'Greatest Common Factor (HCF)', description: 'Find the greatest common factor of two numbers.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['confuses_factors_and_multiples'] },
  ],
  'P4-FM-02': [
    { name: 'List First N Multiples', description: 'Find the Nth multiple of a given 1-digit number.', difficulty: 2, fluencyTargetSeconds: 14, mentalMathEligible: true, misconceptionTags: ['confuses_factors_and_multiples'] },
    { name: 'Find Common Multiples', description: 'List common multiples of two 1-digit numbers up to a limit.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['confuses_factors_and_multiples', 'stops_listing_too_early'] },
    { name: 'Lowest Common Multiple (LCM)', description: 'Find the LCM of two 1-digit numbers.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['multiplies_instead_of_finding_lcm'] },
  ],
};

export const p4FactorsMultiplesQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p4FactorsMultiplesQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p4FactorsMultiplesQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p4FactorsMultiplesQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4FactorsMultiplesSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP4FactorsMultiplesQuestionFamilies() {
  const ids = p4FactorsMultiplesQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4FactorsMultiplesQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4FactorsMultiplesQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p4-factors-multiples', version: '1.0.0', totalSkills: p4FactorsMultiplesSkillGraph.skillIds.length, totalQuestionFamilies: p4FactorsMultiplesQuestionFamilies.length, families: p4FactorsMultiplesQuestionFamilies };
