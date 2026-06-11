export const DIAGRAM_SCHEMA_VERSION = 'tian-diagram-spec-v1';

export const DIAGRAM_TYPE_DEFINITIONS = [
  { code: 'DG001', type: 'number_line', name: 'Number Line' },
  { code: 'DG002', type: 'fraction_model', name: 'Fraction Model' },
  { code: 'DG003', type: 'fraction_circle', name: 'Fraction Circle' },
  { code: 'DG004', type: 'equal_groups', name: 'Equal Groups' },
  { code: 'DG005', type: 'arrays', name: 'Arrays' },
  { code: 'DG006', type: 'picture_collections', name: 'Picture Collections' },
  { code: 'DG007', type: 'place_value_blocks', name: 'Place Value Blocks' },
  { code: 'DG008', type: 'bar_graph', name: 'Bar Graph' },
  { code: 'DG009', type: 'picture_graph', name: 'Picture Graph' },
  { code: 'DG010', type: 'table', name: 'Table' },
  { code: 'DG011', type: 'shape_library', name: 'Shape Library' },
  { code: 'DG012', type: 'shape_composition', name: 'Shape Composition' },
  { code: 'DG013', type: 'dot_grid', name: 'Dot Grid' },
  { code: 'DG014', type: 'clock', name: 'Clock' },
  { code: 'DG015', type: 'length_measurement', name: 'Length Measurement' },
  { code: 'DG016', type: 'comparison_model', name: 'Comparison Model' },
  { code: 'DG017', type: 'money_display', name: 'Money Display' },
  { code: 'DG018', type: 'pie_chart', name: 'Pie Chart' },
  { code: 'DG019', type: 'angle_display', name: 'Angle Display' },
  { code: 'DG020', type: 'line_pairs', name: 'Line Pairs' },
  { code: 'DG021', type: 'solid_3d', name: '3D Solid' },
  { code: 'DG022', type: 'compass_grid', name: 'Compass Grid' },
  { code: 'DG024', type: 'nets_3d', name: 'Nets of Solids' },
];

export const LEGACY_DIAGRAM_TYPE_ALIASES = {
  comparison_models: 'comparison_model',
};

export const DIAGRAM_TYPES = [
  ...DIAGRAM_TYPE_DEFINITIONS.map((d) => d.type),
  ...Object.keys(LEGACY_DIAGRAM_TYPE_ALIASES),
];

export const DIAGRAM_TYPE_BY_CODE = new Map(DIAGRAM_TYPE_DEFINITIONS.map((d) => [d.code, d]));
export const DIAGRAM_TYPE_BY_TYPE = new Map(DIAGRAM_TYPE_DEFINITIONS.map((d) => [d.type, d]));

export const RESERVED_SPEC_FIELDS = new Set([
  'id',
  'type',
  'title',
  'labels',
  'metadata',
  'schemaVersion',
  'width',
  'height',
  'data',
]);

export function createDiagramSpec(spec = {}) {
  const {
    id,
    type: rawType,
    title = '',
    labels = {},
    metadata = {},
    schemaVersion = DIAGRAM_SCHEMA_VERSION,
    width = 640,
    height = 360,
    data = {},
    ...rest
  } = spec || {};

  return {
    id,
    type: LEGACY_DIAGRAM_TYPE_ALIASES[rawType] || rawType,
    title,
    labels,
    metadata,
    schemaVersion,
    width,
    height,
    data: {
      ...data,
      ...rest,
    },
  };
}
