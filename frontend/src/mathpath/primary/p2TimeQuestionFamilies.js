import { p2TimeSkillGraph } from './p2TimeSkillGraph.js';

const SKILL_IDS = new Set(p2TimeSkillGraph.skillIds);

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
  'P2-TM-01': [
    {
      name: 'Read Time from Hand Description',
      description: 'Given the positions of the hour and minute hands, determine the time to the nearest 5 minutes.',
      difficulty: 1,
      fluencyTargetSeconds: 16,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_hour_minute_hands', 'reads_minutes_as_hours'],
    },
    {
      name: 'Time in Words to Digital',
      description: 'Convert a time expressed in words (e.g. "quarter past 3") to digital format.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['reads_minutes_as_hours', 'off_by_five_minutes'],
    },
    {
      name: 'What Time Will It Be?',
      description: 'Given a start time and a duration in multiples of 5 minutes, find the new time.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'text',
      misconceptionTags: ['off_by_five_minutes', 'confuses_hour_minute_hands'],
    },
  ],
};

export const p2TimeQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2TimeQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2TimeQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2TimeQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2TimeSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2TimeQuestionFamilies() {
  const ids = p2TimeQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2TimeQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2TimeQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-time',
  version: '1.0.0',
  totalSkills: p2TimeSkillGraph.skillIds.length,
  totalQuestionFamilies: p2TimeQuestionFamilies.length,
  families: p2TimeQuestionFamilies,
};
