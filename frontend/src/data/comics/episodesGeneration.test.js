import { describe, it, expect } from 'vitest';
import { episodes } from './episodes';
import { generateEpisodeProblems } from './comicDifficulty';

// Every comic problem is now level-scaled (generate()). This guards the whole
// library: for every episode, tier and many seeds, each generated problem must
// be well-formed and its answer a non-negative finite number. Catches a bad
// band, a typo'd template, or a generator that divides to a fraction/negative.

describe('all comic problems generate validly at every tier', () => {
  for (const ep of episodes) {
    it(`${ep.id} (${ep.slug})`, () => {
      for (let tier = 0; tier <= 3; tier++) {
        for (let seed = 0; seed < 60; seed++) {
          const probs = generateEpisodeProblems(ep, tier, seed);
          expect(probs.length).toBe(ep.panels.length);
          probs.forEach((p, i) => {
            if (!p) return;
            const where = `${ep.id} panel ${i} tier ${tier} seed ${seed} → "${p.question}"`;
            expect(typeof p.question, where).toBe('string');
            expect(p.question.length, where).toBeGreaterThan(0);
            expect(typeof p.hint, where).toBe('string');
            const ans = Number(p.answer);
            expect(Number.isFinite(ans), `${where} answer=${p.answer}`).toBe(true);
            expect(Number.isInteger(ans), `${where} answer=${p.answer} (should be whole)`).toBe(true);
            expect(ans, where).toBeGreaterThanOrEqual(0);
            // the question must not leak an unresolved template or undefined
            expect(p.question, where).not.toContain('undefined');
            expect(p.question, where).not.toContain('NaN');
          });
        }
      }
    });
  }
});

describe('difficulty actually scales across the library', () => {
  it('tier 3 totals exceed tier 0 totals on average for every episode', () => {
    const meanFirstAnswer = (ep, tier) => {
      let sum = 0, n = 0;
      for (let s = 0; s < 60; s++) {
        const first = generateEpisodeProblems(ep, tier, s).find(Boolean);
        if (first) { sum += Number(first.answer); n += 1; }
      }
      return n ? sum / n : 0;
    };
    for (const ep of episodes) {
      // shape-fact episode (ep-009) varies the shape, not magnitude — skip the
      // monotonic-size assertion there.
      if (ep.id === 'ep-009') continue;
      expect(meanFirstAnswer(ep, 3), ep.id).toBeGreaterThan(meanFirstAnswer(ep, 0));
    }
  });
});
