const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3AddSubSkills = [
  {
    id: 'P3-AS-01',
    name: 'Mental Addition (two 2-digit numbers)',
    description: 'Add two 2-digit numbers mentally using strategies like making tens or splitting.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-07'],
    difficulty: 1,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-07'],
    questionFamilies: [
      'QF_P3-AS-01_001',
      'QF_P3-AS-01_002',
      'QF_P3-AS-01_003',
    ],
    visual: 'optional',
    misconceptions: ['mental_add_carry_error', 'adds_ones_to_tens'],
  },
  {
    id: 'P3-AS-02',
    name: 'Mental Subtraction (two 2-digit numbers)',
    description: 'Subtract two 2-digit numbers mentally using counting back or splitting.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P3-AS-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 15 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 13 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-01'],
    questionFamilies: [
      'QF_P3-AS-02_001',
      'QF_P3-AS-02_002',
      'QF_P3-AS-02_003',
    ],
    visual: 'optional',
    misconceptions: ['mental_sub_regroup_error', 'subtracts_smaller_from_larger_digit'],
  },
  {
    id: 'P3-AS-03',
    name: 'Addition within 10 000 (column method)',
    description: 'Add numbers up to 4 digits using the standard written algorithm with carrying.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P3-AS-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-01'],
    questionFamilies: [
      'QF_P3-AS-03_001',
      'QF_P3-AS-03_002',
      'QF_P3-AS-03_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['forgets_carry', 'column_alignment_error'],
  },
  {
    id: 'P3-AS-04',
    name: 'Subtraction within 10 000 (column method)',
    description: 'Subtract numbers up to 4 digits using the standard written algorithm with borrowing.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P3-AS-02', 'P3-AS-03'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 26 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-02', 'P3-AS-03'],
    questionFamilies: [
      'QF_P3-AS-04_001',
      'QF_P3-AS-04_002',
      'QF_P3-AS-04_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['forgets_borrow', 'subtracts_smaller_from_larger_digit', 'borrow_across_zero'],
  },
];

const skills = p3AddSubSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
skills.forEach((skill) => dependentMap.set(skill.id, []));
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

export function validateP3AddSubSkillGraph() {
  const actualIds = skills.map((s) => s.id);
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P1-'))
      .map((pid) => ({ skillId: skill.id, invalidPrereqId: pid }))
  );

  const foundationIds = skills
    .filter((s) => s.prerequisites.every((p) => p.startsWith('P1-')))
    .map((s) => s.id);
  const reachable = new Set(foundationIds);
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    (dependentMap.get(current) || []).forEach((dep) => {
      if (!reachable.has(dep)) { reachable.add(dep); queue.push(dep); }
    });
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

export const p3AddSubSkillGraph = {
  domainId: 'p3-addsub',
  domainName: 'Primary 3 Addition and Subtraction',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3AddSubSkillGraph;
