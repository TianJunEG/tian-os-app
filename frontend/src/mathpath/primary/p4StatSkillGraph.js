const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4StatSkills = [
  {
    id: 'P4-ST-01',
    name: 'Reading a Line Graph',
    description: 'Read and interpret data from line graphs. Answer questions about specific values, changes between data points, and totals.',
    strand: 'Statistics',
    prerequisites: ['P3-ST-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-ST-01'],
    questionFamilies: [
      'QF_P4-ST-01_001',
      'QF_P4-ST-01_002',
      'QF_P4-ST-01_003',
    ],
    visual: 'essential',
    misconceptions: ['reads_wrong_axis', 'off_by_one_interval', 'adds_when_should_subtract'],
  },
  {
    id: 'P4-ST-02',
    name: 'Reading a Pie Chart',
    description: 'Read and interpret data from pie charts. Answer questions about specific sector values, totals, and differences.',
    strand: 'Statistics',
    prerequisites: ['P3-ST-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-ST-01'],
    questionFamilies: [
      'QF_P4-ST-02_001',
      'QF_P4-ST-02_002',
      'QF_P4-ST-02_003',
    ],
    visual: 'essential',
    misconceptions: ['confuses_sector_with_total', 'reads_wrong_axis', 'adds_when_should_subtract'],
  },
];

const skills = p4StatSkills.map((s) => ({ ...s }));
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

export function validateP4StatSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P3-ST') && !p.startsWith('P4-ST')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p4StatSkillGraph = {
  domainId: 'p4-statistics',
  domainName: 'Primary 4 Statistics',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4StatSkillGraph;
