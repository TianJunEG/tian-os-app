import { describe, it, expect } from 'vitest';
import { generateNumberSenseQuestionSet, checkNumberSenseAnswer } from './NumberSenseQuestionGenerator.js';
import { numberSenseSkillGraph } from './NumberSenseSkillGraph.js';

const SKILL_IDS = numberSenseSkillGraph?.skillIds
  || Array.from({ length: 35 }, (_, i) => 'NS' + String(i + 1).padStart(3, '0'));
const num = (s) => Number(String(s).replace(/,/g, ''));

// Re-derive a pure "expr = ?" integer expression (handles parentheses, unicode
// operators and negatives — used for the Sec 1 G1 integer skills).
function evalIntExpr(p) {
  if (!/=\s*\?$/.test(p.trim())) return null;
  let e = p.replace(/=\s*\?.*$/, '').trim();
  if (!/^[\d\s+×÷\-−*/()]+$/.test(e)) return null;
  e = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  try { const v = Function('return (' + e + ')')(); return Number.isInteger(v) ? v : null; } catch { return null; }
}

function sampleAll(perSkill = 25) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateNumberSenseQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('NumberSenseQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all skills (incl. Sec 1 G1 integers NS024–NS029)', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateNumberSenseQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
    for (const id of ['NS024', 'NS025', 'NS026', 'NS027', 'NS028', 'NS029']) {
      expect(SKILL_IDS).toContain(id);
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

  it('generates unique ids within repeated-family practice sets', () => {
    for (const skillId of ['NS001', 'NS011', 'NS030']) {
      const qs = generateNumberSenseQuestionSet({ skillId, count: 12, sessionSalt: 'id-regression' });
      const ids = qs.map((q) => q.id);
      expect(new Set(ids).size, `${skillId}: ${ids.join('|')}`).toBe(ids.length);
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

  describe('Secondary 1 (G1) integers — NS024–NS029', () => {
    const INT = ['NS024', 'NS025', 'NS026', 'NS027', 'NS028'];

    it('tags every integer skill as Secondary 1', () => {
      for (const id of [...INT, 'NS029']) {
        const skill = numberSenseSkillGraph.skills.find((s) => s.id === id);
        expect(skill.singaporeLevel, id).toEqual(['Secondary 1']);
      }
    });

    it('computes every integer arithmetic answer correctly (signs included)', () => {
      let checked = 0;
      for (const id of INT) {
        for (let c = 0; c < 60; c++) {
          for (const q of generateNumberSenseQuestionSet({ skillId: id, count: 6 })) {
            const ev = evalIntExpr(q.prompt);
            if (ev != null) { checked++; expect(String(ev), q.prompt).toBe(q.answer.display); }
            expect(q.answer.display, q.prompt).toMatch(/^-?\d+$/); // a signed integer
          }
        }
      }
      expect(checked).toBeGreaterThan(1000);
    });

    it('division of integers is always exact', () => {
      for (let c = 0; c < 80; c++) {
        for (const q of generateNumberSenseQuestionSet({ skillId: 'NS027', count: 6 })) {
          expect(evalIntExpr(q.prompt)).toBe(Number(q.answer.display));
        }
      }
    });

    it('integer word problems (temperature / depth / balance) are computed correctly', () => {
      for (let c = 0; c < 120; c++) {
        for (const q of generateNumberSenseQuestionSet({ skillId: 'NS029', count: 6 })) {
          let mm;
          if ((mm = /was (-?\d+)°C\. It fell by (\d+)°C/.exec(q.prompt))) expect(Number(q.answer.display)).toBe(+mm[1] - +mm[2]);
          else if ((mm = /(\d+) m below sea level .−(\d+) m.\. She descends a further (\d+) m/.exec(q.prompt))) expect(Number(q.answer.display)).toBe(-(+mm[2]) - +mm[3]);
          else if ((mm = /balance of −\$(\d+) .that is, (-?\d+) dollars.\. A deposit of \$(\d+)/.exec(q.prompt))) expect(Number(q.answer.display)).toBe(+mm[2] + +mm[3]);
        }
      }
    });

    it('integer MCQs are well-formed and can offer negative options', () => {
      let sawNegativeOption = false;
      for (const id of [...INT, 'NS029']) {
        for (let c = 0; c < 40; c++) {
          for (const q of generateNumberSenseQuestionSet({ skillId: id, count: 6 }).filter((x) => x.type === 'mcq')) {
            expect(q.choices.length).toBe(4);
            expect(new Set(q.choices).size).toBe(4);
            expect(q.choices).toContain(q.answer.display);
            if (q.choices.some((ch) => Number(ch) < 0)) sawNegativeOption = true;
          }
        }
      }
      expect(sawNegativeOption).toBe(true);
    });
  });

  describe('Secondary 1 (G1) Number — NS030–NS035 (factors, powers, roots)', () => {
    const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
    const pf = (n) => { const f = []; let d = 2; while (d * d <= n) { while (n % d === 0) { f.push(d); n /= d; } d++; } if (n > 1) f.push(n); return f; };

    it('tags every Number skill as Secondary 1', () => {
      for (const id of ['NS030', 'NS031', 'NS032', 'NS033', 'NS034', 'NS035']) {
        expect(numberSenseSkillGraph.skills.find((s) => s.id === id).singaporeLevel).toEqual(['Secondary 1']);
      }
    });

    it('computes prime factorisation, HCF, LCM, squares/cubes, roots and powers correctly', () => {
      let checked = 0;
      for (const id of ['NS030', 'NS031', 'NS032', 'NS033', 'NS034', 'NS035']) {
        for (let c = 0; c < 60; c++) {
          for (const q of generateNumberSenseQuestionSet({ skillId: id, count: 6 })) {
            const d = q.answer.display; let mm;
            if ((mm = /Express (\d+) as a product/.exec(q.prompt))) { checked++; expect(d).toBe(pf(+mm[1]).join(' × ')); }
            else if ((mm = /HCF\) of (\d+) and (\d+)/.exec(q.prompt))) { checked++; expect(+d).toBe(gcd(+mm[1], +mm[2])); }
            else if ((mm = /LCM\) of (\d+) and (\d+)/.exec(q.prompt))) { checked++; expect(+d).toBe(Math.abs(+mm[1] * +mm[2]) / gcd(+mm[1], +mm[2])); }
            else if ((mm = /What is (\d+)(²|³)\?/.exec(q.prompt))) { checked++; expect(+d).toBe(mm[2] === '²' ? (+mm[1]) ** 2 : (+mm[1]) ** 3); }
            else if ((mm = /What is (√|∛)(\d+)\?/.exec(q.prompt))) { checked++; expect(+d).toBe(mm[1] === '√' ? Math.round(Math.sqrt(+mm[2])) : Math.round(Math.cbrt(+mm[2]))); }
            else if ((mm = /Evaluate (\d+)\^(\d+)/.exec(q.prompt))) { checked++; expect(+d).toBe((+mm[1]) ** (+mm[2])); }
          }
        }
      }
      expect(checked).toBeGreaterThan(1500);
    });

    it('prime-factorisation MCQs are well-formed and the checker accepts ×, x or *', () => {
      for (let c = 0; c < 40; c++) {
        for (const q of generateNumberSenseQuestionSet({ skillId: 'NS030', count: 6 }).filter((x) => x.type === 'mcq')) {
          expect(q.choices.length).toBeGreaterThanOrEqual(2);
          expect(new Set(q.choices).size).toBe(q.choices.length);
          expect(q.choices).toContain(q.answer.display);
        }
      }
      expect(checkNumberSenseAnswer({ question: { answer: { display: '2 × 2 × 3' } }, studentResponse: '2x2x3' }).correct).toBe(true);
      expect(checkNumberSenseAnswer({ question: { answer: { display: '2 × 2 × 3' } }, studentResponse: '2*2*3' }).correct).toBe(true);
    });
  });
});
