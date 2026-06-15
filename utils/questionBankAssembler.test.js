import { describe, expect, it } from 'vitest';
import { questionsForLevel, sampleByDifficulty, selectQuestionsForLevel, levelOrdinal } from '../services/mathpath/questionBankSelector.js';
import { buildQuestionBank } from '../services/mathpath/blueprintBankAssembler.js';
import { PRESETS, buildPresetBank } from '../services/mathpath/assessmentPresets.js';

// ── unit: level helpers ────────────────────────────────────────────────────────

describe('levelOrdinal', () => {
  it('returns correct ordinals', () => {
    expect(levelOrdinal('Primary 1')).toBe(1);
    expect(levelOrdinal('Primary 6')).toBe(6);
    expect(levelOrdinal('')).toBe(99);
    expect(levelOrdinal('unknown')).toBe(99);
  });
});

describe('questionsForLevel', () => {
  const qs = [
    { questionId: 'a', difficulty: 1, _skillLevel: 'Primary 1' },
    { questionId: 'b', difficulty: 2, _skillLevel: 'Primary 2' },
    { questionId: 'c', difficulty: 2, _skillLevel: 'Primary 3' },
    { questionId: 'd', difficulty: 3, _skillLevel: 'Primary 5' },
    { questionId: 'e', difficulty: 1, _skillLevel: '' },  // unknown level
  ];

  it('includePrior=true keeps all skills up to and including targetLevel', () => {
    const out = questionsForLevel(qs, 'Primary 2', { includePrior: true });
    const ids = out.map((q) => q.questionId);
    expect(ids).toContain('a');   // P1 ≤ P2
    expect(ids).toContain('b');   // P2 = P2
    expect(ids).not.toContain('c');
    expect(ids).not.toContain('d');
    expect(ids).toContain('e');   // unknown → pass through
  });

  it('includePrior=false keeps only exact level matches', () => {
    const out = questionsForLevel(qs, 'Primary 3', { includePrior: false });
    const ids = out.map((q) => q.questionId);
    expect(ids).toContain('c');
    expect(ids).toContain('e');   // unknown → pass through
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('b');
    expect(ids).not.toContain('d');
  });
});

describe('sampleByDifficulty', () => {
  const pool = [
    { questionId: 'e1', difficulty: 1 },
    { questionId: 'e2', difficulty: 1 },
    { questionId: 'm1', difficulty: 2 },
    { questionId: 'm2', difficulty: 2 },
    { questionId: 'h1', difficulty: 3 },
  ];

  it('returns at most count questions', () => {
    const out = sampleByDifficulty(pool, 3);
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it('respects difficultyMix proportions approximately', () => {
    const big = Array.from({ length: 30 }, (_, i) => ({
      questionId: `e${i}`, difficulty: 1,
    })).concat(
      Array.from({ length: 30 }, (_, i) => ({ questionId: `m${i}`, difficulty: 2 })),
    );
    const out = sampleByDifficulty(big, 10, { easy: 70, medium: 30, hard: 0 });
    const nEasy = out.filter((q) => q.difficulty === 1).length;
    expect(nEasy).toBeGreaterThanOrEqual(6);
  });

  it('fills shortfall when a bucket is empty', () => {
    const onlyEasy = [{ questionId: 'e1', difficulty: 1 }, { questionId: 'e2', difficulty: 1 }];
    const out = sampleByDifficulty(onlyEasy, 5, { easy: 20, medium: 60, hard: 20 });
    // only 2 questions available — returns all 2
    expect(out.length).toBe(2);
  });
});

// ── integration: DB-free domains ──────────────────────────────────────────────

describe('selectQuestionsForLevel — whole_numbers (DB-free)', () => {
  it('returns questions filtered to P2 and below', async () => {
    const qs = await selectQuestionsForLevel({
      domainId: 'whole_numbers',
      targetLevel: 'Primary 2',
      count: 6,
      includePrior: true,
    });
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(6);
    for (const q of qs) {
      expect(q).toHaveProperty('stem');
      expect(q).toHaveProperty('answer');
      expect(q).toHaveProperty('skillId');
      if (q._skillLevel && q._skillLevel !== '') {
        expect(levelOrdinal(q._skillLevel)).toBeLessThanOrEqual(levelOrdinal('Primary 2'));
      }
    }
  });

  it('returns no P5 questions when target is P2', async () => {
    const qs = await selectQuestionsForLevel({
      domainId: 'whole_numbers',
      targetLevel: 'Primary 2',
      count: 20,
      includePrior: true,
    });
    const p5 = qs.filter((q) => q._skillLevel === 'Primary 5');
    expect(p5).toHaveLength(0);
  });
});

describe('selectQuestionsForLevel — percentage (DB-free)', () => {
  it('returns percentage questions for P5', async () => {
    const qs = await selectQuestionsForLevel({
      domainId: 'percentage',
      targetLevel: 'Primary 5',
      count: 5,
      includePrior: true,
    });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(typeof q.answer).toBe('string');
      expect(Number(q.answer)).not.toBeNaN();
    }
  });
});

// ── integration: buildQuestionBank ────────────────────────────────────────────

describe('buildQuestionBank', () => {
  it('assembles questions from multiple DB-free domains', async () => {
    const result = await buildQuestionBank({
      title: 'Test Paper',
      level: 'Primary 2',
      topics: [
        { domainId: 'whole_numbers',  count: 5 },
        { domainId: 'four_operations', count: 5 },
      ],
    });
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.meta.title).toBe('Test Paper');
    expect(result.meta.level).toBe('Primary 2');
    expect(result.meta.requested).toBe(10);
    expect(result.meta.domainBreakdown).toHaveProperty('whole_numbers');
    expect(result.meta.domainBreakdown).toHaveProperty('four_operations');
  });

  it('handles unknown domain gracefully (error per topic, not whole-call failure)', async () => {
    const result = await buildQuestionBank({
      level: 'Primary 3',
      topics: [
        { domainId: 'whole_numbers', count: 3 },
        { domainId: 'does_not_exist', count: 3 },
      ],
    });
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.meta.domainBreakdown.does_not_exist.error).toBeTruthy();
    expect(result.meta.domainBreakdown.whole_numbers.error).toBeNull();
  });
});

// ── presets ───────────────────────────────────────────────────────────────────

describe('PRESETS', () => {
  it('exports three named presets', () => {
    expect(Object.keys(PRESETS)).toEqual(
      expect.arrayContaining(['P2_NUMBER_FOUNDATIONS', 'P4_FRACTIONS_TOPICAL', 'P5_PERCENTAGE_EXAM']),
    );
  });
});

describe('buildPresetBank — P2_NUMBER_FOUNDATIONS', () => {
  it('returns ~15 questions across whole_numbers and four_operations', async () => {
    const { questions, meta } = await buildPresetBank('P2_NUMBER_FOUNDATIONS');
    expect(questions.length).toBeGreaterThan(0);
    expect(meta.level).toBe('Primary 2');
    expect(meta.requested).toBe(15);
    expect(meta.domainBreakdown.whole_numbers.count).toBeGreaterThan(0);
    expect(meta.domainBreakdown.four_operations.count).toBeGreaterThan(0);
    // All questions should be at or below P2
    for (const q of questions) {
      if (q._skillLevel && q._skillLevel !== '') {
        expect(levelOrdinal(q._skillLevel)).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('buildPresetBank — P5_PERCENTAGE_EXAM', () => {
  it('returns percentage + ops questions for P5', async () => {
    const { questions, meta } = await buildPresetBank('P5_PERCENTAGE_EXAM');
    expect(questions.length).toBeGreaterThan(0);
    expect(meta.level).toBe('Primary 5');
    expect(meta.requested).toBe(15);
    expect(meta.domainBreakdown.percentage.count).toBeGreaterThan(0);
  });
});

describe('buildPresetBank — unknown key', () => {
  it('throws a helpful error', () => {
    expect(() => buildPresetBank('NOPE')).toThrow(/Unknown assessment preset/);
  });
});
