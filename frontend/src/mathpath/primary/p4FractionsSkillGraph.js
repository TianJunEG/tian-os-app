const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FractionsSkills = [
  {
    id: 'P4-FR-01',
    name: 'Mixed Number to Improper Fraction',
    description: 'Convert a mixed number to an improper fraction by computing whole × denominator + numerator.',
    strand: 'Fractions',
    prerequisites: ['P3-FR-01'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-FR-01'],
    questionFamilies: ['QF_P4-FR-01_001', 'QF_P4-FR-01_002'],
    visual: 'useful',
    misconceptions: ['multiplies_whole_but_forgets_numerator'],
  },
  {
    id: 'P4-FR-02',
    name: 'Fraction of a Set',
    description: 'Find a fraction of a set of objects, e.g. 3/4 of 20.',
    strand: 'Fractions',
    prerequisites: ['P3-FR-02'],
    difficulty: 2,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-FR-02'],
    questionFamilies: ['QF_P4-FR-02_001', 'QF_P4-FR-02_002'],
    visual: 'useful',
    misconceptions: ['divides_set_by_numerator_not_denominator'],
  },
  {
    id: 'P4-FR-03',
    name: 'Add & Subtract Unlike Fractions',
    description: 'Add or subtract two fractions with different denominators by finding the LCD and renaming.',
    strand: 'Fractions',
    prerequisites: ['P3-FR-02', 'P4-FR-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-FR-02', 'P4-FR-01'],
    questionFamilies: ['QF_P4-FR-03_001', 'QF_P4-FR-03_002', 'QF_P4-FR-03_003'],
    visual: 'useful',
    misconceptions: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'],
  },
];

const skills = p4FractionsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP4FractionsSkillGraph() {
  const expected = ['P4-FR-01', 'P4-FR-02', 'P4-FR-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p4FractionsSkillGraph = {
  domainId: 'p4-fractions', domainName: 'Primary 4 Fractions',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p4FractionsSkillGraph;
