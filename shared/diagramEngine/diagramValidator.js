import {
  createDiagramSpec,
  DIAGRAM_SCHEMA_VERSION,
  DIAGRAM_TYPE_BY_TYPE,
  DIAGRAM_TYPES,
  LEGACY_DIAGRAM_TYPE_ALIASES,
} from './diagramTypes.js';

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isPositive(value) {
  return Number.isFinite(value) && value > 0;
}

function isNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}

function asNumber(value, fallback = NaN) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function labelOverlapRisk({ start, end, width, values = [] }) {
  if (!values.length || end <= start) return false;
  const pxPerUnit = (width - 80) / (end - start);
  const xs = values
    .map((value) => 40 + (value - start) * pxPerUnit)
    .sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i += 1) {
    if (xs[i] - xs[i - 1] < 18) return true;
  }
  return false;
}

function validateCommon(spec, errors) {
  if (!isObject(spec)) {
    errors.push('Diagram spec must be an object.');
    return;
  }
  if (!spec.id || typeof spec.id !== 'string') errors.push('id is required.');
  if (!spec.type || typeof spec.type !== 'string') errors.push('type is required.');
  if (spec.schemaVersion !== DIAGRAM_SCHEMA_VERSION) errors.push(`schemaVersion must be "${DIAGRAM_SCHEMA_VERSION}".`);
  if (!DIAGRAM_TYPES.includes(spec.type)) errors.push(`Unsupported diagram type "${spec.type}".`);
  if (!isObject(spec.labels)) errors.push('labels must be an object.');
  if (!isObject(spec.metadata)) errors.push('metadata must be an object.');
  if (!isPositive(asNumber(spec.width))) errors.push('width must be > 0.');
  if (!isPositive(asNumber(spec.height))) errors.push('height must be > 0.');
  if (!isObject(spec.data)) errors.push('data must be an object.');
}

const validators = {
  number_line(spec, errors) {
    const d = spec.data;
    const start = asNumber(d.start, NaN);
    const end = asNumber(d.end, NaN);
    const step = asNumber(d.step, NaN);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) errors.push('number_line: start must be < end.');
    if (!isPositive(step)) errors.push('number_line: step must be > 0.');
    if (Array.isArray(d.points)) {
      d.points.forEach((point, index) => {
        const value = asNumber(point?.value, NaN);
        if (!Number.isFinite(value)) errors.push(`number_line: points[${index}].value must be numeric.`);
        if (Number.isFinite(value) && Number.isFinite(start) && Number.isFinite(end) && (value < start || value > end)) {
          errors.push(`number_line: points[${index}] value is outside range.`);
        }
      });
      const values = d.points.map((point) => asNumber(point?.value, NaN)).filter(Number.isFinite);
      if (Number.isFinite(start) && Number.isFinite(end) && labelOverlapRisk({
        start,
        end,
        width: asNumber(spec.width, 640),
        values,
      })) {
        errors.push('number_line: labels are too close and may overlap.');
      }
    }
  },
  fraction_model(spec, errors) {
    const d = spec.data;
    if (!isPositive(asNumber(d.parts))) errors.push('fraction_model: parts must be > 0.');
    if (!isNonNegative(asNumber(d.shaded))) errors.push('fraction_model: shaded must be >= 0.');
    if (isPositive(asNumber(d.parts)) && asNumber(d.shaded) > asNumber(d.parts)) errors.push('fraction_model: shaded cannot exceed parts.');
  },
  fraction_circle(spec, errors) {
    validators.fraction_model(spec, errors);
  },
  equal_groups(spec, errors) {
    const d = spec.data;
    if (!isPositive(asNumber(d.groups))) errors.push('equal_groups: groups must be > 0.');
    if (!isPositive(asNumber(d.itemsPerGroup))) errors.push('equal_groups: itemsPerGroup must be > 0.');
  },
  arrays(spec, errors) {
    const d = spec.data;
    if (!isPositive(asNumber(d.rows))) errors.push('arrays: rows must be > 0.');
    if (!isPositive(asNumber(d.columns))) errors.push('arrays: columns must be > 0.');
  },
  picture_collections(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.categories) || d.categories.length === 0) {
      errors.push('picture_collections: categories must be a non-empty array.');
      return;
    }
    d.categories.forEach((category, idx) => {
      if (!category?.label) errors.push(`picture_collections: categories[${idx}].label is required.`);
      if (!isNonNegative(asNumber(category?.count))) errors.push(`picture_collections: categories[${idx}].count must be >= 0.`);
    });
  },
  place_value_blocks(spec, errors) {
    const d = spec.data;
    ['hundreds', 'tens', 'ones'].forEach((field) => {
      if (!isNonNegative(asNumber(d[field]))) errors.push(`place_value_blocks: ${field} must be >= 0.`);
    });
  },
  bar_graph(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.bars) || d.bars.length === 0) {
      errors.push('bar_graph: bars must be a non-empty array.');
      return;
    }
    d.bars.forEach((bar, idx) => {
      if (!bar?.label) errors.push(`bar_graph: bars[${idx}].label is required.`);
      if (!isNonNegative(asNumber(bar?.value))) errors.push(`bar_graph: bars[${idx}].value must be >= 0.`);
    });
  },
  picture_graph(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.categories) || d.categories.length === 0) errors.push('picture_graph: categories must be non-empty.');
    if (!isPositive(asNumber(d.symbolValue))) errors.push('picture_graph: symbolValue must be > 0.');
    (d.categories || []).forEach((category, idx) => {
      if (!isNonNegative(asNumber(category?.count))) errors.push(`picture_graph: categories[${idx}].count must be >= 0.`);
    });
  },
  table(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.headers) || d.headers.length === 0) errors.push('table: headers must be non-empty.');
    if (!Array.isArray(d.rows)) errors.push('table: rows must be an array.');
  },
  shape_library(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.shapes) || d.shapes.length === 0) errors.push('shape_library: shapes must be non-empty.');
  },
  shape_composition(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.components) || d.components.length === 0) errors.push('shape_composition: components must be non-empty.');
  },
  dot_grid(spec, errors) {
    const d = spec.data;
    if (!isPositive(asNumber(d.rows))) errors.push('dot_grid: rows must be > 0.');
    if (!isPositive(asNumber(d.columns))) errors.push('dot_grid: columns must be > 0.');
  },
  clock(spec, errors) {
    const d = spec.data;
    const hour = asNumber(d.hour, NaN);
    const minute = asNumber(d.minute, NaN);
    if (!Number.isFinite(hour) || hour < 0 || hour > 12) errors.push('clock: hour must be 0..12.');
    if (!Number.isFinite(minute) || minute < 0 || minute >= 60) errors.push('clock: minute must be 0..59.');
  },
  length_measurement(spec, errors) {
    const d = spec.data;
    const start = asNumber(d.start, NaN);
    const end = asNumber(d.end, NaN);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) errors.push('length_measurement: end must be > start.');
    (d.objects || []).forEach((objectSpec, idx) => {
      const objectStart = asNumber(objectSpec.start, NaN);
      const objectEnd = asNumber(objectSpec.end, NaN);
      if (!Number.isFinite(objectStart) || !Number.isFinite(objectEnd) || objectEnd < objectStart) {
        errors.push(`length_measurement: objects[${idx}] must have valid start/end.`);
      }
    });
  },
  comparison_models(spec, errors) {
    const d = spec.data;
    if (!isNonNegative(asNumber(d.leftValue))) errors.push('comparison_models: leftValue must be >= 0.');
    if (!isNonNegative(asNumber(d.rightValue))) errors.push('comparison_models: rightValue must be >= 0.');
  },
  pie_chart(spec, errors) {
    const d = spec.data;
    if (!Array.isArray(d.segments) || d.segments.length === 0) {
      errors.push('pie_chart: segments must be a non-empty array.');
      return;
    }
    d.segments.forEach((seg, idx) => {
      if (!seg?.label) errors.push(`pie_chart: segments[${idx}].label is required.`);
      if (!isNonNegative(asNumber(seg?.value))) errors.push(`pie_chart: segments[${idx}].value must be >= 0.`);
    });
  },
};

export const diagramValidators = validators;

export function normalizeDiagramSpec(rawSpec = {}) {
  const spec = createDiagramSpec(rawSpec);
  const normalizedType = LEGACY_DIAGRAM_TYPE_ALIASES[spec.type] || spec.type;
  return {
    ...spec,
    type: normalizedType,
    labels: isObject(spec.labels) ? spec.labels : {},
    metadata: isObject(spec.metadata) ? spec.metadata : {},
    data: isObject(spec.data) ? spec.data : {},
  };
}

export function validateDiagramSpec(rawSpec = {}) {
  const spec = normalizeDiagramSpec(rawSpec);
  const errors = [];
  validateCommon(spec, errors);
  if (DIAGRAM_TYPE_BY_TYPE.has(spec.type)) {
    const typeValidator = validators[spec.type];
    if (typeof typeValidator === 'function') typeValidator(spec, errors);
  }
  return {
    valid: errors.length === 0,
    errors,
    normalizedSpec: spec,
  };
}
