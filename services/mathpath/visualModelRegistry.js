export const VISUAL_MODEL_TYPES = [
  'fraction_strip',
  'shaded_fraction_model',
  'number_line',
  'bar_model',
  'geometry_shape',
  'geometry_diagram',
  'table',
  'graph',
  'picture_model',
];

const VISUAL_MODEL_ALIASES = {
  fraction_bar: 'fraction_strip',
  fraction_model: 'shaded_fraction_model',
  shaded_shape: 'shaded_fraction_model',
  shaded_grid: 'shaded_fraction_model',
  part_whole_cards: 'picture_model',
  area_model: 'shaded_fraction_model',
  comparison_model: 'bar_model',
  comparison_models: 'bar_model',
  line_graph: 'graph',
  bar_graph: 'graph',
  bar_chart: 'graph',
  shape: 'geometry_shape',
};

const VISUAL_MODEL_METADATA = {
  fraction_strip: {
    label: 'Fraction Strip',
    description: 'Shows equal parts along one strip or bar.',
    pedagogicalUse: 'Compare size, equivalence, and same-whole fraction reasoning.',
    singaporeMathUse: 'Common concrete-pictorial bridge for fractions.',
    supports: ['diagnostics', 'practice', 'worksheets', 'remediation'],
  },
  shaded_fraction_model: {
    label: 'Shaded Fraction Model',
    description: 'Shows selected or shaded parts of one whole.',
    pedagogicalUse: 'Identify numerator, denominator, equal parts, and part-whole meaning.',
    singaporeMathUse: 'Expected visual support for early fraction recognition.',
    supports: ['diagnostics', 'practice', 'worksheets', 'paper_analysis'],
  },
  number_line: {
    label: 'Number Line',
    description: 'Places fractions on a scaled line.',
    pedagogicalUse: 'Build magnitude, ordering, and benchmark reasoning.',
    singaporeMathUse: 'Supports transition from area models to number sense.',
    supports: ['diagnostics', 'practice', 'worksheets', 'remediation'],
  },
  bar_model: {
    label: 'Bar Model',
    description: 'Represents problem quantities using Singapore model-method bars.',
    pedagogicalUse: 'Clarify part-whole, comparison, remainder, and multi-step word problems.',
    singaporeMathUse: 'Core Singapore Math representation for word-problem reasoning.',
    supports: ['diagnostics', 'practice', 'worksheets', 'paper_analysis', 'remediation'],
  },
  geometry_shape: {
    label: 'Geometry Shape',
    description: 'Shows basic shapes and labelled properties.',
    pedagogicalUse: 'Support shape recognition and measurement reasoning.',
    singaporeMathUse: 'Required for geometry and measurement items.',
    supports: ['diagnostics', 'practice', 'worksheets'],
  },
  geometry_diagram: {
    label: 'Geometry Diagram',
    description: 'Shows labelled angles, lengths, areas, or composite figures.',
    pedagogicalUse: 'Support multi-step geometry reasoning.',
    singaporeMathUse: 'Required for upper-primary geometry questions.',
    supports: ['diagnostics', 'practice', 'worksheets', 'paper_analysis'],
  },
  table: {
    label: 'Table',
    description: 'Organises values in rows and columns.',
    pedagogicalUse: 'Support data handling, patterns, and comparison tasks.',
    singaporeMathUse: 'Common representation in school papers and worksheets.',
    supports: ['diagnostics', 'practice', 'worksheets', 'paper_analysis'],
  },
  graph: {
    label: 'Graph',
    description: 'Shows values visually using charts or graph axes.',
    pedagogicalUse: 'Support data interpretation.',
    singaporeMathUse: 'Required for data handling items.',
    supports: ['diagnostics', 'practice', 'worksheets', 'paper_analysis'],
  },
  picture_model: {
    label: 'Picture Model',
    description: 'Shows countable objects or grouped quantities.',
    pedagogicalUse: 'Support fraction of a set, countable objects, and part-whole contexts.',
    singaporeMathUse: 'Useful for lower-primary and quantity-based questions.',
    supports: ['diagnostics', 'practice', 'worksheets', 'remediation'],
  },
};

export function normalizeVisualType(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (VISUAL_MODEL_TYPES.includes(raw)) return raw;
  return VISUAL_MODEL_ALIASES[raw] || '';
}

export function normalizeVisualTypes(values = []) {
  return [...new Set((values || []).map(normalizeVisualType).filter(Boolean))];
}

export function getVisualModelMetadata(type = '') {
  const normalized = normalizeVisualType(type);
  return normalized ? { type: normalized, ...VISUAL_MODEL_METADATA[normalized] } : null;
}

export function getVisualModelRegistry() {
  return VISUAL_MODEL_TYPES.map((type) => getVisualModelMetadata(type));
}

export function isSupportedVisualType(type = '') {
  return Boolean(normalizeVisualType(type));
}

export default {
  VISUAL_MODEL_TYPES,
  normalizeVisualType,
  normalizeVisualTypes,
  getVisualModelMetadata,
  getVisualModelRegistry,
  isSupportedVisualType,
};
