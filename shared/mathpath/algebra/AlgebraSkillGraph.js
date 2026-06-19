// MathPath domain: Algebra
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const algebraSkills = [
  {
    id: 'AL001',
    slug: 'alg.unknown-arith',
    name: 'Unknowns in arithmetic (missing numbers)',
    description: 'Unknowns in arithmetic (missing numbers).',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['op.add.facts', 'op.sub.facts'],
    difficulty: 2,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['alg/equals-means-answer'],
    questionFamilies: ['QF_AL001_001', 'QF_AL001_002', 'QF_AL001_003'],
  },
  {
    id: 'AL002',
    slug: 'alg.unknown-letter',
    name: 'Using a letter for an unknown',
    description: 'Using a letter for an unknown.',
    strand: 'Foundations',
    prerequisites: ['AL001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL001'],
    misconceptions: ['alg/letter-as-label', 'alg/letter-one-value'],
    questionFamilies: ['QF_AL002_001', 'QF_AL002_002', 'QF_AL002_003'],
  },
  {
    id: 'AL003',
    slug: 'alg.notation',
    name: 'Algebraic notation',
    description: 'Algebraic notation.',
    strand: 'Notation',
    prerequisites: ['AL002'],
    crossDomainPrerequisites: ['op.mult.facts'],
    difficulty: 2,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL002'],
    misconceptions: ['alg/3n-means-3-plus-n'],
    questionFamilies: ['QF_AL003_001', 'QF_AL003_002', 'QF_AL003_003'],
  },
  {
    id: 'AL004',
    slug: 'alg.form-expression',
    name: 'Forming expressions from words',
    description: 'Forming expressions from words.',
    strand: 'Expressions',
    prerequisites: ['AL003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL003'],
    misconceptions: ['alg/word-order'],
    questionFamilies: ['QF_AL004_001', 'QF_AL004_002', 'QF_AL004_003'],
  },
  {
    id: 'AL005',
    slug: 'alg.substitute',
    name: 'Substitution (evaluating expressions)',
    description: 'Substitution (evaluating expressions).',
    strand: 'Expressions',
    prerequisites: ['AL003'],
    crossDomainPrerequisites: ['op.order-of-ops'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL003'],
    misconceptions: ['alg/sub-no-times', 'alg/sub-ignore-precedence'],
    questionFamilies: ['QF_AL005_001', 'QF_AL005_002', 'QF_AL005_003'],
  },
  {
    id: 'AL006',
    slug: 'alg.simplify-add',
    name: 'Simplifying by collecting like terms',
    description: 'Simplifying by collecting like terms.',
    strand: 'Expressions',
    prerequisites: ['AL003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL003'],
    misconceptions: ['alg/combine-unlike'],
    questionFamilies: ['QF_AL006_001', 'QF_AL006_002', 'QF_AL006_003'],
  },
  {
    id: 'AL007',
    slug: 'alg.simplify-mixed',
    name: 'Simplifying with brackets (distributive law)',
    description: 'Simplifying with brackets (distributive law).',
    strand: 'Expressions',
    prerequisites: ['AL006'],
    crossDomainPrerequisites: ['op.order-of-ops.brackets'],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL006'],
    misconceptions: ['alg/distribute-partial', 'alg/sign-error'],
    questionFamilies: ['QF_AL007_001', 'QF_AL007_002', 'QF_AL007_003'],
  },
  {
    id: 'AL008',
    slug: 'alg.equation-1step',
    name: 'Solving one-step linear equations',
    description: 'Solving one-step linear equations.',
    strand: 'Equations',
    prerequisites: ['AL005'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL005'],
    misconceptions: ['alg/same-side-op'],
    questionFamilies: ['QF_AL008_001', 'QF_AL008_002', 'QF_AL008_003'],
  },
  {
    id: 'AL009',
    slug: 'alg.equation-2step',
    name: 'Solving two-step linear equations',
    description: 'Solving two-step linear equations.',
    strand: 'Equations',
    prerequisites: ['AL008'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL008'],
    misconceptions: ['alg/order-of-undo'],
    questionFamilies: ['QF_AL009_001', 'QF_AL009_002', 'QF_AL009_003'],
  },
  {
    id: 'AL010',
    slug: 'alg.word-to-equation',
    name: 'Forming and solving equations from word problems',
    description: 'Forming and solving equations from word problems.',
    strand: 'Applications',
    prerequisites: ['AL004', 'AL009'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL009'],
    misconceptions: ['alg/wrong-relation'],
    questionFamilies: ['QF_AL010_001', 'QF_AL010_002', 'QF_AL010_003'],
  },

  // ── Secondary 1 (G1) — Algebra: expressions & linear equations (MOE A1/A2) ──
  {
    id: 'AL011', slug: 'alg.simplify-linear', name: 'Simplifying linear expressions',
    description: 'Collect like terms in a linear expression (with negatives).',
    strand: 'Expressions', prerequisites: ['AL006'], crossDomainPrerequisites: [], difficulty: 3,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL006'], misconceptions: ['alg/combine-unlike', 'alg/sign-error'],
    questionFamilies: ['QF_AL011_001', 'QF_AL011_002'],
  },
  {
    id: 'AL012', slug: 'alg.expand-brackets', name: 'Expanding single brackets',
    description: 'Expand a single bracket using the distributive law.',
    strand: 'Expressions', prerequisites: ['AL011'], crossDomainPrerequisites: [], difficulty: 4,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 14 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL011'], misconceptions: ['alg/distribute-partial', 'alg/sign-error'],
    questionFamilies: ['QF_AL012_001', 'QF_AL012_002'],
  },
  {
    id: 'AL013', slug: 'alg.solve-two-step', name: 'Solving two-step linear equations',
    description: 'Solve ax + b = c for an integer solution.',
    strand: 'Equations', prerequisites: ['AL009'], crossDomainPrerequisites: [], difficulty: 4,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 18 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL009'], misconceptions: ['alg/order-of-undo', 'alg/sign-error'],
    questionFamilies: ['QF_AL013_001', 'QF_AL013_002'],
  },
  {
    id: 'AL014', slug: 'alg.solve-brackets', name: 'Solving equations with brackets',
    description: 'Solve a(x + b) = c for an integer solution.',
    strand: 'Equations', prerequisites: ['AL012', 'AL013'], crossDomainPrerequisites: [], difficulty: 4,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 22 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL013'], misconceptions: ['alg/distribute-partial', 'alg/order-of-undo'],
    questionFamilies: ['QF_AL014_001', 'QF_AL014_002'],
  },
  {
    id: 'AL015', slug: 'alg.substitute-negatives', name: 'Substitution with negative values',
    description: 'Evaluate an expression by substituting negative integers.',
    strand: 'Expressions', prerequisites: ['AL005'], crossDomainPrerequisites: ['ns.int.multiply'], difficulty: 4,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 16 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL005'], misconceptions: ['alg/sign-error', 'alg/sub-ignore-precedence'],
    questionFamilies: ['QF_AL015_001', 'QF_AL015_002'],
  },
  {
    id: 'AL016', slug: 'alg.form-solve', name: 'Forming and solving linear equations',
    description: 'Form a linear equation from a word problem and solve it.',
    strand: 'Applications', prerequisites: ['AL013'], crossDomainPrerequisites: [], difficulty: 5,
    singaporeLevel: ['Secondary 1'], mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 30 }, retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['AL013'], misconceptions: ['alg/wrong-relation'],
    questionFamilies: ['QF_AL016_001', 'QF_AL016_002'],
  },
];

const skills = algebraSkills.map((skill) => ({ ...skill }));
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

export function validateAlgebraSkillGraph() {
  const expectedIds = ['AL001', 'AL002', 'AL003', 'AL004', 'AL005', 'AL006', 'AL007', 'AL008', 'AL009', 'AL010', 'AL011', 'AL012', 'AL013', 'AL014', 'AL015', 'AL016'];
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

export const algebraSkillGraph = {
  domainId: 'algebra',
  domainName: 'Algebra',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default algebraSkillGraph;
