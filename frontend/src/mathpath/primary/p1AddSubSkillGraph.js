const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1AddSubSkills = [
  {
    id: 'P1-ADD-01',
    name: 'Addition Within 10',
    description: 'Add two numbers whose sum is 10 or less.',
    strand: 'Addition and Subtraction',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-ADD-01_001', 'QF_P1-ADD-01_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['counts_from_one'],
  },
  {
    id: 'P1-ADD-02',
    name: 'Subtraction Within 10',
    description: 'Subtract within 10.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-01'],
    questionFamilies: ['QF_P1-ADD-02_001', 'QF_P1-ADD-02_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['subtracts_wrong_direction'],
  },
  {
    id: 'P1-ADD-03',
    name: 'Addition Facts to 10 (fluency)',
    description: 'Rapid recall of all addition facts with sums up to 10.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-01'],
    questionFamilies: ['QF_P1-ADD-03_001', 'QF_P1-ADD-03_002'],
    visualRequirement: 'none',
    mentalMathEligible: true,
    misconceptionTags: ['counts_from_one'],
  },
  {
    id: 'P1-ADD-04',
    name: 'Subtraction Facts to 10 (fluency)',
    description: 'Rapid recall of all subtraction facts within 10.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-02'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-02'],
    questionFamilies: ['QF_P1-ADD-04_001', 'QF_P1-ADD-04_002'],
    visualRequirement: 'none',
    mentalMathEligible: true,
    misconceptionTags: ['subtracts_wrong_direction'],
  },
  {
    id: 'P1-ADD-05',
    name: 'Addition Within 20 (no regrouping)',
    description: 'Add two numbers with a sum up to 20 without carrying.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-03'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-03'],
    questionFamilies: ['QF_P1-ADD-05_001', 'QF_P1-ADD-05_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['forgets_teen_structure'],
  },
  {
    id: 'P1-ADD-06',
    name: 'Subtraction Within 20 (no regrouping)',
    description: 'Subtract within 20 without borrowing.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-04'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-04'],
    questionFamilies: ['QF_P1-ADD-06_001', 'QF_P1-ADD-06_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['subtracts_wrong_direction'],
  },
  {
    id: 'P1-ADD-07',
    name: 'Addition Within 40',
    description: 'Add two numbers with a sum up to 40.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-05'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-05'],
    questionFamilies: ['QF_P1-ADD-07_001', 'QF_P1-ADD-07_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['adds_ones_to_tens'],
  },
  {
    id: 'P1-ADD-08',
    name: 'Subtraction Within 40',
    description: 'Subtract within 40.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-06'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-06'],
    questionFamilies: ['QF_P1-ADD-08_001', 'QF_P1-ADD-08_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['subtracts_smaller_from_larger_digit'],
  },
  {
    id: 'P1-ADD-09',
    name: 'Addition and Subtraction Word Problems (within 20)',
    description: 'Solve one-step addition and subtraction word problems within 20.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-05', 'P1-ADD-06'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-05', 'P1-ADD-06'],
    questionFamilies: ['QF_P1-ADD-09_001', 'QF_P1-ADD-09_002'],
    visualRequirement: 'useful',
    workingRequired: true,
    misconceptionTags: ['wrong_operation_word_problem'],
  },
  {
    id: 'P1-ADD-10',
    name: 'Missing Number in Equation',
    description: 'Find the missing number in equations such as 3 + ? = 8 or 9 - ? = 4.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-03', 'P1-ADD-04'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-03', 'P1-ADD-04'],
    questionFamilies: ['QF_P1-ADD-10_001', 'QF_P1-ADD-10_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['missing_number_adds_all'],
  },
];

const skills = p1AddSubSkills.map((s) => ({ ...s }));

const skillById = new Map(skills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
skills.forEach((skill) => {
  dependentMap.set(skill.id, []);
});
skills.forEach((skill) => {
  skill.prerequisites.forEach((prereqId) => {
    if (dependentMap.has(prereqId)) {
      dependentMap.get(prereqId).push(skill.id);
    }
  });
});

export function getSkill(skillId) {
  return skillById.get(skillId) || null;
}

export function getAllSkills() {
  return [...skills];
}

export function getPrerequisites(skillId) {
  return getSkill(skillId)?.prerequisites || [];
}

export function getDependents(skillId) {
  return dependentMap.get(skillId) || [];
}

export function getRemediationTargets(skillId) {
  return getSkill(skillId)?.remediationIfWeak || [];
}

export function validateP1AddSubSkillGraph() {
  const actualIds = skills.map((s) => s.id);
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const allKnownIds = new Set(actualIds);
  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !allKnownIds.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const internalIds = new Set(actualIds);
  const foundationIds = skills
    .filter((skill) => skill.prerequisites.every((p) => !internalIds.has(p)))
    .map((s) => s.id);

  const reachable = new Set();
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    (dependentMap.get(current) || []).forEach((dep) => queue.push(dep));
  }
  const unreachableSkills = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);

  const errors = [
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references detected.'] : []),
    ...(unreachableSkills.length ? ['Unreachable skills detected.'] : []),
  ];

  return {
    isValid: errors.length === 0,
    summary: {
      totalSkills: skills.length,
      foundationSkills: foundationIds,
      duplicateIds: [...new Set(duplicateIds)],
      invalidPrereqReferences,
      unreachableSkills,
    },
    errors,
  };
}

export const p1AddSubSkillGraph = {
  domainId: 'p1-addsub',
  domainName: 'Primary 1 Addition and Subtraction',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1AddSubSkillGraph;
