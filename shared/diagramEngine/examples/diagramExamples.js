import { createDiagramSpec } from '../diagramTypes.js';

function ex(id, type, data, title) {
  return createDiagramSpec({
    id,
    type,
    title,
    labels: {},
    metadata: { source: 'diagramEngineExamples' },
    data,
  });
}

export const diagramExamples = {
  number_line: [
    ex('DG001_EX1', 'number_line', { start: 0, end: 1, step: 0.125, points: [{ value: 0.375, label: '3/8' }] }, 'Fraction on 0-1 Number Line'),
    ex('DG001_EX2', 'number_line', { start: 0, end: 10, step: 1, points: [{ value: 4 }, { value: 7 }] }, 'Whole Number Line 0-10'),
    ex('DG001_EX3', 'number_line', { start: 0, end: 5, step: 0.5, points: [{ value: 2.5, label: '2 1/2' }] }, 'Mixed Number Line'),
  ],
  fraction_model: [
    ex('DG002_EX1', 'fraction_model', { parts: 8, shaded: 3 }, '3/8 Fraction Bar'),
    ex('DG002_EX2', 'fraction_model', { parts: 6, shaded: 5 }, '5/6 Fraction Bar'),
    ex('DG002_EX3', 'fraction_model', { parts: 10, shaded: 7 }, '7/10 Fraction Bar'),
  ],
  fraction_circle: [
    ex('DG003_EX1', 'fraction_circle', { parts: 8, shaded: 3 }, '3/8 Fraction Circle'),
    ex('DG003_EX2', 'fraction_circle', { parts: 6, shaded: 5 }, '5/6 Fraction Circle'),
    ex('DG003_EX3', 'fraction_circle', { parts: 12, shaded: 9 }, '9/12 Fraction Circle'),
  ],
  equal_groups: [
    ex('DG004_EX1', 'equal_groups', { groups: 4, itemsPerGroup: 5 }, '4 Groups of 5'),
    ex('DG004_EX2', 'equal_groups', { groups: 6, itemsPerGroup: 3 }, '6 Groups of 3'),
    ex('DG004_EX3', 'equal_groups', { groups: 8, itemsPerGroup: 2 }, '8 Groups of 2'),
  ],
  arrays: [
    ex('DG005_EX1', 'arrays', { rows: 3, columns: 4 }, '3 × 4 Array'),
    ex('DG005_EX2', 'arrays', { rows: 5, columns: 2 }, '5 × 2 Array'),
    ex('DG005_EX3', 'arrays', { rows: 4, columns: 6, filled: 18 }, 'Partial Filled Array'),
  ],
  picture_collections: [
    ex('DG006_EX1', 'picture_collections', { symbol: '🍎', categories: [{ label: 'Apples', count: 6 }] }, 'Apple Collection'),
    ex('DG006_EX2', 'picture_collections', { symbol: '📘', categories: [{ label: 'Books', count: 8 }] }, 'Book Collection'),
    ex('DG006_EX3', 'picture_collections', { symbol: '⭐', categories: [{ label: 'Stars', count: 10 }, { label: 'Moons', count: 4 }] }, 'Two Collections'),
  ],
  place_value_blocks: [
    ex('DG007_EX1', 'place_value_blocks', { hundreds: 4, tens: 2, ones: 7 }, 'Place Value 427'),
    ex('DG007_EX2', 'place_value_blocks', { hundreds: 0, tens: 5, ones: 8 }, 'Place Value 58'),
    ex('DG007_EX3', 'place_value_blocks', { hundreds: 9, tens: 0, ones: 3 }, 'Place Value 903'),
  ],
  bar_graph: [
    ex('DG008_EX1', 'bar_graph', { title: 'Class Pets', xLabel: 'Pet', yLabel: 'Count', bars: [{ label: 'Cats', value: 6 }, { label: 'Dogs', value: 8 }, { label: 'Fish', value: 4 }] }, 'Pet Bar Graph'),
    ex('DG008_EX2', 'bar_graph', { title: 'Books Read', bars: [{ label: 'Mon', value: 2 }, { label: 'Tue', value: 4 }, { label: 'Wed', value: 3 }] }, 'Books Read Bar Graph'),
    ex('DG008_EX3', 'bar_graph', { title: 'Marbles', bars: [{ label: 'Ali', value: 12 }, { label: 'Ben', value: 7 }, { label: 'Cho', value: 10 }] }, 'Marble Count'),
  ],
  picture_graph: [
    ex('DG009_EX1', 'picture_graph', { symbol: '●', symbolValue: 2, categories: [{ label: 'Red', count: 8 }, { label: 'Blue', count: 6 }] }, 'Picture Graph (●=2)'),
    ex('DG009_EX2', 'picture_graph', { symbol: '★', symbolValue: 1, categories: [{ label: 'Team A', count: 5 }, { label: 'Team B', count: 3 }] }, 'Picture Graph Stars'),
    ex('DG009_EX3', 'picture_graph', { symbol: '▲', symbolValue: 5, categories: [{ label: 'Sales 1', count: 20 }, { label: 'Sales 2', count: 15 }] }, 'Picture Graph Triangles'),
  ],
  table: [
    ex('DG010_EX1', 'table', { headers: ['Name', 'Score'], rows: [['Ana', '8'], ['Ben', '6'], ['Cho', '9']] }, 'Simple Score Table'),
    ex('DG010_EX2', 'table', { headers: ['Fruit', 'Count', 'Price'], rows: [['Apple', '5', '$2'], ['Pear', '3', '$1']] }, 'Fruit Table'),
    ex('DG010_EX3', 'table', { headers: ['Day', 'Temp'], rows: [['Mon', '30'], ['Tue', '31'], ['Wed', '29']] }, 'Temperature Table'),
  ],
  shape_library: [
    ex('DG011_EX1', 'shape_library', { shapes: [{ type: 'square' }, { type: 'rectangle' }, { type: 'triangle' }, { type: 'circle' }, { type: 'oval' }] }, 'Basic Shapes Set 1'),
    ex('DG011_EX2', 'shape_library', { shapes: [{ type: 'semi-circle' }, { type: 'quarter-circle' }, { type: 'rhombus' }, { type: 'trapezium' }] }, 'Basic Shapes Set 2'),
    ex('DG011_EX3', 'shape_library', { shapes: [{ type: 'triangle', label: 'Triangle' }, { type: 'rhombus', label: 'Rhombus' }, { type: 'circle', label: 'Circle' }] }, 'Named Shapes'),
  ],
  shape_composition: [
    ex('DG012_EX1', 'shape_composition', { question: 'How many triangles can you find?', components: [{ shape: 'square', x: 110, y: 90, size: 120 }, { shape: 'triangle', x: 110, y: 90, size: 120, fill: 'none' }] }, 'Shape Composition 1'),
    ex('DG012_EX2', 'shape_composition', { components: [{ shape: 'rectangle', x: 120, y: 120, size: 150 }, { shape: 'triangle', x: 120, y: 60, size: 150 }] }, 'House-like Composite'),
    ex('DG012_EX3', 'shape_composition', { components: [{ shape: 'circle', x: 190, y: 130, size: 90 }, { shape: 'rectangle', x: 210, y: 220, size: 60 }] }, 'Lollipop Composite'),
  ],
  dot_grid: [
    ex('DG013_EX1', 'dot_grid', { rows: 6, columns: 6, pointsHighlighted: [{ x: 1, y: 1 }, { x: 4, y: 4 }] }, 'Dot Grid Coordinates'),
    ex('DG013_EX2', 'dot_grid', { rows: 8, columns: 8, symmetryLine: 'vertical' }, 'Vertical Symmetry Grid'),
    ex('DG013_EX3', 'dot_grid', { rows: 8, columns: 8, symmetryLine: 'horizontal', pointsHighlighted: [{ x: 2, y: 2 }, { x: 5, y: 2 }] }, 'Horizontal Symmetry Grid'),
  ],
  clock: [
    ex('DG014_EX1', 'clock', { hour: 3, minute: 0 }, '3 o\'clock'),
    ex('DG014_EX2', 'clock', { hour: 7, minute: 15 }, 'Quarter Past 7'),
    ex('DG014_EX3', 'clock', { hour: 5, minute: 45 }, 'Quarter To 6'),
  ],
  length_measurement: [
    ex('DG015_EX1', 'length_measurement', { start: 0, end: 12, unit: 'cm', objects: [{ label: 'Pencil', start: 2, end: 9 }] }, 'Pencil Length'),
    ex('DG015_EX2', 'length_measurement', { start: 0, end: 20, unit: 'cm', objects: [{ label: 'Ribbon', start: 4, end: 16 }] }, 'Ribbon Length'),
    ex('DG015_EX3', 'length_measurement', { start: 0, end: 15, unit: 'cm', objects: [{ label: 'Paperclip Chain', start: 1, end: 7 }, { label: 'Eraser', start: 8, end: 12 }] }, 'Two Object Lengths'),
  ],
  comparison_models: [
    ex('DG016_EX1', 'comparison_models', { leftLabel: 'Ali', rightLabel: 'Ben', leftValue: 8, rightValue: 5, mode: 'difference' }, 'Difference Bar Model'),
    ex('DG016_EX2', 'comparison_models', { leftLabel: 'Red', rightLabel: 'Blue', leftValue: 12, rightValue: 9, mode: 'more' }, 'More Than Model'),
    ex('DG016_EX3', 'comparison_models', { leftLabel: 'Before', rightLabel: 'After', leftValue: 15, rightValue: 10, mode: 'less' }, 'Less Than Model'),
  ],
};

export const allDiagramExamples = Object.values(diagramExamples).flat();
