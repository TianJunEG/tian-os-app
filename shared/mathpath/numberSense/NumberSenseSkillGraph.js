// MathPath domain: NumberSense
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const numberSenseSkills = [
  {
    id: 'NS001',
    slug: 'ns.count.to-20',
    name: 'Counting to 20',
    description: 'Counting to 20.',
    strand: 'Counting',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 2 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['count/teen-ty', 'count/skip-number'],
    questionFamilies: ['QF_NS001_001', 'QF_NS001_002'],
  },
  {
    id: 'NS002',
    slug: 'ns.count.to-100',
    name: 'Counting to 100',
    description: 'Counting to 100.',
    strand: 'Counting',
    prerequisites: ['NS001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 2 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['count/decade-boundary'],
    questionFamilies: ['QF_NS002_001', 'QF_NS002_002'],
  },
  {
    id: 'NS003',
    slug: 'ns.count.skip',
    name: 'Skip counting (2s, 5s, 10s)',
    description: 'Skip counting (2s, 5s, 10s).',
    strand: 'Counting',
    prerequisites: ['NS002'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 2 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['count/lose-step'],
    questionFamilies: ['QF_NS003_001', 'QF_NS003_002'],
  },
  {
    id: 'NS004',
    slug: 'ns.count.to-1000',
    name: 'Counting to 1000',
    description: 'Counting to 1000.',
    strand: 'Counting',
    prerequisites: ['NS002'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['count/hundred-boundary'],
    questionFamilies: ['QF_NS004_001', 'QF_NS004_002'],
  },
  {
    id: 'NS005',
    slug: 'ns.pv.tens-ones',
    name: 'Place value: tens and ones',
    description: 'Place value: tens and ones.',
    strand: 'Place Value',
    prerequisites: ['NS002'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pv/digit-vs-value', 'pv/teen-reversal'],
    questionFamilies: ['QF_NS005_001', 'QF_NS005_002'],
  },
  {
    id: 'NS006',
    slug: 'ns.pv.3-digit',
    name: 'Place value to 1000',
    description: 'Place value to 1000.',
    strand: 'Place Value',
    prerequisites: ['NS005', 'NS004'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pv/zero-placeholder'],
    questionFamilies: ['QF_NS006_001', 'QF_NS006_002'],
  },
  {
    id: 'NS007',
    slug: 'ns.pv.4-5-digit',
    name: 'Place value to 100 000',
    description: 'Place value to 100 000.',
    strand: 'Place Value',
    prerequisites: ['NS006'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pv/grouping'],
    questionFamilies: ['QF_NS007_001', 'QF_NS007_002'],
  },
  {
    id: 'NS008',
    slug: 'ns.pv.6-digit',
    name: 'Place value to 1 000 000',
    description: 'Place value to 1 000 000.',
    strand: 'Place Value',
    prerequisites: ['NS007'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pv/place-name'],
    questionFamilies: ['QF_NS008_001', 'QF_NS008_002'],
  },
  {
    id: 'NS009',
    slug: 'ns.compare.to-100',
    name: 'Comparing numbers to 100',
    description: 'Comparing numbers to 100.',
    strand: 'Ordering',
    prerequisites: ['NS005'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['compare/leading-digit'],
    questionFamilies: ['QF_NS009_001', 'QF_NS009_002'],
  },
  {
    id: 'NS010',
    slug: 'ns.compare.large',
    name: 'Comparing numbers to 100 000',
    description: 'Comparing numbers to 100 000.',
    strand: 'Ordering',
    prerequisites: ['NS007', 'NS009'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 4 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['compare/length-not-value'],
    questionFamilies: ['QF_NS010_001', 'QF_NS010_002'],
  },
  {
    id: 'NS011',
    slug: 'ns.order.to-100',
    name: 'Ordering numbers to 100',
    description: 'Ordering numbers to 100.',
    strand: 'Ordering',
    prerequisites: ['NS009'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['order/local-not-global'],
    questionFamilies: ['QF_NS011_001', 'QF_NS011_002'],
  },
  {
    id: 'NS012',
    slug: 'ns.order.large',
    name: 'Ordering numbers to 100 000',
    description: 'Ordering numbers to 100 000.',
    strand: 'Ordering',
    prerequisites: ['NS010', 'NS011'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['order/by-length'],
    questionFamilies: ['QF_NS012_001', 'QF_NS012_002'],
  },
  {
    id: 'NS013',
    slug: 'ns.pattern.skip',
    name: 'Number patterns: skip-count sequences',
    description: 'Number patterns: skip-count sequences.',
    strand: 'Patterns',
    prerequisites: ['NS003'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pattern/step-drift'],
    questionFamilies: ['QF_NS013_001', 'QF_NS013_002'],
  },
  {
    id: 'NS014',
    slug: 'ns.pattern.arithmetic',
    name: 'Number patterns: constant difference',
    description: 'Number patterns: constant difference.',
    strand: 'Patterns',
    prerequisites: ['NS013'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pattern/op-confusion'],
    questionFamilies: ['QF_NS014_001', 'QF_NS014_002'],
  },
  {
    id: 'NS015',
    slug: 'ns.pattern.complex',
    name: 'Number patterns: position rules',
    description: 'Number patterns: position rules.',
    strand: 'Patterns',
    prerequisites: ['NS014'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pattern/assume-linear'],
    questionFamilies: ['QF_NS015_001', 'QF_NS015_002'],
  },
  {
    id: 'NS016',
    slug: 'ns.round.10-100',
    name: 'Rounding to the nearest 10 and 100',
    description: 'Rounding to the nearest 10 and 100.',
    strand: 'Estimation',
    prerequisites: ['NS006', 'NS010'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 4 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['round/always-up', 'round/wrong-digit'],
    questionFamilies: ['QF_NS016_001', 'QF_NS016_002'],
  },
  {
    id: 'NS017',
    slug: 'ns.round.1000',
    name: 'Rounding to the nearest 1000',
    description: 'Rounding to the nearest 1000.',
    strand: 'Estimation',
    prerequisites: ['NS016', 'NS007'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['round/no-cascade'],
    questionFamilies: ['QF_NS017_001', 'QF_NS017_002'],
  },
  {
    id: 'NS018',
    slug: 'ns.estimate.sums',
    name: 'Estimating sums and differences',
    description: 'Estimating sums and differences.',
    strand: 'Estimation',
    prerequisites: ['NS016'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['estimate/exact-not-estimate'],
    questionFamilies: ['QF_NS018_001', 'QF_NS018_002'],
  },
  {
    id: 'NS019',
    slug: 'ns.estimate.products',
    name: 'Estimating products and quotients',
    description: 'Estimating products and quotients.',
    strand: 'Estimation',
    prerequisites: ['NS017', 'NS018'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['estimate/round-one'],
    questionFamilies: ['QF_NS019_001', 'QF_NS019_002'],
  },
  {
    id: 'NS020',
    slug: 'ns.estimate.check',
    name: 'Estimation to check reasonableness',
    description: 'Estimation to check reasonableness.',
    strand: 'Estimation',
    prerequisites: ['NS019'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['estimate/ignore-check'],
    questionFamilies: ['QF_NS020_001', 'QF_NS020_002'],
  },
  {
    id: 'NS021',
    slug: 'ns.neg.intro',
    name: 'Negative numbers on a number line',
    description: 'Negative numbers on a number line.',
    strand: 'Negative Numbers',
    prerequisites: ['NS012', 'NS004'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['neg/magnitude-order'],
    questionFamilies: ['QF_NS021_001', 'QF_NS021_002'],
  },
  {
    id: 'NS022',
    slug: 'ns.neg.compare-order',
    name: 'Comparing and ordering integers',
    description: 'Comparing and ordering integers.',
    strand: 'Ordering',
    prerequisites: ['NS021'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['neg/order-like-positive'],
    questionFamilies: ['QF_NS022_001', 'QF_NS022_002'],
  },
  {
    id: 'NS023',
    slug: 'ns.neg.context',
    name: 'Negative numbers in context (temperature, levels)',
    description: 'Negative numbers in context (temperature, levels).',
    strand: 'Negative Numbers',
    prerequisites: ['NS022'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['neg/direction'],
    questionFamilies: ['QF_NS023_001', 'QF_NS023_002'],
  },

  // ── Secondary 1 (G1) — Integers and their four operations (MOE N1.1) ────────
  {
    id: 'NS024',
    slug: 'ns.int.add',
    name: 'Adding integers',
    description: 'Add positive and negative integers.',
    strand: 'Integers',
    prerequisites: ['NS021', 'NS023'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS021'],
    misconceptions: ['int/ignore-sign', 'int/add-magnitudes'],
    questionFamilies: ['QF_NS024_001', 'QF_NS024_002'],
  },
  {
    id: 'NS025',
    slug: 'ns.int.subtract',
    name: 'Subtracting integers',
    description: 'Subtract integers, including subtracting a negative.',
    strand: 'Integers',
    prerequisites: ['NS024'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS024'],
    misconceptions: ['int/subtract-negative', 'int/sign-of-difference'],
    questionFamilies: ['QF_NS025_001', 'QF_NS025_002'],
  },
  {
    id: 'NS026',
    slug: 'ns.int.multiply',
    name: 'Multiplying integers',
    description: 'Multiply integers using the sign rules.',
    strand: 'Integers',
    prerequisites: ['NS024'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS024'],
    misconceptions: ['int/sign-rule-mult'],
    questionFamilies: ['QF_NS026_001', 'QF_NS026_002'],
  },
  {
    id: 'NS027',
    slug: 'ns.int.divide',
    name: 'Dividing integers',
    description: 'Divide integers using the sign rules.',
    strand: 'Integers',
    prerequisites: ['NS026'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS026'],
    misconceptions: ['int/sign-rule-div'],
    questionFamilies: ['QF_NS027_001', 'QF_NS027_002'],
  },
  {
    id: 'NS028',
    slug: 'ns.int.order-of-operations',
    name: 'Order of operations with integers',
    description: 'Apply order of operations to expressions with integers.',
    strand: 'Integers',
    prerequisites: ['NS025', 'NS027'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS026', 'NS024'],
    misconceptions: ['int/left-to-right', 'int/sign-slip'],
    questionFamilies: ['QF_NS028_001', 'QF_NS028_002'],
  },
  {
    id: 'NS029',
    slug: 'ns.int.word-problems',
    name: 'Integer word problems (temperature, levels, balance)',
    description: 'Solve word problems in context using integers.',
    strand: 'Integers',
    prerequisites: ['NS025'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Secondary 1'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['NS023', 'NS025'],
    misconceptions: ['int/direction', 'int/wrong-operation'],
    questionFamilies: ['QF_NS029_001', 'QF_NS029_002'],
  },
];

const skills = numberSenseSkills.map((skill) => ({ ...skill }));
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

export function validateNumberSenseSkillGraph() {
  const expectedIds = ['NS001', 'NS002', 'NS003', 'NS004', 'NS005', 'NS006', 'NS007', 'NS008', 'NS009', 'NS010', 'NS011', 'NS012', 'NS013', 'NS014', 'NS015', 'NS016', 'NS017', 'NS018', 'NS019', 'NS020', 'NS021', 'NS022', 'NS023', 'NS024', 'NS025', 'NS026', 'NS027', 'NS028', 'NS029'];
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

export const numberSenseSkillGraph = {
  domainId: 'number_sense',
  domainName: 'NumberSense',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default numberSenseSkillGraph;
