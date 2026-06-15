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
      diagram: { type: 'lineGraph', points: [{x:'Mon',y:28},{x:'Tue',y:30},{x:'Wed',y:27},{x:'Thu',y:31},{x:'Fri',y:29}], yLabel: '°C' },
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
          'Apple = {{1/4}}, Orange = {{1/2}}, Mango = {{1/4}}',
          'How many chose Orange?',
        ],
        answer: '{{1/2}} of 40 = 20 students',
      },
      sfx: 'POW!',
      tip: 'All the fractions in a pie chart must add up to 1 whole — use this to check your work!',
      bossLevel: true,
      diagram: { type: 'pieChart', slices: [{ num: 1, den: 4 }, { num: 2, den: 4 }, { num: 1, den: 4 }], labels: ['Apple ¼', 'Orange ½', 'Mango ¼'], colors: ['#ef4444','#f97316','#eab308'] },
    },
  ],
};
