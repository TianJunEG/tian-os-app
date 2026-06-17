// MathPath domain: Percentage (Primary 5 → 6).
//
// A percentage is "per hundred" — built directly on fraction/decimal machinery.
// % ⇄ fraction ⇄ decimal conversion is the hinge, and every application
// (of a quantity, increase/decrease, discount, GST, interest) reduces to it.
// Real-world SG contexts ground the later skills.
//
// Prerequisites keep the graph acyclic and fully reachable from P001.
// Cross-domain prerequisites (fraction simplify, decimal multiply) are on
// `crossDomainPrerequisites` for curriculum tooling without coupling this graph.

const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const percentageSkills = [
  // ── Meaning ──
  {
    id: 'P001',
    slug: 'pct.meaning',
    name: 'Percentage as "per hundred"',
    description: 'Understand that percentage means parts per hundred and read/write the % symbol.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['fr.meaning.parts', 'dec.place-value'],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['pct/not-per-hundred', 'pct/cap-at-100'],
    questionFamilies: ['QF_P001_001', 'QF_P001_002'],
  },

  // ── Conversion ──
  {
    id: 'P002',
    slug: 'pct.convert',
    name: 'Converting between percentages, fractions and decimals',
    description: 'Convert freely between %, fractions and decimals.',
    strand: 'Conversion',
    prerequisites: ['P001'],
    crossDomainPrerequisites: ['fr.equivalent', 'dec.from-fraction'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P001'],
    misconceptions: ['pct/move-point-wrong', 'pct/keep-percent-sign'],
    questionFamilies: ['QF_P002_001', 'QF_P002_002'],
  },

  // ── Core applications ──
  {
    id: 'P003',
    slug: 'pct.of-quantity',
    name: 'Percentage of a quantity',
    description: 'Find a given percentage of a whole quantity.',
    strand: 'Applications',
    prerequisites: ['P002'],
    crossDomainPrerequisites: ['fr.of-quantity', 'dec.mult-whole'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P002'],
    misconceptions: ['pct/forgot-divide-100'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_P003_001', 'QF_P003_002'],
  },
  {
    id: 'P004',
    slug: 'pct.express',
    name: 'Expressing one quantity as a percentage of another',
    description: 'Express part as a % of whole: part ÷ whole × 100.',
    strand: 'Applications',
    prerequisites: ['P002'],
    crossDomainPrerequisites: ['fr.simplify'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P002'],
    misconceptions: ['pct/wrong-base'],
    questionFamilies: ['QF_P004_001', 'QF_P004_002'],
  },
  {
    id: 'P005',
    slug: 'pct.find-whole',
    name: 'Finding the whole from a percentage',
    description: 'Given that p% of a number equals a known part, find the whole.',
    strand: 'Applications',
    prerequisites: ['P003'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 14 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P003'],
    misconceptions: ['pct/part-is-whole'],
    heuristic: 'work-backwards',
    questionFamilies: ['QF_P005_001', 'QF_P005_002'],
  },

  // ── Change ──
  {
    id: 'P006',
    slug: 'pct.increase-decrease',
    name: 'Percentage increase and decrease',
    description: 'Increase or decrease a quantity by a given percentage.',
    strand: 'Change',
    prerequisites: ['P003'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P003'],
    misconceptions: ['pct/add-percent-not-amount', 'pct/base-after-not-before'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_P006_001', 'QF_P006_002'],
  },
  {
    id: 'P007',
    slug: 'pct.before-after',
    name: 'Percentage change with before and after',
    description: 'Solve problems where a percentage change links two totals.',
    strand: 'Change',
    prerequisites: ['P006', 'P005'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P005', 'P006'],
    misconceptions: ['pct/percent-of-different-base'],
    heuristic: 'before-after',
    questionFamilies: ['QF_P007_001', 'QF_P007_002'],
  },

  // ── Real-world applications ──
  {
    id: 'P008',
    slug: 'pct.discount',
    name: 'Discount',
    description: 'Find the selling price after a percentage discount on the marked price.',
    strand: 'Real-world',
    prerequisites: ['P006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P006'],
    misconceptions: ['pct/discount-of-discounted'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_P008_001', 'QF_P008_002'],
  },
  {
    id: 'P009',
    slug: 'pct.gst',
    name: 'GST',
    description: 'Find the total price after adding GST (a % increase on the pre-tax price).',
    strand: 'Real-world',
    prerequisites: ['P006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P006'],
    misconceptions: ['pct/gst-wrong-base'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_P009_001', 'QF_P009_002'],
  },
  {
    id: 'P010',
    slug: 'pct.interest',
    name: 'Simple interest',
    description: 'Calculate simple interest: I = P × r% × t.',
    strand: 'Real-world',
    prerequisites: ['P003'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P003'],
    misconceptions: ['pct/interest-compound-confuse'],
    questionFamilies: ['QF_P010_001', 'QF_P010_002'],
  },
];

const skills = percentageSkills.map((skill) => ({ ...skill }));
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
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    const skill = skillById.get(id);
    if (skill) skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  graphSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validatePercentageSkillGraph() {
  const expectedIds = Array.from({ length: 10 }, (_, i) => `P${String(i + 1).padStart(3, '0')}`);
  const actualIds = skills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId))
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
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references detected.'] : []),
    ...(invalidRemediationReferences.length ? ['Invalid remediation references detected.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
    ...(unreachableSkills.length ? ['Unreachable skills detected.'] : []),
  ]);

  return {
    isValid: errors.length === 0,
    summary: {
      totalSkills: skills.length,
      foundationSkills: foundationIds,
      missingSkills,
      duplicateIds: unique(duplicateIds),
      invalidPrereqReferences,
      invalidRemediationReferences,
      cycles,
      unreachableSkills,
    },
    errors,
  };
}

export const percentageSkillGraph = {
  domainId: 'percentage',
  domainName: 'Percentage',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default percentageSkillGraph;
