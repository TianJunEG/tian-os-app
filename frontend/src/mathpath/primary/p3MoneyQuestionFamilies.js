import { p3MoneySkillGraph } from './p3MoneySkillGraph.js';

const SKILL_IDS = new Set(p3MoneySkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
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
  'P3-MON-01': [
    {
      name: 'Add Two Money Amounts (no carry in cents)',
      description: 'Add two money amounts in decimal notation where the cents do not exceed 99.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['decimal_alignment_error', 'drops_cents'],
    },
    {
      name: 'Add Two Money Amounts (carry from cents)',
      description: 'Add two money amounts where the cents total 100 or more, requiring a carry.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['decimal_alignment_error', 'drops_cents', 'dollar_sign_error'],
    },
    {
      name: 'Subtract Two Money Amounts (no borrow)',
      description: 'Subtract a smaller money amount from a larger one with no borrowing in the cents.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['decimal_alignment_error', 'drops_cents'],
    },
    {
      name: 'Subtract Two Money Amounts (borrow from dollars)',
      description: 'Subtract money amounts where borrowing from dollars to cents is needed.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['decimal_alignment_error', 'drops_cents', 'dollar_sign_error'],
    },
  ],
  'P3-MON-02': [
    {
      name: 'Change from a Whole Dollar Note',
      description: 'Find the change when paying with a $5, $10, or $50 note.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      misconceptionTags: ['subtracts_wrong_way', 'forgets_cents_in_change'],
    },
    {
      name: 'Change from an Exact Amount',
      description: 'Find the change when paying with a non-round amount (e.g. $20.00).',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['subtracts_wrong_way', 'forgets_cents_in_change'],
    },
    {
      name: 'Multi-Item Change Problem',
      description: 'Buy two items, find the total cost, then calculate the change.',
      difficulty: 3,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['subtracts_wrong_way', 'forgets_cents_in_change', 'decimal_alignment_error'],
    },
  ],
};

export const p3MoneyQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3MoneyQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3MoneyQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3MoneyQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3MoneySkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3MoneyQuestionFamilies() {
  const ids = p3MoneyQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3MoneyQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3MoneyQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-money',
  version: '1.0.0',
  totalSkills: p3MoneySkillGraph.skillIds.length,
  totalQuestionFamilies: p3MoneyQuestionFamilies.length,
  families: p3MoneyQuestionFamilies,
};
