const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6AlgebraSkills = [
  {
    id: 'P6-ALG-01',
    name: 'Forming Algebraic Expressions',
    description: 'Write algebraic expressions using letters to represent unknown quantities in a variety of contexts.',
    strand: 'Algebra',
    prerequisites: ['P5-WN-03'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 14 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-WN-03'],
    questionFamilies: ['QF_P6-ALG-01_001', 'QF_P6-ALG-01_002', 'QF_P6-ALG-01_003'],
    visual: 'useful',
    misconceptions: ['confuses_variable_with_label', 'adds_unlike_terms', 'confuses_expression_and_equation'],
  },
  {
    id: 'P6-ALG-02',
    name: 'Solving Linear Equations',
    description: 'Solve one-step and two-step linear equations involving whole numbers where the answer is a positive integer.',
    strand: 'Algebra',
    prerequisites: ['P6-ALG-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 14 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-ALG-01'],
    questionFamilies: ['QF_P6-ALG-02_001', 'QF_P6-ALG-02_002', 'QF_P6-ALG-02_003'],
    visual: 'optional',
    misconceptions: ['forgets_inverse_operation', 'wrong_order_of_inverse', 'sign_error_in_equation'],
  },
  {
    id: 'P6-ALG-03',
    name: 'Algebraic Word Problems',
    description: 'Form algebraic equations from word problem contexts and solve to find the unknown value.',
    strand: 'Algebra',
    prerequisites: ['P6-ALG-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 14 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-ALG-02'],
    questionFamilies: ['QF_P6-ALG-03_001', 'QF_P6-ALG-03_002', 'QF_P6-ALG-03_003'],
    visual: 'optional',
    misconceptions: ['writes_equation_backwards', 'ignores_units_in_algebra', 'confuses_expression_and_equation'],
  },
];

const skills = p6AlgebraSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP6AlgebraSkillGraph() {
  const expected = ['P6-ALG-01', 'P6-ALG-02', 'P6-ALG-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p6AlgebraSkillGraph = {
  domainId: 'p6-algebra', domainName: 'Primary 6 Algebra',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p6AlgebraSkillGraph;
