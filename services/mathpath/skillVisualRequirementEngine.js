import { getVisualModelMetadata, normalizeVisualTypes } from './visualModelRegistry.js';

const FRACTION_SKILL_NAMES = {
  F001: 'Recognise Fractions',
  F002: 'Numerator and Denominator',
  F003: 'Fraction of a Whole',
  F004: 'Unit Fractions',
  F005: 'Fractions on Number Line',
  F006: 'Compare Unit Fractions',
  F007: 'Compare Same Denominator',
  F008: 'Compare Same Numerator',
  F009: 'Order Fractions',
  F010: 'Equivalent Fractions',
  F011: 'Generate Equivalent Fractions',
  F012: 'Simplify Fractions',
  F013: 'Improper Fractions',
  F014: 'Mixed Numbers',
  F015: 'Convert Mixed and Improper',
  F016: 'Add Same Denominator',
  F017: 'Subtract Same Denominator',
  F018: 'Add Different Denominators',
  F019: 'Subtract Different Denominators',
  F020: 'Fraction of Quantity',
  F021: 'Multiply Fractions',
  F022: 'Divide Fractions',
  F023: 'Fraction Word Problems',
  F024: 'Multi-Step Fraction Problems',
  F025: 'Exam-Style Fraction Applications',
  F026: 'Fractions Mastery Challenge',
};

const FRACTION_SKILL_REQUIREMENTS = {
  F001: { required: ['shaded_fraction_model'], optional: ['fraction_strip', 'picture_model'], reason: 'Students must see equal parts and shaded/selected parts.' },
  F002: { required: ['shaded_fraction_model'], optional: ['fraction_strip'], reason: 'Numerator and denominator should be anchored to visible selected and total equal parts.' },
  F003: { required: ['shaded_fraction_model'], optional: ['picture_model', 'fraction_strip'], reason: 'Part-whole meaning needs a visible whole or set model.' },
  F004: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Unit-fraction size is best supported by equal strips.' },
  F005: { required: ['number_line'], optional: ['fraction_strip'], reason: 'Number-line fractions require positional magnitude representation.' },
  F006: { required: ['fraction_strip'], optional: ['number_line'], reason: 'Comparing unit fractions needs visual denominator-size reasoning.' },
  F007: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Same-denominator comparison should show equal-sized parts.' },
  F008: { required: ['fraction_strip'], optional: ['number_line'], reason: 'Same-numerator comparison should show the effect of denominator size.' },
  F009: { required: ['number_line'], optional: ['fraction_strip'], reason: 'Ordering fractions benefits from magnitude placement.' },
  F010: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Equivalent fractions should show equal value using different partitions.' },
  F011: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Generating equivalent fractions needs scaling support.' },
  F012: { required: ['fraction_strip'], optional: ['number_line'], reason: 'Simplification should preserve visible value while changing parts.' },
  F013: { required: ['shaded_fraction_model'], optional: ['fraction_strip'], reason: 'Improper fractions need more-than-one-whole representation.' },
  F014: { required: ['shaded_fraction_model'], optional: ['fraction_strip'], reason: 'Mixed numbers need whole-plus-part representation.' },
  F015: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Mixed-improper conversion needs visible groups of denominator-sized wholes.' },
  F016: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Adding like fractions should preserve the same denominator visually.' },
  F017: { required: ['fraction_strip'], optional: ['shaded_fraction_model'], reason: 'Subtracting like fractions should show removal from equal parts.' },
  F018: { required: ['fraction_strip'], optional: ['number_line'], reason: 'Unlike-denominator addition needs common-denominator visual support.' },
  F019: { required: ['fraction_strip'], optional: ['number_line'], reason: 'Unlike-denominator subtraction needs common-denominator visual support.' },
  F020: { required: ['picture_model'], optional: ['fraction_strip'], reason: 'Fraction of quantity should show grouped countable objects or quantities.' },
  F021: { required: ['shaded_fraction_model'], optional: ['fraction_strip'], reason: 'Multiplying fractions benefits from area/scaling models.' },
  F022: { required: ['fraction_strip'], optional: ['picture_model'], reason: 'Dividing fractions benefits from sharing or reciprocal visual support.' },
  F023: { required: ['bar_model'], optional: ['picture_model'], reason: 'Fraction word problems should support Singapore model-method reasoning.' },
  F024: { required: ['bar_model'], optional: ['number_line'], reason: 'Multi-step fraction problems need visual structure and step tracking.' },
  F025: { required: ['bar_model'], optional: ['fraction_strip'], reason: 'Exam-style applications should include model-method support.' },
  F026: { required: ['bar_model'], optional: ['fraction_strip', 'number_line'], reason: 'Mastery challenge questions need flexible visual support for complex reasoning.' },
};

const TEXT_VISUAL_RULES = [
  { visualType: 'number_line', patterns: [/number\s*line/i, /\bbetween\s+0\s+and\s+1\b/i], reason: 'Question language references a number line or magnitude position.' },
  { visualType: 'bar_model', patterns: [/remainder/i, /\bleft\b/i, /\bspent\b/i, /\bgave away\b/i, /\bat first\b/i, /\bmore than\b/i, /\bless than\b/i], reason: 'Word-problem structure benefits from a bar model.' },
  { visualType: 'table', patterns: [/\btable\b/i, /\bdata\b/i, /\btally\b/i], reason: 'Question language references tabular data.' },
  { visualType: 'graph', patterns: [/\bgraph\b/i, /\bchart\b/i, /\bbar chart\b/i, /\bline graph\b/i], reason: 'Question language references graph data.' },
  { visualType: 'geometry_diagram', patterns: [/\bangle\b/i, /\btriangle\b/i, /\brectangle\b/i, /\bperimeter\b/i, /\barea\b/i], reason: 'Geometry language needs a labelled diagram.' },
  { visualType: 'shaded_fraction_model', patterns: [/\bshaded\b/i, /\bshape\b/i, /\bequal parts?\b/i, /\bwhole\b/i], reason: 'Part-whole fraction wording needs a visible shaded model.' },
  { visualType: 'picture_model', patterns: [/\bof\s+\d+\b/i, /\bobjects?\b/i, /\bcards?\b/i, /\bapples?\b/i, /\bstickers?\b/i], reason: 'Countable quantity wording benefits from grouped objects.' },
];

function normalizeSkillId(value = '') {
  return String(value || '').trim().toUpperCase();
}

function textOf(question = {}) {
  return String(question.questionText || question.prompt || question.text || question.stem || question.title || '').trim();
}

function skillIdOf(question = {}) {
  return normalizeSkillId(question.skillId || question.skillCode || question.frameworkSkillId || question.officialSkillCode || question.metadata?.mathPathSkillId);
}

function extractProvidedVisualTypes(question = {}) {
  const metadata = question.metadata || {};
  return normalizeVisualTypes([
    question.visualType,
    question.visualHintType,
    question.diagramType,
    question.diagramSpec?.type,
    question.diagram?.type,
    question.visual?.type,
    question.visual?.payload?.type,
    question.visualModel?.type,
    question.figureUrl ? 'picture_model' : '',
    question.hasFigure ? 'picture_model' : '',
    ...(question.providedVisualTypes || []),
    metadata.visualType,
    metadata.visualHintType,
    metadata.diagramType,
    metadata.diagramSpec?.type,
    metadata.diagram?.type,
    metadata.visual?.type,
    metadata.visual?.payload?.type,
    metadata.visualModel?.type,
    ...(metadata.providedVisualTypes || []),
  ]);
}

function hasVisualEvidence(question = {}) {
  const metadata = question.metadata || {};
  return Boolean(
    question.diagram ||
    question.diagramSpec ||
    question.visual ||
    question.visualModel ||
    question.visualHintType ||
    question.imageUrl ||
    question.assetUrl ||
    question.figureUrl ||
    question.hasFigure ||
    metadata.diagram ||
    metadata.diagramSpec ||
    metadata.visual ||
    metadata.visualModel ||
    metadata.visualHintType ||
    metadata.visualType
  );
}

export function getSkillVisualRequirement(skillId = '') {
  const normalizedSkillId = normalizeSkillId(skillId);
  const rule = FRACTION_SKILL_REQUIREMENTS[normalizedSkillId] || { required: [], optional: [], reason: 'No visual model is required by configured MathPath rules.' };
  const requiredVisualTypes = normalizeVisualTypes(rule.required);
  const optionalVisualTypes = normalizeVisualTypes(rule.optional);
  return {
    skillId: normalizedSkillId,
    skillName: FRACTION_SKILL_NAMES[normalizedSkillId] || normalizedSkillId,
    visualRequired: requiredVisualTypes.length > 0,
    requiredVisualTypes,
    optionalVisualTypes,
    visualRequirement: requiredVisualTypes.length ? 'required' : optionalVisualTypes.length ? 'optional' : 'not_required',
    reason: rule.reason,
    requiredVisualModels: requiredVisualTypes.map(getVisualModelMetadata).filter(Boolean),
    optionalVisualModels: optionalVisualTypes.map(getVisualModelMetadata).filter(Boolean),
  };
}

export function inferTextVisualRequirements(question = {}) {
  const text = textOf(question);
  return TEXT_VISUAL_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => ({ visualType: rule.visualType, reason: rule.reason, source: 'text_rule' }));
}

export function evaluateQuestionVisualCoverage(question = {}) {
  const skillRequirement = getSkillVisualRequirement(skillIdOf(question));
  const textRequirements = inferTextVisualRequirements(question);
  const requiredVisualTypes = normalizeVisualTypes([
    ...skillRequirement.requiredVisualTypes,
    ...textRequirements.map((row) => row.visualType),
    ...(question.requiredVisualTypes || []),
    ...(question.metadata?.requiredVisualTypes || []),
  ]);
  const optionalVisualTypes = normalizeVisualTypes(skillRequirement.optionalVisualTypes);
  const providedVisualTypes = extractProvidedVisualTypes(question);
  const hasVisual = hasVisualEvidence(question);
  const missingVisualTypes = requiredVisualTypes.filter((type) => !providedVisualTypes.includes(type));

  return {
    skillId: skillRequirement.skillId,
    skillName: skillRequirement.skillName,
    diagramRequired: requiredVisualTypes.length > 0,
    visualModelRequired: requiredVisualTypes.length > 0,
    requiredVisualTypes,
    optionalVisualTypes,
    providedVisualTypes,
    hasVisual,
    missingVisualTypes,
    requirements: [
      ...skillRequirement.requiredVisualTypes.map((visualType) => ({ visualType, reason: skillRequirement.reason, source: 'skill_rule' })),
      ...textRequirements,
    ],
    status: requiredVisualTypes.length === 0 ? 'not_required' : missingVisualTypes.length ? 'missing' : 'present',
  };
}

export function auditSkillVisualRequirements(skillIds = Object.keys(FRACTION_SKILL_REQUIREMENTS), questions = []) {
  const questionsBySkill = new Map();
  (questions || []).forEach((question) => {
    const skillId = skillIdOf(question);
    if (!skillId) return;
    if (!questionsBySkill.has(skillId)) questionsBySkill.set(skillId, []);
    questionsBySkill.get(skillId).push(question);
  });

  return [...new Set(skillIds.map(normalizeSkillId).filter(Boolean))]
    .map((skillId) => {
      const requirement = getSkillVisualRequirement(skillId);
      const rows = (questionsBySkill.get(skillId) || []).map(evaluateQuestionVisualCoverage);
      const visualQuestionCount = rows.filter((row) => row.hasVisual).length;
      const missingQuestionCount = rows.filter((row) => row.missingVisualTypes.length).length;
      return {
        skillId,
        skillName: requirement.skillName,
        diagramRequired: requirement.visualRequired,
        visualModelRequired: requirement.visualRequired,
        visualRequirement: requirement.visualRequirement,
        requiredVisualTypes: requirement.requiredVisualTypes,
        optionalVisualTypes: requirement.optionalVisualTypes,
        currentStatus: rows.length
          ? missingQuestionCount
            ? 'partial'
            : 'implemented'
          : requirement.visualRequired
            ? 'missing_evidence'
            : 'not_required',
        implementedQuestionCount: visualQuestionCount,
        missingQuestionCount,
        auditedQuestionCount: rows.length,
        qualityConcerns: [
          ...(rows.length === 0 && requirement.visualRequired ? ['No audited questions with visual evidence found for this skill.'] : []),
          ...(missingQuestionCount ? [`${missingQuestionCount} audited question(s) missing required visual metadata.`] : []),
        ],
        reason: requirement.reason,
      };
    });
}

export function getFractionVisualRequirementAudit(questions = []) {
  return auditSkillVisualRequirements(Object.keys(FRACTION_SKILL_REQUIREMENTS), questions);
}

export default {
  getSkillVisualRequirement,
  inferTextVisualRequirements,
  evaluateQuestionVisualCoverage,
  auditSkillVisualRequirements,
  getFractionVisualRequirementAudit,
};
