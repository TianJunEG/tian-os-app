import { describe, it, expect } from 'vitest';
import { getQuestionDiagramSpec, canRenderQuestionDiagram } from './QuestionDiagram';
import { renderers } from '../../../../mathpath/diagrams/svgRenderers';

const svgFor = (spec) => (spec && renderers[spec.type] ? renderers[spec.type](spec) : '');

// Decimals D002 phrased "...What value is at mark 7?" (number AFTER "mark") used
// to slip past the number-line parser, which only matched "7th mark".
describe('QuestionDiagram — number line handles "mark N" and "Nth mark"', () => {
  it('renders a number line for the decimals "mark 7" phrasing', () => {
    const q = { prompt: 'A number line from 7 to 8 is split into 10 equal parts. What value is at mark 7?' };
    const spec = getQuestionDiagramSpec(q);
    expect(spec?.type).toBe('number_line');
    expect(spec.data.points[0].value).toBeCloseTo(7.7, 5);
    expect(svgFor(spec)).toContain('<svg');
    expect(canRenderQuestionDiagram(q)).toBe(true);
  });

  it('still handles the "3rd mark" phrasing', () => {
    const spec = getQuestionDiagramSpec({ prompt: 'A number line from 0 to 1 is divided into 4 equal parts. What value is at the 3rd mark?' });
    expect(spec?.type).toBe('number_line');
    expect(spec.data.points[0].value).toBeCloseTo(0.75, 5);
  });
});

// Percentage P001 "84 squares out of 100 in a grid are shaded" had no renderer.
describe('QuestionDiagram — hundred grid for "N squares out of M shaded"', () => {
  it('renders a 100-cell grid with 84 shaded', () => {
    const q = { prompt: '84 squares out of 100 in a grid are shaded. What percentage is shaded?' };
    const spec = getQuestionDiagramSpec(q);
    expect(spec?.type).toBe('hundred_grid');
    expect(spec.data).toMatchObject({ cells: 100, shaded: 84 });
    const svg = svgFor(spec);
    // 100 cells + the white background rect.
    expect((svg.match(/<rect/g) || []).length).toBeGreaterThanOrEqual(100);
    expect(canRenderQuestionDiagram(q)).toBe(true);
  });

  it('rejects impossible counts (shaded > cells)', () => {
    expect(getQuestionDiagramSpec({ prompt: '200 squares out of 100 in a grid are shaded.' })).toBeNull();
  });
});
