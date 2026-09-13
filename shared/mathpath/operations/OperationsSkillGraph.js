// MathPath domain: Operations
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const operationsSkills = [
  {
    id: 'OP001',
    slug: 'op.add.facts',
    name: 'Addition facts within 20 (number bonds)',
    description: 'Addition facts within 20 (number bonds).',
    strand: 'Addition',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.count.to-20'],
    difficulty: 3,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['add/count-all', 'add/off-by-one'],
    questionFamilies: ['QF_OP001_001', 'QF_OP001_002'],
  },
  {
    id: 'OP002',
    slug: 'op.add.2digit',
    name: 'Adding 2-digit numbers (no regrouping)',
    description: 'Adding 2-digit numbers (no regrouping).',
    strand: 'Addition',
    prerequisites: ['OP001'],
    crossDomainPrerequisites: ['ns.pv.tens-ones'],
    difficulty: 3,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['add/place-misalign'],
    questionFamilies: ['QF_OP002_001', 'QF_OP002_002'],
  },
  {
    id: 'OP003',
    slug: 'op.add.regroup',
    name: 'Adding with regrouping (carrying)',
    description: 'Adding with regrouping (carrying).',
    strand: 'Addition',
    prerequisites: ['OP002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['add/forgot-carry'],
    questionFamilies: ['QF_OP003_001', 'QF_OP003_002'],
  },
  {
    id: 'OP004',
    slug: 'op.add.large',
    name: 'Adding 3–4 digit numbers',
    description: 'Adding 3–4 digit numbers.',
    strand: 'Addition',
    prerequisites: ['OP003'],
    crossDomainPrerequisites: ['ns.pv.4-5-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['add/carry-cascade'],
    questionFamilies: ['QF_OP004_001', 'QF_OP004_002'],
  },
  {
    id: 'OP005',
    slug: 'op.sub.facts',
    name: 'Subtraction facts within 20',
    description: 'Subtraction facts within 20.',
    strand: 'Subtraction',
    prerequisites: ['OP001'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['sub/count-back-error'],
    questionFamilies: ['QF_OP005_001', 'QF_OP005_002'],
  },
  {
    id: 'OP006',
    slug: 'op.sub.2digit',
    name: 'Subtracting 2-digit numbers (no regrouping)',
    description: 'Subtracting 2-digit numbers (no regrouping).',
    strand: 'Subtraction',
    prerequisites: ['OP005'],
    crossDomainPrerequisites: ['ns.pv.tens-ones'],
    difficulty: 3,
    singaporeLevel: ['Primary 1'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['sub/smaller-from-larger'],
    questionFamilies: ['QF_OP006_001', 'QF_OP006_002'],
  },
  {
    id: 'OP007',
    slug: 'op.sub.regroup',
    name: 'Subtracting with regrouping (borrowing)',
    description: 'Subtracting with regrouping (borrowing).',
    strand: 'Subtraction',
    prerequisites: ['OP006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 9 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['sub/smaller-from-larger', 'sub/borrow-no-reduce'],
    questionFamilies: ['QF_OP007_001', 'QF_OP007_002'],
  },
  {
    id: 'OP008',
    slug: 'op.sub.large',
    name: 'Subtracting 3–4 digit numbers (incl. across zeros)',
    description: 'Subtracting 3–4 digit numbers (incl. across zeros).',
    strand: 'Subtraction',
    prerequisites: ['OP007'],
    crossDomainPrerequisites: ['ns.pv.4-5-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['sub/across-zeros'],
    questionFamilies: ['QF_OP008_001', 'QF_OP008_002'],
  },
  {
    id: 'OP009',
    slug: 'op.mult.facts',
    name: 'Multiplication facts (times tables to 12)',
    description: 'Multiplication facts (times tables to 12).',
    strand: 'Multiplication',
    prerequisites: ['OP001'],
    crossDomainPrerequisites: ['ns.count.skip'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 95, targetAverageSeconds: 3 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mult/repeated-add-slow', 'mult/adjacent-fact'],
    questionFamilies: ['QF_OP009_001', 'QF_OP009_002'],
  },
  {
    id: 'OP010',
    slug: 'op.mult.by-10-100',
    name: 'Multiplying by 10, 100 and 1000',
    description: 'Multiplying by 10, 100 and 1000.',
    strand: 'Multiplication',
    prerequisites: ['OP009'],
    crossDomainPrerequisites: ['ns.pv.4-5-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 4 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mult/append-zeros-decimal'],
    questionFamilies: ['QF_OP010_001', 'QF_OP010_002'],
  },
  {
    id: 'OP011',
    slug: 'op.mult.2x1',
    name: 'Multiplying 2–3 digit by 1 digit',
    description: 'Multiplying 2–3 digit by 1 digit.',
    strand: 'Multiplication',
    prerequisites: ['OP009', 'OP003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mult/forgot-carry'],
    questionFamilies: ['QF_OP011_001', 'QF_OP011_002'],
  },
  {
    id: 'OP012',
    slug: 'op.mult.long',
    name: 'Long multiplication (2 digit × 2 digit)',
    description: 'Long multiplication (2 digit × 2 digit).',
    strand: 'Multiplication',
    prerequisites: ['OP011', 'OP010', 'OP004'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mult/missing-placeholder', 'mult/partial-add'],
    questionFamilies: ['QF_OP012_001', 'QF_OP012_002'],
  },
  {
    id: 'OP013',
    slug: 'op.div.facts',
    name: 'Division facts (inverse of times tables)',
    description: 'Division facts (inverse of times tables).',
    strand: 'Division',
    prerequisites: ['OP009'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 10 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 4 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['div/order-reversal'],
    questionFamilies: ['QF_OP013_001', 'QF_OP013_002'],
  },
  {
    id: 'OP014',
    slug: 'op.div.short',
    name: 'Short division by a 1-digit number',
    description: 'Short division by a 1-digit number.',
    strand: 'Division',
    prerequisites: ['OP013'],
    crossDomainPrerequisites: ['ns.pv.4-5-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['div/drop-zero'],
    questionFamilies: ['QF_OP014_001', 'QF_OP014_002'],
  },
  {
    id: 'OP015',
    slug: 'op.div.remainder',
    name: 'Division with remainders (interpreting)',
    description: 'Division with remainders (interpreting).',
    strand: 'Division',
    prerequisites: ['OP014'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['div/ignore-remainder'],
    questionFamilies: ['QF_OP015_001', 'QF_OP015_002'],
  },
  {
    id: 'OP016',
    slug: 'op.div.long',
    name: 'Long division by a 2-digit number',
    description: 'Long division by a 2-digit number.',
    strand: 'Division',
    prerequisites: ['OP014', 'OP011'],
    crossDomainPrerequisites: ['ns.estimate.products'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['div/bad-estimate', 'div/bring-down'],
    questionFamilies: ['QF_OP016_001', 'QF_OP016_002'],
  },
  {
    id: 'OP017',
    slug: 'op.mental.add-sub',
    name: 'Mental addition & subtraction strategies',
    description: 'Mental addition & subtraction strategies.',
    strand: 'Addition',
    prerequisites: ['OP003', 'OP007'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mental/no-compensation'],
    questionFamilies: ['QF_OP017_001', 'QF_OP017_002'],
  },
  {
    id: 'OP018',
    slug: 'op.mental.mult-div',
    name: 'Mental multiplication & division strategies',
    description: 'Mental multiplication & division strategies.',
    strand: 'Multiplication',
    prerequisites: ['OP010', 'OP013'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mental/no-factoring'],
    questionFamilies: ['QF_OP018_001', 'QF_OP018_002'],
  },
  {
    id: 'OP019',
    slug: 'op.order-of-ops',
    name: 'Order of operations (× ÷ before + −)',
    description: 'Order of operations (× ÷ before + −).',
    strand: 'Number Theory',
    prerequisites: ['OP011', 'OP004', 'OP008'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['order/left-to-right'],
    questionFamilies: ['QF_OP019_001', 'QF_OP019_002'],
  },
  {
    id: 'OP020',
    slug: 'op.order-of-ops.brackets',
    name: 'Order of operations with brackets',
    description: 'Order of operations with brackets.',
    strand: 'Number Theory',
    prerequisites: ['OP019'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['order/ignore-brackets'],
    questionFamilies: ['QF_OP020_001', 'QF_OP020_002'],
  },
  {
    id: 'OP021',
    slug: 'op.factors-multiples',
    name: 'Factors and multiples',
    description: 'Factors and multiples.',
    strand: 'Multiplication',
    prerequisites: ['OP009', 'OP013'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['op/factor-multiple-confuse'],
    questionFamilies: ['QF_OP021_001', 'QF_OP021_002'],
  },
  {
    id: 'OP022',
    slug: 'op.hcf-lcm',
    name: 'HCF and LCM (incl. word problems)',
    description: 'HCF and LCM (incl. word problems).',
    strand: 'Number Theory',
    prerequisites: ['OP021'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['op/hcf-lcm-confuse'],
    questionFamilies: ['QF_OP022_001', 'QF_OP022_002'],
  },
  {
    id: 'OP023',
    slug: 'op.model-drawing',
    name: 'Model drawing (bar models)',
    description: 'Model drawing (bar models).',
    strand: 'Problem Solving',
    prerequisites: ['OP003', 'OP007'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['op/model-wrong-parts'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_OP023_001', 'QF_OP023_002'],
  },
  {
    id: 'OP024',
    slug: 'op.word-multi-step',
    name: 'Multi-step word problems',
    description: 'Multi-step word problems.',
    strand: 'Multiplication',
    prerequisites: ['OP023', 'OP011', 'OP014'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['op/wrong-operation-choice'],
    heuristic: 'bar-model',
    questionFamilies: ['QF_OP024_001', 'QF_OP024_002'],
  },
];

const skills = operationsSkills.map((skill) => ({ ...skill }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));
const skillBySlug = new Map(skills.filter((s) => s.slug).map((s) => [s.slug, s]));

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
  return skillById.get(skillId) || skillBySlug.get(skillId) || null;
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

export function validateOperationsSkillGraph() {
  const expectedIds = ['OP001', 'OP002', 'OP003', 'OP004', 'OP005', 'OP006', 'OP007', 'OP008', 'OP009', 'OP010', 'OP011', 'OP012', 'OP013', 'OP014', 'OP015', 'OP016', 'OP017', 'OP018', 'OP019', 'OP020', 'OP021', 'OP022', 'OP023', 'OP024'];
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

export const operationsSkillGraph = {
  domainId: 'four_operations',
  domainName: 'Operations',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default operationsSkillGraph;
