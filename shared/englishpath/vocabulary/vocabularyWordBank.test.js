import { describe, it, expect } from 'vitest';
import { vocabularyWordBank, wordBankByCluster, getWord } from './vocabularyWordBank.js';
import { normalizeWordEntry, applicableTaskTypes } from './vocabularyModel.js';

describe('vocabulary word bank', () => {
  it('every entry has the fields the generator relies on', () => {
    for (const w of vocabularyWordBank) {
      expect(w.id, `id for ${w.word}`).toBeTruthy();
      expect(w.word).toBeTruthy();
      expect(w.meaning.length, `meaning for ${w.word}`).toBeGreaterThan(5);
      expect(Array.isArray(w.synonyms)).toBe(true);
      expect(Array.isArray(w.confusables)).toBe(true);
      expect(['positive', 'negative', 'neutral']).toContain(w.connotation);
    }
  });

  it('word ids are unique', () => {
    const ids = vocabularyWordBank.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exam-form cloze words carry the blank token in their example', () => {
    const clozeWords = vocabularyWordBank.filter((w) => w.example);
    expect(clozeWords.length).toBeGreaterThan(10);
    for (const w of clozeWords) {
      expect(/_{3,}/.test(w.example), `blank in example for ${w.word}`).toBe(true);
    }
  });

  it('confusables never include the answer itself', () => {
    for (const w of vocabularyWordBank) {
      expect(w.confusables.map((c) => c.toLowerCase())).not.toContain(w.answer.toLowerCase());
    }
  });

  it('groups mutually-confusable words into clusters', () => {
    expect(wordBankByCluster.bring_phrasals.length).toBeGreaterThanOrEqual(2);
    expect(wordBankByCluster.re_lookalikes.map((w) => w.word)).toContain('reluctant');
  });

  it('every entry yields at least the recognition + an exam rung', () => {
    for (const w of vocabularyWordBank) {
      const ids = applicableTaskTypes(w).map((t) => t.id);
      expect(ids, `tasks for ${w.word}`).toContain('meaning_match');
      expect(ids.some((id) => id === 'sentence_cloze' || id === 'cloze_synonym')).toBe(true);
    }
  });

  it('normalizeWordEntry throws on a missing meaning', () => {
    expect(() => normalizeWordEntry({ id: 'x', word: 'x' })).toThrow();
  });

  it('getWord resolves by id', () => {
    expect(getWord('vw_encroachment').word).toBe('encroachment');
    expect(getWord('nope')).toBeNull();
  });
});
