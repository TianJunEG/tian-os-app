const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6AreaVolSkills = [
  {
    id: 'P6-AV-01',
    name: 'Area of Composite Figures',
    description: 'Find the area of composite figures formed by combining or cutting rectangles and triangles (L-shapes, T-shapes, and similar).',
    strand: 'Area and Volume',
    prerequisites: ['P5-AV-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-AV-01'],
    questionFamilies: [
      'QF_P6-AV-01_001',
      'QF_P6-AV-01_002',
      'QF_P6-AV-01_003',
    ],
    visual: 'essential',
    misconceptions: ['confuses_area_perimeter', 'forgets_subtract_cutout', 'uses_wrong_dimensions_for_composite'],
  },
  {
    id: 'P6-AV-02',
    name: 'Volume of Cubes & Cuboids',
    description: 'Find the volume of cubes and cuboids, find a missing dimension given volume, and calculate the volume of composite solids made from two cuboids.',
    strand: 'Area and Volume',
    prerequisites: ['P5-AV-02'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-AV-02'],
    questionFamilies: [
      'QF_P6-AV-02_001',
      'QF_P6-AV-02_002',
      'QF_P6-AV-02_003',
    ],
    visual: 'essential',
    misconceptions: ['volume_uses_area_formula', 'wrong_dimension_for_missing_side', 'adds_volumes_incorrectly'],
  },
  {
    id: 'P6-AV-03',
    name: 'Volume & Water Problems',
    description: 'Solve problems involving water level changes when objects are submerged, volume of water in containers, and fraction of container filled.',
    strand: 'Area and Volume',
    prerequisites: ['P6-AV-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 50 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-AV-02'],
    questionFamilies: [
      'QF_P6-AV-03_001',
      'QF_P6-AV-03_002',
      'QF_P6-AV-03_003',
    ],
    visual: 'essential',
    misconceptions: ['water_rise_uses_total_volume', 'forgets_object_displaces_water', 'volume_uses_area_formula'],
  },
];

const skills = p6AreaVolSkills.map((s) => ({ ...s }));
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

export function validateP6AreaVolSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites
      .filter((p) => !skillById.has(p) && !p.startsWith('P5-AV'))
      .map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills
    .filter((s) => s.prerequisites.every((p) => !skillById.has(p)))
    .map((s) => s.id);
  const reachable = new Set(foundations);
  const queue = [...foundations];
  while (queue.length) {
    const c = queue.shift();
    (dependentMap.get(c) || []).forEach((d) => {
      if (!reachable.has(d)) { reachable.add(d); queue.push(d); }
    });
  }
  const unreachable = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
  const errors = [
    ...(dupes.length ? ['Duplicate skill IDs detected.'] : []),
    ...(badPrereqs.length ? ['Invalid prerequisite references detected.'] : []),
    ...(unreachable.length ? ['Unreachable skills detected.'] : []),
  ];
  return {
    isValid: errors.length === 0,
    summary: {
      totalSkills: skills.length,
      foundationSkills: foundations,
      duplicateIds: [...new Set(dupes)],
      invalidPrereqReferences: badPrereqs,
      unreachableSkills: unreachable,
    },
    errors,
  };
}

export const p6AreaVolSkillGraph = {
  domainId: 'p6-area-volume',
  domainName: 'Primary 6 Area and Volume',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p6AreaVolSkillGraph;
