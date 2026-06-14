// ─── Singapore MOE Primary Mathematics Taxonomy (P1–P6) ───
//
// Source of truth: Singapore MOE Primary Mathematics syllabus.
// Structure: Level → Strand → Topic → Skill
//
// Usage:
//   Topic-based tests:       getSkillsByTopic('p3-time') → skills for a P3 Time topical test
//   Diagnostic tests:        getTopicsByLevel('P4') → all P4 topics for placement/diagnostic
//   Exam-prep mixed papers:  getExamPrepTopics('P5') → high-examRelevance skills weighted for paper generation
//   Mistake-to-mastery:      getWeaknessDrillSkills('P4', ['fraction_whole_confusion']) → targeted remediation
//   Question generation:     each skill's questionTypes + difficultyBands guide the generator
//
// The existing fractions domain (F001–F026) is preserved intact. Skills in this taxonomy
// that overlap with fractions carry a `fractionsSkillAlias` field linking to the F-code.
// The diagnostic engine can resolve either ID system.

export const STRANDS = {
  NUMBER_ALGEBRA: 'Number & Algebra',
  MEASUREMENT_GEOMETRY: 'Measurement & Geometry',
  STATISTICS: 'Statistics',
};

export const QUESTION_TYPES = [
  'procedural',
  'word_problem',
  'visual_model',
  'model_drawing',
  'comparison',
  'missing_value',
  'multi_step',
  'error_diagnosis',
  'exam_style',
  'mental_calculation',
  'estimation',
  'graph_interpretation',
  'geometry_reasoning',
];

export const MISCONCEPTION_TAGS = [
  'place_value_error',
  'operation_confusion',
  'regrouping_error',
  'multiplication_fact_gap',
  'division_remainder_error',
  'fraction_whole_confusion',
  'numerator_denominator_confusion',
  'unlike_denominator_error',
  'decimal_place_value_error',
  'percentage_base_error',
  'ratio_part_whole_confusion',
  'algebra_unknown_confusion',
  'unit_conversion_error',
  'area_perimeter_confusion',
  'volume_capacity_confusion',
  'angle_property_error',
  'graph_reading_error',
  'careless_copying',
  'multi_step_breakdown_error',
];

// ─── TOPICS ───

export const TOPICS = [
  // ═══ PRIMARY 1 ═══
  { topicId: 'p1-numbers', topicName: 'Numbers up to 100', level: 'P1', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p1-addition-subtraction', topicName: 'Addition and Subtraction within 100', level: 'P1', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p1-multiplication-division', topicName: 'Basic Multiplication and Division', level: 'P1', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p1-money', topicName: 'Money', level: 'P1', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p1-length', topicName: 'Length', level: 'P1', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p1-time', topicName: 'Time', level: 'P1', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p1-2d-shapes', topicName: '2D Shapes', level: 'P1', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p1-picture-graphs', topicName: 'Picture Graphs', level: 'P1', strand: STRANDS.STATISTICS },

  // ═══ PRIMARY 2 ═══
  { topicId: 'p2-numbers', topicName: 'Numbers up to 1000', level: 'P2', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p2-addition-subtraction', topicName: 'Addition and Subtraction', level: 'P2', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p2-multiplication-division', topicName: 'Multiplication and Division', level: 'P2', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p2-fractions', topicName: 'Fractions', level: 'P2', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p2-money', topicName: 'Money', level: 'P2', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p2-length', topicName: 'Length', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-mass', topicName: 'Mass', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-volume', topicName: 'Volume', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-time', topicName: 'Time', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-2d-shapes', topicName: '2D Shape Patterns', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-3d-shapes', topicName: '3D Shapes', level: 'P2', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p2-picture-graphs', topicName: 'Picture Graphs with Scales', level: 'P2', strand: STRANDS.STATISTICS },

  // ═══ PRIMARY 3 ═══
  { topicId: 'p3-numbers', topicName: 'Numbers up to 10 000', level: 'P3', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p3-addition-subtraction', topicName: 'Addition and Subtraction', level: 'P3', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p3-multiplication-division', topicName: 'Multiplication and Division', level: 'P3', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p3-fractions', topicName: 'Fractions', level: 'P3', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p3-money', topicName: 'Money', level: 'P3', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p3-measurement', topicName: 'Measurement and Conversion', level: 'P3', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p3-time', topicName: 'Time', level: 'P3', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p3-area-perimeter', topicName: 'Area and Perimeter', level: 'P3', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p3-angles-lines', topicName: 'Angles and Lines', level: 'P3', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p3-bar-graphs', topicName: 'Bar Graphs', level: 'P3', strand: STRANDS.STATISTICS },

  // ═══ PRIMARY 4 ═══
  { topicId: 'p4-numbers', topicName: 'Numbers up to 100 000', level: 'P4', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p4-factors-multiples', topicName: 'Factors and Multiples', level: 'P4', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p4-multiplication-division', topicName: 'Multiplication and Division', level: 'P4', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p4-fractions', topicName: 'Fractions', level: 'P4', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p4-decimals', topicName: 'Decimals', level: 'P4', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p4-area-perimeter', topicName: 'Area and Perimeter', level: 'P4', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p4-angles', topicName: 'Angles', level: 'P4', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p4-shapes-symmetry', topicName: 'Shapes and Symmetry', level: 'P4', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p4-data-analysis', topicName: 'Data Analysis', level: 'P4', strand: STRANDS.STATISTICS },

  // ═══ PRIMARY 5 ═══
  { topicId: 'p5-numbers', topicName: 'Numbers up to 10 Million', level: 'P5', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p5-fractions', topicName: 'Fractions', level: 'P5', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p5-decimals', topicName: 'Decimals', level: 'P5', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p5-percentage', topicName: 'Percentage', level: 'P5', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p5-rate', topicName: 'Rate', level: 'P5', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p5-area-volume', topicName: 'Area and Volume', level: 'P5', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p5-angles', topicName: 'Angles', level: 'P5', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p5-shapes-properties', topicName: 'Properties of Shapes', level: 'P5', strand: STRANDS.MEASUREMENT_GEOMETRY },

  // ═══ PRIMARY 6 ═══
  { topicId: 'p6-fractions', topicName: 'Division of Fractions', level: 'P6', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p6-percentage', topicName: 'Percentage', level: 'P6', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p6-ratio', topicName: 'Ratio', level: 'P6', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p6-algebra', topicName: 'Algebra', level: 'P6', strand: STRANDS.NUMBER_ALGEBRA },
  { topicId: 'p6-circles', topicName: 'Circles', level: 'P6', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p6-volume', topicName: 'Volume', level: 'P6', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p6-angles', topicName: 'Angles in Figures', level: 'P6', strand: STRANDS.MEASUREMENT_GEOMETRY },
  { topicId: 'p6-data-analysis', topicName: 'Data Analysis', level: 'P6', strand: STRANDS.STATISTICS },
];

// ─── SKILLS ───

export const SKILLS = [

  // ═══════════════════════════════════════════
  //  PRIMARY 1
  // ═══════════════════════════════════════════

  // ── P1 Numbers up to 100 ──
  {
    skillId: 'p1-num-counting-to-10',
    skillName: 'Counting to 10',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: [],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p1-num-counting-to-20',
    skillName: 'Counting to 20',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: ['p1-num-counting-to-10'],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p1-num-counting-to-100',
    skillName: 'Counting to 100',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: ['p1-num-counting-to-20'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-num-number-bonds',
    skillName: 'Number Bonds',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: ['p1-num-counting-to-10'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'mental_calculation'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-num-comparing-ordering',
    skillName: 'Comparing and Ordering Numbers',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: ['p1-num-counting-to-100'],
    questionTypes: ['comparison', 'missing_value', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-num-ordinal-numbers',
    skillName: 'Ordinal Numbers',
    level: 'P1',
    topicId: 'p1-numbers',
    prerequisites: ['p1-num-counting-to-20'],
    questionTypes: ['procedural', 'visual_model', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },

  // ── P1 Addition and Subtraction ──
  {
    skillId: 'p1-add-within-10',
    skillName: 'Addition within 10',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-num-number-bonds'],
    questionTypes: ['procedural', 'visual_model', 'mental_calculation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-sub-within-10',
    skillName: 'Subtraction within 10',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-num-number-bonds'],
    questionTypes: ['procedural', 'visual_model', 'mental_calculation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-add-within-20',
    skillName: 'Addition within 20',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-add-within-10'],
    questionTypes: ['procedural', 'mental_calculation', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['regrouping_error', 'operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-sub-within-20',
    skillName: 'Subtraction within 20',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-sub-within-10'],
    questionTypes: ['procedural', 'mental_calculation', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['regrouping_error', 'operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-add-sub-within-100',
    skillName: 'Addition and Subtraction within 100',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-add-within-20', 'p1-sub-within-20'],
    questionTypes: ['procedural', 'word_problem', 'mental_calculation', 'missing_value', 'multi_step'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['regrouping_error', 'place_value_error', 'operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-add-sub-word-problems',
    skillName: 'Addition and Subtraction Word Problems',
    level: 'P1',
    topicId: 'p1-addition-subtraction',
    prerequisites: ['p1-add-sub-within-100'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P1 Multiplication and Division ──
  {
    skillId: 'p1-mul-equal-groups',
    skillName: 'Multiplication as Equal Groups',
    level: 'P1',
    topicId: 'p1-multiplication-division',
    prerequisites: ['p1-add-within-20'],
    questionTypes: ['visual_model', 'word_problem', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p1-div-sharing-grouping',
    skillName: 'Division as Sharing and Grouping',
    level: 'P1',
    topicId: 'p1-multiplication-division',
    prerequisites: ['p1-mul-equal-groups'],
    questionTypes: ['visual_model', 'word_problem', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'foundation',
  },

  // ── P1 Money ──
  {
    skillId: 'p1-money-coins-cents',
    skillName: 'Coins and Cents up to $1',
    level: 'P1',
    topicId: 'p1-money',
    prerequisites: ['p1-num-counting-to-100'],
    questionTypes: ['procedural', 'visual_model', 'word_problem', 'mental_calculation'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-money-dollars-to-100',
    skillName: 'Dollars up to $100',
    level: 'P1',
    topicId: 'p1-money',
    prerequisites: ['p1-money-coins-cents'],
    questionTypes: ['procedural', 'word_problem', 'mental_calculation', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },

  // ── P1 Length ──
  {
    skillId: 'p1-length-cm',
    skillName: 'Length in Centimetres',
    level: 'P1',
    topicId: 'p1-length',
    prerequisites: ['p1-num-counting-to-100'],
    questionTypes: ['procedural', 'visual_model', 'comparison', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P1 Time ──
  {
    skillId: 'p1-time-telling-to-5min',
    skillName: 'Telling Time to 5 Minutes',
    level: 'P1',
    topicId: 'p1-time',
    prerequisites: ['p1-num-counting-to-100'],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },
  {
    skillId: 'p1-time-am-pm',
    skillName: 'AM and PM',
    level: 'P1',
    topicId: 'p1-time',
    prerequisites: ['p1-time-telling-to-5min'],
    questionTypes: ['procedural', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p1-time-duration-hour-half',
    skillName: 'Duration in Hours and Half Hours',
    level: 'P1',
    topicId: 'p1-time',
    prerequisites: ['p1-time-telling-to-5min'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },

  // ── P1 2D Shapes ──
  {
    skillId: 'p1-shapes-identify-2d',
    skillName: 'Identify 2D Shapes',
    level: 'P1',
    topicId: 'p1-2d-shapes',
    prerequisites: [],
    questionTypes: ['visual_model', 'comparison', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p1-shapes-half-quarter-circle',
    skillName: 'Half Circle and Quarter Circle',
    level: 'P1',
    topicId: 'p1-2d-shapes',
    prerequisites: ['p1-shapes-identify-2d'],
    questionTypes: ['visual_model', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },

  // ── P1 Picture Graphs ──
  {
    skillId: 'p1-graph-picture-read',
    skillName: 'Reading Picture Graphs',
    level: 'P1',
    topicId: 'p1-picture-graphs',
    prerequisites: ['p1-num-counting-to-20'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },

  // ═══════════════════════════════════════════
  //  PRIMARY 2
  // ═══════════════════════════════════════════

  // ── P2 Numbers up to 1000 ──
  {
    skillId: 'p2-num-place-value',
    skillName: 'Place Value (Hundreds, Tens, Ones)',
    level: 'P2',
    topicId: 'p2-numbers',
    prerequisites: ['p1-num-counting-to-100'],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-num-comparing-ordering',
    skillName: 'Comparing and Ordering Numbers to 1000',
    level: 'P2',
    topicId: 'p2-numbers',
    prerequisites: ['p2-num-place-value'],
    questionTypes: ['comparison', 'procedural', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-num-odd-even',
    skillName: 'Odd and Even Numbers',
    level: 'P2',
    topicId: 'p2-numbers',
    prerequisites: ['p2-num-place-value'],
    questionTypes: ['procedural', 'comparison', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },

  // ── P2 Addition and Subtraction ──
  {
    skillId: 'p2-add-3digit',
    skillName: 'Addition up to 3 Digits',
    level: 'P2',
    topicId: 'p2-addition-subtraction',
    prerequisites: ['p1-add-sub-within-100', 'p2-num-place-value'],
    questionTypes: ['procedural', 'mental_calculation', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['regrouping_error', 'place_value_error', 'careless_copying'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-sub-3digit',
    skillName: 'Subtraction up to 3 Digits',
    level: 'P2',
    topicId: 'p2-addition-subtraction',
    prerequisites: ['p1-add-sub-within-100', 'p2-num-place-value'],
    questionTypes: ['procedural', 'mental_calculation', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['regrouping_error', 'place_value_error', 'careless_copying'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-add-sub-word-problems',
    skillName: 'Addition and Subtraction Word Problems',
    level: 'P2',
    topicId: 'p2-addition-subtraction',
    prerequisites: ['p2-add-3digit', 'p2-sub-3digit'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P2 Multiplication and Division ──
  {
    skillId: 'p2-mul-tables-2-3-4-5-10',
    skillName: 'Multiplication Tables of 2, 3, 4, 5, 10',
    level: 'P2',
    topicId: 'p2-multiplication-division',
    prerequisites: ['p1-mul-equal-groups'],
    questionTypes: ['procedural', 'mental_calculation', 'missing_value', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-div-within-tables',
    skillName: 'Division within Multiplication Tables',
    level: 'P2',
    topicId: 'p2-multiplication-division',
    prerequisites: ['p2-mul-tables-2-3-4-5-10'],
    questionTypes: ['procedural', 'mental_calculation', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['multiplication_fact_gap', 'operation_confusion'],
    examRelevance: 'standard',
  },

  // ── P2 Fractions ──
  {
    skillId: 'p2-frac-of-whole',
    skillName: 'Fractions of a Whole',
    level: 'P2',
    topicId: 'p2-fractions',
    prerequisites: [],
    questionTypes: ['visual_model', 'procedural', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['fraction_whole_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F001',
  },
  {
    skillId: 'p2-frac-unit-fractions',
    skillName: 'Unit Fractions',
    level: 'P2',
    topicId: 'p2-fractions',
    prerequisites: ['p2-frac-of-whole'],
    questionTypes: ['visual_model', 'comparison', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F004',
  },
  {
    skillId: 'p2-frac-like-fractions',
    skillName: 'Like Fractions',
    level: 'P2',
    topicId: 'p2-fractions',
    prerequisites: ['p2-frac-unit-fractions'],
    questionTypes: ['visual_model', 'comparison', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-frac-comparing-ordering',
    skillName: 'Comparing and Ordering Fractions',
    level: 'P2',
    topicId: 'p2-fractions',
    prerequisites: ['p2-frac-like-fractions'],
    questionTypes: ['comparison', 'visual_model', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion', 'fraction_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-frac-add-sub-like',
    skillName: 'Adding and Subtracting Like Fractions',
    level: 'P2',
    topicId: 'p2-fractions',
    prerequisites: ['p2-frac-like-fractions'],
    questionTypes: ['procedural', 'visual_model', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F010',
  },

  // ── P2 Money ──
  {
    skillId: 'p2-money-dollars-cents',
    skillName: 'Dollars and Cents in Decimal Notation',
    level: 'P2',
    topicId: 'p2-money',
    prerequisites: ['p1-money-dollars-to-100', 'p2-num-place-value'],
    questionTypes: ['procedural', 'word_problem', 'comparison', 'mental_calculation'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['decimal_place_value_error', 'unit_conversion_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-money-comparing-converting',
    skillName: 'Comparing and Converting Money',
    level: 'P2',
    topicId: 'p2-money',
    prerequisites: ['p2-money-dollars-cents'],
    questionTypes: ['comparison', 'procedural', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P2 Length ──
  {
    skillId: 'p2-length-m-cm',
    skillName: 'Length in Metres and Centimetres',
    level: 'P2',
    topicId: 'p2-length',
    prerequisites: ['p1-length-cm'],
    questionTypes: ['procedural', 'comparison', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P2 Mass ──
  {
    skillId: 'p2-mass-g-kg',
    skillName: 'Mass in Grams and Kilograms',
    level: 'P2',
    topicId: 'p2-mass',
    prerequisites: ['p2-num-place-value'],
    questionTypes: ['procedural', 'comparison', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P2 Volume ──
  {
    skillId: 'p2-volume-litres',
    skillName: 'Volume in Litres',
    level: 'P2',
    topicId: 'p2-volume',
    prerequisites: ['p2-num-place-value'],
    questionTypes: ['procedural', 'comparison', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['volume_capacity_confusion'],
    examRelevance: 'standard',
  },

  // ── P2 Time ──
  {
    skillId: 'p2-time-to-minute',
    skillName: 'Time to the Minute',
    level: 'P2',
    topicId: 'p2-time',
    prerequisites: ['p1-time-telling-to-5min'],
    questionTypes: ['procedural', 'visual_model', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },
  {
    skillId: 'p2-time-hours-minutes',
    skillName: 'Hours and Minutes',
    level: 'P2',
    topicId: 'p2-time',
    prerequisites: ['p2-time-to-minute'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P2 2D Shape Patterns ──
  {
    skillId: 'p2-shapes-patterns',
    skillName: '2D Shape Patterns',
    level: 'P2',
    topicId: 'p2-2d-shapes',
    prerequisites: ['p1-shapes-identify-2d'],
    questionTypes: ['visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },

  // ── P2 3D Shapes ──
  {
    skillId: 'p2-shapes-3d',
    skillName: 'Identify 3D Shapes',
    level: 'P2',
    topicId: 'p2-3d-shapes',
    prerequisites: ['p1-shapes-identify-2d'],
    questionTypes: ['visual_model', 'comparison', 'procedural'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },

  // ── P2 Picture Graphs ──
  {
    skillId: 'p2-graph-picture-scales',
    skillName: 'Picture Graphs with Scales',
    level: 'P2',
    topicId: 'p2-picture-graphs',
    prerequisites: ['p1-graph-picture-read'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },

  // ═══════════════════════════════════════════
  //  PRIMARY 3
  // ═══════════════════════════════════════════

  // ── P3 Numbers up to 10 000 ──
  {
    skillId: 'p3-num-place-value',
    skillName: 'Place Value (Thousands)',
    level: 'P3',
    topicId: 'p3-numbers',
    prerequisites: ['p2-num-place-value'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-num-comparing-ordering',
    skillName: 'Comparing and Ordering Numbers to 10 000',
    level: 'P3',
    topicId: 'p3-numbers',
    prerequisites: ['p3-num-place-value'],
    questionTypes: ['comparison', 'procedural', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-num-number-patterns',
    skillName: 'Number Patterns',
    level: 'P3',
    topicId: 'p3-numbers',
    prerequisites: ['p3-num-place-value'],
    questionTypes: ['missing_value', 'procedural', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },

  // ── P3 Addition and Subtraction ──
  {
    skillId: 'p3-add-sub-4digit',
    skillName: 'Addition and Subtraction up to 4 Digits',
    level: 'P3',
    topicId: 'p3-addition-subtraction',
    prerequisites: ['p2-add-3digit', 'p2-sub-3digit', 'p3-num-place-value'],
    questionTypes: ['procedural', 'mental_calculation', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['regrouping_error', 'place_value_error', 'careless_copying'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-add-sub-word-problems',
    skillName: 'Addition and Subtraction Word Problems (4-digit)',
    level: 'P3',
    topicId: 'p3-addition-subtraction',
    prerequisites: ['p3-add-sub-4digit'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P3 Multiplication and Division ──
  {
    skillId: 'p3-mul-tables-6-7-8-9',
    skillName: 'Multiplication Tables of 6, 7, 8, 9',
    level: 'P3',
    topicId: 'p3-multiplication-division',
    prerequisites: ['p2-mul-tables-2-3-4-5-10'],
    questionTypes: ['procedural', 'mental_calculation', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-mul-div-algorithms',
    skillName: 'Multiplication and Division Algorithms',
    level: 'P3',
    topicId: 'p3-multiplication-division',
    prerequisites: ['p3-mul-tables-6-7-8-9'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['multiplication_fact_gap', 'regrouping_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-div-remainder',
    skillName: 'Division with Remainder',
    level: 'P3',
    topicId: 'p3-multiplication-division',
    prerequisites: ['p3-mul-div-algorithms'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['division_remainder_error', 'multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-mul-div-word-problems',
    skillName: 'Multiplication and Division Word Problems',
    level: 'P3',
    topicId: 'p3-multiplication-division',
    prerequisites: ['p3-mul-div-algorithms', 'p3-div-remainder'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P3 Fractions ──
  {
    skillId: 'p3-frac-equivalent',
    skillName: 'Equivalent Fractions',
    level: 'P3',
    topicId: 'p3-fractions',
    prerequisites: ['p2-frac-of-whole'],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion', 'fraction_whole_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F009',
  },
  {
    skillId: 'p3-frac-simplest-form',
    skillName: 'Simplest Form',
    level: 'P3',
    topicId: 'p3-fractions',
    prerequisites: ['p3-frac-equivalent'],
    questionTypes: ['procedural', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['numerator_denominator_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-frac-add-sub-related',
    skillName: 'Adding and Subtracting Related Fractions',
    level: 'P3',
    topicId: 'p3-fractions',
    prerequisites: ['p3-frac-equivalent', 'p2-frac-add-sub-like'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'visual_model'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unlike_denominator_error', 'numerator_denominator_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F011',
  },

  // ── P3 Money ──
  {
    skillId: 'p3-money-add-sub-decimal',
    skillName: 'Adding and Subtracting Money in Decimal Notation',
    level: 'P3',
    topicId: 'p3-money',
    prerequisites: ['p2-money-dollars-cents', 'p3-add-sub-4digit'],
    questionTypes: ['procedural', 'word_problem', 'multi_step'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'regrouping_error'],
    examRelevance: 'standard',
  },

  // ── P3 Measurement and Conversion ──
  {
    skillId: 'p3-meas-km-m',
    skillName: 'Kilometres and Metres Conversion',
    level: 'P3',
    topicId: 'p3-measurement',
    prerequisites: ['p2-length-m-cm'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-meas-kg-g',
    skillName: 'Kilograms and Grams Conversion',
    level: 'P3',
    topicId: 'p3-measurement',
    prerequisites: ['p2-mass-g-kg'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-meas-l-ml',
    skillName: 'Litres and Millilitres Conversion',
    level: 'P3',
    topicId: 'p3-measurement',
    prerequisites: ['p2-volume-litres'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error', 'volume_capacity_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-meas-compound-units',
    skillName: 'Compound Units',
    level: 'P3',
    topicId: 'p3-measurement',
    prerequisites: ['p3-meas-km-m', 'p3-meas-kg-g', 'p3-meas-l-ml'],
    questionTypes: ['procedural', 'word_problem', 'multi_step'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P3 Time ──
  {
    skillId: 'p3-time-seconds',
    skillName: 'Time in Seconds',
    level: 'P3',
    topicId: 'p3-time',
    prerequisites: ['p2-time-hours-minutes'],
    questionTypes: ['procedural', 'word_problem', 'estimation'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p3-time-start-end-duration',
    skillName: 'Start Time, End Time, and Duration',
    level: 'P3',
    topicId: 'p3-time',
    prerequisites: ['p2-time-hours-minutes'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'multi_step'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unit_conversion_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-time-24hour',
    skillName: '24-Hour Clock',
    level: 'P3',
    topicId: 'p3-time',
    prerequisites: ['p3-time-start-end-duration'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },

  // ── P3 Area and Perimeter ──
  {
    skillId: 'p3-area-perimeter-concepts',
    skillName: 'Area and Perimeter Concepts',
    level: 'P3',
    topicId: 'p3-area-perimeter',
    prerequisites: ['p1-length-cm'],
    questionTypes: ['visual_model', 'procedural', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-perimeter-rect-sq',
    skillName: 'Perimeter of Rectangles and Squares',
    level: 'P3',
    topicId: 'p3-area-perimeter',
    prerequisites: ['p3-area-perimeter-concepts'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'visual_model'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-perimeter-rectilinear',
    skillName: 'Perimeter of Rectilinear Figures',
    level: 'P3',
    topicId: 'p3-area-perimeter',
    prerequisites: ['p3-perimeter-rect-sq'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['area_perimeter_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-area-rect-sq',
    skillName: 'Area of Rectangles and Squares',
    level: 'P3',
    topicId: 'p3-area-perimeter',
    prerequisites: ['p3-area-perimeter-concepts'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'visual_model'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },

  // ── P3 Angles and Lines ──
  {
    skillId: 'p3-angles-concept',
    skillName: 'Angles',
    level: 'P3',
    topicId: 'p3-angles-lines',
    prerequisites: [],
    questionTypes: ['visual_model', 'comparison', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-right-angles',
    skillName: 'Right Angles',
    level: 'P3',
    topicId: 'p3-angles-lines',
    prerequisites: ['p3-angles-concept'],
    questionTypes: ['visual_model', 'comparison', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p3-perpendicular-parallel',
    skillName: 'Perpendicular and Parallel Lines',
    level: 'P3',
    topicId: 'p3-angles-lines',
    prerequisites: ['p3-right-angles'],
    questionTypes: ['visual_model', 'comparison', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },

  // ── P3 Bar Graphs ──
  {
    skillId: 'p3-graph-bar',
    skillName: 'Bar Graphs with Different Scales',
    level: 'P3',
    topicId: 'p3-bar-graphs',
    prerequisites: ['p2-graph-picture-scales'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },

  // ═══════════════════════════════════════════
  //  PRIMARY 4
  // ═══════════════════════════════════════════

  // ── P4 Numbers up to 100 000 ──
  {
    skillId: 'p4-num-place-value',
    skillName: 'Place Value (Ten Thousands)',
    level: 'P4',
    topicId: 'p4-numbers',
    prerequisites: ['p3-num-place-value'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-num-rounding',
    skillName: 'Rounding Numbers',
    level: 'P4',
    topicId: 'p4-numbers',
    prerequisites: ['p4-num-place-value'],
    questionTypes: ['procedural', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-num-number-patterns',
    skillName: 'Number Patterns',
    level: 'P4',
    topicId: 'p4-numbers',
    prerequisites: ['p4-num-place-value'],
    questionTypes: ['missing_value', 'procedural', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },

  // ── P4 Factors and Multiples ──
  {
    skillId: 'p4-factors-multiples',
    skillName: 'Factors and Multiples',
    level: 'P4',
    topicId: 'p4-factors-multiples',
    prerequisites: ['p3-mul-div-algorithms'],
    questionTypes: ['procedural', 'missing_value', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-common-factors-multiples',
    skillName: 'Common Factors and Common Multiples',
    level: 'P4',
    topicId: 'p4-factors-multiples',
    prerequisites: ['p4-factors-multiples'],
    questionTypes: ['procedural', 'missing_value', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['multiplication_fact_gap'],
    examRelevance: 'standard',
  },

  // ── P4 Multiplication and Division ──
  {
    skillId: 'p4-mul-4digit-by-1',
    skillName: 'Multiplication up to 4 Digits by 1 Digit',
    level: 'P4',
    topicId: 'p4-multiplication-division',
    prerequisites: ['p3-mul-div-algorithms'],
    questionTypes: ['procedural', 'word_problem', 'estimation'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['multiplication_fact_gap', 'regrouping_error', 'careless_copying'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-mul-3digit-by-2',
    skillName: 'Multiplication up to 3 Digits by 2 Digits',
    level: 'P4',
    topicId: 'p4-multiplication-division',
    prerequisites: ['p4-mul-4digit-by-1'],
    questionTypes: ['procedural', 'word_problem', 'estimation'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['multiplication_fact_gap', 'regrouping_error', 'careless_copying'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-div-4digit-by-1',
    skillName: 'Division up to 4 Digits by 1 Digit',
    level: 'P4',
    topicId: 'p4-multiplication-division',
    prerequisites: ['p3-div-remainder'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['division_remainder_error', 'multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-mul-div-word-problems',
    skillName: 'Multiplication and Division Word Problems',
    level: 'P4',
    topicId: 'p4-multiplication-division',
    prerequisites: ['p4-mul-3digit-by-2', 'p4-div-4digit-by-1'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P4 Fractions ──
  {
    skillId: 'p4-frac-mixed-improper',
    skillName: 'Mixed Numbers and Improper Fractions',
    level: 'P4',
    topicId: 'p4-fractions',
    prerequisites: ['p3-frac-equivalent'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['fraction_whole_confusion', 'numerator_denominator_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F013',
  },
  {
    skillId: 'p4-frac-of-set',
    skillName: 'Fraction of a Set',
    level: 'P4',
    topicId: 'p4-fractions',
    prerequisites: ['p4-frac-mixed-improper'],
    questionTypes: ['procedural', 'visual_model', 'word_problem', 'model_drawing'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['fraction_whole_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F014',
  },
  {
    skillId: 'p4-frac-add-sub-unlike',
    skillName: 'Addition and Subtraction of Unlike Fractions',
    level: 'P4',
    topicId: 'p4-fractions',
    prerequisites: ['p3-frac-add-sub-related', 'p4-common-factors-multiples'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'multi_step'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unlike_denominator_error', 'numerator_denominator_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F015',
  },
  {
    skillId: 'p4-frac-word-problems',
    skillName: 'Fraction Word Problems',
    level: 'P4',
    topicId: 'p4-fractions',
    prerequisites: ['p4-frac-add-sub-unlike', 'p4-frac-of-set'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['fraction_whole_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P4 Decimals ──
  {
    skillId: 'p4-dec-place-value',
    skillName: 'Decimal Place Value (up to 3 d.p.)',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p2-money-dollars-cents'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-comparing-ordering',
    skillName: 'Comparing and Ordering Decimals',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-place-value'],
    questionTypes: ['comparison', 'procedural', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-frac-conversion',
    skillName: 'Decimals and Fractions Conversion',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-place-value', 'p3-frac-equivalent'],
    questionTypes: ['procedural', 'missing_value', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'fraction_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-rounding',
    skillName: 'Rounding Decimals',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-place-value', 'p4-num-rounding'],
    questionTypes: ['procedural', 'estimation', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-add-sub',
    skillName: 'Adding and Subtracting Decimals',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-place-value'],
    questionTypes: ['procedural', 'word_problem', 'estimation', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'regrouping_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-mul-div-1digit',
    skillName: 'Multiplying and Dividing Decimals by 1-Digit',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-add-sub', 'p4-mul-4digit-by-1'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'multiplication_fact_gap'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-dec-division-quotient',
    skillName: 'Division with Decimal Quotient',
    level: 'P4',
    topicId: 'p4-decimals',
    prerequisites: ['p4-dec-mul-div-1digit'],
    questionTypes: ['procedural', 'word_problem'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'division_remainder_error'],
    examRelevance: 'standard',
  },

  // ── P4 Area and Perimeter ──
  {
    skillId: 'p4-area-perimeter-composite',
    skillName: 'Composite Area and Perimeter',
    level: 'P4',
    topicId: 'p4-area-perimeter',
    prerequisites: ['p3-area-rect-sq', 'p3-perimeter-rect-sq'],
    questionTypes: ['procedural', 'visual_model', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['area_perimeter_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-area-perimeter-missing-side',
    skillName: 'Missing Side from Area or Perimeter',
    level: 'P4',
    topicId: 'p4-area-perimeter',
    prerequisites: ['p4-area-perimeter-composite'],
    questionTypes: ['missing_value', 'word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['area_perimeter_confusion', 'operation_confusion'],
    examRelevance: 'standard',
  },

  // ── P4 Angles ──
  {
    skillId: 'p4-angles-measuring-drawing',
    skillName: 'Measuring and Drawing Angles',
    level: 'P4',
    topicId: 'p4-angles',
    prerequisites: ['p3-angles-concept', 'p3-right-angles'],
    questionTypes: ['procedural', 'visual_model', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },

  // ── P4 Shapes and Symmetry ──
  {
    skillId: 'p4-shapes-rect-sq-properties',
    skillName: 'Properties of Rectangles and Squares',
    level: 'P4',
    topicId: 'p4-shapes-symmetry',
    prerequisites: ['p3-perpendicular-parallel', 'p3-right-angles'],
    questionTypes: ['visual_model', 'comparison', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-line-symmetry',
    skillName: 'Line Symmetry',
    level: 'P4',
    topicId: 'p4-shapes-symmetry',
    prerequisites: ['p4-shapes-rect-sq-properties'],
    questionTypes: ['visual_model', 'geometry_reasoning'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'foundation',
  },
  {
    skillId: 'p4-nets-of-solids',
    skillName: 'Nets of Solids',
    level: 'P4',
    topicId: 'p4-shapes-symmetry',
    prerequisites: ['p2-shapes-3d'],
    questionTypes: ['visual_model', 'geometry_reasoning', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: [],
    examRelevance: 'standard',
  },

  // ── P4 Data Analysis ──
  {
    skillId: 'p4-data-tables',
    skillName: 'Tables',
    level: 'P4',
    topicId: 'p4-data-analysis',
    prerequisites: ['p3-graph-bar'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-data-line-graphs',
    skillName: 'Line Graphs',
    level: 'P4',
    topicId: 'p4-data-analysis',
    prerequisites: ['p4-data-tables'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p4-data-pie-charts',
    skillName: 'Pie Charts',
    level: 'P4',
    topicId: 'p4-data-analysis',
    prerequisites: ['p4-data-tables'],
    questionTypes: ['graph_interpretation', 'comparison', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['graph_reading_error'],
    examRelevance: 'standard',
  },

  // ═══════════════════════════════════════════
  //  PRIMARY 5
  // ═══════════════════════════════════════════

  // ── P5 Numbers up to 10 Million ──
  {
    skillId: 'p5-num-place-value',
    skillName: 'Place Value (Millions)',
    level: 'P5',
    topicId: 'p5-numbers',
    prerequisites: ['p4-num-place-value'],
    questionTypes: ['procedural', 'comparison', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-num-order-of-operations',
    skillName: 'Order of Operations',
    level: 'P5',
    topicId: 'p5-numbers',
    prerequisites: ['p4-mul-3digit-by-2', 'p4-div-4digit-by-1'],
    questionTypes: ['procedural', 'missing_value', 'error_diagnosis'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-num-brackets',
    skillName: 'Brackets in Expressions',
    level: 'P5',
    topicId: 'p5-numbers',
    prerequisites: ['p5-num-order-of-operations'],
    questionTypes: ['procedural', 'missing_value', 'error_diagnosis'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-num-mul-div-10-100-1000',
    skillName: 'Multiplying and Dividing by 10, 100, 1000',
    level: 'P5',
    topicId: 'p5-numbers',
    prerequisites: ['p4-num-place-value'],
    questionTypes: ['procedural', 'mental_calculation', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['place_value_error'],
    examRelevance: 'standard',
  },

  // ── P5 Fractions ──
  {
    skillId: 'p5-frac-division',
    skillName: 'Fraction and Division',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p4-frac-mixed-improper'],
    questionTypes: ['procedural', 'visual_model', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['fraction_whole_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F017',
  },
  {
    skillId: 'p5-frac-as-decimals',
    skillName: 'Fractions as Decimals',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p4-dec-frac-conversion'],
    questionTypes: ['procedural', 'comparison', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['decimal_place_value_error', 'fraction_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-frac-four-operations',
    skillName: 'Four Operations with Fractions',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p4-frac-add-sub-unlike', 'p5-frac-division'],
    questionTypes: ['procedural', 'word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['unlike_denominator_error', 'fraction_whole_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F018',
  },
  {
    skillId: 'p5-frac-mul-proper-improper-mixed',
    skillName: 'Multiplying Fractions (Proper, Improper, Mixed)',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p5-frac-four-operations'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['fraction_whole_confusion', 'numerator_denominator_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F019',
  },
  {
    skillId: 'p5-frac-div-appropriate',
    skillName: 'Dividing Fractions',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p5-frac-mul-proper-improper-mixed'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['fraction_whole_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F020',
  },
  {
    skillId: 'p5-frac-word-problems',
    skillName: 'Fraction Word Problems (P5)',
    level: 'P5',
    topicId: 'p5-fractions',
    prerequisites: ['p5-frac-mul-proper-improper-mixed', 'p5-frac-div-appropriate'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['fraction_whole_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F021',
  },

  // ── P5 Decimals ──
  {
    skillId: 'p5-dec-mul-div-10-100-1000',
    skillName: 'Decimals: Multiply and Divide by 10, 100, 1000',
    level: 'P5',
    topicId: 'p5-decimals',
    prerequisites: ['p4-dec-mul-div-1digit', 'p5-num-mul-div-10-100-1000'],
    questionTypes: ['procedural', 'mental_calculation', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–6', stretch: '7–8' },
    misconceptionTags: ['decimal_place_value_error', 'place_value_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-dec-measurement-conversion',
    skillName: 'Decimal Measurement Conversion',
    level: 'P5',
    topicId: 'p5-decimals',
    prerequisites: ['p5-dec-mul-div-10-100-1000', 'p3-meas-compound-units'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unit_conversion_error', 'decimal_place_value_error'],
    examRelevance: 'standard',
  },

  // ── P5 Percentage ──
  {
    skillId: 'p5-pct-concept',
    skillName: 'Percentage Concept',
    level: 'P5',
    topicId: 'p5-percentage',
    prerequisites: ['p4-dec-frac-conversion'],
    questionTypes: ['procedural', 'visual_model', 'comparison', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['percentage_base_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-pct-of-whole',
    skillName: 'Percentage of a Whole',
    level: 'P5',
    topicId: 'p5-percentage',
    prerequisites: ['p5-pct-concept'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['percentage_base_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-pct-discount',
    skillName: 'Discount',
    level: 'P5',
    topicId: 'p5-percentage',
    prerequisites: ['p5-pct-of-whole'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['percentage_base_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-pct-gst',
    skillName: 'GST',
    level: 'P5',
    topicId: 'p5-percentage',
    prerequisites: ['p5-pct-of-whole'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['percentage_base_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-pct-annual-interest',
    skillName: 'Annual Interest',
    level: 'P5',
    topicId: 'p5-percentage',
    prerequisites: ['p5-pct-of-whole'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['percentage_base_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P5 Rate ──
  {
    skillId: 'p5-rate-concept',
    skillName: 'Rate as Quantity per Unit',
    level: 'P5',
    topicId: 'p5-rate',
    prerequisites: ['p4-div-4digit-by-1', 'p4-dec-mul-div-1digit'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['unit_conversion_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-rate-total-units',
    skillName: 'Finding Rate, Total Amount, or Number of Units',
    level: 'P5',
    topicId: 'p5-rate',
    prerequisites: ['p5-rate-concept'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style', 'missing_value'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['unit_conversion_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P5 Area and Volume ──
  {
    skillId: 'p5-area-triangle',
    skillName: 'Area of Triangle',
    level: 'P5',
    topicId: 'p5-area-volume',
    prerequisites: ['p3-area-rect-sq'],
    questionTypes: ['procedural', 'visual_model', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-area-composite',
    skillName: 'Area of Composite Figures (Rectangles, Squares, Triangles)',
    level: 'P5',
    topicId: 'p5-area-volume',
    prerequisites: ['p5-area-triangle', 'p4-area-perimeter-composite'],
    questionTypes: ['procedural', 'visual_model', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['area_perimeter_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-volume-cube-cuboid',
    skillName: 'Volume of Cube and Cuboid',
    level: 'P5',
    topicId: 'p5-area-volume',
    prerequisites: ['p3-area-rect-sq'],
    questionTypes: ['procedural', 'visual_model', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['volume_capacity_confusion', 'area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-volume-liquid',
    skillName: 'Liquid Volume in Rectangular Tank',
    level: 'P5',
    topicId: 'p5-area-volume',
    prerequisites: ['p5-volume-cube-cuboid'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['volume_capacity_confusion', 'unit_conversion_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-volume-litres-ml-cm3',
    skillName: 'Litres, Millilitres, and Cubic Centimetres',
    level: 'P5',
    topicId: 'p5-area-volume',
    prerequisites: ['p5-volume-liquid', 'p3-meas-l-ml'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['volume_capacity_confusion', 'unit_conversion_error'],
    examRelevance: 'standard',
  },

  // ── P5 Angles ──
  {
    skillId: 'p5-angles-straight-line',
    skillName: 'Angles on a Straight Line',
    level: 'P5',
    topicId: 'p5-angles',
    prerequisites: ['p4-angles-measuring-drawing'],
    questionTypes: ['procedural', 'geometry_reasoning', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-angles-at-point',
    skillName: 'Angles at a Point',
    level: 'P5',
    topicId: 'p5-angles',
    prerequisites: ['p5-angles-straight-line'],
    questionTypes: ['procedural', 'geometry_reasoning', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-angles-vertically-opposite',
    skillName: 'Vertically Opposite Angles',
    level: 'P5',
    topicId: 'p5-angles',
    prerequisites: ['p5-angles-at-point'],
    questionTypes: ['procedural', 'geometry_reasoning', 'missing_value', 'exam_style'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },

  // ── P5 Properties of Shapes ──
  {
    skillId: 'p5-shapes-triangles',
    skillName: 'Triangles',
    level: 'P5',
    topicId: 'p5-shapes-properties',
    prerequisites: ['p4-shapes-rect-sq-properties', 'p5-angles-straight-line'],
    questionTypes: ['visual_model', 'geometry_reasoning', 'comparison', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-shapes-parallelogram',
    skillName: 'Parallelogram',
    level: 'P5',
    topicId: 'p5-shapes-properties',
    prerequisites: ['p3-perpendicular-parallel', 'p5-angles-straight-line'],
    questionTypes: ['visual_model', 'geometry_reasoning', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-shapes-rhombus',
    skillName: 'Rhombus',
    level: 'P5',
    topicId: 'p5-shapes-properties',
    prerequisites: ['p5-shapes-parallelogram'],
    questionTypes: ['visual_model', 'geometry_reasoning', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p5-shapes-trapezium',
    skillName: 'Trapezium',
    level: 'P5',
    topicId: 'p5-shapes-properties',
    prerequisites: ['p3-perpendicular-parallel'],
    questionTypes: ['visual_model', 'geometry_reasoning', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['angle_property_error'],
    examRelevance: 'standard',
  },

  // ═══════════════════════════════════════════
  //  PRIMARY 6
  // ═══════════════════════════════════════════

  // ── P6 Division of Fractions ──
  {
    skillId: 'p6-frac-proper-div-whole',
    skillName: 'Proper Fraction Divided by Whole Number',
    level: 'P6',
    topicId: 'p6-fractions',
    prerequisites: ['p5-frac-div-appropriate'],
    questionTypes: ['procedural', 'word_problem', 'visual_model'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['fraction_whole_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F022',
  },
  {
    skillId: 'p6-frac-whole-div-proper',
    skillName: 'Whole Number Divided by Proper Fraction',
    level: 'P6',
    topicId: 'p6-fractions',
    prerequisites: ['p6-frac-proper-div-whole'],
    questionTypes: ['procedural', 'word_problem', 'visual_model', 'model_drawing'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['fraction_whole_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F023',
  },
  {
    skillId: 'p6-frac-proper-div-proper',
    skillName: 'Proper Fraction Divided by Proper Fraction',
    level: 'P6',
    topicId: 'p6-fractions',
    prerequisites: ['p6-frac-whole-div-proper'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['fraction_whole_confusion', 'operation_confusion'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F024',
  },
  {
    skillId: 'p6-frac-division-word-problems',
    skillName: 'Fraction Division Word Problems',
    level: 'P6',
    topicId: 'p6-fractions',
    prerequisites: ['p6-frac-proper-div-proper'],
    questionTypes: ['word_problem', 'model_drawing', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['fraction_whole_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
    fractionsSkillAlias: 'F025',
  },

  // ── P6 Percentage ──
  {
    skillId: 'p6-pct-whole-from-part',
    skillName: 'Finding the Whole from Part and Percentage',
    level: 'P6',
    topicId: 'p6-percentage',
    prerequisites: ['p5-pct-of-whole'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['percentage_base_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-pct-increase-decrease',
    skillName: 'Percentage Increase and Decrease',
    level: 'P6',
    topicId: 'p6-percentage',
    prerequisites: ['p6-pct-whole-from-part'],
    questionTypes: ['word_problem', 'multi_step', 'exam_style', 'comparison'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['percentage_base_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P6 Ratio ──
  {
    skillId: 'p6-ratio-notation',
    skillName: 'Ratio Notation (a:b and a:b:c)',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p5-frac-four-operations'],
    questionTypes: ['procedural', 'word_problem', 'comparison'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['ratio_part_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-ratio-equivalent',
    skillName: 'Equivalent Ratios',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p6-ratio-notation'],
    questionTypes: ['procedural', 'missing_value', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['ratio_part_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-ratio-simplest',
    skillName: 'Simplest Ratio',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p6-ratio-equivalent'],
    questionTypes: ['procedural', 'word_problem'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['ratio_part_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-ratio-divide-quantity',
    skillName: 'Dividing a Quantity in a Given Ratio',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p6-ratio-equivalent'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['ratio_part_whole_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-ratio-missing-term',
    skillName: 'Missing Term in Ratio',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p6-ratio-equivalent'],
    questionTypes: ['missing_value', 'word_problem', 'exam_style'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['ratio_part_whole_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-ratio-fraction-relationship',
    skillName: 'Relationship between Fraction and Ratio',
    level: 'P6',
    topicId: 'p6-ratio',
    prerequisites: ['p6-ratio-divide-quantity', 'p5-frac-four-operations'],
    questionTypes: ['procedural', 'word_problem', 'model_drawing', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['ratio_part_whole_confusion', 'fraction_whole_confusion'],
    examRelevance: 'standard',
  },

  // ── P6 Algebra ──
  {
    skillId: 'p6-alg-unknowns',
    skillName: 'Algebra: Unknowns',
    level: 'P6',
    topicId: 'p6-algebra',
    prerequisites: ['p5-num-order-of-operations'],
    questionTypes: ['procedural', 'visual_model', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['algebra_unknown_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-alg-simple-expressions',
    skillName: 'Simple Algebraic Expressions',
    level: 'P6',
    topicId: 'p6-algebra',
    prerequisites: ['p6-alg-unknowns'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['algebra_unknown_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-alg-simplifying',
    skillName: 'Simplifying Algebraic Expressions',
    level: 'P6',
    topicId: 'p6-algebra',
    prerequisites: ['p6-alg-simple-expressions'],
    questionTypes: ['procedural', 'error_diagnosis', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['algebra_unknown_confusion', 'operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-alg-substitution',
    skillName: 'Substitution',
    level: 'P6',
    topicId: 'p6-algebra',
    prerequisites: ['p6-alg-simple-expressions'],
    questionTypes: ['procedural', 'word_problem', 'missing_value'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['algebra_unknown_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-alg-linear-equations',
    skillName: 'Simple Linear Equations',
    level: 'P6',
    topicId: 'p6-algebra',
    prerequisites: ['p6-alg-simplifying', 'p6-alg-substitution'],
    questionTypes: ['procedural', 'word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['algebra_unknown_confusion', 'operation_confusion'],
    examRelevance: 'standard',
  },

  // ── P6 Circles ──
  {
    skillId: 'p6-circle-area-circumference',
    skillName: 'Area and Circumference of Circle',
    level: 'P6',
    topicId: 'p6-circles',
    prerequisites: ['p5-area-triangle'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'visual_model'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–9' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-circle-semicircle-quarter',
    skillName: 'Semicircle and Quarter Circle',
    level: 'P6',
    topicId: 'p6-circles',
    prerequisites: ['p6-circle-area-circumference'],
    questionTypes: ['procedural', 'visual_model', 'missing_value', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['area_perimeter_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-circle-composite',
    skillName: 'Composite Figures Involving Circles',
    level: 'P6',
    topicId: 'p6-circles',
    prerequisites: ['p6-circle-semicircle-quarter', 'p5-area-composite'],
    questionTypes: ['multi_step', 'visual_model', 'exam_style', 'word_problem'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['area_perimeter_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P6 Volume ──
  {
    skillId: 'p6-volume-missing-dimension',
    skillName: 'Volume: Missing Dimension',
    level: 'P6',
    topicId: 'p6-volume',
    prerequisites: ['p5-volume-cube-cuboid'],
    questionTypes: ['missing_value', 'word_problem', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['volume_capacity_confusion', 'operation_confusion'],
    examRelevance: 'standard',
  },
  {
    skillId: 'p6-volume-edge-height-base-face',
    skillName: 'Volume: Edge, Height, Base Area, Face Area',
    level: 'P6',
    topicId: 'p6-volume',
    prerequisites: ['p6-volume-missing-dimension'],
    questionTypes: ['missing_value', 'word_problem', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['volume_capacity_confusion', 'area_perimeter_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P6 Angles in Figures ──
  {
    skillId: 'p6-angles-composite',
    skillName: 'Unknown Angles in Composite Figures',
    level: 'P6',
    topicId: 'p6-angles',
    prerequisites: ['p5-angles-vertically-opposite', 'p5-shapes-triangles', 'p5-shapes-parallelogram', 'p5-shapes-trapezium'],
    questionTypes: ['geometry_reasoning', 'multi_step', 'exam_style', 'missing_value'],
    difficultyBands: { foundation: '1–4', standard: '4–8', stretch: '8–10' },
    misconceptionTags: ['angle_property_error', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },

  // ── P6 Data Analysis ──
  {
    skillId: 'p6-data-average',
    skillName: 'Average of a Set of Data',
    level: 'P6',
    topicId: 'p6-data-analysis',
    prerequisites: ['p4-data-tables'],
    questionTypes: ['procedural', 'word_problem', 'missing_value', 'multi_step', 'exam_style'],
    difficultyBands: { foundation: '1–3', standard: '4–7', stretch: '7–10' },
    misconceptionTags: ['operation_confusion', 'multi_step_breakdown_error'],
    examRelevance: 'standard',
  },
];

// ─── INDEXES ───

const topicById = new Map(TOPICS.map((t) => [t.topicId, t]));
const skillById = new Map(SKILLS.map((s) => [s.skillId, s]));
const skillsByTopic = new Map();
const topicsByLevel = new Map();
const skillsByLevel = new Map();
const skillsByAlias = new Map();

for (const topic of TOPICS) {
  if (!topicsByLevel.has(topic.level)) topicsByLevel.set(topic.level, []);
  topicsByLevel.get(topic.level).push(topic);
}

for (const skill of SKILLS) {
  if (!skillsByTopic.has(skill.topicId)) skillsByTopic.set(skill.topicId, []);
  skillsByTopic.get(skill.topicId).push(skill);

  if (!skillsByLevel.has(skill.level)) skillsByLevel.set(skill.level, []);
  skillsByLevel.get(skill.level).push(skill);

  if (skill.fractionsSkillAlias) {
    skillsByAlias.set(skill.fractionsSkillAlias, skill);
  }
}

// ─── HELPER FUNCTIONS ───

export function getTopicsByLevel(level) {
  return topicsByLevel.get(level) || [];
}

export function getSkillsByTopic(topicId) {
  return skillsByTopic.get(topicId) || [];
}

export function getSkillById(skillId) {
  return skillById.get(skillId) || null;
}

export function getTopicById(topicId) {
  return topicById.get(topicId) || null;
}

export function getSkillsByLevel(level) {
  return skillsByLevel.get(level) || [];
}

export function getPrerequisites(skillId) {
  const skill = skillById.get(skillId);
  if (!skill) return [];
  return skill.prerequisites.map((id) => skillById.get(id)).filter(Boolean);
}

export function getPrerequisiteTree(skillId, visited = new Set()) {
  if (visited.has(skillId)) return [];
  visited.add(skillId);
  const skill = skillById.get(skillId);
  if (!skill) return [];
  const tree = [];
  for (const preId of skill.prerequisites) {
    const pre = skillById.get(preId);
    if (pre) {
      tree.push(pre);
      tree.push(...getPrerequisiteTree(preId, visited));
    }
  }
  return tree;
}

export function getExamPrepTopics(level) {
  const topics = getTopicsByLevel(level);
  return topics.map((topic) => {
    const skills = getSkillsByTopic(topic.topicId);
    const examSkills = skills.filter((s) => s.examRelevance === 'standard');
    return { ...topic, skills: examSkills, totalSkills: skills.length, examSkillCount: examSkills.length };
  }).filter((t) => t.examSkillCount > 0);
}

export function getWeaknessDrillSkills(level, misconceptionTags = []) {
  const skills = getSkillsByLevel(level);
  if (misconceptionTags.length === 0) return skills;
  const tagSet = new Set(misconceptionTags);
  return skills.filter((s) => s.misconceptionTags.some((t) => tagSet.has(t)));
}

export function getSkillByFractionsAlias(fCode) {
  return skillsByAlias.get(fCode) || null;
}

export function getTopicsByStrand(level, strand) {
  return getTopicsByLevel(level).filter((t) => t.strand === strand);
}

export function getAllLevels() {
  return ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
}

export function getTaxonomyStats() {
  const levels = getAllLevels();
  return levels.map((level) => {
    const topics = getTopicsByLevel(level);
    const skills = getSkillsByLevel(level);
    return { level, topicCount: topics.length, skillCount: skills.length };
  });
}
