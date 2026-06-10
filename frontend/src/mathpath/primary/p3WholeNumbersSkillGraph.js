const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3WholeNumbersSkills = [
  {
    id: 'P3-WN-01',
    name: 'Place Value (thousands, hundreds, tens, ones)',
    description: 'Read, write, and decompose numbers up to 10 000 using place value.',
    strand: 'Whole Numbers',
    prerequisites: ['P1-NUM-15'],
    difficulty: 1,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-NUM-15'],
    questionFamilies: [
      'QF_P3-WN-01_001',
      'QF_P3-WN-01_002',
      'QF_P3-WN-01_003',
      'QF_P3-WN-01_004',
    ],
    visual: 'useful',
    misconceptions: ['confuses_place_columns', 'zero_placeholder_error'],
  },
  {
    id: 'P3-WN-02',
    name: 'Comparing & Ordering Numbers to 10 000',
    description: 'Compare pairs and order sets of numbers up to 10 000.',
    strand: 'Whole Numbers',
    prerequisites: ['P3-WN-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WN-01'],
    questionFamilies: [
      'QF_P3-WN-02_001',
      'QF_P3-WN-02_002',
      'QF_P3-WN-02_003',
    ],
    visual: 'useful',
    misconceptions: ['compares_digit_by_digit_wrong_order', 'confuses_more_less_symbols'],
  },
  {
    id: 'P3-WN-03',
    name: 'Number Patterns (hundreds/thousands steps)',
    description: 'Identify and continue number patterns with constant steps in the hundreds or thousands.',
    strand: 'Whole Numbers',
    prerequisites: ['P3-WN-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WN-01'],
    questionFamilies: [
      'QF_P3-WN-03_001',
      'QF_P3-WN-03_002',
      'QF_P3-WN-03_003',
    ],
    visual: 'useful',
    misconceptions: ['pattern_step_error', 'pattern_direction_error'],
  },
];

const skills = p3WholeNumbersSkills.map((skill) => ({ ...skill }));

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

export function validateP3WholeNumbersSkillGraph() {
  const expectedIds = ['P3-WN-01', 'P3-WN-02', 'P3-WN-03'];
  const actualIds = skills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId) && !prereqId.startsWith('P1-'))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId) && !targetId.startsWith('P1-'))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );

  const cycles = detectCycles(skills);

  const foundationIds = skills
    .filter((skill) => skill.prerequisites.every((p) => p.startsWith('P1-')))
    .map((skill) => skill.id);
  const reachable = new Set(foundationIds);
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    getDependents(current).forEach((depId) => {
      if (!reachable.has(depId)) {
        reachable.add(depId);
        queue.push(depId);
      }
    });
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

export const p3WholeNumbersSkillGraph = {
  domainId: 'p3-whole-numbers',
  domainName: 'Primary 3 Whole Numbers',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3WholeNumbersSkillGraph;
