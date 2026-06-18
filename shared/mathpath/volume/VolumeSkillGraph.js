// MathPath domain: Volume
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const volumeSkills = [
  {
    id: 'VL001',
    slug: 'vol.unit-cubes',
    name: 'Counting unit cubes to find volume',
    description: 'Counting unit cubes to find volume.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['geo.3d-shapes', 'ns.count.to-1000'],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['vol/hidden-cubes'],
    questionFamilies: ['QF_VL001_001', 'QF_VL001_002', 'QF_VL001_003'],
  },
  {
    id: 'VL002',
    slug: 'vol.cuboid',
    name: 'Volume of cubes and cuboids',
    description: 'Volume of cubes and cuboids.',
    strand: 'Measurement',
    prerequisites: ['VL001'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['VL001'],
    misconceptions: ['mea/volume-add-edges'],
    questionFamilies: ['QF_VL002_001', 'QF_VL002_002', 'QF_VL002_003'],
  },
  {
    id: 'VL003',
    slug: 'vol.nets',
    name: 'Nets and volume of cuboids',
    description: 'Nets and volume of cuboids.',
    strand: 'Applications',
    prerequisites: ['VL002'],
    crossDomainPrerequisites: ['geo.nets-views'],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['VL002'],
    misconceptions: ['mea/net-dimensions'],
    questionFamilies: ['QF_VL003_001', 'QF_VL003_002', 'QF_VL003_003'],
  },
  {
    id: 'VL004',
    slug: 'vol.water-rate',
    name: 'Volume, water level and flow rate',
    description: 'Volume, water level and flow rate.',
    strand: 'Applications',
    prerequisites: ['VL002'],
    crossDomainPrerequisites: ['rr.rate'],
    difficulty: 5,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['VL002'],
    misconceptions: ['mea/rate-volume-confuse'],
    heuristic: 'ratio',
    questionFamilies: ['QF_VL004_001', 'QF_VL004_002', 'QF_VL004_003'],
  },
];

const skills = volumeSkills.map((skill) => ({ ...skill }));
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

export function validateVolumeSkillGraph() {
  const expectedIds = ['VL001', 'VL002', 'VL003', 'VL004'];
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

export const volumeSkillGraph = {
  domainId: 'volume',
  domainName: 'Volume',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default volumeSkillGraph;
