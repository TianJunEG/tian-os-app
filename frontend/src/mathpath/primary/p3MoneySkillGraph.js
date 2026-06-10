const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3MoneySkills = [
  {
    id: 'P3-MON-01',
    name: 'Adding & Subtracting Money',
    description: 'Add and subtract money amounts in decimal notation (dollars and cents).',
    strand: 'Money',
    prerequisites: ['P3-AS-03', 'P3-AS-04'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-03', 'P3-AS-04'],
    questionFamilies: [
      'QF_P3-MON-01_001',
      'QF_P3-MON-01_002',
      'QF_P3-MON-01_003',
      'QF_P3-MON-01_004',
    ],
    visual: 'optional',
    misconceptions: ['decimal_alignment_error', 'drops_cents', 'dollar_sign_error'],
  },
  {
    id: 'P3-MON-02',
    name: 'Making Change',
    description: 'Find the change when paying with a note or coin, using subtraction or counting up.',
    strand: 'Money',
    prerequisites: ['P3-MON-01'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 15 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MON-01'],
    questionFamilies: [
      'QF_P3-MON-02_001',
      'QF_P3-MON-02_002',
      'QF_P3-MON-02_003',
    ],
    visual: 'useful',
    misconceptions: ['subtracts_wrong_way', 'forgets_cents_in_change', 'decimal_alignment_error'],
  },
];

const skills = p3MoneySkills.map((s) => ({ ...s }));
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

export function validateP3MoneySkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P3-AS')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills.filter((s) => s.prerequisites.every((p) => !skillById.has(p))).map((s) => s.id);
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

export const p3MoneySkillGraph = {
  domainId: 'p3-money',
  domainName: 'Primary 3 Money',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3MoneySkillGraph;
