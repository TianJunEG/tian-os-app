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

const norm = (s) => String(s).trim().toLowerCase();

// Function words that don't anchor a cloze on their own (mirrors the generator).
const STOPWORDS = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'and', 'or', 'as']);

describe('vocabulary task generator', () => {
  // Exhaustive: every word (~2.1k) × every ladder rung (~26k MCQs). Speedups vs the
  // old version: (1) invariant checks run in plain JS with a single expect at the end
  // (not ~5 eager expect() calls per task); (2) the generator memoises its per-word
  // distractor pools + a word/answer index; (3) each MCQ draws only the ~3 distractors
  // it needs with a partial Fisher–Yates instead of shuffling the whole ~2k-item pool
  // (see buildOptions/drawFromPool) — the pool tripled with the bank and a full shuffle
  // per rung had pushed this past the old 20s CI budget. Keep a timeout above the
  // default 5s for slower CI hardware.
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

  it('word-family rungs never answer with a word shown inside a multi-word headword', () => {
    // Regression: idioms / phrasal verbs / similes like "boost morale" or
    // "as fast as lightning" have a family member ("boost", "fast") that is one of
    // the words already printed in the prompt — so the answer was in plain sight.
    const byWord = (w) => vocabularyWordBank.find((e) => e.word === w);
    for (const headword of ['boost morale', 'as fast as lightning', 'phase out']) {
      const w = byWord(headword);
      if (!w) continue;
      for (const tt of ['morphology_match', 'word_form_pick']) {
        const task = generateTask(w, tt, { rng: makeRng(4) });
        if (!task) continue; // skipping is a valid outcome
        const correct = task.options.find((o) => o.correct).text;
        expect(new RegExp(`\\b${correct}\\b`, 'i').test(headword), `${headword}/${tt}`).toBe(false);
      }
    }
  });

  it('word_recall is skipped when the clue names the answer word', () => {
    // "as hungry as a fox" is the clue AND names "fox"; "aid" is glossed with its
    // answer word ("help") — neither makes a fair "which word means…?" question.
    for (const headword of ['fox', 'aid']) {
      const w = vocabularyWordBank.find((e) => e.word === headword);
      if (!w) continue;
      expect(generateTask(w, 'word_recall', { rng: makeRng(4) }), headword).toBeNull();
    }
  });

  it('cloze_synonym never uses a synonym that is already in the sentence', () => {
    const rng = makeRng(9);
    let checked = 0;
    for (const w of vocabularyWordBank) {
      const task = generateTask(w, 'cloze_synonym', { bank: vocabularyWordBank, rng });
      if (!task) continue;
      checked++;
      const correct = task.options.find((o) => o.correct).text;
      const sentence = task.prompt.replace(/__.*?__/, ' '); // drop the underlined answer
      expect(new RegExp(`\\b${correct}\\b`, 'i').test(sentence), `cloze_synonym "${w.word}" -> "${correct}"`).toBe(false);
    }
    expect(checked).toBeGreaterThan(100);
  });

  // A word-valued correct answer must never be visible in its own prompt. Excludes
  // the task types where the headword is shown on purpose (the correct option is a
  // meaning or label, or — for collocation_natural — every option contains it).
  it('never reveals a word answer inside its own prompt', () => {
    const HIDDEN = new Set([
      'word_recall', 'synonym_match', 'morphology_match', 'collocation_pick',
      'word_form_pick', 'cloze_synonym', 'sentence_cloze', 'nuance_pick',
      'phrasal_verb_pick', 'odd_one_out',
    ]);
    const failures = [];
    for (const w of vocabularyWordBank) {
      for (const task of generateLadder(w)) {
        if (task.kind !== 'mcq' || !HIDDEN.has(task.taskType)) continue;
        const correct = task.options.find((o) => o.correct)?.text;
        if (!correct) continue;
        // For cloze_synonym the answer word is underlined on purpose; the correct
        // option is a SYNONYM, so drop the underlined span before checking.
        const prompt = task.prompt.replace(/__.*?__/g, ' ').replace(/_{3,}|________/g, ' ').replace(/[*]/g, '');
        if (new RegExp(`(^|[^a-z])${correct.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(prompt)) {
          failures.push(`${w.word}/${task.taskType}: "${correct}" in prompt`);
        }
      }
    }
    expect(failures, `${failures.length} answer leak(s):\n${failures.slice(0, 20).join('\n')}`).toEqual([]);
  });
});
