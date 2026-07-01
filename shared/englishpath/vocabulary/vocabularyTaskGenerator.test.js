import { describe, it, expect } from 'vitest';
import { getWord, vocabularyWordBank } from './vocabularyWordBank.js';
import {
  generateTask,
  generateLadder,
  generatableTaskTypes,
  makeRng,
} from './vocabularyTaskGenerator.js';
import { TASK_TYPES } from './vocabularyModel.js';

function exactlyOneCorrect(task) {
  return task.options.filter((o) => o.correct).length === 1;
}

describe('vocabulary task generator', () => {
  it('builds a fair MCQ for every applicable rung of every word', { timeout: 15000 }, () => {
    for (const w of vocabularyWordBank) {
      for (const task of generateLadder(w)) {
        expect(task.options.length, `${w.word}/${task.taskType} option count`).toBeGreaterThanOrEqual(3);
        expect(exactlyOneCorrect(task), `${w.word}/${task.taskType} single answer`).toBe(true);
        // options are distinct (case-insensitive)
        const texts = task.options.map((o) => o.text.toLowerCase());
        expect(new Set(texts).size, `${w.word}/${task.taskType} distinct options`).toBe(texts.length);
        expect(task.answer).toBeTruthy();
        expect(task.options.find((o) => o.correct).text).toBe(task.answer);
      }
    }
  });

  it('meaning_match asks for the meaning and marks the true definition correct', () => {
    const w = getWord('vw_encroachment');
    const task = generateTask(w, 'meaning_match', { rng: makeRng(3) });
    expect(task.prompt).toContain('encroachment');
    expect(task.options.find((o) => o.correct).text).toBe(w.meaning);
  });

  it('sentence_cloze reproduces the exam blank and uses the real distractors', () => {
    const w = getWord('vw_compliant');
    const task = generateTask(w, 'sentence_cloze', { rng: makeRng(5) });
    expect(/_{3,}|________/.test(task.prompt)).toBe(true);
    const optionTexts = task.options.map((o) => o.text);
    // distractors should be drawn from the real exam options
    expect(optionTexts).toContain('compliant');
    expect(optionTexts.some((t) => w.confusables.includes(t))).toBe(true);
  });

  it('cloze_synonym shows the underlined word and answers with a synonym', () => {
    const w = getWord('vw_irrefutably');
    const task = generateTask(w, 'cloze_synonym', { rng: makeRng(9) });
    expect(task.prompt).toContain(`__${w.answer}__`); // underline marker
    expect(w.synonyms).toContain(task.answer);
  });

  it('odd_one_out marks the confusable (not a synonym) as the odd word', () => {
    const w = getWord('vw_reluctant');
    const task = generateTask(w, 'odd_one_out', { rng: makeRng(2) });
    const odd = task.options.find((o) => o.correct).text;
    expect(w.confusables).toContain(odd);
    expect(w.synonyms).not.toContain(odd);
  });

  it('connotation_pick marks the entry connotation correct', () => {
    const w = getWord('vw_disheartened'); // negative
    const task = generateTask(w, 'connotation_pick', {});
    expect(task.options.find((o) => o.correct).text).toBe('Negative');
  });

  it('phrasal verb words generate a phrasal_verb rung; non-phrasal words do not', () => {
    expect(generateTask(getWord('vw_bring_up'), 'phrasal_verb_pick', { rng: makeRng(1) })).not.toBeNull();
    expect(generateTask(getWord('vw_encroachment'), 'phrasal_verb_pick', { rng: makeRng(1) })).toBeNull();
  });

  it('generation is deterministic for a fixed seed', () => {
    const a = generateTask(getWord('vw_facade'), 'synonym_match', { rng: makeRng(42) });
    const b = generateTask(getWord('vw_facade'), 'synonym_match', { rng: makeRng(42) });
    expect(a.options.map((o) => o.text)).toEqual(b.options.map((o) => o.text));
  });

  it('generatableTaskTypes returns rungs in ascending tier order', () => {
    const ids = generatableTaskTypes(getWord('vw_encroachment'));
    const tiers = ids.map((id) => TASK_TYPES.find((t) => t.id === id).tier);
    const sorted = [...tiers].sort((x, y) => x - y);
    expect(tiers).toEqual(sorted);
    expect(ids[0]).toBe('meaning_match'); // tier 1 first
  });
});
