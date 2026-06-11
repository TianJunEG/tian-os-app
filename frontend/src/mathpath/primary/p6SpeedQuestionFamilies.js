import { p6SpeedSkillGraph } from './p6SpeedSkillGraph.js';

const SKILL_IDS = new Set(p6SpeedSkillGraph.skillIds);

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
  'P6-SPD-01': [
    {
      name: 'Find Speed',
      description: 'Given distance and time, calculate the speed using Speed = Distance ÷ Time.',
      difficulty: 4,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement'],
    },
    {
      name: 'Find Distance',
      description: 'Given speed and time, calculate the distance using Distance = Speed × Time.',
      difficulty: 4,
      fluencyTargetSeconds: 20,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement'],
    },
    {
      name: 'Find Time',
      description: 'Given distance and speed, calculate the time using Time = Distance ÷ Speed.',
      difficulty: 4,
      fluencyTargetSeconds: 22,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement', 'forgets_time_unit_conversion'],
    },
  ],
  'P6-SPD-02': [
    {
      name: 'Two-Leg Average Speed',
      description: 'Calculate average speed for a journey with two legs at different speeds.',
      difficulty: 5,
      fluencyTargetSeconds: 35,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average'],
    },
    {
      name: 'Two-Leg Given Distances and Speeds',
      description: 'Given two distances and two speeds, find the average speed for the whole journey.',
      difficulty: 5,
      fluencyTargetSeconds: 40,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['averages_speeds_instead_of_total', 'forgets_time_unit_conversion'],
    },
    {
      name: 'Two-Leg Given Times and Distances',
      description: 'Given two distances and two times, find the average speed for the whole journey.',
      difficulty: 4,
      fluencyTargetSeconds: 30,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average'],
    },
  ],
  'P6-SPD-03': [
    {
      name: 'Catching Up Problem',
      description: 'One person leaves earlier or travels slower; determine when a faster person catches up.',
      difficulty: 5,
      fluencyTargetSeconds: 50,
      answerType: 'text',
      workingRequired: true,
      misconceptionTags: ['subtracts_speeds_for_same_direction', 'time_in_hours_not_minutes'],
    },
    {
      name: 'Meeting Problem (Opposite Directions)',
      description: 'Two people travel towards each other; find when or where they meet.',
      difficulty: 5,
      fluencyTargetSeconds: 45,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['subtracts_speeds_for_same_direction', 'uses_wrong_formula_arrangement'],
    },
    {
      name: 'Journey With Rest Stop',
      description: 'A journey includes a rest stop; calculate average speed or arrival time.',
      difficulty: 5,
      fluencyTargetSeconds: 50,
      answerType: 'number',
      workingRequired: true,
      misconceptionTags: ['ignores_rest_stops_in_time', 'forgets_time_unit_conversion'],
    },
  ],
};

export const p6SpeedQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p6SpeedQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p6SpeedQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p6SpeedQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p6SpeedSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP6SpeedQuestionFamilies() {
  const ids = p6SpeedQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p6SpeedQuestionFamilies
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
    totalQuestionFamilies: p6SpeedQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p6-speed',
  version: '1.0.0',
  totalSkills: p6SpeedSkillGraph.skillIds.length,
  totalQuestionFamilies: p6SpeedQuestionFamilies.length,
  families: p6SpeedQuestionFamilies,
};
