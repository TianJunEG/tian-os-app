import { p3MeasTimeSkillGraph } from './p3MeasTimeSkillGraph.js';

const SKILL_IDS = new Set(p3MeasTimeSkillGraph.skillIds);

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
  'P3-MT-01': [
    {
      name: 'Metres & Centimetres to cm',
      description: 'Convert a compound measurement in metres and centimetres to centimetres only.',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['wrong_conversion_factor', 'adds_without_converting'],
    },
    {
      name: 'Kilograms & Grams to g',
      description: 'Convert a compound measurement in kilograms and grams to grams only.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['wrong_conversion_factor', 'adds_without_converting'],
    },
    {
      name: 'Kilometres & Metres to m / Litres & Millilitres to mL',
      description: 'Convert compound km & m to metres, or compound L & mL to millilitres.',
      difficulty: 2,
      fluencyTargetSeconds: 16,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['wrong_conversion_factor', 'adds_without_converting', 'unit_label_swap'],
    },
  ],
  'P3-MT-02': [
    {
      name: 'Read Time (minutes on a number)',
      description: 'Read a time where the minute hand points exactly at a number (multiples of 5).',
      difficulty: 1,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['reads_minute_hand_as_hour', 'off_by_one_hour'],
    },
    {
      name: 'Read Time (minutes between numbers)',
      description: 'Read a time where the minute hand is between two numbers.',
      difficulty: 2,
      fluencyTargetSeconds: 18,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['reads_minute_hand_as_hour', 'off_by_one_hour', 'counts_minutes_by_fives_only'],
    },
    {
      name: 'Write Time in Words',
      description: 'Given a digital time, write it in words (e.g. 3:47 → forty-seven minutes past three).',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'text',
      misconceptionTags: ['off_by_one_hour'],
    },
  ],
  'P3-MT-03': [
    {
      name: '12-hour to 24-hour (a.m.)',
      description: 'Convert a morning time from 12-hour to 24-hour notation.',
      difficulty: 1,
      fluencyTargetSeconds: 12,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['confuses_midnight_noon', 'drops_leading_zero_24h'],
    },
    {
      name: '12-hour to 24-hour (p.m.)',
      description: 'Convert an afternoon/evening time from 12-hour to 24-hour notation.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['forgets_add_12_for_pm', 'confuses_midnight_noon'],
    },
    {
      name: '24-hour to 12-hour',
      description: 'Convert a 24-hour time to 12-hour notation with a.m./p.m.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'text',
      mentalMathEligible: true,
      misconceptionTags: ['forgets_add_12_for_pm', 'confuses_midnight_noon'],
    },
  ],
  'P3-MT-04': [
    {
      name: 'Duration Between Two Times (same hour or crossing one hour)',
      description: 'Find the duration in minutes between two times that are within 2 hours of each other.',
      difficulty: 2,
      fluencyTargetSeconds: 20,
      answerType: 'numeric',
      misconceptionTags: ['subtracts_minutes_across_hour_wrong', 'treats_60min_as_100'],
    },
    {
      name: 'End Time Given Start and Duration',
      description: 'Find the end time given a start time and a duration in minutes or hours and minutes.',
      difficulty: 2,
      fluencyTargetSeconds: 22,
      answerType: 'text',
      misconceptionTags: ['treats_60min_as_100'],
    },
    {
      name: 'Start Time Given End and Duration',
      description: 'Find the start time given an end time and duration.',
      difficulty: 3,
      fluencyTargetSeconds: 24,
      answerType: 'text',
      misconceptionTags: ['subtracts_minutes_across_hour_wrong', 'treats_60min_as_100'],
    },
  ],
};

export const p3MeasTimeQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3MeasTimeQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3MeasTimeQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3MeasTimeQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3MeasTimeSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3MeasTimeQuestionFamilies() {
  const ids = p3MeasTimeQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3MeasTimeQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3MeasTimeQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-meas-time',
  version: '1.0.0',
  totalSkills: p3MeasTimeSkillGraph.skillIds.length,
  totalQuestionFamilies: p3MeasTimeQuestionFamilies.length,
  families: p3MeasTimeQuestionFamilies,
};
