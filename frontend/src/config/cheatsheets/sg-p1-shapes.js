export default {
  id: 'sg-p1-sh',
  level: 'Primary 1',
  issue: 3,
  topic: 'Shapes',
  subtitle: "Tiano's Ultimate Cheat Sheet",
  mascot: 'tiano',
  sections: [
    {
      title: '2D Shapes',
      code: 'Sh 1.1',
      formula: 'Count the sides and corners → name the shape!',
      formulaNote: 'Sides and corners tell you which shape it is!',
      explanation: 'Flat shapes are all around us — count sides to name them!',
      example: {
        steps: ['3 sides → triangle', '4 equal sides → square', '4 sides → rectangle'],
        answer: 'Count the sides to find the name!',
      },
      sfx: 'BAM!',
      tip: 'A square is a special rectangle — all 4 sides are equal!',
      diagram: { type: 'arrowFlow', steps: ['Circle\n0 sides', 'Triangle\n3 sides', 'Square\n4 sides', 'Rectangle\n4 sides'] },
    },
    {
      title: 'Patterns with Shapes',
      code: 'Sh 1.2',
      formula: 'Find the group that repeats → predict what comes next!',
      formulaNote: 'Patterns repeat over and over!',
      explanation: 'Spot the repeating pattern and figure out what comes next!',
      example: {
        steps: ['🔴🔵🔴🔵🔴 → what comes next?'],
        answer: '🔵',
      },
      sfx: 'KA-POW!',
      tip: 'Circle the repeating group — then you can see the pattern!',
      bossLevel: true,
      diagram: { type: 'arrowFlow', steps: ['🔴', '🔵', '🟢', '🔴', '🔵', '?'] },
    },
  ],
};
