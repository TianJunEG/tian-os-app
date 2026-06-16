import { describe, it, expect } from 'vitest';
import { generateMoneyQuestionSet, checkMoneyAnswer } from './MoneyQuestionGenerator.js';
import { moneySkillGraph } from './MoneySkillGraph.js';

const SKILL_IDS = moneySkillGraph.skillIds;
const MONEY_RE = /^\$\d+\.\d{2}$/;

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) {
      out.push(...generateMoneyQuestionSet({ skillId, count: 6 }));
    }
  }
  return out;
}

describe('MoneyQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for every skill', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateMoneyQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('never displays a malformed or negative money answer', () => {
    for (const q of questions) {
      expect(q.answer.display, q.prompt).toMatch(MONEY_RE);
      expect(q.answer.display.startsWith('-'), q.prompt).toBe(false);
    }
  });

  it('is not a stub — no "Compute: a + b" prompts', () => {
    for (const q of questions) expect(q.prompt).not.toMatch(/Compute:/);
  });

  it('gives every MCQ exactly four distinct, well-formed choices including the answer', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(q.choices.length, q.prompt).toBe(4);
      expect(new Set(q.choices).size, q.prompt).toBe(4);
      expect(q.choices, q.prompt).toContain(q.answer.display);
      for (const ch of q.choices) expect(ch, q.prompt).toMatch(MONEY_RE);
    }
  });

  it('writes a real, multi-step worked solution (not boilerplate)', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(2);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
      // The final step states the answer.
      expect(q.solutionSteps.join(' ')).toContain(q.answer.display);
    }
  });

  it('tags every question with a money misconception', () => {
    for (const q of questions) expect(q.misconceptionTag).toMatch(/^mon\//);
  });

  it('emits a diagram for coin-recognition and bar-model word problems', () => {
    const mn001 = generateMoneyQuestionSet({ skillId: 'MN001', count: 2 });
    for (const q of mn001) expect(q.diagram?.kind).toBe('coins');
    const mn005 = generateMoneyQuestionSet({ skillId: 'MN005', count: 2 });
    for (const q of mn005) expect(q.diagram?.kind).toBe('bar-model');
  });

  it('accepts $-prefixed, plain, and trailing-zero-trimmed answers', () => {
    const [q] = generateMoneyQuestionSet({ skillId: 'MN002', count: 1 });
    const disp = q.answer.display;                 // e.g. "$6.35"
    const plain = disp.replace('$', '');           // "6.35"
    expect(checkMoneyAnswer({ question: q, studentResponse: disp }).correct).toBe(true);
    expect(checkMoneyAnswer({ question: q, studentResponse: plain }).correct).toBe(true);
    // Whole-dollar answers accept "$8", "8" and "8.00".
    const whole = generateMoneyQuestionSet({ skillId: 'MN001', count: 12 })
      .find((x) => /\.00$/.test(x.answer.display));
    if (whole) {
      const dollars = whole.answer.display.replace('$', '').replace('.00', '');
      expect(checkMoneyAnswer({ question: whole, studentResponse: dollars }).correct).toBe(true);
      expect(checkMoneyAnswer({ question: whole, studentResponse: `$${dollars}` }).correct).toBe(true);
    }
    expect(checkMoneyAnswer({ question: q, studentResponse: 'not money' }).correct).toBe(false);
  });
});
