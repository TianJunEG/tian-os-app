import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  MATH_STAMPS,
  MATH_BUILDERS,
  MathStampBuilder,
  createMathObject,
  createTextObject,
  normaliseMathObject,
  stampStrokeToMathObject,
  SCRATCHPAD_LAYOUT,
} from './workingMath';

describe('workingMath — shared math layer', () => {
  it('exposes operators and notations in one canonical stamp list', () => {
    const ids = MATH_STAMPS.map((s) => s.id);
    // Operators (added so the inline scratchpad and full-screen canvas match).
    for (const op of ['plus', 'minus', 'times', 'divide', 'equals']) {
      expect(ids).toContain(op);
    }
    // Notations that need a builder popover.
    for (const n of ['fraction', 'power', 'root']) {
      expect(ids).toContain(n);
    }
  });

  it('only multi-field notations declare builders (operators insert directly)', () => {
    expect(MATH_BUILDERS.fraction).toEqual(['numerator', 'denominator']);
    expect(MATH_BUILDERS.plus).toBeUndefined();
    expect(MATH_BUILDERS.pi).toBeUndefined();
  });

  it('inserts an operator immediately with no builder popover', () => {
    const onInsert = vi.fn();
    render(<MathStampBuilder mathDraft={null} setMathDraft={vi.fn()} onInsert={onInsert} />);

    fireEvent.click(screen.getByTitle('Insert +'));
    expect(onInsert).toHaveBeenCalledWith('plus');
    // No builder popover for a bare operator.
    expect(screen.queryByLabelText('+ builder')).not.toBeInTheDocument();
  });

  it('opens a builder popover for a fraction instead of inserting immediately', () => {
    const setMathDraft = vi.fn();
    const onInsert = vi.fn();
    render(<MathStampBuilder mathDraft={null} setMathDraft={setMathDraft} onInsert={onInsert} />);

    fireEvent.click(screen.getByTitle('Insert x/y'));
    expect(onInsert).not.toHaveBeenCalled();
    expect(setMathDraft).toHaveBeenCalled();
  });

  it('normalises legacy stamp strokes into draggable math objects', () => {
    const legacy = { tool: 'stamp', template: 'fraction', numerator: '3', denominator: '4', points: [{ x: 120, y: 80 }] };
    const obj = stampStrokeToMathObject(legacy);
    expect(obj).toMatchObject({ type: 'fraction', x: 120, y: 80, value: { numerator: '3', denominator: '4' } });
    // normaliseMathObject routes stamp strokes through the same converter.
    expect(normaliseMathObject(legacy)).toMatchObject({ type: 'fraction', x: 120, y: 80 });
  });

  it('builds math and text objects with sensible defaults', () => {
    const math = createMathObject('power', { base: 'x', exponent: '2' }, 0);
    expect(math).toMatchObject({ type: 'power', value: { base: 'x', exponent: '2' }, colour: '#f97316' });
    const text = createTextObject({ text: 'hello' });
    expect(text).toMatchObject({ type: 'text', text: 'hello' });
  });

  it('places inline scratchpad inserts inside the 900×320 canvas', () => {
    // First few inserts must stay on-canvas (the full-screen layout would spawn
    // them off the right edge of the smaller scratchpad).
    for (let i = 0; i < 6; i += 1) {
      const obj = createMathObject('pi', {}, i, SCRATCHPAD_LAYOUT);
      expect(obj.x).toBeGreaterThanOrEqual(0);
      expect(obj.x).toBeLessThan(900);
      expect(obj.y).toBeGreaterThanOrEqual(0);
      expect(obj.y).toBeLessThan(320);
    }
  });
});
