const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5FractionsSkills = [
  {
    id: 'P5-FR-01',
    name: 'Unlike Fractions Addition & Subtraction',
    description: 'Find the LCD and add or subtract proper fractions and mixed numbers with unlike denominators.',
    strand: 'Fractions',
    prerequisites: ['P4-FR-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 14 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FR-01'],
    questionFamilies: ['QF_P5-FR-01_001', 'QF_P5-FR-01_002', 'QF_P5-FR-01_003'],
    visual: 'useful',
    misconceptions: ['adds_numerators_and_denominators', 'forgets_to_find_lcd', 'wrong_mixed_number_conversion', 'forgets_to_simplify'],
  },
  {
    id: 'P5-FR-02',
    name: 'Fraction of a Whole Number',
    description: 'Find the fraction of a whole number, e.g. 2/3 × 12 = 8.',
    strand: 'Fractions',
    prerequisites: ['P5-FR-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-FR-01'],
    questionFamilies: ['QF_P5-FR-02_001', 'QF_P5-FR-02_002', 'QF_P5-FR-02_003'],
    visual: 'useful',
    misconceptions: ['multiplies_whole_by_both_num_and_den', 'forgets_to_simplify'],
  },
  {
    id: 'P5-FR-03',
    name: 'Fraction Multiplication & Division',
    description: 'Multiply fraction × fraction, divide whole ÷ fraction, and divide fraction ÷ whole number.',
    strand: 'Fractions',
    prerequisites: ['P5-FR-02'],
    difficulty: 5,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 14 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 28 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-FR-02'],
    questionFamilies: ['QF_P5-FR-03_001', 'QF_P5-FR-03_002', 'QF_P5-FR-03_003'],
    visual: 'useful',
    misconceptions: ['inverts_wrong_fraction_in_division', 'multiplies_whole_by_both_num_and_den', 'forgets_to_simplify'],
  },
];

const skills = p5FractionsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5FractionsSkillGraph() {
  const expected = ['P5-FR-01', 'P5-FR-02', 'P5-FR-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5FractionsSkillGraph = {
  domainId: 'p5-fractions', domainName: 'Primary 5 Fractions',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5FractionsSkillGraph;
