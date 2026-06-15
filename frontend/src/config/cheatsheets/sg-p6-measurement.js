export default {
  id: 'sg-p6-mea',
  level: 'Primary 6',
  issue: 6,
  topic: 'Measurement',
  subtitle: "Chelya's Ultimate Cheat Sheet",
  mascot: 'chelya',
  sections: [
    {
      title: 'Volume of Cuboid',
      code: 'Mea 1.1',
      formula: 'Volume = Length × Width × Height',
      formulaNote: null,
      explanation: '3D space — multiply all three dimensions together.',
      example: {
        steps: ['L = 10 cm, W = 5 cm, H = 4 cm', 'V = 10 × 5 × 4'],
        answer: '200 cm³',
      },
      sfx: 'BAM!',
      tip: null,
      diagram: { type: 'placeValue', headers: ['L', 'W', 'H', 'Vol'], digits: [10, 5, 4, 200] },
    },
    {
      title: 'Water and Volume',
      code: 'Mea 2.1',
      formula: 'Volume of water = L × W × water height\n1000 cm³ = 1 litre',
      formulaNote: 'Height of water is NOT the same as height of tank!',
      explanation: 'Filling containers — use the water height, not the tank height!',
      example: {
        steps: ['Tank 20 × 15 × 10 cm, water height 8 cm', '20 × 15 × 8 = 2400 cm³', '2400 ÷ 1000'],
        answer: '2.4 ℓ',
      },
      sfx: 'SPLASH!',
      tip: 'When an object sinks, water level rises — new volume = old volume + object volume!',
      bossLevel: true,
      diagram: { type: 'arrowFlow', steps: ['20 × 15 × 8', '= 2400 cm³', '÷ 1000', '= 2.4 ℓ'] },
    },
  ],
};
