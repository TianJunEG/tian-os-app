export default {
  id: 'sg-p3-data',
  level: 'Primary 3',
  issue: 5,
  topic: 'Data & Graphs',
  subtitle: "Lejo's Ultimate Cheat Sheet",
  mascot: 'lejo',
  sections: [
    {
      title: 'Reading Bar Graphs',
      code: 'Data 3.1',
      formula: 'Read the top of each bar against the scale → compare',
      formulaNote: 'The scale is your ruler — always check what each unit means!',
      explanation: 'Bars show how much — read them against the scale, then compare and calculate!',
      example: {
        steps: ['Red bar = 15, Blue bar = 10', '15 − 10 = 5'],
        answer: 'Red has 5 more than Blue',
      },
      sfx: 'BAM!',
      tip: 'Always check what each square on the scale stands for — it might not be 1!',
      diagram: { type: 'stackedBar', total: 40, segments: [{ value: 15, label: 'Red' }, { value: 10, label: 'Blue' }, { value: 15, label: 'Green' }] },
    },
    {
      title: 'Reading Scales',
      code: 'Data 3.2',
      formula: 'Count the small marks between two big numbers → that tells you what each mark is worth',
      formulaNote: 'Divide the gap by the number of marks to find each mark\'s value!',
      explanation: 'Rulers, measuring jugs, weighing scales — figure out what each little mark means first!',
      example: {
        steps: ['Between 100 ml and 200 ml there are 5 marks', '200 − 100 = 100, divide by 5 → each mark = 20 ml', 'Arrow at 3rd mark → 100 + (3 × 20)'],
        answer: '160 ml',
      },
      sfx: 'KA-POW!',
      tip: '200 − 100 = 100, divide by 5 marks → each mark = 20!',
      bossLevel: true,
      diagram: { type: 'numberLine', start: 100, end: 200, points: [160], labels: ['160 ml'] },
    },
  ],
};
