import { fractionSkillGraph } from './fractionSkillGraph.js';

const SKILL_IDS = new Set(fractionSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 20,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 90,
    masteryQuestionCount: config.masteryQuestionCount ?? 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? true,
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(4, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  F001: [
    { name: 'Identify Fractional Parts from Shapes', description: 'Recognise whether shaded parts represent fractions.', difficulty: 1, fluencyTargetSeconds: 18, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003', 'M001'] },
    { name: 'Count Equal Parts in a Whole', description: 'Determine denominator from equal-part partitions.', difficulty: 1, fluencyTargetSeconds: 20, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003', 'M001'] },
    { name: 'Reject Non-Fraction Partitions', description: 'Distinguish equal vs unequal partitions.', difficulty: 2, fluencyTargetSeconds: 22, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003', 'M010'] },
    { name: 'Check Equal-Sized Parts', description: 'Identify when shaded counts are misleading because parts are unequal.', difficulty: 2, fluencyTargetSeconds: 22, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003', 'M010'] },
    { name: 'Complete-Whole Recognition', description: 'Decide whether a figure represents a complete whole before naming the fraction.', difficulty: 3, fluencyTargetSeconds: 24, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003', 'M001'] },
  ],
  F002: [
    { name: 'Name Numerator and Denominator', description: 'Label top and bottom numbers correctly.', difficulty: 1, fluencyTargetSeconds: 16, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003', 'M010'] },
    { name: 'Interpret Numerator Meaning', description: 'Read numerator as selected/equal parts.', difficulty: 2, fluencyTargetSeconds: 18, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003', 'M001'] },
    { name: 'Interpret Denominator Meaning', description: 'Read denominator as total equal parts.', difficulty: 2, fluencyTargetSeconds: 18, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003', 'M001'] },
    { name: 'Detect Swapped Roles', description: 'Spot numerator/denominator swaps and explain why they are wrong.', difficulty: 2, fluencyTargetSeconds: 20, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003', 'M010'] },
    { name: 'Link Denominator to Equal Parts', description: 'Connect denominator to equal partition count, not shaded count.', difficulty: 3, fluencyTargetSeconds: 22, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003', 'M001'] },
  ],
  F003: [
    { name: 'Fraction from Area Models', description: 'Write fractions from shaded area representations.', difficulty: 1, fluencyTargetSeconds: 18, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003'] },
    { name: 'Fraction from Bar Models', description: 'Map part-whole in linear bar models.', difficulty: 2, fluencyTargetSeconds: 20, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003'] },
    { name: 'Equivalent Visual Representations', description: 'Match same fraction across different visual forms.', difficulty: 2, fluencyTargetSeconds: 22, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M004'] },
  ],
  F004: [
    { name: 'Identify Unit Fractions', description: 'Identify fractions with numerator one.', difficulty: 1, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M001'] },
    { name: 'Represent Unit Fractions', description: 'Represent 1/n on simple shapes and bars.', difficulty: 2, fluencyTargetSeconds: 18, workingRequired: true, mentalMathEligible: false, misconceptionTags: ['M003'] },
    { name: 'Unit Fraction Reasoning', description: 'Reason about value as denominator changes.', difficulty: 2, fluencyTargetSeconds: 20, workingRequired: true, mentalMathEligible: true, misconceptionTags: ['M001'] },
  ],
  F005: [
    { name: 'Locate Unit Fractions on Number Lines', description: 'Place simple unit fractions on 0-1 lines.', difficulty: 2, fluencyTargetSeconds: 18, misconceptionTags: ['M003'] },
    { name: 'Locate Non-Unit Fractions on Number Lines', description: 'Place fractions like 3/4 or 5/6 correctly.', difficulty: 2, fluencyTargetSeconds: 20, misconceptionTags: ['M003'] },
    { name: 'Compare Positions on Number Lines', description: 'Use number-line positions to compare values.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M001'] },
  ],
  F006: [
    { name: 'Compare Unit Fractions by Denominator', description: 'Compare 1/a and 1/b with denominator logic.', difficulty: 2, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M001'] },
    { name: 'Order Sets of Unit Fractions', description: 'Order three or more unit fractions.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M001'] },
    { name: 'Contextual Unit Fraction Comparison', description: 'Apply unit fraction comparison in short contexts.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M001'] },
  ],
  F007: [
    { name: 'Compare Like-Denominator Pairs', description: 'Compare a/d and b/d efficiently.', difficulty: 1, fluencyTargetSeconds: 12, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003'] },
    { name: 'Order Like-Denominator Sets', description: 'Order multiple fractions with same denominator.', difficulty: 2, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M003'] },
    { name: 'Equivalent Context Checks', description: 'Verify comparisons using equivalent forms.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['M004'] },
  ],
  F008: [
    { name: 'Compare Same-Numerator Pairs', description: 'Compare n/a and n/b by denominator size.', difficulty: 2, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M002'] },
    { name: 'Order Same-Numerator Sets', description: 'Sort fractions sharing common numerator.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M002'] },
    { name: 'Mixed Representation Comparison', description: 'Compare with visuals and symbolic fractions.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M002'] },
  ],
  F009: [
    { name: 'Order Fractions with Same Denominator', description: 'Quick ordering where denominator is fixed.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M003'] },
    { name: 'Order Fractions with Related Denominators', description: 'Order by converting to shared denominator.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M004'] },
    { name: 'Order Unlike Fraction Sets', description: 'Order broader sets including distractors.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M004'] },
  ],
  F010: [
    { name: 'Recognise Equivalent Fractions', description: 'Identify equivalent fractions in pairs.', difficulty: 2, fluencyTargetSeconds: 16, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M004'] },
    { name: 'Equivalent Fractions from Visual Models', description: 'Match equivalent values using bars/areas.', difficulty: 2, fluencyTargetSeconds: 20, misconceptionTags: ['M004'] },
    { name: 'Equivalent Fraction Validation', description: 'Confirm if statements are equivalent or not.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M004'] },
  ],
  F011: [
    { name: 'Generate Equivalents by Multiplication', description: 'Scale numerator and denominator by same factor.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M004', 'M005'] },
    { name: 'Generate Missing Terms in Equivalents', description: 'Fill blanks in equivalent-fraction equations.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['M004', 'M005'] },
    { name: 'Generate Multi-Step Equivalent Chains', description: 'Create multiple equivalent forms progressively.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M004', 'M010'] },
    { name: 'Compare Same Denominator with Equality Cases', description: 'Compare same-denominator fractions including equal numerators.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M003', 'M002'] },
    { name: 'Visual Same-Denominator Comparison Checks', description: 'Match same-denominator symbolic comparison with model evidence.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M003', 'M010'] },
  ],
  F012: [
    { name: 'Simplify with Common Factors', description: 'Reduce fractions using known common factors.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M005', 'M004'] },
    { name: 'Simplify to Lowest Terms', description: 'Ensure final fraction is fully simplified.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['M005', 'M010'] },
    { name: 'Simplify After Intermediate Steps', description: 'Simplify in multi-step symbolic expressions.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M005', 'M010'] },
    { name: 'Compare Same Numerator Reasoning', description: 'Compare same-numerator fractions through part-size reasoning.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M002', 'M003'] },
    { name: 'Same Numerator Visual Mismatch Checks', description: 'Identify when visual model disagrees with symbolic comparison.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M002', 'M010'] },
  ],
  F013: [
    { name: 'Identify Improper Fractions', description: 'Classify fractions as improper/proper.', difficulty: 2, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M006'] },
    { name: 'Count Equal Parts Across Wholes', description: 'Count shaded equal parts across multiple wholes to find improper fractions.', difficulty: 2, fluencyTargetSeconds: 16, misconceptionTags: ['M006', 'wrong_whole_identified'] },
    { name: 'Represent Improper Fractions Visually', description: 'Show improper fractions with whole+part visuals.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M006', 'improper_fraction_conversion_error'] },
    { name: 'Interpret Values Greater than One', description: 'Interpret improper values in context with quantity or measurement.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M006', 'improper_fraction_conversion_error'] },
    { name: 'Compare Signed Fractions', description: 'Compare positive and negative fractions around zero.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M002', 'M010'] },
  ],
  F014: [
    { name: 'Read Mixed Numbers', description: 'Interpret whole number and fractional part in symbolic form.', difficulty: 2, fluencyTargetSeconds: 14, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['M006'] },
    { name: 'Compose Mixed Numbers from Parts', description: 'Combine whole and fractional parts to write mixed numbers.', difficulty: 2, fluencyTargetSeconds: 16, misconceptionTags: ['M006', 'mixed_number_conversion_error'] },
    { name: 'Represent Mixed Numbers', description: 'Build mixed numbers from visual and symbolic forms using diagrams.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['M006', 'wrong_whole_identified'] },
    { name: 'Compare Mixed Numbers', description: 'Compare mixed numbers in ordered sets using whole-part reasoning.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M006', 'mixed_number_conversion_error'] },
    { name: 'Order Fractions and Decimals', description: 'Order fractions with equivalent decimal values.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M002', 'M010'] },
  ],
  F015: [
    { name: 'Mixed to Improper Conversion', description: 'Convert mixed numbers to improper fractions using multiplication and addition.', difficulty: 3, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M006', 'mixed_number_conversion_error'] },
    { name: 'Improper to Mixed Conversion', description: 'Convert improper fractions to mixed numbers using division and remainder.', difficulty: 3, fluencyTargetSeconds: 18, mentalMathEligible: true, misconceptionTags: ['M006', 'improper_fraction_conversion_error', 'M005'] },
    { name: 'Bidirectional Conversion in Context', description: 'Choose and convert between forms in applied settings.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M006', 'answer_form_mismatch'] },
    { name: 'Compare Mixed and Improper Forms', description: 'Convert to compare values represented as mixed or improper fractions.', difficulty: 4, fluencyTargetSeconds: 22, misconceptionTags: ['M006', 'mixed_number_conversion_error', 'M010'] },
    { name: 'Place Mixed and Improper on Number Lines', description: 'Locate mixed numbers and improper fractions on number lines beyond one whole.', difficulty: 4, fluencyTargetSeconds: 26, misconceptionTags: ['number_line_partition_error', 'mixed_number_conversion_error'] },
  ],
  F016: [
    { name: 'Add Like Fractions (No Regrouping)', description: 'Add fractions with same denominator in simple forms.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['M007'] },
    { name: 'Add Like Fractions (Simplify Result)', description: 'Add and simplify final fraction where needed.', difficulty: 3, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M007', 'M005'] },
    { name: 'Add Like Fractions in Context', description: 'Apply addition in short context problems.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M007'] },
    { name: 'Add Like Fractions with Improper Result', description: 'Add like fractions and convert improper result to mixed number.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M007', 'answer_form_mismatch', 'mixed_number_conversion_error'] },
  ],
  F017: [
    { name: 'Subtract Like Fractions (No Regrouping)', description: 'Subtract fractions with same denominator directly.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: true, misconceptionTags: ['M007'] },
    { name: 'Subtract Like Fractions (Simplify Result)', description: 'Subtract and simplify final fraction.', difficulty: 3, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M007', 'M005'] },
    { name: 'Subtract Like Fractions in Context', description: 'Apply subtraction in one-step context items.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M007'] },
    { name: 'Add Signed Fractions', description: 'Add fractions with negative values using sign rules.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M007', 'M010'] },
  ],
  F018: [
    { name: 'Add Unlike Fractions (LCM Scaffolded)', description: 'Add unlike fractions with guided common denominator steps.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M007', 'M004'] },
    { name: 'Add Unlike Fractions (Independent)', description: 'Independently find common denominator and add.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M007', 'M004'] },
    { name: 'Add Unlike Fractions (Simplify & Convert)', description: 'Add unlike fractions and simplify/convert mixed form.', difficulty: 4, fluencyTargetSeconds: 28, misconceptionTags: ['M007', 'M005', 'M006'] },
    { name: 'Add Unlike Fractions in Context', description: 'Use unlike-fraction addition in worded scenarios.', difficulty: 5, fluencyTargetSeconds: 34, misconceptionTags: ['M007', 'M008'] },
    { name: 'Subtract Signed Fractions', description: 'Subtract fractions with negative values and simplify.', difficulty: 5, fluencyTargetSeconds: 30, misconceptionTags: ['M007', 'M010'] },
    { name: 'Subtract Unlike Fractions (Simplify Check)', description: 'Subtract unlike fractions and simplify to lowest terms.', difficulty: 4, fluencyTargetSeconds: 28, misconceptionTags: ['M007', 'M005'] },
  ],
  F019: [
    { name: 'Subtract Unlike Fractions (LCM Scaffolded)', description: 'Subtract unlike fractions with common denominator guidance.', difficulty: 3, fluencyTargetSeconds: 22, misconceptionTags: ['M007', 'M004'] },
    { name: 'Subtract Unlike Fractions (Independent)', description: 'Independently convert and subtract unlike fractions.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M007', 'M004'] },
    { name: 'Subtract Unlike Fractions (Regrouping Cases)', description: 'Handle regrouping through mixed number conversions.', difficulty: 4, fluencyTargetSeconds: 30, misconceptionTags: ['M007', 'M006'] },
    { name: 'Subtract Unlike Fractions in Context', description: 'Apply unlike-fraction subtraction in contexts.', difficulty: 5, fluencyTargetSeconds: 34, misconceptionTags: ['M007', 'M008'] },
  ],
  F020: [
    { name: 'Unit Fractions of Quantity', description: 'Compute unit fractions of whole-number quantities.', difficulty: 2, fluencyTargetSeconds: 16, mentalMathEligible: true, misconceptionTags: ['M008'] },
    { name: 'Non-Unit Fractions of Quantity', description: 'Compute non-unit fractions such as 3/4 of 20.', difficulty: 3, fluencyTargetSeconds: 20, misconceptionTags: ['M008'] },
    { name: 'Fraction of Quantity (Multiples)', description: 'Solve quantities that divide cleanly.', difficulty: 3, fluencyTargetSeconds: 20, mentalMathEligible: true, misconceptionTags: ['M008'] },
    { name: 'Fraction of Quantity (Non-Multiples)', description: 'Handle non-multiple values requiring decomposition.', difficulty: 4, fluencyTargetSeconds: 28, misconceptionTags: ['M008', 'M010'] },
    { name: 'Fraction of Quantity Word Problems', description: 'Apply fraction-of-quantity to realistic contexts.', difficulty: 4, fluencyTargetSeconds: 34, misconceptionTags: ['M008'] },
    { name: 'Fraction of Quantity Multi-Step Applications', description: 'Solve exam-style multi-step quantity scenarios.', difficulty: 5, fluencyTargetSeconds: 42, misconceptionTags: ['M008', 'M010'] },
  ],
  F021: [
    { name: 'Multiply Fraction by Whole Number', description: 'Use repeated-addition and direct multiplication forms.', difficulty: 3, fluencyTargetSeconds: 18, misconceptionTags: ['M009'] },
    { name: 'Multiply Fraction by Fraction (Basic)', description: 'Multiply numerators and denominators in simple cases.', difficulty: 4, fluencyTargetSeconds: 22, misconceptionTags: ['M009'] },
    { name: 'Multiply Fractions with Simplification', description: 'Multiply and simplify answers fully.', difficulty: 4, fluencyTargetSeconds: 26, misconceptionTags: ['M009', 'M005'] },
    { name: 'Fraction Multiplication in Context', description: 'Apply multiplication in contextual scenarios.', difficulty: 5, fluencyTargetSeconds: 34, misconceptionTags: ['M009', 'M008'] },
    { name: 'Fraction-Decimal Mixed Multiplication', description: 'Multiply fractions with decimal equivalents in simple forms.', difficulty: 5, fluencyTargetSeconds: 32, misconceptionTags: ['M009', 'M011'] },
  ],
  F022: [
    { name: 'Divide Fraction by Whole Number', description: 'Divide fractions by whole numbers via equivalent forms.', difficulty: 4, fluencyTargetSeconds: 24, misconceptionTags: ['M009'] },
    { name: 'Divide by Fraction (Reciprocal Method)', description: 'Apply invert-and-multiply correctly.', difficulty: 5, fluencyTargetSeconds: 28, misconceptionTags: ['M009'] },
    { name: 'Division with Simplification and Conversion', description: 'Divide and simplify/convert final answers.', difficulty: 5, fluencyTargetSeconds: 32, misconceptionTags: ['M009', 'M005', 'M006'] },
    { name: 'Fraction Division in Context', description: 'Solve contextual and interpretive division items.', difficulty: 5, fluencyTargetSeconds: 38, misconceptionTags: ['M009', 'M008'] },
    { name: 'Signed Fraction Division', description: 'Apply reciprocal method with negative fractions correctly.', difficulty: 5, fluencyTargetSeconds: 34, misconceptionTags: ['M009', 'M010'] },
  ],
  F023: [
    { name: 'One-Step Fraction Word Problems', description: 'Solve single-operation fraction word problems.', difficulty: 4, fluencyTargetSeconds: 34, misconceptionTags: ['M008'], mentalMathEligible: false },
    { name: 'Mixed-Operation Fraction Word Problems', description: 'Choose operation and solve mixed operation contexts.', difficulty: 4, fluencyTargetSeconds: 38, misconceptionTags: ['M008', 'M010'] },
    { name: 'Word Problems with Constraints', description: 'Solve with extra constraints, comparison, or remainder conditions.', difficulty: 5, fluencyTargetSeconds: 44, misconceptionTags: ['M008', 'M010'] },
    { name: 'Short Structured Responses', description: 'Word problems requiring clear working lines.', difficulty: 5, fluencyTargetSeconds: 48, misconceptionTags: ['M008', 'M010'] },
    { name: 'Ratio with Fractions and Decimals', description: 'Solve ratio items involving fractional and decimal terms.', difficulty: 5, fluencyTargetSeconds: 44, misconceptionTags: ['M008', 'M012'] },
    { name: 'Set-Based Fraction Counting', description: 'Find fractional parts of object sets using count-based reasoning.', difficulty: 3, fluencyTargetSeconds: 24, misconceptionTags: ['M003', 'M008'] },
  ],
  F024: [
    { name: 'Two-Step Fraction Problems', description: 'Solve two-step fraction procedures with explicit sequencing.', difficulty: 4, fluencyTargetSeconds: 40, misconceptionTags: ['M008', 'M010'] },
    { name: 'Multi-Step Conversion + Operation Problems', description: 'Convert forms then apply operations in sequence.', difficulty: 5, fluencyTargetSeconds: 46, misconceptionTags: ['M006', 'M008', 'M010'] },
    { name: 'Model-Based Multi-Step Problems', description: 'Use bar/diagram representations for multi-step reasoning.', difficulty: 5, fluencyTargetSeconds: 50, misconceptionTags: ['M008', 'M010'] },
    { name: 'Extended-Response Multi-Step Problems', description: 'Explain method in structured exam-style responses.', difficulty: 5, fluencyTargetSeconds: 55, misconceptionTags: ['M008', 'M010'] },
  ],
  F025: [
    { name: 'Exam-Style Mixed Fraction Items', description: 'Mixed computational formats with exam phrasing.', difficulty: 4, fluencyTargetSeconds: 44, misconceptionTags: ['M010'] },
    { name: 'Exam-Style Contextual Applications', description: 'Context-heavy exam problems with hidden operations.', difficulty: 5, fluencyTargetSeconds: 50, misconceptionTags: ['M008', 'M010'] },
    { name: 'Exam-Style Non-Routine Problems', description: 'Non-routine items requiring strategic selection.', difficulty: 5, fluencyTargetSeconds: 55, misconceptionTags: ['M008', 'M010'] },
    { name: 'Exam-Style Explanation/Justification', description: 'Items requiring method explanation and reasoning.', difficulty: 5, fluencyTargetSeconds: 60, misconceptionTags: ['M010'] },
    { name: 'Percentage Fraction Decimal Conversion', description: 'Convert between percentage, fraction and decimal forms.', difficulty: 4, fluencyTargetSeconds: 28, misconceptionTags: ['M011'] },
  ],
  F026: [
    { name: 'Mastery Mixed Drill', description: 'Balanced mastery drill across all fraction strands.', difficulty: 4, fluencyTargetSeconds: 40, misconceptionTags: ['M010'] },
    { name: 'Mastery Speed-Accuracy Challenge', description: 'Time-bounded challenge maintaining high accuracy.', difficulty: 5, fluencyTargetSeconds: 32, misconceptionTags: ['M010'], mentalMathEligible: true },
    { name: 'Mastery Retention Check', description: 'Spaced-review style mastery verification set.', difficulty: 5, fluencyTargetSeconds: 45, misconceptionTags: ['M010'] },
    { name: 'Mastery Capstone Applications', description: 'Capstone applications combining multiple fraction ideas.', difficulty: 5, fluencyTargetSeconds: 58, misconceptionTags: ['M008', 'M010'] },
    { name: 'Algebraic Fraction Notation Interpretation', description: 'Interpret forms such as a/b, a ÷ b, a × 1/b, (3+y)/5.', difficulty: 4, fluencyTargetSeconds: 30, misconceptionTags: ['M013'] },
  ],
};

export const fractionQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) => definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(fractionQuestionFamilies.map((family) => [family.id, family]));

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return fractionQuestionFamilies.filter((family) => family.skillId === skillId);
}

export function getQuestionFamilyCountsBySkill() {
  return fractionSkillGraph.skillIds.reduce((acc, skillId) => {
    acc[skillId] = getQuestionFamiliesBySkill(skillId).length;
    return acc;
  }, {});
}

export function getWorkingRequirementSummary() {
  const required = fractionQuestionFamilies.filter((family) => family.workingRequired).length;
  const notRequired = fractionQuestionFamilies.length - required;
  return { required, notRequired };
}

export function getMentalMathEligibleSummary() {
  const eligible = fractionQuestionFamilies.filter((family) => family.mentalMathEligible).length;
  const notEligible = fractionQuestionFamilies.length - eligible;
  return { eligible, notEligible };
}

export function getAssessmentRelevantSummary() {
  const relevant = fractionQuestionFamilies.filter((family) => family.assessmentRelevant).length;
  const notRelevant = fractionQuestionFamilies.length - relevant;
  return { relevant, notRelevant };
}

export function getFluencyBenchmarksByFamily() {
  return fractionQuestionFamilies.reduce((acc, family) => {
    acc[family.id] = family.fluencyBenchmarks;
    return acc;
  }, {});
}

export function validateFractionQuestionFamilies() {
  const ids = fractionQuestionFamilies.map((family) => family.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const invalidSkillRefs = fractionQuestionFamilies
    .filter((family) => !SKILL_IDS.has(family.skillId))
    .map((family) => ({ familyId: family.id, skillId: family.skillId }));

  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage)
    .filter(([, count]) => count === 0)
    .map(([skillId]) => skillId);

  const lowFamilyCountSkills = Object.entries(skillCoverage)
    .filter(([, count]) => count < 3)
    .map(([skillId, count]) => ({ skillId, count }));

  const weakProgressionSkills = Object.entries(skillCoverage).flatMap(([skillId]) => {
    const families = getQuestionFamiliesBySkill(skillId);
    const uniqueDifficulty = [...new Set(families.map((family) => family.difficulty))];
    return uniqueDifficulty.length < 2 ? [skillId] : [];
  });

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');
  if (lowFamilyCountSkills.length) errors.push('Some skills have fewer than 3 question families.');
  if (weakProgressionSkills.length) errors.push('Some skills do not show difficulty progression.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: fractionQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: {
      duplicateIds: [...new Set(duplicateIds)],
      invalidSkillRefs,
      missingSkillCoverage,
      lowFamilyCountSkills,
      weakProgressionSkills,
      workingRequirement: getWorkingRequirementSummary(),
      mentalMathEligible: getMentalMathEligibleSummary(),
      assessmentRelevant: getAssessmentRelevantSummary(),
    },
    errors,
  };
}

export const fractionQuestionFamilyArchitecture = {
  domainId: 'fractions',
  version: '1.0.0',
  totalSkills: fractionSkillGraph.skillIds.length,
  totalQuestionFamilies: fractionQuestionFamilies.length,
  families: fractionQuestionFamilies,
};

export default fractionQuestionFamilyArchitecture;
