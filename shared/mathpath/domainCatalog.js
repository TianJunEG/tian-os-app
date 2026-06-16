// MathPath domain catalog — single source of truth for the 18 Singapore Primary
// Mathematics domains. Consumed by:
//   • services/domains/domainRegistry.js  (capability registration)
//   • blueprints / test-generation          (levelRange, examRelevance)
//   • working-evidence gating              (workingEvidence)
//   • frontend navigation                  (displayName, strands)
//
// Capability statuses (per adapter):
//   'available'    — live in production
//   'engine_ready' — logic built + validated; DB session / UI pending
//   'planned'      — not yet built
//
// Working-evidence values:
//   'required'     — student MUST submit working for full credit
//   'optional'     — encouraged but not enforced
//   'not_needed'   — fluency/mental-math surface; no working expected
//
// Model-drawing: whether the domain's remediation/story surfaces a bar/visual model.
// Story mode   : 'live' | 'planned' | 'not_applicable'
// Exam relevance: 'very_high' | 'high' | 'medium' | 'low'

// ── Fractions alias map (slug ↔ F-code) ─────────────────────────────────────
// Source: scripts/domains/fractions.js  FRACTIONS_FRAMEWORK_CODES
// Kept here so any module can bridge slug ↔ F-code without importing the full
// domain seed file.
export const FRACTIONS_SLUG_TO_CODE = {
  'fr.meaning.parts':     'F001',
  'fr.meaning.num-den':   'F002',
  'fr.meaning.whole':     'F003',
  'fr.meaning.unit':      'F004',
  'fr.meaning.number-line': 'F005',
  'fr.compare.unit':      'F006',
  'fr.compare.same-denom':'F007',
  'fr.compare.same-num':  'F008',
  'fr.order':             'F009',
  'fr.equivalent':        'F010',
  'fr.equivalent.generate':'F011',
  'fr.simplify':          'F012',
  'fr.mixed-improper':    'F013',
  'fr.mixed-proper':      'F014',
  'fr.mixed-convert':     'F015',
  'fr.add.same-denom':    'F016',
  'fr.sub.like':          'F017',
  'fr.add.unlike':        'F018',
  'fr.sub.unlike':        'F019',
  'fr.of-quantity':       'F020',
  'fr.mult.fraction':     'F021',
  'fr.div.fraction':      'F022',
  'fr.word-problems':     'F023',
  'fr.word-multi-step':   'F024',
  'fr.exam-applications': 'F025',
  'fr.mastery-challenge': 'F026',
};
export const FRACTIONS_CODE_TO_SLUG = Object.fromEntries(
  Object.entries(FRACTIONS_SLUG_TO_CODE).map(([s, c]) => [c, s])
);

// ── Decimals alias map (slug ↔ D-code) ───────────────────────────────────────
// Source: scripts/domains/decimals.js  DECIMALS_FRAMEWORK_CODES
export const DECIMALS_SLUG_TO_CODE = {
  'dec.place-value':    'D001',
  'dec.number-line':    'D002',
  'dec.compare':        'D003',
  'dec.order':          'D004',
  'dec.round':          'D005',
  'dec.add-sub':        'D006',
  'dec.x-div-10-100':   'D007',
  'dec.mult-whole':     'D008',
  'dec.mult-decimal':   'D009',
  'dec.div-whole':      'D010',
  'dec.div-decimal':    'D011',
  'dec.to-fraction':    'D012',
  'dec.from-fraction':  'D013',
  'dec.measure-convert':'D014',
};
export const DECIMALS_CODE_TO_SLUG = Object.fromEntries(
  Object.entries(DECIMALS_SLUG_TO_CODE).map(([s, c]) => [c, s])
);

// ── Heuristic tag vocabulary ─────────────────────────────────────────────────
// Applied to Question.heuristic. PSL already has seed templates for those marked ✓.
export const HEURISTIC_TAGS = [
  'part_whole',            // bar model: identify part vs whole
  'comparison',            // compare two quantities
  'before_after',          // ✓ PSL seed: state before and after change
  'units_and_parts',       // divide total into equal units
  'model_drawing',         // ✓ PSL: draw a bar/model to represent the problem
  'working_backwards',     // ✓ PSL: start from result, reverse operations
  'guess_and_check',       // ✓ PSL: systematic trial and refinement
  'systematic_listing',    // list outcomes methodically
  'pattern_finding',       // ✓ PSL: identify and extend a pattern
  'excess_shortage',       // ✓ PSL: when you give too much or too little
  'rate_table',            // organise rate/speed data in a table
  'ratio_model',           // ✓ PSL: bar model for ratio problems
  'percentage_bar_model',  // bar model adapted for percentage
  'multi_step_reasoning',  // chain multiple operations across conditions
];

// ── Global misconception tag set ─────────────────────────────────────────────
// Aligns with the per-domain tags in misconceptionTags arrays. Fractions keeps
// its M001–M013 codes as aliases; all other domains use these slugs directly.
export const MISCONCEPTION_TAGS = [
  // Number sense / whole numbers
  'place_value_error',
  'factor_multiple_confusion',
  'rounding_error',
  // Four operations
  'operation_confusion',
  'regrouping_error',
  'multiplication_fact_gap',
  'division_remainder_error',
  'order_of_operations_error',
  // Fractions (F-domain; aliased to M001–M013 locally)
  'fraction_whole_confusion',       // M001
  'numerator_denominator_confusion',// M003
  'unlike_denominator_error',       // M007
  'mixed_improper_confusion',       // M006
  'fraction_of_set_error',
  // Decimals
  'decimal_place_value_error',
  'decimal_alignment_error',
  // Percentage
  'percentage_base_error',
  'discount_gst_confusion',
  // Ratio & Rate
  'ratio_part_whole_confusion',
  'ratio_unchanged_quantity_error',
  // Algebra
  'algebra_unknown_confusion',
  'equation_balance_error',
  // Measurement / Time / Money
  'unit_conversion_error',
  'time_duration_error',
  'money_decimal_error',
  // Geometry / Area / Volume
  'area_perimeter_confusion',
  'volume_capacity_confusion',
  'angle_property_error',
  'circle_formula_confusion',
  // Statistics
  'graph_reading_error',
  'average_concept_error',
  // Cross-cutting
  'careless_copying',
  'multi_step_breakdown_error',
];

// ── Domain catalog ────────────────────────────────────────────────────────────
// Ordered by curriculum sequence (P0 → P3 priority noted in comments).
export const DOMAIN_CATALOG = [
  // ── Core Number & Algebra ─────────────────────────────────────────────────

  {
    domainId: 'whole_numbers',
    displayName: 'Whole Numbers',
    subjectId: 'math',
    levelRange: 'P1–P6',
    topicOrder: 0,
    strands: ['counting', 'place value', 'compare & order', 'rounding', 'factors & multiples', 'negative numbers'],
    prerequisites: [],
    questionTypes: ['mcq', 'short_answer', 'fill_blank', 'number_line', 'place_value_blocks'],
    misconceptionTags: ['place_value_error', 'factor_multiple_confusion', 'rounding_error', 'careless_copying'],
    examRelevance: 'high',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P0',
    capabilities: {
      diagnostic: 'engine_ready', // wholeNumbersDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'planned',        // GATED: NumberSenseQuestionGenerator.js is a stub (emits "Compute: a+b"). See MATHPATH_QUESTION_QUALITY_AUDIT.md / stubDomainGate.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/numberSense.js (23 skills)
    },
    skillGraphFile: 'scripts/domains/numberSense.js',
    notes: 'DB-free diagnostic adapter registered (engine_ready); session runtime + UI pending (Step 3).',
  },

  {
    domainId: 'four_operations',
    displayName: 'Four Operations',
    subjectId: 'math',
    levelRange: 'P1–P6',
    topicOrder: 1,
    strands: ['addition', 'subtraction', 'multiplication', 'division', 'order of operations', 'mental strategies'],
    prerequisites: ['whole_numbers'],
    questionTypes: ['mcq', 'short_answer', 'fill_blank', 'vertical_algorithm'],
    misconceptionTags: ['regrouping_error', 'multiplication_fact_gap', 'division_remainder_error', 'order_of_operations_error', 'operation_confusion', 'careless_copying'],
    examRelevance: 'high',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P0',
    capabilities: {
      diagnostic: 'engine_ready', // fourOperationsDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // rebuilt: OperationsQuestionGenerator.js (real per-skill +−×÷, long division, order of ops, HCF/LCM, bar models). See MATHPATH_QUESTION_QUALITY_AUDIT.md
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/operations.js (24 skills)
    },
    skillGraphFile: 'scripts/domains/operations.js',
    notes: 'DB-free diagnostic adapter registered (engine_ready); session runtime + UI pending (Step 3). Fluency drills cross-cut via mental_math_fluency.',
  },

  {
    domainId: 'fractions',
    displayName: 'Fractions',
    subjectId: 'math',
    levelRange: 'P2–P6',
    topicOrder: 2,
    strands: ['meaning', 'comparing & ordering', 'equivalence', 'mixed & improper', 'operations (+−×÷)', 'fraction of quantity', 'word problems'],
    prerequisites: ['whole_numbers', 'four_operations'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'visual_model', 'word_problem'],
    misconceptionTags: ['fraction_whole_confusion', 'numerator_denominator_confusion', 'unlike_denominator_error', 'mixed_improper_confusion', 'fraction_of_set_error'],
    examRelevance: 'very_high',
    workingEvidence: 'required',
    modelDrawing: true,
    storyMode: 'live',         // fractionStoryModeEngine.js (F025–F026)
    priority: 'P0',
    capabilities: {
      diagnostic: 'available', // fractionsDiagnosticDomain.js — adaptive F001–F026
      practice: 'available',   // fractionPracticeEngine.js + fractionQuestionGenerator.js
      assignment: 'available',
      worksheet: 'available',
      paperAnalysis: 'available',
      intervention: 'available',
      skillGraph: 'available', // shared/mathpath/fractions/fractionSkillGraph.js (F001–F026)
    },
    skillGraphFile: 'shared/mathpath/fractions/fractionSkillGraph.js',
    frameworkCodes: FRACTIONS_SLUG_TO_CODE,
    notes: 'Mature — do not overwrite F001–F026. Mapping-audit drift flagged in FRACTIONS_SKILL_MAPPING_AUDIT.md. 107/260 questions flagged by fractions-audit.mjs.',
  },

  {
    domainId: 'decimals',
    displayName: 'Decimals',
    subjectId: 'math',
    levelRange: 'P4–P6',
    topicOrder: 3,
    strands: ['place value', 'compare & order', 'operations (+−×÷)', 'rounding', 'fraction↔decimal conversion', 'measurement conversions'],
    prerequisites: ['fractions', 'whole_numbers'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'number_line'],
    misconceptionTags: ['decimal_place_value_error', 'decimal_alignment_error', 'careless_copying'],
    examRelevance: 'very_high',
    workingEvidence: 'required',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'engine_ready', // decimalsDiagnosticDomain.js; DB session runtime + UI pending
      practice: 'available',      // decimalsPracticeEngine.js + rule-based generator
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // shared/mathpath/decimals/decimalsSkillGraph.js (D001–D014)
    },
    skillGraphFile: 'shared/mathpath/decimals/decimalsSkillGraph.js',
    frameworkCodes: DECIMALS_SLUG_TO_CODE,
    notes: 'Second most mature domain. Priority: wire DB session runtime + UI to unlock diagnostic.',
  },

  {
    domainId: 'percentage',
    displayName: 'Percentage',
    subjectId: 'math',
    levelRange: 'P5–P6',
    topicOrder: 4,
    strands: ['meaning (per hundred)', '%↔fraction↔decimal', '% of quantity', 'percentage increase/decrease', 'discount & GST', 'simple interest'],
    prerequisites: ['fractions', 'decimals', 'ratio'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'word_problem', 'percentage_bar'],
    misconceptionTags: ['percentage_base_error', 'discount_gst_confusion', 'careless_copying'],
    examRelevance: 'very_high',
    workingEvidence: 'required',
    modelDrawing: true,          // hundred-grid + bar model
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'engine_ready', // percentageDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // templates in scripts/domains/percentage.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/percentage.js (10 skills)
    },
    skillGraphFile: 'scripts/domains/percentage.js',
    notes: 'DB-free diagnostic adapter registered (engine_ready); session runtime + UI pending (Step 3). KaTeX rendering required for some stems.',
  },

  {
    domainId: 'ratio',
    displayName: 'Ratio',
    subjectId: 'math',
    levelRange: 'P5–P6',
    topicOrder: 5,
    strands: ['meaning', 'equivalent ratios', 'simplifying ratios', 'ratio↔fraction', 'dividing in a ratio', 'changing ratios', 'unchanged-quantity problems'],
    prerequisites: ['fractions', 'four_operations'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'word_problem', 'ratio_model'],
    misconceptionTags: ['ratio_part_whole_confusion', 'ratio_unchanged_quantity_error', 'careless_copying'],
    examRelevance: 'very_high',
    workingEvidence: 'required',
    modelDrawing: true,          // bar model / ratio table
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'engine_ready', // ratioDiagnosticDomain.js — filters ratioRate.js skills by RATIO_SLUGS
      practice: 'available',      // templates in scripts/domains/ratioRate.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/ratioRate.js + frontend/src/mathpath/primary/p6RatioSkillGraph.js
    },
    skillGraphFile: 'scripts/domains/ratioRate.js',
    notes: 'Ratio & Rate split from ratioRate.js in Step 4. ratioDiagnosticDomain.js filters by RATIO_SLUGS.',
  },

  {
    domainId: 'rate',
    displayName: 'Rate',
    subjectId: 'math',
    levelRange: 'P5–P6',
    topicOrder: 6,
    strands: ['rate as quantity-per-unit', 'speed / distance / time', 'unit rate', 'rate tables', 'average speed'],
    prerequisites: ['ratio', 'four_operations', 'decimals'],
    questionTypes: ['short_answer', 'numeric', 'word_problem', 'rate_table'],
    misconceptionTags: ['unit_conversion_error', 'careless_copying'],
    examRelevance: 'high',
    workingEvidence: 'required',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'engine_ready', // rateDiagnosticDomain.js — filters ratioRate.js skills by RATE_SLUGS
      practice: 'available',      // folded into ratioRate.js templates
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // rate skills inside scripts/domains/ratioRate.js
    },
    skillGraphFile: 'scripts/domains/ratioRate.js',
    notes: 'Split from ratioRate.js in Step 4. rateDiagnosticDomain.js filters by RATE_SLUGS.',
  },

  {
    domainId: 'algebra',
    displayName: 'Algebra',
    subjectId: 'math',
    levelRange: 'P5–P6',
    topicOrder: 7,
    strands: ['unknowns in arithmetic', 'using a letter', 'algebraic notation', 'forming expressions', 'simplifying expressions', 'substitution', 'one- and two-step equations'],
    prerequisites: ['four_operations', 'fractions'],
    questionTypes: ['mcq', 'short_answer', 'numeric'],
    misconceptionTags: ['algebra_unknown_confusion', 'equation_balance_error', 'careless_copying'],
    examRelevance: 'high',
    workingEvidence: 'required',
    modelDrawing: true,          // balance model + bar model
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'planned',
      practice: 'available',     // templates in scripts/domains/algebra.js (KaTeX)
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',   // scripts/domains/algebra.js (111 LOC, KaTeX render)
    },
    skillGraphFile: 'scripts/domains/algebra.js',
    notes: 'KaTeX rendering required (render:"katex" on skills). Balance/bar visual models in algebra.js.',
  },

  // ── Measurement & Geometry ─────────────────────────────────────────────────

  {
    domainId: 'money',
    displayName: 'Money',
    subjectId: 'math',
    levelRange: 'P1–P4',
    topicOrder: 8,
    strands: ['coins & notes', 'counting money', 'making change', 'money in decimals', 'money word problems'],
    prerequisites: ['whole_numbers', 'four_operations', 'decimals'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'word_problem'],
    misconceptionTags: ['money_decimal_error', 'careless_copying'],
    examRelevance: 'medium',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'engine_ready', // moneyDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // rebuilt: MoneyQuestionGenerator.js (integer-cents, misconception distractors, bar-model diagrams). See MATHPATH_QUESTION_QUALITY_AUDIT.md
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/money.js
    },
    skillGraphFile: 'scripts/domains/money.js',
    notes: 'Authored in Step 4. mon.coins-notes (P1) → mon.word-problems (P4). mon.total-cost prereqs constrained to P1/P2.',
  },

  {
    domainId: 'time',
    displayName: 'Time',
    subjectId: 'math',
    levelRange: 'P1–P5',
    topicOrder: 9,
    strands: ['telling time', 'reading clocks (12h & 24h)', 'duration', 'time word problems', 'timetables'],
    prerequisites: ['whole_numbers', 'four_operations'],
    questionTypes: ['mcq', 'short_answer', 'clock_diagram', 'word_problem'],
    misconceptionTags: ['time_duration_error', 'unit_conversion_error', 'careless_copying'],
    examRelevance: 'medium',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'engine_ready', // timeDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // rebuilt: TimeQuestionGenerator.js (minutes-since-midnight, real elapsed-time, 12/24h, clock diagrams). See MATHPATH_QUESTION_QUALITY_AUDIT.md
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/time.js
    },
    skillGraphFile: 'scripts/domains/time.js',
    notes: 'Carved out of measurement.js in Step 4. tim.tell-hour (P1) → tim.duration (P5). Clock diagram type in diagramSpecSchema.',
  },

  {
    domainId: 'measurement',
    displayName: 'Measurement',
    subjectId: 'math',
    levelRange: 'P2–P6',
    topicOrder: 10,
    strands: ['length', 'mass', 'volume (capacity)', 'units & conversion', 'comparing & estimating'],
    prerequisites: ['whole_numbers', 'four_operations', 'decimals'],
    questionTypes: ['mcq', 'short_answer', 'numeric', 'length_measurement_diagram'],
    misconceptionTags: ['unit_conversion_error', 'careless_copying'],
    examRelevance: 'medium',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'planned',
      practice: 'planned',       // GATED: MeasurementQuestionGenerator.js is a stub (emits "Compute: a+b"). See MATHPATH_QUESTION_QUALITY_AUDIT.md / stubDomainGate.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',   // scripts/domains/measurement.js (131 LOC)
    },
    skillGraphFile: 'scripts/domains/measurement.js',
    notes: 'Excludes time (separate domain). Area/perimeter and volume are separate domains.',
  },

  {
    domainId: 'area_perimeter',
    displayName: 'Area & Perimeter',
    subjectId: 'math',
    levelRange: 'P3–P6',
    topicOrder: 11,
    strands: ['perimeter', 'area of rectangle & square', 'area of triangle', 'composite figures', 'area of parts'],
    prerequisites: ['measurement', 'four_operations', 'geometry'],
    questionTypes: ['short_answer', 'numeric', 'diagram', 'word_problem'],
    misconceptionTags: ['area_perimeter_confusion', 'unit_conversion_error', 'multi_step_breakdown_error'],
    examRelevance: 'high',
    workingEvidence: 'required',
    modelDrawing: true,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'engine_ready', // areaPerimeterDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // scripts/domains/areaPerimeter.js (6 skills)
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/areaPerimeter.js
    },
    skillGraphFile: 'scripts/domains/areaPerimeter.js',
    notes: 'Authored in Step 4. ap.perimeter-rect (P3) → ap.area-composite (P6). ap.perimeter-composite is figureDependent.',
  },

  {
    domainId: 'volume',
    displayName: 'Volume',
    subjectId: 'math',
    levelRange: 'P4–P6',
    topicOrder: 12,
    strands: ['volume of cube & cuboid', 'capacity', 'liquid in containers/tanks', 'volume↔capacity conversion', 'rate of flow'],
    prerequisites: ['measurement', 'area_perimeter', 'decimals'],
    questionTypes: ['short_answer', 'numeric', 'cube_stack_diagram', 'word_problem'],
    misconceptionTags: ['volume_capacity_confusion', 'unit_conversion_error', 'multi_step_breakdown_error'],
    examRelevance: 'high',
    workingEvidence: 'required',
    modelDrawing: true,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'engine_ready', // volumeDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // scripts/domains/volume.js (4 skills)
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/volume.js
    },
    skillGraphFile: 'scripts/domains/volume.js',
    notes: 'Authored in Step 4. vol.unit-cubes (P5) → vol.water-rate (P6). cube_stack diagram type in diagramSpecSchema. Tank problems require heuristic:model_drawing.',
  },

  {
    domainId: 'geometry',
    displayName: 'Geometry',
    subjectId: 'math',
    levelRange: 'P1–P6',
    topicOrder: 13,
    strands: ['2D shapes', '3D shapes & nets', 'properties of shapes', 'angles', 'parallel & perpendicular', 'symmetry'],
    prerequisites: ['whole_numbers'],
    questionTypes: ['mcq', 'short_answer', 'angle_diagram', 'shape_library'],
    misconceptionTags: ['angle_property_error', 'careless_copying'],
    examRelevance: 'medium',
    workingEvidence: 'optional',
    modelDrawing: true,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'planned',
      practice: 'planned',       // GATED: GeometryQuestionGenerator.js is a stub (emits "Compute: a+b"). See MATHPATH_QUESTION_QUALITY_AUDIT.md / stubDomainGate.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',   // scripts/domains/geometry.js (197 LOC, figureDependent skills)
    },
    skillGraphFile: 'scripts/domains/geometry.js',
    notes: 'figureDependent:true on most skills. 21 diagram types available in diagramSpecSchema.',
  },

  {
    domainId: 'circles',
    displayName: 'Circles',
    subjectId: 'math',
    levelRange: 'P6',
    topicOrder: 14,
    strands: ['radius & diameter', 'circumference', 'area of a circle', 'semicircle & quadrant', 'composite figures with circles'],
    prerequisites: ['area_perimeter', 'fractions', 'decimals'],
    questionTypes: ['short_answer', 'numeric', 'diagram', 'word_problem'],
    misconceptionTags: ['circle_formula_confusion', 'unit_conversion_error', 'multi_step_breakdown_error'],
    examRelevance: 'high',
    workingEvidence: 'required',
    modelDrawing: true,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'engine_ready', // circlesDiagnosticDomain.js via genericDiagnosticAdapterFactory
      practice: 'available',      // scripts/domains/circles.js (4 skills)
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',    // scripts/domains/circles.js
    },
    skillGraphFile: 'scripts/domains/circles.js',
    notes: 'Authored in Step 4. cir.parts → cir.semi-quarter (all P6). π = 3.14 per MOE convention.',
  },

  // ── Data & Thinking ───────────────────────────────────────────────────────

  {
    domainId: 'statistics',
    displayName: 'Statistics',
    subjectId: 'math',
    levelRange: 'P2–P6',
    topicOrder: 15,
    strands: ['tables', 'picture graphs', 'bar graphs', 'line graphs', 'pie charts', 'average (mean)'],
    prerequisites: ['whole_numbers', 'four_operations'],
    questionTypes: ['mcq', 'short_answer', 'graph_reading', 'table'],
    misconceptionTags: ['graph_reading_error', 'average_concept_error', 'careless_copying'],
    examRelevance: 'medium',
    workingEvidence: 'optional',
    modelDrawing: false,
    storyMode: 'planned',
    priority: 'P2',
    capabilities: {
      diagnostic: 'planned',
      practice: 'available',     // templates in scripts/domains/statistics.js
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'planned',
      skillGraph: 'available',   // scripts/domains/statistics.js (76 LOC, figureDependent)
    },
    skillGraphFile: 'scripts/domains/statistics.js',
    notes: 'All skills are figureDependent. pie_chart and line_graph diagram types available.',
  },

  {
    domainId: 'word_problems_heuristics',
    displayName: 'Word Problems & Heuristics',
    subjectId: 'math',
    levelRange: 'P1–P6',
    topicOrder: 16,
    strands: ['part-whole', 'comparison', 'before & after', 'model drawing', 'working backwards', 'guess & check', 'patterns', 'excess & shortage', 'rate & ratio models', 'multi-step reasoning'],
    prerequisites: [],           // cross-domain — prereqs are per problem's mathDomain
    questionTypes: ['word_problem', 'multi_step', 'model_drawing'],
    misconceptionTags: ['multi_step_breakdown_error', 'careless_copying'],
    examRelevance: 'very_high',
    workingEvidence: 'required',
    modelDrawing: true,
    storyMode: 'planned',
    priority: 'P1',
    capabilities: {
      diagnostic: 'available',   // PSL session flow in services/psl/
      practice: 'available',     // PSL problemGenerator + stepEvaluator
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'planned',
      intervention: 'available', // PSL hintGenerator
      skillGraph: 'available',   // PSL skill seeds (seedPSL*.js)
    },
    skillGraphFile: 'scripts/seedPSLSkills.js',
    notes: 'Cross-domain layer — a question carries both mathDomain and heuristic tags. PSL is the guided teaching engine. Seed templates exist for 8 of 14 heuristic tags.',
  },

  {
    domainId: 'mental_math_fluency',
    displayName: 'Mental Math & Fluency',
    subjectId: 'math',
    levelRange: 'P1–P6',
    topicOrder: 17,
    strands: ['number bonds', 'times tables', 'mental addition & subtraction', 'mental multiplication & division', 'speed drills'],
    prerequisites: [],           // cross-cutting; skills live inside each core domain
    questionTypes: ['fluency_drill'],
    misconceptionTags: ['multiplication_fact_gap', 'careless_copying'],
    examRelevance: 'low',
    workingEvidence: 'not_needed',
    modelDrawing: false,
    storyMode: 'not_applicable',
    priority: 'P3',
    capabilities: {
      diagnostic: 'not_applicable',
      practice: 'available',     // fluency adapters + timed drills per-domain
      assignment: 'planned',
      worksheet: 'planned',
      paperAnalysis: 'not_applicable',
      intervention: 'not_applicable',
      skillGraph: 'not_applicable', // fluency targets on individual skills; not a separate graph
    },
    skillGraphFile: null,
    notes: 'Cross-cutting — fluency drills are generated per-domain via each domain\'s fluency adapter. Not a standalone domain in the registry.',
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getDomainById(domainId) {
  return DOMAIN_CATALOG.find((d) => d.domainId === domainId) ?? null;
}

export function getDomainsForPriority(priority) {
  return DOMAIN_CATALOG.filter((d) => d.priority === priority);
}

export function getDomainsForLevel(level) {
  // level: 'P1'–'P6'. Returns domains whose levelRange includes that year.
  const n = parseInt(level.replace('P', ''), 10);
  if (!n) return [];
  return DOMAIN_CATALOG.filter((d) => {
    const m = d.levelRange.match(/P(\d+)[–-]P(\d+)/);
    if (!m) {
      const single = d.levelRange.match(/P(\d+)/);
      return single ? parseInt(single[1], 10) === n : false;
    }
    return n >= parseInt(m[1], 10) && n <= parseInt(m[2], 10);
  });
}

export function getFrameworkCode(domainId, slug) {
  const domain = getDomainById(domainId);
  return domain?.frameworkCodes?.[slug] ?? null;
}

export function getSlugForCode(domainId, code) {
  const domain = getDomainById(domainId);
  if (!domain?.frameworkCodes) return null;
  return Object.entries(domain.frameworkCodes).find(([, c]) => c === code)?.[0] ?? null;
}

export default DOMAIN_CATALOG;
