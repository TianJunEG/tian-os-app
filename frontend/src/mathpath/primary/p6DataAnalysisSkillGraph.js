const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6DataAnalysisSkills = [
  {
    id: 'P6-DA-01',
    name: 'Pie Charts',
    description: 'Read pie charts given as fractions or percentages, find quantities from pie chart data, and find the fraction or percentage of a category.',
    strand: 'Data Analysis',
    prerequisites: ['P5-ST-01'],
    difficulty: 3,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-ST-01'],
    questionFamilies: [
      'QF_P6-DA-01_001',
      'QF_P6-DA-01_002',
      'QF_P6-DA-01_003',
    ],
    visual: 'essential',
    misconceptions: ['pie_chart_fractions_dont_sum_to_1', 'confuses_fraction_percentage_in_pie', 'wrong_total_for_pie', 'assumes_equal_sectors'],
  },
  {
    id: 'P6-DA-02',
    name: 'Average & Data Interpretation',
    description: 'Calculate the average from a data set, find a missing value given the average, and interpret tables to answer questions.',
    strand: 'Data Analysis',
    prerequisites: ['P5-ST-02'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-ST-02'],
    questionFamilies: [
      'QF_P6-DA-02_001',
      'QF_P6-DA-02_002',
      'QF_P6-DA-02_003',
    ],
    visual: 'none',
    misconceptions: ['average_divides_by_wrong_count', 'forgets_to_multiply_average_by_count', 'reads_wrong_category'],
  },
];

const skills = p6DataAnalysisSkills.map((s) => ({ ...s }));
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

export function validateP6DataAnalysisSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p) && !p.startsWith('P5-ST') && !p.startsWith('P6-DA')).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
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

export const p6DataAnalysisSkillGraph = {
  domainId: 'p6-data-analysis',
  domainName: 'Primary 6 Data Analysis',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p6DataAnalysisSkillGraph;
