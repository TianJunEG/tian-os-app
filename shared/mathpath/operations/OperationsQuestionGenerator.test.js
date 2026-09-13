import { describe, it, expect } from 'vitest';
import { generateOperationsQuestionSet, checkOperationsAnswer } from './OperationsQuestionGenerator.js';
import { operationsSkillGraph } from './OperationsSkillGraph.js';

const SKILL_IDS = operationsSkillGraph?.skillIds
  || Array.from({ length: 24 }, (_, i) => 'OP' + String(i + 1).padStart(3, '0'));

// Re-derive the answer for a pure "expr = ?" arithmetic prompt (respects × ÷
// before + −, and brackets, via JS precedence).
function evalExpr(p) {
  if (!/=\s*\?$/.test(p.trim())) return null;
  let e = p.replace(/=\s*\?.*$/, '').trim();
  if (!/^[\d\s+×÷\-−*()]+$/.test(e)) return null;
  e = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  try { const v = Function('return (' + e + ')')(); return Number.isInteger(v) ? v : null; } catch { return null; }
}

function sampleAll(perSkill = 30) {
  const out = [];
  for (const skillId of SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) out.push(...generateOperationsQuestionSet({ skillId, count: 6 }));
  }
  return out;
}

describe('OperationsQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 24 skills', () => {
    for (const skillId of SKILL_IDS) {
      expect(generateOperationsQuestionSet({ skillId, count: 6 }).length).toBe(6);
    }
  });

  it('is not a stub — no "Compute: a + b" prompts; answers are non-negative numbers', () => {
    let nonAdditionSeen = false;
    for (const q of questions) {
      expect(q.prompt).not.toMatch(/Compute:/);
      // Integers, or a 2-d.p. decimal for the decimal-division questions (OP014).
      expect(q.answer.display, q.prompt).toMatch(/^\d+(\.\d+)?$/);
      if (!/\+/.test(q.prompt) || /[×÷−-]/.test(q.prompt)) nonAdditionSeen = true;
    }
    expect(nonAdditionSeen).toBe(true); // proves subtraction/×/÷ actually appear
  });

  it('computes every parseable arithmetic answer correctly', () => {
    let checked = 0;
    for (const q of questions) {
      const ev = evalExpr(q.prompt);
      if (ev != null) { checked++; expect(String(ev), q.prompt).toBe(q.answer.display); }
    }
    expect(checked).toBeGreaterThan(1000); // a large share are directly verifiable
  });

  it('respects order of operations (OP019) and brackets (OP020)', () => {
    for (const q of generateOperationsQuestionSet({ skillId: 'OP019', count: 6 })) {
      expect(evalExpr(q.prompt)).toBe(Number(q.answer.display));
    }
    for (const q of generateOperationsQuestionSet({ skillId: 'OP020', count: 6 })) {
      expect(evalExpr(q.prompt)).toBe(Number(q.answer.display));
    }
  });

  it('gives every MCQ four distinct, positive, well-formed choices including the answer', () => {
    for (const q of questions.filter((x) => x.type === 'mcq')) {
      expect(q.choices.length, q.prompt).toBe(4);
      expect(new Set(q.choices).size, q.prompt + ' :: ' + q.choices.join('|')).toBe(4);
      expect(q.choices, q.prompt).toContain(q.answer.display);
      for (const ch of q.choices) {
        expect(ch, q.prompt).toMatch(/^\d+(\.\d+)?$/); // integer or decimal (OP014 2-d.p. division)
        expect(Number(ch)).toBeGreaterThan(0);
      }
    }
  });

  it('generates unique ids within repeated-family practice sets', () => {
    for (const skillId of ['OP001', 'OP019', 'OP024']) {
      const qs = generateOperationsQuestionSet({ skillId, count: 12, sessionSalt: 'id-regression' });
      const ids = qs.map((q) => q.id);
      expect(new Set(ids).size, `${skillId}: ${ids.join('|')}`).toBe(ids.length);
    }
  });

  it('writes real worked solutions (not boilerplate)', () => {
    for (const q of questions) {
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(2);
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
    }
  });

  it('emits a bar-model diagram for model drawing (OP023)', () => {
    for (const q of generateOperationsQuestionSet({ skillId: 'OP023', count: 4 })) {
      expect(q.diagram?.kind).toBe('bar-model');
    }
  });

  it('division-with-remainder (OP015) always has a non-zero remainder answer', () => {
    for (let c = 0; c < 40; c++) {
      for (const q of generateOperationsQuestionSet({ skillId: 'OP015', count: 6 })) {
        expect(Number(q.answer.display)).toBeGreaterThan(0);
      }
    }
  });

  it('accepts comma-grouped and self answers', () => {
    const [q] = generateOperationsQuestionSet({ skillId: 'OP004', count: 1 });
    const d = q.answer.display;
    expect(checkOperationsAnswer({ question: q, studentResponse: d }).correct).toBe(true);
    const withComma = Number(d).toLocaleString('en-US');
    expect(checkOperationsAnswer({ question: q, studentResponse: withComma }).correct).toBe(true);
    expect(checkOperationsAnswer({ question: q, studentResponse: String(Number(d) + 1) }).correct).toBe(false);
  });
});
