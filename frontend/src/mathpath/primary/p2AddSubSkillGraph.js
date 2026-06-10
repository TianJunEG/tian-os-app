const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2AddSubSkills = [
  {
    id: 'P2-AS-01',
    name: 'Mental Addition of 3-Digit and Ones/Tens/Hundreds',
    description: 'Add a 1-digit, 2-digit (multiple of 10), or 3-digit (multiple of 100) number to a 3-digit number mentally.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-01'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-01'],
    questionFamilies: [
      'QF_P2-AS-01_001',
      'QF_P2-AS-01_002',
      'QF_P2-AS-01_003',
    ],
    visual: 'optional',
    misconceptions: ['mental_add_place_error'],
  },
  {
    id: 'P2-AS-02',
    name: 'Mental Subtraction of Ones/Tens/Hundreds from 3-Digit',
    description: 'Subtract a 1-digit, 2-digit (multiple of 10), or 3-digit (multiple of 100) number from a 3-digit number mentally.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P1-ADD-01'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-01'],
    questionFamilies: [
      'QF_P2-AS-02_001',
      'QF_P2-AS-02_002',
      'QF_P2-AS-02_003',
    ],
    visual: 'optional',
    misconceptions: ['mental_sub_place_error'],
  },
  {
    id: 'P2-AS-03',
    name: 'Addition within 1000 (column method)',
    description: 'Add two numbers within 1000 using the standard written algorithm, with and without regrouping.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P2-AS-01'],
    difficulty: 2,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P2-AS-01'],
    questionFamilies: [
      'QF_P2-AS-03_001',
      'QF_P2-AS-03_002',
      'QF_P2-AS-03_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['forgets_to_regroup', 'regroups_wrong_column'],
  },
  {
    id: 'P2-AS-04',
    name: 'Subtraction within 1000 (column method)',
    description: 'Subtract two numbers within 1000 using the standard written algorithm, with and without borrowing.',
    strand: 'Addition and Subtraction',
    prerequisites: ['P2-AS-02', 'P2-AS-03'],
    difficulty: 3,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P2-AS-02', 'P2-AS-03'],
    questionFamilies: [
      'QF_P2-AS-04_001',
      'QF_P2-AS-04_002',
      'QF_P2-AS-04_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['subtracts_smaller_from_larger', 'borrows_incorrectly'],
  },
];

const skills = p2AddSubSkills.map((s) => ({ ...s }));
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

export function validateP2AddSubSkillGraph() {
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

export const p2AddSubSkillGraph = {
  domainId: 'p2-addsub',
  domainName: 'Primary 2 Addition and Subtraction',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2AddSubSkillGraph;
