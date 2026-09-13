import { describe, it, expect } from 'vitest';
import { generateGeometryQuestionSet } from './GeometryQuestionGenerator.js';

// Figure-describing geometry skills must ALWAYS ship a diagram — including the
// real-world word-problem variants, which previously rendered text-only (a
// triangle "with sides 4,6,7 cm" but no figure). Skills intentionally left
// diagram-less are excluded: GE003 (line definitions), GE009 (quad-naming — a
// figure would reveal the answer), GE015 (compass facts), GE016 (construction
// facts).
const FIGURE_SKILLS = [
  'GE001', 'GE002', 'GE004', 'GE005', 'GE006', 'GE007', 'GE008', 'GE010', 'GE011',
  'GE012', 'GE013', 'GE014', 'GE017', 'GE018', 'GE019', 'GE020', 'GE021', 'GE022',
];

describe('geometry diagram coverage — figure skills always include a diagram', () => {
  it.each(FIGURE_SKILLS)('%s emits a diagram for every generated question (word + non-word)', (skillId) => {
    for (let round = 0; round < 4; round++) {
      const qs = generateGeometryQuestionSet({ skillId, count: 8 });
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.diagram, `${skillId}: "${String(q.prompt).slice(0, 60)}" should carry a diagram`).toBeTruthy();
        expect(typeof q.diagram.kind).toBe('string');
      }
    }
  });
});
