// MathPath domain: Circles (Primary 6). Circumference (C = πd = 2πr),
// area (A = πr²), and combined problems (semicircles, quarter-circles).
// Singapore primary standard: π ≈ 3.14 or leave in terms of π.
// Generator uses 3.14 for numeric answers; "in terms of π" variants are
// non-generatable and kept as worked-example / diagnostic templates.
//
// Cross-domain: ap.area-rect (comparison baseline), geo.2d-properties (parts
//   of a circle), op.mult.2x1 (× 3.14 × r)
//
// visualModels: shape (circle diagrams)

export default {
  domain: 'Circles',
  topic: 'Circles',
  topicOrder: 14,
  level: 'Primary 6',
  skills: [
    // ── Parts of a circle ──
    { slug: 'cir.parts', name: 'Parts of a circle (radius, diameter, centre)', level: 'Primary 6',
      prerequisites: ['geo.2d-shapes'], masteryType: 'conceptual', fluencyType: 'timed',
      fluency: { targetSeconds: 3, targetAccuracy: 95 }, figureDependent: true, visualModels: ['shape'],
      misconceptions: [{ tag: 'cir/radius-diameter', label: 'Confuses radius and diameter (uses diameter where radius is needed or vice versa)' }],
      practiceModes: ['mcq', 'visual_model'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['geo.2d-shapes'], strategy: 'diameter = 2 × radius; diameter passes through the centre' },
      questionStructures: [
        { mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'A circle has radius {r} cm. What is its diameter?', answerRule: '2*r', misconceptionTag: 'cir/radius-diameter' },
        { mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'A circle has diameter {d} cm. What is its radius?', answerRule: 'd/2', misconceptionTag: 'cir/radius-diameter' },
      ] },

    // ── Circumference ──
    { slug: 'cir.circumference', name: 'Circumference of a circle', level: 'Primary 6',
      prerequisites: ['cir.parts', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 10, targetAccuracy: 88 }, render: 'katex', visualModels: ['shape'],
      misconceptions: [
        { tag: 'cir/radius-diameter', label: 'Uses radius in C = πd formula (or diameter in C = 2πr)' },
        { tag: 'cir/no-pi', label: 'Forgets to multiply by π' }],
      practiceModes: ['short_answer', 'fluency_drill', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['cir.parts'], strategy: 'C = 2πr = πd; use π ≈ 3.14; check which dimension is given' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Find the circumference of a circle with radius {r} cm. (Use π = 3.14)', answerRule: '2*3.14*r', misconceptionTag: 'cir/no-pi' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Find the circumference of a circle with diameter {d} cm. (Use π = 3.14)', answerRule: '3.14*d', misconceptionTag: 'cir/radius-diameter' },
      ] },

    // ── Area ──
    { slug: 'cir.area', name: 'Area of a circle', level: 'Primary 6',
      prerequisites: ['cir.circumference', 'ap.area-rect'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['shape', 'grid'],
      misconceptions: [
        { tag: 'cir/area-uses-diameter', label: 'Uses A = πd² instead of A = πr²' },
        { tag: 'cir/no-pi', label: 'Forgets to multiply by π' }],
      practiceModes: ['short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['cir.circumference'], strategy: 'A = πr²; square the RADIUS, not the diameter' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Find the area of a circle with radius {r} cm. (Use π = 3.14)', answerRule: '3.14*r*r', misconceptionTag: 'cir/area-uses-diameter' }] },

    // ── Semicircles and quarter-circles ──
    { slug: 'cir.semi-quarter', name: 'Semicircles and quarter-circles', level: 'Primary 6',
      prerequisites: ['cir.area', 'cir.circumference'], masteryType: 'application', fluencyType: 'accuracy',
      render: 'katex', figureDependent: true, visualModels: ['shape'],
      misconceptions: [
        { tag: 'cir/half-wrong', label: 'Forgets to halve (or quarter) the full-circle formula' },
        { tag: 'cir/perimeter-arc-only', label: 'Reports only the arc, forgetting the diameter/radius sides of the perimeter' }],
      practiceModes: ['visual_model', 'short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['cir.area', 'cir.circumference'], strategy: 'split into full-circle fractions; perimeter includes straight edges too' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Find the area of a semicircle with radius {r} cm. (Use π = 3.14)', answerRule: '3.14*r*r/2', misconceptionTag: 'cir/half-wrong' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Find the area of a quarter-circle with radius {r} cm. (Use π = 3.14)', answerRule: '3.14*r*r/4', misconceptionTag: 'cir/half-wrong' },
      ] },
  ],
};
