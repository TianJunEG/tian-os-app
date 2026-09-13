// MathPath domain: Geometry
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const geometrySkills = [
  {
    id: 'GE001',
    slug: 'geo.2d-shapes',
    name: 'Identifying 2D shapes',
    description: 'Identifying 2D shapes.',
    strand: '2D Shapes',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/orientation-changes-shape'],
    questionFamilies: ['QF_GE001_001', 'QF_GE001_002', 'QF_GE001_003'],
  },
  {
    id: 'GE002',
    slug: 'geo.2d-properties',
    name: 'Properties of 2D shapes (sides and vertices)',
    description: 'Properties of 2D shapes (sides and vertices).',
    strand: '2D Shapes',
    prerequisites: ['GE001'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/side-vertex-count'],
    questionFamilies: ['QF_GE002_001', 'QF_GE002_002', 'QF_GE002_003'],
  },
  {
    id: 'GE003',
    slug: 'geo.lines',
    name: 'Parallel and perpendicular lines',
    description: 'Parallel and perpendicular lines.',
    strand: 'Lines',
    prerequisites: ['GE002', 'GE004'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/parallel-perp-confuse'],
    questionFamilies: ['QF_GE003_001', 'QF_GE003_002', 'QF_GE003_003'],
  },
  {
    id: 'GE004',
    slug: 'geo.angle-intro',
    name: 'Angle types (right, acute, obtuse)',
    description: 'Angle types (right, acute, obtuse).',
    strand: 'Angles',
    prerequisites: ['GE002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/angle-by-arm-length'],
    questionFamilies: ['QF_GE004_001', 'QF_GE004_002', 'QF_GE004_003'],
  },
  {
    id: 'GE005',
    slug: 'geo.angle-measure',
    name: 'Measuring and drawing angles',
    description: 'Measuring and drawing angles.',
    strand: 'Angles',
    prerequisites: ['GE004'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/protractor-scale'],
    questionFamilies: ['QF_GE005_001', 'QF_GE005_002', 'QF_GE005_003'],
  },
  {
    id: 'GE006',
    slug: 'geo.angle-line-point',
    name: 'Angles on a line and at a point',
    description: 'Angles on a line and at a point.',
    strand: 'Lines',
    prerequisites: ['GE005'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/angle-relationship'],
    questionFamilies: ['QF_GE006_001', 'QF_GE006_002', 'QF_GE006_003'],
  },
  {
    id: 'GE007',
    slug: 'geo.triangle-types',
    name: 'Types of triangles',
    description: 'Types of triangles.',
    strand: 'Angles',
    prerequisites: ['GE002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/triangle-by-look'],
    questionFamilies: ['QF_GE007_001', 'QF_GE007_002', 'QF_GE007_003'],
  },
  {
    id: 'GE008',
    slug: 'geo.triangle-angles',
    name: 'Angle properties of triangles',
    description: 'Angle properties of triangles.',
    strand: 'Angles',
    prerequisites: ['GE007', 'GE006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/angle-sum-wrong'],
    questionFamilies: ['QF_GE008_001', 'QF_GE008_002', 'QF_GE008_003'],
  },
  {
    id: 'GE009',
    slug: 'geo.quad-types',
    name: 'Types of quadrilaterals and their properties',
    description: 'Types of quadrilaterals and their properties.',
    strand: 'Quadrilaterals',
    prerequisites: ['GE002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/square-not-rectangle'],
    questionFamilies: ['QF_GE009_001', 'QF_GE009_002', 'QF_GE009_003'],
  },
  {
    id: 'GE010',
    slug: 'geo.angle-quad',
    name: 'Angles in special quadrilaterals',
    description: 'Angles in special quadrilaterals.',
    strand: 'Angles',
    prerequisites: ['GE009', 'GE006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/quad-angle-relationship'],
    questionFamilies: ['QF_GE010_001', 'QF_GE010_002', 'QF_GE010_003'],
  },
  {
    id: 'GE011',
    slug: 'geo.symmetry',
    name: 'Line symmetry',
    description: 'Line symmetry.',
    strand: 'Symmetry',
    prerequisites: ['GE002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/diagonal-symmetry-miss'],
    questionFamilies: ['QF_GE011_001', 'QF_GE011_002', 'QF_GE011_003'],
  },
  {
    id: 'GE012',
    slug: 'geo.symmetry-complete',
    name: 'Completing symmetric figures',
    description: 'Completing symmetric figures.',
    strand: 'Symmetry',
    prerequisites: ['GE011'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/reflect-not-translate'],
    questionFamilies: ['QF_GE012_001', 'QF_GE012_002', 'QF_GE012_003'],
  },
  {
    id: 'GE013',
    slug: 'geo.3d-shapes',
    name: 'Identifying 3D solids (faces, edges, vertices)',
    description: 'Identifying 3D solids (faces, edges, vertices).',
    strand: '3D Shapes',
    prerequisites: ['GE001'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/faces-edges-confuse'],
    questionFamilies: ['QF_GE013_001', 'QF_GE013_002', 'QF_GE013_003'],
  },
  {
    id: 'GE014',
    slug: 'geo.nets-views',
    name: 'Nets and views of solids',
    description: 'Nets and views of solids.',
    strand: '3D Shapes',
    prerequisites: ['GE013'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/net-folding'],
    questionFamilies: ['QF_GE014_001', 'QF_GE014_002', 'QF_GE014_003'],
  },
  {
    id: 'GE015',
    slug: 'geo.position',
    name: 'Position and compass directions',
    description: 'Position and compass directions.',
    strand: 'Construction',
    prerequisites: ['GE003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/compass-confuse'],
    questionFamilies: ['QF_GE015_001', 'QF_GE015_002', 'QF_GE015_003'],
  },
  {
    id: 'GE016',
    slug: 'geo.construct',
    name: 'Drawing and constructing figures',
    description: 'Drawing and constructing figures.',
    strand: 'Construction',
    prerequisites: ['GE005', 'GE003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/construction-precision'],
    questionFamilies: ['QF_GE016_001', 'QF_GE016_002', 'QF_GE016_003'],
  },
  {
    id: 'GE017',
    slug: 'geo.perimeter',
    name: 'Perimeter foundations (distance around)',
    description: 'Perimeter foundations (distance around).',
    strand: 'Perimeter',
    prerequisites: ['GE002'],
    crossDomainPrerequisites: ['op.add.regroup'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/perimeter-vs-area'],
    questionFamilies: ['QF_GE017_001', 'QF_GE017_002', 'QF_GE017_003'],
  },
  {
    id: 'GE018',
    slug: 'geo.area-rect',
    name: 'Area foundations (covering; rectangles)',
    description: 'Area foundations (covering; rectangles).',
    strand: 'Area',
    prerequisites: ['GE017'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/area-add-sides'],
    questionFamilies: ['QF_GE018_001', 'QF_GE018_002', 'QF_GE018_003'],
  },
  {
    id: 'GE019',
    slug: 'geo.area-triangle',
    name: 'Area of triangles',
    description: 'Area of triangles.',
    strand: 'Angles',
    prerequisites: ['GE018', 'GE007'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/triangle-no-half', 'geo/wrong-height'],
    questionFamilies: ['QF_GE019_001', 'QF_GE019_002', 'QF_GE019_003'],
  },
  {
    id: 'GE020',
    slug: 'geo.circle',
    name: 'Circumference and area of a circle',
    description: 'Circumference and area of a circle.',
    strand: 'Circles',
    prerequisites: ['GE018'],
    crossDomainPrerequisites: ['dec.mult-whole'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/radius-diameter-confuse', 'geo/circumference-area-formula'],
    questionFamilies: ['QF_GE020_001', 'QF_GE020_002', 'QF_GE020_003'],
  },
  {
    id: 'GE021',
    slug: 'geo.circle-parts',
    name: 'Perimeter and area of circle parts',
    description: 'Perimeter and area of circle parts.',
    strand: 'Circles',
    prerequisites: ['GE020'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/forgot-straight-edges'],
    questionFamilies: ['QF_GE021_001', 'QF_GE021_002', 'QF_GE021_003'],
  },
  {
    id: 'GE022',
    slug: 'geo.composite',
    name: 'Composite figures: area and perimeter',
    description: 'Composite figures: area and perimeter.',
    strand: 'Composite',
    prerequisites: ['GE019', 'GE021', 'GE017'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['geo/double-count-edges', 'geo/missing-region'],
    questionFamilies: ['QF_GE022_001', 'QF_GE022_002', 'QF_GE022_003'],
  },
];

const skills = geometrySkills.map((skill) => ({ ...skill }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
skills.forEach((skill) => dependentMap.set(skill.id, []));
skills.forEach((skill) => {
  skill.prerequisites.forEach((prereqId) => {
    if (dependentMap.has(prereqId)) dependentMap.get(prereqId).push(skill.id);
  });
});

function unique(values) {
  return [...new Set(values)];
}

export function getSkill(skillId) {
  return skillById.get(skillId) || null;
}

export function getPrerequisites(skillId) {
  return getSkill(skillId)?.prerequisites || [];
}

export function getDependents(skillId) {
  return dependentMap.get(skillId) || [];
}

export function getRemediationTargets(skillId) {
  return getSkill(skillId)?.remediationIfWeak || [];
}

export function getSkillPath(skillId) {
  if (!skillById.has(skillId)) return [];
  const visited = new Set();
  const path = [];
  function walk(currentId) {
    if (visited.has(currentId)) return;
    visited.add(currentId);
    const prereqs = getPrerequisites(currentId);
    if (prereqs.length > 0) walk(prereqs[0]);
    path.push(currentId);
  }
  walk(skillId);
  return path;
}

export function getDependencyMap() {
  return skills.reduce((acc, skill) => {
    acc[skill.id] = {
      prerequisites: [...skill.prerequisites],
      dependents: getDependents(skill.id),
      remediationIfWeak: [...skill.remediationIfWeak],
    };
    return acc;
  }, {});
}

function detectCycles(graphSkills) {
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(id, stack) {
    if (visiting.has(id)) { cycles.push([...stack.slice(stack.indexOf(id)), id]); return; }
    if (visited.has(id)) return;
    visiting.add(id); stack.push(id);
    const skill = skillById.get(id);
    if (skill) skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    stack.pop(); visiting.delete(id); visited.add(id);
  }
  graphSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateGeometrySkillGraph() {
  const expectedIds = ['GE001', 'GE002', 'GE003', 'GE004', 'GE005', 'GE006', 'GE007', 'GE008', 'GE009', 'GE010', 'GE011', 'GE012', 'GE013', 'GE014', 'GE015', 'GE016', 'GE017', 'GE018', 'GE019', 'GE020', 'GE021', 'GE022'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites.filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );
  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak.filter((targetId) => !skillById.has(targetId))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );
  const cycles = detectCycles(skills);
  const foundationIds = skills.filter((skill) => skill.prerequisites.length === 0).map((skill) => skill.id);
  const reachable = new Set();
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    getDependents(current).forEach((dependentId) => queue.push(dependentId));
  }
  const unreachableSkills = skills.filter((skill) => !reachable.has(skill.id)).map((skill) => skill.id);
  const errors = unique([
    ...(missingSkills.length ? ['Missing required skill IDs.'] : []),
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
  ]);
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, foundationSkills: foundationIds, missingSkills, duplicateIds: unique(duplicateIds), invalidPrereqReferences, cycles, unreachableSkills }, errors };
}

export const geometrySkillGraph = {
  domainId: 'geometry',
  domainName: 'Geometry',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default geometrySkillGraph;
