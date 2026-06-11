const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5GeometrySkills = [
  {
    id: 'P5-GEO-01',
    name: 'Angles on Straight Line & at a Point',
    description: 'Find unknown angles using the properties that angles on a straight line sum to 180° and angles at a point sum to 360°, including vertically opposite angles.',
    strand: 'Geometry',
    prerequisites: ['P4-WN-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: ['QF_P5-GEO-01_001', 'QF_P5-GEO-01_002', 'QF_P5-GEO-01_003'],
    visual: 'useful',
    misconceptions: ['forgets_angles_on_line_sum_180', 'confuses_vertically_opposite_with_adjacent', 'forgets_angles_at_point_sum_360'],
  },
  {
    id: 'P5-GEO-02',
    name: 'Triangle Angle Properties',
    description: 'Find unknown angles in triangles using the angle sum property (180°), isosceles triangle properties, and equilateral triangle properties.',
    strand: 'Geometry',
    prerequisites: ['P5-GEO-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-GEO-01'],
    questionFamilies: ['QF_P5-GEO-02_001', 'QF_P5-GEO-02_002', 'QF_P5-GEO-02_003'],
    visual: 'useful',
    misconceptions: ['wrong_triangle_angle_sum', 'forgets_isosceles_has_two_equal_angles', 'assumes_all_triangles_equilateral'],
  },
  {
    id: 'P5-GEO-03',
    name: 'Parallelogram & Quadrilateral Properties',
    description: 'Find unknown angles in parallelograms and other quadrilaterals using properties such as opposite angles being equal and co-interior angles summing to 180°.',
    strand: 'Geometry',
    prerequisites: ['P5-GEO-02'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-GEO-02'],
    questionFamilies: ['QF_P5-GEO-03_001', 'QF_P5-GEO-03_002', 'QF_P5-GEO-03_003'],
    visual: 'useful',
    misconceptions: ['confuses_parallelogram_properties', 'forgets_quadrilateral_angle_sum_360', 'wrong_co_interior_angle_sum'],
  },
];

const skills = p5GeometrySkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5GeometrySkillGraph() {
  const expected = ['P5-GEO-01', 'P5-GEO-02', 'P5-GEO-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5GeometrySkillGraph = {
  domainId: 'p5-geometry', domainName: 'Primary 5 Geometry',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5GeometrySkillGraph;
