import { p5WholeNumbersSkillGraph } from './p5WholeNumbersSkillGraph.js';
const SKILL_IDS = new Set(p5WholeNumbersSkillGraph.skillIds);

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
  'P5-WN-01': [
    { name: 'Digit Value in Large Numbers', description: 'Identify the value of a digit in a number up to 10 million.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['confuses_place_value_names', 'wrong_digit_value'] },
    { name: 'Word to Numeral Conversion', description: 'Write a number in numerals given its word form (up to millions).', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['omits_zeros_in_word_form'] },
    { name: 'Expanded Form', description: 'Express a number in expanded form or compose from expanded notation.', difficulty: 2, fluencyTargetSeconds: 15, misconceptionTags: ['confuses_place_value_names'] },
  ],
  'P5-WN-02': [
    { name: 'Round to Nearest 1000', description: 'Round a number to the nearest thousand.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: true, misconceptionTags: ['rounds_wrong_direction', 'rounds_to_wrong_place'] },
    { name: 'Round to Nearest 10 000', description: 'Round a number to the nearest ten thousand.', difficulty: 3, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['rounds_wrong_direction', 'rounds_to_wrong_place'] },
    { name: 'Estimate by Rounding', description: 'Estimate the result of an expression by rounding first.', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['truncates_instead_of_rounding'] },
  ],
  'P5-WN-03': [
    { name: 'Two-Operation Expression', description: 'Evaluate an expression with two operations (e.g. a + b × c).', difficulty: 3, fluencyTargetSeconds: 18, workingRequired: true, misconceptionTags: ['left_to_right_ignoring_precedence'] },
    { name: 'Expression with Brackets', description: 'Evaluate an expression containing brackets.', difficulty: 4, fluencyTargetSeconds: 22, workingRequired: true, misconceptionTags: ['forgets_brackets_first'] },
    { name: 'Three-Operation Expression', description: 'Evaluate an expression with three or more operations and brackets.', difficulty: 4, fluencyTargetSeconds: 28, workingRequired: true, misconceptionTags: ['left_to_right_ignoring_precedence', 'wrong_division_in_chain'] },
  ],
};

export const p5WholeNumbersQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p5WholeNumbersQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p5WholeNumbersQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p5WholeNumbersQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5WholeNumbersSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP5WholeNumbersQuestionFamilies() {
  const ids = p5WholeNumbersQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p5WholeNumbersQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p5WholeNumbersQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p5-wholenumbers', version: '1.0.0', totalSkills: p5WholeNumbersSkillGraph.skillIds.length, totalQuestionFamilies: p5WholeNumbersQuestionFamilies.length, families: p5WholeNumbersQuestionFamilies };
