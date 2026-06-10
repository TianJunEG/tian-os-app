/**
 * Shared drawing utilities for WorkingCanvas, FullScreenWorkingMode, and StrokeReplayPlayer.
 *
 * Centralises canvas rendering and stroke capture so that:
 *  - Every stroke records a wall-clock timestamp and per-point monotonic offsets
 *  - Stylus pressure and tilt are captured when available (pointerType === 'pen')
 *  - The replay player can draw strokes identically to the live canvas
 *  - Pressure-sensitive line widths give stylus users a natural writing feel
 */

// ─── Canvas dimensions ──────────────────────────────────────────────────

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 320;
export const FULLSCREEN_CANVAS_WIDTH = 1400;
export const FULLSCREEN_CANVAS_HEIGHT = 900;

// ─── Point capture ──────────────────────────────────────────────────────

/**
 * Extract a timestamped point from a PointerEvent.
 * Returns { x, y, t } always, plus { p, tx, ty } when a stylus is detected.
 *
 * `t` is the raw monotonic event.timeStamp (ms since page load). Use
 * `finalizeStroke` to convert to relative ms offsets before persisting.
 */
export function pointFromEvent(event, canvas, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT) {
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: ((event.clientX - rect.left) / rect.width) * canvasWidth,
    y: ((event.clientY - rect.top) / rect.height) * canvasHeight,
    t: Math.round(event.timeStamp || 0),
  };
  if (event.pointerType === 'pen') {
    point.p = Math.round(event.pressure * 1000) / 1000;
    if (event.tiltX) point.tx = event.tiltX;
    if (event.tiltY) point.ty = event.tiltY;
  }
  return point;
}

/**
 * Create the initial stroke object when a pointer goes down.
 *
 * Includes:
 *  - `timestamp` (ISO 8601 wall-clock) for the backend working timeline
 *  - `pointerType` ('pen' | 'touch' | 'mouse') for analytics
 *  - `_t0` (private) — monotonic anchor for `finalizeStroke`
 */
export function beginStrokeData(event, tool, colour, brushSize, canvas, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT) {
  const point = pointFromEvent(event, canvas, canvasWidth, canvasHeight);
  return {
    tool,
    colour,
    size: brushSize,
    points: [point],
    timestamp: new Date().toISOString(),
    pointerType: event.pointerType || 'mouse',
    _t0: Math.round(event.timeStamp || 0),
  };
}

/**
 * Finalise a completed stroke before persisting:
 *  1. Convert absolute event.timeStamp values to ms offsets from stroke start
 *  2. Strip the private `_t0` anchor
 *  3. Return null if the stroke has fewer than 2 points
 */
export function finalizeStroke(stroke) {
  if (!stroke || stroke.points.length < 2) return null;
  const t0 = stroke._t0 ?? stroke.points[0]?.t ?? 0;
  const finalized = { ...stroke };
  finalized.points = stroke.points.map(({ t, ...rest }) => ({
    ...rest,
    ...(t != null ? { t: t - t0 } : {}),
  }));
  delete finalized._t0;
  return finalized;
}

// ─── Stroke rendering ───────────────────────────────────────────────────

/**
 * Draw a single stroke onto a canvas 2D context.
 *
 * Handles every tool: pen, pencil, line, rectangle, shade, highlighter,
 * eraser, and stamp (routed to drawMathStamp).
 *
 * When points carry pressure data (point.p) and the tool is pen or pencil,
 * line width varies per segment for a natural ink feel.
 * Disable with `options.pressureRendering = false`.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}  stroke
 * @param {object}  [options]
 * @param {boolean} [options.pressureRendering=true]
 * @param {number}  [options.stampScale=1] - multiplier for math stamp sizes
 */
export function drawStroke(ctx, stroke, options = {}) {
  if (stroke?.tool === 'stamp') {
    drawMathStamp(ctx, stroke, options);
    return;
  }
  const points = stroke?.points || [];
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18
    : stroke.tool === 'shade' ? 0.24
    : 1;
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.colour || '#172554');
  ctx.fillStyle = stroke.colour || '#172554';

  const baseSize = Number(stroke.size || 4);
  const lineWidth = stroke.tool === 'eraser' ? 24
    : stroke.tool === 'shade' ? Math.max(34, baseSize * 8)
    : stroke.tool === 'highlighter' ? Math.max(48, baseSize * 10)
    : stroke.tool === 'pencil' ? Math.max(1, baseSize - 1)
    : baseSize;

  ctx.lineWidth = lineWidth;

  // ── Shape tools ──

  if (stroke.tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points.at(-1).x, points.at(-1).y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (stroke.tool === 'rectangle') {
    const start = points[0];
    const end = points.at(-1);
    ctx.strokeRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y),
    );
    ctx.restore();
    return;
  }

  // ── Freehand tools (pen, pencil, highlighter, shade, eraser) ──

  const hasPressure = options.pressureRendering !== false
    && (stroke.tool === 'pen' || stroke.tool === 'pencil')
    && points.some((p) => p.p != null);

  if (hasPressure) {
    // Pressure-sensitive: draw segment-by-segment with varying width and smooth curves
    for (let i = 1; i < points.length; i++) {
      const pressure = points[i].p ?? 0.5;
      ctx.lineWidth = lineWidth * (0.3 + pressure * 0.7);
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      if (i >= 2) {
        const mid = { x: (points[i - 1].x + points[i].x) / 2, y: (points[i - 1].y + points[i].y) / 2 };
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, mid.x, mid.y);
      } else {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  } else {
    // Uniform width: smooth quadratic bezier curves through midpoints
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
        ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a math notation stamp (fraction, power, root, etc.).
 *
 * All dimensions are multiplied by `options.stampScale` so the same function
 * serves the 900 x 320 inline canvas (scale 1) and the 1400 x 900
 * full-screen canvas (scale ~1.4).
 */
export function drawMathStamp(ctx, stroke, options = {}) {
  const s = options.stampScale || 1;
  const r = (v) => Math.round(v * s);
  const point = stroke?.points?.[0] || { x: r(40), y: r(56) };
  const colour = stroke.colour || '#f97316';
  const x = point.x;
  const y = point.y;

  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = r(3);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.font = `${r(30)}px Georgia, serif`;

  if (stroke.template === 'fraction') {
    const numerator = String(stroke.numerator || 'x');
    const denominator = String(stroke.denominator || 'y');
    const width = Math.max(r(48), ctx.measureText(numerator).width, ctx.measureText(denominator).width) + r(18);
    const center = x + width / 2;
    ctx.textAlign = 'center';
    ctx.fillText(numerator, center, y - r(14));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillText(denominator, center, y + r(36));
    ctx.textAlign = 'start';
  } else if (stroke.template === 'subscript') {
    ctx.fillText(String(stroke.base || 'x'), x, y);
    ctx.font = `${r(20)}px Georgia, serif`;
    ctx.fillText(String(stroke.subscript || 'a'), x + r(25), y + r(10));
  } else if (stroke.template === 'power') {
    ctx.fillText(String(stroke.base || 'x'), x, y + r(10));
    ctx.font = `${r(20)}px Georgia, serif`;
    ctx.fillText(String(stroke.exponent || 'b'), x + r(25), y - r(10));
  } else if (stroke.template === 'subscriptPower') {
    ctx.fillText(String(stroke.base || 'x'), x, y + r(8));
    ctx.font = `${r(18)}px Georgia, serif`;
    ctx.fillText(String(stroke.exponent || 'b'), x + r(25), y - r(14));
    ctx.fillText(String(stroke.subscript || 'a'), x + r(25), y + r(20));
  } else if (stroke.template === 'mixed') {
    ctx.fillText(String(stroke.base || 'x'), x, y + r(10));
    ctx.font = `${r(24)}px Georgia, serif`;
    ctx.fillText(String(stroke.numerator || 'b'), x + r(34), y - r(12));
    ctx.beginPath();
    ctx.moveTo(x + r(28), y);
    ctx.lineTo(x + r(74), y);
    ctx.stroke();
    ctx.fillText(String(stroke.denominator || 'a'), x + r(42), y + r(30));
  } else if (stroke.template === 'root') {
    const radicand = String(stroke.radicand || 'x');
    ctx.font = `${r(42)}px Georgia, serif`;
    ctx.fillText('√', x + r(16), y + r(14));
    ctx.beginPath();
    ctx.moveTo(x + r(58), y - r(22));
    ctx.lineTo(x + r(58) + Math.max(r(48), ctx.measureText(radicand).width + r(16)), y - r(22));
    ctx.stroke();
    ctx.font = `${r(30)}px Georgia, serif`;
    ctx.fillText(radicand, x + r(66), y + r(8));
    ctx.font = `${r(16)}px Georgia, serif`;
    ctx.fillText(String(stroke.index || 'n'), x, y - r(6));
  } else if (stroke.template === 'degree') {
    ctx.fillText(String(stroke.base || 'x'), x, y + r(10));
    ctx.font = `${r(20)}px Georgia, serif`;
    ctx.fillText('°', x + r(25), y - r(8));
  } else if (stroke.template === 'angle') {
    ctx.fillText('∠', x, y + r(10));
  } else if (stroke.template === 'pi') {
    ctx.fillText('π', x, y + r(10));
  } else if (stroke.template === 'theta') {
    ctx.fillText('θ', x, y + r(10));
  }

  ctx.restore();
}

// ─── Background painting ────────────────────────────────────────────────

/**
 * Paint a white background with ruled or grid lines.
 */
export function paintBackground(ctx, width = CANVAS_WIDTH, height = CANVAS_HEIGHT, background = 'ruled') {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = background === 'grid' ? '#dbe4ef' : '#e8eef7';
  ctx.lineWidth = 1;
  if (background === 'grid') {
    for (let gx = 24; gx < width; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
  }
  for (let gy = 40; gy < height; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }
}

/**
 * Export a canvas as a base64 PNG with a painted background.
 */
export function exportCanvas(sourceCanvas, width = CANVAS_WIDTH, height = CANVAS_HEIGHT, background = 'ruled') {
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = output.getContext('2d');
  paintBackground(ctx, width, height, background);
  ctx.drawImage(sourceCanvas, 0, 0);
  return output.toDataURL('image/png');
}

// ─── Replay timeline ────────────────────────────────────────────────────

const SYNTHETIC_POINT_INTERVAL_MS = 16; // ~60 fps feel for legacy data
const SYNTHETIC_STROKE_GAP_MS = 400;    // pause between legacy strokes

/**
 * Build a flat, time-sorted event list for stroke replay.
 *
 * Each event: { absoluteMs, strokeIndex, pointIndex, isStrokeStart, isStrokeEnd, isStamp }
 *
 * Strokes with a `timestamp` field use real timing (wall-clock start + per-point `t` offset).
 * Strokes without timestamps get synthetic timing so old data is still replayable.
 */
export function buildReplayTimeline(strokes) {
  if (!Array.isArray(strokes) || !strokes.length) return [];

  // Session start = earliest real timestamp
  const timestamps = strokes
    .filter((s) => s.timestamp)
    .map((s) => new Date(s.timestamp).getTime())
    .filter((t) => t > 0);
  const sessionStart = timestamps.length ? Math.min(...timestamps) : 0;

  const events = [];
  let syntheticClock = 0;

  strokes.forEach((stroke, si) => {
    const points = stroke.points || [];
    const hasTimestamp = Boolean(stroke.timestamp);
    const strokeStartMs = hasTimestamp
      ? new Date(stroke.timestamp).getTime() - sessionStart
      : syntheticClock;

    if (stroke.tool === 'stamp') {
      events.push({
        absoluteMs: strokeStartMs,
        strokeIndex: si,
        pointIndex: 0,
        isStrokeStart: true,
        isStrokeEnd: true,
        isStamp: true,
      });
    } else {
      points.forEach((point, pi) => {
        const offset = hasTimestamp && typeof point.t === 'number'
          ? point.t
          : pi * SYNTHETIC_POINT_INTERVAL_MS;
        events.push({
          absoluteMs: strokeStartMs + offset,
          strokeIndex: si,
          pointIndex: pi,
          isStrokeStart: pi === 0,
          isStrokeEnd: pi === points.length - 1,
        });
      });
    }

    // Advance synthetic clock past this stroke
    const lastOffset = points.length
      ? (hasTimestamp && typeof points.at(-1)?.t === 'number'
        ? points.at(-1).t
        : (points.length - 1) * SYNTHETIC_POINT_INTERVAL_MS)
      : 0;
    const nextClock = strokeStartMs + lastOffset + SYNTHETIC_STROKE_GAP_MS;
    syntheticClock = Math.max(syntheticClock, nextClock);
  });

  events.sort((a, b) => a.absoluteMs - b.absoluteMs || a.strokeIndex - b.strokeIndex || a.pointIndex - b.pointIndex);
  return events;
}

/**
 * Compute per-stroke timing metadata for the replay UI.
 * Returns an array parallel to `strokes`: [{ startMs, endMs, pointCount }].
 */
export function getStrokeTimingMeta(strokes, timeline) {
  if (!strokes?.length || !timeline?.length) return [];
  const meta = strokes.map(() => ({ startMs: Infinity, endMs: 0, pointCount: 0 }));
  timeline.forEach((event) => {
    const m = meta[event.strokeIndex];
    if (!m) return;
    m.startMs = Math.min(m.startMs, event.absoluteMs);
    m.endMs = Math.max(m.endMs, event.absoluteMs);
    m.pointCount++;
  });
  return meta.map((m) => ({
    startMs: m.startMs === Infinity ? 0 : m.startMs,
    endMs: m.endMs,
    pointCount: m.pointCount,
  }));
}

// ─── Point simplification (Ramer-Douglas-Peucker) ───────────────────────

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / Math.sqrt(lenSq);
}

/**
 * Simplify a points array using the Ramer-Douglas-Peucker algorithm.
 * Preserves all properties (x, y, t, p, tx, ty) on surviving points.
 * A tolerance of 1.0 gives imperceptible quality loss with ~40-70% fewer points.
 */
export function simplifyPoints(points, tolerance = 1.0) {
  if (!points || points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[last]];
}
