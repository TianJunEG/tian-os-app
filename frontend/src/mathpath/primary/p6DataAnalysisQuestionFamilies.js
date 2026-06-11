import { p6DataAnalysisSkillGraph } from './p6DataAnalysisSkillGraph.js';

const SKILL_IDS = new Set(p6DataAnalysisSkillGraph.skillIds);

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
  'P6-DA-01': [
    {
      name: 'Find Quantity from Pie Chart Fractions',
      description: 'A pie chart shows categories as fractions of a total. Find how many items are in a specific category or the remainder category.',
      difficulty: 3,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['pie_chart_fractions_dont_sum_to_1', 'wrong_total_for_pie', 'assumes_equal_sectors'],
    },
    {
      name: 'Find Quantity from Pie Chart Percentages',
      description: 'A pie chart shows categories as percentages of a total. Find how many items are in a specific or remainder category.',
      difficulty: 3,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['confuses_fraction_percentage_in_pie', 'wrong_total_for_pie', 'assumes_equal_sectors'],
    },
    {
      name: 'Find Fraction or Percentage of a Category',
      description: 'Given quantities in a pie chart, express a category as a fraction or percentage of the total.',
      difficulty: 4,
      fluencyTargetSeconds: 32,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['pie_chart_fractions_dont_sum_to_1', 'confuses_fraction_percentage_in_pie', 'reads_wrong_category'],
    },
  ],
  'P6-DA-02': [
    {
      name: 'Calculate Average from Data Set',
      description: 'Find the average (mean) of a set of numbers from a table or list.',
      difficulty: 3,
      fluencyTargetSeconds: 25,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['average_divides_by_wrong_count', 'reads_wrong_category'],
    },
    {
      name: 'Find Missing Value Given Average',
      description: 'Given the average and all but one value in a data set, find the missing value.',
      difficulty: 4,
      fluencyTargetSeconds: 35,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['forgets_to_multiply_average_by_count', 'average_divides_by_wrong_count'],
    },
    {
      name: 'Interpret Table to Answer Questions',
      description: 'Read a data table showing scores or quantities across categories and answer comparison or total questions.',
      difficulty: 3,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['reads_wrong_category', 'average_divides_by_wrong_count'],
    },
  ],
};

export const p6DataAnalysisQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p6DataAnalysisQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p6DataAnalysisQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p6DataAnalysisQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p6DataAnalysisSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP6DataAnalysisQuestionFamilies() {
  const ids = p6DataAnalysisQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p6DataAnalysisQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p6DataAnalysisQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p6-data-analysis',
  version: '1.0.0',
  totalSkills: p6DataAnalysisSkillGraph.skillIds.length,
  totalQuestionFamilies: p6DataAnalysisQuestionFamilies.length,
  families: p6DataAnalysisQuestionFamilies,
};
