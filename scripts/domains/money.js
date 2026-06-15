// MathPath domain: Money (Primary 1 → 4). Coins, notes, addition/subtraction,
// multiplication, change calculations, and simple discount/GST.
// Applied money word problems that require decimal arithmetic live here.
//
// Cross-domain: op.add.regroup, dec.add-sub (dollar/cent arithmetic),
//   pct.convert (discount % in P5 — covered by percentage domain)
//
// visualModels: bar (part-whole models for change/difference problems)

export default {
  domain: 'Money',
  topic: 'Money',
  topicOrder: 10,
  level: 'Primary 1',
  skills: [
    // ── Coins and notes ──
    { slug: 'mon.coins-notes', name: 'Recognising coins and notes', level: 'Primary 1',
      prerequisites: ['ns.count.to-20'], masteryType: 'conceptual', fluencyType: 'timed',
      fluency: { targetSeconds: 3, targetAccuracy: 95 },
      misconceptions: [{ tag: 'mon/face-value', label: 'Confuses size of coin with its value' }],
      practiceModes: ['mcq', 'fluency_drill'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.count.to-20'], strategy: 'practise sorting coins and reading denominations' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'How many 10-cent coins make up $1?', answerRule: '10', misconceptionTag: 'mon/face-value' }] },

    // ── Adding money ──
    { slug: 'mon.add', name: 'Adding amounts of money', level: 'Primary 2',
      prerequisites: ['mon.coins-notes', 'op.add.regroup'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 },
      misconceptions: [{ tag: 'mon/cents-overflow', label: 'Adds cents without regrouping into dollars (e.g. $1.70 + $0.60 = $1.130)' }],
      practiceModes: ['fluency_drill', 'short_answer'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.add.regroup'], strategy: '100 cents = $1; regroup when cents exceed 99' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: '${ cost } + ${ d } = ?', answerRule: 'cost+d', misconceptionTag: 'mon/cents-overflow' }] },

    // ── Total cost ──
    { slug: 'mon.total-cost', name: 'Finding total cost (unit price × quantity)', level: 'Primary 2',
      prerequisites: ['mon.coins-notes'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 6, targetAccuracy: 90 },
      misconceptions: [{ tag: 'mon/add-not-multiply', label: 'Adds the price k times instead of multiplying' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.facts'], strategy: 'total = unit price × quantity' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'A pen costs ${cost}. How much do {k} pens cost?', answerRule: 'cost*k', misconceptionTag: 'mon/add-not-multiply' }] },

    // ── Change ──
    { slug: 'mon.change', name: 'Calculating change', level: 'Primary 2',
      prerequisites: ['mon.add', 'op.sub.regroup'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 },
      misconceptions: [{ tag: 'mon/change-direction', label: 'Subtracts total from change (reverses the subtraction)' }],
      practiceModes: ['fluency_drill', 'short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.sub.regroup'], strategy: 'change = amount paid − total cost' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'An item costs ${cost}. You pay ${bill}. How much change do you get?', answerRule: 'bill-cost', misconceptionTag: 'mon/change-direction' }] },

    // ── Word problems ──
    { slug: 'mon.word-problems', name: 'Money word problems', level: 'Primary 4',
      prerequisites: ['mon.change', 'mon.total-cost', 'dec.add-sub'], masteryType: 'application', fluencyType: 'accuracy', heuristic: 'bar-model',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'mon/money-decimal-place', label: 'Misplaces dollars and cents ($2.5 read as $2 and 5 cents)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.add-sub'], strategy: 'align decimal points; reason in cents when unsure' },
      questionStructures: [
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'A book costs ${cost} and a ruler costs ${d}. How much do they cost together?', answerRule: 'cost+d', misconceptionTag: 'mon/money-decimal-place' },
        { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'You buy {k} items at ${cost} each. How much do you pay in total?', answerRule: 'k*cost', misconceptionTag: 'mon/add-not-multiply' },
      ] },
  ],
};
