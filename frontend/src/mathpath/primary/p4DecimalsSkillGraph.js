const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4DecimalsSkills = [
  {
    id: 'P4-DEC-01',
    name: 'Decimal Place Value',
    description: 'Read and write decimals up to 3 decimal places; identify the value of each digit.',
    strand: 'Decimals',
    prerequisites: ['P4-WN-01'],
    difficulty: 1,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 10 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: [
      'QF_P4-DEC-01_001',
      'QF_P4-DEC-01_002',
    ],
    visual: 'useful',
    misconceptions: ['misplaces_decimal_point', 'longer_decimal_is_larger'],
  },
  {
    id: 'P4-DEC-02',
    name: 'Comparing Decimals',
    description: 'Compare two decimals to determine which is greater or lesser; order a set of decimals.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01'],
    questionFamilies: [
      'QF_P4-DEC-02_001',
      'QF_P4-DEC-02_002',
    ],
    visual: 'useful',
    misconceptions: ['longer_decimal_is_larger'],
  },
  {
    id: 'P4-DEC-03',
    name: 'Rounding Decimals',
    description: 'Round decimals to the nearest whole number, 1 decimal place, or 2 decimal places.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01'],
    questionFamilies: [
      'QF_P4-DEC-03_001',
      'QF_P4-DEC-03_002',
      'QF_P4-DEC-03_003',
    ],
    visual: 'useful',
    misconceptions: ['rounds_wrong_direction'],
  },
  {
    id: 'P4-DEC-04',
    name: 'Adding & Subtracting Decimals',
    description: 'Add and subtract decimals up to 2 decimal places, including word-problem contexts.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01', 'P3-AS-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01', 'P3-AS-01'],
    questionFamilies: [
      'QF_P4-DEC-04_001',
      'QF_P4-DEC-04_002',
      'QF_P4-DEC-04_003',
    ],
    visual: 'optional',
    misconceptions: ['aligns_rightmost_not_decimal_point', 'misplaces_decimal_point'],
  },
  {
    id: 'P4-DEC-05',
    name: 'Multiply/Divide Decimals by 1-digit',
    description: 'Multiply or divide a decimal (up to 2dp) by a single-digit whole number.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-04', 'P4-FO-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-04'],
    questionFamilies: [
      'QF_P4-DEC-05_001',
      'QF_P4-DEC-05_002',
    ],
    visual: 'optional',
    misconceptions: ['forgets_to_place_decimal_back', 'misplaces_decimal_point'],
  },
  {
    id: 'P4-DEC-06',
    name: 'Fraction to Decimal',
    description: 'Express fractions as decimals when the denominator is a factor of 10 or 100.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01', 'P3-FR-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01', 'P3-FR-01'],
    questionFamilies: [
      'QF_P4-DEC-06_001',
      'QF_P4-DEC-06_002',
    ],
    visual: 'useful',
    misconceptions: ['misplaces_decimal_point'],
  },
];

const skills = p4DecimalsSkills.map((skill) => ({ ...skill }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
skills.forEach((skill) => { dependentMap.set(skill.id, []); });
skills.forEach((skill) => {
  skill.prerequisites.forEach((prereqId) => {
    if (dependentMap.has(prereqId)) dependentMap.get(prereqId).push(skill.id);
  });
});

function unique(values) { return [...new Set(values)]; }

export function getSkill(skillId) { return skillById.get(skillId) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(skillId) { return getSkill(skillId)?.prerequisites || []; }
export function getDependents(skillId) { return dependentMap.get(skillId) || []; }
export function getRemediationTargets(skillId) { return getSkill(skillId)?.remediationIfWeak || []; }

export function validateP4DecimalsSkillGraph() {
  const expectedIds = ['P4-DEC-01', 'P4-DEC-02', 'P4-DEC-03', 'P4-DEC-04', 'P4-DEC-05', 'P4-DEC-06'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P3-') && !pid.startsWith('P4-') && !pid.startsWith('P1-'))
      .map((pid) => ({ skillId: skill.id, invalidPrereqId: pid }))
  );

  const errors = unique([
    ...(missingSkills.length ? ['Missing required skill IDs.'] : []),
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references detected.'] : []),
  ]);

  return {
    isValid: errors.length === 0,
    summary: { totalSkills: skills.length, missingSkills, duplicateIds: unique(duplicateIds), invalidPrereqReferences },
    errors,
  };
}

export const p4DecimalsSkillGraph = {
  domainId: 'p4-decimals',
  domainName: 'Primary 4 Decimals',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4DecimalsSkillGraph;
