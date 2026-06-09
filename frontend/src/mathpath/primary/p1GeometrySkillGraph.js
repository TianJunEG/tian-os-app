const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1GeometrySkills = [
  {
    id: 'P1-GEO-01',
    name: 'Identify Basic 2D Shapes',
    description: 'Recognise circle, triangle, square, and rectangle by name.',
    strand: 'Geometry',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-GEO-01_001', 'QF_P1-GEO-01_002'],
    visualRequirement: 'required',
    misconceptionTags: ['shape_orientation_dependence'],
  },
  {
    id: 'P1-GEO-02',
    name: 'Identify Basic 3D Objects',
    description: 'Recognise cube, cuboid, sphere, cone, and cylinder by name.',
    strand: 'Geometry',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-GEO-02_001', 'QF_P1-GEO-02_002'],
    visualRequirement: 'required',
    misconceptionTags: ['confuses_2d_3d'],
  },
  {
    id: 'P1-GEO-03',
    name: 'Sort Shapes by Properties',
    description: 'Group shapes using number of sides, corners, or curved/straight edges.',
    strand: 'Geometry',
    prerequisites: ['P1-GEO-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-GEO-01'],
    questionFamilies: ['QF_P1-GEO-03_001', 'QF_P1-GEO-03_002'],
    visualRequirement: 'required',
    misconceptionTags: ['sorts_by_appearance_not_property'],
  },
  {
    id: 'P1-GEO-04',
    name: 'Continue Shape Patterns',
    description: 'Identify the repeating unit in a shape pattern and continue it.',
    strand: 'Geometry',
    prerequisites: ['P1-GEO-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-GEO-01'],
    questionFamilies: ['QF_P1-GEO-04_001', 'QF_P1-GEO-04_002'],
    visualRequirement: 'required',
    misconceptionTags: ['pattern_looks_only_at_last'],
  },
  {
    id: 'P1-GEO-05',
    name: 'Create Simple Repeating Patterns',
    description: 'Build a repeating pattern using given shapes.',
    strand: 'Geometry',
    prerequisites: ['P1-GEO-04'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-GEO-04'],
    questionFamilies: ['QF_P1-GEO-05_001', 'QF_P1-GEO-05_002'],
    visualRequirement: 'required',
    misconceptionTags: ['pattern_random_sequence'],
  },
  {
    id: 'P1-GEO-06',
    name: 'Use Position Words',
    description: 'Understand and use above, below, beside, between, left, and right.',
    strand: 'Geometry',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-GEO-06_001', 'QF_P1-GEO-06_002'],
    visualRequirement: 'required',
    misconceptionTags: ['confuses_left_right', 'confuses_between_beside'],
  },
  {
    id: 'P1-GEO-07',
    name: 'Match Real Objects to Shapes',
    description: 'Connect everyday real-world objects to their corresponding shape names.',
    strand: 'Geometry',
    prerequisites: ['P1-GEO-01', 'P1-GEO-02'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-GEO-01', 'P1-GEO-02'],
    questionFamilies: ['QF_P1-GEO-07_001', 'QF_P1-GEO-07_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['matches_by_colour_or_use'],
  },
];

const skills = p1GeometrySkills.map((s) => ({ ...s }));

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

export function validateP1GeometrySkillGraph() {
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

export const p1GeometrySkillGraph = {
  domainId: 'p1-geometry',
  domainName: 'Primary 1 Geometry',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1GeometrySkillGraph;
