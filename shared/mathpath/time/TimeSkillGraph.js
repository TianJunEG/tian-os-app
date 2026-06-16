// MathPath domain: Time
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const timeSkills = [
  {
    id: 'TM001',
    slug: 'tim.tell-hour',
    name: 'Telling time to the hour and half-hour',
    description: 'Telling time to the hour and half-hour.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.count.to-20'],
    difficulty: 1,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 4 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['tim/hour-half'],
    questionFamilies: ['QF_TM001_001', 'QF_TM001_002'],
  },
  {
    id: 'TM002',
    slug: 'tim.tell-minutes',
    name: 'Telling time to the minute',
    description: 'Telling time to the minute.',
    strand: 'Reading',
    prerequisites: ['TM001'],
    crossDomainPrerequisites: ['ns.count.skip'],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['TM001'],
    misconceptions: ['tim/minute-skip'],
    questionFamilies: ['QF_TM002_001', 'QF_TM002_002'],
  },
  {
    id: 'TM003',
    slug: 'tim.convert',
    name: 'Converting time units (hours, minutes, seconds)',
    description: 'Converting time units (hours, minutes, seconds).',
    strand: 'Conversion',
    prerequisites: ['TM002'],
    crossDomainPrerequisites: ['op.mult.by-10-100'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['TM002'],
    misconceptions: ['tim/base-10-error'],
    questionFamilies: ['QF_TM003_001', 'QF_TM003_002'],
  },
  {
    id: 'TM004',
    slug: 'tim.24hr',
    name: 'The 24-hour clock',
    description: 'The 24-hour clock.',
    strand: 'Reading',
    prerequisites: ['TM002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['TM002'],
    misconceptions: ['mea/24hr-convert'],
    questionFamilies: ['QF_TM004_001', 'QF_TM004_002'],
  },
  {
    id: 'TM005',
    slug: 'tim.duration',
    name: 'Duration and time intervals',
    description: 'Duration and time intervals.',
    strand: 'Duration',
    prerequisites: ['TM004'],
    crossDomainPrerequisites: ['op.sub.regroup'],
    difficulty: 4,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 14 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['TM003', 'TM004'],
    misconceptions: ['mea/time-base-60'],
    questionFamilies: ['QF_TM005_001', 'QF_TM005_002'],
  },
];

const skills = timeSkills.map((skill) => ({ ...skill }));
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

export function validateTimeSkillGraph() {
  const expectedIds = ['TM001', 'TM002', 'TM003', 'TM004', 'TM005'];
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

export const timeSkillGraph = {
  domainId: 'time',
  domainName: 'Time',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default timeSkillGraph;
