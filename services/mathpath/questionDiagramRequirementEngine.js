const VISUAL_TYPES = [
  'fraction_model',
  'fraction_strip',
  'shaded_shape',
  'number_line',
  'bar_model',
  'geometry_diagram',
  'table',
  'graph',
  'picture_model',
];

const SKILL_VISUAL_RULES = [
  { skillIds: ['F001', 'F002', 'F003', 'F004'], visualType: 'shaded_shape', reason: 'Early fraction recognition needs a visible part-whole model.' },
  { skillIds: ['F005'], visualType: 'number_line', reason: 'Fractions on a number line require a number-line representation.' },
  { skillIds: ['F010', 'F011', 'F012'], visualType: 'fraction_strip', reason: 'Equivalent and simplified fractions benefit from strip or area models.' },
  { skillIds: ['F020'], visualType: 'picture_model', reason: 'Fraction of a set should show countable objects or grouped parts.' },
  { skillIds: ['F023', 'F024', 'F025', 'F026'], visualType: 'bar_model', reason: 'Singapore Math word problems should support model-method reasoning.' },
];

const TEXT_VISUAL_RULES = [
  { visualType: 'number_line', patterns: [/number\s*line/i, /\bbetween\s+0\s+and\s+1\b/i], reason: 'Question language references position or a number line.' },
  { visualType: 'bar_model', patterns: [/remainder/i, /\bleft\b/i, /\bspent\b/i, /\bgave away\b/i, /\bat first\b/i, /\bmore than\b/i, /\bless than\b/i], reason: 'Word-problem structure needs a bar model for interpretation.' },
  { visualType: 'table', patterns: [/\btable\b/i, /\bdata\b/i, /\btally\b/i], reason: 'Data handling question references tabular information.' },
  { visualType: 'graph', patterns: [/\bgraph\b/i, /\bchart\b/i, /\bbar chart\b/i, /\bline graph\b/i], reason: 'Data handling question references a graph.' },
  { visualType: 'geometry_diagram', patterns: [/\bangle\b/i, /\btriangle\b/i, /\brectangle\b/i, /\bperimeter\b/i, /\barea\b/i, /\bshape\b/i], reason: 'Geometry language needs a labelled diagram.' },
  { visualType: 'shaded_shape', patterns: [/\bshaded\b/i, /\bshape\b/i, /\bparts?\b/i, /\bwhole\b/i], reason: 'Part-whole fraction wording needs a visible shaded model.' },
  { visualType: 'picture_model', patterns: [/\bof\s+\d+\b/i, /\bobjects?\b/i, /\bcards?\b/i, /\bapples?\b/i, /\bstickers?\b/i], reason: 'Countable quantity wording benefits from a picture or grouped-object model.' },
];

function normalizeSkillId(question = {}) {
  return String(question.skillId || question.skillCode || question.frameworkSkillId || '').trim().toUpperCase();
}

function questionText(question = {}) {
  return String(question.questionText || question.prompt || question.text || question.stem || question.title || '').trim();
}

function uniqueByType(requirements = []) {
  const seen = new Set();
  return requirements.filter((item) => {
    if (!item?.visualType || seen.has(item.visualType)) return false;
    seen.add(item.visualType);
    return true;
  });
}

function hasVisualEvidence(question = {}) {
  const metadata = question.metadata || {};
  return Boolean(
    question.diagram ||
    question.diagramSpec ||
    question.visualModel ||
    question.visualHintType ||
    question.imageUrl ||
    question.assetUrl ||
    metadata.diagram ||
    metadata.diagramSpec ||
    metadata.visualModel ||
    metadata.visualHintType ||
    metadata.visualType
  );
}

function existingVisualTypes(question = {}) {
  const metadata = question.metadata || {};
  const raw = [
    question.visualType,
    question.visualHintType,
    question.diagramType,
    question.diagramSpec?.type,
    question.diagram?.type,
    question.visualModel?.type,
    metadata.visualType,
    metadata.visualHintType,
    metadata.diagramType,
    metadata.diagramSpec?.type,
    metadata.diagram?.type,
    metadata.visualModel?.type,
  ]
    .flat()
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return raw.filter((value) => VISUAL_TYPES.includes(value));
}

export function evaluateDiagramRequirement(question = {}) {
  const skillId = normalizeSkillId(question);
  const text = questionText(question);
  const requirements = [];

  SKILL_VISUAL_RULES.forEach((rule) => {
    if (rule.skillIds.includes(skillId)) {
      requirements.push({ visualType: rule.visualType, reason: rule.reason, source: 'skill_rule' });
    }
  });

  TEXT_VISUAL_RULES.forEach((rule) => {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      requirements.push({ visualType: rule.visualType, reason: rule.reason, source: 'text_rule' });
    }
  });

  const requiredVisuals = uniqueByType(requirements);
  const providedVisuals = existingVisualTypes(question);
  const hasVisual = hasVisualEvidence(question);
  const missingVisuals = requiredVisuals
    .filter((requirement) => !hasVisual || (providedVisuals.length && !providedVisuals.includes(requirement.visualType)))
    .map((requirement) => requirement.visualType);

  return {
    requiresDiagram: requiredVisuals.length > 0,
    requiredVisuals,
    providedVisuals,
    hasVisual,
    missingVisuals: [...new Set(missingVisuals)],
    status: requiredVisuals.length === 0 ? 'not_required' : missingVisuals.length ? 'missing' : 'present',
  };
}

export function getRequiredVisualTypes(question = {}) {
  return evaluateDiagramRequirement(question).requiredVisuals.map((item) => item.visualType);
}

export default {
  evaluateDiagramRequirement,
  getRequiredVisualTypes,
};
