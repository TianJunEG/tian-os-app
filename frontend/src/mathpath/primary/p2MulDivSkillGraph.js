const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2MulDivSkills = [
  {
    id: 'P2-MD-01',
    name: 'Multiplication Tables (2, 3, 4, 5, 10)',
    description: 'Recall multiplication facts for the 2, 3, 4, 5, and 10 times tables.',
    strand: 'Multiplication and Division',
    prerequisites: ['P1-EQG-01', 'P1-EQG-02'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P1-EQG-01', 'P1-EQG-02'],
    questionFamilies: [
      'QF_P2-MD-01_001',
      'QF_P2-MD-01_002',
      'QF_P2-MD-01_003',
    ],
    visual: 'optional',
    mentalMathEligible: true,
    misconceptions: ['times_table_recall_error', 'confuses_multiplication_addition'],
  },
  {
    id: 'P2-MD-02',
    name: 'Dividing Within the Tables',
    description: 'Use known multiplication facts (2, 3, 4, 5, 10 tables) to solve exact division.',
    strand: 'Multiplication and Division',
    prerequisites: ['P2-MD-01'],
    difficulty: 2,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P2-MD-01'],
    questionFamilies: [
      'QF_P2-MD-02_001',
      'QF_P2-MD-02_002',
      'QF_P2-MD-02_003',
    ],
    visual: 'optional',
    mentalMathEligible: true,
    misconceptions: ['division_remainder_confusion', 'division_as_repeated_subtraction_error', 'commutative_for_division_error'],
  },
];

const skills = p2MulDivSkills.map((s) => ({ ...s }));
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

export function validateP2MulDivSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p)).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills.filter((s) => s.prerequisites.length === 0 || s.prerequisites.every((p) => !skillById.has(p))).map((s) => s.id);
  const reachable = new Set(foundations);
  const queue = [...foundations];
  while (queue.length) {
    const c = queue.shift();
    (dependentMap.get(c) || []).forEach((d) => { if (!reachable.has(d)) { reachable.add(d); queue.push(d); } });
  }
  const unreachable = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
  const errors = [
    ...(dupes.length ? ['Duplicate skill IDs detected.'] : []),
    ...(unreachable.length ? ['Unreachable skills detected.'] : []),
  ];
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, foundationSkills: foundations, duplicateIds: [...new Set(dupes)], invalidPrereqReferences: badPrereqs, unreachableSkills: unreachable }, errors };
}

export const p2MulDivSkillGraph = {
  domainId: 'p2-muldiv',
  domainName: 'Primary 2 Multiplication and Division',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2MulDivSkillGraph;
