import { describe, it, expect } from 'vitest';
import { generateFractionQuestionSet } from '../../../../shared/mathpath/fractions/fractionQuestionGenerator';
import { renderers } from './svgRenderers';

// Regression: "What fraction is shaded?" questions must NOT print the answer.
// The fraction_bar renderer already honoured labelMode:'none', but fraction_circle
// and fraction_triangle drew the "shaded/parts" label unconditionally — so the
// circle/triangle variants of the recognise question revealed the answer under the
// diagram. All three renderers must now suppress the label when labelMode:'none'.
describe('fraction renderers honour labelMode:none (no answer leak)', () => {
  it.each(['fraction_circle', 'fraction_triangle', 'fraction_bar'])(
    '%s hides the shaded/parts label when labelMode is none',
    (type) => {
      const spec = { type, width: 640, height: 220, data: { parts: 4, shaded: 3, labelMode: 'none' } };
      expect(renderers[type](spec)).not.toContain('3/4');
    },
  );

  it.each(['fraction_circle', 'fraction_triangle', 'fraction_bar'])(
    '%s still shows the label by default (labelMode omitted)',
    (type) => {
      const spec = { type, width: 640, height: 220, data: { parts: 4, shaded: 3 } };
      expect(renderers[type](spec)).toContain('3/4');
    },
  );
});

// End-to-end: every generated "recognise the fraction" question (F001/F002 route
// through the shape-picking builder that can emit circle/triangle/bar) must render
// a figure that does not contain the fraction it is asking the student to name.
describe('recognise-fraction questions never render their own answer', () => {
  it.each(['F001', 'F002'])('%s figures omit the answer label', (skillId) => {
    for (let round = 0; round < 6; round += 1) {
      for (const q of generateFractionQuestionSet({ skillId, count: 8 })) {
        const spec = q.diagramSpec;
        if (!spec || !['fraction_circle', 'fraction_triangle', 'fraction_bar'].includes(spec.type)) continue;
        const { shaded, parts } = spec.data;
        const svg = renderers[spec.type](spec);
        expect(svg, `${skillId}: "${q.prompt}" leaks ${shaded}/${parts}`).not.toContain(`${shaded}/${parts}`);
      }
    }
  });
});
