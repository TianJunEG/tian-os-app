import { describe, it, expect } from 'vitest';
import { generateGeometryQuestionSet, checkGeometryAnswer } from './GeometryQuestionGenerator.js';
import { geometrySkillGraph } from './GeometrySkillGraph.js';

const SKILL_IDS = geometrySkillGraph?.skillIds
  || Array.from({ length: 22 }, (_, i) => 'GE' + String(i + 1).padStart(3, '0'));
const POLY = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const dig = (s) => s.replace(/[^0-9.\-]/g, '');

function sampleAll(perSkill = 25) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateGeometryQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('GeometryQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 22 skills', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateGeometryQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('is not a stub — no "Compute: a + b"; both numeric and word answers appear', () => {
    let word = false, numeric = false;
    for (const q of questions) {
      expect(q.prompt).not.toMatch(/Compute:/);
      if (/^[a-z]/i.test(q.answer.display)) word = true;
      if (/\d/.test(q.answer.display)) numeric = true;
    }
    expect(word).toBe(true);
    expect(numeric).toBe(true);
  });

  it('computes geometric answers correctly (sides, angles, perimeter, area, circles)', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /How many sides does a (\w+) have/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(POLY[mm[1]]); }
      else if ((mm = /angles of a triangle are (\d+)° and (\d+)°/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(180 - +mm[1] - +mm[2]); }
      else if ((mm = /add up to (180|360)°\. One angle is (\d+)°/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] - +mm[2]); }
      else if ((mm = /sides of (\d+) cm.*perimeter/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(4 * +mm[1]); }
      else if ((mm = /(\d+) cm long and (\d+) cm wide\. What is its area/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2]); }
      else if ((mm = /base (\d+) cm and height (\d+) cm/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe((+mm[1] * +mm[2]) / 2); }
      else if ((mm = /circumference of a circle with radius (\d+)/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(Math.round(2 * 3.14 * +mm[1] * 100) / 100); }
      else if ((mm = /perimeter of a semicircle with radius (\d+)/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(Math.round((3.14 * +mm[1] + 2 * +mm[1]) * 100) / 100); }
    }
    expect(checked).toBeGreaterThan(800);
  });

  it('triangle third angles and angles-on-a-line are always positive', () => {
    for (const id of ['GE006', 'GE008']) {
      for (let c = 0; c < 60; c++) {
        for (const q of generateGeometryQuestionSet({ skillId: id, count: 6 })) {
          expect(Number(dig(q.answer.display))).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every MCQ has distinct choices including the answer (≥2)', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(q.choices.length, q.prompt).toBeGreaterThanOrEqual(2);
      expect(new Set(q.choices).size, q.prompt + ' :: ' + q.choices.join('|')).toBe(q.choices.length);
      expect(q.choices, q.prompt).toContain(q.answer.display);
    }
  });

  it('writes real worked solutions and emits figures for visual skills', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(1);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
    }
    for (const id of ['GE004', 'GE008', 'GE018', 'GE020']) {
      for (const q of generateGeometryQuestionSet({ skillId: id, count: 2 })) expect(q.diagram).toBeTruthy();
    }
  });

  it('checker handles words and units, and rejects wrong answers', () => {
    const mk = (display) => ({ answer: { display } });
    expect(checkGeometryAnswer({ question: mk('acute'), studentResponse: 'acute angle' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: mk('parallel'), studentResponse: 'Parallel' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: mk('36 cm'), studentResponse: '36' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: mk('37.68 cm'), studentResponse: '37.68' }).correct).toBe(true);
    expect(checkGeometryAnswer({ question: mk('acute'), studentResponse: 'obtuse' }).correct).toBe(false);
  });
});
