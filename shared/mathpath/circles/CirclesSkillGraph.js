// MathPath domain: Circles
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const circlesSkills = [
  {
    id: 'CI001',
    slug: 'cir.parts',
    name: 'Parts of a circle (radius, diameter, centre)',
    description: 'Parts of a circle (radius, diameter, centre).',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['geo.2d-shapes'],
    difficulty: 1,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['cir/radius-diameter'],
    questionFamilies: ['QF_CI001_001', 'QF_CI001_002'],
  },
  {
    id: 'CI002',
    slug: 'cir.circumference',
    name: 'Circumference of a circle',
    description: 'Circumference of a circle.',
    strand: 'Measurement',
    prerequisites: ['CI001'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['CI001'],
    misconceptions: ['cir/radius-diameter', 'cir/no-pi'],
    questionFamilies: ['QF_CI002_001', 'QF_CI002_002'],
  },
  {
    id: 'CI003',
    slug: 'cir.area',
    name: 'Area of a circle',
    description: 'Area of a circle.',
    strand: 'Measurement',
    prerequisites: ['CI002'],
    crossDomainPrerequisites: ['ap.area-rect'],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['CI002'],
    misconceptions: ['cir/area-uses-diameter', 'cir/no-pi'],
    questionFamilies: ['QF_CI003_001', 'QF_CI003_002'],
  },
  {
    id: 'CI004',
    slug: 'cir.semi-quarter',
    name: 'Semicircles and quarter-circles',
    description: 'Semicircles and quarter-circles.',
    strand: 'Applications',
    prerequisites: ['CI003'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['CI003'],
    misconceptions: ['cir/half-wrong', 'cir/perimeter-arc-only'],
    questionFamilies: ['QF_CI004_001', 'QF_CI004_002'],
  },
];

const skills = circlesSkills.map((skill) => ({ ...skill }));
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

export function validateCirclesSkillGraph() {
  const expectedIds = ['CI001', 'CI002', 'CI003', 'CI004'];
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

export const circlesSkillGraph = {
  domainId: 'circles',
  domainName: 'Circles',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default circlesSkillGraph;
