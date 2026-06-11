const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6PercentageSkills = [
  {
    id: 'P6-PCT-01',
    name: 'Percentage Increase & Decrease',
    description: 'Find the new value after increasing or decreasing a given amount by a percentage.',
    strand: 'Percentage',
    prerequisites: ['P5-PCT-03'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 10 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-PCT-03'],
    questionFamilies: [
      'QF_P6-PCT-01_001',
      'QF_P6-PCT-01_002',
      'QF_P6-PCT-01_003',
    ],
    visual: 'optional',
    misconceptions: ['adds_percentage_to_value_directly', 'confuses_increase_decrease', 'wrong_percentage_fraction'],
  },
  {
    id: 'P6-PCT-02',
    name: 'Discount & GST',
    description: 'Calculate discounted prices, GST (9%) amounts, and sale prices after multiple markdowns.',
    strand: 'Percentage',
    prerequisites: ['P6-PCT-01'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-PCT-01'],
    questionFamilies: [
      'QF_P6-PCT-02_001',
      'QF_P6-PCT-02_002',
      'QF_P6-PCT-02_003',
    ],
    visual: 'optional',
    misconceptions: ['forgets_subtract_discount', 'gst_on_discounted_not_original', 'percentage_of_wrong_base'],
  },
  {
    id: 'P6-PCT-03',
    name: 'Reverse Percentage',
    description: 'Given the final value after a percentage change, find the original value.',
    strand: 'Percentage',
    prerequisites: ['P6-PCT-01'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-PCT-01'],
    questionFamilies: [
      'QF_P6-PCT-03_001',
      'QF_P6-PCT-03_002',
      'QF_P6-PCT-03_003',
    ],
    visual: 'useful',
    misconceptions: ['reverse_percentage_uses_final_as_base', 'percentage_of_wrong_base', 'confuses_increase_decrease'],
  },
];

const skills = p6PercentageSkills.map((skill) => ({ ...skill }));
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

export function validateP6PercentageSkillGraph() {
  const expectedIds = ['P6-PCT-01', 'P6-PCT-02', 'P6-PCT-03'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P5-') && !pid.startsWith('P6-') && !pid.startsWith('P4-'))
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

export const p6PercentageSkillGraph = {
  domainId: 'p6-percentage',
  domainName: 'Primary 6 Percentage',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p6PercentageSkillGraph;
