import React, { useMemo } from 'react';
import { renderers } from '../../../../mathpath/diagrams/svgRenderers';

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

function requiresDiagramFallback(question = {}) {
  if (question?.diagramSpec || question?.diagram || question?.visual?.payload?.type) return true;
  if (question?.requiresDiagram || question?.requiresVisual || question?.visualRequired) return true;
  const text = `${question?.prompt || ''} ${question?.stem || ''}`.toLowerCase();
  return /\b(number line|shaded|shape|fraction strip|bar model|area model|diagram|graph)\b/.test(text);
}

export default function QuestionDiagram({ question }) {
  const spec = useMemo(() => {
    if (question?.diagramSpec) return question.diagramSpec;
    if (question?.diagram) return question.diagram;
    if (question?.visual?.type === 'svg' && question.visual?.payload?.type) return question.visual.payload;
    const prompt = question?.prompt || question?.stem || '';
    return inferNumberLineDiagram(prompt) || inferShadedFractionDiagram(prompt);
  }, [question]);

  if (!spec) {
    if (!requiresDiagramFallback(question)) return null;
    return (
      <div className="mb-5 rounded-xl border border-hairline bg-white px-3 py-4 text-center text-sm text-ink-500">
        Diagram unavailable for this question.
      </div>
    );
  }

  const renderer = renderers[spec.type];
  if (!spec.type || !renderer) {
    return (
      <div className="mb-5 rounded-xl border border-hairline bg-paper px-3 py-4 text-sm">
        <p className="font-semibold text-ink-700">Diagram not available</p>
        <p className="mt-1 text-ink-500">The question requested a visual, but the selected renderer is missing.</p>
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
        <p className="mt-1">We couldn&apos;t draw this diagram right now. Please continue with text only.</p>
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
