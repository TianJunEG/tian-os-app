// ─── Taxonomy → Generator Skill ID Mapping ───
//
// Maps each taxonomy skillId (e.g. 'p1-num-counting-to-10') to one or more
// generator skillIds (e.g. ['P1-NUM-01', 'P1-NUM-02']) from the existing
// procedural question generators in frontend/src/mathpath/primary/.
//
// The generators use a separate, finer-grained ID scheme. A single taxonomy
// skill often maps to multiple generator skills.

const MAP = {
  // ═══ P1 ═══

  // Numbers
  'p1-num-counting-to-10':    ['P1-NUM-01', 'P1-NUM-02'],
  'p1-num-counting-to-20':    ['P1-NUM-03', 'P1-NUM-04'],
  'p1-num-counting-to-100':   ['P1-NUM-05', 'P1-NUM-06', 'P1-NUM-07', 'P1-NUM-08'],
  'p1-num-number-bonds':      ['P1-NUM-09'],
  'p1-num-comparing-ordering': ['P1-NUM-10', 'P1-NUM-11'],
  'p1-num-ordinal-numbers':   ['P1-NUM-16'],

  // Addition & Subtraction
  'p1-add-within-10':         ['P1-ADD-01', 'P1-ADD-03'],
  'p1-sub-within-10':         ['P1-ADD-02', 'P1-ADD-04'],
  'p1-add-within-20':         ['P1-ADD-05'],
  'p1-sub-within-20':         ['P1-ADD-06'],
  'p1-add-sub-within-100':    ['P1-ADD-07', 'P1-ADD-08'],
  'p1-add-sub-word-problems': ['P1-ADD-09', 'P1-ADD-10'],

  // Multiplication & Division
  'p1-mul-equal-groups':      ['P1-EQG-01', 'P1-EQG-02', 'P1-EQG-03'],
  'p1-div-sharing-grouping':  ['P1-EQG-04', 'P1-EQG-05'],

  // Money
  'p1-money-coins-cents':     ['P1-MON-01', 'P1-MON-02', 'P1-MON-03'],
  'p1-money-dollars-to-100':  ['P1-MON-04', 'P1-MON-05', 'P1-MON-06', 'P1-MON-07'],

  // Length
  'p1-length-cm':             ['P1-MEA-01', 'P1-MEA-07'],

  // Time
  'p1-time-telling-to-5min':  ['P1-MEA-05', 'P1-MEA-06'],
  'p1-time-am-pm':            ['P1-MEA-04'],
  'p1-time-duration-hour-half': ['P1-MEA-04'],

  // 2D Shapes
  'p1-shapes-identify-2d':    ['P1-GEO-01', 'P1-GEO-03', 'P1-GEO-07'],
  'p1-shapes-half-quarter-circle': ['P1-GEO-02', 'P1-GEO-04', 'P1-GEO-05', 'P1-GEO-06'],

  // Picture Graphs
  'p1-graph-picture-read':    ['P1-DAT-01', 'P1-DAT-02', 'P1-DAT-03', 'P1-DAT-04', 'P1-DAT-05', 'P1-DAT-06'],

  // ═══ P2 ═══

  // Numbers
  'p2-num-place-value':       ['P2-WN-01', 'P2-WN-05'],
  'p2-num-comparing-ordering': ['P2-WN-02'],
  'p2-num-odd-even':          ['P2-WN-03'],

  // Addition & Subtraction
  'p2-add-3digit':            ['P2-AS-01', 'P2-AS-03'],
  'p2-sub-3digit':            ['P2-AS-02', 'P2-AS-04'],
  'p2-add-sub-word-problems': ['P2-WP-01', 'P2-WP-02'],

  // Multiplication & Division
  'p2-mul-tables-2-3-4-5-10': ['P2-MD-01'],
  'p2-div-within-tables':     ['P2-MD-02'],

  // Fractions
  'p2-frac-of-whole':         ['P2-FR-02'],
  'p2-frac-unit-fractions':   ['P2-FR-02'],
  'p2-frac-like-fractions':   ['P2-FR-01'],
  'p2-frac-comparing-ordering': ['P2-FR-02'],
  'p2-frac-add-sub-like':     ['P2-FR-01'],

  // Money
  'p2-money-dollars-cents':   ['P2-MON-01', 'P2-MON-02'],
  'p2-money-comparing-converting': ['P2-MON-03'],

  // Length, Mass, Volume
  'p2-length-m-cm':           ['P1-MEA-01', 'P1-MEA-02'],
  'p2-mass-g-kg':             ['P1-MEA-02', 'P1-MEA-03'],
  'p2-volume-litres':         ['P1-MEA-03'],

  // Time
  'p2-time-to-minute':        ['P2-TM-01'],
  'p2-time-hours-minutes':    ['P2-TM-01'],

  // Shapes
  'p2-shapes-patterns':       ['P2-GEO-01'],
  'p2-shapes-3d':             ['P2-GEO-01'],

  // Picture Graphs
  'p2-graph-picture-scales':  ['P2-ST-01', 'P2-ST-02'],

  // ═══ P3 ═══

  // Numbers
  'p3-num-place-value':       ['P3-WN-01'],
  'p3-num-comparing-ordering': ['P3-WN-02'],
  'p3-num-number-patterns':   ['P3-WN-03', 'P2-WN-04'],

  // Addition & Subtraction
  'p3-add-sub-4digit':        ['P3-AS-03', 'P3-AS-04'],
  'p3-add-sub-word-problems': ['P3-AS-01', 'P3-AS-02'],

  // Multiplication & Division
  'p3-mul-tables-6-7-8-9':    ['P3-MD-01'],
  'p3-mul-div-algorithms':    ['P3-MD-04', 'P3-MD-05'],
  'p3-div-remainder':         ['P3-MD-03'],
  'p3-mul-div-word-problems': ['P3-WP-01', 'P3-WP-02'],

  // Fractions
  'p3-frac-equivalent':       ['P3-FR-01'],
  'p3-frac-simplest-form':    ['P3-FR-01'],
  'p3-frac-add-sub-related':  ['P3-FR-02'],

  // Money
  'p3-money-add-sub-decimal': ['P3-MON-01', 'P3-MON-02'],

  // Measurement
  'p3-meas-km-m':             ['P3-MT-01'],
  'p3-meas-kg-g':             ['P3-MT-01'],
  'p3-meas-l-ml':             ['P3-MT-01'],
  'p3-meas-compound-units':   ['P3-MT-01'],

  // Time
  'p3-time-seconds':          ['P3-MT-02'],
  'p3-time-start-end-duration': ['P3-MT-04'],
  'p3-time-24hour':           ['P3-MT-03'],

  // Area & Perimeter
  'p3-area-perimeter-concepts': ['P3-AP-01', 'P3-AP-02'],
  'p3-perimeter-rect-sq':    ['P3-AP-02'],
  'p3-perimeter-rectilinear': ['P3-AP-02'],
  'p3-area-rect-sq':         ['P3-AP-01'],

  // Angles
  'p3-angles-concept':       [],
  'p3-right-angles':         [],
  'p3-perpendicular-parallel': [],

  // Bar Graphs
  'p3-graph-bar':            ['P3-ST-01', 'P3-ST-02'],

  // ═══ P4 ═══

  // Numbers
  'p4-num-place-value':       ['P4-WN-01'],
  'p4-num-rounding':          ['P4-WN-04'],
  'p4-num-number-patterns':   ['P4-WN-03'],

  // Factors & Multiples
  'p4-factors-multiples':     ['P4-FM-01', 'P4-FM-02'],
  'p4-common-factors-multiples': ['P4-FM-01', 'P4-FM-02'],

  // Multiplication & Division
  'p4-mul-4digit-by-1':      ['P4-FO-01'],
  'p4-mul-3digit-by-2':      ['P4-FO-02'],
  'p4-div-4digit-by-1':      ['P4-FO-03'],
  'p4-mul-div-word-problems': ['P4-WP-01', 'P4-WP-02'],

  // Fractions
  'p4-frac-mixed-improper':   ['P4-FR-01'],
  'p4-frac-of-set':           ['P4-FR-02'],
  'p4-frac-add-sub-unlike':   ['P4-FR-03'],
  'p4-frac-word-problems':    ['P4-WP-01'],

  // Decimals
  'p4-dec-place-value':       ['P4-DEC-01'],
  'p4-dec-comparing-ordering': ['P4-DEC-02'],
  'p4-dec-frac-conversion':   ['P4-DEC-06'],
  'p4-dec-rounding':          ['P4-DEC-03'],
  'p4-dec-add-sub':           ['P4-DEC-04'],
  'p4-dec-mul-div-1digit':    ['P4-DEC-05'],
  'p4-dec-division-quotient': ['P4-DEC-05'],

  // Area & Perimeter
  'p4-area-perimeter-composite': ['P3-AP-01', 'P3-AP-02'],
  'p4-area-perimeter-missing-side': ['P3-AP-01', 'P3-AP-02'],

  // Angles
  'p4-angles-measuring-drawing': [],

  // Shapes & Symmetry
  'p4-shapes-rect-sq-properties': [],
  'p4-line-symmetry':         [],
  'p4-nets-of-solids':        [],

  // Data Analysis
  'p4-data-tables':           ['P4-ST-01'],
  'p4-data-line-graphs':      ['P4-ST-01'],
  'p4-data-pie-charts':       ['P4-ST-02'],

  // ═══ P5 ═══

  // Numbers
  'p5-num-place-value':       ['P5-WN-01'],
  'p5-num-order-of-operations': ['P5-WN-03'],
  'p5-num-brackets':          ['P5-WN-03'],
  'p5-num-mul-div-10-100-1000': ['P5-WN-02'],

  // Fractions
  'p5-frac-division':         ['P5-FR-01'],
  'p5-frac-as-decimals':      ['P5-DEC-03'],
  'p5-frac-four-operations':  ['P5-FR-01', 'P5-FR-02', 'P5-FR-03'],
  'p5-frac-mul-proper-improper-mixed': ['P5-FR-03'],
  'p5-frac-div-appropriate':  ['P5-FR-03'],
  'p5-frac-word-problems':    ['P5-WP-01', 'P5-WP-02'],

  // Decimals
  'p5-dec-mul-div-10-100-1000': ['P5-DEC-01', 'P5-DEC-02'],
  'p5-dec-measurement-conversion': ['P5-DEC-01'],

  // Percentage
  'p5-pct-concept':           ['P5-PCT-01'],
  'p5-pct-of-whole':          ['P5-PCT-02'],
  'p5-pct-discount':          ['P5-PCT-03'],
  'p5-pct-gst':               ['P5-PCT-03'],
  'p5-pct-annual-interest':   ['P5-PCT-03'],

  // Rate
  'p5-rate-concept':          ['P5-WP-03'],
  'p5-rate-total-units':      ['P5-WP-03'],

  // Area & Volume
  'p5-area-triangle':         ['P5-AV-01'],
  'p5-area-composite':        ['P5-AV-03'],
  'p5-volume-cube-cuboid':    ['P5-AV-02'],
  'p5-volume-liquid':         ['P5-AV-02'],
  'p5-volume-litres-ml-cm3':  ['P5-AV-02'],

  // Angles
  'p5-angles-straight-line':  ['P5-GEO-01'],
  'p5-angles-at-point':       ['P5-GEO-01'],
  'p5-angles-vertically-opposite': ['P5-GEO-01'],

  // Shapes
  'p5-shapes-triangles':      ['P5-GEO-02'],
  'p5-shapes-parallelogram':  ['P5-GEO-03'],
  'p5-shapes-rhombus':        ['P5-GEO-03'],
  'p5-shapes-trapezium':      ['P5-GEO-03'],

  // ═══ P6 ═══

  // Fractions
  'p6-frac-proper-div-whole': ['P6-FR-01'],
  'p6-frac-whole-div-proper': ['P6-FR-01'],
  'p6-frac-proper-div-proper': ['P6-FR-01'],
  'p6-frac-division-word-problems': ['P6-FR-02', 'P6-FR-03'],

  // Percentage
  'p6-pct-whole-from-part':   ['P6-PCT-01'],
  'p6-pct-increase-decrease': ['P6-PCT-01', 'P6-PCT-02', 'P6-PCT-03'],

  // Ratio
  'p6-ratio-notation':        ['P6-RAT-01'],
  'p6-ratio-equivalent':      ['P6-RAT-01'],
  'p6-ratio-simplest':        ['P6-RAT-01'],
  'p6-ratio-divide-quantity': ['P6-RAT-02'],
  'p6-ratio-missing-term':   ['P6-RAT-02'],
  'p6-ratio-fraction-relationship': ['P6-RAT-03'],

  // Algebra
  'p6-alg-unknowns':          ['P6-ALG-01'],
  'p6-alg-simple-expressions': ['P6-ALG-01'],
  'p6-alg-simplifying':       ['P6-ALG-01'],
  'p6-alg-substitution':      ['P6-ALG-02'],
  'p6-alg-linear-equations':  ['P6-ALG-02', 'P6-ALG-03'],

  // Circles
  'p6-circle-area-circumference': ['P6-CIR-01', 'P6-CIR-02'],
  'p6-circle-semicircle-quarter': ['P6-CIR-01', 'P6-CIR-02'],
  'p6-circle-composite':      ['P6-CIR-03'],

  // Volume
  'p6-volume-missing-dimension': ['P6-AV-01', 'P6-AV-02'],
  'p6-volume-edge-height-base-face': ['P6-AV-02', 'P6-AV-03'],

  // Angles
  'p6-angles-composite':      ['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03'],

  // Data Analysis
  'p6-data-average':          ['P6-DA-01', 'P6-DA-02'],
};

export function getGeneratorSkillIds(taxonomySkillId) {
  return MAP[taxonomySkillId] || [];
}

export function getGeneratorFile(generatorSkillId) {
  const m = generatorSkillId.match(/^(P\d)-([A-Z]+)-/);
  if (!m) return null;
  const level = m[1].toLowerCase();
  const domain = m[2];
  const DOMAIN_FILE = {
    P1: { NUM: 'Numbers', ADD: 'AddSub', EQG: 'EqualGroups', MON: 'Money', MEA: 'Measurement', GEO: 'Geometry', DAT: 'Data' },
    P2: { WN: 'WholeNumbers', AS: 'AddSub', MD: 'MulDiv', FR: 'Fractions', MON: 'Money', TM: 'Time', GEO: 'Geo', ST: 'Stat', WP: 'WordProb' },
    P3: { WN: 'WholeNumbers', AS: 'AddSub', MD: 'MulDiv', FR: 'Fractions', MON: 'Money', MT: 'MeasTime', AP: 'AreaPerim', ST: 'Stat', WP: 'WordProb' },
    P4: { WN: 'WholeNumbers', FM: 'FactorsMultiples', FO: 'FourOps', FR: 'Fractions', DEC: 'Decimals', ST: 'Stat', WP: 'WordProb' },
    P5: { WN: 'WholeNumbers', FR: 'Fractions', DEC: 'Decimals', PCT: 'Percentage', RAT: 'Ratio', AV: 'AreaVol', GEO: 'Geometry', ST: 'Stat', WP: 'WordProb' },
    P6: { FR: 'Fractions', PCT: 'Percentage', RAT: 'Ratio', ALG: 'Algebra', CIR: 'Circles', AV: 'AreaVol', GEO: 'Geometry', DA: 'DataAnalysis', SPD: 'Speed' },
  };
  const name = DOMAIN_FILE[m[1]]?.[domain];
  if (!name) return null;
  return `${level}${name[0].toUpperCase() + name.slice(1)}QuestionGenerator`;
}

export function hasCoverage(taxonomySkillId) {
  const ids = MAP[taxonomySkillId];
  return Array.isArray(ids) && ids.length > 0;
}

export function getCoverageStats() {
  const total = Object.keys(MAP).length;
  const covered = Object.values(MAP).filter(ids => ids.length > 0).length;
  const uncovered = Object.entries(MAP).filter(([, ids]) => ids.length === 0).map(([k]) => k);
  return { total, covered, uncovered, coveragePercent: Math.round((covered / total) * 100) };
}
