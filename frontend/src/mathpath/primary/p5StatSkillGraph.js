const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5StatSkills = [
  {
    id: 'P5-ST-01',
    name: 'Average (Mean)',
    description: 'Find the average of a set of numbers, find the total from the average, and find a missing value given the average.',
    strand: 'Statistics',
    prerequisites: ['P4-ST-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-ST-01'],
    questionFamilies: [
      'QF_P5-ST-01_001',
      'QF_P5-ST-01_002',
      'QF_P5-ST-01_003',
    ],
    visual: 'none',
    misconceptions: ['divides_by_wrong_count_for_average', 'confuses_average_with_median', 'forgets_to_include_all_values'],
  },
  {
    id: 'P5-ST-02',
    name: 'Data Interpretation',
    description: 'Read and interpret bar graphs, tables, and pie charts. Calculate totals, differences, and identify categories with the most or least.',
    strand: 'Statistics',
    prerequisites: ['P5-ST-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-ST-01'],
    questionFamilies: [
      'QF_P5-ST-02_001',
      'QF_P5-ST-02_002',
      'QF_P5-ST-02_003',
    ],
    visual: 'required',
    misconceptions: ['reads_wrong_row_column', 'double_counts_data', 'forgets_to_include_all_values'],
  },
];

const skills = p5StatSkills.map((skill) => ({ ...skill }));
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

export function validateP5StatSkillGraph() {
  const expectedIds = ['P5-ST-01', 'P5-ST-02'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P4-') && !pid.startsWith('P3-'))
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

export const p5StatSkillGraph = {
  domainId: 'p5-stat',
  domainName: 'Primary 5 Statistics',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p5StatSkillGraph;
