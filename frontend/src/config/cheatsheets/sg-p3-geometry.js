export default {
  id: 'sg-p3-geo',
  level: 'Primary 3',
  issue: 4,
  topic: 'Geometry',
  subtitle: "Lejo's Ultimate Cheat Sheet",
  mascot: 'lejo',
  sections: [
    {
      title: 'Angles',
      code: 'Geo 3.1',
      formula: 'Right angle = 90° (like a corner of a book)',
      formulaNote: 'Every angle is measured against the mighty right angle!',
      explanation: 'An angle is the turn between two lines — compare everything to 90°!',
      example: {
        steps: ['Smaller than 90° → acute', 'Exactly 90° → right angle', 'Bigger than 90° → obtuse'],
        answer: 'Acute < 90° < Obtuse',
      },
      sfx: 'BAM!',
      tip: null,
      diagram: { type: 'arrowFlow', steps: ['Acute\n< 90°', 'Right\n= 90°', 'Obtuse\n> 90°'] },
    },
    {
      title: 'Properties of 2D Shapes',
      code: 'Geo 3.2',
      formula: 'Count sides + corners → check for parallel & equal sides',
      formulaNote: 'Every shape has a unique combo of sides, corners, and angles!',
      explanation: 'Describe shapes by their sides, corners, and whether sides are parallel or equal!',
      example: {
        steps: ['Rectangle: 4 sides, 4 right angles', 'Opposite sides are equal & parallel'],
        answer: 'Rectangle = 4 sides, 4 right angles, opposite sides equal & parallel',
      },
      sfx: 'POW!',
      tip: 'Parallel lines never meet — like train tracks!',
      bossLevel: true,
      diagram: { type: 'arrowFlow', steps: ['Triangle\n3 sides', 'Rectangle\n4 sides\n4 right ∠', 'Square\n4 equal sides\n4 right ∠', 'Circle\n0 sides\n0 corners'] },
    },
  ],
};
