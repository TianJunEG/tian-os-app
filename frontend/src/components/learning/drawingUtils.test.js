import { describe, it, expect } from 'vitest';
import { drawStroke, stampContainsPoint, topStampIndexAtPoint, moveStampInStrokes } from './drawingUtils';

function mockCtx() {
  const ops = [];
  const noop = () => {};
  return {
    ops,
    save: noop,
    restore: noop,
    beginPath() { ops.push({ op: 'begin' }); },
    moveTo(x, y) { ops.push({ op: 'move', x, y }); },
    lineTo(x, y) { ops.push({ op: 'line', x, y }); },
    quadraticCurveTo(cx, cy, x, y) { ops.push({ op: 'quad', x, y }); },
    stroke() { ops.push({ op: 'stroke' }); },
    strokeRect: noop,
    fillText: noop,
    measureText: () => ({ width: 10 }),
    drawImage: noop,
    set lineWidth(v) {}, set lineCap(v) {}, set lineJoin(v) {},
    set strokeStyle(v) {}, set fillStyle(v) {}, set font(v) {},
    set globalCompositeOperation(v) {}, set globalAlpha(v) {}, set textAlign(v) {},
    canvas: { width: 900, height: 320 },
  };
}

function segmentsFrom(ops) {
  const segments = [];
  let cur = null;
  for (const o of ops) {
    if (o.op === 'move') cur = { start: { x: o.x, y: o.y }, end: null };
    else if ((o.op === 'quad' || o.op === 'line') && cur) cur.end = { x: o.x, y: o.y };
    else if (o.op === 'stroke' && cur) { segments.push(cur); cur = null; }
  }
  return segments;
}

describe('drawStroke — pressure rendering (dotted-line regression)', () => {
  const points = [
    { x: 0, y: 0, p: 0.5 },
    { x: 10, y: 10, p: 0.6 },
    { x: 20, y: 0, p: 0.4 },
    { x: 30, y: 10, p: 0.5 },
  ];

  it('draws a continuous, gap-free path for a pressure stroke', () => {
    const ctx = mockCtx();
    drawStroke(ctx, { tool: 'pen', colour: '#000', size: 4, points });
    const segments = segmentsFrom(ctx.ops);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    // Each segment must begin exactly where the previous one ended — otherwise
    // the stroke renders as a dotted line (the bug this guards against).
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].start.x).toBeCloseTo(segments[i - 1].end.x, 6);
      expect(segments[i].start.y).toBeCloseTo(segments[i - 1].end.y, 6);
    }
    // And the path spans from the first point to the last.
    expect(segments[0].start).toEqual({ x: 0, y: 0 });
    expect(segments.at(-1).end).toEqual({ x: 30, y: 10 });
  });

  it('non-pressure strokes still render as one continuous path', () => {
    const ctx = mockCtx();
    drawStroke(ctx, { tool: 'pen', colour: '#000', size: 4, points: points.map(({ p, ...rest }) => rest) });
    const segments = segmentsFrom(ctx.ops);
    expect(segments.length).toBe(1);
  });
});

describe('drawStroke — operator stamps', () => {
  it.each([
    ['plus', '+'],
    ['minus', '−'],
    ['times', '×'],
    ['divide', '÷'],
    ['equals', '='],
  ])('renders the %s operator stamp via fillText', (template, symbol) => {
    const texts = [];
    const ctx = mockCtx();
    ctx.fillText = (t) => texts.push(t);
    drawStroke(ctx, { tool: 'stamp', template, colour: '#000', points: [{ x: 10, y: 10 }] });
    expect(texts).toContain(symbol);
  });
});

// Backs the ScratchpadOverlay "Move" tool: a placed math stamp must be grabbable
// by a tap near its anchor and re-anchored to where the student drags it.
describe('stamp drag geometry', () => {
  const stamp = { tool: 'stamp', template: 'plus', points: [{ x: 100, y: 100 }] };

  it('hits a stamp within its box and misses outside it', () => {
    expect(stampContainsPoint(stamp, { x: 100, y: 100 })).toBe(true); // on anchor
    expect(stampContainsPoint(stamp, { x: 160, y: 120 })).toBe(true); // right/below (box extends there)
    expect(stampContainsPoint(stamp, { x: 400, y: 400 })).toBe(false); // far away
    expect(stampContainsPoint(stamp, { x: 100, y: 200 })).toBe(false); // below the box
  });

  it('ignores non-stamp strokes and missing points', () => {
    expect(stampContainsPoint({ tool: 'pen', points: [{ x: 100, y: 100 }] }, { x: 100, y: 100 })).toBe(false);
    expect(stampContainsPoint({ tool: 'stamp', points: [] }, { x: 0, y: 0 })).toBe(false);
    expect(stampContainsPoint(null, { x: 0, y: 0 })).toBe(false);
  });

  it('returns the topmost (last-drawn) stamp under the point, -1 when none', () => {
    const strokes = [
      { tool: 'pen', points: [{ x: 100, y: 100 }] },
      { tool: 'stamp', template: 'plus', points: [{ x: 100, y: 100 }] },   // index 1
      { tool: 'stamp', template: 'minus', points: [{ x: 105, y: 102 }] },  // index 2 — overlaps, drawn later
    ];
    expect(topStampIndexAtPoint(strokes, { x: 105, y: 102 })).toBe(2);
    expect(topStampIndexAtPoint(strokes, { x: 500, y: 500 })).toBe(-1);
    expect(topStampIndexAtPoint([], { x: 0, y: 0 })).toBe(-1);
  });

  it('re-anchors only the dragged stamp and leaves a new array (no mutation)', () => {
    const strokes = [
      { tool: 'pen', points: [{ x: 1, y: 1 }] },
      { tool: 'stamp', template: 'plus', colour: '#f97316', numerator: 'a', points: [{ x: 100, y: 100 }] },
    ];
    const moved = moveStampInStrokes(strokes, 1, 250, 175);
    expect(moved).not.toBe(strokes);
    expect(moved[1].points[0]).toEqual({ x: 250, y: 175 });
    expect(moved[1].numerator).toBe('a');     // other stamp fields preserved
    expect(moved[1].colour).toBe('#f97316');
    expect(moved[0]).toBe(strokes[0]);        // untouched strokes kept by reference
    expect(strokes[1].points[0]).toEqual({ x: 100, y: 100 }); // original not mutated
  });
});
