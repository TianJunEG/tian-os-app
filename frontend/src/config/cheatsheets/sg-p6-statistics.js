export default {
  id: 'sg-p6-stat',
  level: 'Primary 6',
  issue: 7,
  topic: 'Statistics',
  subtitle: "Chelya's Ultimate Cheat Sheet",
  mascot: 'chelya',
  sections: [
    {
      title: 'Average (Mean)',
      code: 'Stat 1.1',
      formula: 'Average = Total ÷ Number of items',
      formulaNote: null,
      explanation: 'The "fair share" — add everything up, then divide equally.',
      example: {
        steps: ['Scores: 70, 85, 90, 75, 80', 'Total = 400', '400 ÷ 5'],
        answer: '80',
      },
      sfx: 'BAM!',
      tip: null,
      diagram: { type: 'stackedBar', total: 400, segments: [{ value: 70, label: '70' }, { value: 85, label: '85' }, { value: 90, label: '90' }, { value: 75, label: '75' }, { value: 80, label: '80' }] },
    },
    {
      title: 'Pie Charts',
      code: 'Stat 2.1',
      formula: 'Each sector = fraction of total → fraction × total = amount',
      formulaNote: null,
      explanation: 'Reading and solving — each slice is a fraction of the whole.',
      example: {
        steps: ['¼ of 200 students like Math', '¼ × 200'],
        answer: '50 students',
      },
      sfx: 'POW!',
      tip: 'All fractions must add up to 1 — use this to find a missing sector!',
      bossLevel: true,
      diagram: { type: 'pieChart', slices: [{ num: 1, den: 4 }, { num: 1, den: 2 }, { num: 1, den: 4 }], labels: ['Math ¼', 'Science ½', 'English ¼'], colors: ['#ef4444', '#3b82f6', '#eab308'] },
    },
  ],
};
