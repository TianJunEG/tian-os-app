const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3AreaPerimSkills = [
  {
    id: 'P3-AP-01',
    name: 'Area of a Rectangle',
    description: 'Find the area of a rectangle or square using the formula length × width.',
    strand: 'Area and Perimeter',
    prerequisites: ['P3-MD-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: [
      'QF_P3-AP-01_001',
      'QF_P3-AP-01_002',
      'QF_P3-AP-01_003',
    ],
    visual: 'essential',
    misconceptions: ['confuses_area_perimeter', 'forgets_square_units', 'adds_instead_of_multiplies'],
  },
  {
    id: 'P3-AP-02',
    name: 'Perimeter of a Rectangle',
    description: 'Find the perimeter of a rectangle or square by adding all four sides.',
    strand: 'Area and Perimeter',
    prerequisites: ['P3-AS-01'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-01'],
    questionFamilies: [
      'QF_P3-AP-02_001',
      'QF_P3-AP-02_002',
      'QF_P3-AP-02_003',
    ],
    visual: 'essential',
    misconceptions: ['confuses_area_perimeter', 'forgets_two_pairs', 'only_adds_two_sides'],
  },
];

const skills = p3AreaPerimSkills.map((s) => ({ ...s }));
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

export function validateP3AreaPerimSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P3-MD') && !p.startsWith('P3-AS')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p3AreaPerimSkillGraph = {
  domainId: 'p3-area-perimeter',
  domainName: 'Primary 3 Area and Perimeter',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3AreaPerimSkillGraph;
