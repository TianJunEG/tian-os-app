import { DIAGRAM_SCHEMA_VERSION, DIAGRAM_TYPES } from './diagramSpecSchema.js';

function isPos(n) { return Number.isFinite(n) && n > 0; }
function isNonNeg(n) { return Number.isFinite(n) && n >= 0; }

function validateCommon(spec, errors) {
  if (!spec || typeof spec !== 'object') errors.push('Spec must be an object.');
  if (spec?.schemaVersion !== DIAGRAM_SCHEMA_VERSION) errors.push(`schemaVersion must be "${DIAGRAM_SCHEMA_VERSION}".`);
  if (!DIAGRAM_TYPES.includes(spec?.type)) errors.push('Unsupported diagram type.');
  if (!isPos(spec?.width)) errors.push('width must be positive.');
  if (!isPos(spec?.height)) errors.push('height must be positive.');
  if (!spec?.data || typeof spec.data !== 'object') errors.push('data must be an object.');
}

function validateFractionLike(data, errors) {
  if (!isPos(data?.parts)) errors.push('data.parts must be > 0.');
  if (!isNonNeg(data?.shaded)) errors.push('data.shaded must be >= 0.');
  if (isPos(data?.parts) && isNonNeg(data?.shaded) && data.shaded > data.parts) errors.push('data.shaded cannot exceed data.parts.');
}

const validators = {
  fraction_bar(data, errors) { validateFractionLike(data, errors); },
  fraction_circle(data, errors) { validateFractionLike(data, errors); },
  number_line(data, errors) {
    if (!isPos(data?.minStepCount)) errors.push('data.minStepCount must be > 0.');
    if (!Array.isArray(data?.points)) errors.push('data.points must be an array.');
  },
  part_whole_bar(data, errors) {
    if (!Array.isArray(data?.parts) || !data.parts.length) errors.push('data.parts must be a non-empty array.');
  },
  comparison_bar(data, errors) {
    if (!isPos(data?.leftValue) || !isPos(data?.rightValue)) errors.push('leftValue/rightValue must be > 0.');
  },
  before_after_bar(data, errors) {
    if (!isPos(data?.before) || !isPos(data?.after)) errors.push('before/after must be > 0.');
  },
  ratio_bar(data, errors) {
    if (!isPos(data?.a) || !isPos(data?.b)) errors.push('a/b must be > 0.');
  },
  rectangle_area(data, errors) {
    if (!isPos(data?.widthUnits) || !isPos(data?.heightUnits)) errors.push('widthUnits/heightUnits must be > 0.');
  },
  triangle_area(data, errors) {
    if (!isPos(data?.base) || !isPos(data?.height)) errors.push('base/height must be > 0.');
  },
  cuboid(data, errors) {
    if (!isPos(data?.length) || !isPos(data?.width) || !isPos(data?.height)) errors.push('length/width/height must be > 0.');
  },
  angle_on_line(data, errors) {
    if (!isNonNeg(data?.angleDegrees) || data?.angleDegrees > 180) errors.push('angleDegrees must be within 0..180.');
  },
  table(data, errors) {
    if (!Array.isArray(data?.headers) || !data.headers.length) errors.push('headers must be a non-empty array.');
    if (!Array.isArray(data?.rows)) errors.push('rows must be an array.');
  },
  bar_chart(data, errors) {
    if (!Array.isArray(data?.bars) || !data.bars.length) errors.push('bars must be a non-empty array.');
  },
  line_graph(data, errors) {
    if (!Array.isArray(data?.points) || data.points.length < 2) errors.push('points must contain at least 2 points.');
  },
};

export function validateDiagramSpec(spec) {
  const errors = [];
  validateCommon(spec, errors);
  const fn = validators[spec?.type];
  if (fn) fn(spec.data, errors);
  return { ok: errors.length === 0, errors };
}

