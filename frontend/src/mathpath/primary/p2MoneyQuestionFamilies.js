import { p2MoneySkillGraph } from './p2MoneySkillGraph.js';

const SKILL_IDS = new Set(p2MoneySkillGraph.skillIds);

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
  'P2-MON-01': [
    {
      name: 'Dollars to Cents',
      description: 'Convert a dollars-and-cents amount to its value in cents only.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      misconceptionTags: ['ignores_decimal_point', 'cents_over_100'],
    },
    {
      name: 'Cents to Dollars',
      description: 'Convert a cents-only amount to dollars-and-cents notation.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      misconceptionTags: ['ignores_decimal_point', 'cents_over_100'],
    },
    {
      name: 'Mixed Notation Conversion',
      description: 'Convert between different ways of writing the same money amount.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      misconceptionTags: ['ignores_decimal_point', 'cents_over_100'],
    },
  ],
  'P2-MON-02': [
    {
      name: 'Notes Only',
      description: 'Find the total value of a collection of notes.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      misconceptionTags: ['counts_notes_as_ones'],
    },
    {
      name: 'Coins Only',
      description: 'Find the total value of a collection of coins.',
      difficulty: 1,
      fluencyTargetSeconds: 16,
      answerType: 'text',
      misconceptionTags: ['confuses_coin_values', 'cents_over_100'],
    },
    {
      name: 'Notes and Coins',
      description: 'Find the total value of a mixed collection of notes and coins.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'text',
      misconceptionTags: ['counts_notes_as_ones', 'confuses_coin_values', 'cents_over_100'],
    },
  ],
  'P2-MON-03': [
    {
      name: 'Compare Two Amounts',
      description: 'Decide which of two money amounts is greater or lesser.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'mcq',
      misconceptionTags: ['compares_cents_ignoring_dollars', 'ignores_decimal_point'],
    },
    {
      name: 'Order Three Amounts',
      description: 'Arrange three money amounts from least to greatest or greatest to least.',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'mcq',
      misconceptionTags: ['compares_cents_ignoring_dollars', 'ignores_decimal_point'],
    },
  ],
};

export const p2MoneyQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2MoneyQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2MoneyQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2MoneyQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2MoneySkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2MoneyQuestionFamilies() {
  const ids = p2MoneyQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2MoneyQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2MoneyQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-money',
  version: '1.0.0',
  totalSkills: p2MoneySkillGraph.skillIds.length,
  totalQuestionFamilies: p2MoneyQuestionFamilies.length,
  families: p2MoneyQuestionFamilies,
};
