// MathPath domain: Percentage (Primary 5 → 6). A percentage is "per hundred" —
// so this domain is built directly on the fraction/decimal machinery: % ⇄
// fraction ⇄ decimal conversion is the hinge, and every application (of a
// quantity, increase/decrease, discount, GST, interest) reduces to it. Real-world
// SG contexts (discount, GST, simple interest) are application skills layered on
// the core procedures.
//
// Cross-domain connections:
//   • Fractions : pct.convert ↔ fr.equivalent / fr.simplify; pct.of-quantity ↔ fr.of-quantity
//   • Decimals  : pct.convert ↔ dec.from-fraction; pct.of-quantity ↔ dec.mult-whole
//   • Ratio     : "express A as a % of B" mirrors part-to-whole ratio (linked when
//                 the Ratio & Rate domain lands; see pct.express)
//
// extra metadata: render:'katex', visualModels:['hundred-grid','bar']

export default {
  domain: 'Percentage',
  topic: 'Percentage',
  topicOrder: 4,
  level: 'Primary 5',
  skills: [
    // ── Meaning ──
    { slug: 'pct.meaning', name: 'Percentage as "per hundred"', level: 'Primary 5',
      prerequisites: ['fr.meaning.parts', 'dec.place-value'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['hundred-grid'],
      misconceptions: [
        { tag: 'pct/not-per-hundred', label: 'Treats the percent number as the value (50% of 40 = 50)' },
        { tag: 'pct/cap-at-100', label: 'Believes a percentage cannot exceed 100%' }],
      practiceModes: ['visual_model', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['fr.meaning.parts'], strategy: 'shade a 100-grid: percent = squares out of 100' },
      questionStructures: [{ mode: 'visual_model', type: 'mcq', difficulty: 'easy', stem: 'What percentage of the 100-grid is shaded?', answerRule: 'shaded/100', misconceptionTag: 'pct/not-per-hundred' }] },

    // ── Conversion (the hinge) ──
    { slug: 'pct.convert', name: 'Converting between percentages, fractions and decimals', level: 'Primary 5',
      prerequisites: ['pct.meaning', 'fr.equivalent', 'dec.from-fraction'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 92 },
      render: 'katex', visualModels: ['hundred-grid', 'bar'],
      misconceptions: [
        { tag: 'pct/move-point-wrong', label: 'Converts 50% to 5.0 (moves the point one place, not two)' },
        { tag: 'pct/keep-percent-sign', label: 'Leaves the % sign when writing the decimal/fraction' }],
      practiceModes: ['fluency_drill', 'mcq', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.from-fraction', 'fr.equivalent'], strategy: 'percent → ÷100 → decimal; → over 100 → fraction → simplify' },
      questionStructures: [
        { mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'Write {p}\\% as a decimal.', answerRule: 'p/100', misconceptionTag: 'pct/move-point-wrong' },
        { mode: 'fluency_drill', type: 'short_answer', difficulty: 'medium', stem: 'Write \\frac{{n}}{{d}} as a percentage.', answerRule: 'n/d*100', misconceptionTag: 'pct/keep-percent-sign' }] },

    // ── Core applications ──
    { slug: 'pct.of-quantity', name: 'Percentage of a quantity', level: 'Primary 5',
      prerequisites: ['pct.convert', 'fr.of-quantity', 'dec.mult-whole'], masteryType: 'procedural', fluencyType: 'timed', heuristic: 'bar-model',
      fluency: { targetSeconds: 8, targetAccuracy: 90 },
      render: 'katex', visualModels: ['bar', 'hundred-grid'],
      misconceptions: [{ tag: 'pct/forgot-divide-100', label: 'Multiplies by the percent number without dividing by 100' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.convert', 'fr.of-quantity'], strategy: 'percent ÷ 100 × quantity (or use a bar model)' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'What is {p}\\% of {q}?', answerRule: 'p/100*q', misconceptionTag: 'pct/forgot-divide-100' }] },
    { slug: 'pct.express', name: 'Expressing one quantity as a percentage of another', level: 'Primary 6',
      prerequisites: ['pct.convert', 'fr.simplify'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/wrong-base', label: 'Uses the wrong quantity as the whole (base)' }],
      practiceModes: ['short_answer', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.convert'], strategy: 'part ÷ whole × 100 — identify the whole first' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{a} is what percentage of {b}?', answerRule: 'a/b*100', misconceptionTag: 'pct/wrong-base' }] },
    { slug: 'pct.find-whole', name: 'Finding the whole from a percentage', level: 'Primary 6',
      prerequisites: ['pct.of-quantity'], masteryType: 'application', fluencyType: 'untimed-reasoning', heuristic: 'work-backwards',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/part-is-whole', label: 'Treats the given part as the whole (100%)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.of-quantity'], strategy: 'bar model: if p% = part, then 1% = part/p, then 100%' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: '{p}\\% of a number is {part}. What is the number?', answerRule: 'part/p*100', misconceptionTag: 'pct/part-is-whole' }] },

    // ── Change ──
    { slug: 'pct.increase-decrease', name: 'Percentage increase and decrease', level: 'Primary 6',
      prerequisites: ['pct.of-quantity'], masteryType: 'procedural', fluencyType: 'accuracy', heuristic: 'bar-model',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [
        { tag: 'pct/add-percent-not-amount', label: 'Adds the percent number rather than the computed amount' },
        { tag: 'pct/base-after-not-before', label: 'Uses the new value as the base for the change' }],
      practiceModes: ['short_answer', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.of-quantity'], strategy: 'find the change amount, then add/subtract from the ORIGINAL' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Increase {q} by {p}\\%.', answerRule: 'q*(1+p/100)', misconceptionTag: 'pct/base-after-not-before' }] },
    { slug: 'pct.before-after', name: 'Percentage change with a repeated base (before & after)', level: 'Primary 6',
      prerequisites: ['pct.increase-decrease', 'pct.find-whole'], masteryType: 'application', fluencyType: 'untimed-reasoning', heuristic: 'before-after',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/percent-of-different-base', label: 'Applies both percentages to the same base when the base changes' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'guided-replication', reinforce: ['pct.find-whole'], strategy: 'track what stays constant; one unchanged quantity = two percentages of two totals' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'After {p1}% were X, some were added; now {p2}% are X. ...', answerRule: 'unchanged quantity links the two totals', misconceptionTag: 'pct/percent-of-different-base' }] },

    // ── Real-world applications ──
    { slug: 'pct.discount', name: 'Discount', level: 'Primary 6',
      prerequisites: ['pct.increase-decrease'], masteryType: 'application', fluencyType: 'accuracy', heuristic: 'bar-model',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/discount-of-discounted', label: 'Applies a second discount to the already-discounted price by mistake / mixes base' }],
      practiceModes: ['short_answer', 'mcq', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.increase-decrease'], strategy: 'discount amount = % × marked price; pay = marked − discount' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A {item} costs ${price}. After a {p}\\% discount, what is the selling price?', answerRule: 'price*(1-p/100)', misconceptionTag: 'pct/discount-of-discounted' }] },
    { slug: 'pct.gst', name: 'GST (tax added on)', level: 'Primary 6',
      prerequisites: ['pct.increase-decrease'], masteryType: 'application', fluencyType: 'accuracy', heuristic: 'bar-model',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/gst-wrong-base', label: 'Applies GST to the wrong base (e.g. to a discounted-then-taxed value in the wrong order)' }],
      practiceModes: ['short_answer', 'mcq', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.increase-decrease'], strategy: 'GST is a percentage increase on the pre-tax price' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A meal costs ${price} before {p}\\% GST. What is the total payable?', answerRule: 'price*(1+p/100)', misconceptionTag: 'pct/gst-wrong-base' }] },
    { slug: 'pct.interest', name: 'Simple interest foundations', level: 'Primary 6',
      prerequisites: ['pct.of-quantity'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'pct/interest-compound-confuse', label: 'Compounds when the question asks for simple interest (or ignores the time period)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['pct.of-quantity'], strategy: 'interest per year = rate × principal; multiply by the number of years' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: '${principal} earns {p}\\% simple interest per year. How much interest after {y} years?', answerRule: 'principal*p/100*y', misconceptionTag: 'pct/interest-compound-confuse' }] },
  ],
};
