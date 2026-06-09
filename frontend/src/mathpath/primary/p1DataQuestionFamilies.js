import { p1DataSkillGraph } from './p1DataSkillGraph.js';

const SKILL_IDS = new Set(p1DataSkillGraph.skillIds);

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
    visualRequirement: config.visualRequirement ?? 'required',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(3, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P1-DAT-01': [
    { name: 'Read Graph (3 Categories)', description: 'Read a picture graph with 3 categories to find the count for one category.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['graph_counts_all'] },
    { name: 'Read Graph (4 Categories)', description: 'Read a picture graph with 4 categories to find the count for one category.', difficulty: 1, fluencyTargetSeconds: 10, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['graph_counts_all'] },
  ],
  'P1-DAT-02': [
    { name: 'Count Small Amounts', description: 'Count pictures in a category with small counts (1-5).', difficulty: 1, fluencyTargetSeconds: 10, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['graph_counts_across_rows', 'graph_skips_picture'] },
    { name: 'Count Larger Amounts', description: 'Count pictures in a category with larger counts (4-8).', difficulty: 1, fluencyTargetSeconds: 12, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['graph_counts_across_rows', 'graph_skips_picture'] },
  ],
  'P1-DAT-03': [
    { name: 'Most or Fewest', description: 'Identify which category has the most or fewest items.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: true, answerType: 'text', misconceptionTags: ['graph_by_preference', 'graph_by_label_length'] },
    { name: 'More or Fewer Comparison', description: 'Compare two specific categories to determine which has more or fewer.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, answerType: 'text', misconceptionTags: ['graph_by_preference', 'graph_by_label_length'] },
  ],
  'P1-DAT-04': [
    { name: 'Total from 3 Categories', description: 'Add the counts of 3 categories to find the total.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['graph_largest_not_total'] },
    { name: 'Total from 4 Categories', description: 'Add the counts of 4 categories to find the total.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['graph_largest_not_total'] },
  ],
  'P1-DAT-05': [
    { name: 'How Many More', description: 'Find the difference between two categories (how many more).', difficulty: 3, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['graph_adds_instead_of_diff', 'graph_ignores_question'] },
    { name: 'How Many Fewer', description: 'Find the difference between two categories (how many fewer).', difficulty: 3, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['graph_adds_instead_of_diff', 'graph_ignores_question'] },
  ],
  'P1-DAT-06': [
    { name: 'Draw Given Count', description: 'Given a count, draw the correct number of pictures in the graph.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'number', misconceptionTags: ['graph_draw_mismatch'] },
    { name: 'Find Missing from Total', description: 'Given the total and other category counts, find the missing count.', difficulty: 2, fluencyTargetSeconds: 15, mentalMathEligible: false, answerType: 'number', workingRequired: true, misconceptionTags: ['graph_draw_mismatch', 'graph_row_column_confusion'] },
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

export function validateP1DataQuestionFamilies() {
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

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1DataQuestionFamilies };
