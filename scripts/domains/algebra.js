// MathPath domain: Algebra (Primary 4 → 6). Deliberately bridges arithmetic to
// algebra: it starts from "missing number" sentences (an unknown the student
// already meets in arithmetic) and moves to a letter, notation, substitution,
// simplifying, and one-/two-step equations. KaTeX renders all notation,
// expressions and equations (e.g. 3n, 5m - 6 + 2m, 2x + 3 = 11). The classic
// transition misconceptions (= means "compute", 3n = 3+n, a letter is an object)
// are tagged so remediation can target them with the balance / bar model.
//
// Arithmetic-to-algebra transition:
//   alg.unknown-arith (□ in arithmetic) → alg.unknown-letter (use a letter) →
//   alg.notation → substitution / simplifying / equations.
//
// extra metadata: render:'katex', visualModels:['balance','bar']

export default {
  domain: 'Algebra',
  topic: 'Algebra',
  topicOrder: 6,
  level: 'Primary 4',
  skills: [
    // ── Arithmetic → algebra: the unknown ──
    { slug: 'alg.unknown-arith', name: 'Unknowns in arithmetic (missing numbers)', level: 'Primary 4',
      prerequisites: ['op.add.facts', 'op.sub.facts'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['balance', 'bar'],
      misconceptions: [{ tag: 'alg/equals-means-answer', label: 'Reads = as "work it out" rather than "both sides balance"' }],
      practiceModes: ['mcq', 'short_answer', 'visual_model'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.sub.facts'], strategy: 'balance model: what keeps both sides equal' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'Find the missing number: {b} + ___ = {a}', answerRule: 'a-b (a,b≤20)', misconceptionTag: 'alg/equals-means-answer' }] },
    { slug: 'alg.unknown-letter', name: 'Using a letter for an unknown', level: 'Primary 6',
      prerequisites: ['alg.unknown-arith'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [
        { tag: 'alg/letter-as-label', label: 'Treats the letter as an object/unit ("3a = 3 apples")' },
        { tag: 'alg/letter-one-value', label: 'Thinks a letter can only stand for one fixed number' }],
      practiceModes: ['mcq', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.unknown-arith'], strategy: 'a letter stands for a number we do not yet know' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: 'Ben has {a} more sweets than Sam. Sam has n sweets. How many does Ben have?', answerRule: 'n + a', misconceptionTag: 'alg/letter-as-label' }] },

    // ── Notation & forming expressions ──
    { slug: 'alg.notation', name: 'Algebraic notation', level: 'Primary 6',
      prerequisites: ['alg.unknown-letter', 'op.mult.facts'], masteryType: 'conceptual', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 92 },
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'alg/3n-means-3-plus-n', label: 'Reads 3n as 3 + n instead of 3 \\times n' }],
      practiceModes: ['fluency_drill', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.unknown-letter'], strategy: '3n = n + n + n; show repeated addition' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'easy', stem: 'Which expression equals n + n + n?', answerRule: '3n', misconceptionTag: 'alg/3n-means-3-plus-n' }] },
    { slug: 'alg.form-expression', name: 'Forming expressions from words', level: 'Primary 6',
      prerequisites: ['alg.notation'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'alg/word-order', label: 'Mis-orders operations from words ("5 less than n" → 5 - n)' }],
      practiceModes: ['short_answer', 'mcq', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.notation'], strategy: 'translate phrase by phrase; draw a bar' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write an expression for "{k} less than {m} times p".', answerRule: 'm*p - k', misconceptionTag: 'alg/word-order' }] },

    // ── Substitution ──
    { slug: 'alg.substitute', name: 'Substitution (evaluating expressions)', level: 'Primary 6',
      prerequisites: ['alg.notation', 'op.order-of-ops'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 },
      render: 'katex', visualModels: [],
      misconceptions: [
        { tag: 'alg/sub-no-times', label: 'Substitutes 3n at n=4 as 34 (concatenation, not 3 \\times 4)' },
        { tag: 'alg/sub-ignore-precedence', label: 'Ignores order of operations after substituting' }],
      practiceModes: ['fluency_drill', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.notation', 'op.order-of-ops'], strategy: 'replace the letter with brackets, then apply BODMAS' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Find the value of {a}m + {b} + {c}m when m = {v}.', answerRule: '(a+c)*v + b (a,b,c,v≤9)', misconceptionTag: 'alg/sub-no-times' }] },

    // ── Simplifying ──
    { slug: 'alg.simplify-add', name: 'Simplifying by collecting like terms', level: 'Primary 6',
      prerequisites: ['alg.notation'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 7, targetAccuracy: 90 },
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'alg/combine-unlike', label: 'Combines unlike terms (3a + 2b = 5ab)' }],
      practiceModes: ['fluency_drill', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.notation'], strategy: 'group identical letters; numbers without a letter stay separate' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Simplify {a}m + {b} + {c}m.', answerRule: '(a+c)m + b', misconceptionTag: 'alg/combine-unlike' }] },
    { slug: 'alg.simplify-mixed', name: 'Simplifying with brackets (distributive law)', level: 'Primary 6',
      prerequisites: ['alg.simplify-add', 'op.order-of-ops.brackets'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area'],
      misconceptions: [
        { tag: 'alg/distribute-partial', label: 'Multiplies only the first term inside the brackets' },
        { tag: 'alg/sign-error', label: 'Sign error when expanding a subtraction' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.simplify-add'], strategy: 'area model for k(a + b) = ka + kb' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Expand and simplify {k}({a}n + {b}).', answerRule: 'ka*n + kb', misconceptionTag: 'alg/distribute-partial' }] },

    // ── Linear equations foundations ──
    { slug: 'alg.equation-1step', name: 'Solving one-step linear equations', level: 'Primary 6',
      prerequisites: ['alg.substitute'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 7, targetAccuracy: 90 },
      render: 'katex', visualModels: ['balance'],
      misconceptions: [{ tag: 'alg/same-side-op', label: 'Performs the inverse on one side only (breaks the balance)' }],
      practiceModes: ['fluency_drill', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.unknown-arith'], strategy: 'balance: do the same to both sides' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Solve {a}x = {ab}.', answerRule: 'ab/a', misconceptionTag: 'alg/same-side-op' }] },
    { slug: 'alg.equation-2step', name: 'Solving two-step linear equations', level: 'Primary 6',
      prerequisites: ['alg.equation-1step'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['balance'],
      misconceptions: [{ tag: 'alg/order-of-undo', label: 'Undoes operations in the wrong order (divides before subtracting)' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['alg.equation-1step'], strategy: 'undo + / − first, then × / ÷ (reverse of BODMAS)' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'Solve {a}x + {b} = {c}.', answerRule: '(c-b)/a', misconceptionTag: 'alg/order-of-undo' }] },
    { slug: 'alg.word-to-equation', name: 'Forming and solving equations from word problems', level: 'Primary 6',
      prerequisites: ['alg.form-expression', 'alg.equation-2step'], masteryType: 'application', fluencyType: 'untimed-reasoning',
      render: 'katex', visualModels: ['bar', 'balance'],
      misconceptions: [{ tag: 'alg/wrong-relation', label: 'Sets up the wrong relationship between the quantities' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'guided-replication', reinforce: ['alg.form-expression', 'alg.equation-2step'], strategy: 'let the unknown be x, write the equation from the bar model, then solve' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: 'A had y; B had {k} more than A; C had {m} times A; total {t}. Form an equation and solve for y.', answerRule: '(2+m)y + k = t', misconceptionTag: 'alg/wrong-relation' }] },
  ],
};
