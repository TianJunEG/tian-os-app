const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2FractionsSkills = [
  {
    id: 'P2-FR-01',
    name: 'Add & Subtract Like Fractions',
    description: 'Add and subtract fractions with the same denominator (up to 12), where the result stays within one whole.',
    strand: 'Fractions',
    prerequisites: ['P1-ADD-03', 'P1-ADD-07'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-ADD-03'],
    questionFamilies: [
      'QF_P2-FR-01_001',
      'QF_P2-FR-01_002',
      'QF_P2-FR-01_003',
    ],
    visual: 'optional',
    misconceptions: ['adds_denominators', 'forgets_denominator_stays', 'fraction_greater_than_whole'],
  },
  {
    id: 'P2-FR-02',
    name: 'Fraction of a Whole',
    description: 'Identify the fraction represented by shaded equal parts, or determine how many parts to shade for a given fraction.',
    strand: 'Fractions',
    prerequisites: ['P1-EQG-01', 'P1-NUM-03'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 10 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-EQG-01'],
    questionFamilies: [
      'QF_P2-FR-02_001',
      'QF_P2-FR-02_002',
    ],
    visual: 'recommended',
    misconceptions: ['confuses_numerator_denominator', 'counts_unshaded_instead'],
  },
];

const skills = p2FractionsSkills.map((s) => ({ ...s }));
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

export function validateP2FractionsSkillGraph() {
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

export const p2FractionsSkillGraph = {
  domainId: 'p2-fractions',
  domainName: 'Primary 2 Fractions',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2FractionsSkillGraph;
