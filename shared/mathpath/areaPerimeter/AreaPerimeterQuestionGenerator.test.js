import { describe, it, expect } from 'vitest';
import { generateAreaPerimeterQuestionSet, checkAreaPerimeterAnswer } from './AreaPerimeterQuestionGenerator.js';
import { areaPerimeterSkillGraph } from './AreaPerimeterSkillGraph.js';

const SKILL_IDS = areaPerimeterSkillGraph?.skillIds || ['AP001', 'AP002', 'AP003', 'AP004', 'AP005', 'AP006'];
const dig = (s) => s.replace(/cm²|cm2|m²|m2|cm|m|\$/g, '').replace(/[^0-9.\-]/g, '');

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of SKILL_IDS) for (let c = 0; c < perSkill; c++) out.push(...generateAreaPerimeterQuestionSet({ skillId, count: 6 }));
  return out;
}

describe('AreaPerimeterQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all skills (incl. Sec 1 G1 AP007–AP008)', () => {
    for (const skillId of SKILL_IDS) expect(generateAreaPerimeterQuestionSet({ skillId, count: 6 }).length).toBe(6);
  });

  it('computes perimeter, area, triangle and composite answers correctly', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /sides of (\d+) cm.*perimeter/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(4 * +mm[1]); }
      else if ((mm = /(\d+) cm long and (\d+) cm wide.*perimeter/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(2 * (+mm[1] + +mm[2])); }
      else if ((mm = /sides, in order: ([\d ,cm]+) cm\. What is its perimeter/.exec(q.prompt))) { checked++; const sum = mm[1].replace(/cm/g, '').split(',').map(Number).reduce((a, b) => a + b, 0); expect(Number(dig(q.answer.display))).toBe(sum); }
      else if ((mm = /A square has sides of (\d+) cm.*area/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[1]); }
      else if ((mm = /(\d+) cm long and (\d+) cm wide.*area/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2]); }
      else if ((mm = /base of (\d+) cm and a height of (\d+) cm/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] / 2); }
      else if ((mm = /(\d+) cm by (\d+) cm rectangle with a (\d+) cm by (\d+) cm rectangle cut/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] - +mm[3] * +mm[4]); }
    }
    expect(checked).toBeGreaterThan(800);
  });

  it('L-shape perimeter equals the sum of its own printed sides (no contradiction)', () => {
    for (let c = 0; c < 80; c++) {
      for (const q of generateAreaPerimeterQuestionSet({ skillId: 'AP002', count: 6 })) {
        const mm = /sides, in order: ([\d ,cm]+) cm\. What is its perimeter/.exec(q.prompt);
        if (mm) {
          const sum = mm[1].replace(/cm/g, '').split(',').map(Number).reduce((a, b) => a + b, 0);
          expect(Number(dig(q.answer.display))).toBe(sum);
        }
      }
    }
  });

  it('answers carry units and are non-negative; MCQs have 4 distinct choices', () => {
    for (const q of questions) {
      expect(/[a-z²$]/i.test(q.answer.display), q.answer.display).toBe(true);
      expect(Number(dig(q.answer.display))).toBeGreaterThan(0);
      if (q.type === 'mcq') {
        expect(q.choices.length).toBe(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer.display);
      }
    }
  });

  it('writes real worked solutions and emits a figure for every item', () => {
    for (const q of questions) {
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
      expect(q.diagram).toBeTruthy();
    }
  });

  describe('Secondary 1 (G1) — AP007 parallelogram, AP008 trapezium', () => {
    it('tags both skills as Secondary 1', () => {
      for (const id of ['AP007', 'AP008']) {
        expect(areaPerimeterSkillGraph.skills.find((s) => s.id === id).singaporeLevel).toEqual(['Secondary 1']);
      }
    });
    it('computes parallelogram (b×h) and trapezium (½(a+b)h) areas correctly', () => {
      for (let c = 0; c < 80; c++) {
        for (const q of [...generateAreaPerimeterQuestionSet({ skillId: 'AP007', count: 6 }), ...generateAreaPerimeterQuestionSet({ skillId: 'AP008', count: 6 })]) {
          let mm;
          if ((mm = /base of (\d+) cm and a perpendicular height of (\d+) cm/.exec(q.prompt))) expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2]);
          else if ((mm = /parallel sides of (\d+) cm and (\d+) cm, and a height of (\d+) cm/.exec(q.prompt))) expect(Number(dig(q.answer.display))).toBe((+mm[1] + +mm[2]) / 2 * +mm[3]);
          if (q.type === 'mcq') { expect(q.choices.length).toBe(4); expect(new Set(q.choices).size).toBe(4); expect(q.choices).toContain(q.answer.display); }
        }
      }
    });
  });
});
