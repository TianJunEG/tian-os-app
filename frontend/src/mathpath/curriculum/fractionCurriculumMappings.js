import {
  fractionUniversalSkills,
  getUniversalSkillByFrameworkId,
} from './fractionUniversalSkills.js';

const LEVEL_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1'];
const LEVEL_ALIASES = {
  PRIMARY1: 'P1',
  PRIMARY2: 'P2',
  PRIMARY3: 'P3',
  PRIMARY4: 'P4',
  PRIMARY5: 'P5',
  PRIMARY6: 'P6',
  SEC1: 'S1',
  S1G1: 'S1',
  SECONDARY1: 'S1',
  'SECONDARY 1': 'S1',
};

function parseLevels(value) {
  return String(value || '')
    .split('/')
    .map((part) => {
      const raw = String(part || '').trim().toUpperCase();
      if (LEVEL_ORDER.includes(raw)) return raw;
      const compact = raw.replace(/[^A-Z0-9]/g, '');
      return LEVEL_ALIASES[compact] || null;
    })
    .filter((part) => LEVEL_ORDER.includes(part));
}

function buildLevelBand(introducedLevel, masteryLevel) {
  const introduced = parseLevels(introducedLevel);
  const mastery = parseLevels(masteryLevel);
  const all = [...new Set([...introduced, ...mastery])];
  return all.sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

const SG_BASE = {
  country: 'SG',
  curriculum: 'MOE_PRIMARY_MATH_2021',
  subject: 'Mathematics',
  phase: 'Primary',
  stream: 'Standard',
  domain: 'fractions',
  topic: 'Fractions',
  strand: 'Number and Algebra',
  subStrand: 'Fractions',
  syllabusTopic: 'Fractions',
  sourceDocument: 'Singapore MOE Primary Mathematics Syllabus (2021, updated October 2025)',
};

const SG_SECONDARY_G1_BASE = {
  country: 'SG',
  curriculum: 'MOE_SECONDARY_G1_MATH_2021',
  subject: 'Mathematics',
  phase: 'Secondary',
  stream: 'G1',
  domain: 'fractions',
  topic: 'Fractions',
  strand: 'Number and Algebra',
  subStrand: 'Fractions',
  syllabusTopic: 'Secondary 1 G1 Fraction-Related Skills',
  sourceDocument: 'Singapore MOE G1 Mathematics Teaching and Learning Syllabus (Secondary 1)',
};

const SG_FRACTIONS_MAPPING_ROWS = [
  { frameworkSkillId: 'F001', title: 'Understanding equal parts', introducedLevel: 'P2', masteryLevel: 'P2', syllabusOutcome: 'Identify a fraction as equal parts of a whole.', syllabusRef: 'P2 Fractions foundations', notes: 'Visual part-whole focus.' },
  { frameworkSkillId: 'F002', title: 'Numerator and denominator', introducedLevel: 'P2', masteryLevel: 'P2', syllabusOutcome: 'Interpret numerator and denominator in fraction notation.', syllabusRef: 'P2 Fractions notation', notes: 'Core representation language.' },
  { frameworkSkillId: 'F003', title: 'Unit fractions', introducedLevel: 'P2', masteryLevel: 'P2', syllabusOutcome: 'Recognise and represent unit fractions.', syllabusRef: 'P2 Unit fractions', notes: 'Unit-fraction foundation.' },
  { frameworkSkillId: 'F004', title: 'Fractions of shapes', introducedLevel: 'P2', masteryLevel: 'P2', syllabusOutcome: 'Represent fractions of simple shapes and regions.', syllabusRef: 'P2 Visual fractions', notes: 'Area and shape partitions.' },
  { frameworkSkillId: 'F005', title: 'Fractions on a number line', introducedLevel: 'P2/P3', masteryLevel: 'P3', syllabusOutcome: 'Locate fractions on simple number lines.', syllabusRef: 'P2-P3 Number-line fractions', notes: 'Transitions from models to scale.' },
  { frameworkSkillId: 'F006', title: 'Comparing simple fractions visually', introducedLevel: 'P2', masteryLevel: 'P2', syllabusOutcome: 'Compare simple fractions using visual representation.', syllabusRef: 'P2 Fraction comparison', notes: 'Visual comparison emphasis.' },
  { frameworkSkillId: 'F007', title: 'Equivalent fractions using models', introducedLevel: 'P3', masteryLevel: 'P3', syllabusOutcome: 'Recognise equivalent fractions with model support.', syllabusRef: 'P3 Equivalent fractions', notes: 'Model-based equivalence.' },
  { frameworkSkillId: 'F008', title: 'Equivalent fractions using multiplication', introducedLevel: 'P3', masteryLevel: 'P3', syllabusOutcome: 'Generate equivalent fractions using multiplication.', syllabusRef: 'P3 Equivalent fractions procedures', notes: 'Scale-up procedure.' },
  { frameworkSkillId: 'F009', title: 'Equivalent fractions using division', introducedLevel: 'P3', masteryLevel: 'P3', syllabusOutcome: 'Generate equivalent fractions using division.', syllabusRef: 'P3 Simplest form readiness', notes: 'Scale-down procedure.' },
  { frameworkSkillId: 'F010', title: 'Simplifying fractions', introducedLevel: 'P3', masteryLevel: 'P3', syllabusOutcome: 'Express fractions in simplest form.', syllabusRef: 'P3 Simplest form', notes: 'Lowest terms fluency.' },
  { frameworkSkillId: 'F011', title: 'Comparing fractions with same denominator', introducedLevel: 'P2', masteryLevel: 'P2/P3', syllabusOutcome: 'Compare fractions with common denominators.', syllabusRef: 'P2-P3 Comparison with same denominator', notes: 'Numerator-size reasoning.' },
  { frameworkSkillId: 'F012', title: 'Comparing fractions with same numerator', introducedLevel: 'P2/P3', masteryLevel: 'P3', syllabusOutcome: 'Compare fractions with common numerators.', syllabusRef: 'P3 Comparison with same numerator', notes: 'Denominator-size reasoning.' },
  { frameworkSkillId: 'F013', title: 'Comparing unlike fractions', introducedLevel: 'P3', masteryLevel: 'P3', syllabusOutcome: 'Compare unlike fractions using equivalent forms or benchmarks.', syllabusRef: 'P3 Unlike-fraction comparison', notes: 'Bridge to ordering and operations.' },
  { frameworkSkillId: 'F014', title: 'Ordering fractions', introducedLevel: 'P2/P3', masteryLevel: 'P3', syllabusOutcome: 'Order fractions from smallest to largest and vice versa.', syllabusRef: 'P2-P3 Ordering fractions', notes: 'Mixed-set ordering.' },
  { frameworkSkillId: 'F015', title: 'Adding like fractions', introducedLevel: 'P2', masteryLevel: 'P2/P3', syllabusOutcome: 'Add like fractions (initially within one whole).', syllabusRef: 'P2-P3 Add like fractions', notes: 'Like-denominator addition.' },
  { frameworkSkillId: 'F016', title: 'Subtracting like fractions', introducedLevel: 'P2', masteryLevel: 'P2/P3', syllabusOutcome: 'Subtract like fractions (initially within one whole).', syllabusRef: 'P2-P3 Subtract like fractions', notes: 'Like-denominator subtraction.' },
  { frameworkSkillId: 'F017', title: 'Adding unlike fractions', introducedLevel: 'P3', masteryLevel: 'P4', syllabusOutcome: 'Add unlike fractions by converting to common denominators.', syllabusRef: 'P3-P4 Add related/unlike fractions', notes: 'Common denominator process.' },
  { frameworkSkillId: 'F018', title: 'Subtracting unlike fractions', introducedLevel: 'P3', masteryLevel: 'P4', syllabusOutcome: 'Subtract unlike fractions by converting to common denominators.', syllabusRef: 'P3-P4 Subtract related/unlike fractions', notes: 'Common denominator process.' },
  { frameworkSkillId: 'F019', title: 'Improper fractions', introducedLevel: 'P4', masteryLevel: 'P4', syllabusOutcome: 'Interpret and represent improper fractions.', syllabusRef: 'P4 Improper fractions', notes: 'Values greater than one.' },
  { frameworkSkillId: 'F020', title: 'Mixed numbers', introducedLevel: 'P4', masteryLevel: 'P4', syllabusOutcome: 'Interpret and represent mixed numbers.', syllabusRef: 'P4 Mixed numbers', notes: 'Whole-plus-fraction form.' },
  { frameworkSkillId: 'F021', title: 'Converting between mixed numbers and improper fractions', introducedLevel: 'P4', masteryLevel: 'P4', syllabusOutcome: 'Convert between mixed numbers and improper fractions.', syllabusRef: 'P4 Mixed-improper conversion', notes: 'Bidirectional conversion.' },
  { frameworkSkillId: 'F022', title: 'Adding and subtracting mixed numbers', introducedLevel: 'P5', masteryLevel: 'P5', syllabusOutcome: 'Perform addition and subtraction of mixed numbers.', syllabusRef: 'P5 Mixed-number operations', notes: 'Includes regrouping and simplification.' },
  { frameworkSkillId: 'F023', title: 'Fraction of a quantity / set', introducedLevel: 'P4', masteryLevel: 'P4/P5', syllabusOutcome: 'Find a fraction of a quantity or a set of objects.', syllabusRef: 'P4-P5 Fraction of set/quantity', notes: 'Bridges to multiplication/division thinking.' },
  { frameworkSkillId: 'F024', title: 'Remainder concept', introducedLevel: 'P4/P5', masteryLevel: 'P5/P6', syllabusOutcome: 'Apply remainder reasoning in fraction contexts.', syllabusRef: 'P5-P6 Fraction problem solving with remainder', notes: 'Heavily assessed in higher-level word problems.' },
  { frameworkSkillId: 'F025', title: 'Basic fraction word problems', introducedLevel: 'P2/P3', masteryLevel: 'P4', syllabusOutcome: 'Solve one-step and basic two-step fraction word problems.', syllabusRef: 'P2-P4 Fraction word problems', notes: 'Contextual application of operations.' },
  { frameworkSkillId: 'F026', title: 'Multi-step fraction word problems', introducedLevel: 'P4/P5', masteryLevel: 'P5/P6', syllabusOutcome: 'Solve multi-step fraction word problems with structured reasoning.', syllabusRef: 'P5-P6 Multi-step fractional reasoning', notes: 'Pre-PSLE readiness pattern.' },
];

const SG_SECONDARY_G1_MAPPING_ROWS = [
  { frameworkSkillId: 'F010', title: 'Simplifying fractions in Secondary 1 contexts', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Use equivalent forms and simplest form in arithmetic and contextual settings.', syllabusRef: 'N1.3', notes: 'Includes negative values in checks.' },
  { frameworkSkillId: 'F013', title: 'Comparing unlike fractions (including negatives)', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Compare and order positive/negative fractions and decimals where appropriate.', syllabusRef: 'N1.3', notes: 'Sign reasoning emphasis.' },
  { frameworkSkillId: 'F014', title: 'Ordering fractions and decimals', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Order fractions (and simple decimal equivalents) on number lines and in lists.', syllabusRef: 'N1.3', notes: 'Supports mixed-format ordering.' },
  { frameworkSkillId: 'F017', title: 'Adding unlike fractions (including negative fractions)', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Perform addition of fractions and decimals, including negative values.', syllabusRef: 'N1.3', notes: 'Core four-operations extension.' },
  { frameworkSkillId: 'F018', title: 'Subtracting unlike fractions (including negative fractions)', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Perform subtraction of fractions and decimals, including negative values.', syllabusRef: 'N1.3', notes: 'Core four-operations extension.' },
  { frameworkSkillId: 'F021', title: 'Fraction multiplication and mixed-format operations', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Perform multiplication with fractions/decimals and interpret as scaling.', syllabusRef: 'N1.3', notes: 'Sec 1 G1 procedural fluency.' },
  { frameworkSkillId: 'F022', title: 'Fraction division and reciprocal interpretation', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Perform division on fractions/decimals and apply reciprocal interpretation.', syllabusRef: 'N1.3', notes: 'Includes sign handling.' },
  { frameworkSkillId: 'F023', title: 'Ratio with fractions and decimals', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Represent and solve ratios involving fractions/decimals.', syllabusRef: 'N2.3', notes: 'Ratio simplification and comparison.' },
  { frameworkSkillId: 'F025', title: 'Percentage as fraction or decimal', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Express percentages as fractions and decimals and convert between forms.', syllabusRef: 'N3.1', notes: 'Bidirectional conversion fluency.' },
  { frameworkSkillId: 'F026', title: 'Interpreting algebraic fraction notation', introducedLevel: 'S1', masteryLevel: 'S1', syllabusOutcome: 'Interpret notation such as a/b, a ÷ b, a × 1/b, (3 + y)/5.', syllabusRef: 'N5.2', notes: 'Notation interpretation only; no advanced manipulation.' },
];

const primaryMappings = SG_FRACTIONS_MAPPING_ROWS.map((row) => {
  const universalSkill = getUniversalSkillByFrameworkId(row.frameworkSkillId);
  const levelBand = buildLevelBand(row.introducedLevel, row.masteryLevel);
  return {
    ...SG_BASE,
    frameworkSkillId: row.frameworkSkillId,
    skillId: universalSkill?.skillId || '',
    level: levelBand[levelBand.length - 1] || row.masteryLevel,
    introducedLevel: row.introducedLevel,
    masteryLevel: row.masteryLevel,
    levelBand,
    syllabusOutcome: row.syllabusOutcome,
    syllabusRef: row.syllabusRef,
    notes: row.notes || '',
    title: row.title,
  };
});

const secondaryG1Mappings = SG_SECONDARY_G1_MAPPING_ROWS.map((row) => {
  const universalSkill = getUniversalSkillByFrameworkId(row.frameworkSkillId);
  const levelBand = buildLevelBand(row.introducedLevel, row.masteryLevel);
  return {
    ...SG_SECONDARY_G1_BASE,
    frameworkSkillId: row.frameworkSkillId,
    skillId: universalSkill?.skillId || '',
    level: levelBand[levelBand.length - 1] || row.masteryLevel,
    introducedLevel: row.introducedLevel,
    masteryLevel: row.masteryLevel,
    levelBand,
    syllabusOutcome: row.syllabusOutcome,
    syllabusRef: row.syllabusRef,
    notes: row.notes || '',
    title: row.title,
  };
});

export const fractionCurriculumMappings = [
  ...primaryMappings,
  ...secondaryG1Mappings,
];

const mappingByFrameworkId = new Map(
  fractionCurriculumMappings.map((mapping) => [`${mapping.country}::${mapping.curriculum}::${mapping.frameworkSkillId}`, mapping])
);

const mappingBySkillId = new Map(
  fractionCurriculumMappings
    .filter((mapping) => mapping.skillId)
    .map((mapping) => [`${mapping.country}::${mapping.curriculum}::${mapping.skillId}`, mapping])
);

export function getFractionCurriculumMappingByFrameworkId(frameworkSkillId, options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const key = `${country}::${curriculum}::${String(frameworkSkillId || '').toUpperCase()}`;
  return mappingByFrameworkId.get(key) || null;
}

export function getFractionCurriculumMappingBySkillId(skillId, options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const key = `${country}::${curriculum}::${String(skillId || '')}`;
  return mappingBySkillId.get(key) || null;
}

export function getAvailableFractionCurricula() {
  return [...new Set(
    fractionCurriculumMappings.map((mapping) => `${mapping.country}:${mapping.curriculum}`)
  )];
}

export function getAvailableFractionLevels(options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const rows = fractionCurriculumMappings.filter(
    (mapping) => mapping.country === country && mapping.curriculum === curriculum
  );
  return [...new Set(rows.flatMap((mapping) => mapping.levelBand || []))]
    .sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

export const fractionCurriculumMeta = {
  levelOrder: LEVEL_ORDER,
  levelAliases: LEVEL_ALIASES,
  availableCurricula: getAvailableFractionCurricula(),
};

export default fractionCurriculumMappings;
