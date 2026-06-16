import { moneySkillGraph } from './MoneySkillGraph.js';

const SKILL_IDS = new Set(moneySkillGraph.skillIds);

const families = [
  {
    id: 'QF_MN001_001',
    skillId: 'MN001',
    name: 'Recognising coins and notes — Practice',
    description: 'Recognising coins and notes question.',
    difficulty: 1,
    generatorKind: 'monCoinsNotes',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 3,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 10,
    misconceptionTags: ['mon/face-value'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN001_002',
    skillId: 'MN001',
    name: 'Recognising coins and notes — MCQ',
    description: 'Recognising coins and notes question.',
    difficulty: 1,
    generatorKind: 'monCoinsNotesMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 3,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 10,
    misconceptionTags: ['mon/face-value'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN002_001',
    skillId: 'MN002',
    name: 'Adding amounts of money — Practice',
    description: 'Adding amounts of money question.',
    difficulty: 2,
    generatorKind: 'monAdd',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/cents-overflow'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN002_002',
    skillId: 'MN002',
    name: 'Adding amounts of money — MCQ',
    description: 'Adding amounts of money question.',
    difficulty: 2,
    generatorKind: 'monAddWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/cents-overflow'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN003_001',
    skillId: 'MN003',
    name: 'Finding total cost (unit price × quantity) — Practice',
    description: 'Finding total cost (unit price × quantity) question.',
    difficulty: 2,
    generatorKind: 'monTotalCost',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 6,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/add-not-multiply'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN003_002',
    skillId: 'MN003',
    name: 'Finding total cost (unit price × quantity) — MCQ',
    description: 'Finding total cost (unit price × quantity) question.',
    difficulty: 2,
    generatorKind: 'monTotalCostMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 6,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/add-not-multiply'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN004_001',
    skillId: 'MN004',
    name: 'Calculating change — Practice',
    description: 'Calculating change question.',
    difficulty: 2,
    generatorKind: 'monChange',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/change-direction'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN004_002',
    skillId: 'MN004',
    name: 'Calculating change — MCQ',
    description: 'Calculating change question.',
    difficulty: 2,
    generatorKind: 'monChangeWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mon/change-direction'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN005_001',
    skillId: 'MN005',
    name: 'Money word problems — Practice',
    description: 'Money word problems question.',
    difficulty: 3,
    generatorKind: 'monWordProb',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 14,
    misconceptionTags: ['mon/money-decimal-place'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_MN005_002',
    skillId: 'MN005',
    name: 'Money word problems — MCQ',
    description: 'Money word problems question.',
    difficulty: 3,
    generatorKind: 'monWordProbMulti',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 14,
    misconceptionTags: ['mon/money-decimal-place'],
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

export const moneyQuestionFamilies = families;
export default moneyQuestionFamilies;
