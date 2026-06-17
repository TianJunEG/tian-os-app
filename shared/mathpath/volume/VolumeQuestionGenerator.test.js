import { describe, it, expect } from 'vitest';
import { generateVolumeQuestionSet, checkVolumeAnswer } from './VolumeQuestionGenerator.js';
import { volumeSkillGraph } from './VolumeSkillGraph.js';

const SKILL_IDS = volumeSkillGraph?.skillIds || ['VL001', 'VL002', 'VL003', 'VL004'];
const dig = (s) => s.replace(/[^0-9.\-]/g, '');

function sampleAll(perSkill = 50) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateVolumeQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('VolumeQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all volume skills', () => {
    for (const skillId of SKILL_IDS) expect(generateVolumeQuestionSet({ skillId, count: 6 }).length).toBe(6);
  });

  it('computes volume / level / rate correctly and shows units', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /(\d+) long, (\d+) wide and (\d+) high/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] * +mm[3]); }
      else if ((mm = /(\d+) cm by (\d+) cm by (\d+) cm/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] * +mm[3]); }
      else if ((mm = /edges (\d+) cm, (\d+) cm and (\d+) cm/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] * +mm[3]); }
      else if ((mm = /at (\d+) litres per minute.*after (\d+) minutes/s.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2]); }
      else if ((mm = /base area of (\d+) cm². (\d+) cm³/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[2] / +mm[1]); }
      expect(/[a-z³²]/i.test(q.answer.display), q.answer.display).toBe(true); // carries a unit word
    }
    expect(checked).toBeGreaterThan(800);
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

  it('emits cuboid / unit-cube / net diagrams', () => {
    expect(generateVolumeQuestionSet({ skillId: 'VL001', count: 1 })[0].diagram?.kind).toBe('unit-cubes');
    expect(generateVolumeQuestionSet({ skillId: 'VL002', count: 1 })[0].diagram?.kind).toBe('cuboid');
    expect(generateVolumeQuestionSet({ skillId: 'VL003', count: 1 })[0].diagram?.kind).toBe('net');
  });

  it('is unit-tolerant', () => {
    const [q] = generateVolumeQuestionSet({ skillId: 'VL002', count: 1 });
    expect(checkVolumeAnswer({ question: q, studentResponse: dig(q.answer.display) }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: q, studentResponse: dig(q.answer.display) + ' cm3' }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: q, studentResponse: String(Number(dig(q.answer.display)) + 1) }).correct).toBe(false);
  });
});
