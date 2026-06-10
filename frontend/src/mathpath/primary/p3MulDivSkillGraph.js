const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3MulDivSkills = [
  {
    id: 'P3-MD-01',
    name: 'Multiplication Tables (6, 7, 8, 9)',
    description: 'Recall multiplication facts for the 6, 7, 8, and 9 times tables.',
    strand: 'Multiplication and Division',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 11 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P3-MD-01_001',
      'QF_P3-MD-01_002',
      'QF_P3-MD-01_003',
    ],
    visual: 'optional',
    mentalMathEligible: true,
    misconceptions: ['table_fact_confusion', 'counts_instead_of_recall'],
  },
  {
    id: 'P3-MD-02',
    name: 'Dividing Within the Tables',
    description: 'Use known multiplication facts (6-9 tables) to solve exact division.',
    strand: 'Multiplication and Division',
    prerequisites: ['P3-MD-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: [
      'QF_P3-MD-02_001',
      'QF_P3-MD-02_002',
      'QF_P3-MD-02_003',
    ],
    visual: 'optional',
    mentalMathEligible: true,
    misconceptions: ['division_as_subtraction', 'table_fact_confusion'],
  },
  {
    id: 'P3-MD-03',
    name: 'Division with Remainder',
    description: 'Divide and find the remainder when the dividend is not exactly divisible.',
    strand: 'Multiplication and Division',
    prerequisites: ['P3-MD-02'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 15 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-02'],
    questionFamilies: [
      'QF_P3-MD-03_001',
      'QF_P3-MD-03_002',
      'QF_P3-MD-03_003',
    ],
    visual: 'optional',
    misconceptions: ['remainder_equals_quotient', 'remainder_larger_than_divisor'],
  },
  {
    id: 'P3-MD-04',
    name: 'Multiply up to 3-digit by 1-digit',
    description: 'Multiply a 2- or 3-digit number by a 1-digit number using the standard algorithm.',
    strand: 'Multiplication and Division',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: [
      'QF_P3-MD-04_001',
      'QF_P3-MD-04_002',
      'QF_P3-MD-04_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['forgets_carry_in_multiplication', 'multiplies_digit_by_digit'],
  },
  {
    id: 'P3-MD-05',
    name: 'Divide up to 3-digit by 1-digit',
    description: 'Divide a 2- or 3-digit number by a 1-digit number using short/long division.',
    strand: 'Multiplication and Division',
    prerequisites: ['P3-MD-02', 'P3-MD-04'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-02', 'P3-MD-04'],
    questionFamilies: [
      'QF_P3-MD-05_001',
      'QF_P3-MD-05_002',
      'QF_P3-MD-05_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['long_div_place_value_skip', 'forgets_bring_down'],
  },
];

const skills = p3MulDivSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));

const dependentMap = new Map();
skills.forEach((s) => dependentMap.set(s.id, []));
skills.forEach((s) => {
  s.prerequisites.forEach((pid) => {
    if (dependentMap.has(pid)) dependentMap.get(pid).push(s.id);
  });
});

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP3MulDivSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p)).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills.filter((s) => s.prerequisites.length === 0).map((s) => s.id);
  const reachable = new Set(foundations);
  const queue = [...foundations];
  while (queue.length) {
    const c = queue.shift();
    (dependentMap.get(c) || []).forEach((d) => { if (!reachable.has(d)) { reachable.add(d); queue.push(d); } });
  }
  const unreachable = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
  const errors = [
    ...(dupes.length ? ['Duplicate skill IDs detected.'] : []),
    ...(badPrereqs.length ? ['Invalid prerequisite references detected.'] : []),
    ...(unreachable.length ? ['Unreachable skills detected.'] : []),
  ];
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, foundationSkills: foundations, duplicateIds: [...new Set(dupes)], invalidPrereqReferences: badPrereqs, unreachableSkills: unreachable }, errors };
}

export const p3MulDivSkillGraph = {
  domainId: 'p3-muldiv',
  domainName: 'Primary 3 Multiplication and Division',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3MulDivSkillGraph;
