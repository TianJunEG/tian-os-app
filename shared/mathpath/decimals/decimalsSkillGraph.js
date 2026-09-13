// MathPath domain: Decimals (Primary 4 → 6).
//
// The decimal number system — place value, number line, comparing/ordering,
// rounding, the four operations, decimal⇄fraction conversion, and measurement
// conversions. Derived from scripts/domains/decimals.js (the curriculum seed),
// restructured into the MathPath skill-graph shape used by Fractions.
//
// Each node's intra-domain `prerequisites` keep the graph acyclic and fully
// reachable from the D001 foundation, so validateDecimalsSkillGraph() can check
// it in isolation. The seed's cross-domain prerequisites (whole-number place
// value, the operation algorithms, fraction simplification) are preserved on
// `crossDomainPrerequisites` for curriculum tooling without coupling this graph
// to the other domains' IDs.

const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const decimalSkills = [
  // ── Place value & representation ──
  {
    id: 'D001',
    slug: 'dec.place-value',
    name: 'Decimal Place Value',
    description: 'Read and interpret tenths, hundredths and thousandths in a decimal.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.pv.4-5-digit'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['dec/place-confuse', 'dec/longer-is-bigger'],
    questionFamilies: ['QF_D001_001', 'QF_D001_002', 'QF_D001_003', 'QF_D001_004'],
  },
  {
    id: 'D002',
    slug: 'dec.number-line',
    name: 'Decimals on a Number Line',
    description: 'Locate and read decimals on a number line with equal intervals.',
    strand: 'Foundations',
    prerequisites: ['D001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/nl-interval'],
    questionFamilies: ['QF_D002_001', 'QF_D002_002', 'QF_D002_003'],
  },

  // ── Comparing & ordering ──
  {
    id: 'D003',
    slug: 'dec.compare',
    name: 'Comparing Decimals',
    description: 'Compare two decimals by aligning place values.',
    strand: 'Comparison',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['ns.compare.large'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/longer-decimal'],
    questionFamilies: ['QF_D003_001', 'QF_D003_002', 'QF_D003_003'],
  },
  {
    id: 'D004',
    slug: 'dec.order',
    name: 'Ordering Decimals',
    description: 'Arrange a set of decimals in increasing or decreasing order.',
    strand: 'Comparison',
    prerequisites: ['D003'],
    crossDomainPrerequisites: ['ns.order.large'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D003'],
    misconceptions: ['dec/align-right'],
    questionFamilies: ['QF_D004_001', 'QF_D004_002', 'QF_D004_003'],
  },

  // ── Rounding ──
  {
    id: 'D005',
    slug: 'dec.round',
    name: 'Rounding Decimals',
    description: 'Round a decimal to a given number of decimal places.',
    strand: 'Rounding',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['ns.round.1000'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/truncate'],
    questionFamilies: ['QF_D005_001', 'QF_D005_002', 'QF_D005_003'],
  },

  // ── Operations ──
  {
    id: 'D006',
    slug: 'dec.add-sub',
    name: 'Adding and Subtracting Decimals',
    description: 'Add and subtract decimals by aligning the decimal points.',
    strand: 'Operations',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['op.add.regroup', 'op.sub.regroup'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/add-misalign'],
    questionFamilies: ['QF_D006_001', 'QF_D006_002', 'QF_D006_003'],
  },
  {
    id: 'D007',
    slug: 'dec.x-div-10-100',
    name: 'Multiply and Divide by 10, 100, 1000',
    description: 'Multiply and divide decimals by powers of ten by shifting the point.',
    strand: 'Operations',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['op.mult.by-10-100'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/move-wrong-way'],
    questionFamilies: ['QF_D007_001', 'QF_D007_002', 'QF_D007_003'],
  },
  {
    id: 'D008',
    slug: 'dec.mult-whole',
    name: 'Multiply a Decimal by a Whole Number',
    description: 'Multiply a decimal by a whole number and place the point correctly.',
    strand: 'Operations',
    prerequisites: ['D006'],
    crossDomainPrerequisites: ['op.mult.2x1'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 18 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D006'],
    misconceptions: ['dec/lost-point'],
    questionFamilies: ['QF_D008_001', 'QF_D008_002', 'QF_D008_003'],
  },
  {
    id: 'D009',
    slug: 'dec.mult-decimal',
    name: 'Multiply a Decimal by a Decimal',
    description: 'Multiply two decimals and count total decimal places in the product.',
    strand: 'Operations',
    prerequisites: ['D008'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D008'],
    misconceptions: ['dec/wrong-place-count'],
    questionFamilies: ['QF_D009_001', 'QF_D009_002', 'QF_D009_003'],
  },
  {
    id: 'D010',
    slug: 'dec.div-whole',
    name: 'Divide a Decimal by a Whole Number',
    description: 'Divide a decimal by a whole number, aligning the quotient point.',
    strand: 'Operations',
    prerequisites: ['D008'],
    crossDomainPrerequisites: ['op.div.short'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 18 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 28 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D008'],
    misconceptions: ['dec/quotient-point'],
    questionFamilies: ['QF_D010_001', 'QF_D010_002', 'QF_D010_003'],
  },
  {
    id: 'D011',
    slug: 'dec.div-decimal',
    name: 'Dividing by a Decimal',
    description: 'Divide by a decimal by scaling both numbers to a whole-number divisor.',
    strand: 'Operations',
    prerequisites: ['D010', 'D007'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D010', 'D007'],
    misconceptions: ['dec/no-scale-divisor'],
    questionFamilies: ['QF_D011_001', 'QF_D011_002', 'QF_D011_003'],
  },

  // ── Decimal ⇄ fraction conversion (bridge to Fractions & Percentage) ──
  {
    id: 'D012',
    slug: 'dec.to-fraction',
    name: 'Converting Decimals to Fractions',
    description: 'Write a decimal as a fraction in lowest terms.',
    strand: 'Conversion',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['fr.simplify'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/wrong-denominator'],
    questionFamilies: ['QF_D012_001', 'QF_D012_002', 'QF_D012_003'],
  },
  {
    id: 'D013',
    slug: 'dec.from-fraction',
    name: 'Converting Fractions to Decimals',
    description: 'Write a fraction as a decimal by equivalent fractions or division.',
    strand: 'Conversion',
    prerequisites: ['D001'],
    crossDomainPrerequisites: ['fr.equivalent', 'op.div.short'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D001'],
    misconceptions: ['dec/divide-reversed'],
    questionFamilies: ['QF_D013_001', 'QF_D013_002', 'QF_D013_003'],
  },

  // ── Measurement conversions (bridge to Measurement) ──
  {
    id: 'D014',
    slug: 'dec.measure-convert',
    name: 'Measurement Conversions with Decimals',
    description: 'Convert between metric units using decimal multiplication and division.',
    strand: 'Applications',
    prerequisites: ['D007'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 16 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['D007'],
    misconceptions: ['dec/convert-direction'],
    questionFamilies: ['QF_D014_001', 'QF_D014_002', 'QF_D014_003'],
  },
];

const skills = decimalSkills.map((skill) => ({ ...skill }));
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

export function validateDecimalsSkillGraph() {
  const expectedIds = Array.from({ length: 14 }, (_, i) => `D${String(i + 1).padStart(3, '0')}`);
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

export const decimalsSkillGraph = {
  domainId: 'decimals',
  domainName: 'Decimals',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default decimalsSkillGraph;
