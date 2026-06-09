import { p1MoneySkillGraph } from './p1MoneySkillGraph.js';

const SKILL_IDS = new Set(p1MoneySkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 10,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 80,
    masteryQuestionCount: config.masteryQuestionCount ?? 10,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? false,
    answerType: config.answerType ?? 'number',
    visualRequirement: config.visualRequirement ?? 'optional',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(3, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P1-MON-01': [
    { name: 'Coin Recognition', description: 'Name the Singapore coin shown.', difficulty: 1, fluencyTargetSeconds: 6, mentalMathEligible: true, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['coin_size_value_confusion'] },
    { name: 'Note Recognition', description: 'Name the Singapore note shown.', difficulty: 1, fluencyTargetSeconds: 6, mentalMathEligible: true, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['coin_size_value_confusion'] },
  ],
  'P1-MON-02': [
    { name: 'Match Coin to Value', description: 'Select the value of a given Singapore coin.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: true, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['dollar_cent_confusion'] },
    { name: 'Match Note to Value', description: 'Select the value of a given Singapore note.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: true, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['dollar_cent_confusion'] },
  ],
  'P1-MON-03': [
    { name: 'Count Coins Only', description: 'Count the total value of a set of coins.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['counts_coins_not_value'] },
    { name: 'Count Mixed Coins and Notes', description: 'Count the total value of a mix of coins and notes.', difficulty: 2, fluencyTargetSeconds: 18, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['counts_coins_not_value'] },
  ],
  'P1-MON-04': [
    { name: 'Compare Two Coin Sets', description: 'Decide which set of coins has a greater total value.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['more_coins_means_more_money'] },
    { name: 'Compare Coin Set vs Single Note', description: 'Decide which is worth more: a set of coins or a single note.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['more_coins_means_more_money'] },
  ],
  'P1-MON-05': [
    { name: 'Add Two Prices (Cents)', description: 'Add two prices given in cents to find the total cost.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: true, answerType: 'number', workingRequired: true, misconceptionTags: ['money_add_ignores_units'] },
    { name: 'Add Two Prices (Dollars and Cents)', description: 'Add two prices given in dollars and cents to find the total cost.', difficulty: 3, fluencyTargetSeconds: 20, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['money_add_ignores_units'] },
  ],
  'P1-MON-06': [
    { name: 'Change from $1', description: 'Find the change when paying with $1.', difficulty: 2, fluencyTargetSeconds: 20, mentalMathEligible: true, answerType: 'number', workingRequired: true, misconceptionTags: ['change_adds_cost_and_paid'] },
    { name: 'Change from $5 or $10', description: 'Find the change when paying with $5 or $10.', difficulty: 3, fluencyTargetSeconds: 25, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['change_adds_cost_and_paid'] },
  ],
  'P1-MON-07': [
    { name: 'Enough for One Item', description: 'Decide whether a given amount of money is enough to buy one item.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: true, answerType: 'choice', misconceptionTags: ['enough_money_focuses_on_object'] },
    { name: 'Enough for Two Items', description: 'Decide whether a given amount of money is enough to buy two items.', difficulty: 3, fluencyTargetSeconds: 20, mentalMathEligible: false, answerType: 'choice', workingRequired: true, misconceptionTags: ['enough_money_focuses_on_object'] },
  ],
};

const allFamilies = [];
Object.entries(familiesBySkillBlueprint).forEach(([skillId, blueprints]) => {
  if (!SKILL_IDS.has(skillId)) return;
  blueprints.forEach((bp, i) => {
    allFamilies.push(buildFamily(skillId, i + 1, bp));
  });
});

const familyById = new Map(allFamilies.map((f) => [f.id, f]));
const familiesBySkill = new Map();
allFamilies.forEach((f) => {
  if (!familiesBySkill.has(f.skillId)) familiesBySkill.set(f.skillId, []);
  familiesBySkill.get(f.skillId).push(f);
});

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return familiesBySkill.get(skillId) || [];
}

export function getAllQuestionFamilies() {
  return [...allFamilies];
}

export function validateP1MoneyQuestionFamilies() {
  const orphanFamilies = allFamilies.filter((f) => !SKILL_IDS.has(f.skillId));
  const missingFluency = allFamilies.filter((f) => !f.fluencyTargetSeconds);
  const duplicateIds = allFamilies
    .map((f) => f.id)
    .filter((id, i, arr) => arr.indexOf(id) !== i);

  const skillsMissingFamilies = [...SKILL_IDS].filter(
    (sid) => !familiesBySkill.has(sid) || familiesBySkill.get(sid).length === 0
  );

  return {
    isValid: orphanFamilies.length === 0 && duplicateIds.length === 0 && skillsMissingFamilies.length === 0,
    totalFamilies: allFamilies.length,
    orphanFamilies: orphanFamilies.map((f) => f.id),
    duplicateIds,
    missingFluency: missingFluency.map((f) => f.id),
    skillsMissingFamilies,
  };
}

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1MoneyQuestionFamilies };
