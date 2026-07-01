import { describe, it, expect } from 'vitest';
import { generateCirclesQuestionSet } from '../../../../shared/mathpath/circles/CirclesQuestionGenerator';
import { getQuestionDiagramSpec, canRenderQuestionDiagram } from '../../pages/student/mathpath/components/QuestionDiagram';

// Circle questions (incl. the real-world word variants that previously rendered
// text-only) must all show a figure. Also guards the circle-part naming fix:
// generators emit part 'semicircle'/'quarter-circle', which QuestionDiagram must
// map to the semicircle/quarter_circle renderers (it only matched 'half'/'quarter'
// before, so semicircles silently didn't render).
describe('circle questions all render a figure', () => {
  it.each(['CI001', 'CI002', 'CI003', 'CI004'])('%s renders a diagram for every generated question', (skillId) => {
    for (let round = 0; round < 4; round += 1) {
      const qs = generateCirclesQuestionSet({ skillId, count: 8 });
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.diagram, `${skillId}: "${String(q.prompt).slice(0, 60)}" should carry a diagram`).toBeTruthy();
        expect(canRenderQuestionDiagram(q), `${skillId}: "${String(q.prompt).slice(0, 60)}" should render`).toBe(true);
      }
    }
  });

  it('renders semicircle / quarter-circle parts (the circle-part naming fix)', () => {
    const seen = new Set();
    for (let round = 0; round < 20 && seen.size < 2; round += 1) {
      for (const q of generateCirclesQuestionSet({ skillId: 'CI004', count: 8 })) {
        if (q.diagram?.kind !== 'circle-part') continue;
        const spec = getQuestionDiagramSpec(q);
        expect(['semicircle', 'quarter_circle']).toContain(spec?.type);
        seen.add(q.diagram.part);
      }
    }
    expect(seen.has('semicircle') || seen.has('quarter-circle')).toBe(true);
  });
});
