export const DIAGRAM_SCHEMA_VERSION = 'mathpath-diagram-spec-v1';

export const DIAGRAM_TYPES = [
  'fraction_bar',
  'fraction_circle',
  'hundred_grid',
  'number_line',
  'part_whole_bar',
  'comparison_bar',
  'before_after_bar',
  'ratio_bar',
  'rectangle_area',
  'triangle_area',
  'cuboid',
  'angle_on_line',
  'table',
  'bar_chart',
  'line_graph',
];

export function createDiagramSpec(type, data = {}, labels = {}) {
  return {
    schemaVersion: DIAGRAM_SCHEMA_VERSION,
    type,
    width: 640,
    height: 360,
    labels,
    data,
  };
}

