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
  'P4-STAT-01': [
    {
      name: 'Read value at a point',
      description: 'Read the value at a specific point on a described line graph.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['reads_wrong_axis', 'misreads_scale'],
    },
    {
      name: 'Find increase or decrease',
      description: 'Find the change (increase or decrease) between two points on a line graph.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['reads_wrong_axis', 'interpolation_error'],
    },
    {
      name: 'Find greatest change',
      description: 'Identify the period with the greatest increase or decrease on a line graph.',
      difficulty: 3,
      fluencyTargetSeconds: 22,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['interpolation_error', 'misreads_scale'],
    },
  ],
  'P4-STAT-02': [
    {
      name: 'Read sector value',
      description: 'Find the actual number for a labelled sector given a total.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_sector_label'],
    },
    {
      name: 'Find missing sector',
      description: 'Find the percentage or value of a missing sector given the others.',
      difficulty: 3,
      fluencyTargetSeconds: 18,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['confuses_sector_label', 'misreads_scale'],
    },
    {
      name: 'Compare sectors',
      description: 'Find the difference between two sectors in a pie chart.',
      difficulty: 3,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['confuses_sector_label', 'reads_wrong_axis'],
    },
  ],
};

export const p4StatQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p4StatQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p4StatQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p4StatQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4StatSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP4StatQuestionFamilies() {
  const ids = p4StatQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p4StatQuestionFamilies
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
    totalQuestionFamilies: p4StatQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p4-statistics',
  version: '1.0.0',
  totalSkills: p4StatSkillGraph.skillIds.length,
  totalQuestionFamilies: p4StatQuestionFamilies.length,
  families: p4StatQuestionFamilies,
};
