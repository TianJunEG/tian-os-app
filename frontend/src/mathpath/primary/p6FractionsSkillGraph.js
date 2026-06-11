const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6FractionsSkills = [
  {
    id: 'P6-FR-01',
    name: 'Complex Fraction Operations',
    description: 'Multiply and divide mixed numbers and fractions, including three-fraction chains and fraction ÷ whole number.',
    strand: 'Fractions',
    prerequisites: ['P5-FR-03'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-FR-03'],
    questionFamilies: ['QF_P6-FR-01_001', 'QF_P6-FR-01_002', 'QF_P6-FR-01_003'],
    visual: 'useful',
    misconceptions: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division', 'forgets_to_simplify', 'incorrect_mixed_to_improper'],
  },
  {
    id: 'P6-FR-02',
    name: 'Fraction Word Problems',
    description: 'Solve multi-step word problems involving fractions of quantities, including spending, sharing, and remainder calculations.',
    strand: 'Fractions',
    prerequisites: ['P6-FR-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 82, targetAverageSeconds: 45 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-FR-01'],
    questionFamilies: ['QF_P6-FR-02_001', 'QF_P6-FR-02_002', 'QF_P6-FR-02_003'],
    visual: 'useful',
    misconceptions: ['fraction_of_original_not_remainder', 'wrong_common_denominator', 'forgets_to_simplify'],
  },
  {
    id: 'P6-FR-03',
    name: 'Fraction of Remainder',
    description: 'Solve "fraction-of-remainder" chain problems — a signature P6/PSLE pattern where successive fractions are applied to what is left.',
    strand: 'Fractions',
    prerequisites: ['P6-FR-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 55 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-FR-02'],
    questionFamilies: ['QF_P6-FR-03_001', 'QF_P6-FR-03_002', 'QF_P6-FR-03_003'],
    visual: 'useful',
    misconceptions: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole', 'forgets_to_simplify'],
  },
];

const skills = p6FractionsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP6FractionsSkillGraph() {
  const expected = ['P6-FR-01', 'P6-FR-02', 'P6-FR-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p6FractionsSkillGraph = {
  domainId: 'p6-fractions', domainName: 'Primary 6 Fractions',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p6FractionsSkillGraph;
