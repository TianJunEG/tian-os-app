const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5WordProbSkills = [
  {
    id: 'P5-WP-01',
    name: 'Multi-Step Word Problems',
    description: 'Solve 2–3 step word problems involving whole numbers and decimals (e.g. buy items, find change, distribute with remainder).',
    strand: 'Word Problems',
    prerequisites: ['P4-WP-01'],
    difficulty: 5,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WP-01'],
    questionFamilies: [
      'QF_P5-WP-01_001',
      'QF_P5-WP-01_002',
      'QF_P5-WP-01_003',
    ],
    visual: 'useful',
    misconceptions: ['uses_wrong_operation', 'skips_intermediate_step'],
  },
  {
    id: 'P5-WP-02',
    name: 'Before-After Word Problems',
    description: 'Solve problems where quantities change and you find original or final amounts.',
    strand: 'Word Problems',
    prerequisites: ['P5-WP-01'],
    difficulty: 6,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-WP-01'],
    questionFamilies: [
      'QF_P5-WP-02_001',
      'QF_P5-WP-02_002',
      'QF_P5-WP-02_003',
    ],
    visual: 'useful',
    misconceptions: ['misreads_before_after', 'uses_wrong_operation', 'skips_intermediate_step'],
  },
  {
    id: 'P5-WP-03',
    name: 'Rate & Unit Cost Problems',
    description: 'Find unit rate or unit cost, compare rates, and solve multi-step rate problems.',
    strand: 'Word Problems',
    prerequisites: ['P5-WP-01'],
    difficulty: 6,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-WP-01'],
    questionFamilies: [
      'QF_P5-WP-03_001',
      'QF_P5-WP-03_002',
      'QF_P5-WP-03_003',
    ],
    visual: 'useful',
    misconceptions: ['confuses_unit_rate_with_total', 'wrong_comparison_direction', 'uses_wrong_operation'],
  },
];

const skills = p5WordProbSkills.map((skill) => ({ ...skill }));
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

export function validateP5WordProbSkillGraph() {
  const expectedIds = ['P5-WP-01', 'P5-WP-02', 'P5-WP-03'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, i) => actualIds.indexOf(id) !== i);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((pid) => !skillById.has(pid) && !pid.startsWith('P4-') && !pid.startsWith('P3-') && !pid.startsWith('P1-'))
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

export const p5WordProbSkillGraph = {
  domainId: 'p5-wordprob',
  domainName: 'Primary 5 Word Problems',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p5WordProbSkillGraph;
