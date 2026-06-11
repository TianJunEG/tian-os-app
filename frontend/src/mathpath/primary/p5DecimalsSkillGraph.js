const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5DecimalsSkills = [
  {
    id: 'P5-DEC-01',
    name: 'Decimal Place Value & Rounding',
    description: 'Understand place value up to 3 decimal places and round decimals to 1 or 2 decimal places.',
    strand: 'Decimals',
    prerequisites: ['P4-DEC-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-DEC-01'],
    questionFamilies: ['QF_P5-DEC-01_001', 'QF_P5-DEC-01_002', 'QF_P5-DEC-01_003'],
    visual: 'useful',
    misconceptions: ['ignores_decimal_point_in_comparison', 'forgets_trailing_zeros', 'rounds_wrong_direction'],
  },
  {
    id: 'P5-DEC-02',
    name: 'Decimal Four Operations',
    description: 'Add, subtract, multiply, and divide decimals (including by whole numbers) with accuracy.',
    strand: 'Decimals',
    prerequisites: ['P5-DEC-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 14 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-DEC-01'],
    questionFamilies: ['QF_P5-DEC-02_001', 'QF_P5-DEC-02_002', 'QF_P5-DEC-02_003'],
    visual: 'optional',
    misconceptions: ['misaligns_decimal_points_adding', 'moves_decimal_wrong_direction_multiplying', 'forgets_trailing_zeros'],
  },
  {
    id: 'P5-DEC-03',
    name: 'Fraction-Decimal Conversion',
    description: 'Convert between fractions and decimals, including simplifying where needed.',
    strand: 'Decimals',
    prerequisites: ['P5-DEC-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-DEC-01'],
    questionFamilies: ['QF_P5-DEC-03_001', 'QF_P5-DEC-03_002', 'QF_P5-DEC-03_003'],
    visual: 'optional',
    misconceptions: ['confuses_fraction_decimal_conversion', 'forgets_trailing_zeros'],
  },
];

const skills = p5DecimalsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5DecimalsSkillGraph() {
  const expected = ['P5-DEC-01', 'P5-DEC-02', 'P5-DEC-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5DecimalsSkillGraph = {
  domainId: 'p5-decimals', domainName: 'Primary 5 Decimals',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5DecimalsSkillGraph;
