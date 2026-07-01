import React, { useMemo } from 'react';
import { renderers } from '../../../../mathpath/diagrams/svgRenderers';

export const DIAGRAM_LOAD_ERROR_MESSAGE = "This question could not load. Let's try another one.";

function inferNumberLineDiagram(prompt = '') {
  // Number-line base: "from X to Y split/divided into N equal parts".
  const base = String(prompt).match(
    /number line from\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)\b[^.]*?(?:split|divided)\s+into\s+(\d+)\s+equal parts/i
  );
  if (!base) return null;
  // The mark is phrased several ways: "the 7th mark", "mark 7", "at mark 7",
  // "seventh mark". Match any so the renderer isn't fragile to wording.
  const markMatch = String(prompt).match(
    /(\d+)(?:st|nd|rd|th)\s+mark|mark\s+(\d+)|\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+mark/i
  );
  if (!markMatch) return null;

  const min = Number(base[1]);
  const max = Number(base[2]);
  const steps = Number(base[3]);
  const markWords = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    tenth: 10,
    eleventh: 11,
    twelfth: 12,
  };
  const mark = markMatch[1] ? Number(markMatch[1])
    : markMatch[2] ? Number(markMatch[2])
    : markWords[String(markMatch[3]).toLowerCase()];
  if (!Number.isFinite(min) || !Number.isFinite(max) || !steps || !Number.isFinite(mark) || mark < 0 || mark > steps) return null;

  const value = min + ((max - min) * mark) / steps;
  return {
    type: 'number_line',
    width: 640,
    height: 180,
    data: {
      min,
      max,
      minStepCount: steps,
      points: [{ value, label: '?' }],
      endpointLabels: [String(min), String(max)],
    },
  };
}

function inferShadedFractionDiagram(prompt = '') {
  const match = String(prompt).match(
    /(?:shape|bar|strip)\s+is\s+(?:split|divided)\s+into\s+(\d+)\s+equal parts\.\s+(\d+)\s+part(?:\(s\)|s)?\s+(?:is|are)\s+shaded/i
  );
  if (!match) return null;
  const parts = Number(match[1]);
  const shaded = Number(match[2]);
  if (!Number.isFinite(parts) || !Number.isFinite(shaded) || parts <= 0 || shaded < 0 || shaded > parts) return null;
  return {
    type: 'fraction_bar',
    width: 640,
    height: 140,
    data: { parts, shaded, labelMode: 'none' },
  };
}

function inferShadedFractionDiagramFromAnswer(question = {}) {
  const prompt = `${question?.prompt || ''} ${question?.stem || ''}`.toLowerCase();
  if (!/\bwhat fraction\b/.test(prompt) || !/\bshaded\b/.test(prompt)) return null;

  const answer = question?.answer || {};
  const display = String(answer.display || answer.value || answer || '');
  const numerator = Number(answer.numerator ?? display.match(/^(-?\d+)\s*\/\s*(-?\d+)$/)?.[1]);
  const denominator = Number(answer.denominator ?? display.match(/^(-?\d+)\s*\/\s*(-?\d+)$/)?.[2]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator <= 0 || numerator < 0 || numerator > denominator) return null;

  return {
    type: 'fraction_bar',
    width: 640,
    height: 140,
    data: { parts: denominator, shaded: numerator, labelMode: 'none' },
  };
}

// "N squares out of M in a grid are shaded" → a near-square grid (10×10 for 100)
// with N cells filled. Backs percentage-of-a-grid and fraction-of-a-grid items.
function inferGridDiagram(prompt = '') {
  const match = String(prompt).match(
    /(\d+)\s+squares?\s+out of\s+(\d+)\s+(?:in a grid\s+)?(?:are|is)\s+shaded/i
  );
  if (!match) return null;
  const shaded = Number(match[1]);
  const cells = Number(match[2]);
  if (!Number.isFinite(cells) || cells <= 0 || cells > 400 || shaded < 0 || shaded > cells) return null;
  return { type: 'hundred_grid', width: 320, height: 320, data: { cells, shaded } };
}

// Kinds that have no renderer — questions with these will show without a diagram
// rather than being silently skipped.
const UNMAPPABLE_DIAGRAM_KINDS = new Set([
  // Most shapes now render (rect/clock/scale/cuboid/pictograph/net/pie/polygon/
  // composite). Remaining: symmetry, reflection, solid, value-list (lower freq).
  'symmetry', 'reflection', 'solid', 'value-list', 'coins',
]);

// Convert generators' legacy `diagram: { kind, ...data }` shape into the
// `diagramSpec: { type, data, width, height }` shape the renderers expect.
function normalizeDiagramKind(diagram) {
  if (!diagram?.kind) return null;
  const { kind } = diagram;
  if (UNMAPPABLE_DIAGRAM_KINDS.has(kind)) return null;
  switch (kind) {
    case 'circle':
      return {
        type: 'circle', width: 320, height: 260,
        data: { radius: diagram.radius, show: diagram.label === 'diameter' ? 'diameter' : 'radius' },
      };
    case 'circle-part':
      // Generators use 'quarter'/'half' OR 'quarter-circle'/'semicircle'.
      if (diagram.part === 'quarter' || diagram.part === 'quarter-circle')
        return { type: 'quarter_circle', width: 320, height: 280, data: { radius: diagram.radius, label: `${diagram.radius} cm` } };
      if (diagram.part === 'half' || diagram.part === 'semicircle')
        return { type: 'semicircle', width: 360, height: 220, data: { diameter: (diagram.radius || 0) * 2, label: `${(diagram.radius || 0) * 2} cm` } };
      return null;
    case 'rectangle':
      if (!diagram.l || !diagram.w) return null;
      // Plain cm/m dimension rectangle — NOT the unit-square grid (these are
      // perimeter/area questions stated in real units, e.g. "6 cm long").
      return { type: 'rectangle_dim', width: 380, height: 300, data: { l: diagram.l, w: diagram.w, unit: diagram.unit || 'cm' } };
    case 'square':
      if (!diagram.side) return null;
      return { type: 'rectangle_dim', width: 320, height: 300, data: { l: diagram.side, w: diagram.side, unit: diagram.unit || 'cm' } };
    case 'triangle':
      if (diagram.base && diagram.height)
        return { type: 'triangle_area', width: 400, height: 280, data: { base: `${diagram.base} cm`, height: `${diagram.height} cm` } };
      return null;
    case 'l-shape': {
      // Generator emits { W, H, notch:[notchW, notchH] }.
      const [notchW, notchH] = Array.isArray(diagram.notch) ? diagram.notch : [0, 0];
      if (!diagram.W || !diagram.H || !notchW || !notchH) return null;
      return { type: 'l_shape', width: 420, height: 320, data: { overallW: diagram.W, overallH: diagram.H, notchW, notchH } };
    }
    case 'parallelogram':
      if (!diagram.base || !diagram.height) return null;
      return { type: 'parallelogram', width: 440, height: 300, data: { base: diagram.base, height: diagram.height, slant: diagram.slant || diagram.height } };
    case 'trapezium':
      if (!diagram.a || !diagram.b || !diagram.height) return null;
      return { type: 'trapezium', width: 440, height: 300, data: { a: diagram.a, b: diagram.b, height: diagram.height } };
    case 'clock':
      return { type: 'clock_face', width: 300, height: 300, data: { hour: Number(diagram.hour) || 12, minute: Number(diagram.minute) || 0 } };
    case 'scale':
      if (diagram.interval == null) return null;
      return { type: 'measuring_scale', width: 480, height: 170, data: { start: Number(diagram.start) || 0, interval: Number(diagram.interval), marks: Number(diagram.marks) || 0, unit: diagram.unit || 'g' } };
    case 'cuboid':
      if (!diagram.length || !diagram.width || !diagram.height) return null;
      // 470 wide so the "width …" label (placed past the back face) isn't clipped.
      return { type: 'cuboid', width: 470, height: 300, data: { length: diagram.length, width: diagram.width, height: diagram.height } };
    case 'pictograph': {
      const rows = Array.isArray(diagram.rows) ? diagram.rows : [];
      if (!rows.length) return null;
      return { type: 'pictograph', width: 520, height: 64 + rows.length * 34, data: { keyValue: diagram.keyValue || 1, unit: diagram.unit || '', rows } };
    }
    case 'net':
      if (!diagram.l || !diagram.w || !diagram.h) return null;
      return { type: 'cuboid_net', width: 420, height: 360, data: { l: diagram.l, w: diagram.w, h: diagram.h, unit: diagram.unit || 'cm' } };
    case 'pie': {
      const sectors = Array.isArray(diagram.sectors) ? diagram.sectors : [];
      if (!sectors.length) return null;
      return { type: 'pie_chart', width: 460, height: 280, data: { sectors } };
    }
    case 'polygon':
      if (!diagram.sides) return null;
      return { type: 'regular_polygon', width: 300, height: 300, data: { sides: diagram.sides, labelMode: diagram.labelMode } };
    case 'composite': {
      // Same geometry as an L-shape: an outer rectangle [w,h] with a corner
      // notch [cw,ch] removed.
      const outer = Array.isArray(diagram.outer) ? diagram.outer : null;
      const cut = Array.isArray(diagram.cut) ? diagram.cut : null;
      if (!outer || !cut) return null;
      return { type: 'l_shape', width: 420, height: 320, data: { overallW: outer[0], overallH: outer[1], notchW: cut[0], notchH: cut[1] } };
    }
    case 'angle':
      return { type: 'angle_on_line', width: 400, height: 240, data: { angleDegrees: diagram.degrees, showValue: diagram.showValue !== false, label: diagram.label || 'x' } };
    case 'bar':
      return {
        type: 'bar_chart', width: 480, height: 320,
        data: { bars: (diagram.rows || []).map(([label, value]) => ({ label: String(label), value: Number(value) })) },
      };
    case 'line':
      return {
        type: 'line_graph', width: 480, height: 320,
        data: { points: (diagram.points || []).map(([label, value]) => ({ label: String(label), value: Number(value) })) },
      };
    case 'table':
      return { type: 'table', width: 440, height: 240, data: { headers: diagram.columns || [], rows: diagram.rows || [] } };
    case 'bar-model':
      if (diagram.bars && diagram.bars.length === 2)
        return {
          type: 'comparison_bar', width: 480, height: 200,
          data: { leftValue: diagram.bars[0].value, rightValue: diagram.bars[1].value, leftLabel: diagram.bars[0].label, rightLabel: diagram.bars[1].label },
        };
      if (diagram.bars)
        return { type: 'part_whole_bar', width: 480, height: 200, data: { parts: diagram.bars.map((b) => ({ label: b.label, value: b.value })) } };
      return null;
    default:
      return null;
  }
}

export function questionRequiresDiagram(question = {}) {
  if (question?.diagramSpec) return true;
  // A kind-based diagram that has no renderer should not block the question.
  if (question?.diagram?.kind) return Boolean(normalizeDiagramKind(question.diagram));
  if (question?.diagram || question?.visual?.payload?.type) return true;
  if (question?.requiresDiagram || question?.requiresVisual || question?.visualRequired) return true;
  const text = `${question?.prompt || ''} ${question?.stem || ''}`.toLowerCase();
  return /\b(number line|shaded|shape|fraction strip|bar model|area model|diagram|graph)\b/.test(text);
}

function explicitDiagramCandidates(question = {}) {
  const normalizedDiagram = question?.diagram?.kind
    ? normalizeDiagramKind(question.diagram)
    : question?.diagram;
  return [
    question?.diagramSpec,
    normalizedDiagram,
    question?.visual?.type === 'svg' && question.visual?.payload?.type ? question.visual.payload : null,
  ].filter(Boolean);
}

function inferredDiagramCandidates(question = {}) {
  const prompt = question?.prompt || question?.stem || '';
  return [
    inferNumberLineDiagram(prompt),
    inferGridDiagram(prompt),
    inferShadedFractionDiagram(prompt),
    inferShadedFractionDiagramFromAnswer(question),
  ].filter(Boolean);
}

function canRenderSpec(spec) {
  if (!spec?.type || !renderers[spec.type]) return false;
  try {
    return Boolean(renderers[spec.type](spec));
  } catch (err) {
    return false;
  }
}

export function getQuestionDiagramSpec(question = {}) {
  const candidates = [
    ...explicitDiagramCandidates(question),
    ...inferredDiagramCandidates(question),
  ];
  return candidates.find(canRenderSpec) || candidates[0] || null;
}

export function canRenderQuestionDiagram(question = {}) {
  const spec = getQuestionDiagramSpec(question);
  return canRenderSpec(spec);
}

export function validateQuestionDiagram(question = {}) {
  if (!questionRequiresDiagram(question)) return { ok: true, requiresDiagram: false, spec: null };
  const spec = getQuestionDiagramSpec(question);
  if (!spec) return { ok: false, requiresDiagram: true, spec: null, error: DIAGRAM_LOAD_ERROR_MESSAGE };
  if (!spec.type || !renderers[spec.type]) return { ok: false, requiresDiagram: true, spec, error: DIAGRAM_LOAD_ERROR_MESSAGE };
  try {
    const svg = renderers[spec.type](spec);
    return svg
      ? { ok: true, requiresDiagram: true, spec }
      : { ok: false, requiresDiagram: true, spec, error: DIAGRAM_LOAD_ERROR_MESSAGE };
  } catch (err) {
    return { ok: false, requiresDiagram: true, spec, error: DIAGRAM_LOAD_ERROR_MESSAGE };
  }
}

export default function QuestionDiagram({ question }) {
  const spec = useMemo(() => getQuestionDiagramSpec(question), [question]);

  if (!spec) {
    if (!questionRequiresDiagram(question)) return null;
    return (
      <div className="mb-5 rounded-xl border border-line-soft bg-white px-3 py-4 text-center text-sm text-ink-500">
        {DIAGRAM_LOAD_ERROR_MESSAGE}
      </div>
    );
  }

  const renderer = renderers[spec.type];
  if (!spec.type || !renderer) {
    return (
      <div className="mb-5 rounded-xl border border-line-soft bg-surface-white px-3 py-4 text-sm">
        <p className="font-semibold text-ink-700">Diagram not available</p>
        <p className="mt-1 text-ink-500">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
      </div>
    );
  }

  let svg = '';
  try {
    svg = renderer(spec);
  } catch (err) {
    return (
      <div className="mb-5 rounded-xl border border-danger-border bg-danger-tint px-3 py-4 text-sm text-rose-800">
        <p className="font-semibold">Diagram render error</p>
        <p className="mt-1">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div
      className="mb-4 max-w-2xl overflow-x-auto rounded-xl border border-line-soft bg-white p-2 sm:p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
