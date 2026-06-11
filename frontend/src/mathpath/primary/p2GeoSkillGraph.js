const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2GeoSkills = [
  {
    id: 'P2-GEO-01',
    name: 'Naming 3D Solids',
    description: 'Identify and name 3D shapes (cube, cuboid, cone, cylinder, sphere) from everyday objects or property descriptions.',
    strand: 'Geometry',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P2-GEO-01_001',
      'QF_P2-GEO-01_002',
    ],
    visual: 'essential',
    misconceptions: ['confuses_cube_cuboid', 'confuses_2d_3d_names', 'confuses_cone_cylinder'],
  },
];

const skills = p2GeoSkills.map((s) => ({ ...s }));
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

export function validateP2GeoSkillGraph() {
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

export const p2GeoSkillGraph = {
  domainId: 'p2-geometry',
  domainName: 'Primary 2 Geometry',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2GeoSkillGraph;
