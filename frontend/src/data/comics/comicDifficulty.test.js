import { describe, it, expect } from 'vitest';
import { makeRng, resolveTier, tierInt, generateEpisodeProblems } from './comicDifficulty';
import { getEpisode } from './episodes';

describe('resolveTier', () => {
  it('never goes below the episode grade floor (P3–P4 ⇒ tier 1)', () => {
    expect(resolveTier({ studentLevel: 'P2' }, 'P3–P4')).toBe(1);
    expect(resolveTier({ studentLevel: 'P1' }, 'P3–P4')).toBe(1);
  });
  it('scales up for advanced readers on the same episode', () => {
    expect(resolveTier({ studentLevel: 'P6' }, 'P3–P4')).toBe(2);
    expect(resolveTier({ studentLevel: 'Secondary 1' }, 'P3–P4')).toBe(3);
    expect(resolveTier({ level: 'S2' }, 'P3–P4')).toBe(3);
  });
  it('reads any of the level field shapes, defaults sensibly when unknown', () => {
    expect(resolveTier({ profile: { level: 'Primary 5' } }, 'P3–P4')).toBe(2);
    expect(resolveTier({}, 'P3–P4')).toBe(1);   // episode floor still applies
    expect(resolveTier({}, '')).toBe(1);        // nothing known → upper-primary default
  });
});

describe('makeRng', () => {
  it('is deterministic for a given seed and varies across seeds', () => {
    const a = Array.from({ length: 5 }, makeRng('x'));
    const b = Array.from({ length: 5 }, makeRng('x'));
    const c = Array.from({ length: 5 }, makeRng('y'));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('generateEpisodeProblems', () => {
  const fakeEpisode = {
    id: 'ep-test',
    panels: [
      { problem: { id: 'a', skill: 's', unit: '$', generate: (rng, tier, ctx) => { ctx.total = 7 + tier; return { question: `q${ctx.total}`, answer: ctx.total }; } } },
      { /* no problem */ },
      { problem: { id: 'b', skill: 's', generate: (rng, tier, ctx) => ({ question: 'q2', answer: ctx.total * 2 }) } },
      { problem: { id: 'c', question: 'static', answer: 42 } }, // legacy static, no generate
    ],
  };

  it('merges generated fields over static ones and aligns to panels (null where no problem)', () => {
    const { problems: out } = generateEpisodeProblems(fakeEpisode, 1, 123);
    expect(out).toHaveLength(4);
    expect(out[1]).toBeNull();
    expect(out[0]).toMatchObject({ id: 'a', skill: 's', unit: '$', answer: 8 }); // 7 + tier(1)
  });

  it('threads a shared ctx so later panels reuse earlier values', () => {
    const { problems: out } = generateEpisodeProblems(fakeEpisode, 1, 123);
    expect(out[2].answer).toBe(out[0].answer * 2); // panel c reuses panel a's total
  });

  it('passes static (non-generate) problems through unchanged', () => {
    const { problems: out } = generateEpisodeProblems(fakeEpisode, 3, 1);
    expect(out[3]).toEqual({ id: 'c', question: 'static', answer: 42 });
  });
});

describe('Episode 1 generated problems are correct and story-consistent', () => {
  it('answers match the numbers in the question, and the menu stays in sync', () => {
    const ep = getEpisode('hawker-heroes');
    for (const seed of [1, 2, 99, 1000]) {
      const { problems: [p1, p2, p3] } = generateEpisodeProblems(ep, 1, seed);

      // p1: "Lejo has $a and Kylo has $b" ⇒ a + b
      const m1 = p1.question.match(/\$(\d+) and Kylo has \$(\d+)/);
      expect(Number(p1.answer)).toBe(Number(m1[1]) + Number(m1[2]));

      // p2: quantity × price for each item sums to the answer; prices stay
      // realistic (≤ $9) and appear in the menu, difficulty rides on quantity.
      const m2 = p2.question.match(/(\d+) char kway teow \(at \$(\d+) each\), (\d+) ice kachang \(at \$(\d+) each\) and (\d+) chicken rice \(at \$(\d+) each\)/);
      const [qCkt, ckt, qIk, ik, qCr, cr] = m2.slice(1).map(Number);
      expect(Number(p2.answer)).toBe(qCkt * ckt + qIk * ik + qCr * cr);
      expect([ckt, ik, cr].every((p) => p >= 2 && p <= 9)).toBe(true);
      expect(p2.menuNote).toContain(`Char kway teow $${ckt}`);
      expect(p2.menuNote).toContain(`Ice kachang $${ik}`);
      expect(p2.menuNote).toContain(`Chicken rice $${cr}`);

      // p3: "paid $P. The food cost $F" ⇒ change P − F, and F reuses p2's total
      const m3 = p3.question.match(/paid with \$(\d+)\. The food cost \$(\d+)/);
      const [paid, food] = [Number(m3[1]), Number(m3[2])];
      expect(food).toBe(Number(p2.answer));      // story-linked
      expect(Number(p3.answer)).toBe(paid - food);
      expect(p3.answer).toBeGreaterThan(0);       // change is always positive
    }
  });

  it('higher tiers produce larger numbers on the same story', () => {
    const ep = getEpisode('hawker-heroes');
    const meanP1 = (tier) => {
      let sum = 0;
      for (let s = 0; s < 40; s++) sum += generateEpisodeProblems(ep, tier, s).problems[0].answer;
      return sum / 40;
    };
    expect(meanP1(3)).toBeGreaterThan(meanP1(1));
    expect(meanP1(2)).toBeGreaterThan(meanP1(0));
  });
});
