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
    height: 180,
    data: { parts, shaded, labelMode: 'none' },
  };
}

export function questionRequiresDiagram(question = {}) {
  if (question?.diagramSpec || question?.diagram || question?.visual?.payload?.type) return true;
  if (question?.requiresDiagram || question?.requiresVisual || question?.visualRequired) return true;
  const text = `${question?.prompt || ''} ${question?.stem || ''}`.toLowerCase();
  return /\b(number line|shaded|shape|fraction strip|bar model|area model|diagram|graph)\b/.test(text);
}

export function getQuestionDiagramSpec(question = {}) {
  if (question?.diagramSpec) return question.diagramSpec;
  if (question?.diagram) return question.diagram;
  if (question?.visual?.type === 'svg' && question.visual?.payload?.type) return question.visual.payload;
  const prompt = question?.prompt || question?.stem || '';
  return inferNumberLineDiagram(prompt) || inferShadedFractionDiagram(prompt);
}

export function canRenderQuestionDiagram(question = {}) {
  const spec = getQuestionDiagramSpec(question);
  if (!spec?.type || !renderers[spec.type]) return false;
  try {
    return Boolean(renderers[spec.type](spec));
  } catch (err) {
    return false;
  }
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
      <div className="mb-5 rounded-xl border border-hairline bg-white px-3 py-4 text-center text-sm text-ink-500">
        {DIAGRAM_LOAD_ERROR_MESSAGE}
      </div>
    );
  }

  const renderer = renderers[spec.type];
  if (!spec.type || !renderer) {
    return (
      <div className="mb-5 rounded-xl border border-hairline bg-paper px-3 py-4 text-sm">
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
      <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-4 text-sm text-rose-800">
        <p className="font-semibold">Diagram render error</p>
        <p className="mt-1">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div
      className="mb-5 overflow-hidden rounded-xl border border-hairline bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
