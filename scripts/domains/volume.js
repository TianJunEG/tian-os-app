// MathPath domain: Volume (Primary 5 → 6). Volume of cubes and cuboids,
// nets → dimensions → volume, and composite solids / water-level problems.
// Split from measurement.js to give volume its own diagnostic adapter.
//
// Cross-domain: geo.3d-shapes (shape recognition), ap.area-rect (base area),
//   op.mult.2x1 (l×b×h), rr.rate (water-flow rate problems)
//
// visualModels: solid, grid, net

export default {
  domain: 'Volume',
  topic: 'Volume',
  topicOrder: 13,
  level: 'Primary 5',
  skills: [
    // ── Counting unit cubes ──
    { slug: 'vol.unit-cubes', name: 'Counting unit cubes to find volume', level: 'Primary 5',
      prerequisites: ['geo.3d-shapes', 'ns.count.to-1000'], masteryType: 'conceptual', fluencyType: 'accuracy',
      figureDependent: true, visualModels: ['solid', 'grid'],
      misconceptions: [{ tag: 'vol/hidden-cubes', label: 'Forgets to count hidden cubes in the interior' }],
      practiceModes: ['visual_model', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['geo.3d-shapes'], strategy: 'count layer by layer; each layer has the same number of cubes' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'easy', stem: 'Count the unit cubes to find the volume of this solid.', answerRule: 'count cubes', misconceptionTag: 'vol/hidden-cubes' }] },

    // ── Cuboid formula ──
    { slug: 'vol.cuboid', name: 'Volume of cubes and cuboids', level: 'Primary 5',
      prerequisites: ['vol.unit-cubes', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 }, render: 'katex', visualModels: ['solid', 'grid'],
      misconceptions: [{ tag: 'mea/volume-add-edges', label: 'Adds the edge lengths instead of multiplying l × b × h' }],
      practiceModes: ['short_answer', 'fluency_drill', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.2x1', 'ap.area-rect'], strategy: 'volume = base area × height = l × b × h' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A cuboid is {l} cm long, {w} cm wide and {b} cm tall. Find its volume.', answerRule: 'l*w*b', misconceptionTag: 'mea/volume-add-edges' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A cube has side {l} cm. Find its volume.', answerRule: 'l*l*l', misconceptionTag: 'mea/volume-add-edges' },
      ] },

    // ── Nets ──
    { slug: 'vol.nets', name: 'Nets and volume of cuboids', level: 'Primary 6',
      prerequisites: ['vol.cuboid', 'geo.nets-views'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', figureDependent: true, visualModels: ['net', 'solid'],
      misconceptions: [{ tag: 'mea/net-dimensions', label: 'Reads the wrong dimensions off the net' }],
      practiceModes: ['visual_model', 'short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['vol.cuboid', 'geo.nets-views'], strategy: 'fold the net mentally; identify which edges meet to find l, b, h' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'hard', stem: 'The net folds to form a cuboid. Find its volume.', answerRule: 'l*b*h from net', misconceptionTag: 'mea/net-dimensions' }] },

    // ── Water level / rate ──
    { slug: 'vol.water-rate', name: 'Volume, water level and flow rate', level: 'Primary 6',
      prerequisites: ['vol.cuboid', 'rr.rate'], masteryType: 'application', fluencyType: 'untimed-reasoning', heuristic: 'ratio',
      render: 'katex', visualModels: ['solid'],
      misconceptions: [{ tag: 'mea/rate-volume-confuse', label: 'Confuses the height of water with the volume of water' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['vol.cuboid', 'rr.rate'], strategy: 'volume = base area × height; time = volume ÷ rate' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Water fills a tank with base {l} cm × {w} cm at {k} cm³/s. How long to reach {b} cm deep?', answerRule: 'l*w*b/k', misconceptionTag: 'mea/rate-volume-confuse' }] },
  ],
};
