const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FourOpsSkills = [
  {
    id: 'P4-FO-01',
    name: 'Multiply up to 4-digit by 1-digit',
    description: 'Multiply a number up to 4 digits by a 1-digit number using the standard algorithm.',
    strand: 'Four Operations',
    prerequisites: ['P3-MD-03'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 15 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 26 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-03'],
    questionFamilies: [
      'QF_P4-FO-01_001',
      'QF_P4-FO-01_002',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['carries_wrong_column', 'forgets_carry'],
  },
  {
    id: 'P4-FO-02',
    name: 'Multiply up to 3-digit by 2-digit',
    description: 'Multiply a number up to 3 digits by a 2-digit number using the standard algorithm with partial products.',
    strand: 'Four Operations',
    prerequisites: ['P4-FO-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FO-01'],
    questionFamilies: [
      'QF_P4-FO-02_001',
      'QF_P4-FO-02_002',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['wrong_partial_product', 'forgets_carry', 'carries_wrong_column'],
  },
  {
    id: 'P4-FO-03',
    name: 'Divide up to 4-digit by 1-digit',
    description: 'Divide a number up to 4 digits by a 1-digit number, including problems with remainders.',
    strand: 'Four Operations',
    prerequisites: ['P3-MD-03'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 28 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-03'],
    questionFamilies: [
      'QF_P4-FO-03_001',
      'QF_P4-FO-03_002',
      'QF_P4-FO-03_003',
    ],
    visual: 'optional',
    workingRequired: true,
    misconceptions: ['wrong_remainder', 'confuses_quotient_and_remainder'],
  },
];

const skills = p4FourOpsSkills.map((skill) => ({ ...skill }));
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

export function validateP4FourOpsSkillGraph() {
  const expectedIds = ['P4-FO-01', 'P4-FO-02', 'P4-FO-03'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P3-') && !pid.startsWith('P1-'))
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

export const p4FourOpsSkillGraph = {
  domainId: 'p4-four-ops',
  domainName: 'Primary 4 Four Operations',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4FourOpsSkillGraph;
