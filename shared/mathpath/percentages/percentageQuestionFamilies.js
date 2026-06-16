import { percentageSkillGraph } from './percentageSkillGraph.js';

// Question families for the Percentage domain. Each family maps one-to-one with
// a generator kind in percentageQuestionGenerator.js. Mirrors the Decimals
// families shape exactly.

const SKILL_IDS = new Set(percentageSkillGraph.skillIds);

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
  P001: [
    { name: 'Read a 100-Grid', description: 'State what percentage of a 100-grid is shaded (MCQ).', difficulty: 2, generatorKind: 'pctMeaning', fluencyTargetSeconds: 20, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['pct/not-per-hundred'] },
    { name: 'Write the Percentage', description: 'Given n shaded squares out of 100, write the percentage.', difficulty: 2, generatorKind: 'pctMeaning', fluencyTargetSeconds: 22, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['pct/not-per-hundred', 'pct/cap-at-100'] },
  ],
  P002: [
    { name: 'Percentage → Decimal', description: 'Convert a percentage to a decimal.', difficulty: 3, generatorKind: 'pctConvert', fluencyTargetSeconds: 8, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['pct/move-point-wrong'] },
    { name: 'Percentage → Fraction', description: 'Convert a percentage to a fraction in lowest terms.', difficulty: 3, generatorKind: 'pctConvert', fluencyTargetSeconds: 12, misconceptionTags: ['pct/keep-percent-sign'] },
  ],
  P003: [
    { name: 'Find the Percentage of a Quantity', description: 'Calculate p% of a whole number.', difficulty: 3, generatorKind: 'pctOfQuantity', fluencyTargetSeconds: 12, misconceptionTags: ['pct/forgot-divide-100'] },
    { name: 'Percentage of a Quantity (Word)', description: 'Apply percentage of quantity in a real-world context.', difficulty: 3, generatorKind: 'pctOfQuantity', fluencyTargetSeconds: 16, misconceptionTags: ['pct/forgot-divide-100'] },
  ],
  P004: [
    { name: 'Express as a Percentage', description: 'Write one quantity as a percentage of another.', difficulty: 3, generatorKind: 'pctExpress', fluencyTargetSeconds: 15, misconceptionTags: ['pct/wrong-base'] },
    { name: 'Express (Word Problem)', description: 'Identify the whole and express the part as a percentage.', difficulty: 4, generatorKind: 'pctExpress', fluencyTargetSeconds: 20, misconceptionTags: ['pct/wrong-base'] },
  ],
  P005: [
    { name: 'Find the Whole', description: 'Given p% = known part, find the whole.', difficulty: 4, generatorKind: 'pctFindWhole', fluencyTargetSeconds: 25, misconceptionTags: ['pct/part-is-whole'] },
    { name: 'Find the Whole (Harder)', description: 'Multi-step: find the whole from a non-round percentage.', difficulty: 4, generatorKind: 'pctFindWhole', fluencyTargetSeconds: 30, misconceptionTags: ['pct/part-is-whole'] },
  ],
  P006: [
    { name: 'Percentage Increase', description: 'Increase a quantity by a given percentage.', difficulty: 4, generatorKind: 'pctIncreaseDecrease', fluencyTargetSeconds: 18, misconceptionTags: ['pct/add-percent-not-amount'] },
    { name: 'Percentage Decrease', description: 'Decrease a quantity by a given percentage.', difficulty: 4, generatorKind: 'pctIncreaseDecrease', fluencyTargetSeconds: 18, misconceptionTags: ['pct/base-after-not-before'] },
  ],
  P007: [
    { name: 'Before and After Change', description: 'Find the original total using a percentage that stays constant.', difficulty: 4, generatorKind: 'pctBeforeAfter', fluencyTargetSeconds: 30, misconceptionTags: ['pct/percent-of-different-base'] },
    { name: 'Before and After (Harder)', description: 'Two-step before/after problem with a changing total.', difficulty: 5, generatorKind: 'pctBeforeAfter', fluencyTargetSeconds: 35, misconceptionTags: ['pct/percent-of-different-base'] },
  ],
  P008: [
    { name: 'Find the Discounted Price', description: 'Apply a percentage discount to find the selling price.', difficulty: 3, generatorKind: 'pctDiscount', fluencyTargetSeconds: 18, misconceptionTags: ['pct/discount-of-discounted'] },
    { name: 'Find the Discount Amount', description: 'Calculate the dollar discount, then the selling price.', difficulty: 3, generatorKind: 'pctDiscount', fluencyTargetSeconds: 20, misconceptionTags: ['pct/discount-of-discounted'] },
  ],
  P009: [
    { name: 'GST — Find Total', description: 'Add GST percentage to the pre-tax price.', difficulty: 3, generatorKind: 'pctGST', fluencyTargetSeconds: 15, misconceptionTags: ['pct/gst-wrong-base'] },
    { name: 'GST — Find GST Amount', description: 'Calculate the GST amount and the final bill.', difficulty: 3, generatorKind: 'pctGST', fluencyTargetSeconds: 18, misconceptionTags: ['pct/gst-wrong-base'] },
  ],
  P010: [
    { name: 'Simple Interest', description: 'Calculate simple interest: I = P × r% × t.', difficulty: 4, generatorKind: 'pctInterest', fluencyTargetSeconds: 25, misconceptionTags: ['pct/interest-compound-confuse'] },
    { name: 'Simple Interest (Total Amount)', description: 'Find the total amount after earning simple interest.', difficulty: 4, generatorKind: 'pctInterest', fluencyTargetSeconds: 28, misconceptionTags: ['pct/interest-compound-confuse'] },
  ],
};

const families = Object.entries(familiesBySkillBlueprint).flatMap(([skillId, configs]) =>
  configs.map((config, index) => buildFamily(skillId, index + 1, config))
);

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

export function validatePercentageQuestionFamilies() {
  const orphanFamilies = families
    .filter((family) => !SKILL_IDS.has(family.skillId))
    .map((family) => family.id);

  const referenced = new Set(percentageSkillGraph.skills.flatMap((skill) => skill.questionFamilies));
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

export const percentageQuestionFamilies = families;

export default percentageQuestionFamilies;
