// MathPath domain: Measurement (Primary 2 → 6). The measures (length, mass,
// volume/capacity, time) plus unit conversions and the applied perimeter / area
// / volume that build on the Geometry foundations. Fluency-heavy on unit recall
// and conversions; reasoning-heavy on time durations and volume-rate problems.
//
// Cross-domain connections:
//   • Operations: mea.unit-convert ← op.mult.by-10-100 (whole-number place-value scaling)
//   • Decimals : mea.compare-measures ← dec.compare
//   • Geometry : mea.perimeter-apply ← geo.perimeter; mea.area-apply ← geo.area-rect;
//                mea.volume-cuboid ← geo.3d-shapes; mea.nets-volume ← geo.nets-views
//   • Ratio/Rate: mea.volume-rate ← rr.rate (water-level / flow problems)
//
// extra metadata: render:'katex', visualModels:['scale','clock','grid','solid']

export default {
  domain: 'Measurement',
  topic: 'Measurement',
  topicOrder: 7,
  level: 'Primary 2',
  skills: [
    // ── Measures & scales ──
    { slug: 'mea.length', name: 'Length and its units (cm, m, km)', level: 'Primary 2',
      prerequisites: ['ns.pv.3-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/wrong-unit', label: 'Chooses an unreasonable unit (measures a pencil in metres)' }],
      practiceModes: ['mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.pv.3-digit'], strategy: 'benchmark each unit to a familiar object' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'Which unit best measures the length of a {object}?', answerRule: 'reasonable unit', misconceptionTag: 'mea/wrong-unit' }] },
    { slug: 'mea.mass', name: 'Mass and its units (g, kg)', level: 'Primary 2',
      prerequisites: ['ns.pv.3-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/wrong-unit', label: 'Chooses an unreasonable unit of mass' }],
      practiceModes: ['mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.pv.3-digit'], strategy: 'benchmark g vs kg to known objects' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'About how heavy is a {object}?', answerRule: 'reasonable mass', misconceptionTag: 'mea/wrong-unit' }] },
    { slug: 'mea.volume-capacity', name: 'Volume and capacity (ml, L)', level: 'Primary 3',
      prerequisites: ['ns.pv.3-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/capacity-volume-confuse', label: 'Confuses capacity (how much it holds) with the container size' }],
      practiceModes: ['mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.pv.3-digit'], strategy: '1 L = 1000 ml; benchmark common containers' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'About how much does a {object} hold?', answerRule: 'reasonable capacity', misconceptionTag: 'mea/capacity-volume-confuse' }] },
    { slug: 'mea.read-scales', name: 'Reading measuring scales', level: 'Primary 3',
      prerequisites: ['mea.length', 'mea.volume-capacity'], masteryType: 'procedural', fluencyType: 'accuracy',
      figureDependent: true, visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/scale-interval', label: 'Misreads the value of each interval on the scale' }],
      practiceModes: ['visual_model', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['mea.length'], strategy: 'work out the value of one interval first' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'medium', stem: 'What volume of liquid is shown on the measuring cylinder?', answerRule: 'read mark × interval', misconceptionTag: 'mea/scale-interval' }] },

    // ── Time ──
    { slug: 'mea.time-tell', name: 'Telling time and the 24-hour clock', level: 'Primary 4',
      prerequisites: ['ns.count.to-100'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 }, visualModels: ['clock'],
      misconceptions: [{ tag: 'mea/24hr-convert', label: 'Converts 12/24-hour time incorrectly (adds 12 to morning times)' }],
      practiceModes: ['fluency_drill', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.count.to-100'], strategy: 'pm hours add 12; am stays (00–11)' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write {time} pm in 24-hour clock.', answerRule: 'hours+12', misconceptionTag: 'mea/24hr-convert' }] },
    { slug: 'mea.time-duration', name: 'Duration and time intervals', level: 'Primary 5',
      prerequisites: ['mea.time-tell', 'op.sub.regroup'], masteryType: 'application', fluencyType: 'accuracy',
      visualModels: ['clock'],
      misconceptions: [{ tag: 'mea/time-base-60', label: 'Treats time as base-10 when subtracting (borrows 100, not 60)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['mea.time-tell'], strategy: 'count on through the hour; 1 hour = 60 minutes when regrouping' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A film starts at {t1} and lasts {dur}. When does it end?', answerRule: 'add duration mod 60', misconceptionTag: 'mea/time-base-60' }] },

    // ── Unit conversion ──
    { slug: 'mea.unit-convert', name: 'Unit conversions (length, mass, volume)', level: 'Primary 4',
      prerequisites: ['op.mult.by-10-100'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 6, targetAccuracy: 90 }, render: 'katex', visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/convert-direction', label: 'Multiplies when it should divide between units (and vice-versa)' }],
      practiceModes: ['fluency_drill', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.by-10-100'], strategy: 'bigger unit → smaller unit means multiply' },
      questionStructures: [{ mode: 'fluency_drill', type: 'short_answer', difficulty: 'medium', stem: 'Convert {x} kg to g.', answerRule: 'x*1000 (x≤20)', misconceptionTag: 'mea/convert-direction' }] },
    { slug: 'mea.compare-measures', name: 'Comparing and converting measurements', level: 'Primary 5',
      prerequisites: ['mea.unit-convert', 'dec.compare'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['scale'],
      misconceptions: [{ tag: 'mea/compare-mixed-units', label: 'Compares values without first converting to the same unit' }],
      practiceModes: ['order_sort', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['mea.unit-convert'], strategy: 'convert all to one unit, then compare' },
      questionStructures: [{ mode: 'order_sort', type: 'short_answer', difficulty: 'medium', stem: 'Arrange from lightest to heaviest: {mixed masses}', answerRule: 'convert then sort', misconceptionTag: 'mea/compare-mixed-units' }] },

    // ── Applied perimeter / area (on Geometry foundations) ──
    { slug: 'mea.perimeter-apply', name: 'Perimeter in measurement contexts', level: 'Primary 5',
      prerequisites: ['geo.perimeter', 'mea.unit-convert'], masteryType: 'application', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['grid'],
      misconceptions: [{ tag: 'mea/perimeter-units', label: 'Reports an area unit (cm²) for a perimeter' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'reinforce-prerequisite', reinforce: ['geo.perimeter'] },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A field is {l} m by {w} m. How much fencing is needed to go around it?', answerRule: '2(l+w) m', misconceptionTag: 'mea/perimeter-units' }] },
    { slug: 'mea.area-apply', name: 'Area in measurement contexts', level: 'Primary 5',
      prerequisites: ['geo.area-rect', 'mea.unit-convert'], masteryType: 'application', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['grid'],
      misconceptions: [{ tag: 'mea/area-units', label: 'Forgets square units (reports cm instead of cm²)' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'reinforce-prerequisite', reinforce: ['geo.area-rect'] },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'How many {tile} cm tiles cover a {l} cm by {w} cm floor?', answerRule: 'area ÷ tile area', misconceptionTag: 'mea/area-units' }] },

    // ── Volume foundations ──
    { slug: 'mea.volume-cuboid', name: 'Volume of cubes and cuboids', level: 'Primary 5',
      prerequisites: ['geo.3d-shapes', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 }, render: 'katex', figureDependent: true, visualModels: ['solid', 'grid'],
      misconceptions: [{ tag: 'mea/volume-add-edges', label: 'Adds the edge lengths instead of multiplying length × breadth × height' }],
      practiceModes: ['visual_model', 'short_answer', 'fluency_drill'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.2x1'], strategy: 'count unit cubes: l × b × h' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A cuboid is {l} cm by {b} cm by {h} cm. Find its volume.', answerRule: 'l*b*h', misconceptionTag: 'mea/volume-add-edges' }] },
    { slug: 'mea.nets-volume', name: 'Nets and volume of cuboids', level: 'Primary 6',
      prerequisites: ['mea.volume-cuboid', 'geo.nets-views'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', figureDependent: true, visualModels: ['net', 'solid'],
      misconceptions: [{ tag: 'mea/net-dimensions', label: 'Reads the wrong dimensions off the net' }],
      practiceModes: ['visual_model', 'short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['mea.volume-cuboid', 'geo.nets-views'], strategy: 'fold the net mentally to find l, b, h' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'hard', stem: 'The net forms a cuboid. Find its volume.', answerRule: 'l*b*h from net', misconceptionTag: 'mea/net-dimensions' }] },
    { slug: 'mea.volume-rate', name: 'Volume, water level and rate', level: 'Primary 6',
      prerequisites: ['mea.volume-cuboid', 'rr.rate'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', figureDependent: true, visualModels: ['solid'],
      misconceptions: [{ tag: 'mea/rate-volume-confuse', label: 'Confuses the height of water with the volume of water' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['mea.volume-cuboid', 'rr.rate'], strategy: 'volume = base area × height; time = volume ÷ rate' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Water flows at {r} cm³/s into a tank with base {s} cm². How long until it is {d} cm deep?', answerRule: 's*d/r (s≤20)', misconceptionTag: 'mea/rate-volume-confuse' }] },

    // ── Money (measurement context) ──
    { slug: 'mea.money', name: 'Money word problems and reasoning', level: 'Primary 4',
      prerequisites: ['op.add.regroup', 'dec.add-sub'], masteryType: 'application', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'mea/money-decimal-place', label: 'Misplaces dollars and cents (treats $2.5 as 2 dollars 5 cents)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.add-sub'], strategy: 'keep dollars and cents aligned; reason in cents if unsure' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'One item costs ${a} and another costs ${b}. How much change from ${c}?', answerRule: 'c - (a+b) (a,b≤9, c∈{20,50,100})', misconceptionTag: 'mea/money-decimal-place' }] },
  ],
};
