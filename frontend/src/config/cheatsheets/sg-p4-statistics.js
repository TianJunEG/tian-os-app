export default {
  id: 'sg-p4-stat',
  level: 'Primary 4',
  issue: 7,
  topic: 'Statistics',
  subtitle: "Kylo's Ultimate Cheat Sheet",
  mascot: 'kylo',
  sections: [
    {
      title: 'Reading a Line Graph',
      code: 'Stat 1.2a',
      formula: 'Read each POINT against the value axis',
      formulaNote: 'Then compare or find the change!',
      explanation: 'Find each point on the graph, read across to the value axis — then compare or total!',
      example: {
        steps: [
          'A line graph shows temperature over 5 days',
          'Mon = 28°C, Tue = 30°C, Wed = 27°C',
          'Change from Mon to Tue?',
        ],
        answer: '30 − 28 = 2°C rise',
      },
      sfx: 'BAM!',
      tip: 'Going up = increase, going down = decrease — check if the line rises or falls!',
    },
    {
      title: 'Reading a Pie Chart',
      code: 'Stat 1.2b',
      formula: 'Match each SECTOR to the legend → read its value',
      formulaNote: 'All sectors add up to the total!',
      explanation: 'Each slice of the pie is a category — match it to the legend and read the value!',
      example: {
        steps: [
          'A pie chart shows favourite fruits of 40 students',
          'Apple = ¼, Orange = ½, Mango = ¼',
          'How many chose Orange?',
        ],
        answer: '½ of 40 = 20 students',
      },
      sfx: 'POW!',
      tip: 'All the fractions in a pie chart must add up to 1 whole — use this to check your work!',
      bossLevel: true,
    },
  ],
};
