export default {
  id: 'sg-p4-wp',
  level: 'Primary 4',
  issue: 6,
  topic: 'Word Problems',
  subtitle: "Kylo's Ultimate Cheat Sheet",
  mascot: 'kylo',
  sections: [
    {
      title: 'Fraction of a Quantity',
      code: 'WP fraction',
      formula: 'Draw a BAR MODEL → split into equal parts → take the ones you need',
      formulaNote: 'Model method — the Singapore way!',
      explanation: 'Split the whole into equal parts (the denominator), then take as many as the numerator!',
      example: {
        steps: [
          'Tom has 24 marbles. ⅜ are blue. How many are blue?',
          '24 ÷ 8 = 3 (one part)',
        ],
        answer: '3 × 3 = 9 blue marbles',
      },
      sfx: 'BAM!',
      tip: 'Always draw the bar model first — it shows you what to divide and multiply!',
      barModel: { parts: 8, shaded: 3, value: 3 },
    },
    {
      title: 'Two-Step Word Problem',
      code: 'WP 2-step',
      formula: 'Read → Draw bar model → Write 2 equations → Solve',
      formulaNote: 'Use the model method to find what\'s left!',
      explanation: 'Draw a bar for the total, cut off each amount spent or used, what\'s left is the answer!',
      example: {
        steps: [
          'Ali has $1 850. He spends $640 on rent and $475 on food.',
          'Step 1: $1 850 − $640 = $1 210',
          'Step 2: $1 210 − $475 = ?',
        ],
        answer: '$735 left',
      },
      sfx: 'KA-POW!',
      tip: 'Underline the question, circle the numbers, then draw your model — never skip the diagram!',
      bossLevel: true,
    },
  ],
};
