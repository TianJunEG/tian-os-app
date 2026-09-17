import { DIAGRAM_SCHEMA_VERSION } from '../../../../shared/diagramEngine/diagramTypes.js';

function spec(type, data, opts = {}) {
  return {
    id: `p1-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    schemaVersion: DIAGRAM_SCHEMA_VERSION,
    width: opts.width ?? 640,
    height: opts.height ?? 360,
    title: opts.title ?? '',
    labels: opts.labels ?? {},
    metadata: opts.metadata ?? {},
    data,
  };
}

export function numberLineDiagram({ start = 0, end = 10, step = 1, points = [], title = '' }) {
  return spec('number_line', { start, end, step, points }, { title: title || `Number line ${start} to ${end}` });
}

export function pictureCollectionDiagram(categories, { symbol = '●', title = '' } = {}) {
  return spec('picture_collections', { categories, symbol }, { title });
}

// showTotal draws the composed number (hundreds+tens+ones concatenated) on the
// diagram — only pass true when that total is already given/implied elsewhere
// in the prompt. Several callers ask students to COMPOSE the number from the
// blocks shown, so it defaults to false; the title also avoids the default
// numeric-concatenation fallback for the same reason.
export function placeValueBlocksDiagram(tens, ones, { hundreds = 0, showTotal = false, title = '' } = {}) {
  return spec('place_value_blocks', { hundreds, tens, ones, showTotal }, { title: title || 'Place value blocks' });
}

export function comparisonModelDiagram(leftValue, rightValue, { leftLabel = 'A', rightLabel = 'B', mode = 'difference', title = '' } = {}) {
  return spec('comparison_model', { leftValue, rightValue, leftLabel, rightLabel, mode }, { title });
}

export function equalGroupsDiagram(groups, itemsPerGroup, { title = '' } = {}) {
  return spec('equal_groups', { groups, itemsPerGroup }, { title: title || `${groups} groups of ${itemsPerGroup}` });
}

export function arrayDiagram(rows, columns, { filled, title = '' } = {}) {
  return spec('arrays', { rows, columns, filled: filled ?? rows * columns }, { title });
}

export function objectSetDiagram(object, count, { layout = 'row', crossedOut = 0, title = '' } = {}) {
  const categories = crossedOut > 0
    ? [
      { label: object, count: count - crossedOut },
      { label: `${object} (crossed out)`, count: crossedOut },
    ]
    : [{ label: object, count }];
  return spec('picture_collections', { categories, symbol: '●' }, { title: title || `${count} ${object}` });
}

export function twoGroupsDiagram(objA, countA, objB, countB, { title = '' } = {}) {
  return spec('picture_collections', {
    categories: [
      { label: objA, count: countA },
      { label: objB, count: countB },
    ],
    symbol: '●',
  }, { title });
}

// `object` may be a plain label (e.g. 'animals', numbered-position fallback)
// or an array of the actual item names in physical left-to-right order — in
// which case each point shows the real name instead of a bare position number,
// so the diagram genuinely depicts the row the prompt describes. The
// highlighted (target/answer) position is always shown as "[?]" regardless —
// never its real name/number — since that identity is exactly what the
// question is asking the student to find.
export function orderedLineDiagram(object, count, highlightPosition, direction, { title = '' } = {}) {
  const items = Array.isArray(object) ? object : null;
  const points = [];
  for (let i = 1; i <= count; i++) {
    const posLabel = direction === 'left' ? `${i}` : `${count - i + 1}`;
    const label = items ? String(items[i - 1] ?? posLabel) : posLabel;
    points.push({ value: i, label });
  }
  if (highlightPosition >= 1 && highlightPosition <= count) {
    const idx = direction === 'left' ? highlightPosition - 1 : count - highlightPosition;
    if (points[idx]) points[idx].label = '[?]';
  }
  return spec('number_line', { start: 1, end: count, step: 1, points }, {
    title: title || `Row of ${count} ${items ? items.join(', ') : object}`,
    height: 200,
  });
}

export function barModelDiagram(whole, part1, { part1Label = '', part2Label = '', wholeLabel = '', title = '' } = {}) {
  const part2 = whole - part1;
  return spec('comparison_model', {
    leftValue: whole,
    rightValue: part1,
    leftLabel: wholeLabel || 'Total',
    rightLabel: part1Label || 'Part',
    mode: 'difference',
  }, { title: title || 'Bar model' });
}

export function columnOperationDiagram(a, b, operation, { title = '' } = {}) {
  const headers = ['', 'Tens', 'Ones'];
  const rows = [
    ['', String(Math.floor(a / 10)), String(a % 10)],
    [operation, String(Math.floor(b / 10)), String(b % 10)],
  ];
  return spec('table', { headers, rows }, { title: title || `${a} ${operation} ${b}`, width: 300, height: 200 });
}

// showDigital draws the HH:MM text on the clock face — only pass true when the
// digital time is already given/implied elsewhere in the prompt (it renders the
// answer as text otherwise, e.g. for a "what time is shown?" question).
export function clockDiagram(hour, minute, { title = '', showDigital = false } = {}) {
  return spec('clock', { hour, minute, showDigital }, { title: title || `${hour}:${String(minute).padStart(2, '0')}`, width: 360, height: 360 });
}

export function shapeLibraryDiagram(shapes, { title = '' } = {}) {
  return spec('shape_library', { shapes }, { title });
}

export function lengthMeasurementDiagram({ start = 0, end = 20, unit = 'paper clips', objects = [], title = '' } = {}) {
  return spec('length_measurement', { start, end, unit, objects }, { title: title || `Measurement in ${unit}` });
}

export function pictureGraphDiagram(categories, { symbol = '●', symbolValue = 1, title = '' } = {}) {
  return spec('picture_graph', { categories, symbol, symbolValue }, { title });
}

export function moneyDisplayDiagram(items, { title = '' } = {}) {
  return spec('money_display', { items }, { title, width: Math.max(400, items.length * 110), height: 200 });
}

export default {
  numberLineDiagram,
  pictureCollectionDiagram,
  placeValueBlocksDiagram,
  comparisonModelDiagram,
  equalGroupsDiagram,
  arrayDiagram,
  objectSetDiagram,
  twoGroupsDiagram,
  orderedLineDiagram,
  barModelDiagram,
  columnOperationDiagram,
  clockDiagram,
  shapeLibraryDiagram,
  lengthMeasurementDiagram,
  pictureGraphDiagram,
  moneyDisplayDiagram,
};
