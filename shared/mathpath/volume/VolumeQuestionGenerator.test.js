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
      else if ((mm = /(\d+) cm by (\d+) cm by (\d+) cm\. What is its volume/.exec(q.prompt))) { checked++; expect(Number(dig(q.answer.display))).toBe(+mm[1] * +mm[2] * +mm[3]); }
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

  it('word-problem families (_003) cycle in at every 3rd position', () => {
    // VL001W: unit cubes arranged L long, W wide and H high
    const vl1 = generateVolumeQuestionSet({ skillId: 'VL001', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(vl1[i].prompt).toMatch(/long.*wide.*high/);
      expect(Number(dig(vl1[i].answer.display))).toBeGreaterThan(0);
    }
    // VL002W: cuboid measures L cm by W cm by H cm
    const vl2 = generateVolumeQuestionSet({ skillId: 'VL002', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(vl2[i].prompt).toMatch(/cm by \d+ cm by/);
      expect(Number(dig(vl2[i].answer.display))).toBeGreaterThan(0);
    }
    // VL003W: net with edges (word problem)
    const vl3 = generateVolumeQuestionSet({ skillId: 'VL003', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(vl3[i].prompt).toMatch(/edges \d+ cm/);
      expect(Number(dig(vl3[i].answer.display))).toBeGreaterThan(0);
    }
    // VL004W: flow rate or water-level context
    const vl4 = generateVolumeQuestionSet({ skillId: 'VL004', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(vl4[i].prompt).toMatch(/litres per minute|base area/i);
      expect(checkVolumeAnswer({ question: vl4[i], studentResponse: vl4[i].answer.display }).correct).toBe(true);
    }
  });

  it('is unit-tolerant', () => {
    const [q] = generateVolumeQuestionSet({ skillId: 'VL002', count: 1 });
    expect(checkVolumeAnswer({ question: q, studentResponse: dig(q.answer.display) }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: q, studentResponse: dig(q.answer.display) + ' cm3' }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: q, studentResponse: String(Number(dig(q.answer.display)) + 1) }).correct).toBe(false);
  });

  it('rejects a wrong-DIMENSION unit even when the digits match', () => {
    // Regression: stripUnits used to remove the unit entirely before comparing
    // digits, so "45 m3" was wrongly accepted for a "45 cm³" key, and "12 cm3"
    // for a "12 cubes" key (VL001, counting unit cubes). A response with NO
    // unit (the common case) must still be accepted, and equivalent spellings
    // of the SAME unit (litre/litres/L) must still match.
    const mk = (display) => ({ answer: { display } });
    expect(checkVolumeAnswer({ question: mk('45 cm³'), studentResponse: '45 m3' }).correct).toBe(false);
    expect(checkVolumeAnswer({ question: mk('12 cubes'), studentResponse: '12 cm3' }).correct).toBe(false);
    expect(checkVolumeAnswer({ question: mk('45 cm³'), studentResponse: '45' }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: mk('18 L'), studentResponse: '18 litres' }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: mk('18 L'), studentResponse: '18 l' }).correct).toBe(true);
    expect(checkVolumeAnswer({ question: mk('18 L'), studentResponse: '18 cm3' }).correct).toBe(false);
  });

  it('rejects a mass unit answered for a volume question (and vice versa)', () => {
    // Supplements the volume-vs-length regression above: a mass unit is
    // dimensionally wrong for either a 3D volume or a capacity (L / ml) key.
    const mk = (display) => ({ answer: { display } });
    expect(checkVolumeAnswer({ question: mk('75 cm³'), studentResponse: '75 kg' }).correct).toBe(false);
    expect(checkVolumeAnswer({ question: mk('32 L'), studentResponse: '32 kg' }).correct).toBe(false);
    // And ASCII "cm3" input still catches the wrong-dimension case (bare-int match).
    expect(checkVolumeAnswer({ question: mk('75 cm³'), studentResponse: '75 cm2' }).correct).toBe(false);
    // ASCII "cm3" typed for a "cm³" key must still pass — canonicalisation regression.
    expect(checkVolumeAnswer({ question: mk('75 cm³'), studentResponse: '75 cm3' }).correct).toBe(true);
  });

  describe('Secondary 1 (G1) — VL005 prism, VL006 surface area', () => {
    it('tags both skills as Secondary 1', () => {
      for (const id of ['VL005', 'VL006']) {
        expect(volumeSkillGraph.skills.find((s) => s.id === id).singaporeLevel).toEqual(['Secondary 1']);
      }
    });
    it('computes triangular-prism volume and cuboid surface area correctly', () => {
      for (let c = 0; c < 80; c++) {
        for (const q of [...generateVolumeQuestionSet({ skillId: 'VL005', count: 6 }), ...generateVolumeQuestionSet({ skillId: 'VL006', count: 6 })]) {
          let mm;
          if ((mm = /base (\d+) cm and height (\d+) cm, and a length of (\d+) cm/.exec(q.prompt))) expect(Number(dig(q.answer.display))).toBe((+mm[1] * +mm[2]) / 2 * +mm[3]);
          else if ((mm = /cuboid measures (\d+) cm by (\d+) cm by (\d+) cm.*surface area/s.exec(q.prompt))) expect(Number(dig(q.answer.display))).toBe(2 * (+mm[1] * +mm[2] + +mm[2] * +mm[3] + +mm[1] * +mm[3]));
          if (q.type === 'mcq') { expect(q.choices.length).toBe(4); expect(new Set(q.choices).size).toBe(4); expect(q.choices).toContain(q.answer.display); }
        }
      }
    });
  });
});
