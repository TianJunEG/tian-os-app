import { areaPerimeterSkillGraph } from './AreaPerimeterSkillGraph.js';

const SKILL_IDS = new Set(areaPerimeterSkillGraph.skillIds);

const families = [
  {
    id: 'QF_AP001_001',
    skillId: 'AP001',
    name: 'Perimeter of rectangles and squares — Practice',
    description: 'Perimeter of rectangles and squares question.',
    difficulty: 2,
    generatorKind: 'apPerimeterRect',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/perimeter-area-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP001_002',
    skillId: 'AP001',
    name: 'Perimeter of rectangles and squares — MCQ',
    description: 'Perimeter of rectangles and squares question.',
    difficulty: 2,
    generatorKind: 'apPerimeterRectWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 8,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/perimeter-area-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP002_001',
    skillId: 'AP002',
    name: 'Perimeter of composite shapes — Practice',
    description: 'Perimeter of composite shapes question.',
    difficulty: 3,
    generatorKind: 'apPerimeterPolygon',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/missing-side'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP002_002',
    skillId: 'AP002',
    name: 'Perimeter of composite shapes — MCQ',
    description: 'Perimeter of composite shapes question.',
    difficulty: 3,
    generatorKind: 'apPerimeterPolygonWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/missing-side'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP003_001',
    skillId: 'AP003',
    name: 'Area of rectangles and squares — Practice',
    description: 'Area of rectangles and squares question.',
    difficulty: 2,
    generatorKind: 'apAreaRect',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 6,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/perimeter-area-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP003_002',
    skillId: 'AP003',
    name: 'Area of rectangles and squares — MCQ',
    description: 'Area of rectangles and squares question.',
    difficulty: 2,
    generatorKind: 'apAreaRectWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 6,
    masteryTargetAccuracy: 88,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/perimeter-area-confuse'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP004_001',
    skillId: 'AP004',
    name: 'Area of triangles — Practice',
    description: 'Area of triangles question.',
    difficulty: 3,
    generatorKind: 'apAreaTriangle',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/triangle-no-half', 'ap/wrong-height'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP004_002',
    skillId: 'AP004',
    name: 'Area of triangles — MCQ',
    description: 'Area of triangles question.',
    difficulty: 3,
    generatorKind: 'apAreaTriangleWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 15,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/triangle-no-half', 'ap/wrong-height'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP005_001',
    skillId: 'AP005',
    name: 'Area of composite figures — Practice',
    description: 'Area of composite figures question.',
    difficulty: 4,
    generatorKind: 'apAreaComposite',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 25,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/overlap-region'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP005_002',
    skillId: 'AP005',
    name: 'Area of composite figures — MCQ',
    description: 'Area of composite figures question.',
    difficulty: 4,
    generatorKind: 'apAreaCompositeWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 25,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['ap/overlap-region'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP006_001',
    skillId: 'AP006',
    name: 'Perimeter and area in real-world contexts — Practice',
    description: 'Perimeter and area in real-world contexts question.',
    difficulty: 4,
    generatorKind: 'apApply',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 25,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/area-units'],
    assessmentRelevant: true,
    mentalMathEligible: false,
    workingRequired: true,
  }
  {
    id: 'QF_AP006_002',
    skillId: 'AP006',
    name: 'Perimeter and area in real-world contexts — MCQ',
    description: 'Perimeter and area in real-world contexts question.',
    difficulty: 4,
    generatorKind: 'apApplyWord',
    recommendedQuestionCount: 20,
    fluencyTargetSeconds: 25,
    masteryTargetAccuracy: 85,
    masteryQuestionCount: 12,
    misconceptionTags: ['mea/area-units'],
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

export const areaPerimeterQuestionFamilies = families;
export default areaPerimeterQuestionFamilies;
