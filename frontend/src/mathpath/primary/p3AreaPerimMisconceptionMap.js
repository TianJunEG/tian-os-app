const misconceptions = [
  {
    tag: 'confuses_area_perimeter',
    label: 'Mixes up area and perimeter formulas',
    description: 'Uses the perimeter formula (add sides) when asked for area, or vice versa. E.g. area of 8 cm × 5 cm rectangle = 26 instead of 40.',
    remediationExplanation: 'Area is the space INSIDE the shape — you multiply length × width. Perimeter is the distance AROUND the shape — you add all four sides.',
    visualScaffold: 'area_vs_perimeter_diagram',
    recheckPattern: 'Find the area AND perimeter of a rectangle and compare.',
    parentNote: 'Area = "how much paint to cover the floor" (multiply). Perimeter = "how much fence around the garden" (add). Use real objects to demonstrate.',
    relatedSkills: ['P3-AP-01', 'P3-AP-02'],
  },
  {
    tag: 'forgets_square_units',
    label: 'Writes area in cm instead of cm²',
    description: 'Gives the area as 40 cm instead of 40 cm². Forgets that area is measured in square units.',
    remediationExplanation: 'Area measures a flat surface, so it uses square units: cm², m², km². Think of it as "how many 1 cm × 1 cm squares fit inside?".',
    visualScaffold: 'grid_squares_inside_rectangle',
    recheckPattern: 'Find the area and write the correct unit.',
    parentNote: 'Draw a small rectangle on grid paper and count the squares inside. That is why the unit is cm² ("square centimetres").',
    relatedSkills: ['P3-AP-01'],
  },
  {
    tag: 'adds_instead_of_multiplies',
    label: 'Adds length and width instead of multiplying for area',
    description: 'Calculates area of 8 cm × 5 cm as 8 + 5 = 13 instead of 8 × 5 = 40.',
    remediationExplanation: 'Area = length × width, not length + width. You multiply because each row of unit squares is repeated "width" times.',
    visualScaffold: 'array_multiplication_visual',
    recheckPattern: 'Find the area of a rectangle by multiplying.',
    parentNote: 'Draw rows of unit squares to show that multiplying counts all the squares. "5 rows of 8 squares = 5 × 8 = 40 squares."',
    relatedSkills: ['P3-AP-01'],
  },
  {
    tag: 'forgets_two_pairs',
    label: 'Forgets that a rectangle has two pairs of equal sides',
    description: 'Calculates perimeter as length + width (8 + 5 = 13) instead of 2 × (length + width) = 26.',
    remediationExplanation: 'A rectangle has 4 sides: 2 lengths and 2 widths. Perimeter = length + width + length + width = 2 × (length + width).',
    visualScaffold: 'rectangle_four_sides_labelled',
    recheckPattern: 'Find the perimeter by adding all 4 sides.',
    parentNote: 'Label all four sides of a rectangle. Point out: "There are two long sides and two short sides."',
    relatedSkills: ['P3-AP-02'],
  },
  {
    tag: 'only_adds_two_sides',
    label: 'Only adds two adjacent sides for perimeter',
    description: 'Gives 8 + 5 = 13 cm as the perimeter of an 8 cm × 5 cm rectangle, forgetting the other two sides.',
    remediationExplanation: 'Perimeter goes all the way around. You must add all four sides: 8 + 5 + 8 + 5 = 26 cm. A shortcut: 2 × (8 + 5) = 26 cm.',
    visualScaffold: 'walk_around_rectangle',
    recheckPattern: 'Trace your finger around the rectangle and add every side.',
    parentNote: 'Have your child trace a rectangle with their finger and say each side length out loud. "8 plus 5 plus 8 plus 5."',
    relatedSkills: ['P3-AP-02'],
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
