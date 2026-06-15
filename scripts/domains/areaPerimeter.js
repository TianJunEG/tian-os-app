// MathPath domain: Area & Perimeter (Primary 3 → 6). Perimeter of polygons,
// area of rectangles/squares/triangles/composite figures, and circle
// circumference/area belong to the circles domain.
// Foundations (shape identification) live in geometry.js.
// Applied measurement contexts (fencing, tiling) live here.
//
// Cross-domain: geo.2d-properties (shape classification), mea.unit-convert
//   (area in cm² vs m²), op.mult.2x1 (l×w)
//
// visualModels: grid, shape

export default {
  domain: 'Area & Perimeter',
  topic: 'Area & Perimeter',
  topicOrder: 12,
  level: 'Primary 3',
  skills: [
    // ── Perimeter ──
    { slug: 'ap.perimeter-rect', name: 'Perimeter of rectangles and squares', level: 'Primary 3',
      prerequisites: ['geo.2d-properties', 'op.add.regroup'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 }, visualModels: ['grid'],
      misconceptions: [{ tag: 'ap/perimeter-area-confuse', label: 'Multiplies l×w instead of adding all sides' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['geo.2d-properties'], strategy: 'perimeter = sum of all sides; for a rectangle: 2×(l+w)' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A rectangle is {l} cm long and {w} cm wide. Find its perimeter.', answerRule: '2*(l+w)', misconceptionTag: 'ap/perimeter-area-confuse' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A square has side {l} cm. Find its perimeter.', answerRule: '4*l', misconceptionTag: 'ap/perimeter-area-confuse' },
      ] },

    { slug: 'ap.perimeter-polygon', name: 'Perimeter of composite shapes', level: 'Primary 4',
      prerequisites: ['ap.perimeter-rect', 'op.add.regroup'], masteryType: 'application', fluencyType: 'accuracy',
      figureDependent: true, visualModels: ['grid'],
      misconceptions: [{ tag: 'ap/missing-side', label: 'Forgets to include interior sides of a composite shape' }],
      practiceModes: ['visual_model', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ap.perimeter-rect'], strategy: 'trace the full outer boundary systematically' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'medium', stem: 'Find the perimeter of the composite shape.', answerRule: 'sum of outer sides', misconceptionTag: 'ap/missing-side' }] },

    // ── Area ──
    { slug: 'ap.area-rect', name: 'Area of rectangles and squares', level: 'Primary 3',
      prerequisites: ['ap.perimeter-rect', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 6, targetAccuracy: 90 }, visualModels: ['grid'],
      misconceptions: [{ tag: 'ap/perimeter-area-confuse', label: 'Adds sides instead of multiplying (perimeter vs area)' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.2x1'], strategy: 'area = l × w; count the square units in the grid' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A rectangle is {l} cm long and {w} cm wide. Find its area in cm².', answerRule: 'l*w', misconceptionTag: 'ap/perimeter-area-confuse' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A square has side {l} cm. Find its area in cm².', answerRule: 'l*l', misconceptionTag: 'ap/perimeter-area-confuse' },
      ] },

    { slug: 'ap.area-triangle', name: 'Area of triangles', level: 'Primary 5',
      prerequisites: ['ap.area-rect', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['grid', 'shape'],
      misconceptions: [
        { tag: 'ap/triangle-no-half', label: 'Forgets to halve (uses base × height instead of ½ × base × height)' },
        { tag: 'ap/wrong-height', label: 'Uses a slant side instead of the perpendicular height' }],
      practiceModes: ['visual_model', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ap.area-rect'], strategy: 'area = ½ × base × height; height is always perpendicular' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A triangle has base {l} cm and height {w} cm. Find its area.', answerRule: 'l*w/2', misconceptionTag: 'ap/triangle-no-half' }] },

    { slug: 'ap.area-composite', name: 'Area of composite figures', level: 'Primary 6',
      prerequisites: ['ap.area-rect', 'ap.area-triangle'], masteryType: 'application', fluencyType: 'accuracy',
      figureDependent: true, visualModels: ['grid', 'shape'],
      misconceptions: [{ tag: 'ap/overlap-region', label: 'Adds areas of sub-shapes without subtracting the overlapping region' }],
      practiceModes: ['visual_model', 'short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ap.area-rect', 'ap.area-triangle'], strategy: 'split into known shapes or subtract the unwanted part from a larger rectangle' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'hard', stem: 'Find the area of the composite figure.', answerRule: 'sum or difference of sub-shape areas', misconceptionTag: 'ap/overlap-region' }] },

    // ── Applied contexts ──
    { slug: 'ap.apply', name: 'Perimeter and area in real-world contexts', level: 'Primary 5',
      prerequisites: ['ap.area-rect', 'ap.perimeter-rect', 'mea.unit-convert'], masteryType: 'application', fluencyType: 'accuracy', heuristic: 'bar-model',
      render: 'katex', visualModels: ['grid'],
      misconceptions: [{ tag: 'mea/area-units', label: 'Forgets square units or uses wrong unit' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ap.area-rect'] },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A field is {l} m long and {w} m wide. How much fencing (perimeter) is needed?', answerRule: '2*(l+w)', misconceptionTag: 'mea/area-units' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A floor is {l} m by {w} m. How many 1 m² tiles are needed to cover it?', answerRule: 'l*w', misconceptionTag: 'mea/area-units' },
      ] },
  ],
};
