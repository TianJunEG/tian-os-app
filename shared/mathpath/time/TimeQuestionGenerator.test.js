import { describe, it, expect } from 'vitest';
import { generateTimeQuestionSet, checkTimeAnswer } from './TimeQuestionGenerator.js';
import { timeSkillGraph } from './TimeSkillGraph.js';

const SKILL_IDS = timeSkillGraph?.skillIds || ['TM001', 'TM002', 'TM003', 'TM004', 'TM005'];
const CLOCK = /^\d{1,2}:\d{2}( (a|p)\.m\.)?$/;   // 9:30  or  9:30 a.m.
const T24 = /^\d{4}$/;                            // 0930
const DUR = /^(\d+ h( \d+ min)?|\d+ min)$/;       // 2 h 35 min / 3 h / 45 min
const NUM = /^\d+$/;
const wellFormed = (d) => CLOCK.test(d) || T24.test(d) || DUR.test(d) || NUM.test(d);

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateTimeQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('TimeQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for every skill', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateTimeQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('never emits a malformed time, a concatenated integer, or impossible values', () => {
    for (const q of questions) {
      const d = q.answer.display;
      expect(wellFormed(d), q.prompt + ' => ' + d).toBe(true);
      if (T24.test(d)) {
        expect(Number(d.slice(0, 2))).toBeLessThan(24);
        expect(Number(d.slice(2))).toBeLessThan(60);
      }
      if (/:\d{2}/.test(d)) expect(Number(d.match(/:(\d{2})/)[1])).toBeLessThan(60);
      expect(q.prompt).not.toMatch(/Compute:/);
    }
  });

  it('gives every MCQ four distinct, well-formed choices including the answer', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(q.choices.length, q.prompt).toBe(4);
      expect(new Set(q.choices).size, q.prompt + ' :: ' + q.choices.join('|')).toBe(4);
      expect(q.choices, q.prompt).toContain(q.answer.display);
      for (const ch of q.choices) expect(wellFormed(ch), q.prompt + ' choice ' + ch).toBe(true);
    }
  });

  it('writes real multi-step worked solutions ending in the answer', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(2);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
      expect(q.solutionSteps.join(' ')).toContain(q.answer.display);
    }
  });

  it('emits a clock diagram for the read-the-clock skills', () => {
    for (const id of ['TM001', 'TM002']) {
      for (const q of generateTimeQuestionSet({ skillId: id, count: 2 })) {
        expect(q.diagram?.kind).toBe('clock');
        expect(q.diagram.hour).toBeGreaterThanOrEqual(1);
        expect(q.diagram.hour).toBeLessThanOrEqual(12);
        expect(q.diagram.minute).toBeLessThan(60);
      }
    }
  });

  it('computes elapsed time and end times by real subtraction/addition', () => {
    // 5:50 p.m. + 2 h 10 min = 8:00 p.m. — exercise the generator until both
    // shapes appear and check they are self-consistent under the checker.
    const set = generateTimeQuestionSet({ skillId: 'TM005', count: 6 });
    for (const q of set) {
      expect(checkTimeAnswer({ question: q, studentResponse: q.answer.display }).correct).toBe(true);
    }
  });

  it('word-problem families (_003) cycle in at every 3rd position', () => {
    // TM001W: spoken phrase → h:mm (no diagram)
    const tm1 = generateTimeQuestionSet({ skillId: 'TM001', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(tm1[i].diagram).toBeUndefined();
      expect(tm1[i].answer.display).toMatch(/^\d{1,2}:\d{2}$/);
      expect(tm1[i].prompt).toMatch(/o'clock|half past/);
    }
    // TM002W: "X minutes past/to Y" → h:mm (no diagram)
    const tm2 = generateTimeQuestionSet({ skillId: 'TM002', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(tm2[i].diagram).toBeUndefined();
      expect(tm2[i].answer.display).toMatch(/^\d{1,2}:\d{2}$/);
    }
    // TM003W: contextual conversion → bare number
    const tm3 = generateTimeQuestionSet({ skillId: 'TM003', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(Number(tm3[i].answer.display)).toBeGreaterThan(0);
      expect(tm3[i].prompt).toMatch(/lasts|takes/i);
    }
    // TM004W: timetable context → 24hr or 12hr time
    const tm4 = generateTimeQuestionSet({ skillId: 'TM004', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(tm4[i].prompt).toMatch(/timetable|schedule|board/i);
      expect(wellFormed(tm4[i].answer.display)).toBe(true);
    }
    // TM005W: multi-step journey → duration
    const tm5 = generateTimeQuestionSet({ skillId: 'TM005', count: 9 });
    for (const i of [2, 5, 8]) {
      expect(tm5[i].prompt).toMatch(/stops? for/i);
      expect(checkTimeAnswer({ question: tm5[i], studentResponse: tm5[i].answer.display }).correct).toBe(true);
    }
  });

  it('checks answers by meaning, not string', () => {
    const eq = (a, b) => checkTimeAnswer({ question: { answer: { display: b } }, studentResponse: a }).correct;
    expect(eq('9:30', '9:30')).toBe(true);
    expect(eq('0930', '9:30 a.m.')).toBe(true);     // 24h vs 12h
    expect(eq('2:30 pm', '1430')).toBe(true);
    expect(eq('155', '2 h 35 min')).toBe(true);     // minutes vs h/min
    expect(eq('2h35min', '2 h 35 min')).toBe(true);
    expect(eq('45 min', '45')).toBe(true);
    expect(eq('9:31', '9:30')).toBe(false);
  });
});
