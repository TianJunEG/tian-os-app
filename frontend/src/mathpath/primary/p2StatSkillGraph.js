const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2StatSkills = [
  {
    id: 'P2-ST-01',
    name: 'Reading a Picture Graph',
    description: 'Count icons on a picture graph and multiply by the scale to find the value for a category.',
    strand: 'Statistics',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P2-ST-01_001',
      'QF_P2-ST-01_002',
      'QF_P2-ST-01_003',
    ],
    visual: 'essential',
    misconceptions: ['ignores_scale_on_graph', 'miscounts_icons'],
  },
  {
    id: 'P2-ST-02',
    name: 'Most & Least on a Picture Graph',
    description: 'Identify the category with the most or least items on a picture graph.',
    strand: 'Statistics',
    prerequisites: ['P2-ST-01'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 12 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P2-ST-01'],
    questionFamilies: [
      'QF_P2-ST-02_001',
      'QF_P2-ST-02_002',
    ],
    visual: 'essential',
    misconceptions: ['confuses_most_least', 'ignores_scale_on_graph'],
  },
];

const skills = p2StatSkills.map((s) => ({ ...s }));
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

export function validateP2StatSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P2-ST')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p2StatSkillGraph = {
  domainId: 'p2-statistics',
  domainName: 'Primary 2 Statistics',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2StatSkillGraph;
