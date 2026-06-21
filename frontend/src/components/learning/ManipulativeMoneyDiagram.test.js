import { describe, it, expect } from 'vitest';
import { parseCoinsDiagram, parseDotStem, parseMoneyPrompt } from './ManipulativeDotArray';

describe('parseDotStem', () => {
  it('parses an addition stem', () => {
    expect(parseDotStem('3 + 4 = ?')).toEqual({ a: 3, b: 4, operator: '+' });
  });

  it('parses a subtraction stem (minus sign or hyphen)', () => {
    expect(parseDotStem('7 − 2 = ?')).toEqual({ a: 7, b: 2, operator: '−' });
    expect(parseDotStem('7 - 2 = ?')).toEqual({ a: 7, b: 2, operator: '−' });
  });

  it('rejects subtraction where b > a (would grey out every apple)', () => {
    expect(parseDotStem('3 − 5 = ?')).toBeNull();
  });

  it('rejects numbers above the within-20 cap (avoids a wall of emoji)', () => {
    expect(parseDotStem('25 + 4 = ?')).toBeNull();
    expect(parseDotStem('30 − 2 = ?')).toBeNull();
  });

  it('returns null for non-dot prompts', () => {
    expect(parseDotStem('What is 12 × 3?')).toBeNull();
    expect(parseDotStem('')).toBeNull();
  });
});

describe('parseMoneyPrompt', () => {
  it('parses dollar addition and subtraction', () => {
    expect(parseMoneyPrompt('$8.00 + $5.00')).toEqual({ a: 8, b: 5, operator: '+', unit: '$' });
    expect(parseMoneyPrompt('$8 − $3')).toEqual({ a: 8, b: 3, operator: '−', unit: '$' });
  });

  it('rejects subtraction where b > a', () => {
    expect(parseMoneyPrompt('$3 - $8')).toBeNull();
  });
});

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
