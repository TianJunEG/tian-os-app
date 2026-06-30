import { describe, it, expect } from 'vitest';
import { parseCoinsDiagram, parseShapeChoice, parseBondDiagram } from './ManipulativeDotArray';

describe('parseCoinsDiagram', () => {
  it('parses the generator coins diagram (single denomination) into one token per coin', () => {
    // Mirrors MoneyQuestionGenerator: diagram:{ kind:'coins', items:[{ valueCents, count }] }
    const q = { diagram: { kind: 'coins', items: [{ valueCents: 50, count: 4 }] } };
    const tokens = parseCoinsDiagram(q);
    expect(tokens).toHaveLength(4);
    expect(tokens.every((t) => t.value === 50)).toBe(true);
    expect(new Set(tokens.map((t) => t.key)).size).toBe(4); // unique keys
  });

  it('handles a note denomination', () => {
    const q = { diagram: { kind: 'coins', items: [{ valueCents: 500, count: 3 }] } };
    const tokens = parseCoinsDiagram(q);
    expect(tokens).toHaveLength(3);
    expect(tokens[0].value).toBe(500);
  });

  it('handles mixed denominations across items', () => {
    const q = { diagram: { kind: 'coins', items: [{ valueCents: 100, count: 2 }, { valueCents: 20, count: 3 }] } };
    const tokens = parseCoinsDiagram(q);
    expect(tokens).toHaveLength(5);
    expect(tokens.filter((t) => t.value === 100)).toHaveLength(2);
    expect(tokens.filter((t) => t.value === 20)).toHaveLength(3);
  });

  it('returns null for non-coins diagrams and missing diagrams', () => {
    expect(parseCoinsDiagram({ diagram: { kind: 'bar-model' } })).toBeNull();
    expect(parseCoinsDiagram({})).toBeNull();
    expect(parseCoinsDiagram(null)).toBeNull();
  });

  it('skips unknown denominations and zero counts', () => {
    const q = { diagram: { kind: 'coins', items: [{ valueCents: 7, count: 5 }, { valueCents: 100, count: 0 }] } };
    expect(parseCoinsDiagram(q)).toBeNull();
  });
});

describe('parseShapeChoice', () => {
  it('extracts the shape kind from a shape: token, else null', () => {
    expect(parseShapeChoice('shape:triangle')).toBe('triangle');
    expect(parseShapeChoice('shape:rectangle')).toBe('rectangle');
    expect(parseShapeChoice('shape:circle')).toBe('circle');
    expect(parseShapeChoice('shape:square')).toBe('square');
    expect(parseShapeChoice('shape:hexagon')).toBeNull(); // not a basic shape
    expect(parseShapeChoice('5')).toBeNull();
    expect(parseShapeChoice('🔺')).toBeNull();
    expect(parseShapeChoice(null)).toBeNull();
  });
});

describe('parseBondDiagram', () => {
  it('reads whole/part from a bond diagram, else null', () => {
    expect(parseBondDiagram({ diagram: { kind: 'bond', whole: 5, part: 2 } })).toEqual({ whole: 5, part: 2 });
    expect(parseBondDiagram({ diagram: { kind: 'count', emoji: '🍎', count: 5 } })).toBeNull();
    expect(parseBondDiagram({ diagram: { kind: 'bond', whole: 'x' } })).toBeNull();
    expect(parseBondDiagram({})).toBeNull();
    expect(parseBondDiagram(null)).toBeNull();
  });
});
