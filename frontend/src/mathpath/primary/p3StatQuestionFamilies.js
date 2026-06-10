import { p3StatSkillGraph } from './p3StatSkillGraph.js';

const SKILL_IDS = new Set(p3StatSkillGraph.skillIds);

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
  'P3-ST-01': [
    {
      name: 'Read a Single Bar Value',
      description: 'Read the value of one category from a bar graph with a given scale.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['misreads_scale', 'ignores_axis_label'],
    },
    {
      name: 'Find the Difference Between Two Bars',
      description: 'Find how many more or fewer one category has compared to another.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['misreads_scale', 'counts_bars_not_values'],
    },
    {
      name: 'Find the Total Across Categories',
      description: 'Add the values of two or more bars to find a total.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      misconceptionTags: ['misreads_scale'],
    },
  ],
  'P3-ST-02': [
    {
      name: 'Which Category Has the Most?',
      description: 'Identify the category with the tallest bar (greatest value).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_most_least', 'misreads_scale'],
    },
    {
      name: 'Which Category Has the Least?',
      description: 'Identify the category with the shortest bar (smallest value).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_most_least', 'misreads_scale'],
    },
    {
      name: 'How Many More: Most vs Least',
      description: 'Find the difference between the most popular and least popular category.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      misconceptionTags: ['confuses_most_least', 'misreads_scale'],
    },
  ],
};

export const p3StatQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3StatQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3StatQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3StatQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3StatSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3StatQuestionFamilies() {
  const ids = p3StatQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3StatQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3StatQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-statistics',
  version: '1.0.0',
  totalSkills: p3StatSkillGraph.skillIds.length,
  totalQuestionFamilies: p3StatQuestionFamilies.length,
  families: p3StatQuestionFamilies,
};
