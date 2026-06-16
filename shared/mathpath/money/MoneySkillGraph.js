// MathPath domain: Money
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const moneySkills = [
  {
    id: 'MN001',
    slug: 'mon.coins-notes',
    name: 'Recognising coins and notes',
    description: 'Recognising coins and notes.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.count.to-20'],
    difficulty: 1,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mon/face-value'],
    questionFamilies: ['QF_MN001_001', 'QF_MN001_002'],
  },
  {
    id: 'MN002',
    slug: 'mon.add',
    name: 'Adding amounts of money',
    description: 'Adding amounts of money.',
    strand: 'Operations',
    prerequisites: ['MN001'],
    crossDomainPrerequisites: ['op.add.regroup'],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['MN001'],
    misconceptions: ['mon/cents-overflow'],
    questionFamilies: ['QF_MN002_001', 'QF_MN002_002'],
  },
  {
    id: 'MN003',
    slug: 'mon.total-cost',
    name: 'Finding total cost (unit price × quantity)',
    description: 'Finding total cost (unit price × quantity).',
    strand: 'Operations',
    prerequisites: ['MN001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['MN001'],
    misconceptions: ['mon/add-not-multiply'],
    questionFamilies: ['QF_MN003_001', 'QF_MN003_002'],
  },
  {
    id: 'MN004',
    slug: 'mon.change',
    name: 'Calculating change',
    description: 'Calculating change.',
    strand: 'Operations',
    prerequisites: ['MN002'],
    crossDomainPrerequisites: ['op.sub.regroup'],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['MN002'],
    misconceptions: ['mon/change-direction'],
    questionFamilies: ['QF_MN004_001', 'QF_MN004_002'],
  },
  {
    id: 'MN005',
    slug: 'mon.word-problems',
    name: 'Money word problems',
    description: 'Money word problems.',
    strand: 'Applications',
    prerequisites: ['MN004', 'MN003'],
    crossDomainPrerequisites: ['dec.add-sub'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 14 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['MN004'],
    misconceptions: ['mon/money-decimal-place'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_MN005_001', 'QF_MN005_002'],
  },
];

const skills = moneySkills.map((skill) => ({ ...skill }));
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

export function validateMoneySkillGraph() {
  const expectedIds = ['MN001', 'MN002', 'MN003', 'MN004', 'MN005'];
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

export const moneySkillGraph = {
  domainId: 'money',
  domainName: 'Money',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default moneySkillGraph;
