const misconceptions = [
  {
    tag: 'confuses_area_perimeter',
    label: 'Confuses area with perimeter',
    description: 'Adds side lengths instead of multiplying to find area, or multiplies when perimeter is needed. Commonly surfaces with composite figures where multiple sides are given.',
    remediationExplanation: 'Area measures the space inside a figure and is found by multiplying (result in cm²). Perimeter measures the distance around the outside and is found by adding side lengths (result in cm). Check your units: if the answer should be in cm², you need to multiply.',
    visualScaffold: 'area_vs_perimeter_highlight',
    recheckPattern: 'A rectangle is 8 cm by 5 cm. What is its area? What is its perimeter?',
    parentNote: 'Ask your child to shade the inside of a shape for area and trace the outside for perimeter. The physical action helps them remember the difference.',
    relatedSkills: ['P6-AV-01'],
  },
  {
    tag: 'forgets_subtract_cutout',
    label: 'Forgets to subtract the cut-out region',
    description: 'Calculates the area of the full outer rectangle but does not subtract the missing portion for L-shapes or similar composite figures.',
    remediationExplanation: 'For an L-shaped or notched figure, first find the area of the full outer rectangle, then subtract the area of the rectangle that has been removed. Area of L-shape = outer area − cut-out area.',
    visualScaffold: 'composite_decomposition',
    recheckPattern: 'An L-shaped figure has outer dimensions 10 cm by 8 cm. A 4 cm by 3 cm rectangle is cut from one corner. Find the area.',
    parentNote: 'Help your child draw the "ghost rectangle" that completes the shape. They should see that the composite area equals the full rectangle minus the piece that is missing.',
    relatedSkills: ['P6-AV-01'],
  },
  {
    tag: 'uses_wrong_dimensions_for_composite',
    label: 'Uses wrong dimensions when splitting a composite figure',
    description: 'When decomposing a composite figure into simpler rectangles, assigns incorrect lengths or widths to the sub-rectangles. For example, uses the outer length for an inner rectangle.',
    remediationExplanation: 'Label every segment on the figure before calculating. When you split a composite shape into parts, the inner dimensions must be worked out from the overall dimensions. Draw dotted lines to show the split, then find each sub-rectangle\'s length and width carefully.',
    visualScaffold: 'dimension_labelling',
    recheckPattern: 'A T-shaped figure: the top bar is 12 cm by 3 cm, the vertical stem is 4 cm by 6 cm. Find the total area.',
    parentNote: 'Encourage your child to redraw the shape and label every side before computing. Cutting the shape out of paper and physically separating the pieces can make the dimensions clearer.',
    relatedSkills: ['P6-AV-01'],
  },
  {
    tag: 'volume_uses_area_formula',
    label: 'Uses area formula instead of volume formula',
    description: 'Multiplies only two dimensions (length × width) instead of three (length × width × height) when finding volume, effectively computing area instead of volume.',
    remediationExplanation: 'Volume measures 3D space and needs three dimensions: Volume = length × width × height. If you only multiply two dimensions, you get the area of one face, not the volume. Always check that you have used all three dimensions and that your answer is in cm³.',
    visualScaffold: 'cuboid_3d_diagram',
    recheckPattern: 'A cuboid is 6 cm long, 4 cm wide, and 5 cm tall. What is its volume?',
    parentNote: 'Remind your child: area is flat (2 numbers multiplied, answer in cm²), volume fills space (3 numbers multiplied, answer in cm³). Counting unit cubes in a diagram helps build intuition.',
    relatedSkills: ['P6-AV-02', 'P6-AV-03'],
  },
  {
    tag: 'wrong_dimension_for_missing_side',
    label: 'Divides by the wrong pair of dimensions when finding a missing side',
    description: 'When given volume and two dimensions, divides the volume by the wrong pair. For example, divides V by (length × height) instead of (length × width) to find the width.',
    remediationExplanation: 'Volume = length × width × height. To find a missing dimension, divide the volume by the product of the other two. Write out V = L × W × H first, then rearrange. For example, if height is missing: H = V ÷ (L × W).',
    visualScaffold: 'missing_dimension_diagram',
    recheckPattern: 'A cuboid has a volume of 120 cm³. Its length is 6 cm and its width is 4 cm. Find its height.',
    parentNote: 'Have your child write V = L × W × H and circle the unknown. Then they can see which two known values to multiply together for the division.',
    relatedSkills: ['P6-AV-02'],
  },
  {
    tag: 'water_rise_uses_total_volume',
    label: 'Uses total tank volume instead of base area for water rise',
    description: 'When finding the rise in water level, divides the object volume by the total tank volume instead of by the base area (length × width) of the tank.',
    remediationExplanation: 'When an object is placed in a rectangular tank, the water rises. The rise in water level = volume of object ÷ base area of tank. The base area is length × width of the tank (not the full tank volume). Think of it as spreading the object\'s volume evenly across the base.',
    visualScaffold: 'water_displacement_diagram',
    recheckPattern: 'A rectangular tank is 20 cm by 15 cm by 30 cm. A cube of edge 6 cm is placed in the tank. Find the rise in water level.',
    parentNote: 'Try this at home: place an object in a rectangular container of water and measure how the level changes. The rise depends on the base area of the container, not its total volume.',
    relatedSkills: ['P6-AV-03'],
  },
  {
    tag: 'forgets_object_displaces_water',
    label: 'Forgets that the submerged object displaces water',
    description: 'Ignores the volume of the submerged object and calculates only based on the original water volume, or does not account for displacement when computing new water level.',
    remediationExplanation: 'When a solid object is fully submerged in water, the water level rises because the object takes up space. The volume of water displaced equals the volume of the submerged object. New water level = original water level + rise due to object.',
    visualScaffold: 'before_after_water_level',
    recheckPattern: 'A tank contains water to a depth of 10 cm. A metal block of volume 300 cm³ is placed in the tank (base 20 cm by 15 cm). What is the new water depth?',
    parentNote: 'Remind your child of the Archimedes principle at a simple level: the object pushes water out of the way. The amount of water pushed up equals the space the object takes.',
    relatedSkills: ['P6-AV-03'],
  },
  {
    tag: 'adds_volumes_incorrectly',
    label: 'Adds dimensions instead of computing each volume separately',
    description: 'When finding the volume of a composite solid (two cuboids joined), adds all dimensions together and multiplies once instead of computing each cuboid\'s volume separately and adding the results.',
    remediationExplanation: 'For a composite solid made of two cuboids, find the volume of each cuboid separately, then add the two volumes. Do not add the lengths together before multiplying. Volume of composite solid = Volume of Part A + Volume of Part B.',
    visualScaffold: 'composite_solid_split',
    recheckPattern: 'A solid is formed by joining two cuboids. Cuboid A is 5 cm × 4 cm × 3 cm. Cuboid B is 6 cm × 4 cm × 2 cm. Find the total volume.',
    parentNote: 'Have your child draw a line separating the two cuboids, then compute each volume on its own before adding. This prevents mixing up the dimensions.',
    relatedSkills: ['P6-AV-02'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
