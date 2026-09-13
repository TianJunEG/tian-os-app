import { describe, it, expect } from 'vitest';
import { checkFractionAnswer, generateFractionQuestionSet } from './fractionQuestionGenerator.js';
import fractionSkillGraph from './fractionSkillGraph.js';

describe('checkFractionAnswer — simplest-form gate', () => {
  const simplestAnswer = { type: 'fraction', numerator: 3, denominator: 4, display: '3/4', requireSimplest: true };

  it('rejects a correct-but-unsimplified fraction when simplest form is required', () => {
    expect(checkFractionAnswer({ studentAnswer: '6/8', correctAnswer: simplestAnswer }).correct).toBe(false);
    expect(checkFractionAnswer({ studentAnswer: '9/12', correctAnswer: simplestAnswer }).correct).toBe(false);
  });

  it('accepts the fully-simplified fraction', () => {
    expect(checkFractionAnswer({ studentAnswer: '3/4', correctAnswer: simplestAnswer }).correct).toBe(true);
  });

  it('stays lenient about equivalence when simplest form is NOT required', () => {
    const plain = { type: 'fraction', numerator: 3, denominator: 4, display: '3/4' };
    expect(checkFractionAnswer({ studentAnswer: '6/8', correctAnswer: plain }).correct).toBe(true);
  });
});

// End-to-end: real generated "simplify / simplest form" questions must reject the
// unsimplified input the student is being asked to reduce.
describe('generated simplest-form questions reject the unreduced input', () => {
  it('marks the raw (unsimplified) fraction wrong on every requireSimplest item', () => {
    const seen = [];
    for (const skillId of fractionSkillGraph.skillIds) {
      const set = generateFractionQuestionSet({ skillId, count: 12, mode: 'practice' }) || [];
      for (const q of set) {
        if (!q?.answer?.requireSimplest) continue;
        // Recover the unsimplified form: "Simplify N/D ..." prompt, or the bar
        // model's shaded/total from its diagram spec.
        let raw = null;
        const m = String(q.prompt || '').match(/(\d+)\s*\/\s*(\d+)/);
        if (m) raw = `${m[1]}/${m[2]}`;
        else if (q.diagramSpec?.data?.parts) raw = `${q.diagramSpec.data.shaded}/${q.diagramSpec.data.parts}`;
        if (!raw) continue;
        seen.push({ skillId, raw, answer: q.answer.display });
        // The raw form is unsimplified by construction → must be marked wrong.
        expect(checkFractionAnswer({ studentAnswer: raw, correctAnswer: q.answer, acceptedAnswers: q.acceptedAnswers }).correct)
          .toBe(false);
        // The simplified answer must be accepted.
        expect(checkFractionAnswer({ studentAnswer: q.answer.display, correctAnswer: q.answer, acceptedAnswers: q.acceptedAnswers }).correct)
          .toBe(true);
      }
    }
    // Guard: the fixture actually exercised some simplest-form questions.
    expect(seen.length).toBeGreaterThan(0);
  });
});
