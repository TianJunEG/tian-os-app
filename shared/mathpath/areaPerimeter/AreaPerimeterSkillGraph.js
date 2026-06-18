// MathPath domain: AreaPerimeter
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const areaPerimeterSkills = [
  {
    id: 'AP001',
    slug: 'ap.perimeter-rect',
    name: 'Perimeter of rectangles and squares',
    description: 'Perimeter of rectangles and squares.',
    strand: 'Perimeter',
    prerequisites: [],
    crossDomainPrerequisites: ['geo.2d-properties', 'op.add.regroup'],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['ap/perimeter-area-confuse'],
    questionFamilies: ['QF_AP001_001', 'QF_AP001_002'],
  },
  {
    id: 'AP002',
    slug: 'ap.perimeter-polygon',
    name: 'Perimeter of composite shapes',
    description: 'Perimeter of composite shapes.',
    strand: 'Perimeter',
    prerequisites: ['AP001'],
    crossDomainPrerequisites: ['op.add.regroup'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP001'],
    misconceptions: ['ap/missing-side'],
    questionFamilies: ['QF_AP002_001', 'QF_AP002_002'],
  },
  {
    id: 'AP003',
    slug: 'ap.area-rect',
    name: 'Area of rectangles and squares',
    description: 'Area of rectangles and squares.',
    strand: 'Area',
    prerequisites: ['AP001'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP001'],
    misconceptions: ['ap/perimeter-area-confuse'],
    questionFamilies: ['QF_AP003_001', 'QF_AP003_002'],
  },
  {
    id: 'AP004',
    slug: 'ap.area-triangle',
    name: 'Area of triangles',
    description: 'Area of triangles.',
    strand: 'Area',
    prerequisites: ['AP003'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP003'],
    misconceptions: ['ap/triangle-no-half', 'ap/wrong-height'],
    questionFamilies: ['QF_AP004_001', 'QF_AP004_002'],
  },
  {
    id: 'AP005',
    slug: 'ap.area-composite',
    name: 'Area of composite figures',
    description: 'Area of composite figures.',
    strand: 'Area',
    prerequisites: ['AP003', 'AP004'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP004'],
    misconceptions: ['ap/overlap-region'],
    questionFamilies: ['QF_AP005_001', 'QF_AP005_002'],
  },
  {
    id: 'AP006',
    slug: 'ap.apply',
    name: 'Perimeter and area in real-world contexts',
    description: 'Perimeter and area in real-world contexts.',
    strand: 'Applications',
    prerequisites: ['AP003', 'AP001'],
    crossDomainPrerequisites: ['mea.unit-convert'],
    difficulty: 4,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP003'],
    misconceptions: ['mea/area-units'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_AP006_001', 'QF_AP006_002'],
  },

  // ── Secondary 1 (G1) — Mensuration: area of special quadrilaterals ──────────
  {
    id: 'AP007', slug: 'ap.area-parallelogram', name: 'Area of a parallelogram',
    description: 'Find the area of a parallelogram (base × height).',
    strand: 'Area', prerequisites: ['AP003'], crossDomainPrerequisites: [], difficulty: 3,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP003'], misconceptions: ['mea/use-slant-side', 'mea/area-units'],
    questionFamilies: ['QF_AP007_001', 'QF_AP007_002'],
  },
  {
    id: 'AP008', slug: 'ap.area-trapezium', name: 'Area of a trapezium',
    description: 'Find the area of a trapezium using ½(a + b)h.',
    strand: 'Area', prerequisites: ['AP007'], crossDomainPrerequisites: [], difficulty: 4,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AP007'], misconceptions: ['mea/trapezium-no-half', 'mea/area-units'],
    questionFamilies: ['QF_AP008_001', 'QF_AP008_002'],
  },
];

const skills = areaPerimeterSkills.map((skill) => ({ ...skill }));
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

export function validateAreaPerimeterSkillGraph() {
  const expectedIds = ['AP001', 'AP002', 'AP003', 'AP004', 'AP005', 'AP006', 'AP007', 'AP008'];
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

export const areaPerimeterSkillGraph = {
  domainId: 'area_perimeter',
  domainName: 'AreaPerimeter',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default areaPerimeterSkillGraph;
