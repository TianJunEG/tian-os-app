import { p6AlgebraSkillGraph } from './p6AlgebraSkillGraph.js';
const SKILL_IDS = new Set(p6AlgebraSkillGraph.skillIds);

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
  'P6-ALG-01': [
    { name: 'Simple Expression from Context', description: 'Write an algebraic expression for a real-world quantity using one variable and one operation.', difficulty: 3, fluencyTargetSeconds: 22, answerType: 'text', workingRequired: false, misconceptionTags: ['confuses_variable_with_label', 'confuses_expression_and_equation'] },
    { name: 'Simplify Like Terms', description: 'Simplify an expression by collecting like terms (e.g. 3x + 2x + 4).', difficulty: 4, fluencyTargetSeconds: 20, answerType: 'text', workingRequired: true, misconceptionTags: ['adds_unlike_terms'] },
    { name: 'Multi-part Expression', description: 'Form an expression involving two or more terms from a described situation (e.g. total cost of different items).', difficulty: 4, fluencyTargetSeconds: 28, answerType: 'text', workingRequired: true, misconceptionTags: ['confuses_variable_with_label', 'adds_unlike_terms'] },
  ],
  'P6-ALG-02': [
    { name: 'One-Step Equations', description: 'Solve equations requiring a single inverse operation (e.g. x + 7 = 15, 4x = 28, x/3 = 9).', difficulty: 3, fluencyTargetSeconds: 18, answerType: 'numeric', mentalMathEligible: true, misconceptionTags: ['forgets_inverse_operation'] },
    { name: 'Two-Step Equations', description: 'Solve equations requiring two inverse operations (e.g. 2x + 5 = 17, 3x - 4 = 14).', difficulty: 4, fluencyTargetSeconds: 25, answerType: 'numeric', workingRequired: true, misconceptionTags: ['wrong_order_of_inverse', 'sign_error_in_equation'] },
    { name: 'Equations with Brackets', description: 'Solve equations that include brackets (e.g. 2(x + 3) = 16).', difficulty: 5, fluencyTargetSeconds: 30, answerType: 'numeric', workingRequired: true, misconceptionTags: ['forgets_inverse_operation', 'wrong_order_of_inverse'] },
  ],
  'P6-ALG-03': [
    { name: 'Single-Unknown Word Problems', description: 'Form and solve an equation from a word problem involving one unknown quantity.', difficulty: 4, fluencyTargetSeconds: 35, answerType: 'numeric', workingRequired: true, misconceptionTags: ['writes_equation_backwards', 'ignores_units_in_algebra'] },
    { name: 'Before-and-After Word Problems', description: 'Form and solve an equation from a word problem where a quantity changes and a result is given.', difficulty: 5, fluencyTargetSeconds: 40, answerType: 'numeric', workingRequired: true, misconceptionTags: ['writes_equation_backwards', 'confuses_expression_and_equation'] },
    { name: 'Comparison Word Problems', description: 'Form and solve an equation from a word problem comparing two quantities using algebra.', difficulty: 5, fluencyTargetSeconds: 45, answerType: 'numeric', workingRequired: true, misconceptionTags: ['writes_equation_backwards', 'ignores_units_in_algebra'] },
  ],
};

export const p6AlgebraQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p6AlgebraQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6AlgebraQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6AlgebraQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6AlgebraSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {});
}

export function validateP6AlgebraQuestionFamilies() {
  const ids = p6AlgebraQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6AlgebraQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFamilies = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilies = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Invalid skill references.');
  if (noFamilies.length) errors.push('Skills with no families.');
  if (lowFamilies.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6AlgebraQuestionFamilies.length, familiesPerSkill: coverage, summary: { dupes, badRefs, noFamilies, lowFamilies }, errors };
}

export default { domainId: 'p6-algebra', version: '1.0.0', totalSkills: p6AlgebraSkillGraph.skillIds.length, totalQuestionFamilies: p6AlgebraQuestionFamilies.length, families: p6AlgebraQuestionFamilies };
