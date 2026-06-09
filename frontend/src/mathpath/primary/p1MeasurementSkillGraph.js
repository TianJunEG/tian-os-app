const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1MeasurementSkills = [
  {
    id: 'P1-MEA-01',
    name: 'Compare Length',
    description: 'Use longer, shorter, and taller to compare the length or height of two objects.',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MEA-01_001', 'QF_P1-MEA-01_002'],
    visualRequirement: 'required',
    misconceptionTags: ['length_by_position', 'length_by_thickness'],
  },
  {
    id: 'P1-MEA-02',
    name: 'Compare Mass',
    description: 'Use heavier and lighter to compare the mass of two objects.',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MEA-02_001', 'QF_P1-MEA-02_002'],
    visualRequirement: 'required',
    misconceptionTags: ['mass_by_size', 'mass_ignores_material'],
  },
  {
    id: 'P1-MEA-03',
    name: 'Compare Capacity',
    description: 'Use more, less, full, and empty to compare how much containers can hold.',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MEA-03_001', 'QF_P1-MEA-03_002'],
    visualRequirement: 'required',
    misconceptionTags: ['capacity_by_height', 'capacity_ignores_width'],
  },
  {
    id: 'P1-MEA-04',
    name: 'Sequence Events',
    description: 'Put daily events in the correct time order using before, after, and then.',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MEA-04_001', 'QF_P1-MEA-04_002'],
    visualRequirement: 'optional',
    misconceptionTags: ['sequence_by_preference', 'sequence_reverses_order'],
  },
  {
    id: 'P1-MEA-05',
    name: 'Tell Time to O\'Clock',
    description: 'Read and write times to the hour on analogue and digital clocks.',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MEA-05_001', 'QF_P1-MEA-05_002'],
    visualRequirement: 'required',
    misconceptionTags: ['clock_reads_minute_as_hour', 'clock_confuses_hands'],
  },
  {
    id: 'P1-MEA-06',
    name: 'Tell Time to Half Past',
    description: 'Read and write half-past times on analogue and digital clocks.',
    strand: 'Measurement',
    prerequisites: ['P1-MEA-05'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MEA-05'],
    questionFamilies: ['QF_P1-MEA-06_001', 'QF_P1-MEA-06_002'],
    visualRequirement: 'required',
    misconceptionTags: ['half_past_reads_wrong_hour', 'half_past_writes_06'],
  },
  {
    id: 'P1-MEA-07',
    name: 'Use Non-Standard Units',
    description: 'Measure length using equal non-standard units such as paper clips or cubes with no gaps or overlaps.',
    strand: 'Measurement',
    prerequisites: ['P1-MEA-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MEA-01'],
    questionFamilies: ['QF_P1-MEA-07_001', 'QF_P1-MEA-07_002'],
    visualRequirement: 'required',
    misconceptionTags: ['units_gaps_overlaps', 'units_mixed_sizes'],
  },
];

const skills = p1MeasurementSkills.map((s) => ({ ...s }));

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

export function validateP1MeasurementSkillGraph() {
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

export const p1MeasurementSkillGraph = {
  domainId: 'p1-measurement',
  domainName: 'Primary 1 Measurement',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1MeasurementSkillGraph;
