// MathPath domain: Ratio & Rate (Primary 5 → 6). The home of proportional
// reasoning: ratio as multiplicative comparison (not additive), equivalent
// ratios, dividing in a ratio, rates/speed, and direct-proportion foundations.
// Visual-first: bar models, ratio tables and double number lines build the
// multiplicative intuition that the misconceptions (additive thinking, wrong
// base, averaging speeds) attack.
//
// Conceptual dependencies / cross-domain links:
//   • Fractions  : rr.meaning ← fr.meaning.parts; rr.ratio-fraction ↔ fr.of-quantity
//                  (part:part vs part:whole)
//   • Percentage : rr.ratio-percent ← pct.convert (a ratio is a comparison → %)
//   • Operations : equivalent/simplify ← mult/div facts; divide-in-ratio ← op.div.short
//
// extra metadata: render:'katex' (where fractions appear), visualModels:
//   ['bar','ratio-table','double-number-line']

export default {
  domain: 'Ratio & Rate',
  topic: 'Ratio & Rate',
  topicOrder: 5,
  level: 'Primary 5',
  skills: [
    // ── Meaning ──
    { slug: 'rr.meaning', name: 'Understanding ratio (part-to-part, part-to-whole)', level: 'Primary 5',
      prerequisites: ['fr.meaning.parts'], masteryType: 'conceptual', fluencyType: 'accuracy',
      visualModels: ['bar', 'ratio-table'],
      misconceptions: [
        { tag: 'rr/order-reversed', label: 'Writes the ratio terms in the wrong order' },
        { tag: 'rr/part-whole-mixup', label: 'Confuses part-to-part with part-to-whole' }],
      practiceModes: ['visual_model', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['fr.meaning.parts'], strategy: 'draw the units as equal bars and read the comparison' },
      questionStructures: [{ mode: 'visual_model', type: 'short_answer', difficulty: 'easy', stem: 'There are {a} red and {b} blue counters. What is the ratio of red to blue?', answerRule: 'a:b', misconceptionTag: 'rr/order-reversed' }] },

    // ── Equivalent & simplifying (proportional core) ──
    { slug: 'rr.equivalent', name: 'Equivalent ratios', level: 'Primary 5',
      prerequisites: ['rr.meaning', 'op.mult.facts'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 6, targetAccuracy: 90 },
      visualModels: ['ratio-table', 'double-number-line'],
      misconceptions: [{ tag: 'rr/add-not-multiply', label: 'Adds the same number to both terms instead of multiplying (additive thinking)' }],
      practiceModes: ['fluency_drill', 'visual_model', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.facts'], strategy: 'ratio table: scale both terms by the same factor' },
      questionStructures: [{ mode: 'fluency_drill', type: 'short_answer', difficulty: 'medium', stem: 'Complete the equivalent ratio: {a} : {b} = {ak} : ?', answerRule: 'b*k', misconceptionTag: 'rr/add-not-multiply' }] },
    { slug: 'rr.simplify', name: 'Simplifying ratios to simplest form', level: 'Primary 5',
      prerequisites: ['rr.equivalent', 'op.div.facts'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 6, targetAccuracy: 90 },
      visualModels: ['ratio-table'],
      misconceptions: [{ tag: 'rr/incomplete-simplify', label: 'Divides by a common factor but not the HCF (not simplest)' }],
      practiceModes: ['fluency_drill', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'reinforce-prerequisite', reinforce: ['rr.equivalent', 'op.div.facts'] },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Simplify the ratio {a} : {b}.', answerRule: 'divide both by HCF', misconceptionTag: 'rr/incomplete-simplify' }] },
    { slug: 'rr.three-term', name: 'Three-term ratios (a : b : c)', level: 'Primary 6',
      prerequisites: ['rr.simplify'], masteryType: 'procedural', fluencyType: 'accuracy',
      visualModels: ['bar', 'ratio-table'],
      misconceptions: [{ tag: 'rr/pairwise-only', label: 'Simplifies pairs inconsistently, breaking the whole ratio' }],
      practiceModes: ['short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.simplify'], strategy: 'divide all three terms by the same common factor' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Simplify the ratio {a} : {b} : {c}.', answerRule: 'divide all by HCF', misconceptionTag: 'rr/pairwise-only' }] },

    // ── Relating ratio to fractions & percentages ──
    { slug: 'rr.ratio-fraction', name: 'Relating ratio to fractions (part of a whole)', level: 'Primary 6',
      prerequisites: ['rr.meaning', 'fr.of-quantity'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'rr/part-part-as-fraction', label: 'Uses \\frac{a}{b} instead of \\frac{a}{a+b} for the part-of-whole fraction' }],
      practiceModes: ['visual_model', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.meaning', 'fr.of-quantity'], strategy: 'total units = a+b; each part is that many out of the total' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Red to blue is {a} : {b}. What fraction of the counters are red?', answerRule: 'a/(a+b)', misconceptionTag: 'rr/part-part-as-fraction' }] },
    { slug: 'rr.ratio-percent', name: 'Relating ratio to percentage', level: 'Primary 6',
      prerequisites: ['rr.ratio-fraction', 'pct.convert'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar', 'hundred-grid'],
      misconceptions: [{ tag: 'rr/percent-of-part', label: 'Takes the percentage of the wrong base (a part, not the whole)' }],
      practiceModes: ['short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.ratio-fraction', 'pct.convert'], strategy: 'part ÷ total → fraction → percentage' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'The ratio of boys to girls is {a} : {b}. What percentage are boys?', answerRule: 'a/(a+b)*100', misconceptionTag: 'rr/percent-of-part' }] },

    // ── Dividing in a ratio ──
    { slug: 'rr.divide', name: 'Dividing a quantity in a given ratio', level: 'Primary 5',
      prerequisites: ['rr.equivalent', 'op.div.short'], masteryType: 'procedural', fluencyType: 'accuracy',
      visualModels: ['bar'],
      misconceptions: [
        { tag: 'rr/forgot-total-units', label: 'Divides the total by the number of terms instead of the total units' },
        { tag: 'rr/unit-then-stop', label: 'Finds 1 unit but forgets to scale back to each share' }],
      practiceModes: ['visual_model', 'short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.equivalent'], strategy: 'total ÷ (sum of parts) = 1 unit, then multiply each part' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Divide {total} in the ratio {a} : {b}.', answerRule: 'total/(a+b) per unit', misconceptionTag: 'rr/forgot-total-units' }] },
    { slug: 'rr.divide-3', name: 'Dividing in a three-part ratio', level: 'Primary 6',
      prerequisites: ['rr.divide', 'rr.three-term'], masteryType: 'application', fluencyType: 'accuracy',
      visualModels: ['bar'],
      misconceptions: [{ tag: 'rr/three-units-error', label: 'Mishandles the total-units count with three parts' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.divide'] },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Divide {total} in the ratio {a} : {b} : {c}. How much is the largest share?', answerRule: 'max part * (total/(a+b+c))', misconceptionTag: 'rr/three-units-error' }] },
    { slug: 'rr.before-after', name: 'Ratio before and after a change', level: 'Primary 6',
      prerequisites: ['rr.divide'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      visualModels: ['bar'],
      misconceptions: [{ tag: 'rr/assume-total-constant', label: 'Assumes the total stays constant when only one quantity changes (or vice-versa)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'guided-replication', reinforce: ['rr.divide'], strategy: 'identify what is unchanged (one quantity, the difference, or the total)' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'The ratio was {a} : {b}; after an equal amount is added to both it becomes {c} : {d}. ...', answerRule: 'the difference is unchanged', misconceptionTag: 'rr/assume-total-constant' }] },
    { slug: 'rr.combine', name: 'Combining two ratios (a:b and b:c)', level: 'Primary 6',
      prerequisites: ['rr.equivalent'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      visualModels: ['ratio-table'],
      misconceptions: [{ tag: 'rr/no-common-term', label: 'Joins the ratios without making the common term equal' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.equivalent'], strategy: 'scale each ratio so the shared term matches, then read off a:b:c' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'A:B = {a}:{b} and B:C = {b2}:{c}. Find A:B:C.', answerRule: 'equalise the common term B', misconceptionTag: 'rr/no-common-term' }] },

    // ── Rates ──
    { slug: 'rr.rate', name: 'Rates and unit rate', level: 'Primary 5',
      prerequisites: ['rr.meaning', 'op.div.short'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 7, targetAccuracy: 90 },
      visualModels: ['double-number-line', 'ratio-table'],
      misconceptions: [{ tag: 'rr/rate-inverted', label: 'Computes the inverse rate (per-item the wrong way round)' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.div.short'], strategy: 'divide the two quantities the way the units ask (e.g. $ per kg)' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{q} items cost ${c}. What is the cost per item?', answerRule: 'c/q', misconceptionTag: 'rr/rate-inverted' }] },
    { slug: 'rr.rate-tiered', name: 'Tiered / compound rates (tariffs)', level: 'Primary 6',
      prerequisites: ['rr.rate'], masteryType: 'application', fluencyType: 'accuracy',
      visualModels: ['bar'],
      misconceptions: [{ tag: 'rr/flat-rate', label: 'Applies one rate to the whole amount instead of per tier' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.rate'], strategy: 'charge each tier at its own rate, then add' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'First {n} units at ${a} each, the rest at ${b} each; total used {u}. Find the bill.', answerRule: 'n*a + (u-n)*b', misconceptionTag: 'rr/flat-rate' }] },

    // ── Speed foundations ──
    { slug: 'rr.speed', name: 'Speed, distance and time', level: 'Primary 6',
      prerequisites: ['rr.rate'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 10, targetAccuracy: 88 },
      visualModels: ['double-number-line'],
      misconceptions: [
        { tag: 'rr/formula-confusion', label: 'Mixes up speed = distance ÷ time (uses the wrong rearrangement)' },
        { tag: 'rr/unit-mismatch', label: 'Mixes units (km with m, hours with minutes)' }],
      practiceModes: ['short_answer', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.rate'], strategy: 'speed is a rate: distance per unit time; check units first' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A car travels {d} km in {t} hours. Find its average speed.', answerRule: 'd/t', misconceptionTag: 'rr/formula-confusion' }] },
    { slug: 'rr.speed-avg', name: 'Average speed and relative motion', level: 'Primary 6',
      prerequisites: ['rr.speed'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      visualModels: ['double-number-line'],
      misconceptions: [{ tag: 'rr/avg-of-speeds', label: 'Averages the two speeds instead of total distance ÷ total time' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.speed'], strategy: 'average speed = total distance ÷ total time, never the mean of speeds' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Two objects move toward each other at {s1} and {s2}; ... how far apart after {t}?', answerRule: 'combined rate × time', misconceptionTag: 'rr/avg-of-speeds' }] },

    // ── Proportion foundations ──
    { slug: 'rr.proportion', name: 'Direct proportion foundations', level: 'Primary 6',
      prerequisites: ['rr.equivalent', 'rr.rate'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      visualModels: ['ratio-table', 'double-number-line'],
      misconceptions: [{ tag: 'rr/additive-not-multiplicative', label: 'Reasons additively ("add 3") instead of multiplicatively ("×1.5") for proportion' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['rr.equivalent', 'rr.rate'], strategy: 'find the unit value, then scale up' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'If {a} items cost ${c}, how much do {b} items cost?', answerRule: 'c/a*b', misconceptionTag: 'rr/additive-not-multiplicative' }] },
  ],
};
