import { ratioRateSkillGraph } from './ratioRateSkillGraph.js';

// Question families for the Ratio & Rate domain. Each family maps one-to-one
// with a generator kind in ratioRateQuestionGenerator.js. Mirrors the
// percentageQuestionFamilies.js shape exactly.

const SKILL_IDS = new Set(ratioRateSkillGraph.skillIds);

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
  R001: [
    { name: 'Ratio from a Description', description: 'Write the ratio of two quantities from a word description (MCQ).', difficulty: 2, generatorKind: 'rrMeaning', fluencyTargetSeconds: 20, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/order-reversed'] },
    { name: 'Ratio Part-to-Whole', description: 'Identify a part-to-whole ratio from a set of objects (MCQ).', difficulty: 2, generatorKind: 'rrMeaning', fluencyTargetSeconds: 22, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/part-whole-mixup'] },
  ],
  R002: [
    { name: 'Complete the Equivalent Ratio', description: 'Fill in the missing term to make two ratios equivalent.', difficulty: 3, generatorKind: 'rrEquivalent', fluencyTargetSeconds: 6, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/add-not-multiply'] },
    { name: 'Equivalent Ratio (Word)', description: 'Apply equivalent ratios in a real-world scaling context.', difficulty: 3, generatorKind: 'rrEquivalent', fluencyTargetSeconds: 10, misconceptionTags: ['rr/add-not-multiply'] },
  ],
  R003: [
    { name: 'Simplify a Two-Term Ratio', description: 'Write a ratio in its simplest form by dividing by the HCF.', difficulty: 3, generatorKind: 'rrSimplify', fluencyTargetSeconds: 6, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/incomplete-simplify'] },
    { name: 'Simplify (Larger Numbers)', description: 'Simplify a ratio with larger numbers requiring the HCF.', difficulty: 3, generatorKind: 'rrSimplify', fluencyTargetSeconds: 10, misconceptionTags: ['rr/incomplete-simplify'] },
  ],
  R004: [
    { name: 'Simplify a Three-Term Ratio', description: 'Reduce a : b : c to simplest form.', difficulty: 4, generatorKind: 'rrThreeTerm', fluencyTargetSeconds: 12, misconceptionTags: ['rr/pairwise-only'] },
    { name: 'Three-Term Ratio (Word)', description: 'Form and simplify a three-term ratio from a word description.', difficulty: 4, generatorKind: 'rrThreeTerm', fluencyTargetSeconds: 15, misconceptionTags: ['rr/pairwise-only'] },
  ],
  R005: [
    { name: 'Fraction of the Whole', description: 'Express each part of a ratio as a fraction of the total.', difficulty: 3, generatorKind: 'rrRatioFraction', fluencyTargetSeconds: 15, misconceptionTags: ['rr/part-part-as-fraction'] },
    { name: 'Ratio to Fraction (Word)', description: 'Find what fraction one group is of the whole in a word problem.', difficulty: 3, generatorKind: 'rrRatioFraction', fluencyTargetSeconds: 18, misconceptionTags: ['rr/part-part-as-fraction'] },
  ],
  R006: [
    { name: 'Ratio to Percentage', description: 'Convert a part-to-whole ratio to a percentage.', difficulty: 3, generatorKind: 'rrRatioPercent', fluencyTargetSeconds: 15, misconceptionTags: ['rr/percent-of-part'] },
    { name: 'Ratio to Percentage (Word)', description: 'Find what percentage of a total one group represents.', difficulty: 3, generatorKind: 'rrRatioPercent', fluencyTargetSeconds: 18, misconceptionTags: ['rr/percent-of-part'] },
  ],
  R007: [
    { name: 'Divide in a Two-Part Ratio', description: 'Share a total between two people in a given ratio.', difficulty: 4, generatorKind: 'rrDivide', fluencyTargetSeconds: 20, misconceptionTags: ['rr/forgot-total-units'] },
    { name: 'Divide in a Ratio (Find Both Shares)', description: 'Find each share when dividing in a ratio.', difficulty: 4, generatorKind: 'rrDivide', fluencyTargetSeconds: 22, misconceptionTags: ['rr/unit-then-stop'] },
  ],
  R008: [
    { name: 'Divide in a Three-Part Ratio', description: 'Share a total among three people; find the largest share.', difficulty: 4, generatorKind: 'rrDivideThree', fluencyTargetSeconds: 25, misconceptionTags: ['rr/three-units-error'] },
    { name: 'Three-Part Ratio (Find Each Share)', description: 'Find all three shares when dividing in a 3-part ratio.', difficulty: 4, generatorKind: 'rrDivideThree', fluencyTargetSeconds: 28, misconceptionTags: ['rr/three-units-error'] },
  ],
  R009: [
    { name: 'Ratio Before and After', description: 'Solve a before-and-after ratio problem with one unchanging anchor.', difficulty: 5, generatorKind: 'rrBeforeAfter', fluencyTargetSeconds: 35, misconceptionTags: ['rr/assume-total-constant'] },
    { name: 'Ratio Change (Harder)', description: 'A two-step before-and-after ratio problem.', difficulty: 5, generatorKind: 'rrBeforeAfter', fluencyTargetSeconds: 40, misconceptionTags: ['rr/assume-total-constant'] },
  ],
  R010: [
    { name: 'Combine Two Ratios', description: 'Merge A:B and B:C into A:B:C by equalising the common term.', difficulty: 5, generatorKind: 'rrCombine', fluencyTargetSeconds: 30, misconceptionTags: ['rr/no-common-term'] },
    { name: 'Combine Ratios — Find A:C', description: 'Find A:C directly from two overlapping two-term ratios.', difficulty: 5, generatorKind: 'rrCombine', fluencyTargetSeconds: 32, misconceptionTags: ['rr/no-common-term'] },
  ],
  R011: [
    { name: 'Find the Unit Rate', description: 'Given a total cost and quantity, find the cost per unit.', difficulty: 3, generatorKind: 'rrRate', fluencyTargetSeconds: 7, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/rate-inverted'] },
    { name: 'Rate Word Problem', description: 'Apply unit rate to find cost for a different quantity.', difficulty: 3, generatorKind: 'rrRate', fluencyTargetSeconds: 12, misconceptionTags: ['rr/rate-inverted'] },
  ],
  R012: [
    { name: 'Tiered Rate Bill', description: 'Calculate a bill where two different rates apply to different usage amounts.', difficulty: 4, generatorKind: 'rrRateTiered', fluencyTargetSeconds: 25, misconceptionTags: ['rr/flat-rate'] },
    { name: 'Tiered Rate (Word)', description: 'A tariff word problem with a two-tier electricity or water bill.', difficulty: 4, generatorKind: 'rrRateTiered', fluencyTargetSeconds: 28, misconceptionTags: ['rr/flat-rate'] },
  ],
  R013: [
    { name: 'Speed = Distance ÷ Time', description: 'Find speed given distance and time.', difficulty: 3, generatorKind: 'rrSpeed', fluencyTargetSeconds: 10, workingRequired: false, mentalMathEligible: true, misconceptionTags: ['rr/formula-confusion'] },
    { name: 'Distance or Time from Speed', description: 'Find distance or time given speed and one other quantity.', difficulty: 3, generatorKind: 'rrSpeed', fluencyTargetSeconds: 12, misconceptionTags: ['rr/unit-mismatch'] },
  ],
  R014: [
    { name: 'Average Speed (Two Legs)', description: 'Find average speed for a two-leg journey using total distance ÷ total time.', difficulty: 5, generatorKind: 'rrSpeedAvg', fluencyTargetSeconds: 35, misconceptionTags: ['rr/avg-of-speeds'] },
    { name: 'Average Speed (Harder)', description: 'Average speed with unequal leg distances.', difficulty: 5, generatorKind: 'rrSpeedAvg', fluencyTargetSeconds: 40, misconceptionTags: ['rr/avg-of-speeds'] },
  ],
  R015: [
    { name: 'Direct Proportion (Unitary Method)', description: 'Use the unitary method: find 1 unit then scale up.', difficulty: 3, generatorKind: 'rrProportion', fluencyTargetSeconds: 15, misconceptionTags: ['rr/additive-not-multiplicative'] },
    { name: 'Proportion Word Problem', description: 'Solve a direct-proportion word problem.', difficulty: 3, generatorKind: 'rrProportion', fluencyTargetSeconds: 18, misconceptionTags: ['rr/additive-not-multiplicative'] },
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

export function validateRatioRateQuestionFamilies() {
  const orphanFamilies = families
    .filter((family) => !SKILL_IDS.has(family.skillId))
    .map((family) => family.id);

  const referenced = new Set(ratioRateSkillGraph.skills.flatMap((skill) => skill.questionFamilies));
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

export const ratioRateQuestionFamilies = families;

export default ratioRateQuestionFamilies;
