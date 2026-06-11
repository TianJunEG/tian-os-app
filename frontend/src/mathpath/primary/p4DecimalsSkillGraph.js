const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4DecimalsSkills = [
  {
    id: 'P4-DEC-01',
    name: 'Decimal Place Value (tenths, hundredths, thousandths)',
    description: 'Read, write, compose, and decompose decimals up to 3 decimal places using place value.',
    strand: 'Decimals',
    prerequisites: ['P3-WN-01'],
    difficulty: 1,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WN-01'],
    questionFamilies: [
      'QF_P4-DEC-01_001',
      'QF_P4-DEC-01_002',
      'QF_P4-DEC-01_003',
    ],
    visual: 'useful',
    misconceptions: ['confuses_decimal_columns', 'ignores_decimal_point'],
  },
  {
    id: 'P4-DEC-02',
    name: 'Comparing Decimals',
    description: 'Compare and order decimals using place value reasoning.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01'],
    questionFamilies: [
      'QF_P4-DEC-02_001',
      'QF_P4-DEC-02_002',
      'QF_P4-DEC-02_003',
    ],
    visual: 'useful',
    misconceptions: ['more_digits_means_larger', 'ignores_decimal_point'],
  },
  {
    id: 'P4-DEC-03',
    name: 'Rounding Decimals',
    description: 'Round decimals to the nearest whole number, 1 decimal place, or 2 decimal places.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01'],
    questionFamilies: [
      'QF_P4-DEC-03_001',
      'QF_P4-DEC-03_002',
      'QF_P4-DEC-03_003',
    ],
    visual: 'useful',
    misconceptions: ['rounds_wrong_direction', 'confuses_decimal_columns'],
  },
  {
    id: 'P4-DEC-04',
    name: 'Adding & Subtracting Decimals (up to 2 dp)',
    description: 'Add and subtract decimals up to 2 decimal places, aligning decimal points.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01', 'P4-FO-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01', 'P4-FO-01'],
    questionFamilies: [
      'QF_P4-DEC-04_001',
      'QF_P4-DEC-04_002',
      'QF_P4-DEC-04_003',
    ],
    visual: 'useful',
    misconceptions: ['misaligns_decimal_points', 'ignores_decimal_point'],
  },
  {
    id: 'P4-DEC-05',
    name: 'Multiply/Divide Decimals by 1-digit Whole Number',
    description: 'Multiply or divide a decimal by a 1-digit whole number, placing the decimal point correctly.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01', 'P4-FO-02'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01', 'P4-FO-02'],
    questionFamilies: [
      'QF_P4-DEC-05_001',
      'QF_P4-DEC-05_002',
      'QF_P4-DEC-05_003',
    ],
    visual: 'useful',
    misconceptions: ['decimal_point_wrong_after_multiply', 'ignores_decimal_point'],
  },
  {
    id: 'P4-DEC-06',
    name: 'Fraction to Decimal Conversion',
    description: 'Convert fractions with denominators that are factors of 10 or 100 into decimals.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01', 'P4-FR-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01', 'P4-FR-01'],
    questionFamilies: [
      'QF_P4-DEC-06_001',
      'QF_P4-DEC-06_002',
      'QF_P4-DEC-06_003',
    ],
    visual: 'useful',
    misconceptions: ['fraction_denominator_conversion_error', 'confuses_decimal_columns'],
  },
];

const skills = p4DecimalsSkills.map((skill) => ({ ...skill }));

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

export function validateP4DecimalsSkillGraph() {
  const expectedIds = ['P4-DEC-01', 'P4-DEC-02', 'P4-DEC-03', 'P4-DEC-04', 'P4-DEC-05', 'P4-DEC-06'];
  const actualIds = skills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const externalPrefixes = ['P1-', 'P2-', 'P3-', 'P4-FO', 'P4-FR', 'P4-FM'];
  const isExternalRef = (ref) => externalPrefixes.some((p) => ref.startsWith(p)) && !skillById.has(ref);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId) && !isExternalRef(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId) && !isExternalRef(targetId))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );

  const cycles = detectCycles(skills);

  const foundationIds = skills
    .filter((skill) => skill.prerequisites.every((p) => !skillById.has(p)))
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

export const p4DecimalsSkillGraph = {
  domainId: 'p4-decimals',
  domainName: 'Primary 4 Decimals',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4DecimalsSkillGraph;
