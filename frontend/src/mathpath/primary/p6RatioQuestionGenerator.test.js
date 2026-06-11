import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p6RatioQuestionGenerator.js';
import { validateP6RatioSkillGraph, p6RatioSkillGraph } from './p6RatioSkillGraph.js';
import { validateP6RatioQuestionFamilies } from './p6RatioQuestionFamilies.js';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p6RatioMisconceptionMap.js';

describe('p6RatioSkillGraph', () => {
  it('validates without errors', () => { const r = validateP6RatioSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p6RatioSkillGraph.skills).toHaveLength(3); });
  it('has correct skill IDs', () => { expect(p6RatioSkillGraph.skillIds).toEqual(['P6-RAT-01', 'P6-RAT-02', 'P6-RAT-03']); });
});

describe('p6RatioQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP6RatioQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p6RatioMisconceptionMap', () => {
  it('has 8 misconceptions', () => { expect(getAllMisconceptions()).toHaveLength(8); });
  it('retrieves by tag', () => {
    expect(getMisconception('simplifies_only_one_term')).not.toBeNull();
    expect(getMisconception('ratio_order_reversed')).not.toBeNull();
    expect(getMisconception('divides_by_wrong_total')).not.toBeNull();
    expect(getMisconception('forgets_ratio_sum')).not.toBeNull();
    expect(getMisconception('before_after_wrong_constant')).not.toBeNull();
    expect(getMisconception('subtracts_ratio_parts')).not.toBeNull();
    expect(getMisconception('confuses_ratio_fraction')).not.toBeNull();
    expect(getMisconception('three_quantity_ratio_error')).not.toBeNull();
  });
  it('returns misconceptions for each skill', () => {
    expect(getMisconceptionsForSkill('P6-RAT-01').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-RAT-02').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-RAT-03').length).toBeGreaterThanOrEqual(1);
  });
});

describe('p6RatioQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P6-RAT-01'); expect(ids).toContain('P6-RAT-02'); expect(ids).toContain('P6-RAT-03'); });

  describe('P6-RAT-01: Equivalent Ratios & Simplification', () => {
    it('generates simplify-ratio (_001) with correct "X : Y" format', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-01', { questionFamilyId: 'QF_P6-RAT-01_001' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.answer).toMatch(/^\d+ : \d+$/);
        expect(q.prompt).toContain('simplest form');
        // Verify the answer is actually in simplest form
        const parts = q.answer.split(' : ').map(Number);
        expect(parts).toHaveLength(2);
        expect(parts[0]).toBeGreaterThanOrEqual(1);
        expect(parts[1]).toBeGreaterThanOrEqual(1);
      }
    });
    it('simplified ratio terms are coprime', () => {
      function computeGcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a; }
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-01', { questionFamilyId: 'QF_P6-RAT-01_001' });
        const parts = q.answer.split(' : ').map(Number);
        expect(computeGcd(parts[0], parts[1])).toBe(1);
      }
    });
    it('generates missing-term (_002) with numeric answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-01', { questionFamilyId: 'QF_P6-RAT-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('?');
      }
    });
    it('missing-term answer is correct via cross-multiplication', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-01', { questionFamilyId: 'QF_P6-RAT-01_002' });
        // Parse: a : b = c : ?
        const m = q.prompt.match(/(\d+) : (\d+) = (\d+) : \?/);
        expect(m).not.toBeNull();
        const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]);
        expect(q.answer).toBe((b * c) / a);
      }
    });
    it('generates three-quantity-ratio (_003) with "X : Y : Z" format', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-01', { questionFamilyId: 'QF_P6-RAT-01_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.answer).toMatch(/^\d+ : \d+ : \d+$/);
        expect(q.prompt).toContain('simplest form');
      }
    });
  });

  describe('P6-RAT-02: Ratio Word Problems', () => {
    it('generates share-in-ratio (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-02', { questionFamilyId: 'QF_P6-RAT-02_001' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('share-in-ratio: answer is divisible correctly', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-02', { questionFamilyId: 'QF_P6-RAT-02_001' });
        // Extract ratio from prompt: "ratio X : Y"
        const ratioMatch = q.prompt.match(/ratio (\d+) : (\d+)/);
        expect(ratioMatch).not.toBeNull();
        const a = Number(ratioMatch[1]), b = Number(ratioMatch[2]);
        // Extract total from prompt
        const totalMatch = q.prompt.match(/(?:share |Share )\$?(\d+)/);
        if (totalMatch) {
          const total = Number(totalMatch[1]);
          expect(total % (a + b)).toBe(0);
          const unitValue = total / (a + b);
          expect(q.answer).toBe(a * unitValue);
        }
      }
    });
    it('generates find-total (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-02', { questionFamilyId: 'QF_P6-RAT-02_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('altogether');
      }
    });
    it('generates ratio-with-total (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-02', { questionFamilyId: 'QF_P6-RAT-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('total');
      }
    });
  });

  describe('P6-RAT-03: Changing Ratios (Before-After)', () => {
    it('generates before-after-spent (_001) with positive answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-03', { questionFamilyId: 'QF_P6-RAT-03_001' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('spent');
      }
    });
    it('before-after-spent: before amount minus spent gives consistent after ratio', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-03', { questionFamilyId: 'QF_P6-RAT-03_001' });
        // Extract: before ratio, spent amount, after ratio
        const beforeMatch = q.prompt.match(/ratio (\d+) : (\d+)/);
        const spentMatch = q.prompt.match(/spent \$(\d+)/);
        const afterMatch = q.prompt.match(/became (\d+) : (\d+)/);
        expect(beforeMatch).not.toBeNull();
        expect(spentMatch).not.toBeNull();
        expect(afterMatch).not.toBeNull();
        const bA = Number(beforeMatch[1]), bB = Number(beforeMatch[2]);
        const spent = Number(spentMatch[1]);
        const aA = Number(afterMatch[1]), aB = Number(afterMatch[2]);
        const beforeTotal = q.answer; // person A's original
        // person B unchanged: bB * k = aB * m
        // person A original = bA * k = answer
        const k = beforeTotal / bA;
        expect(Number.isInteger(k)).toBe(true);
        const personB = bB * k;
        const personAAfter = beforeTotal - spent;
        expect(personAAfter).toBeGreaterThan(0);
        // Check after ratio
        expect(personAAfter / aA).toBe(personB / aB);
      }
    });
    it('generates before-after-received (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-03', { questionFamilyId: 'QF_P6-RAT-03_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('received');
      }
    });
    it('generates before-after-transfer (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-03', { questionFamilyId: 'QF_P6-RAT-03_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain('gave');
      }
    });
    it('before-after-transfer: total stays constant', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-RAT-03', { questionFamilyId: 'QF_P6-RAT-03_003' });
        const beforeMatch = q.prompt.match(/ratio (\d+) : (\d+)/);
        const gaveMatch = q.prompt.match(/gave (\d+)/);
        const afterMatch = q.prompt.match(/became (\d+) : (\d+)/);
        expect(beforeMatch).not.toBeNull();
        expect(gaveMatch).not.toBeNull();
        expect(afterMatch).not.toBeNull();
        const bA = Number(beforeMatch[1]), bB = Number(beforeMatch[2]);
        const gave = Number(gaveMatch[1]);
        const aA = Number(afterMatch[1]), aB = Number(afterMatch[2]);
        const k = q.answer / bA;
        expect(Number.isInteger(k)).toBe(true);
        const beforePersonA = q.answer;
        const beforePersonB = bB * k;
        const totalBefore = beforePersonA + beforePersonB;
        const afterPersonA = beforePersonA - gave;
        const afterPersonB = beforePersonB + gave;
        const totalAfter = afterPersonA + afterPersonB;
        expect(totalBefore).toBe(totalAfter);
        // Check after ratio
        expect(afterPersonA / aA).toBe(afterPersonB / aB);
      }
    });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P6-RAT-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P6-RAT-01', 'P6-RAT-02', 'P6-RAT-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
