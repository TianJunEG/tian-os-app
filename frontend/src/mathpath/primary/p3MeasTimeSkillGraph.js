const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p3MeasTimeSkills = [
  {
    id: 'P3-MT-01',
    name: 'Compound Units to Smaller Unit',
    description: 'Convert a measurement in compound units to the smaller unit (e.g. 2 m 30 cm = 230 cm, 3 kg 500 g = 3500 g).',
    strand: 'Measurement',
    prerequisites: [],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P3-MT-01_001',
      'QF_P3-MT-01_002',
      'QF_P3-MT-01_003',
    ],
    visual: 'optional',
    misconceptions: ['wrong_conversion_factor', 'adds_without_converting', 'unit_label_swap'],
  },
  {
    id: 'P3-MT-02',
    name: 'Telling Time (to the minute)',
    description: 'Tell and write time to the minute from an analogue clock.',
    strand: 'Time',
    prerequisites: [],
    difficulty: 1,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 15 },
    fluency: { targetAccuracy: 92, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    questionFamilies: [
      'QF_P3-MT-02_001',
      'QF_P3-MT-02_002',
      'QF_P3-MT-02_003',
    ],
    visual: 'essential',
    misconceptions: ['reads_minute_hand_as_hour', 'off_by_one_hour', 'counts_minutes_by_fives_only'],
  },
  {
    id: 'P3-MT-03',
    name: '24-Hour Clock',
    description: 'Convert between 12-hour (a.m./p.m.) and 24-hour time notation.',
    strand: 'Time',
    prerequisites: ['P3-MT-02'],
    difficulty: 2,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 15 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MT-02'],
    questionFamilies: [
      'QF_P3-MT-03_001',
      'QF_P3-MT-03_002',
      'QF_P3-MT-03_003',
    ],
    visual: 'optional',
    misconceptions: ['forgets_add_12_for_pm', 'confuses_midnight_noon', 'drops_leading_zero_24h'],
  },
  {
    id: 'P3-MT-04',
    name: 'Finding a Duration',
    description: 'Find the duration between two times, or find the end time given start time and duration.',
    strand: 'Time',
    prerequisites: ['P3-MT-02'],
    difficulty: 3,
    singaporeLevel: ['P3'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 15 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MT-02'],
    questionFamilies: [
      'QF_P3-MT-04_001',
      'QF_P3-MT-04_002',
      'QF_P3-MT-04_003',
    ],
    visual: 'useful',
    misconceptions: ['subtracts_minutes_across_hour_wrong', 'treats_60min_as_100'],
  },
];

const skills = p3MeasTimeSkills.map((s) => ({ ...s }));
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

export function validateP3MeasTimeSkillGraph() {
  const ids = skills.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badPrereqs = skills.flatMap((s) =>
    s.prerequisites.filter((p) => !skillById.has(p)).map((p) => ({ skillId: s.id, invalidPrereqId: p }))
  );
  const foundations = skills.filter((s) => s.prerequisites.length === 0).map((s) => s.id);
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

export const p3MeasTimeSkillGraph = {
  domainId: 'p3-meas-time',
  domainName: 'Primary 3 Measurement and Time',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default p3MeasTimeSkillGraph;
