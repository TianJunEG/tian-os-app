const misconceptions = [
  {
    tag: 'shape_orientation_dependence',
    label: 'Relies on orientation to identify shapes',
    description: 'Cannot recognise a shape when it is rotated or flipped from its typical orientation.',
    remediationExplanation: 'A shape stays the same even when turned. Count the sides and corners to check.',
    visualScaffold: 'rotated_shape_comparison',
    recheckPattern: 'Same shape shown in a different orientation.',
    parentNote: 'Show the child the same shape in different orientations and ask them to count sides each time.',
    relatedSkills: ['P1-GEO-01', 'P1-GEO-03'],
  },
  {
    tag: 'confuses_2d_3d',
    label: 'Confuses 2D shapes and 3D objects',
    description: 'Called a 3D object by a 2D shape name (e.g. called a cube a "square") or vice versa.',
    remediationExplanation: 'A 2D shape is flat like a drawing. A 3D object is solid and you can hold it. A cube has square faces but it is not a square.',
    visualScaffold: 'side_by_side_2d_3d',
    recheckPattern: 'New pair of 2D shape and its related 3D object.',
    parentNote: 'Let the child hold real objects (box, ball, can) and trace their flat faces on paper to see the difference.',
    relatedSkills: ['P1-GEO-01', 'P1-GEO-02', 'P1-GEO-07'],
  },
  {
    tag: 'sorts_by_appearance_not_property',
    label: 'Sorts shapes by colour or size instead of geometric property',
    description: 'Grouped shapes by visual appearance (colour, size) rather than by number of sides, corners, or edge type.',
    remediationExplanation: 'Look at the sides and corners, not the colour or size. Count the sides to sort shapes.',
    visualScaffold: 'property_sorting_guide',
    recheckPattern: 'New sorting task with shapes of different colours and sizes.',
    parentNote: 'Use shapes that are the same colour so the child must focus on geometric properties.',
    relatedSkills: ['P1-GEO-03'],
  },
  {
    tag: 'pattern_looks_only_at_last',
    label: 'Looks only at the last shape in a pattern',
    description: 'Chose the next shape based only on the last shape seen, ignoring the repeating unit.',
    remediationExplanation: 'Look at the whole pattern from the start. Find the part that repeats, then continue it.',
    visualScaffold: 'pattern_unit_highlight',
    recheckPattern: 'New repeating pattern with a different unit.',
    parentNote: 'Help the child draw a box around each repeating group to see the pattern unit clearly.',
    relatedSkills: ['P1-GEO-04', 'P1-GEO-05'],
  },
  {
    tag: 'pattern_random_sequence',
    label: 'Creates a random sequence instead of a repeating pattern',
    description: 'Placed shapes in a random order rather than following a consistent repeating rule.',
    remediationExplanation: 'A pattern repeats the same group of shapes over and over. Decide on your group first, then repeat it.',
    visualScaffold: 'pattern_unit_highlight',
    recheckPattern: 'New pattern creation task.',
    parentNote: 'Start with simple AB patterns (e.g. circle, square, circle, square) before moving to ABB or ABC.',
    relatedSkills: ['P1-GEO-05'],
  },
  {
    tag: 'confuses_left_right',
    label: 'Confuses left and right',
    description: 'Mixed up left and right when describing position.',
    remediationExplanation: 'Hold up your hands. Your left hand makes an "L" shape with thumb and finger. That side is left.',
    visualScaffold: 'left_right_hand_guide',
    recheckPattern: 'New position question involving left and right.',
    parentNote: 'Practice daily: "Which hand do you write with?" Label left and right on the desk if needed.',
    relatedSkills: ['P1-GEO-06'],
  },
  {
    tag: 'confuses_between_beside',
    label: 'Confuses between and beside',
    description: 'Used "between" when meaning "beside" or vice versa.',
    remediationExplanation: '"Between" means in the middle of two things. "Beside" means next to one thing.',
    visualScaffold: 'position_word_diagram',
    recheckPattern: 'New position question using between and beside.',
    parentNote: 'Use toys or objects at home. Place one between two others and one beside a single object to show the difference.',
    relatedSkills: ['P1-GEO-06'],
  },
  {
    tag: 'matches_by_colour_or_use',
    label: 'Matches real object to shape by colour or use instead of shape',
    description: 'Chose a shape based on the object\'s colour or function rather than its geometric form.',
    remediationExplanation: 'Think about the outline of the object. A clock face is round like a circle, not because of its colour.',
    visualScaffold: 'object_outline_trace',
    recheckPattern: 'New real-world object matching question.',
    parentNote: 'Trace around real objects and compare the outline to shape cards. Focus on the outline, not colour.',
    relatedSkills: ['P1-GEO-07'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return misconceptionByTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

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
