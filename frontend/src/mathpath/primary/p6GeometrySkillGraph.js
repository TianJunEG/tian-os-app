const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6GeometrySkills = [
  {
    id: 'P6-GEO-01',
    name: 'Angles in Parallel Lines',
    description: 'Identify and calculate corresponding, alternate, and co-interior angles formed when a transversal crosses parallel lines.',
    strand: 'Geometry',
    prerequisites: ['P5-GEO-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-GEO-01'],
    questionFamilies: [
      'QF_P6-GEO-01_001',
      'QF_P6-GEO-01_002',
      'QF_P6-GEO-01_003',
    ],
    visual: 'essential',
    misconceptions: [
      'confuses_corresponding_alternate',
      'forgets_co_interior_sum',
      'confuses_supplementary_complementary',
    ],
  },
  {
    id: 'P6-GEO-02',
    name: 'Angle Properties of Quadrilaterals',
    description: 'Apply angle-sum property (360°) and specific properties of parallelogram, trapezium, and rhombus to find unknown angles.',
    strand: 'Geometry',
    prerequisites: ['P6-GEO-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-GEO-01'],
    questionFamilies: [
      'QF_P6-GEO-02_001',
      'QF_P6-GEO-02_002',
      'QF_P6-GEO-02_003',
    ],
    visual: 'essential',
    misconceptions: [
      'assumes_all_angles_equal_in_parallelogram',
      'wrong_angle_sum_quadrilateral',
      'confuses_supplementary_complementary',
    ],
  },
  {
    id: 'P6-GEO-03',
    name: 'Finding Unknown Angles in Figures',
    description: 'Solve multi-step angle problems combining triangle angle sum, angles on a straight line, vertically opposite angles, and quadrilateral properties.',
    strand: 'Geometry',
    prerequisites: ['P6-GEO-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 45 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-GEO-02'],
    questionFamilies: [
      'QF_P6-GEO-03_001',
      'QF_P6-GEO-03_002',
      'QF_P6-GEO-03_003',
    ],
    visual: 'essential',
    misconceptions: [
      'forgets_isosceles_base_angles',
      'vertically_opposite_adds_to_180',
      'straight_line_angle_wrong_pair',
      'triangle_exterior_angle_error',
    ],
  },
];

const skills = p6GeometrySkills.map((s) => ({ ...s }));
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

export function validateP6GeometrySkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P5-')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p6GeometrySkillGraph = {
  domainId: 'p6-geometry',
  domainName: 'Primary 6 Geometry',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p6GeometrySkillGraph;
