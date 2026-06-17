import { describe, it, expect } from 'vitest';
import { generateCirclesQuestionSet, checkCirclesAnswer } from './CirclesQuestionGenerator.js';
import { circlesSkillGraph } from './CirclesSkillGraph.js';

const SKILL_IDS = circlesSkillGraph?.skillIds || ['CI001', 'CI002', 'CI003', 'CI004'];
const dig = (s) => s.replace(/cm³|cm2|cm²|cm/g, '').replace(/[^0-9.\-]/g, '');
const r2 = (v) => Math.round(v * 100) / 100;

function sampleAll(perSkill = 60) {
  const out = [];
  for (const skillId of SKILL_IDS) for (let c = 0; c < perSkill; c++) out.push(...generateCirclesQuestionSet({ skillId, count: 6 }));
  return out;
}

describe('CirclesQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all circle skills', () => {
    for (const skillId of SKILL_IDS) expect(generateCirclesQuestionSet({ skillId, count: 6 }).length).toBe(6);
  });

  it('computes circumference, area and circle-part answers using the stated π', () => {
    let checked = 0;
    for (const q of questions) {
      const pm = /radius (\d+) cm.*π = (22\/7|3\.14)/.exec(q.prompt);
      if (!pm) continue;
      const r = +pm[1]; const pi = pm[2] === '22/7' ? 22 / 7 : 3.14;
      let exp = null;
      if (/circumference of a circle/.test(q.prompt)) exp = r2(2 * pi * r);
      else if (/area of a circle/.test(q.prompt)) exp = r2(pi * r * r);
      else if (/perimeter of a semicircle/.test(q.prompt)) exp = r2(pi * r + 2 * r);
      else if (/perimeter of a quarter-circle/.test(q.prompt)) exp = r2(2 * pi * r / 4 + 2 * r);
      else if (/area of a semicircle/.test(q.prompt)) exp = r2(pi * r * r / 2);
      else if (/area of a quarter-circle/.test(q.prompt)) exp = r2(pi * r * r / 4);
      if (exp != null) { checked++; expect(Number(dig(q.answer.display)), q.prompt).toBe(exp); }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('semicircle/quarter PERIMETER questions exist and include the straight edge', () => {
    let found = 0;
    for (let c = 0; c < 80; c++) {
      for (const q of generateCirclesQuestionSet({ skillId: 'CI004', count: 6 })) {
        if (/perimeter of a (semicircle|quarter-circle)/.test(q.prompt)) {
          found++;
          expect(q.solutionSteps.join(' ')).toMatch(/straight edge|diameter|2 × radius/);
        }
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('never emits float-garbage (more than 2 d.p.) in answers or choices', () => {
    for (const q of questions) {
      expect(q.answer.display).not.toMatch(/\.\d{3,}/);
      for (const ch of q.choices) expect(ch).not.toMatch(/\.\d{3,}/);
    }
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

  it('is unit-tolerant', () => {
    const [q] = generateCirclesQuestionSet({ skillId: 'CI003', count: 1 });
    expect(checkCirclesAnswer({ question: q, studentResponse: dig(q.answer.display) }).correct).toBe(true);
  });
});
