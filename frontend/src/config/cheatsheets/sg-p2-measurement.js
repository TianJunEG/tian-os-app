export default {
  id: 'sg-p2-mea',
  level: 'Primary 2',
  issue: 4,
  topic: 'Length & Mass',
  subtitle: "Lysa's Ultimate Cheat Sheet",
  mascot: 'lysa',
  sections: [
    {
      title: 'Measuring Length',
      code: 'Mea 2.1',
      formula: '100 cm = 1 m',
      formulaNote: 'Use cm for small things and m for big things!',
      explanation: 'Use cm and m to measure how long something is!',
      example: {
        steps: ['A pencil is about 15 cm', 'A door is about 2 m'],
        answer: '100 cm = 1 m',
      },
      sfx: 'BAM!',
      tip: null,
      diagram: { type: 'arrowFlow', steps: ['cm', '× 100 →', 'm'] },
    },
    {
      title: 'Measuring Mass',
      code: 'Mea 2.2',
      formula: '1000 g = 1 kg',
      formulaNote: 'Grams for light things, kilograms for heavy things!',
      explanation: 'Use g and kg to measure how heavy something is!',
      example: {
        steps: ['An apple is about 200 g', 'A bag of rice is about 5 kg'],
        answer: '1000 g = 1 kg',
      },
      sfx: 'POW!',
      tip: 'Grams for light things, kilograms for heavy things!',
      bossLevel: true,
      diagram: { type: 'arrowFlow', steps: ['g', '× 1000 →', 'kg'] },
    },
  ],
};
