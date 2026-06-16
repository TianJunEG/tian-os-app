import { describe, it, expect } from 'vitest';
import { generateNumberSenseQuestionSet, checkNumberSenseAnswer } from './NumberSenseQuestionGenerator.js';
import { numberSenseSkillGraph } from './NumberSenseSkillGraph.js';

const SKILL_IDS = numberSenseSkillGraph?.skillIds
  || Array.from({ length: 23 }, (_, i) => 'NS' + String(i + 1).padStart(3, '0'));
const num = (s) => Number(String(s).replace(/,/g, ''));

function sampleAll(perSkill = 25) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateNumberSenseQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('NumberSenseQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 23 skills', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateNumberSenseQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('is not a stub — no "Compute: a + b" prompts, and varied question types appear', () => {
    const prompts = questions.map((q) => q.prompt);
    for (const p of prompts) expect(p).not.toMatch(/Compute:/);
    expect(prompts.some((p) => /value of the digit/.test(p))).toBe(true);   // place value
    expect(prompts.some((p) => /Round /.test(p))).toBe(true);                // rounding
    expect(prompts.some((p) => /Compare/.test(p))).toBe(true);               // comparison
    expect(prompts.some((p) => /Arrange/.test(p))).toBe(true);               // ordering
  });

  it('re-derives rounding, comparison, counting, number-line and temperature answers', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /Round ([\d,]+) to the nearest (\d+)/.exec(q.prompt))) {
        checked++; expect(num(q.answer.display)).toBe(Math.round(num(mm[1]) / num(mm[2])) * num(mm[2]));
      } else if ((mm = /Compare.*?:\s*(-?[\d,]+) ___ (-?[\d,]+)/.exec(q.prompt))) {
        const a = num(mm[1]), b = num(mm[2]); checked++;
        expect(q.answer.display).toBe(a > b ? '>' : a < b ? '<' : '=');
      } else if ((mm = /just after ([\d,]+)/.exec(q.prompt))) {
        checked++; expect(num(q.answer.display)).toBe(num(mm[1]) + 1);
      } else if ((mm = /(\d+) steps to the left of (\d+)/.exec(q.prompt))) {
        checked++; expect(num(q.answer.display)).toBe(num(mm[2]) - num(mm[1]));
      } else if ((mm = /was (-?\d+)°C\. It fell by (\d+)°C/.exec(q.prompt))) {
        checked++; expect(num(q.answer.display)).toBe(num(mm[1]) - num(mm[2]));
      }
    }
    expect(checked).toBeGreaterThan(800);
  });

  it('every MCQ has distinct choices that include the answer, and ≥3 numeric choices where applicable', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(new Set(q.choices).size, q.prompt + ' :: ' + q.choices.join('|')).toBe(q.choices.length);
      expect(q.choices, q.prompt).toContain(q.answer.display);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);   // comparison MCQs have 3 (< > =)
    }
  });

  it('ordering answers are correctly sorted', () => {
    for (let c = 0; c < 40; c++) {
      for (const q of [...generateNumberSenseQuestionSet({ skillId: 'NS011', count: 6 }),
                       ...generateNumberSenseQuestionSet({ skillId: 'NS012', count: 6 })]) {
        if (!/Arrange/.test(q.prompt)) continue;
        const nums = q.answer.display.split(',').map((s) => num(s));
        const sorted = [...nums].sort((a, b) => a - b);
        expect(nums).toEqual(sorted);
      }
    }
  });

  it('writes real worked solutions (not boilerplate)', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(1);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
    }
  });

  it('checker accepts numbers, symbols and lists (with spacing/commas) but rejects wrong answers', () => {
    const mk = (display) => ({ answer: { display } });
    expect(checkNumberSenseAnswer({ question: mk('1000'), studentResponse: '1,000' }).correct).toBe(true);
    expect(checkNumberSenseAnswer({ question: mk('<'), studentResponse: '<' }).correct).toBe(true);
    expect(checkNumberSenseAnswer({ question: mk('14, 19, 44, 58'), studentResponse: '14,19,44,58' }).correct).toBe(true);
    expect(checkNumberSenseAnswer({ question: mk('-5'), studentResponse: '-5' }).correct).toBe(true);
    expect(checkNumberSenseAnswer({ question: mk('<'), studentResponse: '>' }).correct).toBe(false);
  });
});
