const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2TimeSkills = [
  {
    id: 'P2-TM-01',
    name: 'Telling Time to 5 Minutes',
    description: 'Read and tell the time to the nearest 5 minutes from clock-hand descriptions or time in words.',
    strand: 'Time',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P2-TM-01_001',
      'QF_P2-TM-01_002',
      'QF_P2-TM-01_003',
    ],
    visual: 'essential',
    misconceptions: ['confuses_hour_minute_hands', 'reads_minutes_as_hours', 'off_by_five_minutes'],
  },
];

const skills = p2TimeSkills.map((s) => ({ ...s }));
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

export function validateP2TimeSkillGraph() {
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

export const p2TimeSkillGraph = {
  domainId: 'p2-time',
  domainName: 'Primary 2 Time',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2TimeSkillGraph;
