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

  it('produces questions for all skills (incl. Sec 1 G1 AL011–AL016)', () => {
    for (const skillId of SKILL_IDS) expect(generateAlgebraQuestionSet({ skillId, count: 6 }).length).toBe(6);
    for (const id of ['AL011', 'AL012', 'AL013', 'AL014', 'AL015', 'AL016']) expect(SKILL_IDS).toContain(id);
  });

  it('P6 answers are non-negative; the simplify skill returns a term', () => {
    // The P6 skills (AL001–AL010) stay non-negative; the Sec 1 integer-aware
    // skills (e.g. AL015 substitution with negatives) may legitimately go below 0.
    const P6 = ['AL001', 'AL002', 'AL003', 'AL004', 'AL005', 'AL006', 'AL007', 'AL008', 'AL009', 'AL010'];
    for (const id of P6) {
      for (const q of generateAlgebraQuestionSet({ skillId: id, count: 12 })) {
        expect(String(q.answer.display).startsWith('-'), q.prompt).toBe(false);
      }
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

  describe('Secondary 1 (G1) — AL011–AL016', () => {
    it('tags every Sec 1 algebra skill as Secondary 1', () => {
      for (const id of ['AL011', 'AL012', 'AL013', 'AL014', 'AL015', 'AL016']) {
        expect(algebraSkillGraph.skills.find((s) => s.id === id).singaporeLevel).toEqual(['Secondary 1']);
      }
    });

    it('linear-expression answers compare by canonical form (order-insensitive)', () => {
      expect(checkAlgebraAnswer({ question: { answer: { display: '2x + 7' } }, studentResponse: '7 + 2x' }).correct).toBe(true);
      expect(checkAlgebraAnswer({ question: { answer: { display: '3x - 4' } }, studentResponse: '-4 + 3x' }).correct).toBe(true);
      expect(checkAlgebraAnswer({ question: { answer: { display: '2x + 7' } }, studentResponse: '2x + 8' }).correct).toBe(false);
    });

    it('every Sec 1 generator’s own answer passes its checker; MCQs are well-formed', () => {
      for (const id of ['AL011', 'AL012', 'AL013', 'AL014', 'AL015', 'AL016']) {
        for (let c = 0; c < 50; c++) {
          for (const q of generateAlgebraQuestionSet({ skillId: id, count: 6 })) {
            expect(checkAlgebraAnswer({ question: q, studentResponse: q.answer.display }).correct, q.prompt).toBe(true);
            if (q.type === 'mcq') {
              expect(q.choices.length).toBe(4);
              expect(new Set(q.choices).size).toBe(4);
              expect(q.choices).toContain(q.answer.display);
            }
          }
        }
      }
    });

    it('solves two-step and bracket equations correctly', () => {
      for (let c = 0; c < 60; c++) {
        for (const q of [...generateAlgebraQuestionSet({ skillId: 'AL013', count: 6 }), ...generateAlgebraQuestionSet({ skillId: 'AL014', count: 6 })]) {
          let mm;
          if ((mm = /Solve: (\d+)([a-z]) ([+-]) (\d+) = (-?\d+)/.exec(q.prompt))) {
            const a = +mm[1], b = (mm[3] === '+' ? 1 : -1) * +mm[4], cc = +mm[5];
            expect(Number(q.answer.display)).toBe((cc - b) / a);
          } else if ((mm = /Solve: (\d+)\(([a-z]) ([+-]) (\d+)\) = (-?\d+)/.exec(q.prompt))) {
            const a = +mm[1], b = (mm[3] === '+' ? 1 : -1) * +mm[4], cc = +mm[5];
            expect(Number(q.answer.display)).toBe(cc / a - b);
          }
        }
      }
    });
  });
  it('word-problem families (_003) cycle in at every 3rd position', () => {
    // AL004 _003 produces subtraction-expression answers like "n - 5"
    const al4 = generateAlgebraQuestionSet({ skillId: 'AL004', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(al4[i].answer.display).toMatch(/^[a-z] - \d+$/);
      expect(al4[i].type).toBe('short_answer');
    }
    // AL006 _003 produces perimeter-expression answers like "12n"
    const al6 = generateAlgebraQuestionSet({ skillId: 'AL006', count: 9 });
    for (const i of [2, 5, 8]) expect(al6[i].answer.display).toMatch(/^\d+[a-z]$/);
    // Remaining word-problem families return positive numeric answers
    for (const skillId of ['AL001', 'AL002', 'AL003', 'AL005', 'AL007', 'AL008', 'AL009', 'AL010']) {
      const qs = generateAlgebraQuestionSet({ skillId, count: 9 });
      for (const i of [2, 5, 8]) {
        expect(Number(qs[i].answer.display)).toBeGreaterThan(0);
        expect(qs[i].solutionSteps.length).toBeGreaterThan(0);
      }
    }
  });
});
