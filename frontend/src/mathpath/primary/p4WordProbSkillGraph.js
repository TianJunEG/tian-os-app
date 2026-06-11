const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4WordProbSkills = [
  {
    id: 'P4-WP-01',
    name: 'Word Problem: Fraction of a Quantity',
    description: 'Solve word problems that require finding a fraction of a whole quantity (e.g. 3/8 of 24).',
    strand: 'Word Problems',
    prerequisites: ['P4-FR-02'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 36 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FR-02'],
    questionFamilies: [
      'QF_P4-WP-01_001',
      'QF_P4-WP-01_002',
    ],
    visual: 'essential',
    misconceptions: ['uses_wrong_operation', 'computes_fraction_wrong'],
  },
  {
    id: 'P4-WP-02',
    name: 'Two-Step Word Problem',
    description: 'Solve two-step word problems involving subtraction and addition of larger numbers (150–2500 range).',
    strand: 'Word Problems',
    prerequisites: ['P3-WP-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 50 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WP-01'],
    questionFamilies: [
      'QF_P4-WP-02_001',
      'QF_P4-WP-02_002',
    ],
    visual: 'essential',
    misconceptions: ['stops_after_one_step', 'adds_instead_of_subtracts'],
  },
];

const skills = p4WordProbSkills.map((s) => ({ ...s }));
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

export function validateP4WordProbSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P4-FR') && !p.startsWith('P3-WP')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p4WordProbSkillGraph = {
  domainId: 'p4-word-problems',
  domainName: 'Primary 4 Word Problems',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p4WordProbSkillGraph;
