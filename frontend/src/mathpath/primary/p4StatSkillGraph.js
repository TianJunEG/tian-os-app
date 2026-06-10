const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4StatSkills = [
  {
    id: 'P4-STAT-01',
    name: 'Reading a Line Graph',
    description: 'Read the value at a given point on a line graph and find the change between two points.',
    strand: 'Statistics',
    prerequisites: ['P3-ST-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-ST-01'],
    questionFamilies: [
      'QF_P4-STAT-01_001',
      'QF_P4-STAT-01_002',
      'QF_P4-STAT-01_003',
    ],
    visual: 'required',
    misconceptions: ['reads_wrong_axis', 'interpolation_error', 'misreads_scale'],
  },
  {
    id: 'P4-STAT-02',
    name: 'Reading a Pie Chart',
    description: 'Read the value of a labelled sector from a pie chart and find the total or a missing value.',
    strand: 'Statistics',
    prerequisites: ['P3-ST-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-ST-01'],
    questionFamilies: [
      'QF_P4-STAT-02_001',
      'QF_P4-STAT-02_002',
      'QF_P4-STAT-02_003',
    ],
    visual: 'required',
    misconceptions: ['confuses_sector_label', 'misreads_scale', 'reads_wrong_axis'],
  },
];

const skills = p4StatSkills.map((skill) => ({ ...skill }));
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

export function validateP4StatSkillGraph() {
  const expectedIds = ['P4-STAT-01', 'P4-STAT-02'];
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

export const p4StatSkillGraph = {
  domainId: 'p4-statistics',
  domainName: 'Primary 4 Statistics',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4StatSkillGraph;
