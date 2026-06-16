// MathPath domain: Statistics
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const statisticsSkills = [
  {
    id: 'ST001',
    slug: 'stat.tables',
    name: 'Reading tables',
    description: 'Reading tables.',
    strand: 'Data Reading',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.pv.3-digit'],
    difficulty: 1,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['stat/row-column-mix'],
    questionFamilies: ['QF_ST001_001', 'QF_ST001_002'],
  },
  {
    id: 'ST002',
    slug: 'stat.picture-graphs',
    name: 'Picture graphs',
    description: 'Picture graphs.',
    strand: 'Data Representation',
    prerequisites: ['ST001'],
    crossDomainPrerequisites: ['ns.count.skip'],
    difficulty: 1,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST001'],
    misconceptions: ['stat/ignore-key'],
    questionFamilies: ['QF_ST002_001', 'QF_ST002_002'],
  },
  {
    id: 'ST003',
    slug: 'stat.bar-graphs',
    name: 'Bar graphs',
    description: 'Bar graphs.',
    strand: 'Data Representation',
    prerequisites: ['ST001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST001'],
    misconceptions: ['stat/scale-interval'],
    questionFamilies: ['QF_ST003_001', 'QF_ST003_002'],
  },
  {
    id: 'ST004',
    slug: 'stat.line-graphs',
    name: 'Line graphs',
    description: 'Line graphs.',
    strand: 'Data Representation',
    prerequisites: ['ST003'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST003'],
    misconceptions: ['stat/point-misread'],
    questionFamilies: ['QF_ST004_001', 'QF_ST004_002'],
  },
  {
    id: 'ST005',
    slug: 'stat.interpret',
    name: 'Interpreting and comparing data',
    description: 'Interpreting and comparing data.',
    strand: 'Interpretation',
    prerequisites: ['ST003', 'ST004'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST004'],
    misconceptions: ['stat/trend-overread'],
    questionFamilies: ['QF_ST005_001', 'QF_ST005_002'],
  },
  {
    id: 'ST006',
    slug: 'stat.average-intro',
    name: 'Average (mean) — concept',
    description: 'Average (mean) — concept.',
    strand: 'Average',
    prerequisites: [],
    crossDomainPrerequisites: ['op.div.short', 'stat.tables'],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['stat/mean-not-divide', 'stat/mean-ignore-zero'],
    questionFamilies: ['QF_ST006_001', 'QF_ST006_002'],
  },
  {
    id: 'ST007',
    slug: 'stat.average-apply',
    name: 'Mean: finding the total or a missing value',
    description: 'Mean: finding the total or a missing value.',
    strand: 'Average',
    prerequisites: ['ST006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST006'],
    misconceptions: ['stat/mean-reverse'],
    questionFamilies: ['QF_ST007_001', 'QF_ST007_002'],
  },
  {
    id: 'ST008',
    slug: 'stat.pie-charts',
    name: 'Pie charts',
    description: 'Pie charts.',
    strand: 'Data Representation',
    prerequisites: ['ST003'],
    crossDomainPrerequisites: ['pct.of-quantity', 'fr.of-quantity'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['ST003'],
    misconceptions: ['stat/pie-angle-fraction'],
    questionFamilies: ['QF_ST008_001', 'QF_ST008_002'],
  },
];

const skills = statisticsSkills.map((skill) => ({ ...skill }));
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

export function validateStatisticsSkillGraph() {
  const expectedIds = ['ST001', 'ST002', 'ST003', 'ST004', 'ST005', 'ST006', 'ST007', 'ST008'];
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

export const statisticsSkillGraph = {
  domainId: 'statistics',
  domainName: 'Statistics',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default statisticsSkillGraph;
