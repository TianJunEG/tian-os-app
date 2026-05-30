const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const fractionSkills = [
  {
    id: 'F001',
    name: 'Recognise Fractions',
    description: 'Identify fractions as equal parts of a whole using simple models.',
    strand: 'Foundations',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: ['QF_F001_001', 'QF_F001_002'],
  },
  {
    id: 'F002',
    name: 'Numerator and Denominator',
    description: 'Explain the meaning of numerator and denominator in a fraction.',
    strand: 'Foundations',
    prerequisites: ['F001'],
    difficulty: 1,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F001'],
    questionFamilies: ['QF_F002_001', 'QF_F002_002'],
  },
  {
    id: 'F003',
    name: 'Fraction of a Whole',
    description: 'Represent and interpret a fraction as part of one whole.',
    strand: 'Foundations',
    prerequisites: ['F001', 'F002'],
    difficulty: 1,
    singaporeLevel: ['P2', 'P3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 14 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F001', 'F002'],
    questionFamilies: ['QF_F003_001', 'QF_F003_002'],
  },
  {
    id: 'F004',
    name: 'Unit Fractions',
    description: 'Identify and compare fractions with numerator 1 as unit fractions.',
    strand: 'Foundations',
    prerequisites: ['F003'],
    difficulty: 1,
    singaporeLevel: ['P2', 'P3'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 16 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003'],
    questionFamilies: ['QF_F004_001', 'QF_F004_002'],
  },
  {
    id: 'F005',
    name: 'Fractions on Number Line',
    description: 'Locate and read fractions on number lines with equal partitions.',
    strand: 'Representation',
    prerequisites: ['F003'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 16 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003'],
    questionFamilies: ['QF_F005_001', 'QF_F005_002'],
  },
  {
    id: 'F006',
    name: 'Compare Unit Fractions',
    description: 'Compare unit fractions by reasoning about denominator size.',
    strand: 'Comparison',
    prerequisites: ['F004', 'F005'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 18 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F004', 'F005'],
    questionFamilies: ['QF_F006_001', 'QF_F006_002'],
  },
  {
    id: 'F007',
    name: 'Compare Same Denominator',
    description: 'Compare fractions that share the same denominator.',
    strand: 'Comparison',
    prerequisites: ['F003'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 16 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003'],
    questionFamilies: ['QF_F007_001', 'QF_F007_002'],
  },
  {
    id: 'F008',
    name: 'Compare Same Numerator',
    description: 'Compare fractions with same numerator by denominator relationship.',
    strand: 'Comparison',
    prerequisites: ['F004', 'F006'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 16 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F004', 'F006'],
    questionFamilies: ['QF_F008_001', 'QF_F008_002'],
  },
  {
    id: 'F009',
    name: 'Order Fractions',
    description: 'Arrange fractions in ascending or descending order.',
    strand: 'Comparison',
    prerequisites: ['F006', 'F007', 'F008'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 18 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F006', 'F007', 'F008'],
    questionFamilies: ['QF_F009_001', 'QF_F009_002'],
  },
  {
    id: 'F010',
    name: 'Equivalent Fractions',
    description: 'Recognise fractions that represent the same value.',
    strand: 'Equivalence',
    prerequisites: ['F003', 'F007'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 18 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003', 'F007'],
    questionFamilies: ['QF_F010_001', 'QF_F010_002'],
  },
  {
    id: 'F011',
    name: 'Generate Equivalent Fractions',
    description: 'Create equivalent fractions through scaling by common factors.',
    strand: 'Equivalence',
    prerequisites: ['F010'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F010'],
    questionFamilies: ['QF_F011_001', 'QF_F011_002'],
  },
  {
    id: 'F012',
    name: 'Simplify Fractions',
    description: 'Reduce fractions to simplest form using highest common factors.',
    strand: 'Equivalence',
    prerequisites: ['F011'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F010', 'F011'],
    questionFamilies: ['QF_F012_001', 'QF_F012_002'],
  },
  {
    id: 'F013',
    name: 'Improper Fractions',
    description: 'Interpret and represent improper fractions greater than or equal to 1.',
    strand: 'Conversion',
    prerequisites: ['F003', 'F010'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 18 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003', 'F010'],
    questionFamilies: ['QF_F013_001', 'QF_F013_002'],
  },
  {
    id: 'F014',
    name: 'Mixed Numbers',
    description: 'Represent mixed numbers and connect them to improper fractions.',
    strand: 'Conversion',
    prerequisites: ['F013'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 18 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F013'],
    questionFamilies: ['QF_F014_001', 'QF_F014_002'],
  },
  {
    id: 'F015',
    name: 'Convert Mixed ↔ Improper',
    description: 'Convert between mixed numbers and improper fractions accurately.',
    strand: 'Conversion',
    prerequisites: ['F013', 'F014'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 20 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F013', 'F014'],
    questionFamilies: ['QF_F015_001', 'QF_F015_002'],
  },
  {
    id: 'F016',
    name: 'Add Same Denominator',
    description: 'Add fractions that share a common denominator.',
    strand: 'Operations',
    prerequisites: ['F007', 'F010'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 18 },
    fluency: { targetAccuracy: 94, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F007', 'F010'],
    questionFamilies: ['QF_F016_001', 'QF_F016_002'],
  },
  {
    id: 'F017',
    name: 'Subtract Same Denominator',
    description: 'Subtract fractions with same denominator while preserving denominator.',
    strand: 'Operations',
    prerequisites: ['F007', 'F016'],
    difficulty: 2,
    singaporeLevel: ['P3', 'P4'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 18 },
    fluency: { targetAccuracy: 94, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F007', 'F016'],
    questionFamilies: ['QF_F017_001', 'QF_F017_002'],
  },
  {
    id: 'F018',
    name: 'Add Different Denominators',
    description: 'Add unlike fractions by finding common denominators first.',
    strand: 'Operations',
    prerequisites: ['F011', 'F012', 'F016'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 22 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F011', 'F012', 'F016'],
    questionFamilies: ['QF_F018_001', 'QF_F018_002'],
  },
  {
    id: 'F019',
    name: 'Subtract Different Denominators',
    description: 'Subtract unlike fractions by converting to common denominators.',
    strand: 'Operations',
    prerequisites: ['F011', 'F012', 'F017'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 22 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F011', 'F012', 'F017'],
    questionFamilies: ['QF_F019_001', 'QF_F019_002'],
  },
  {
    id: 'F020',
    name: 'Fraction of Quantity',
    description: 'Find a fraction of a discrete or continuous quantity.',
    strand: 'Applications',
    prerequisites: ['F003', 'F010', 'F016'],
    difficulty: 3,
    singaporeLevel: ['P4', 'P5'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 20 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F003', 'F010', 'F016'],
    questionFamilies: ['QF_F020_001', 'QF_F020_002'],
  },
  {
    id: 'F021',
    name: 'Multiply Fractions',
    description: 'Multiply fractions and simplify results where appropriate.',
    strand: 'Operations',
    prerequisites: ['F012', 'F015'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 22 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F012', 'F015'],
    questionFamilies: ['QF_F021_001', 'QF_F021_002'],
  },
  {
    id: 'F022',
    name: 'Divide Fractions',
    description: 'Divide fractions using reciprocal relationships.',
    strand: 'Operations',
    prerequisites: ['F021'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 92, minimumQuestions: 24 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 24 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F021'],
    questionFamilies: ['QF_F022_001', 'QF_F022_002'],
  },
  {
    id: 'F023',
    name: 'Fraction Word Problems',
    description: 'Apply fraction operations in one-step contextual problems.',
    strand: 'Applications',
    prerequisites: ['F018', 'F019', 'F020'],
    difficulty: 4,
    singaporeLevel: ['P5', 'P6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 24 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F018', 'F019', 'F020'],
    questionFamilies: ['QF_F023_001', 'QF_F023_002'],
  },
  {
    id: 'F024',
    name: 'Multi-Step Fraction Problems',
    description: 'Solve multi-step fraction tasks involving conversion and operations.',
    strand: 'Applications',
    prerequisites: ['F023', 'F021'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 24 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 45 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F023', 'F021'],
    questionFamilies: ['QF_F024_001', 'QF_F024_002'],
  },
  {
    id: 'F025',
    name: 'Exam-Style Fraction Applications',
    description: 'Handle school-style fraction items in mixed formats and contexts.',
    strand: 'Assessment Prep',
    prerequisites: ['F024', 'F022'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 90, minimumQuestions: 26 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 50 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F024', 'F022'],
    questionFamilies: ['QF_F025_001', 'QF_F025_002'],
  },
  {
    id: 'F026',
    name: 'Fractions Mastery Challenge',
    description: 'Demonstrate consolidated mastery across all fraction strands.',
    strand: 'Mastery',
    prerequisites: ['F025'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 93, minimumQuestions: 30 },
    fluency: { targetAccuracy: 93, targetAverageSeconds: 55 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['F018', 'F019', 'F022', 'F024'],
    questionFamilies: ['QF_F026_001', 'QF_F026_002'],
  },
];

const skillById = new Map(fractionSkills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
fractionSkills.forEach((skill) => {
  dependentMap.set(skill.id, []);
});
fractionSkills.forEach((skill) => {
  skill.prerequisites.forEach((prereqId) => {
    if (dependentMap.has(prereqId)) {
      dependentMap.get(prereqId).push(skill.id);
    }
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
    if (prereqs.length > 0) {
      walk(prereqs[0]);
    }
    path.push(currentId);
  }

  walk(skillId);
  return path;
}

export function getDependencyMap() {
  return fractionSkills.reduce((acc, skill) => {
    acc[skill.id] = {
      prerequisites: [...skill.prerequisites],
      dependents: getDependents(skill.id),
      remediationIfWeak: [...skill.remediationIfWeak],
    };
    return acc;
  }, {});
}

function detectCycles(skills) {
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
    if (skill) {
      skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  skills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateFractionSkillGraph() {
  const expectedIds = Array.from({ length: 26 }, (_, i) => `F${String(i + 1).padStart(3, '0')}`);
  const actualIds = fractionSkills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const invalidPrereqReferences = fractionSkills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = fractionSkills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );

  const cycles = detectCycles(fractionSkills);

  const foundationIds = fractionSkills.filter((skill) => skill.prerequisites.length === 0).map((skill) => skill.id);
  const reachable = new Set();
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    getDependents(current).forEach((dependentId) => queue.push(dependentId));
  }
  const unreachableSkills = fractionSkills.filter((skill) => !reachable.has(skill.id)).map((skill) => skill.id);

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
      totalSkills: fractionSkills.length,
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

export const fractionSkillGraph = {
  domainId: 'fractions',
  domainName: 'Fractions',
  version: '1.0.0',
  skillIds: fractionSkills.map((s) => s.id),
  skills: fractionSkills,
};

export default fractionSkillGraph;
