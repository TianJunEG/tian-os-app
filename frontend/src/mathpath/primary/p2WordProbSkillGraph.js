const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p2WordProbSkills = [
  {
    id: 'P2-WP-01',
    name: 'Comparing Two Quantities',
    description: 'Solve word problems that compare two quantities using "more than" or "less than" to find the larger, smaller, or the difference.',
    strand: 'Word Problems',
    prerequisites: [],
    difficulty: 2,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 28 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P2-WP-01_001',
      'QF_P2-WP-01_002',
      'QF_P2-WP-01_003',
    ],
    visual: 'useful',
    misconceptions: ['adds_when_should_subtract', 'subtracts_when_should_add', 'confuses_total_with_difference'],
  },
  {
    id: 'P2-WP-02',
    name: 'Equal Groups',
    description: 'Solve word problems involving equal groups to find the total, or find the number of groups given a total and group size.',
    strand: 'Word Problems',
    prerequisites: [],
    difficulty: 2,
    singaporeLevel: ['P2'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 26 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P2-WP-02_001',
      'QF_P2-WP-02_002',
    ],
    visual: 'useful',
    misconceptions: ['multiplies_wrong_numbers', 'confuses_groups_with_per_group'],
  },
];

const skills = p2WordProbSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));

const dependentMap = new Map();
skills.forEach((s) => dependentMap.set(s.id, []));
skills.forEach((s) => {
  s.prerequisites.forEach((pid) => {
    if (dependentMap.has(pid)) dependentMap.get(pid).push(s.id);
  });
});

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP2WordProbSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P2-WP')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills.filter((s) => s.prerequisites.every((p) => !skillById.has(p))).map((s) => s.id);
  const reachable = new Set(foundations);
  const queue = [...foundations];
  while (queue.length) {
    const c = queue.shift();
    (dependentMap.get(c) || []).forEach((d) => { if (!reachable.has(d)) { reachable.add(d); queue.push(d); } });
  }
  const unreachable = skills.filter((s) => !reachable.has(s.id)).map((s) => s.id);
  const errors = [
    ...(dupes.length ? ['Duplicate skill IDs detected.'] : []),
    ...(badPrereqs.length ? ['Invalid prerequisite references detected.'] : []),
    ...(unreachable.length ? ['Unreachable skills detected.'] : []),
  ];
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, foundationSkills: foundations, duplicateIds: [...new Set(dupes)], invalidPrereqReferences: badPrereqs, unreachableSkills: unreachable }, errors };
}

export const p2WordProbSkillGraph = {
  domainId: 'p2-word-problems',
  domainName: 'Primary 2 Word Problems',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p2WordProbSkillGraph;
