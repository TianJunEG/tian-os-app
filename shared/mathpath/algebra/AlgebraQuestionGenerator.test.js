import { describe, it, expect } from 'vitest';
import { generateAlgebraQuestionSet, checkAlgebraAnswer } from './AlgebraQuestionGenerator.js';
import { algebraSkillGraph } from './AlgebraSkillGraph.js';

const SKILL_IDS = algebraSkillGraph?.skillIds
  || Array.from({ length: 10 }, (_, i) => 'AL' + String(i + 1).padStart(3, '0'));

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of SKILL_IDS) for (let c = 0; c < perSkill; c++) out.push(...generateAlgebraQuestionSet({ skillId, count: 6 }));
  return out;
}

describe('AlgebraQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 10 skills', () => {
    for (const skillId of SKILL_IDS) expect(generateAlgebraQuestionSet({ skillId, count: 6 }).length).toBe(6);
  });

  it('answers are never negative; the simplify skill returns a term', () => {
    for (const q of questions) {
      expect(String(q.answer.display).startsWith('-'), q.prompt).toBe(false);
    }
    const al6 = generateAlgebraQuestionSet({ skillId: 'AL006', count: 6 });
    for (const q of al6) expect(q.answer.display).toMatch(/^\d+[a-z]$/); // e.g. "12p"
  });

  it('substitution, brackets and two-step answers are computed correctly', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /Find the value of (\d+)([a-z]) \+ (\d+) when \2 = (\d+)/.exec(q.prompt))) { checked++; expect(Number(q.answer.display)).toBe(+mm[1] * +mm[4] + +mm[3]); }
      else if ((mm = /Find the value of (\d+)\(([a-z]) \+ (\d+)\) when \2 = (\d+)/.exec(q.prompt))) { checked++; expect(Number(q.answer.display)).toBe(+mm[1] * (+mm[4] + +mm[3])); }
      else if ((mm = /Solve: (\d+)([a-z]) \+ (\d+) = (\d+)\. What is \2/.exec(q.prompt))) { checked++; expect(Number(q.answer.display)).toBe((+mm[4] - +mm[3]) / +mm[1]); }
    }
    expect(checked).toBeGreaterThan(400);
  });

  it('is not boilerplate; MCQs have 4 distinct choices incl. the answer', () => {
    for (const q of questions) {
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
      if (q.type === 'mcq') {
        expect(q.choices.length).toBe(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer.display);
      }
    }
  });

  it('checker accepts terms and numbers (whitespace-insensitive), rejects wrong', () => {
    expect(checkAlgebraAnswer({ question: { answer: { display: '12p' } }, studentResponse: '12 p' }).correct).toBe(true);
    expect(checkAlgebraAnswer({ question: { answer: { display: '16' } }, studentResponse: '16' }).correct).toBe(true);
    expect(checkAlgebraAnswer({ question: { answer: { display: '12p' } }, studentResponse: '12' }).correct).toBe(false);
  });
});
