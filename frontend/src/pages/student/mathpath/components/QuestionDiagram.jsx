import React, { useMemo } from 'react';
import { renderers } from '../../../../mathpath/diagrams/svgRenderers';

export const DIAGRAM_LOAD_ERROR_MESSAGE = "This question could not load. Let's try another one.";

function inferNumberLineDiagram(prompt = '') {
  const match = String(prompt).match(
    /number line from\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)\s+(?:split|divided) into\s+(\d+)\s+equal parts.*?((?:\d+)(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+mark/i
  );
  if (!match) return null;

  const min = Number(match[1]);
  const max = Number(match[2]);
  const steps = Number(match[3]);
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
  const mark = markWords[String(match[4]).toLowerCase()] || Number(String(match[4]).replace(/\D/g, ''));
  if (!Number.isFinite(min) || !Number.isFinite(max) || !steps || mark < 0 || mark > steps) return null;

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

export function questionRequiresDiagram(question = {}) {
  if (question?.diagramSpec || question?.diagram || question?.visual?.payload?.type) return true;
  if (question?.requiresDiagram || question?.requiresVisual || question?.visualRequired) return true;
  const text = `${question?.prompt || ''} ${question?.stem || ''}`.toLowerCase();
  return /\b(number line|shaded|shape|fraction strip|bar model|area model|diagram|graph)\b/.test(text);
}

function explicitDiagramCandidates(question = {}) {
  return [
    question?.diagramSpec,
    normaliseDiagramSpec(question?.diagram),
    question?.visual?.type === 'svg' && question.visual?.payload?.type ? question.visual.payload : null,
  ].filter(Boolean);
}

function normaliseDiagramSpec(spec = null) {
  if (!spec || spec.type) return spec;
  const kind = String(spec.kind || '').toLowerCase();
  const base = { width: 640, height: 260 };
  if (!kind) return spec;
  if (kind === 'number-line') {
    const min = Number.isFinite(spec.from) ? spec.from : 0;
    const max = Number.isFinite(spec.to) ? spec.to : 10;
    return {
      ...base,
      type: 'number_line',
      data: {
        min,
        max,
        minStepCount: Math.max(1, Math.round(max - min)),
        points: spec.mark != null ? [{ value: Number(spec.mark), label: '?' }] : [],
        endpointLabels: [String(min), String(max)],
      },
    };
  }
  if (kind === 'rectangle' || kind === 'square') {
    const widthUnits = Number(spec.l || spec.length || spec.side || spec.W || 4);
    const heightUnits = Number(spec.w || spec.width || spec.side || spec.H || 3);
    return { ...base, height: 300, type: 'rectangle_area', data: { widthUnits, heightUnits } };
  }
  if (kind === 'triangle') {
    return {
      ...base,
      height: 300,
      type: 'triangle_area',
      data: { base: spec.base || spec.sides?.[0] || 6, height: spec.height || spec.h || 4 },
    };
  }
  if (kind === 'circle') {
    return {
      width: 360,
      height: 280,
      type: 'circle',
      data: {
        radius: Number(spec.radius || 0) || undefined,
        diameter: spec.label === 'diameter' ? Number(spec.radius || 0) * 2 : undefined,
        show: spec.label === 'diameter' ? 'diameter' : 'radius',
      },
    };
  }
  if (kind === 'circle-part') {
    const part = String(spec.part || '').toLowerCase();
    return {
      width: 360,
      height: 280,
      type: part.includes('quarter') ? 'quarter_circle' : 'semicircle',
      data: { radius: Number(spec.radius || 0) || 7 },
    };
  }
  if (kind === 'cuboid' || kind === 'unit-cubes') {
    return {
      ...base,
      height: 320,
      type: 'cuboid',
      data: { length: spec.l || spec.length || 4, width: spec.w || spec.width || 3, height: spec.h || spec.height || 2 },
    };
  }
  if (kind === 'coins') {
    return {
      ...base,
      height: 260,
      type: 'coins',
      data: { items: spec.items || spec.coins || [] },
    };
  }
  if (kind === 'clock') {
    return {
      width: 360,
      height: 300,
      type: 'clock',
      data: { hour: spec.hour ?? spec.hours, minute: spec.minute ?? spec.minutes ?? 0 },
    };
  }
  if (kind === 'bar-model') {
    return {
      ...base,
      type: 'bar_model',
      data: {
        parts: spec.parts || spec.partsCents || [],
        partsCents: spec.partsCents || [],
        wholeCents: spec.wholeCents,
        unknownIndex: spec.unknownIndex,
        totalLabel: spec.totalLabel,
        bars: spec.bars || [],
        diffLabel: spec.diffLabel || spec.differenceLabel,
      },
    };
  }
  if (kind === 'scale') {
    return {
      ...base,
      height: 180,
      type: 'scale',
      data: {
        start: spec.start,
        interval: spec.interval,
        marks: spec.marks,
        reading: spec.reading ?? spec.value,
        unit: spec.unit,
      },
    };
  }
  if (kind === 'tank') {
    return {
      ...base,
      height: 320,
      type: 'tank',
      data: {
        fillFraction: spec.fillFraction ?? spec.fraction,
        volumeLabel: spec.volumeLabel || spec.label,
      },
    };
  }
  if (kind === 'net') {
    return {
      ...base,
      height: 300,
      type: 'net',
      data: { label: spec.label || spec.solid || 'cuboid net' },
    };
  }
  if (kind === 'l-shape' || kind === 'composite') {
    return {
      ...base,
      height: 320,
      type: kind === 'l-shape' ? 'l_shape' : 'composite_shape',
      data: {
        label: spec.label,
        top: spec.top,
        length: spec.length || spec.l,
        height: spec.height || spec.h,
      },
    };
  }
  if (kind === 'angle') {
    return { ...base, height: 300, type: 'angle_on_line', data: { angleDegrees: spec.degrees || spec.angle || 90 } };
  }
  if (kind === 'table') {
    return { ...base, type: 'table', data: { headers: spec.columns || [], rows: spec.rows || [] } };
  }
  if (kind === 'bar') {
    return {
      ...base,
      height: 320,
      type: 'bar_chart',
      data: { bars: (spec.rows || []).map(([label, value]) => ({ label, value })) },
    };
  }
  if (kind === 'line') {
    return {
      ...base,
      height: 320,
      type: 'line_graph',
      data: { points: (spec.points || []).map(([label, value]) => ({ label, value })) },
    };
  }
  if (kind === 'pictograph') {
    return {
      ...base,
      height: 320,
      type: 'pictograph',
      data: { rows: spec.rows || [], keyValue: spec.keyValue || spec.key },
    };
  }
  if (kind === 'value-list') {
    return {
      ...base,
      height: 180,
      type: 'value_list',
      data: { values: spec.values || spec.items || [] },
    };
  }
  if (kind === 'pie') {
    return {
      width: 420,
      height: 300,
      type: 'pie_chart',
      data: { sectors: spec.sectors || spec.parts || spec.rows || [] },
    };
  }
  return {
    ...base,
    type: 'table',
    data: {
      headers: ['Diagram detail', 'Value'],
      rows: Object.entries(spec)
        .filter(([key]) => key !== 'kind')
        .map(([key, value]) => [key, Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : String(value)]),
    },
  };
}

function inferPercentageGridDiagram(prompt = '') {
  const m = String(prompt).match(/(\d+)\s+squares?\s+out\s+of\s+100.*shaded/i);
  if (!m) return null;
  const shaded = Number(m[1]);
  if (!Number.isFinite(shaded) || shaded < 0 || shaded > 100) return null;
  return { type: 'percentage_grid', width: 310, height: 330, data: { shaded } };
}

function inferredDiagramCandidates(question = {}) {
  const prompt = question?.prompt || question?.stem || '';
  return [
    inferPercentageGridDiagram(prompt),
    inferNumberLineDiagram(prompt),
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
      data-testid="question-diagram"
      className="mb-4 w-full max-w-full overflow-hidden rounded-lg border border-line-soft bg-white p-2 sm:rounded-xl sm:p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:max-h-[42vh] [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
