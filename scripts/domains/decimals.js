// MathPath domain: Decimals (Primary 4 → 6). The canonical home for the decimal
// number system (place value, comparing, ordering, rounding, operations) plus
// the bridges that other domains depend on: decimal⇄fraction conversion (→
// Fractions, Percentage) and measurement unit conversion (→ Measurement). Builds
// on whole-number place value (Number Sense) and the Operations facts/algorithms.
//
// Cross-domain compatibility:
//   • Fractions  : dec.to-fraction / dec.from-fraction pair with fr.simplify / fr.equivalent
//   • Percentage : percentage conversion will build on dec.from-fraction + dec.x-÷-10-100
//   • Measurement: dec.measure-convert underpins length/mass/volume conversions
//
// extra metadata: render:'katex' (decimal/fraction notation), visualModels:[…]

// Canonical D001–D014 alignment for MathPath, mirroring the Fractions seed's
// frameworkCode reconciliation. Stable slug keys stay for seed/reconcile
// compatibility; the framework codes + order match the shared Decimals skill
// graph (shared/mathpath/decimals/decimalsSkillGraph.js) exactly so seeded DB
// records line up with the runtime graph and practice engine.
const DECIMALS_FRAMEWORK_CODES = {
  'dec.place-value': 'D001',
  'dec.number-line': 'D002',
  'dec.compare': 'D003',
  'dec.order': 'D004',
  'dec.round': 'D005',
  'dec.add-sub': 'D006',
  'dec.x-div-10-100': 'D007',
  'dec.mult-whole': 'D008',
  'dec.mult-decimal': 'D009',
  'dec.div-whole': 'D010',
  'dec.div-decimal': 'D011',
  'dec.to-fraction': 'D012',
  'dec.from-fraction': 'D013',
  'dec.measure-convert': 'D014',
};

const DECIMALS_MATHPATH_SKILL_NAMES = {
  D001: 'Decimal Place Value',
  D002: 'Decimals on a Number Line',
  D003: 'Comparing Decimals',
  D004: 'Ordering Decimals',
  D005: 'Rounding Decimals',
  D006: 'Adding and Subtracting Decimals',
  D007: 'Multiply and Divide by 10, 100, 1000',
  D008: 'Multiply a Decimal by a Whole Number',
  D009: 'Multiply a Decimal by a Decimal',
  D010: 'Divide a Decimal by a Whole Number',
  D011: 'Dividing by a Decimal',
  D012: 'Converting Decimals to Fractions',
  D013: 'Converting Fractions to Decimals',
  D014: 'Measurement Conversions with Decimals',
};

const decimalsDomain = {
  domain: 'Decimals',
  topic: 'Decimals',
  topicOrder: 3,
  level: 'Primary 4',
  skills: [
    // ── Place value & representation ──
    { slug: 'dec.place-value', name: 'Decimal place value (tenths to thousandths)', level: 'Primary 4',
      prerequisites: ['ns.pv.4-5-digit'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area', 'number-line'],
      misconceptions: [
        { tag: 'dec/place-confuse', label: 'Confuses tenths and hundredths columns' },
        { tag: 'dec/longer-is-bigger', label: 'Thinks more decimal digits means a larger value' }],
      practiceModes: ['mcq', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['ns.pv.4-5-digit'], strategy: 'place-value chart extended past the point' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'In {x}, which digit is in the hundredths place?', answerRule: 'hundredths digit', misconceptionTag: 'dec/place-confuse' }] },
    { slug: 'dec.number-line', name: 'Decimals on a number line', level: 'Primary 4',
      prerequisites: ['dec.place-value'], masteryType: 'conceptual', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/nl-interval', label: 'Miscounts the equal intervals between two whole numbers' }],
      practiceModes: ['number_line', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value'], strategy: 'label each interval as 0.1 / 0.01' },
      questionStructures: [{ mode: 'number_line', type: 'short_answer', difficulty: 'medium', stem: 'A number line from {a} to {a+1} is split into 10 equal parts. What value is at mark {k}?', answerRule: 'a + k/10', misconceptionTag: 'dec/nl-interval' }] },

    // ── Comparing & ordering ──
    { slug: 'dec.compare', name: 'Comparing decimals', level: 'Primary 4',
      prerequisites: ['dec.place-value', 'ns.compare.large'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 4, targetAccuracy: 90 },
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/longer-decimal', label: 'Thinks 0.45 > 0.5 because it has more digits' }],
      practiceModes: ['fluency_drill', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value'], strategy: 'line up decimal points, compare place by place' },
      questionStructures: [{ mode: 'mcq', type: 'mcq', difficulty: 'medium', stem: 'Which is larger: {x} or {y}?', answerRule: 'max(x,y)', misconceptionTag: 'dec/longer-decimal' }] },
    { slug: 'dec.order', name: 'Ordering decimals', level: 'Primary 4',
      prerequisites: ['dec.compare', 'ns.order.large'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/align-right', label: 'Aligns digits to the right instead of by the decimal point' }],
      practiceModes: ['order_sort', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'reinforce-prerequisite', reinforce: ['dec.compare'] },
      questionStructures: [{ mode: 'order_sort', type: 'short_answer', difficulty: 'medium', stem: 'Arrange in increasing order: {set}', answerRule: 'sorted asc by value', misconceptionTag: 'dec/align-right' }] },

    // ── Rounding ──
    { slug: 'dec.round', name: 'Rounding decimals', level: 'Primary 5',
      prerequisites: ['dec.place-value', 'ns.round.1000'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 },
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/truncate', label: 'Truncates (drops digits) instead of rounding' }],
      practiceModes: ['fluency_drill', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value'], strategy: 'find the deciding digit one place to the right' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Round {x} to 1 decimal place.', answerRule: 'round to 0.1', misconceptionTag: 'dec/truncate' }] },

    // ── Operations ──
    { slug: 'dec.add-sub', name: 'Adding and subtracting decimals', level: 'Primary 4',
      prerequisites: ['dec.place-value', 'op.add.regroup', 'op.sub.regroup'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 8, targetAccuracy: 90 },
      render: 'katex', visualModels: ['area'],
      misconceptions: [{ tag: 'dec/add-misalign', label: 'Aligns the right-hand digits instead of the decimal points' }],
      practiceModes: ['fluency_drill', 'short_answer', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value', 'op.add.regroup'], strategy: 'stack with decimal points aligned' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{x} + {y} = ?', answerRule: 'align points and add', misconceptionTag: 'dec/add-misalign' }] },
    { slug: 'dec.x-div-10-100', name: 'Multiplying and dividing decimals by 10, 100, 1000', level: 'Primary 5',
      prerequisites: ['dec.place-value', 'op.mult.by-10-100'], masteryType: 'procedural', fluencyType: 'timed',
      fluency: { targetSeconds: 5, targetAccuracy: 90 },
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/move-wrong-way', label: 'Moves the decimal point the wrong direction (or appends zeros)' }],
      practiceModes: ['fluency_drill', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value'], strategy: 'shift digits across the point, one place per zero' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'easy', stem: '{x} × {p} = ?', answerRule: 'shift point (p∈{10,100,1000})', misconceptionTag: 'dec/move-wrong-way' }] },
    { slug: 'dec.mult-whole', name: 'Multiplying a decimal by a whole number', level: 'Primary 5',
      prerequisites: ['dec.add-sub', 'op.mult.2x1'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area'],
      misconceptions: [{ tag: 'dec/lost-point', label: 'Loses or misplaces the decimal point in the product' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.mult.2x1'], strategy: 'multiply as whole numbers, then count decimal places' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{x} × {w} = ?', answerRule: 'product with 1 dp', misconceptionTag: 'dec/lost-point' }] },
    { slug: 'dec.mult-decimal', name: 'Multiplying a decimal by a decimal', level: 'Primary 6',
      prerequisites: ['dec.mult-whole'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area'],
      misconceptions: [{ tag: 'dec/wrong-place-count', label: 'Counts the wrong number of decimal places in the product' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.mult-whole'], strategy: 'total decimal places in factors = decimal places in product' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: '{x} × {y} = ?', answerRule: 'count total decimal places', misconceptionTag: 'dec/wrong-place-count' }] },
    { slug: 'dec.div-whole', name: 'Dividing a decimal by a whole number', level: 'Primary 5',
      prerequisites: ['dec.mult-whole', 'op.div.short'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area'],
      misconceptions: [{ tag: 'dec/quotient-point', label: 'Forgets to place the decimal point in the quotient above the dividend' }],
      practiceModes: ['short_answer', 'worked_example'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['op.div.short'], strategy: 'keep the point aligned above' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{x} ÷ {w} = ?', answerRule: 'quotient with point aligned', misconceptionTag: 'dec/quotient-point' }] },
    { slug: 'dec.div-decimal', name: 'Dividing by a decimal', level: 'Primary 6',
      prerequisites: ['dec.div-whole', 'dec.x-div-10-100'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['number-line'],
      misconceptions: [{ tag: 'dec/no-scale-divisor', label: 'Does not scale both numbers to make the divisor a whole number' }],
      practiceModes: ['short_answer', 'worked_example', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.x-div-10-100'], strategy: 'multiply both by a power of 10 to clear the divisor' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'hard', stem: '{x} ÷ {y} = ?', answerRule: 'scale divisor to whole, then divide', misconceptionTag: 'dec/no-scale-divisor' }] },

    // ── Decimal ⇄ fraction conversion (bridge to Fractions & Percentage) ──
    { slug: 'dec.to-fraction', name: 'Converting decimals to fractions', level: 'Primary 5',
      prerequisites: ['dec.place-value', 'fr.simplify'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['area', 'bar'],
      misconceptions: [{ tag: 'dec/wrong-denominator', label: 'Uses the wrong power of ten for the denominator' }],
      practiceModes: ['short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.place-value', 'fr.simplify'], strategy: 'read the place value as the denominator, then simplify' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write {x} as a fraction in lowest terms.', answerRule: 'x over 10^places, simplified', misconceptionTag: 'dec/wrong-denominator' }] },
    { slug: 'dec.from-fraction', name: 'Converting fractions to decimals', level: 'Primary 5',
      prerequisites: ['fr.equivalent', 'dec.place-value', 'op.div.short'], masteryType: 'procedural', fluencyType: 'accuracy',
      render: 'katex', visualModels: ['bar'],
      misconceptions: [{ tag: 'dec/divide-reversed', label: 'Divides denominator by numerator (reversed)' }],
      practiceModes: ['short_answer', 'mcq'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['fr.equivalent', 'op.div.short'], strategy: 'make an equivalent fraction over 10/100, or divide numerator by denominator' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Write \\frac{{n}}{{d}} as a decimal.', answerRule: 'numerator ÷ denominator', misconceptionTag: 'dec/divide-reversed' }] },

    // ── Measurement conversions (bridge to Measurement) ──
    { slug: 'dec.measure-convert', name: 'Measurement conversions with decimals', level: 'Primary 5',
      prerequisites: ['dec.x-div-10-100'], masteryType: 'application', fluencyType: 'accuracy',
      render: 'katex', visualModels: [],
      misconceptions: [{ tag: 'dec/convert-direction', label: 'Multiplies when it should divide between units (km↔m, kg↔g, L↔ml)' }],
      practiceModes: ['short_answer', 'mcq', 'diagnostic'],
      remediation: { onRepeatedFail: 'worked-example', reinforce: ['dec.x-div-10-100'], strategy: 'bigger unit → smaller unit means multiply' },
      questionStructures: [{ mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: 'Convert {x} km to m.', answerRule: 'x*1000', misconceptionTag: 'dec/convert-direction' }] },
  ],
};

export default {
  ...decimalsDomain,
  skills: decimalsDomain.skills.map((skill) => ({
    ...skill,
    frameworkCode: DECIMALS_FRAMEWORK_CODES[skill.slug] || '',
    mathPathSkillId: DECIMALS_FRAMEWORK_CODES[skill.slug] || '',
    mathPathSkillName: DECIMALS_MATHPATH_SKILL_NAMES[DECIMALS_FRAMEWORK_CODES[skill.slug]] || '',
  })),
};
