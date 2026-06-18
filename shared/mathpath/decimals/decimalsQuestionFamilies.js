import { decimalsSkillGraph } from './decimalsSkillGraph.js';

// A question family is a generator-backed template group under one skill. Each
// family names the generator kind the runtime uses and the misconception tags
// its distractors target. Mirrors the Fractions families shape (id, skillId,
// difficulty, generator metadata) but without the quarantine machinery, since
// the Decimals families are authored fresh against the current skill graph.

const SKILL_IDS = new Set(decimalsSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  const id = `QF_${skillId}_${String(index).padStart(3, '0')}`;
  return {
    id,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    generatorKind: config.generatorKind,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 20,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 90,
    masteryQuestionCount: config.masteryQuestionCount ?? 18,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? true,
  };
}

const familiesBySkillBlueprint = {
  D001: [
    { name: 'Identify the Digit in a Place', description: 'State which digit sits in the tenths/hundredths/thousandths place.', difficulty: 2, generatorKind: 'decimalPlaceValue', fluencyTargetSeconds: 18, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/place-confuse'] },
    { name: 'Value of a Digit', description: 'Give the place value of a named digit in a decimal.', difficulty: 2, generatorKind: 'decimalPlaceValue', fluencyTargetSeconds: 20, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/place-confuse', 'dec/longer-is-bigger'] },
    { name: 'Expanded Form', description: 'Read a decimal and match it to expanded place-value form.', difficulty: 3, generatorKind: 'decimalPlaceValue', fluencyTargetSeconds: 25, misconceptionTags: ['dec/place-confuse'] },
  ],
  D002: [
    { name: 'Read a Point on a Number Line', description: 'Read the decimal value at a marked point between two whole numbers.', difficulty: 2, generatorKind: 'decimalNumberLine', fluencyTargetSeconds: 22, misconceptionTags: ['dec/nl-interval'] },
    { name: 'Place a Decimal', description: 'Choose the mark a given decimal belongs at on a number line.', difficulty: 3, generatorKind: 'decimalNumberLine', fluencyTargetSeconds: 24, misconceptionTags: ['dec/nl-interval'] },
  ],
  D003: [
    { name: 'Which is Larger', description: 'Compare two decimals and pick the larger value.', difficulty: 2, generatorKind: 'decimalCompare', fluencyTargetSeconds: 8, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/longer-decimal'] },
    { name: 'Insert the Symbol', description: 'Choose <, > or = between two decimals.', difficulty: 2, generatorKind: 'decimalCompare', fluencyTargetSeconds: 10, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/longer-decimal'] },
  ],
  D004: [
    { name: 'Order Increasing', description: 'Arrange a set of decimals from smallest to largest.', difficulty: 3, generatorKind: 'decimalOrder', fluencyTargetSeconds: 18, misconceptionTags: ['dec/align-right'] },
    { name: 'Order Decreasing', description: 'Arrange a set of decimals from largest to smallest.', difficulty: 3, generatorKind: 'decimalOrder', fluencyTargetSeconds: 18, misconceptionTags: ['dec/align-right'] },
  ],
  D005: [
    { name: 'Round to 1 Decimal Place', description: 'Round a decimal to the nearest tenth.', difficulty: 3, generatorKind: 'decimalRound', fluencyTargetSeconds: 10, misconceptionTags: ['dec/truncate'] },
    { name: 'Round to Whole / 2dp', description: 'Round a decimal to the nearest whole number or two decimal places.', difficulty: 3, generatorKind: 'decimalRound', fluencyTargetSeconds: 12, misconceptionTags: ['dec/truncate'] },
  ],
  D006: [
    { name: 'Add Decimals', description: 'Add two decimals with aligned points.', difficulty: 3, generatorKind: 'decimalAddSub', fluencyTargetSeconds: 18, misconceptionTags: ['dec/add-misalign'] },
    { name: 'Subtract Decimals', description: 'Subtract two decimals with aligned points.', difficulty: 3, generatorKind: 'decimalAddSub', fluencyTargetSeconds: 20, misconceptionTags: ['dec/add-misalign'] },
  ],
  D007: [
    { name: 'Multiply by a Power of Ten', description: 'Multiply a decimal by 10, 100 or 1000.', difficulty: 3, generatorKind: 'decimalScaleByTen', fluencyTargetSeconds: 10, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/move-wrong-way'] },
    { name: 'Divide by a Power of Ten', description: 'Divide a decimal by 10, 100 or 1000.', difficulty: 3, generatorKind: 'decimalScaleByTen', fluencyTargetSeconds: 10, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/move-wrong-way'] },
  ],
  D008: [
    { name: 'Decimal × Whole Number', description: 'Multiply a decimal by a one- or two-digit whole number.', difficulty: 4, generatorKind: 'decimalMultWhole', fluencyTargetSeconds: 25, misconceptionTags: ['dec/lost-point'] },
    { name: 'Decimal × Whole (Word)', description: 'Apply decimal × whole number in a simple context.', difficulty: 4, generatorKind: 'decimalMultWhole', fluencyTargetSeconds: 30, misconceptionTags: ['dec/lost-point'] },
  ],
  D009: [
    { name: 'Decimal × Decimal', description: 'Multiply two decimals and place the point by counting decimal places.', difficulty: 5, generatorKind: 'decimalMultDecimal', fluencyTargetSeconds: 30, misconceptionTags: ['dec/wrong-place-count'] },
    { name: 'Decimal × Decimal (Harder)', description: 'Multiply two-place decimals together.', difficulty: 5, generatorKind: 'decimalMultDecimal', fluencyTargetSeconds: 35, misconceptionTags: ['dec/wrong-place-count'] },
  ],
  D010: [
    { name: 'Decimal ÷ Whole Number', description: 'Divide a decimal by a one-digit whole number.', difficulty: 4, generatorKind: 'decimalDivWhole', fluencyTargetSeconds: 28, misconceptionTags: ['dec/quotient-point'] },
    { name: 'Decimal ÷ Whole (Exact)', description: 'Divide a decimal that divides exactly by a whole number.', difficulty: 4, generatorKind: 'decimalDivWhole', fluencyTargetSeconds: 28, misconceptionTags: ['dec/quotient-point'] },
  ],
  D011: [
    { name: 'Divide by a Decimal', description: 'Scale the divisor to a whole number, then divide.', difficulty: 5, generatorKind: 'decimalDivDecimal', fluencyTargetSeconds: 35, misconceptionTags: ['dec/no-scale-divisor'] },
    { name: 'Divide by a Decimal (Harder)', description: 'Divide by a two-place decimal after scaling.', difficulty: 5, generatorKind: 'decimalDivDecimal', fluencyTargetSeconds: 40, misconceptionTags: ['dec/no-scale-divisor'] },
  ],
  D012: [
    { name: 'Decimal → Fraction', description: 'Write a decimal as a fraction in lowest terms.', difficulty: 4, generatorKind: 'decimalToFraction', fluencyTargetSeconds: 22, misconceptionTags: ['dec/wrong-denominator'] },
    { name: 'Decimal → Fraction (Hundredths)', description: 'Convert a hundredths decimal to a simplified fraction.', difficulty: 4, generatorKind: 'decimalToFraction', fluencyTargetSeconds: 24, misconceptionTags: ['dec/wrong-denominator'] },
  ],
  D013: [
    { name: 'Fraction → Decimal', description: 'Write a fraction with a denominator of 10/100 as a decimal.', difficulty: 4, generatorKind: 'fractionToDecimal', fluencyTargetSeconds: 22, misconceptionTags: ['dec/divide-reversed'] },
    { name: 'Fraction → Decimal (Divide)', description: 'Convert a fraction to a decimal by division.', difficulty: 4, generatorKind: 'fractionToDecimal', fluencyTargetSeconds: 26, misconceptionTags: ['dec/divide-reversed'] },
  ],
  D014: [
    { name: 'Convert Up a Unit', description: 'Convert a larger metric unit to a smaller one (km→m, kg→g, L→ml).', difficulty: 4, generatorKind: 'decimalMeasureConvert', fluencyTargetSeconds: 28, misconceptionTags: ['dec/convert-direction'] },
    { name: 'Convert Down a Unit', description: 'Convert a smaller metric unit to a larger one (m→km, g→kg, ml→L).', difficulty: 4, generatorKind: 'decimalMeasureConvert', fluencyTargetSeconds: 30, misconceptionTags: ['dec/convert-direction'] },
  ],
};

// Word-problem families: real-world context variants, one per skill.
const wordProblemBlueprint = {
  D001: [{ name: 'Place Value — Real-World Reading', description: 'Identify the digit in a given place from a price tag, weight, or length context.', difficulty: 3, generatorKind: 'decimalPlaceValueWord', fluencyTargetSeconds: 20, misconceptionTags: ['dec/place-confuse'] }],
  D002: [{ name: 'Number Line — Distance / Temperature Context', description: 'Read a marked decimal value from a number line in a real-world measurement context.', difficulty: 3, generatorKind: 'decimalNumberLine', fluencyTargetSeconds: 24, misconceptionTags: ['dec/nl-interval'] }],
  D003: [{ name: 'Compare Decimals — Which Holds More?', description: 'Choose the larger quantity from a volume, mass, or length word context.', difficulty: 3, generatorKind: 'decimalCompareWord', fluencyTargetSeconds: 12, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['dec/longer-decimal'] }],
  D004: [{ name: 'Order Decimals — Rank Scores / Distances', description: 'Arrange decimals in order within a ranking or measurement scenario.', difficulty: 4, generatorKind: 'decimalOrderWord', fluencyTargetSeconds: 22, misconceptionTags: ['dec/align-right'] }],
  D005: [{ name: 'Round a Measurement', description: 'Round a weight, length, or capacity to 1 decimal place in a practical context.', difficulty: 4, generatorKind: 'decimalRoundWord', fluencyTargetSeconds: 14, misconceptionTags: ['dec/truncate'] }],
  D006: [{ name: 'Add / Subtract Decimals — Word Problem', description: 'Compute a total cost, total length, or remaining amount in a real-world scenario.', difficulty: 4, generatorKind: 'decimalAddSubWord', fluencyTargetSeconds: 25, misconceptionTags: ['dec/add-misalign'] }],
  D007: [{ name: 'Scale by Power of Ten — Word Problem', description: 'Scale a recipe quantity or split a tank volume by multiplying or dividing by a power of ten.', difficulty: 4, generatorKind: 'decimalScaleWord', fluencyTargetSeconds: 15, misconceptionTags: ['dec/move-wrong-way'] }],
  D008: [{ name: 'Decimal × Whole — Applied Context', description: 'Multiply a decimal by a whole number to find total cost, weight, or volume.', difficulty: 5, generatorKind: 'decimalMultWholeWord', fluencyTargetSeconds: 30, misconceptionTags: ['dec/lost-point'] }],
  D009: [{ name: 'Decimal × Decimal — Area Problem', description: 'Find the area of a rectangle with decimal side lengths.', difficulty: 5, generatorKind: 'decimalMultDecimalWord', fluencyTargetSeconds: 35, misconceptionTags: ['dec/wrong-place-count'] }],
  D010: [{ name: 'Decimal ÷ Whole — Sharing / Cutting', description: 'Divide a decimal length or amount equally among a whole number of parts.', difficulty: 5, generatorKind: 'decimalDivWholeWord', fluencyTargetSeconds: 30, misconceptionTags: ['dec/quotient-point'] }],
  D011: [{ name: 'Decimal ÷ Decimal — Pieces from a Length', description: 'Find how many pieces of a given decimal length can be cut from a total decimal length.', difficulty: 5, generatorKind: 'decimalDivDecimalWord', fluencyTargetSeconds: 40, misconceptionTags: ['dec/no-scale-divisor'] }],
  D012: [{ name: 'Decimal → Fraction — Real Context', description: 'Express a test score or recipe proportion as a simplified fraction.', difficulty: 5, generatorKind: 'decimalToFractionWord', fluencyTargetSeconds: 26, misconceptionTags: ['dec/wrong-denominator'] }],
  D013: [{ name: 'Fraction → Decimal — Test Score Context', description: 'Write a test or quiz score as a decimal.', difficulty: 5, generatorKind: 'fractionToDecimalWord', fluencyTargetSeconds: 26, misconceptionTags: ['dec/divide-reversed'] }],
  D014: [{ name: 'Measure Convert — Two-Step Word Problem', description: 'Add two decimal distances or masses then convert the total to a smaller unit.', difficulty: 5, generatorKind: 'decimalMeasureConvertWord', fluencyTargetSeconds: 35, misconceptionTags: ['dec/convert-direction'] }],
};

const families = [
  ...Object.entries(familiesBySkillBlueprint).flatMap(([skillId, configs]) =>
    configs.map((config, index) => buildFamily(skillId, index + 1, config))
  ),
  ...Object.entries(wordProblemBlueprint).flatMap(([skillId, configs]) => {
    const baseCount = (familiesBySkillBlueprint[skillId] || []).length;
    return configs.map((config, index) => buildFamily(skillId, baseCount + index + 1, config));
  }),
];

const familyById = new Map(families.map((family) => [family.id, family]));

const familiesBySkill = families.reduce((acc, family) => {
  if (!acc[family.skillId]) acc[family.skillId] = [];
  acc[family.skillId].push(family);
  return acc;
}, {});

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return familiesBySkill[skillId] ? [...familiesBySkill[skillId]] : [];
}

export function getAllQuestionFamilies() {
  return [...families];
}

export function validateDecimalsQuestionFamilies() {
  const orphanFamilies = families
    .filter((family) => !SKILL_IDS.has(family.skillId))
    .map((family) => family.id);

  // Every family id referenced by a skill must resolve, and vice-versa.
  const referenced = new Set(decimalsSkillGraph.skills.flatMap((skill) => skill.questionFamilies));
  const definedIds = new Set(families.map((family) => family.id));
  const missingFromBlueprint = [...referenced].filter((id) => !definedIds.has(id));
  const undeclaredFamilies = [...definedIds].filter((id) => !referenced.has(id));

  const errors = [
    ...(orphanFamilies.length ? ['Families reference unknown skill IDs.'] : []),
    ...(missingFromBlueprint.length ? ['Skill graph references families that are not defined.'] : []),
    ...(undeclaredFamilies.length ? ['Families exist that no skill references.'] : []),
  ];

  return {
    isValid: errors.length === 0,
    summary: { totalFamilies: families.length, orphanFamilies, missingFromBlueprint, undeclaredFamilies },
    errors,
  };
}

export const decimalsQuestionFamilies = families;

export default decimalsQuestionFamilies;
