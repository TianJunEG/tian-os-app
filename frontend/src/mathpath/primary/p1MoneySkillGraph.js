const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1MoneySkills = [
  {
    id: 'P1-MON-01',
    name: 'Recognise Singapore Coins and Notes',
    description: 'Identify Singapore coins (1¢, 5¢, 10¢, 20¢, 50¢) and notes ($1, $2, $5, $10) by sight.',
    strand: 'Money',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-MON-01_001', 'QF_P1-MON-01_002'],
    visualRequirement: 'required',
    misconceptionTags: ['coin_size_value_confusion'],
  },
  {
    id: 'P1-MON-02',
    name: 'Match Coins and Notes to Values',
    description: 'Connect the visual appearance of Singapore coins and notes to their numerical value.',
    strand: 'Money',
    prerequisites: ['P1-MON-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-01'],
    questionFamilies: ['QF_P1-MON-02_001', 'QF_P1-MON-02_002'],
    visualRequirement: 'required',
    misconceptionTags: ['dollar_cent_confusion'],
  },
  {
    id: 'P1-MON-03',
    name: 'Count Simple Money Amounts',
    description: 'Add the values of coins and notes to find the total amount of money.',
    strand: 'Money',
    prerequisites: ['P1-MON-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-01'],
    questionFamilies: ['QF_P1-MON-03_001', 'QF_P1-MON-03_002'],
    visualRequirement: 'required',
    misconceptionTags: ['counts_coins_not_value'],
  },
  {
    id: 'P1-MON-04',
    name: 'Compare Money Amounts',
    description: 'Decide which of two money amounts is more or less.',
    strand: 'Money',
    prerequisites: ['P1-MON-03'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-03'],
    questionFamilies: ['QF_P1-MON-04_001', 'QF_P1-MON-04_002'],
    visualRequirement: 'required',
    misconceptionTags: ['more_coins_means_more_money'],
  },
  {
    id: 'P1-MON-05',
    name: 'Add Simple Money Amounts',
    description: 'Combine two money amounts to find the total cost.',
    strand: 'Money',
    prerequisites: ['P1-MON-03'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-03'],
    questionFamilies: ['QF_P1-MON-05_001', 'QF_P1-MON-05_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['money_add_ignores_units'],
  },
  {
    id: 'P1-MON-06',
    name: 'Find Simple Change',
    description: 'Calculate change by finding the difference between the amount paid and the cost.',
    strand: 'Money',
    prerequisites: ['P1-MON-03'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-03'],
    questionFamilies: ['QF_P1-MON-06_001', 'QF_P1-MON-06_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['change_adds_cost_and_paid'],
  },
  {
    id: 'P1-MON-07',
    name: 'Choose Enough Money',
    description: 'Decide whether a given amount of money is enough to buy an item or items.',
    strand: 'Money',
    prerequisites: ['P1-MON-04'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-MON-04'],
    questionFamilies: ['QF_P1-MON-07_001', 'QF_P1-MON-07_002'],
    visualRequirement: 'useful',
    misconceptionTags: ['enough_money_focuses_on_object'],
  },
];

const skills = p1MoneySkills.map((s) => ({ ...s }));

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

export function validateP1MoneySkillGraph() {
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

export const p1MoneySkillGraph = {
  domainId: 'p1-money',
  domainName: 'Primary 1 Money',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1MoneySkillGraph;
