const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FactorsMultiplesSkills = [
  {
    id: 'P4-FM-01',
    name: 'Common Factors (HCF)',
    description: 'Find the common factors of two numbers and identify the highest common factor (HCF).',
    strand: 'Factors & Multiples',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: [
      'QF_P4-FM-01_001',
      'QF_P4-FM-01_002',
      'QF_P4-FM-01_003',
    ],
    visual: 'useful',
    misconceptions: ['confuses_factors_and_multiples', 'misses_factor_pair', 'forgets_1_is_a_factor'],
  },
  {
    id: 'P4-FM-02',
    name: 'Common Multiples (LCM)',
    description: 'Find the common multiples of two 1-digit numbers and identify the lowest common multiple (LCM).',
    strand: 'Factors & Multiples',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: [
      'QF_P4-FM-02_001',
      'QF_P4-FM-02_002',
      'QF_P4-FM-02_003',
    ],
    visual: 'useful',
    misconceptions: ['confuses_factors_and_multiples', 'multiplies_instead_of_finding_lcm', 'stops_listing_too_early'],
  },
];

const skills = p4FactorsMultiplesSkills.map((skill) => ({ ...skill }));
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

export function validateP4FactorsMultiplesSkillGraph() {
  const expectedIds = ['P4-FM-01', 'P4-FM-02'];
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

export const p4FactorsMultiplesSkillGraph = {
  domainId: 'p4-factors-multiples',
  domainName: 'Primary 4 Factors & Multiples',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4FactorsMultiplesSkillGraph;
