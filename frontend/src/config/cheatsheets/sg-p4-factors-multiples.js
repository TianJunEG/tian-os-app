export default {
  id: 'sg-p4-fm',
  level: 'Primary 4',
  issue: 3,
  topic: 'Factors & Multiples',
  subtitle: "Kylo's Ultimate Cheat Sheet",
  mascot: 'kylo',
  sections: [
    {
      title: 'Common Factors',
      code: 'FM 2.3',
      formula: 'List factors of BOTH numbers → pick the LARGEST they share',
      formulaNote: 'That\'s the Greatest Common Factor (GCF)!',
      explanation: 'List every factor of each number, then find the biggest one they share!',
      example: {
        steps: [
          'GCF of 24 and 36',
          '24: 1, 2, 3, 4, 6, 8, 12, 24',
          '36: 1, 2, 3, 4, 6, 9, 12, 18, 36',
          'Common: 1, 2, 3, 4, 6, 12',
        ],
        answer: 'GCF = 12',
      },
      sfx: 'BAM!',
      tip: 'Start from the bigger factors — you\'ll find the GCF faster!',
      diagram: { type: 'venn', left: [8, 24], right: [9, 18, 36], shared: [1, 2, 3, 4, 6, 12], leftLabel: '24', rightLabel: '36' },
    },
    {
      title: 'Common Multiples',
      code: 'FM 2.5',
      formula: 'List multiples of BOTH numbers → pick the SMALLEST they share',
      formulaNote: 'That\'s the Lowest Common Multiple (LCM)!',
      explanation: 'Count up in each number until you hit a value that appears in both lists!',
      example: {
        steps: [
          'LCM of 4 and 6',
          '4: 4, 8, 12, 16, 20…',
          '6: 6, 12, 18, 24…',
        ],
        answer: 'LCM = 12',
      },
      sfx: 'POW!',
      tip: 'If one number divides the other evenly, the bigger one IS the LCM!',
      bossLevel: true,
      diagram: { type: 'numberLine', points: [4, 8, 12, 16, 20], points2: [6, 12, 18, 24], match: 12, label1: '×4', label2: '×6' },
    },
  ],
};
