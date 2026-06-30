import { describe, it, expect } from 'vitest';
import { generateFractionQuestionSet } from '../../../../shared/mathpath/fractions/fractionQuestionGenerator';
import { renderers } from './svgRenderers';

// Fraction compare skills used to render text-only ("Write > or < to compare
// 1/3 and 1/6"); they now ship a strip-pair so the size difference is visible
// (the same scaffold F008's visual variant already used).
describe('fraction compare questions carry a renderable strip-pair', () => {
  it.each(['F006', 'F007', 'F008'])('%s emits a fraction_bar_pair that renders', (skillId) => {
    for (let round = 0; round < 3; round += 1) {
      const qs = generateFractionQuestionSet({ skillId, count: 6 });
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.diagramSpec?.type, `${skillId}: "${q.prompt}"`).toBe('fraction_bar_pair');
        expect(q.diagramSpec.data.bars).toHaveLength(2);
        const svg = renderers[q.diagramSpec.type](q.diagramSpec);
        expect(svg).toContain('<svg');
      }
    }
  });

  it('F005 still renders a number line', () => {
    const qs = generateFractionQuestionSet({ skillId: 'F005', count: 4 });
    for (const q of qs) {
      expect(q.diagramSpec?.type).toBe('number_line');
      expect(renderers.number_line(q.diagramSpec)).toContain('<svg');
    }
  });
});
