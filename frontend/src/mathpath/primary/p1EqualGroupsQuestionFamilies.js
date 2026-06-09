import { p1EqualGroupsSkillGraph } from './p1EqualGroupsSkillGraph.js';

const SKILL_IDS = new Set(p1EqualGroupsSkillGraph.skillIds);

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
  'P1-EQG-01': [
    { name: 'Make Equal Groups (Small)', description: 'Put 6–12 objects into 2–3 equal groups.', difficulty: 1, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['equal_groups_uneven'] },
    { name: 'Make Equal Groups (Larger)', description: 'Put 12–20 objects into 2–4 equal groups.', difficulty: 1, fluencyTargetSeconds: 18, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['equal_groups_uneven'] },
  ],
  'P1-EQG-02': [
    { name: 'Choose Equal Groups', description: 'Pick the set that shows equal groups from choices.', difficulty: 1, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['equal_groups_by_appearance'] },
    { name: 'Are These Groups Equal?', description: 'Decide whether a given set of groups are equal or unequal.', difficulty: 1, fluencyTargetSeconds: 10, mentalMathEligible: false, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['equal_groups_by_appearance'] },
  ],
  'P1-EQG-03': [
    { name: 'Repeated Addition (Small)', description: 'Find the total for 2–3 groups of 2–5 items using repeated addition.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: true, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['repeated_add_counts_groups', 'repeated_add_one_group'] },
    { name: 'Repeated Addition (Larger)', description: 'Find the total for 3–5 groups of 2–5 items using repeated addition.', difficulty: 2, fluencyTargetSeconds: 18, mentalMathEligible: true, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['repeated_add_counts_groups', 'repeated_add_one_group'] },
  ],
  'P1-EQG-04': [
    { name: 'Share Equally (Exact)', description: 'Share objects equally among children with no remainder.', difficulty: 1, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['sharing_gives_all_to_one', 'sharing_unequal'] },
    { name: 'Share Among 2–4', description: 'Share objects equally among 2–4 children.', difficulty: 1, fluencyTargetSeconds: 18, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['sharing_gives_all_to_one', 'sharing_unequal', 'sharing_counts_people'] },
  ],
  'P1-EQG-05': [
    { name: 'Find the Leftover (Small)', description: 'Share objects and find how many are left over.', difficulty: 2, fluencyTargetSeconds: 18, mentalMathEligible: false, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['leftover_ignored', 'leftover_forced_equal'] },
    { name: 'Exact or Leftover?', description: 'Determine whether sharing is exact or has a leftover.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'choice', visualRequirement: 'required', misconceptionTags: ['leftover_ignored', 'leftover_gives_total'] },
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

export function validateP1EqualGroupsQuestionFamilies() {
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

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1EqualGroupsQuestionFamilies };
