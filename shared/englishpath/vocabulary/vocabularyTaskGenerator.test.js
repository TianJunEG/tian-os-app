import { describe, it, expect } from 'vitest';
import { getWord, vocabularyWordBank } from './vocabularyWordBank.js';
import {
  generateTask,
  generateLadder,
  generatableTaskTypes,
  glossFor,
  makeRng,
} from './vocabularyTaskGenerator.js';
import { TASK_TYPES } from './vocabularyModel.js';

function exactlyOneCorrect(task) {
  return task.options.filter((o) => o.correct).length === 1;
}

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
      }
    }
    expect(failures, `${failures.length} bad MCQ(s):\n${failures.slice(0, 20).join('\n')}`).toEqual([]);
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

  it('never offers the question word itself as the "same word family" answer', () => {
    // Regression: words like "consent" (verb) / "consent" (noun) have a same-
    // spelling family member, which used to surface as the correct option — so
    // the answer was literally the word being asked about.
    const n = (s) => String(s).trim().toLowerCase();
    const rng = makeRng(7);
    let checked = 0;
    for (const w of vocabularyWordBank) {
      const task = generateTask(w, 'morphology_match', { bank: vocabularyWordBank, rng });
      if (!task) continue;
      checked++;
      const correct = task.options.find((o) => o.correct);
      expect(n(correct.text), `morphology answer for "${w.word}"`).not.toBe(n(w.word));
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('word-option questions carry a meaning gloss on every option (to teach the distractors too)', () => {
    // A student often misses because they don't know the DISTRACTORS. word_recall
    // options are words, so each should reveal its meaning.
    const task = generateTask(getWord('vw_encroachment'), 'word_recall', { rng: makeRng(3) });
    expect(task.options.every((o) => typeof o.gloss === 'string' && o.gloss.length > 3)).toBe(true);
    // ...and glossFor resolves both a taught headword and an untaught distractor.
    expect(glossFor('encroachment')).toBeTruthy();
    expect(glossFor('insight')).toBeTruthy(); // an untaught distractor, from the glossary
    expect(glossFor('this is a full sentence, not a word')).toBeNull();
  });

  it('meaning-option questions do NOT gloss options (they are already meanings)', () => {
    const task = generateTask(getWord('vw_encroachment'), 'meaning_match', { rng: makeRng(3) });
    expect(task.options.every((o) => o.gloss === undefined)).toBe(true);
  });

  it('collocation_pick never leaves only a function word as the phrase stem', () => {
    // Regression: "____ to" (a preposition-only stem) is filled equally well by
    // near-synonyms — reluctant / resistant / receptive to — so it isn't a fair
    // single-answer question.
    const FW = new Set([
      'to', 'of', 'on', 'in', 'with', 'for', 'at', 'by', 'a', 'an', 'the', 'and', 'or',
      'up', 'off', 'out', 'as', 'into', 'from', 'over', 'about', 'that', 'this',
      'his', 'her', 'its', 'their', 'your', 'my', 'our', 'is', 'was', 'be', 'been',
      'so', 'than', 'too', 'it', 'them', 'you',
    ]);
    const rng = makeRng(9);
    let checked = 0;
    for (const w of vocabularyWordBank) {
      const task = generateTask(w, 'collocation_pick', { bank: vocabularyWordBank, rng });
      if (!task) continue;
      checked++;
      const stem = (task.prompt.match(/“([\s\S]+)”/) || [])[1] || '';
      const content = stem.replace(/_+/g, ' ').toLowerCase().split(/[^a-z]+/).filter(Boolean);
      expect(
        content.some((t) => !FW.has(t)),
        `collocation stem for "${w.word}": "${stem.trim()}"`
      ).toBe(true);
    }
    expect(checked).toBeGreaterThan(100);
  });
});
