// singapore-s4.js — Singapore Secondary 4, upper-secondary mathematics (O-/G3-Level).
//
// Consolidation and exam-level fluency across the upper-secondary strands: algebra, trigonometry,
// mensuration, standard form / indices, and statistics & probability. Single-answer fluency
// components only. Topics needing richer item types (sine/cosine rule, vectors, sets, calculus
// of motion) are listed in `pending`.

export default {
  id: 'sg-s4',
  country: 'Singapore',
  framework: 'MOE O-/G3-Level Mathematics Syllabus (Upper Secondary)',
  label: 'Singapore · Secondary 4',
  source: 'https://www.seab.gov.sg/home/examinations/gce-o-level',
  groups: [
    { id: 'alg', name: 'Algebra', subtitle: 'Quadratics & simultaneous equations' },
    { id: 'num', name: 'Indices & Standard Form', subtitle: 'Laws of indices; a × 10ⁿ' },
    { id: 'trig', name: 'Trigonometry', subtitle: 'Sides & angles' },
    { id: 'mens', name: 'Mensuration', subtitle: 'Cylinder & sector' },
    { id: 'stat', name: 'Statistics & Probability', subtitle: 'Averages & single events' },
  ],
  skills: [
    // --- Algebra ---
    { id: 'sg-s4-solve-quad', group: 'alg', code: 'A8.1', name: 'Solve quadratic equations',
      objective: 'solving quadratic equations by factorisation',
      example: 'x² − 9x + 20 = 0 → larger root 5', timeTarget: 28,
      hint: 'Factorise, then set each bracket equal to zero.',
      spec: { kind: 'quadRoot' } },

    { id: 'sg-s4-sim-eqn', group: 'alg', code: 'A8.2', name: 'Simultaneous equations',
      objective: 'solving simultaneous linear equations in two variables',
      example: '2x + y = 8, x + y = 5 → x = 3', timeTarget: 30,
      hint: 'Eliminate one variable by adding or subtracting.',
      spec: { kind: 'simEqn' } },

    { id: 'sg-s4-factor-quad', group: 'alg', code: 'A8.1', name: 'Factorise quadratics',
      objective: 'factorisation of quadratic expressions',
      example: 'x² + 9x + 20 = (x + 4)(x + 5)', timeTarget: 24,
      hint: 'Two numbers multiplying to the constant and adding to the middle term.',
      spec: { kind: 'factorQuad' } },

    // --- Indices & standard form ---
    { id: 'sg-s4-stdform', group: 'num', code: 'N4.1', name: 'Standard form',
      objective: 'expressing a number in standard form a × 10ⁿ',
      example: '6 800 000 = 6.8 × 10⁶ → n = 6', timeTarget: 18,
      hint: 'Move the decimal so one non-zero digit is in front; count the moves.',
      spec: { kind: 'standardFormPower' } },

    { id: 'sg-s4-index-law', group: 'num', code: 'N4.1', name: 'Laws of indices',
      objective: 'applying the laws of indices',
      example: '3⁵ × 3² = 3⁷ → 7', timeTarget: 14,
      hint: 'Same base: multiplying adds indices, dividing subtracts.',
      spec: { kind: 'indexLaw' } },

    // --- Trigonometry ---
    { id: 'sg-s4-trig-side', group: 'trig', code: 'G4.1', name: 'Find a side with trigonometry',
      objective: 'applying trigonometric ratios to find an unknown side',
      example: 'hyp 16, angle 30° → opposite 8', timeTarget: 24,
      hint: 'opposite = hypotenuse × sin(angle).',
      spec: { kind: 'trigSide' } },

    { id: 'sg-s4-trig-angle', group: 'trig', code: 'G4.1', name: 'Find an angle',
      objective: 'finding an acute angle from a trigonometric ratio',
      example: 'tan θ = 1 → θ = 45°', timeTarget: 24,
      hint: 'Recall the exact ratios for 30°, 45° and 60°.',
      spec: { kind: 'trigAngle' } },

    { id: 'sg-s4-pythagoras', group: 'trig', code: 'G4.1', name: "Pythagoras' theorem",
      objective: 'using Pythagoras’ theorem in right-angled triangles',
      example: 'legs 8 and 15 → hypotenuse 17', timeTarget: 22,
      hint: 'hypotenuse² = a² + b².',
      spec: { kind: 'pythagoras' } },

    // --- Mensuration ---
    { id: 'sg-s4-cylinder', group: 'mens', code: 'G4.2', name: 'Volume of a cylinder',
      objective: 'volume of a cylinder (take π = 3.14)',
      example: 'r = 5, h = 7 → 549.5 cm³', timeTarget: 22,
      hint: 'Volume = π × r² × height.',
      spec: { kind: 'cylinderVolume' } },

    { id: 'sg-s4-sector', group: 'mens', code: 'G4.2', name: 'Area of a sector',
      objective: 'area of a sector of a circle (take π = 3.14)',
      example: 'r = 9, 120° → 84.78 cm²', timeTarget: 24,
      hint: 'Sector area = (angle ÷ 360) × π × r².',
      spec: { kind: 'sectorArea' } },

    // --- Statistics & probability ---
    { id: 'sg-s4-prob', group: 'stat', code: 'S4.1', name: 'Probability of a single event',
      objective: 'probability of a single event as a fraction',
      example: '5 of 12 → P = 5/12', timeTarget: 18,
      hint: 'Probability = favourable ÷ total, simplified.',
      spec: { kind: 'probability' } },

    { id: 'sg-s4-mean', group: 'stat', code: 'S4.2', name: 'Mean of a data set',
      objective: 'mean as total ÷ number of data',
      example: 'Mean of 10, 14, 12 → 12', timeTarget: 18,
      hint: 'Mean = total ÷ how many values.',
      spec: { kind: 'average' } },

    { id: 'sg-s4-median', group: 'stat', code: 'S4.2', name: 'Median of a data set',
      objective: 'median as the middle value of ordered data',
      example: 'Median of 9, 3, 7, 1, 5 → 5', timeTarget: 18,
      hint: 'Order the values, then take the middle one.',
      spec: { kind: 'median' } },
  ],

  pending: [
    'Trigonometry: sine & cosine rule, area = ½ab·sinC, bearings (need richer items)',
    'Vectors in two dimensions; sets & Venn diagrams (need vector/set items)',
    'Mensuration: cones, pyramids, spheres; arc length (single-answer items pending)',
    'Statistics: cumulative frequency, quartiles, standard deviation (need data/chart items)',
    'Kinematics & rates of change (distance–time / speed–time graphs)',
  ],
};
