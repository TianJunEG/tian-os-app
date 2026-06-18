import { timeSkillGraph } from './TimeSkillGraph.js';

const SKILL_IDS = new Set(timeSkillGraph.skillIds);

const families = [
  {
    id: 'QF_TM001_001',
    skillId: 'TM001',
    name: 'Telling time to the hour and half-hour — Practice',
    description: 'Telling time to the hour and half-hour question.',
    difficulty: 1,
    generatorKind: 'timTellHour',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 4,
    masteryTargetAccuracy: 90,
    masteryQuestionCount: 10,
    misconceptionTags: ['tim/hour-half'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM001_002',
    skillId: 'TM001',
    name: 'Telling time to the hour and half-hour — MCQ',
    description: 'Telling time to the hour and half-hour question.',
    difficulty: 1,
    generatorKind: 'timTellHourMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 4,
    masteryTargetAccuracy: 90,
    masteryQuestionCount: 10,
    misconceptionTags: ['tim/hour-half'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM002_001',
    skillId: 'TM002',
    name: 'Telling time to the minute — Practice',
    description: 'Telling time to the minute question.',
    difficulty: 2,
    generatorKind: 'timTellMinutes',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['tim/minute-skip'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM002_002',
    skillId: 'TM002',
    name: 'Telling time to the minute — MCQ',
    description: 'Telling time to the minute question.',
    difficulty: 2,
    generatorKind: 'timTellMinutesMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['tim/minute-skip'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM003_001',
    skillId: 'TM003',
    name: 'Converting time units (hours, minutes, seconds) — Practice',
    description: 'Converting time units (hours, minutes, seconds) question.',
    difficulty: 3,
    generatorKind: 'timConvert',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['tim/base-10-error'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM003_002',
    skillId: 'TM003',
    name: 'Converting time units (hours, minutes, seconds) — MCQ',
    description: 'Converting time units (hours, minutes, seconds) question.',
    difficulty: 3,
    generatorKind: 'timConvertWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['tim/base-10-error'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM004_001',
    skillId: 'TM004',
    name: 'The 24-hour clock — Practice',
    description: 'The 24-hour clock question.',
    difficulty: 3,
    generatorKind: 'tim24hr',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/24hr-convert'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM004_002',
    skillId: 'TM004',
    name: 'The 24-hour clock — MCQ',
    description: 'The 24-hour clock question.',
    difficulty: 3,
    generatorKind: 'tim24hrMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 5,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/24hr-convert'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM005_001',
    skillId: 'TM005',
    name: 'Duration and time intervals — Practice',
    description: 'Duration and time intervals question.',
    difficulty: 4,
    generatorKind: 'timDuration',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 14,
    misconceptionTags: ['mea/time-base-60'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_TM005_002',
    skillId: 'TM005',
    name: 'Duration and time intervals — MCQ',
    description: 'Duration and time intervals question.',
    difficulty: 4,
    generatorKind: 'timDurationWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 14,
    misconceptionTags: ['mea/time-base-60'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },

  // ── Word-problem families (_003): one per skill, real-world contexts ──────────
  { id: 'QF_TM001_003', skillId: 'TM001', name: 'Telling Time — Spoken Phrase to h:mm', description: 'Translate a verbal time phrase (half past, o\'clock) to h:mm notation.', difficulty: 2, generatorKind: 'timTellHourWord', recommendedQuestionCount: 20, fluencyTargetSeconds: 8, masteryTargetAccuracy: 88, masteryQuestionCount: 10, misconceptionTags: ['tim/hour-half'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_TM002_003', skillId: 'TM002', name: 'Telling Time — "X past/to Y" to h:mm', description: 'Translate a five-minute "X minutes past/to Y" phrase to h:mm notation.', difficulty: 3, generatorKind: 'timTellMinutesWord', recommendedQuestionCount: 20, fluencyTargetSeconds: 10, masteryTargetAccuracy: 85, masteryQuestionCount: 12, misconceptionTags: ['tim/minute-skip'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_TM003_003', skillId: 'TM003', name: 'Time Conversion — Real Context', description: 'Convert time units within a practical scenario (film length, sprint time, bus ride).', difficulty: 3, generatorKind: 'timConvertContext', recommendedQuestionCount: 20, fluencyTargetSeconds: 10, masteryTargetAccuracy: 85, masteryQuestionCount: 12, misconceptionTags: ['tim/base-10-error'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_TM004_003', skillId: 'TM004', name: '24-Hour Clock — Timetable Context', description: 'Convert 12-/24-hour times shown on a transport or school timetable.', difficulty: 4, generatorKind: 'tim24hrSchedule', recommendedQuestionCount: 20, fluencyTargetSeconds: 10, masteryTargetAccuracy: 85, masteryQuestionCount: 12, misconceptionTags: ['mea/24hr-convert'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_TM005_003', skillId: 'TM005', name: 'Duration — Multi-step Journey with Stop', description: 'Find actual travel time by computing total elapsed time then subtracting a mid-journey stop.', difficulty: 5, generatorKind: 'timDurationMulti', recommendedQuestionCount: 20, fluencyTargetSeconds: 30, masteryTargetAccuracy: 80, masteryQuestionCount: 14, misconceptionTags: ['mea/time-base-60'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
];

const familyById = new Map(families.map((family) => [family.id, family]));
const familiesBySkill = families.reduce((acc, family) => {
  if (!acc[family.skillId]) acc[family.skillId] = [];
  acc[family.skillId].push(family);
  return acc;
}, {});

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return familiesBySkill[skillId] ? [...familiesBySkill[skillId]] : [];
}

export function getAllQuestionFamilies() {
  return [...families];
}

export const timeQuestionFamilies = families;
export default timeQuestionFamilies;
