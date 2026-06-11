import { p5StatSkillGraph } from './p5StatSkillGraph.js';

const SKILL_IDS = new Set(p5StatSkillGraph.skillIds);

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
  'P5-ST-01': [
    {
      name: 'Find the average',
      description: 'Find the average (mean) of a set of 4 or 5 whole numbers.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['divides_by_wrong_count_for_average', 'forgets_to_include_all_values'],
    },
    {
      name: 'Find the total from average',
      description: 'Given the average and the number of items, find the total.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['divides_by_wrong_count_for_average'],
    },
    {
      name: 'Find a missing value',
      description: 'Given the average and all but one value, find the missing value.',
      difficulty: 4,
      fluencyTargetSeconds: 25,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['divides_by_wrong_count_for_average', 'confuses_average_with_median', 'forgets_to_include_all_values'],
    },
  ],
  'P5-ST-02': [
    {
      name: 'Find difference from table',
      description: 'Read two values from a data table and find the difference.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: false,
      misconceptionTags: ['reads_wrong_row_column'],
    },
    {
      name: 'Compute total from table',
      description: 'Add up values from a data table to find a total.',
      difficulty: 3,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_to_include_all_values', 'double_counts_data'],
    },
    {
      name: 'Identify most or least category',
      description: 'Determine which category has the highest or lowest value from a table or bar graph.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      workingRequired: false,
      misconceptionTags: ['reads_wrong_row_column', 'double_counts_data'],
    },
  ],
};

export const p5StatQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p5StatQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p5StatQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p5StatQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p5StatSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP5StatQuestionFamilies() {
  const ids = p5StatQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p5StatQuestionFamilies
    .filter((f) => !SKILL_IDS.has(f.skillId))
    .map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilyCountSkills = Object.entries(skillCoverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');
  if (lowFamilyCountSkills.length) errors.push('Some skills have fewer than 2 question families.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: p5StatQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p5-stat',
  version: '1.0.0',
  totalSkills: p5StatSkillGraph.skillIds.length,
  totalQuestionFamilies: p5StatQuestionFamilies.length,
  families: p5StatQuestionFamilies,
};
