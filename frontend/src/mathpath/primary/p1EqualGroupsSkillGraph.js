const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1EqualGroupsSkills = [
  {
    id: 'P1-EQG-01',
    name: 'Make Equal Groups',
    description: 'Divide objects into groups of equal size.',
    strand: 'Equal Groups',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-EQG-01_001', 'QF_P1-EQG-01_002'],
    visualRequirement: 'required',
    misconceptionTags: ['equal_groups_uneven'],
  },
  {
    id: 'P1-EQG-02',
    name: 'Identify Unequal Groups',
    description: 'Recognise when groups are not equal in size.',
    strand: 'Equal Groups',
    prerequisites: ['P1-EQG-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-EQG-01'],
    questionFamilies: ['QF_P1-EQG-02_001', 'QF_P1-EQG-02_002'],
    visualRequirement: 'required',
    misconceptionTags: ['equal_groups_by_appearance'],
  },
  {
    id: 'P1-EQG-03',
    name: 'Repeated Addition Readiness',
    description: 'Count equal groups by repeated addition to find the total.',
    strand: 'Equal Groups',
    prerequisites: ['P1-EQG-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-EQG-01'],
    questionFamilies: ['QF_P1-EQG-03_001', 'QF_P1-EQG-03_002'],
    visualRequirement: 'required',
    misconceptionTags: ['repeated_add_counts_groups', 'repeated_add_one_group'],
  },
  {
    id: 'P1-EQG-04',
    name: 'Share Objects Equally',
    description: 'Share objects equally so each person gets the same amount.',
    strand: 'Equal Groups',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-EQG-04_001', 'QF_P1-EQG-04_002'],
    visualRequirement: 'required',
    misconceptionTags: ['sharing_gives_all_to_one', 'sharing_unequal'],
  },
  {
    id: 'P1-EQG-05',
    name: 'Identify Leftovers',
    description: 'Determine how many objects are left over when sharing cannot be done equally.',
    strand: 'Equal Groups',
    prerequisites: ['P1-EQG-04'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-EQG-04'],
    questionFamilies: ['QF_P1-EQG-05_001', 'QF_P1-EQG-05_002'],
    visualRequirement: 'required',
    misconceptionTags: ['leftover_ignored', 'leftover_forced_equal', 'leftover_gives_total'],
  },
];

const skills = p1EqualGroupsSkills.map((s) => ({ ...s }));

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

export function validateP1EqualGroupsSkillGraph() {
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

export const p1EqualGroupsSkillGraph = {
  domainId: 'p1-equalgroups',
  domainName: 'Primary 1 Equal Groups and Sharing Readiness',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1EqualGroupsSkillGraph;
