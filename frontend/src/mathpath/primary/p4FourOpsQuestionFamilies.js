import { p4FourOpsSkillGraph } from './p4FourOpsSkillGraph.js';
const SKILL_IDS = new Set(p4FourOpsSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`, skillId,
    name: config.name, description: config.description, difficulty: config.difficulty,
    recommendedQuestionCount: 20, fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: 90, masteryQuestionCount: 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: true, mentalMathEligible: false,
    workingRequired: config.workingRequired ?? true,
    answerType: 'numeric',
    fluencyBenchmarks: {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const blueprint = {
  'P4-FO-01': [
    { name: '3-digit \u00d7 1-digit', description: 'Multiply a 3-digit number by a 1-digit number.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['carry_error_multiplication', 'times_table_slip'] },
    { name: '4-digit \u00d7 1-digit (no carry)', description: 'Multiply a 4-digit number by a 1-digit number with no carrying.', difficulty: 2, fluencyTargetSeconds: 20, misconceptionTags: ['times_table_slip'] },
    { name: '4-digit \u00d7 1-digit (with carry)', description: 'Multiply a 4-digit number by a 1-digit number with carrying.', difficulty: 3, fluencyTargetSeconds: 26, misconceptionTags: ['carry_error_multiplication', 'multiplies_only_ones'] },
  ],
  'P4-FO-02': [
    { name: '2-digit \u00d7 2-digit', description: 'Multiply a 2-digit number by a 2-digit number.', difficulty: 3, fluencyTargetSeconds: 26, misconceptionTags: ['forgets_tens_row_shift', 'partial_product_addition_error'] },
    { name: '3-digit \u00d7 2-digit (small)', description: 'Multiply a 3-digit number by a 2-digit number (smaller values).', difficulty: 3, fluencyTargetSeconds: 28, misconceptionTags: ['carry_error_multiplication', 'forgets_tens_row_shift'] },
    { name: '3-digit \u00d7 2-digit (large)', description: 'Multiply a 3-digit number by a 2-digit number (larger values).', difficulty: 4, fluencyTargetSeconds: 30, misconceptionTags: ['carry_error_multiplication', 'partial_product_addition_error'] },
  ],
  'P4-FO-03': [
    { name: '3-digit \u00f7 1-digit (exact)', description: 'Divide a 3-digit number by a 1-digit number with no remainder.', difficulty: 3, fluencyTargetSeconds: 24, misconceptionTags: ['division_direction_error'] },
    { name: '4-digit \u00f7 1-digit (exact)', description: 'Divide a 4-digit number by a 1-digit number with no remainder.', difficulty: 3, fluencyTargetSeconds: 30, misconceptionTags: ['skips_zero_in_quotient'] },
    { name: '4-digit \u00f7 1-digit (with remainder)', description: 'Divide a 4-digit number by a 1-digit number and state the remainder.', difficulty: 4, fluencyTargetSeconds: 30, misconceptionTags: ['division_remainder_confusion', 'skips_zero_in_quotient'] },
  ],
};

export const p4FourOpsQuestionFamilies = Object.entries(blueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);
const familyById = new Map(p4FourOpsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(sid) { return p4FourOpsQuestionFamilies.filter((f) => f.skillId === sid); }
export function getAllQuestionFamilies() { return [...p4FourOpsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() { return p4FourOpsSkillGraph.skillIds.reduce((a, s) => { a[s] = getQuestionFamiliesBySkill(s).length; return a; }, {}); }

export function validateP4FourOpsQuestionFamilies() {
  const ids = p4FourOpsQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4FourOpsQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId));
  const coverage = getQuestionFamilyCountsBySkill();
  const noFam = Object.entries(coverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFam = Object.entries(coverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));
  const errors = [];
  if (dupes.length) errors.push('Duplicate IDs.');
  if (badRefs.length) errors.push('Bad skill refs.');
  if (noFam.length) errors.push('Skills with no families.');
  if (lowFam.length) errors.push('Skills with < 2 families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4FourOpsQuestionFamilies.length, familiesPerSkill: coverage, errors };
}

export default { domainId: 'p4-four-operations', version: '1.0.0', totalSkills: p4FourOpsSkillGraph.skillIds.length, totalQuestionFamilies: p4FourOpsQuestionFamilies.length, families: p4FourOpsQuestionFamilies };
