import { p4StatSkillGraph } from './p4StatSkillGraph.js';

const SKILL_IDS = new Set(p4StatSkillGraph.skillIds);

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
  'P4-ST-01': [
    {
      name: 'Read a Value from a Line Graph',
      description: 'Read the value at a specific data point on a line graph.',
      difficulty: 1,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reads_wrong_axis', 'off_by_one_interval'],
    },
    {
      name: 'Find the Change Between Two Points',
      description: 'Find the increase or decrease between two data points on a line graph.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['reads_wrong_axis', 'adds_when_should_subtract'],
    },
    {
      name: 'Find the Total Across Points',
      description: 'Add the values at multiple data points to find a total.',
      difficulty: 2,
      fluencyTargetSeconds: 24,
      answerType: 'numeric',
      misconceptionTags: ['reads_wrong_axis', 'off_by_one_interval'],
    },
  ],
  'P4-ST-02': [
    {
      name: 'Read a Sector Value from a Pie Chart',
      description: 'Read the value of a specific sector from a pie chart.',
      difficulty: 1,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_sector_with_total', 'reads_wrong_axis'],
    },
    {
      name: 'Find the Total from a Pie Chart',
      description: 'Add all sector values to find the total.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      misconceptionTags: ['confuses_sector_with_total'],
    },
    {
      name: 'Find the Difference Between Two Sectors',
      description: 'Find the difference between two sector values on a pie chart.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      misconceptionTags: ['confuses_sector_with_total', 'adds_when_should_subtract'],
    },
  ],
};

export const p4StatQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p4StatQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p4StatQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p4StatQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p4StatSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP4StatQuestionFamilies() {
  const ids = p4StatQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p4StatQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p4StatQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p4-statistics',
  version: '1.0.0',
  totalSkills: p4StatSkillGraph.skillIds.length,
  totalQuestionFamilies: p4StatQuestionFamilies.length,
  families: p4StatQuestionFamilies,
};
