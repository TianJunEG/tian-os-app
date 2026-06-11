const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4WholeNumbersSkills = [
  {
    id: 'P4-WN-01',
    name: 'Place Value (ten thousands to ones)',
    description: 'Read, write, and decompose numbers up to 100 000 using place value.',
    strand: 'Whole Numbers',
    prerequisites: ['P3-WN-01'],
    difficulty: 1,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WN-01'],
    questionFamilies: [
      'QF_P4-WN-01_001',
      'QF_P4-WN-01_002',
      'QF_P4-WN-01_003',
    ],
    visual: 'useful',
    misconceptions: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
  },
  {
    id: 'P4-WN-02',
    name: 'Comparing & Ordering Numbers to 100 000',
    description: 'Compare pairs and order sets of numbers up to 100 000.',
    strand: 'Whole Numbers',
    prerequisites: ['P4-WN-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: [
      'QF_P4-WN-02_001',
      'QF_P4-WN-02_002',
      'QF_P4-WN-02_003',
    ],
    visual: 'useful',
    misconceptions: ['compares_digit_by_digit_wrong_order_5digit', 'confuses_more_less_symbols_5digit'],
  },
  {
    id: 'P4-WN-03',
    name: 'Number Patterns (hundreds/thousands steps to 100 000)',
    description: 'Identify and continue number patterns with constant steps in the hundreds or thousands up to 100 000.',
    strand: 'Whole Numbers',
    prerequisites: ['P4-WN-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: [
      'QF_P4-WN-03_001',
      'QF_P4-WN-03_002',
      'QF_P4-WN-03_003',
    ],
    visual: 'useful',
    misconceptions: ['pattern_step_error_large', 'pattern_direction_error_large'],
  },
  {
    id: 'P4-WN-04',
    name: 'Rounding to 10, 100, 1000',
    description: 'Round numbers up to 99 999 to the nearest 10, 100, or 1000.',
    strand: 'Whole Numbers',
    prerequisites: ['P4-WN-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: [
      'QF_P4-WN-04_001',
      'QF_P4-WN-04_002',
      'QF_P4-WN-04_003',
    ],
    visual: 'useful',
    misconceptions: ['rounds_wrong_direction', 'rounds_wrong_place', 'truncates_instead_of_rounding'],
  },
];

const skills = p4WholeNumbersSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

function unique(values) { return [...new Set(values)]; }

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

function detectCycles(allSkills) {
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(id, stack) {
    if (visiting.has(id)) { const start = stack.indexOf(id); cycles.push([...stack.slice(start), id]); return; }
    if (visited.has(id)) return;
    visiting.add(id); stack.push(id);
    const skill = skillById.get(id);
    if (skill) { skill.prerequisites.forEach((prereq) => dfs(prereq, stack)); }
    stack.pop(); visiting.delete(id); visited.add(id);
  }
  allSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateP4WholeNumbersSkillGraph() {
  const expectedIds = ['P4-WN-01', 'P4-WN-02', 'P4-WN-03', 'P4-WN-04'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);
  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId) && !prereqId.startsWith('P3-'))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );
  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId) && !targetId.startsWith('P3-'))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );
  const cycles = detectCycles(skills);
  const foundationIds = skills
    .filter((skill) => skill.prerequisites.every((p) => p.startsWith('P3-')))
    .map((skill) => skill.id);
  const reachable = new Set(foundationIds);
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    getDependents(current).forEach((depId) => {
      if (!reachable.has(depId)) { reachable.add(depId); queue.push(depId); }
    });
  }
  const unreachableSkills = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
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
      totalSkills: skills.length, foundationSkills: foundationIds,
      missingSkills, duplicateIds: unique(duplicateIds),
      invalidPrereqReferences, invalidRemediationReferences,
      cycles, unreachableSkills,
    },
    errors,
  };
}

export const p4WholeNumbersSkillGraph = {
  domainId: 'p4-whole-numbers',
  domainName: 'Primary 4 Whole Numbers',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4WholeNumbersSkillGraph;
