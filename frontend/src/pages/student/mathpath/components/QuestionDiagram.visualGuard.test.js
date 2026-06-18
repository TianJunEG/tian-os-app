import { describe, it, expect } from 'vitest';
import { questionRequiresDiagram, validateQuestionDiagram } from './QuestionDiagram';

// Guards U2/U3: a visual-required question (e.g. "what fraction is shaded") must
// either carry a renderable diagram or be detectable as missing one — so the UI
// shows a friendly "couldn't load" card / withholds it, never an impossible
// text-only Try-Again retry.
describe('QuestionDiagram visual-required guard (U2/U3)', () => {
  it('flags a shaded-shape question that has no diagram as requiring one', () => {
    const q = { prompt: 'What fraction of the shape is shaded?' };
    expect(questionRequiresDiagram(q)).toBe(true);
    expect(validateQuestionDiagram(q).ok).toBe(false);
  });

  it('passes a shaded-shape question that carries a renderable diagramSpec', () => {
    const q = {
      prompt: 'What fraction of the shape is shaded?',
      diagramSpec: { type: 'fraction_bar', width: 640, height: 140, data: { parts: 4, shaded: 2, labelMode: 'none' } },
    };
    const result = validateQuestionDiagram(q);
    expect(result.requiresDiagram).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('accepts a P6 circle diagramSpec (CIR-01/02) end-to-end', () => {
    const q = {
      prompt: 'Find the circumference of a circle with diameter 14 cm. (Take π = 22/7)',
      diagramSpec: { type: 'circle', width: 360, height: 280, data: { diameter: 14, show: 'diameter', label: '14 cm' } },
    };
    const result = validateQuestionDiagram(q);
    expect(result.requiresDiagram).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('accepts semicircle and quarter_circle diagramSpecs (CIR-03)', () => {
    const semi = validateQuestionDiagram({
      prompt: 'Find the perimeter of a semicircle with diameter 28 cm. (Take π = 22/7)',
      diagramSpec: { type: 'semicircle', width: 360, height: 280, data: { diameter: 28, label: '28 cm' } },
    });
    expect(semi.ok).toBe(true);
    const quad = validateQuestionDiagram({
      prompt: 'Find the area of a quadrant (quarter-circle) with radius 14 cm. (Take π = 22/7)',
      diagramSpec: { type: 'quarter_circle', width: 360, height: 280, data: { radius: 14, label: '14 cm' } },
    });
    expect(quad.ok).toBe(true);
  });

  it('normalises new-domain diagram.kind specs into renderable diagrams', () => {
    expect(validateQuestionDiagram({
      prompt: 'A rectangle is 8 cm long and 3 cm wide. What is its area?',
      diagram: { kind: 'rectangle', l: 8, w: 3 },
    }).ok).toBe(true);
    expect(validateQuestionDiagram({
      prompt: 'Use the table to answer the question.',
      diagram: { kind: 'table', columns: ['Fruit', 'Number'], rows: [['Apple', 4], ['Pear', 2]] },
    }).ok).toBe(true);
    expect(validateQuestionDiagram({
      prompt: 'How much money is shown?',
      diagram: { kind: 'coins', items: [{ valueCents: 50, count: 3 }] },
    }).ok).toBe(true);
  });

  it('normalises P1 exam-prep visual kinds without falling back to generic tables', () => {
    const cases = [
      [{ kind: 'coins', items: [{ valueCents: 100, count: 2 }] }, 'coins'],
      [{ kind: 'clock', hour: 3, minute: 45 }, 'clock'],
      [{ kind: 'bar-model', parts: [{ value: 2, label: 'A' }, { value: 3, label: '?' }] }, 'bar_model'],
      [{ kind: 'scale', start: 0, interval: 10, marks: 10, reading: 70, unit: 'g' }, 'scale'],
      [{ kind: 'pictograph', keyValue: 2, rows: [['Ali', 3], ['Ben', 2]] }, 'pictograph'],
      [{ kind: 'value-list', values: [4, 6, 8, 10] }, 'value_list'],
      [{ kind: 'pie', sectors: [['A', 2], ['B', 3]] }, 'pie_chart'],
      [{ kind: 'tank', fillFraction: 0.5, label: 'half full' }, 'tank'],
      [{ kind: 'net', solid: 'cuboid' }, 'net'],
      [{ kind: 'l-shape', top: '12 cm', height: '8 cm' }, 'l_shape'],
    ];

    cases.forEach(([diagram, expectedType]) => {
      const result = validateQuestionDiagram({ prompt: 'Use the diagram to answer.', diagram });
      expect(result.ok).toBe(true);
      expect(result.spec.type).toBe(expectedType);
    });
  });

  it('does not require a diagram for a plain arithmetic prompt', () => {
    expect(questionRequiresDiagram({ prompt: 'Compute: 2/3 + 1/2' })).toBe(false);
    expect(validateQuestionDiagram({ prompt: 'Compute: 2/3 + 1/2' }).ok).toBe(true);
  });
});
