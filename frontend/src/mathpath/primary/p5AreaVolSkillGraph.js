const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5AreaVolSkills = [
  {
    id: 'P5-AV-01',
    name: 'Area of Triangle',
    description: 'Calculate the area of a triangle using 1/2 × base × height, and identify the correct base and height.',
    strand: 'Area & Volume',
    prerequisites: ['P4-WN-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: ['QF_P5-AV-01_001', 'QF_P5-AV-01_002', 'QF_P5-AV-01_003'],
    visual: 'useful',
    misconceptions: ['forgets_half_for_triangle_area', 'confuses_base_and_height', 'confuses_area_and_perimeter'],
  },
  {
    id: 'P5-AV-02',
    name: 'Volume of Cube & Cuboid',
    description: 'Calculate the volume of a cube (side³) and cuboid (length × width × height), and find a missing dimension given the volume.',
    strand: 'Area & Volume',
    prerequisites: ['P5-AV-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-AV-01'],
    questionFamilies: ['QF_P5-AV-02_001', 'QF_P5-AV-02_002', 'QF_P5-AV-02_003'],
    visual: 'useful',
    misconceptions: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
  },
  {
    id: 'P5-AV-03',
    name: 'Composite Figures',
    description: 'Find the area of composite figures by combining or subtracting rectangles and triangles, and the volume of combined cuboids.',
    strand: 'Area & Volume',
    prerequisites: ['P5-AV-02'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-AV-02'],
    questionFamilies: ['QF_P5-AV-03_001', 'QF_P5-AV-03_002', 'QF_P5-AV-03_003'],
    visual: 'essential',
    misconceptions: ['forgets_half_for_triangle_area', 'confuses_area_and_perimeter', 'adds_dimensions_instead_of_multiplying'],
  },
];

const skills = p5AreaVolSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5AreaVolSkillGraph() {
  const expected = ['P5-AV-01', 'P5-AV-02', 'P5-AV-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5AreaVolSkillGraph = {
  domainId: 'p5-areavol', domainName: 'Primary 5 Area & Volume',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5AreaVolSkillGraph;
