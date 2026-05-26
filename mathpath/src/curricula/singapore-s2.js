// singapore-s2.js — Singapore Secondary 2, lower-secondary mathematics.
//
// Builds on S1: laws of indices & standard form, expansion of products and factorisation of
// quadratics, simultaneous equations, linear graphs, Pythagoras, volume of a cylinder, and an
// introduction to probability. Single-answer fluency components only.

export default {
  id: 'sg-s2',
  country: 'Singapore',
  framework: 'MOE Secondary Mathematics Syllabus (Lower Secondary)',
  label: 'Singapore · Secondary 2',
  source: 'https://www.moe.gov.sg/secondary/courses/express/subjects',
  groups: [
    { id: 'num', name: 'Indices & Standard Form', subtitle: 'Laws of indices; a × 10ⁿ' },
    { id: 'alg', name: 'Algebra', subtitle: 'Products, factorising & simultaneous equations' },
    { id: 'graph', name: 'Linear Graphs', subtitle: 'Gradient of a line' },
    { id: 'geom', name: 'Geometry & Mensuration', subtitle: 'Pythagoras & the cylinder' },
    { id: 'prob', name: 'Probability', subtitle: 'Single events' },
  ],
  skills: [
    // --- Indices & standard form ---
    { id: 'sg-s2-index-eval', group: 'num', code: 'N2.1', name: 'Evaluate powers',
      objective: 'evaluating positive integer powers',
      example: '2⁵ = 32', timeTarget: 12,
      hint: 'A power is repeated multiplication.',
      spec: { kind: 'indexEval' } },

    { id: 'sg-s2-index-law', group: 'num', code: 'N2.1', name: 'Laws of indices',
      objective: 'the laws of indices: aᵐ × aⁿ = aᵐ⁺ⁿ and aᵐ ÷ aⁿ = aᵐ⁻ⁿ',
      example: '2³ × 2⁴ = 2⁷ → 7', timeTarget: 14,
      hint: 'Multiplying powers of the same base adds the indices; dividing subtracts them.',
      spec: { kind: 'indexLaw' } },

    { id: 'sg-s2-stdform', group: 'num', code: 'N2.2', name: 'Standard form',
      objective: 'expressing a number in standard form a × 10ⁿ',
      example: '45 000 = 4.5 × 10⁴ → n = 4', timeTarget: 18,
      hint: 'Count how many places the decimal point moves to leave one non-zero digit in front.',
      spec: { kind: 'standardFormPower' } },

    // --- Algebra ---
    { id: 'sg-s2-expand-prod', group: 'alg', code: 'A4.1', name: 'Expand two brackets',
      objective: 'expansion of the product of two linear expressions',
      example: '(x + 2)(x + 3): constant term → 6', timeTarget: 20,
      hint: 'Multiply each term in the first bracket by each term in the second.',
      spec: { kind: 'expandProduct' } },

    { id: 'sg-s2-factor-quad', group: 'alg', code: 'A4.2', name: 'Factorise a quadratic',
      objective: 'factorisation of quadratic expressions x² + bx + c',
      example: 'x² + 7x + 12 = (x + 3)(x + 4)', timeTarget: 24,
      hint: 'Find two numbers that multiply to the constant and add to the middle coefficient.',
      spec: { kind: 'factorQuad' } },

    { id: 'sg-s2-sim-eqn', group: 'alg', code: 'A4.3', name: 'Simultaneous linear equations',
      objective: 'solving simultaneous linear equations in two variables',
      example: 'x + y = 5, 2x + y = 7 → x = 2', timeTarget: 30,
      hint: 'Eliminate one variable by adding or subtracting the equations.',
      spec: { kind: 'simEqn' } },

    // --- Linear graphs ---
    { id: 'sg-s2-gradient', group: 'graph', code: 'A5.1', name: 'Gradient of a line',
      objective: 'gradient of a line through two points',
      example: '(0, 0) & (2, 6) → 3', timeTarget: 20,
      hint: 'Gradient = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).',
      spec: { kind: 'gradient' } },

    // --- Geometry & mensuration ---
    { id: 'sg-s2-pythagoras', group: 'geom', code: 'G2.1', name: "Pythagoras' theorem",
      objective: 'using Pythagoras’ theorem to find a side of a right-angled triangle',
      example: 'legs 3 and 4 → hypotenuse 5', timeTarget: 22,
      hint: 'The square of the hypotenuse equals the sum of the squares of the other two sides.',
      spec: { kind: 'pythagoras' } },

    { id: 'sg-s2-cylinder', group: 'geom', code: 'G2.2', name: 'Volume of a cylinder',
      objective: 'volume of a cylinder (take π = 3.14)',
      example: 'r = 3, h = 5 → 141.3 cm³', timeTarget: 22,
      hint: 'Volume of a cylinder = π × r × r × height.',
      spec: { kind: 'cylinderVolume' } },

    // --- Probability ---
    { id: 'sg-s2-prob', group: 'prob', code: 'S2.1', name: 'Probability of a single event',
      objective: 'probability of a single event as a fraction',
      example: '3 red of 8 balls → P(red) = 3/8', timeTarget: 18,
      hint: 'Probability = favourable outcomes ÷ total outcomes, simplified.',
      spec: { kind: 'probability' } },
  ],

  pending: [
    'Algebra: algebraic fractions, changing the subject of a formula (need expression answers)',
    'Geometry: congruence & similarity, properties of polygons (need figure items)',
    'Graphs: equation of a line / drawing graphs (need graph items)',
    'Statistics: comparing data sets, scatter diagrams (need chart items)',
  ],
};
