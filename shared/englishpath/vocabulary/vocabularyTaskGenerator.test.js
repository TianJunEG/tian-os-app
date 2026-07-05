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

const norm = (s) => String(s).trim().toLowerCase();

// Function words that don't anchor a cloze on their own (mirrors the generator).
const STOPWORDS = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'and', 'or', 'as']);

describe('vocabulary task generator', () => {
  // Exhaustive: every word (712) × every ladder rung (~26k MCQs). Two speedups vs
  // the old ~17s version: (1) invariant checks run in plain JS with a single expect
  // at the end (not ~5 eager expect() calls per task); (2) the generator now memoises
  // its per-word distractor pools + a word/answer index (see vocabularyTaskGenerator),
  // ~44% faster. The remainder (~6–8s) is irreducible — each MCQ deterministically
  // shuffles a ~700-item distractor pool — so keep a timeout above the default 5s.
  it('builds a fair MCQ for every applicable rung of every word', { timeout: 20000 }, () => {
    const failures = [];
    for (const w of vocabularyWordBank) {
      for (const task of generateLadder(w)) {
        const where = `${w.word}/${task.taskType}`;
        if (task.options.length < 3) failures.push(`${where}: <3 options`);
        if (!exactlyOneCorrect(task)) failures.push(`${where}: not exactly one correct option`);
        const texts = task.options.map((o) => o.text.toLowerCase());
        if (new Set(texts).size !== texts.length) failures.push(`${where}: duplicate options [${texts.join(', ')}]`);
        if (!task.answer) failures.push(`${where}: missing answer`);
        const correct = task.options.find((o) => o.correct);
        if (!correct || correct.text !== task.answer) failures.push(`${where}: correct option "${correct?.text}" !== answer "${task.answer}"`);
        // A "which word belongs to / is the X form of <word>" question must not
        // answer with <word> itself — that word is already named in the prompt.
        if (
          (task.taskType === 'morphology_match' || task.taskType === 'word_form_pick') &&
          norm(task.answer) === norm(w.word)
        ) {
          failures.push(`${where}: answer "${task.answer}" is the headword itself`);
        }
      }
    }
    expect(failures, `${failures.length} bad MCQ(s):\n${failures.slice(0, 20).join('\n')}`).toEqual([]);
  });

  it('skips word-family rungs when every family member is spelled like the headword', () => {
    // "consent" (noun) has only "consent" (verb) in its family — asking which word
    // is in its family (or which is the verb form) would answer "consent" itself.
    const w = getWord('vw_consent');
    expect(w.wordFamily.every((f) => norm(f.word) === norm(w.word))).toBe(true);
    expect(generateTask(w, 'morphology_match', { rng: makeRng(3) })).toBeNull();
    expect(generateTask(w, 'word_form_pick', { rng: makeRng(3) })).toBeNull();
  });

  it('collocation_pick only blanks phrases that keep a distinctive anchor word', () => {
    // "reluctant to" blanks to "____ to" — many words fit (resistant/receptive to),
    // so it must instead use "a reluctant agreement" ("a ____ agreement").
    const w = getWord('vw_reluctant');
    const task = generateTask(w, 'collocation_pick', { rng: makeRng(3) });
    expect(task).not.toBeNull();
    expect(task.prompt).not.toMatch(/________\s+to”/); // never the bare "____ to" cloze
    // the surviving context must contain a content word, not only function words
    const context = task.prompt.split('\n').pop().replace(/[“”]/g, '').replace(/________/, ' ');
    const contentWords = context.split(/[^a-zA-Z]+/).filter((t) => t && !STOPWORDS.has(t.toLowerCase()));
    expect(contentWords.length).toBeGreaterThan(0);
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
