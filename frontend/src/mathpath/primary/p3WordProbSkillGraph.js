const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3WordProbSkills = [
  {
    id: 'P3-WP-01',
    name: 'Word Problem: Sharing Equally',
    description: 'Solve word problems involving dividing a quantity into equal parts using the model method.',
    strand: 'Word Problems',
    prerequisites: ['P3-MD-02'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 36 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-02'],
    questionFamilies: [
      'QF_P3-WP-01_001',
      'QF_P3-WP-01_002',
      'QF_P3-WP-01_003',
    ],
    visual: 'essential',
    misconceptions: ['wrong_operation_choice', 'misreads_question', 'remainder_in_context'],
  },
  {
    id: 'P3-WP-02',
    name: 'Two-Step Word Problem',
    description: 'Solve a 2-step word problem using the bar model method (add/subtract combinations).',
    strand: 'Word Problems',
    prerequisites: ['P3-AS-03', 'P3-AS-04'],
    difficulty: 4,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 50 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-AS-03', 'P3-AS-04'],
    questionFamilies: [
      'QF_P3-WP-02_001',
      'QF_P3-WP-02_002',
      'QF_P3-WP-02_003',
    ],
    visual: 'essential',
    misconceptions: ['wrong_operation_choice', 'stops_after_one_step', 'misreads_question'],
  },
];

const skills = p3WordProbSkills.map((s) => ({ ...s }));
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

export function validateP3WordProbSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P3-MD') && !p.startsWith('P3-AS')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p3WordProbSkillGraph = {
  domainId: 'p3-word-problems',
  domainName: 'Primary 3 Word Problems',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3WordProbSkillGraph;
