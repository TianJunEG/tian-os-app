import { volumeSkillGraph } from './VolumeSkillGraph.js';

const SKILL_IDS = new Set(volumeSkillGraph.skillIds);

const families = [
  {
    id: 'QF_VL001_001',
    skillId: 'VL001',
    name: 'Counting unit cubes to find volume — Practice',
    description: 'Counting unit cubes to find volume question.',
    difficulty: 2,
    generatorKind: 'volUnitCubes',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 10,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 10,
    misconceptionTags: ['vol/hidden-cubes'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL001_002',
    skillId: 'VL001',
    name: 'Counting unit cubes to find volume — MCQ',
    description: 'Counting unit cubes to find volume question.',
    difficulty: 2,
    generatorKind: 'volUnitCubesMCQ',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 10,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 10,
    misconceptionTags: ['vol/hidden-cubes'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL002_001',
    skillId: 'VL002',
    name: 'Volume of cubes and cuboids — Practice',
    description: 'Volume of cubes and cuboids question.',
    difficulty: 3,
    generatorKind: 'volCuboid',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/volume-add-edges'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL002_002',
    skillId: 'VL002',
    name: 'Volume of cubes and cuboids — MCQ',
    description: 'Volume of cubes and cuboids question.',
    difficulty: 3,
    generatorKind: 'volCuboidWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/volume-add-edges'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL003_001',
    skillId: 'VL003',
    name: 'Nets and volume of cuboids — Practice',
    description: 'Nets and volume of cuboids question.',
    difficulty: 4,
    generatorKind: 'volNets',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/net-dimensions'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL003_002',
    skillId: 'VL003',
    name: 'Nets and volume of cuboids — MCQ',
    description: 'Nets and volume of cuboids question.',
    difficulty: 4,
    generatorKind: 'volNetsWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 20,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/net-dimensions'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL004_001',
    skillId: 'VL004',
    name: 'Volume, water level and flow rate — Practice',
    description: 'Volume, water level and flow rate question.',
    difficulty: 5,
    generatorKind: 'volWaterRate',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 30,
    masteryTargetAccuracy: 80,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/rate-volume-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },
  {
    id: 'QF_VL004_002',
    skillId: 'VL004',
    name: 'Volume, water level and flow rate — MCQ',
    description: 'Volume, water level and flow rate question.',
    difficulty: 5,
    generatorKind: 'volWaterRateWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 30,
    masteryTargetAccuracy: 80,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/rate-volume-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  },

  // ── Word-problem families (_003): one per skill, real-world contexts ──────────
  { id: 'QF_VL001_003', skillId: 'VL001', name: 'Unit Cubes — Real-World Context', description: 'Count unit cubes in a model described in words.', difficulty: 2, generatorKind: 'volUnitCubesWord', recommendedQuestionCount: 20, fluencyTargetSeconds: 10, masteryTargetAccuracy: 88, masteryQuestionCount: 10, misconceptionTags: ['vol/hidden-cubes'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_VL002_003', skillId: 'VL002', name: 'Cuboid Volume — Real-World Context', description: 'Find the volume of a real rectangular container given its three dimensions.', difficulty: 3, generatorKind: 'volCuboidContext', recommendedQuestionCount: 20, fluencyTargetSeconds: 12, masteryTargetAccuracy: 85, masteryQuestionCount: 12, misconceptionTags: ['mea/volume-add-edges'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_VL003_003', skillId: 'VL003', name: 'Net to Volume — Real-World Context', description: 'Find the volume of a box given the edge lengths on its net.', difficulty: 4, generatorKind: 'volNetsContext', recommendedQuestionCount: 20, fluencyTargetSeconds: 15, masteryTargetAccuracy: 83, masteryQuestionCount: 12, misconceptionTags: ['mea/net-dimensions'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
  { id: 'QF_VL004_003', skillId: 'VL004', name: 'Volume & Flow Rate — Real-World Context', description: 'Compute volume from flow rate and time, or water height from volume and base area.', difficulty: 5, generatorKind: 'volWaterRateContext', recommendedQuestionCount: 20, fluencyTargetSeconds: 20, masteryTargetAccuracy: 80, masteryQuestionCount: 12, misconceptionTags: ['mea/rate-volume-confuse'], assessmentRelevant: true, mentalMathEligible: false, workingRequired: true },
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

export const volumeQuestionFamilies = families;
export default volumeQuestionFamilies;
