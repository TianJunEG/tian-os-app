import { circlesSkillGraph } from './CirclesSkillGraph.js';

const SKILL_IDS = new Set(circlesSkillGraph.skillIds);

const families = [
  {
    id: 'QF_CI001_001',
    skillId: 'CI001',
    name: 'Parts of a circle (radius, diameter, centre) — Practice',
    description: 'Parts of a circle (radius, diameter, centre) question.',
    difficulty: 1,
    generatorKind: 'cirParts',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 3,
    masteryTargetAccuracy: 90,
    masteryQuestionCount: 10,
    misconceptionTags: ['cir/radius-diameter'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI001_002',
    skillId: 'CI001',
    name: 'Parts of a circle (radius, diameter, centre) — MCQ',
    description: 'Parts of a circle (radius, diameter, centre) question.',
    difficulty: 1,
    generatorKind: 'cirPartsMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 3,
    masteryTargetAccuracy: 90,
    masteryQuestionCount: 10,
    misconceptionTags: ['cir/radius-diameter'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI002_001',
    skillId: 'CI002',
    name: 'Circumference of a circle — Practice',
    description: 'Circumference of a circle question.',
    difficulty: 3,
    generatorKind: 'cirCircumference',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 10,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/radius-diameter', 'cir/no-pi'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI002_002',
    skillId: 'CI002',
    name: 'Circumference of a circle — MCQ',
    description: 'Circumference of a circle question.',
    difficulty: 3,
    generatorKind: 'cirCircumferenceWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 10,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/radius-diameter', 'cir/no-pi'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI003_001',
    skillId: 'CI003',
    name: 'Area of a circle — Practice',
    description: 'Area of a circle question.',
    difficulty: 4,
    generatorKind: 'cirArea',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/area-uses-diameter', 'cir/no-pi'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI003_002',
    skillId: 'CI003',
    name: 'Area of a circle — MCQ',
    description: 'Area of a circle question.',
    difficulty: 4,
    generatorKind: 'cirAreaWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/area-uses-diameter', 'cir/no-pi'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI004_001',
    skillId: 'CI004',
    name: 'Semicircles and quarter-circles — Practice',
    description: 'Semicircles and quarter-circles question.',
    difficulty: 4,
    generatorKind: 'cirSemiQuarter',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/half-wrong', 'cir/perimeter-arc-only'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_CI004_002',
    skillId: 'CI004',
    name: 'Semicircles and quarter-circles — MCQ',
    description: 'Semicircles and quarter-circles question.',
    difficulty: 4,
    generatorKind: 'cirSemiQuarterWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['cir/half-wrong', 'cir/perimeter-arc-only'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
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

export const circlesQuestionFamilies = families;
export default circlesQuestionFamilies;
