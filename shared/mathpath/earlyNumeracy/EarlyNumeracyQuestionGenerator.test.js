import { describe, it, expect } from 'vitest';
import { earlyNumeracySkillGraph } from './EarlyNumeracySkillGraph.js';
import {
  generateEarlyNumeracyQuestionSet,
  checkEarlyNumeracyAnswer,
} from './EarlyNumeracyQuestionGenerator.js';

describe('generateEarlyNumeracyQuestionSet', () => {
  it('generates valid MCQ questions for every Strand A skill', () => {
    for (const skill of earlyNumeracySkillGraph.skills) {
      const set = generateEarlyNumeracyQuestionSet({ skillId: skill.id, count: 6, sessionSalt: 't' });
      expect(set).toHaveLength(6);
      for (const q of set) {
        expect(q.skillId).toBe(skill.id);
        expect(q.type).toBe('mcq');
        expect(q.prompt).toBeTruthy();
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
        // The correct answer is always among the choices (so it's answerable).
        expect(q.choices).toContain(q.answer.display);
        // The checker accepts the correct answer and rejects a wrong one.
        expect(checkEarlyNumeracyAnswer({ question: q, studentResponse: q.answer.display }).correct).toBe(true);
        expect(checkEarlyNumeracyAnswer({ question: q, studentResponse: '___nope___' }).correct).toBe(false);
      }
    }
  });

  it('keeps add/subtract within 10 and uses the apple-stem prompt form', () => {
    const adds = generateEarlyNumeracyQuestionSet({ skillId: 'EN007', count: 20, sessionSalt: 'a' });
    for (const q of adds) {
      const m = q.prompt.match(/^(\d+) \+ (\d+) = \?$/);
      expect(m).toBeTruthy();
      expect(Number(m[1]) + Number(m[2])).toBeLessThanOrEqual(10);
    }
    const subs = generateEarlyNumeracyQuestionSet({ skillId: 'EN008', count: 20, sessionSalt: 's' });
    for (const q of subs) {
      const m = q.prompt.match(/^(\d+) − (\d+) = \?$/);
      expect(m).toBeTruthy();
      expect(Number(m[1]) - Number(m[2])).toBeGreaterThanOrEqual(0);
    }
  });

  it('emits count/compare diagrams for the visual skills', () => {
    const counts = generateEarlyNumeracyQuestionSet({ skillId: 'EN002', count: 10, sessionSalt: 'c' });
    expect(counts.some((q) => q.diagram?.kind === 'count')).toBe(true);
    const compares = generateEarlyNumeracyQuestionSet({ skillId: 'EN005', count: 10, sessionSalt: 'cmp' });
    expect(compares.every((q) => q.diagram?.kind === 'compare')).toBe(true);
    expect(compares.every((q) => q.diagram.left.count >= 1 && q.diagram.right.count >= 1)).toBe(true);
  });

  it('emits pattern diagrams with a single missing slot, and the answer continues the pattern', () => {
    for (const skillId of ['EN011', 'EN012']) {
      const set = generateEarlyNumeracyQuestionSet({ skillId, count: 12, sessionSalt: 'p' });
      for (const q of set) {
        expect(q.diagram?.kind).toBe('pattern');
        const nulls = q.diagram.items.filter((x) => x === null);
        expect(nulls).toHaveLength(1); // exactly one blank
        expect(q.diagram.items[q.diagram.missingIndex]).toBeNull();
        // The answer is one of the pattern's shown shapes (never an unrelated one).
        const shown = new Set(q.diagram.items.filter(Boolean));
        expect(shown.has(q.answer.display)).toBe(true);
      }
    }
  });

  it('compare-size questions offer exactly the two objects', () => {
    const set = generateEarlyNumeracyQuestionSet({ skillId: 'EN010', count: 10, sessionSalt: 'sz' });
    for (const q of set) {
      expect(q.choices).toHaveLength(2);
      expect(q.choices).toContain(q.answer.display);
    }
  });

  it('shape questions offer the four basic shapes; direction offers four arrows', () => {
    for (const skillId of ['EN013', 'EN014', 'EN015']) {
      const set = generateEarlyNumeracyQuestionSet({ skillId, count: 8, sessionSalt: 'sh' });
      for (const q of set) {
        expect(q.choices).toHaveLength(4);
        expect(q.choices).toContain(q.answer.display);
      }
    }
    const dirs = generateEarlyNumeracyQuestionSet({ skillId: 'EN016', count: 8, sessionSalt: 'dir' });
    for (const q of dirs) {
      expect(new Set(q.choices)).toEqual(new Set(['⬆️', '⬇️', '⬅️', '➡️']));
      expect(q.choices).toContain(q.answer.display);
    }
  });

  it('measuring questions compare exactly two objects on the right attribute', () => {
    for (const skillId of ['EN017', 'EN018', 'EN019', 'EN020']) {
      const set = generateEarlyNumeracyQuestionSet({ skillId, count: 10, sessionSalt: 'm' });
      for (const q of set) {
        expect(q.choices).toHaveLength(2);
        expect(q.choices).toContain(q.answer.display);
        expect(/longer|shorter|taller|heavier|lighter|holds more|holds less/.test(q.prompt)).toBe(true);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateEarlyNumeracyQuestionSet({ skillId: 'EN001', count: 4, sessionSalt: 'same' });
    const b = generateEarlyNumeracyQuestionSet({ skillId: 'EN001', count: 4, sessionSalt: 'same' });
    expect(a.map((q) => q.prompt)).toEqual(b.map((q) => q.prompt));
  });
});
