const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5PercentageSkills = [
  {
    id: 'P5-PCT-01',
    name: 'Percent ↔ Fraction/Decimal Conversion',
    description: 'Convert between percentages, fractions, and decimals (e.g., 25% = 1/4 = 0.25).',
    strand: 'Percentage',
    prerequisites: ['P5-DEC-03'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-DEC-03'],
    questionFamilies: ['QF_P5-PCT-01_001', 'QF_P5-PCT-01_002', 'QF_P5-PCT-01_003'],
    visual: 'optional',
    misconceptions: ['moves_decimal_wrong_way', 'forgets_to_simplify_percent_fraction', 'divides_by_wrong_base_for_percent'],
  },
  {
    id: 'P5-PCT-02',
    name: 'Find Percentage of a Quantity',
    description: 'Calculate a given percentage of a whole number (e.g., 30% of 200 = 60) and find what percentage one number is of another.',
    strand: 'Percentage',
    prerequisites: ['P5-PCT-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-PCT-01'],
    questionFamilies: ['QF_P5-PCT-02_001', 'QF_P5-PCT-02_002', 'QF_P5-PCT-02_003'],
    visual: 'optional',
    misconceptions: ['divides_by_wrong_base_for_percent', 'finds_percent_of_wrong_total', 'moves_decimal_wrong_way'],
  },
  {
    id: 'P5-PCT-03',
    name: 'Percentage Word Problems',
    description: 'Solve multi-step word problems involving percentages, including finding remainders and combining percentages.',
    strand: 'Percentage',
    prerequisites: ['P5-PCT-02'],
    difficulty: 5,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-PCT-02'],
    questionFamilies: ['QF_P5-PCT-03_001', 'QF_P5-PCT-03_002', 'QF_P5-PCT-03_003'],
    visual: 'optional',
    misconceptions: ['finds_percent_of_wrong_total', 'confuses_percent_increase_with_percent_of', 'divides_by_wrong_base_for_percent'],
  },
];

const skills = p5PercentageSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5PercentageSkillGraph() {
  const expected = ['P5-PCT-01', 'P5-PCT-02', 'P5-PCT-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5PercentageSkillGraph = {
  domainId: 'p5-percentage', domainName: 'Primary 5 Percentage',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5PercentageSkillGraph;
