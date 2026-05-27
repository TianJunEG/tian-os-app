// MathPath domain: Number Sense (Primary 1 → 6, + negative-number foundations).
// Seeded by scripts/seedDomain.js. See that file for the spec format.
//
// Vocabularies used across domains:
//   masteryType : conceptual | procedural | factual | application
//   fluencyType : timed (speed+accuracy drill) | accuracy (untimed correctness)
//                 | untimed-reasoning (no timing — thinking task)
//   practiceModes : fluency_drill | mcq | short_answer | number_line
//                   | order_sort | diagnostic | worked_example

export default {
  domain: 'Number Sense',
  topic: 'Number Sense',
  topicOrder: 0,            // most foundational strand → first in curriculum order
  level: 'Primary 1',
  skills: [
    // ── Counting ──
    { slug: 'ns.count.to-20', name: 'Counting to 20', level: 'Primary 1',
      prerequisites: [], masteryType: 'factual', fluencyType: 'timed',
      fluency: { targetSeconds: 2, targetAccuracy: 95 },
      misconceptions: [
        { tag: 'count/teen-ty', label: 'Confuses teen and -ty words (13 vs 30)' },
        { tag: 'count/skip-number', label: 'Skips a number when counting on' }],
      practiceModes: ['fluency_drill', 'number_line', 'mcq'],
      questionStructures: [
        { mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'What number comes after {n}?', answerRule: 'n+1', misconceptionTag: 'count/skip-number' },
        { mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'Which is thirteen?', answerRule: '13 vs distractor 30', misconceptionTag: 'count/teen-ty' }] },
    { slug: 'ns.count.to-100', name: 'Counting to 100', level: 'Primary 1',
      prerequisites: ['ns.count.to-20'], masteryType: 'factual', fluencyType: 'timed',
      fluency: { targetSeconds: 2, targetAccuracy: 95 },
      misconceptions: [{ tag: 'count/decade-boundary', label: 'Stalls at decade boundary (…29 → 30)' }],
      practiceModes: ['fluency_drill', 'number_line'],
      questionStructures: [{ mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'Count on: {n}, {n+1}, ___', answerRule: 'n+2', misconceptionTag: 'count/decade-boundary' }] },
    { slug: 'ns.count.skip', name: 'Skip counting (2s, 5s, 10s)', level: 'Primary 1',
      prerequisites: ['ns.count.to-100'], masteryType: 'factual', fluencyType: 'timed',
      fluency: { targetSeconds: 2, targetAccuracy: 95 },
      misconceptions: [{ tag: 'count/lose-step', label: 'Reverts to counting by 1s mid-sequence' }],
      practiceModes: ['fluency_drill', 'mcq'],
      questionStructures: [{ mode: 'fluency_drill', type: 'short_answer', difficulty: 'easy', stem: 'Skip count by {k}: {a}, {a+k}, ___', answerRule: 'a+2k', misconceptionTag: 'count/lose-step' }] },
    { slug: 'ns.count.to-1000', name: 'Counting to 1000', level: 'Primary 2',
      prerequisites: ['ns.count.to-100'], masteryType: 'factual', fluencyType: 'timed',
      fluency: { targetSeconds: 3, targetAccuracy: 95 },
      misconceptions: [{ tag: 'count/hundred-boundary', label: 'Stalls at hundred boundary (…199 → 200)' }],
      practiceModes: ['fluency_drill', 'number_line'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'What number is 1 more than {n}?', answerRule: 'n+1', misconceptionTag: 'count/hundred-boundary' }] },

    // ── Place value ──
    { slug: 'ns.pv.tens-ones', name: 'Place value: tens and ones', level: 'Primary 1',
      prerequisites: ['ns.count.to-100'], masteryType: 'conceptual', fluencyType: 'accuracy',
      misconceptions: [
        { tag: 'pv/digit-vs-value', label: 'Reads the digit, not its place value (the 3 in 35 = 3 not 30)' },
        { tag: 'pv/teen-reversal', label: 'Reverses teen digits (writes 41 for fourteen)' }],
      practiceModes: ['mcq', 'short_answer', 'diagnostic'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'In {n}, what is the value of the digit in the tens place?', answerRule: 'tens_digit*10', misconceptionTag: 'pv/digit-vs-value' }] },
    { slug: 'ns.pv.3-digit', name: 'Place value to 1000', level: 'Primary 2',
      prerequisites: ['ns.pv.tens-ones', 'ns.count.to-1000'], masteryType: 'conceptual', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'pv/zero-placeholder', label: 'Drops a zero placeholder (writes 35 for 305)' }],
      practiceModes: ['mcq', 'short_answer', 'diagnostic'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write the number with {h} hundreds, {t} tens and {o} ones.', answerRule: '100h+10t+o', misconceptionTag: 'pv/zero-placeholder' }] },
    { slug: 'ns.pv.4-5-digit', name: 'Place value to 100 000', level: 'Primary 3',
      prerequisites: ['ns.pv.3-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'pv/grouping', label: 'Misreads grouping of digits (thousands separator)' }],
      practiceModes: ['mcq', 'short_answer'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'In {n}, what digit is in the {place} place?', answerRule: 'digit at place', misconceptionTag: 'pv/grouping' }] },
    { slug: 'ns.pv.6-digit', name: 'Place value to 1 000 000', level: 'Primary 4',
      prerequisites: ['ns.pv.4-5-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'pv/place-name', label: 'Confuses ten-thousands / hundred-thousands names' }],
      practiceModes: ['mcq', 'short_answer'],
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'medium', stem: 'What is the value of the digit {d} in {n}?', answerRule: 'd*place', misconceptionTag: 'pv/place-name' }] },
    // (decimal place value lives in the Decimals domain)

    // ── Comparing numbers ──
    { slug: 'ns.compare.to-100', name: 'Comparing numbers to 100', level: 'Primary 1',
      prerequisites: ['ns.pv.tens-ones'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 3, targetAccuracy: 90 },
      misconceptions: [{ tag: 'compare/leading-digit', label: 'Compares only the first digit' }],
      practiceModes: ['fluency_drill', 'mcq'],
      questionStructures: [{ mode: 'fluency_drill', type: 'mcq', difficulty: 'easy', stem: 'Which is greater: {a} or {b}?', answerRule: 'max(a,b)', misconceptionTag: 'compare/leading-digit' }] },
    { slug: 'ns.compare.large', name: 'Comparing numbers to 100 000', level: 'Primary 3',
      prerequisites: ['ns.pv.4-5-digit', 'ns.compare.to-100'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 4, targetAccuracy: 90 },
      misconceptions: [{ tag: 'compare/length-not-value', label: 'Assumes the longer-looking number is larger without aligning places' }],
      practiceModes: ['fluency_drill', 'mcq'],
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'medium', stem: 'Use >, < or = : {a} ___ {b}', answerRule: 'sign(a-b)', misconceptionTag: 'compare/length-not-value' }] },
    // (comparing decimals lives in the Decimals domain)

    // ── Ordering numbers ──
    { slug: 'ns.order.to-100', name: 'Ordering numbers to 100', level: 'Primary 1',
      prerequisites: ['ns.compare.to-100'], masteryType: 'procedural', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'order/local-not-global', label: 'Orders adjacent pairs but not the whole set' }],
      practiceModes: ['order_sort', 'mcq'],
      questionStructures: [{ mode: 'order_sort', type: 'short_answer', difficulty: 'easy', stem: 'Arrange from smallest to largest: {set}', answerRule: 'sorted asc', misconceptionTag: 'order/local-not-global' }] },
    { slug: 'ns.order.large', name: 'Ordering numbers to 100 000', level: 'Primary 3',
      prerequisites: ['ns.compare.large', 'ns.order.to-100'], masteryType: 'procedural', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'order/by-length', label: 'Orders by digit count instead of value' }],
      practiceModes: ['order_sort', 'mcq'],
      questionStructures: [{ mode: 'order_sort', type: 'short_answer', difficulty: 'medium', stem: 'Order from largest to smallest: {set}', answerRule: 'sorted desc', misconceptionTag: 'order/by-length' }] },
    // (ordering decimals lives in the Decimals domain)

    // ── Number patterns ──
    { slug: 'ns.pattern.skip', name: 'Number patterns: skip-count sequences', level: 'Primary 2',
      prerequisites: ['ns.count.skip'], masteryType: 'application', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'pattern/step-drift', label: 'Lets the step size drift between terms' }],
      practiceModes: ['short_answer', 'mcq'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'Next term: {a}, {a+k}, {a+2k}, ___', answerRule: 'a+3k', misconceptionTag: 'pattern/step-drift' }] },
    { slug: 'ns.pattern.arithmetic', name: 'Number patterns: constant difference', level: 'Primary 3',
      prerequisites: ['ns.pattern.skip'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'pattern/op-confusion', label: 'Confuses additive with multiplicative rule' }],
      practiceModes: ['short_answer', 'worked_example'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Find the rule and next term: {seq}', answerRule: 'common difference', misconceptionTag: 'pattern/op-confusion' }] },
    { slug: 'ns.pattern.complex', name: 'Number patterns: position rules', level: 'Primary 5',
      prerequisites: ['ns.pattern.arithmetic'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'pattern/assume-linear', label: 'Assumes a constant difference for a non-linear pattern' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'What is the {p}th term of the pattern {seq}?', answerRule: 'position rule', misconceptionTag: 'pattern/assume-linear' }] },

    // ── Rounding ──
    { slug: 'ns.round.10-100', name: 'Rounding to the nearest 10 and 100', level: 'Primary 3',
      prerequisites: ['ns.pv.3-digit', 'ns.compare.large'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 4, targetAccuracy: 90 },
      misconceptions: [
        { tag: 'round/always-up', label: 'Always rounds up regardless of the next digit' },
        { tag: 'round/wrong-digit', label: 'Looks at the wrong digit to decide' }],
      practiceModes: ['fluency_drill', 'mcq', 'diagnostic'],
      questionStructures: [{ mode: 'fluency_drill', type: 'short_answer', difficulty: 'medium', stem: 'Round {n} to the nearest {t}.', answerRule: 'round(n,t)', misconceptionTag: 'round/always-up' }] },
    { slug: 'ns.round.1000', name: 'Rounding to the nearest 1000', level: 'Primary 4',
      prerequisites: ['ns.round.10-100', 'ns.pv.4-5-digit'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 },
      misconceptions: [{ tag: 'round/no-cascade', label: 'Fails to cascade (rounding 9 950 to nearest 100 → 10 000)' }],
      practiceModes: ['fluency_drill', 'mcq'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Round {n} to the nearest 1000.', answerRule: 'round(n,1000)', misconceptionTag: 'round/no-cascade' }] },
    // (rounding decimals lives in the Decimals domain)

    // ── Estimation ──
    { slug: 'ns.estimate.sums', name: 'Estimating sums and differences', level: 'Primary 3',
      prerequisites: ['ns.round.10-100'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'estimate/exact-not-estimate', label: 'Computes the exact answer instead of estimating' }],
      practiceModes: ['mcq', 'short_answer', 'worked_example'],
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'medium', stem: 'Estimate {a} + {b} by rounding to the nearest 10.', answerRule: 'round10(a)+round10(b)', misconceptionTag: 'estimate/exact-not-estimate' }] },
    { slug: 'ns.estimate.products', name: 'Estimating products and quotients', level: 'Primary 4',
      prerequisites: ['ns.round.1000', 'ns.estimate.sums'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'estimate/round-one', label: 'Rounds only one factor' }],
      practiceModes: ['mcq', 'short_answer'],
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'medium', stem: 'Estimate {a} × {b}.', answerRule: 'roundLead(a)*roundLead(b)', misconceptionTag: 'estimate/round-one' }] },
    { slug: 'ns.estimate.check', name: 'Estimation to check reasonableness', level: 'Primary 5',
      prerequisites: ['ns.estimate.products'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'estimate/ignore-check', label: 'Trusts a computed answer even when it is unreasonable' }],
      practiceModes: ['mcq', 'worked_example', 'diagnostic'],
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'hard', stem: 'Is {claimed} a reasonable answer for {a} × {b}? Why?', answerRule: 'compare to estimate', misconceptionTag: 'estimate/ignore-check' }] },

    // ── Negative numbers foundations ──
    { slug: 'ns.neg.intro', name: 'Negative numbers on a number line', level: 'Primary 6',
      prerequisites: ['ns.order.large', 'ns.count.to-1000'], masteryType: 'conceptual', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'neg/magnitude-order', label: 'Thinks −5 > −2 because 5 > 2' }],
      practiceModes: ['number_line', 'mcq', 'worked_example'],
      questionStructures: [{ mode: 'number_line', type: 'short_answer', difficulty: 'medium', stem: 'What number is {k} to the left of {n} on the number line?', answerRule: 'n-k (may be negative)', misconceptionTag: 'neg/magnitude-order' }] },
    { slug: 'ns.neg.compare-order', name: 'Comparing and ordering integers', level: 'Primary 6',
      prerequisites: ['ns.neg.intro'], masteryType: 'procedural', fluencyType: 'accuracy',
      misconceptions: [{ tag: 'neg/order-like-positive', label: 'Orders negatives as if they were positive' }],
      practiceModes: ['order_sort', 'mcq', 'diagnostic'],
      questionStructures: [{ mode: 'order_sort', type: 'short_answer', difficulty: 'medium', stem: 'Order from least to greatest: {intset}', answerRule: 'sorted asc with negatives', misconceptionTag: 'neg/order-like-positive' }] },
    { slug: 'ns.neg.context', name: 'Negative numbers in context (temperature, levels)', level: 'Primary 6',
      prerequisites: ['ns.neg.compare-order'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      misconceptions: [{ tag: 'neg/direction', label: 'Confuses direction of change (a rise of 3 from −5)' }],
      practiceModes: ['mcq', 'short_answer', 'worked_example'],
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'The temperature is {a}°C and falls by {b}°C. What is the new temperature?', answerRule: 'a-b (may be negative)', misconceptionTag: 'neg/direction' }] },
  ],
};
