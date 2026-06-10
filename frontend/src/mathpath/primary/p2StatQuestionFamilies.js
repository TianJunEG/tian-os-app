import { p2StatSkillGraph } from './p2StatSkillGraph.js';

const SKILL_IDS = new Set(p2StatSkillGraph.skillIds);

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
  'P2-ST-01': [
    {
      name: 'Read a Single Category',
      description: 'Count the icons for one category and multiply by the scale to find the total.',
      difficulty: 1,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['ignores_scale_on_graph', 'miscounts_icons'],
    },
    {
      name: 'Compare Two Categories',
      description: 'Find how many more or fewer one category has compared to another on the picture graph.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      misconceptionTags: ['ignores_scale_on_graph', 'miscounts_icons'],
    },
    {
      name: 'Total Across Categories',
      description: 'Add the values of two or more categories to find a combined total.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['ignores_scale_on_graph', 'miscounts_icons'],
    },
  ],
  'P2-ST-02': [
    {
      name: 'Find the Most',
      description: 'Identify which category has the most icons (greatest value).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_most_least', 'ignores_scale_on_graph'],
    },
    {
      name: 'Find the Least',
      description: 'Identify which category has the fewest icons (smallest value).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_most_least', 'ignores_scale_on_graph'],
    },
  ],
};

export const p2StatQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2StatQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2StatQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2StatQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2StatSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2StatQuestionFamilies() {
  const ids = p2StatQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2StatQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2StatQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-statistics',
  version: '1.0.0',
  totalSkills: p2StatSkillGraph.skillIds.length,
  totalQuestionFamilies: p2StatQuestionFamilies.length,
  families: p2StatQuestionFamilies,
};
