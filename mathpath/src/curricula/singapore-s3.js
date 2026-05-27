// singapore-s3.js — Singapore Secondary 3, upper-secondary mathematics (O-/G3-Level).
//
// Quadratic equations, trigonometry (right-angled triangles), indices & surds, mensuration of
// the cylinder and sector, and coordinate geometry. Single-answer fluency components only;
// proof, graph-sketching and word-problem strategy are out of scope (MathThink).

export default {
  id: 'sg-s3',
  country: 'Singapore',
  framework: 'MOE O-/G3-Level Mathematics Syllabus (Upper Secondary)',
  label: 'Singapore · Secondary 3',
  source: 'https://www.seab.gov.sg/home/examinations/gce-o-level',
  groups: [
    { id: 'alg', name: 'Quadratics', subtitle: 'Factorising & solving' },
    { id: 'trig', name: 'Trigonometry', subtitle: 'Right-angled triangles' },
    { id: 'idx', name: 'Indices & Surds', subtitle: 'Laws of indices; roots' },
    { id: 'mens', name: 'Mensuration', subtitle: 'Cylinder & sector' },
    { id: 'coord', name: 'Coordinate Geometry', subtitle: 'Gradient of a line' },
  ],
  skills: [
    // --- Quadratics ---
    { id: 'sg-s3-factor-quad', group: 'alg', code: 'A6.1', name: 'Factorise quadratic expressions',
      objective: 'factorisation of quadratic expressions x² + bx + c',
      example: 'x² + 7x + 12 = (x + 3)(x + 4)', timeTarget: 24,
      hint: 'Two numbers that multiply to the constant and add to the middle term.',
      spec: { kind: 'factorQuad' } },

    { id: 'sg-s3-solve-quad', group: 'alg', code: 'A6.2', name: 'Solve quadratic equations',
      objective: 'solving quadratic equations by factorisation',
      example: 'x² − 7x + 12 = 0 → larger root 4', timeTarget: 28,
      hint: 'Factorise, then set each bracket to zero.',
      spec: { kind: 'quadRoot' } },

    { id: 'sg-s3-expand-prod', group: 'alg', code: 'A6.1', name: 'Expand the product of two brackets',
      objective: 'expansion of the product of two linear expressions',
      example: '(x + 2)(x + 3): coefficient of x → 5', timeTarget: 20,
      hint: 'Multiply each term in the first bracket by each term in the second.',
      spec: { kind: 'expandProduct' } },

    // --- Trigonometry ---
    { id: 'sg-s3-pythagoras', group: 'trig', code: 'G3.1', name: "Pythagoras' theorem",
      objective: 'using Pythagoras’ theorem in right-angled triangles',
      example: 'legs 5 and 12 → hypotenuse 13', timeTarget: 22,
      hint: 'hypotenuse² = a² + b².',
      spec: { kind: 'pythagoras' } },

    { id: 'sg-s3-trig-angle', group: 'trig', code: 'G3.2', name: 'Find an angle (special triangles)',
      objective: 'trigonometric ratios sine, cosine and tangent of acute angles',
      example: 'sin θ = ½ → θ = 30°', timeTarget: 24,
      hint: 'Recall the exact ratios for 30°, 45° and 60°.',
      spec: { kind: 'trigAngle' } },

    { id: 'sg-s3-trig-side', group: 'trig', code: 'G3.2', name: 'Find a side with trigonometry',
      objective: 'applying trigonometric ratios to find an unknown side',
      example: 'hyp 10, angle 30° → opposite 5', timeTarget: 24,
      hint: 'opposite = hypotenuse × sin(angle).',
      spec: { kind: 'trigSide' } },

    // --- Indices & surds ---
    { id: 'sg-s3-index-law', group: 'idx', code: 'N3.1', name: 'Laws of indices',
      objective: 'applying the laws of indices',
      example: '5⁶ ÷ 5² = 5⁴ → 4', timeTarget: 14,
      hint: 'Multiplying adds indices; dividing subtracts them.',
      spec: { kind: 'indexLaw' } },

    { id: 'sg-s3-roots', group: 'idx', code: 'N3.2', name: 'Roots & surds',
      objective: 'square and cube roots; simplifying surds of perfect powers',
      example: '∛216 = 6', timeTarget: 14,
      hint: 'Look for the number whose square/cube gives the value under the root.',
      spec: { kind: 'rootEval' } },

    // --- Mensuration ---
    { id: 'sg-s3-cylinder', group: 'mens', code: 'G3.3', name: 'Volume of a cylinder',
      objective: 'volume of a cylinder (take π = 3.14)',
      example: 'r = 4, h = 6 → 301.44 cm³', timeTarget: 22,
      hint: 'Volume = π × r² × height.',
      spec: { kind: 'cylinderVolume' } },

    { id: 'sg-s3-sector', group: 'mens', code: 'G3.3', name: 'Area of a sector',
      objective: 'area of a sector of a circle (take π = 3.14)',
      example: 'r = 6, 90° → 28.26 cm²', timeTarget: 24,
      hint: 'Sector area = (angle ÷ 360) × π × r².',
      spec: { kind: 'sectorArea' } },

    // --- Coordinate geometry ---
    { id: 'sg-s3-gradient', group: 'coord', code: 'A7.1', name: 'Gradient of a line',
      objective: 'gradient of a straight line through two points',
      example: '(1, 2) & (4, 11) → 3', timeTarget: 20,
      hint: 'Gradient = (y₂ − y₁) ÷ (x₂ − x₁).',
      spec: { kind: 'gradient' } },
  ],

  pending: [
    'Quadratics: solving by formula / completing the square (need irrational answers)',
    'Trigonometry: sine & cosine rule, bearings, 3-D problems (need richer items)',
    'Coordinate geometry: equation of a line, length & midpoint (need expression/point answers)',
    'Mensuration: pyramids, cones & spheres (single-answer items pending)',
  ],
};
