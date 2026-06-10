const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4WordProbSkills = [
  {
    id: 'P4-WP-01',
    name: 'Fraction of a Quantity (Bar Model)',
    description: 'Use a bar model to find a fraction of a given quantity (e.g. 3/8 of 24).',
    strand: 'Word Problems',
    prerequisites: ['P3-WP-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WP-01'],
    questionFamilies: [
      'QF_P4-WP-01_001',
      'QF_P4-WP-01_002',
      'QF_P4-WP-01_003',
    ],
    visual: 'useful',
    misconceptions: ['fraction_bar_model_confusion', 'wrong_operation_choice'],
  },
  {
    id: 'P4-WP-02',
    name: 'Two-Step Word Problem (Larger Numbers)',
    description: 'Solve two-step word problems involving larger numbers (up to 2500).',
    strand: 'Word Problems',
    prerequisites: ['P3-WP-01'],
    difficulty: 4,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WP-01'],
    questionFamilies: [
      'QF_P4-WP-02_001',
      'QF_P4-WP-02_002',
      'QF_P4-WP-02_003',
    ],
    visual: 'useful',
    misconceptions: ['doesnt_identify_what_to_find', 'wrong_operation_choice', 'forgets_second_step'],
  },
];

const skills = p4WordProbSkills.map((skill) => ({ ...skill }));
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

export function validateP4WordProbSkillGraph() {
  const expectedIds = ['P4-WP-01', 'P4-WP-02'];
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

export const p4WordProbSkillGraph = {
  domainId: 'p4-word-problems',
  domainName: 'Primary 4 Word Problems',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4WordProbSkillGraph;
