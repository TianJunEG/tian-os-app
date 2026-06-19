import { describe, it, expect } from 'vitest';
import { generateMeasurementQuestionSet, checkMeasurementAnswer } from './MeasurementQuestionGenerator.js';
import { measurementSkillGraph } from './MeasurementSkillGraph.js';

const SKILL_IDS = measurementSkillGraph?.skillIds
  || Array.from({ length: 14 }, (_, i) => 'ME' + String(i + 1).padStart(3, '0'));
const dig = (s) => s.replace(/[^0-9.\-]/g, '');

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateMeasurementQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('MeasurementQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 14 skills', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateMeasurementQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('is not a stub and shows units (or a comparison symbol)', () => {
    for (const q of questions) {
      expect(q.prompt).not.toMatch(/Compute:/);
      const d = q.answer.display;
      const isSymbol = ['<', '>', '='].includes(d);
      const hasUnitOrMoney = /[a-z²³$]/i.test(d);
      expect(isSymbol || hasUnitOrMoney || /^\d{4}$/.test(d), q.prompt + ' => ' + d).toBe(true);
    }
  });

  it('re-derives conversion, perimeter, area, volume and rate answers', () => {
    let checked = 0;
    for (const q of questions) {
      let mm;
      if ((mm = /Convert: (\d+) \w+ = ____ \w+/.exec(q.prompt))) {
        const sm = /1 \w+ = (\d+) \w+/.exec(q.solutionSteps[0]);
        checked++; expect(Number(dig(q.answer.display))).toBe(Number(mm[1]) * Number(sm[1]));
      } else if ((mm = /(\d+) m long and (\d+) m wide.*perimeter/s.exec(q.prompt))) {
        checked++; expect(Number(dig(q.answer.display))).toBe(2 * (Number(mm[1]) + Number(mm[2])));
      } else if ((mm = /(\d+) m long and (\d+) m wide.*area/s.exec(q.prompt))) {
        checked++; expect(Number(dig(q.answer.display))).toBe(Number(mm[1]) * Number(mm[2]));
      } else if ((mm = /(\d+) cm long, (\d+) cm wide and (\d+) cm high/.exec(q.prompt))) {
        checked++; expect(Number(dig(q.answer.display))).toBe(Number(mm[1]) * Number(mm[2]) * Number(mm[3]));
      } else if ((mm = /(\d+) litres per minute.*after (\d+) minutes/s.exec(q.prompt))) {
        checked++; expect(Number(dig(q.answer.display))).toBe(Number(mm[1]) * Number(mm[2]));
      }
    }
    expect(checked).toBeGreaterThan(800);
  });

  it('every MCQ has distinct choices including the answer (≥3)', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(q.choices.length, q.prompt).toBeGreaterThanOrEqual(3);
      expect(new Set(q.choices).size, q.prompt + ' :: ' + q.choices.join('|')).toBe(q.choices.length);
      expect(q.choices, q.prompt).toContain(q.answer.display);
    }
  });

  it('writes real worked solutions (not boilerplate)', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(2);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
    }
  });

  it('emits diagrams for scale reading (ME004) and nets (ME012)', () => {
    for (const q of generateMeasurementQuestionSet({ skillId: 'ME004', count: 2 })) expect(q.diagram?.kind).toBe('scale');
    for (const q of generateMeasurementQuestionSet({ skillId: 'ME012', count: 2 })) expect(q.diagram?.kind).toBe('net');
  });

  it('word-problem families (_003) cycle in at every 3rd position', () => {
    // ME005W and ME006W return 4-digit 24-hr time strings
    const me5 = generateMeasurementQuestionSet({ skillId: 'ME005', count: 9 });
    for (const i of [2, 5, 8]) expect(me5[i].answer.display).toMatch(/^\d{4}$/);
    const me6 = generateMeasurementQuestionSet({ skillId: 'ME006', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(me6[i].answer.display).toMatch(/^\d{4}$/);
      expect(me6[i].prompt).toMatch(/lasts/i);
    }
    // ME013W asks "how many minutes" (inverse rate)
    const me13 = generateMeasurementQuestionSet({ skillId: 'ME013', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(me13[i].prompt).toMatch(/how many minutes/i);
      expect(me13[i].solutionSteps.length).toBeGreaterThanOrEqual(2);
    }
    // ME014W purchases a book and pen → answer starts with $
    const me14 = generateMeasurementQuestionSet({ skillId: 'ME014', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(me14[i].answer.display).toMatch(/^\$/);
      expect(me14[i].prompt).toMatch(/book/i);
    }
    // Remaining _003 families produce positive numeric answers with units
    for (const skillId of ['ME001', 'ME002', 'ME003', 'ME004', 'ME007', 'ME008', 'ME009', 'ME010', 'ME011', 'ME012']) {
      const qs = generateMeasurementQuestionSet({ skillId, count: 9 });
      for (const i of [2, 5, 8]) {
        expect(Number(String(qs[i].answer.display).replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
        expect(qs[i].solutionSteps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('is unit-tolerant: bare number, with-unit and with-$ all accepted', () => {
    const mk = (display) => ({ answer: { display } });
    expect(checkMeasurementAnswer({ question: mk('400 cm'), studentResponse: '400' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('400 cm'), studentResponse: '400cm' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('96 m²'), studentResponse: '96' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('$6.00'), studentResponse: '6' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('$6.00'), studentResponse: '6.00' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('>'), studentResponse: '>' }).correct).toBe(true);
    expect(checkMeasurementAnswer({ question: mk('400 cm'), studentResponse: '401' }).correct).toBe(false);
  });
});
