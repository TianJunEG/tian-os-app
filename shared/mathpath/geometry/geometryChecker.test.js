import { describe, it, expect } from 'vitest';
import { generateGeometryQuestionSet, checkGeometryAnswer } from './GeometryQuestionGenerator.js';

// Bug F: GE009 "which quadrilateral has <property>?" must describe exactly ONE of
// its four choices — otherwise a correct pick (e.g. "rectangle" for "two pairs of
// parallel sides") is marked wrong.
describe('GE009 quadrilateral property descriptions uniquely identify one shape', () => {
  const DESC_TO_SHAPE = {
    '4 equal sides and 4 right angles': 'square',
    '4 right angles but not all four sides equal': 'rectangle',
    '4 equal sides but no right angles': 'rhombus',
    'two pairs of parallel sides, but no right angles and not all sides equal': 'parallelogram',
  };

  it('uses only unambiguous descriptions that match the accepted answer', () => {
    const set = generateGeometryQuestionSet({ skillId: 'GE009', count: 24 });
    const quad = set.filter((q) => /which quadrilateral has/i.test(q.prompt));
    expect(quad.length).toBeGreaterThan(0);
    for (const q of quad) {
      const desc = q.prompt.replace(/^which quadrilateral has\s*/i, '').replace(/\?\s*$/, '').trim();
      const answer = q.answer?.display ?? q.answer;
      // The description must be one of the unambiguous set and point to the answer.
      expect(DESC_TO_SHAPE[desc], `desc="${desc}"`).toBe(answer);
      // Checker accepts the answer and rejects a different choice.
      expect(checkGeometryAnswer({ question: q, studentResponse: answer }).correct).toBe(true);
      const other = ['square', 'rectangle', 'rhombus', 'parallelogram'].find((s) => s !== answer);
      expect(checkGeometryAnswer({ question: q, studentResponse: other }).correct).toBe(false);
    }
  });
});

// Bug G: an area/volume answer typed with an ASCII exponent ("cm2") must not be
// rejected against the superscript display ("cm²").
describe('checkGeometryAnswer — unit-tolerant numeric compare', () => {
  const q = (display) => ({ answer: { display } });
  it('accepts the correct number regardless of unit notation', () => {
    expect(checkGeometryAnswer({ question: q('50 cm²'), studentResponse: '50 cm2' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: q('50 cm²'), studentResponse: '50' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: q('50 cm²'), studentResponse: '50 cm²' }).correct).toBe(true);
  });
  it('still rejects a wrong number, and angles keep working', () => {
    expect(checkGeometryAnswer({ question: q('50 cm²'), studentResponse: '60 cm2' }).correct).toBe(false);
    expect(checkGeometryAnswer({ question: q('120°'), studentResponse: '120' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: q('120°'), studentResponse: '130' }).correct).toBe(false);
  });
});
