const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3FractionsSkills = [
  {
    id: 'P3-FR-01',
    name: 'Equivalent Fractions',
    description: 'Find a missing numerator or denominator to make two fractions equivalent, with denominators up to 12.',
    strand: 'Fractions',
    prerequisites: ['P2-FR-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P2-FR-01'],
    questionFamilies: [
      'QF_P3-FR-01_001',
      'QF_P3-FR-01_002',
      'QF_P3-FR-01_003',
    ],
    visual: 'useful',
    misconceptions: [
      'multiplies_only_one_part',
      'divides_only_one_part',
      'uses_additive_instead_of_multiplicative',
    ],
  },
  {
    id: 'P3-FR-02',
    name: 'Add & Subtract Related Fractions',
    description: 'Add or subtract two related fractions (one denominator is a multiple of the other) with denominators up to 12.',
    strand: 'Fractions',
    prerequisites: ['P3-FR-01', 'P2-FR-01'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-FR-01'],
    questionFamilies: [
      'QF_P3-FR-02_001',
      'QF_P3-FR-02_002',
      'QF_P3-FR-02_003',
    ],
    visual: 'useful',
    misconceptions: [
      'adds_unlike_numerators_directly',
      'wrong_common_denominator',
      'forgets_to_rename_numerator',
      'multiplies_only_one_part',
    ],
  },
];

const skills = p3FractionsSkills.map((s) => ({ ...s }));
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

export function validateP3FractionsSkillGraph() {
  const actualIds = skills.map((s) => s.id);
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P1-') && !pid.startsWith('P2-'))
      .map((pid) => ({ skillId: skill.id, invalidPrereqId: pid }))
  );

  const foundationIds = skills
    .filter((s) => s.prerequisites.every((p) => p.startsWith('P1-') || p.startsWith('P2-')))
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

export const p3FractionsSkillGraph = {
  domainId: 'p3-fractions',
  domainName: 'Primary 3 Fractions',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3FractionsSkillGraph;
