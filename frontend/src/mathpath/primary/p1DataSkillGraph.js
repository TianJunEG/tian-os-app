const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1DataSkills = [
  {
    id: 'P1-DAT-01',
    name: 'Read Simple Picture Graphs',
    description: 'Read a picture graph to find how many in one category.',
    strand: 'Data',
    prerequisites: ['P1-NUM-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-01'],
    questionFamilies: ['QF_P1-DAT-01_001', 'QF_P1-DAT-01_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_counts_all'],
  },
  {
    id: 'P1-DAT-02',
    name: 'Count Items in Each Category',
    description: 'Count pictures accurately within a category of a picture graph.',
    strand: 'Data',
    prerequisites: ['P1-DAT-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-DAT-01'],
    questionFamilies: ['QF_P1-DAT-02_001', 'QF_P1-DAT-02_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_counts_across_rows', 'graph_skips_picture'],
  },
  {
    id: 'P1-DAT-03',
    name: 'Compare Categories',
    description: 'Identify which category has the most, fewest, or same number.',
    strand: 'Data',
    prerequisites: ['P1-DAT-02'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-DAT-02'],
    questionFamilies: ['QF_P1-DAT-03_001', 'QF_P1-DAT-03_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_by_preference', 'graph_by_label_length'],
  },
  {
    id: 'P1-DAT-04',
    name: 'Find Total from a Graph',
    description: 'Add all category counts in a picture graph to find the total.',
    strand: 'Data',
    prerequisites: ['P1-DAT-02'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-DAT-02'],
    questionFamilies: ['QF_P1-DAT-04_001', 'QF_P1-DAT-04_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_largest_not_total'],
  },
  {
    id: 'P1-DAT-05',
    name: 'Answer Simple Data Questions',
    description: 'Interpret graph questions accurately, including "how many more" and "how many fewer".',
    strand: 'Data',
    prerequisites: ['P1-DAT-03', 'P1-DAT-04'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-DAT-03', 'P1-DAT-04'],
    questionFamilies: ['QF_P1-DAT-05_001', 'QF_P1-DAT-05_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_adds_instead_of_diff', 'graph_ignores_question'],
  },
  {
    id: 'P1-DAT-06',
    name: 'Complete a Simple Picture Graph',
    description: 'Add missing pictures to represent data in a picture graph.',
    strand: 'Data',
    prerequisites: ['P1-DAT-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-DAT-01'],
    questionFamilies: ['QF_P1-DAT-06_001', 'QF_P1-DAT-06_002'],
    visualRequirement: 'required',
    misconceptionTags: ['graph_draw_mismatch', 'graph_row_column_confusion'],
  },
];

const skills = p1DataSkills.map((s) => ({ ...s }));

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

export function validateP1DataSkillGraph() {
  const actualIds = skills.map((s) => s.id);
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const allKnownIds = new Set([...actualIds, 'P1-NUM-01']);
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

export const p1DataSkillGraph = {
  domainId: 'p1-data',
  domainName: 'Primary 1 Data (Picture Graphs)',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1DataSkillGraph;
