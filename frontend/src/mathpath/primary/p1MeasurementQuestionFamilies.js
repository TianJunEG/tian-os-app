import { p1MeasurementSkillGraph } from './p1MeasurementSkillGraph.js';

const SKILL_IDS = new Set(p1MeasurementSkillGraph.skillIds);

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
    answerType: config.answerType ?? 'choice',
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
  'P1-MEA-01': [
    { name: 'Compare Longer or Shorter', description: 'Identify which of two objects is longer or shorter.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'choice', misconceptionTags: ['length_by_position', 'length_by_thickness'] },
    { name: 'Compare Taller or Shorter', description: 'Identify which of two objects is taller or shorter.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'choice', misconceptionTags: ['length_by_position'] },
  ],
  'P1-MEA-02': [
    { name: 'Compare Heavier or Lighter', description: 'Identify which of two objects is heavier or lighter.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'choice', misconceptionTags: ['mass_by_size', 'mass_ignores_material'] },
    { name: 'Arrange by Mass', description: 'Arrange three objects from lightest to heaviest or heaviest to lightest.', difficulty: 1, fluencyTargetSeconds: 12, answerType: 'choice', misconceptionTags: ['mass_by_size'] },
  ],
  'P1-MEA-03': [
    { name: 'Compare More or Less Water', description: 'Identify which container holds more or less water.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'choice', misconceptionTags: ['capacity_by_height', 'capacity_ignores_width'] },
    { name: 'Full or Empty Identification', description: 'Identify containers as full, almost full, half full, almost empty, or empty.', difficulty: 1, fluencyTargetSeconds: 6, answerType: 'choice', misconceptionTags: ['capacity_by_height'] },
  ],
  'P1-MEA-04': [
    { name: 'Sequence Three Daily Events', description: 'Put three daily events in the correct time order.', difficulty: 1, fluencyTargetSeconds: 10, answerType: 'choice', misconceptionTags: ['sequence_by_preference', 'sequence_reverses_order'] },
    { name: 'What Comes Before or After', description: 'Identify what event comes before or after a given event.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'choice', misconceptionTags: ['sequence_by_preference'] },
  ],
  'P1-MEA-05': [
    { name: 'Read O\'Clock Time from Description', description: 'Read the time shown as an o\'clock time from a clock description.', difficulty: 2, fluencyTargetSeconds: 8, answerType: 'number', misconceptionTags: ['clock_reads_minute_as_hour', 'clock_confuses_hands'] },
    { name: 'What Time Is Shown at O\'Clock', description: 'State the o\'clock time displayed on an analogue or digital clock.', difficulty: 2, fluencyTargetSeconds: 8, answerType: 'number', misconceptionTags: ['clock_reads_minute_as_hour', 'clock_confuses_hands'] },
  ],
  'P1-MEA-06': [
    { name: 'Read Half-Past Time', description: 'Read the half-past time from a clock description.', difficulty: 2, fluencyTargetSeconds: 10, answerType: 'choice', misconceptionTags: ['half_past_reads_wrong_hour', 'half_past_writes_06'] },
    { name: 'What Time Is Shown at Half Past', description: 'State the half-past time displayed on a clock.', difficulty: 2, fluencyTargetSeconds: 10, answerType: 'choice', misconceptionTags: ['half_past_reads_wrong_hour', 'half_past_writes_06'] },
  ],
  'P1-MEA-07': [
    { name: 'Measure with Paper Clips', description: 'Measure an object using paper clips as non-standard units.', difficulty: 2, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['units_gaps_overlaps', 'units_mixed_sizes'] },
    { name: 'Measure with Cubes', description: 'Measure an object using cubes as non-standard units.', difficulty: 2, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['units_gaps_overlaps', 'units_mixed_sizes'] },
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

export function validateP1MeasurementQuestionFamilies() {
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

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1MeasurementQuestionFamilies };
