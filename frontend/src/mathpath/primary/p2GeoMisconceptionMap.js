const misconceptions = [
  {
    tag: 'confuses_cube_cuboid',
    label: 'Confuses a cube with a cuboid',
    description: 'Calls a cuboid a "cube" or vice versa, not realising a cube has all square faces while a cuboid can have rectangular faces.',
    remediationExplanation: 'A cube has 6 square faces that are all the same size. A cuboid also has 6 faces, but they can be rectangles of different sizes. If all faces are squares, it is a cube.',
    visualScaffold: 'cube_vs_cuboid_comparison',
    recheckPattern: 'Look at this shape with 6 faces. Are all faces the same size? Is it a cube or a cuboid?',
    parentNote: 'Show your child a dice (cube) and a tissue box (cuboid). Ask: "Are all the faces the same shape and size?" Cube = yes, cuboid = no.',
    relatedSkills: ['P2-GEO-01'],
  },
  {
    tag: 'confuses_2d_3d_names',
    label: 'Uses 2D shape names for 3D solids',
    description: 'Calls a sphere a "circle" or a cube a "square", mixing up flat shape names with solid shape names.',
    remediationExplanation: 'A circle is flat (2D) but a sphere is round like a ball (3D). A square is flat (2D) but a cube is solid like a dice (3D). 3D shapes are solid — you can hold them.',
    visualScaffold: '2d_vs_3d_names_chart',
    recheckPattern: 'Is a ball a circle or a sphere? Is a dice a square or a cube?',
    parentNote: 'Point to flat shapes in a book (2D) and real objects you can pick up (3D). Ask: "Can you hold it? Then it is a 3D shape."',
    relatedSkills: ['P2-GEO-01'],
  },
  {
    tag: 'confuses_cone_cylinder',
    label: 'Confuses a cone with a cylinder',
    description: 'Calls a cylinder a "cone" or vice versa, not noticing whether the shape tapers to a point or has two circular ends.',
    remediationExplanation: 'A cone has a flat circular base and comes to a point at the top (like a party hat). A cylinder has two flat circular ends and does not taper (like a tin can).',
    visualScaffold: 'cone_vs_cylinder_comparison',
    recheckPattern: 'Does this shape come to a point or have two flat ends? Is it a cone or a cylinder?',
    parentNote: 'Show a party hat (cone) and a tin can (cylinder). Ask: "Does it have a point at the top? Then it is a cone. Does it have two flat circles? Then it is a cylinder."',
    relatedSkills: ['P2-GEO-01'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
