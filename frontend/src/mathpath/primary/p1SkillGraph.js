const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p1NumbersSkills = [
  {
    id: 'P1-NUM-01',
    name: 'Count Objects to 10',
    description: 'Count a set of objects up to 10 one-by-one.',
    strand: 'Numbers',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-NUM-01_001', 'QF_P1-NUM-01_002'],
    visual: 'required',
    misconceptions: ['skip_count_objects'],
  },
  {
    id: 'P1-NUM-02',
    name: 'Read and Write Numerals 0-10',
    description: 'Match a number word to its numeral and vice versa.',
    strand: 'Numbers',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_P1-NUM-02_001', 'QF_P1-NUM-02_002'],
    visual: 'optional',
    misconceptions: ['reverses_digits'],
  },
  {
    id: 'P1-NUM-03',
    name: 'Count Objects to 20',
    description: 'Count a set of objects from 11 to 20.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-01'],
    questionFamilies: ['QF_P1-NUM-03_001', 'QF_P1-NUM-03_002'],
    visual: 'required',
    misconceptions: ['teens_counting_error'],
  },
  {
    id: 'P1-NUM-04',
    name: 'Read and Write Numerals 11-20',
    description: 'Match a number word to its numeral and vice versa for 11-20.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-02'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-02'],
    questionFamilies: ['QF_P1-NUM-04_001', 'QF_P1-NUM-04_002'],
    visual: 'optional',
    misconceptions: ['reverses_digits'],
  },
  {
    id: 'P1-NUM-05',
    name: 'Count Objects to 40',
    description: 'Count a set of objects up to 40.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-03'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-03'],
    questionFamilies: ['QF_P1-NUM-05_001', 'QF_P1-NUM-05_002'],
    visual: 'required',
    misconceptions: ['loses_count_past_20'],
  },
  {
    id: 'P1-NUM-06',
    name: 'Read and Write Numerals to 40',
    description: 'Match a number word to its numeral and vice versa for numbers up to 40.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-04'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-04'],
    questionFamilies: ['QF_P1-NUM-06_001', 'QF_P1-NUM-06_002'],
    visual: 'optional',
    misconceptions: ['reverses_digits'],
  },
  {
    id: 'P1-NUM-07',
    name: 'Count Objects to 100',
    description: 'Count a set of objects up to 100.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-05'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-05'],
    questionFamilies: ['QF_P1-NUM-07_001', 'QF_P1-NUM-07_002'],
    visual: 'required',
    misconceptions: ['loses_count_past_20'],
  },
  {
    id: 'P1-NUM-08',
    name: 'Read and Write Numerals to 100',
    description: 'Match a number word to its numeral and vice versa for numbers up to 100.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-06'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-06'],
    questionFamilies: ['QF_P1-NUM-08_001', 'QF_P1-NUM-08_002'],
    visual: 'optional',
    misconceptions: ['reverses_digits'],
  },
  {
    id: 'P1-NUM-09',
    name: 'Number Bonds to 10',
    description: 'Know all pairs that add to 10 (1+9, 2+8, etc.).',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-01'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-01'],
    questionFamilies: ['QF_P1-NUM-09_001', 'QF_P1-NUM-09_002'],
    visual: 'useful',
    misconceptions: ['number_bond_recall_error'],
  },
  {
    id: 'P1-NUM-10',
    name: 'Compare and Order Numbers to 20',
    description: 'Use >, < or = to compare two numbers up to 20.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-03'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-03'],
    questionFamilies: ['QF_P1-NUM-10_001', 'QF_P1-NUM-10_002'],
    visual: 'useful',
    misconceptions: ['confuses_more_less_symbols'],
  },
  {
    id: 'P1-NUM-11',
    name: 'Compare and Order Numbers to 100',
    description: 'Use >, < or = to compare two numbers up to 100.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-07', 'P1-NUM-10'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-07', 'P1-NUM-10'],
    questionFamilies: ['QF_P1-NUM-11_001', 'QF_P1-NUM-11_002'],
    visual: 'useful',
    misconceptions: ['confuses_more_less_symbols'],
  },
  {
    id: 'P1-NUM-12',
    name: 'Number Patterns (count by 1s)',
    description: 'Fill in missing numbers in a counting sequence.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-07'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-07'],
    questionFamilies: ['QF_P1-NUM-12_001', 'QF_P1-NUM-12_002'],
    visual: 'useful',
    misconceptions: ['pattern_direction_error'],
  },
  {
    id: 'P1-NUM-13',
    name: 'Number Patterns (count by 2s, 5s, 10s)',
    description: 'Skip-counting sequences by 2s, 5s, and 10s.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-12'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-12'],
    questionFamilies: ['QF_P1-NUM-13_001', 'QF_P1-NUM-13_002'],
    visual: 'useful',
    misconceptions: ['skip_count_reverts_to_ones'],
  },
  {
    id: 'P1-NUM-14',
    name: 'Place Value (tens and ones to 40)',
    description: 'Decompose a number up to 40 into tens and ones.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-05'],
    difficulty: 2,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-05'],
    questionFamilies: ['QF_P1-NUM-14_001', 'QF_P1-NUM-14_002'],
    visual: 'required',
    misconceptions: ['swaps_tens_ones'],
  },
  {
    id: 'P1-NUM-15',
    name: 'Place Value (tens and ones to 100)',
    description: 'Decompose a number up to 100 into tens and ones.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-07', 'P1-NUM-14'],
    difficulty: 3,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-07', 'P1-NUM-14'],
    questionFamilies: ['QF_P1-NUM-15_001', 'QF_P1-NUM-15_002'],
    visual: 'required',
    misconceptions: ['swaps_tens_ones'],
  },
  {
    id: 'P1-NUM-16',
    name: 'Ordinal Numbers (1st to 10th)',
    description: 'Identify position using ordinal numbers.',
    strand: 'Numbers',
    prerequisites: ['P1-NUM-01'],
    difficulty: 1,
    singaporeLevel: ['P1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-01'],
    questionFamilies: ['QF_P1-NUM-16_001', 'QF_P1-NUM-16_002'],
    visual: 'required',
    misconceptions: ['ordinal_cardinal_confusion'],
  },
];

const skills = p1NumbersSkills.map((skill) => ({ ...skill }));

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

function unique(values) {
  return [...new Set(values)];
}

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

function detectCycles(allSkills) {
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];

  function dfs(id, stack) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    const skill = skillById.get(id);
    if (skill) {
      skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  allSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateP1NumbersSkillGraph() {
  const expectedIds = Array.from({ length: 16 }, (_, i) =>
    `P1-NUM-${String(i + 1).padStart(2, '0')}`
  );
  const actualIds = skills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );

  const cycles = detectCycles(skills);

  const foundationIds = skills
    .filter((skill) => skill.prerequisites.length === 0)
    .map((skill) => skill.id);
  const reachable = new Set();
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    getDependents(current).forEach((dependentId) => queue.push(dependentId));
  }
  const unreachableSkills = skills
    .filter((skill) => !reachable.has(skill.id))
    .map((skill) => skill.id);

  const errors = unique([
    ...(missingSkills.length ? ['Missing required skill IDs.'] : []),
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references detected.'] : []),
    ...(invalidRemediationReferences.length ? ['Invalid remediation references detected.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
    ...(unreachableSkills.length ? ['Unreachable skills detected.'] : []),
  ]);

  return {
    isValid: errors.length === 0,
    summary: {
      totalSkills: skills.length,
      foundationSkills: foundationIds,
      missingSkills,
      duplicateIds: unique(duplicateIds),
      invalidPrereqReferences,
      invalidRemediationReferences,
      cycles,
      unreachableSkills,
    },
    errors,
  };
}

export const p1NumbersSkillGraph = {
  domainId: 'p1-numbers',
  domainName: 'Primary 1 Numbers',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p1NumbersSkillGraph;
