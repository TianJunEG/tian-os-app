// EnglishPath · Vocabulary Builder — task generator
// ----------------------------------------------------------------------------
// Turns a single word entry into a concrete, renderable exercise for a given
// task type. Distractors are drawn first from the word's *real exam confusables*
// and synonyms, then padded from the rest of the bank (preferring the same
// theme/part-of-speech) so every option is plausible.
//
// Generation is deterministic given a seeded RNG, so the unit tests are stable
// and a session can be reproduced from a seed.

import {
  TASK_TYPE_BY_ID,
  taskApplies,
  gradedLadder,
} from './vocabularyModel.js';
import { vocabularyWordBank } from './vocabularyWordBank.js';

const BLANK_RE = /_{3,}/;
export const BLANK_DISPLAY = '________';

// ---- deterministic RNG ----------------------------------------------------

/** mulberry32 — small, fast, seedable PRNG returning a float in [0, 1). */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s) => String(s).trim().toLowerCase();

// ---- option assembly ------------------------------------------------------

/**
 * Build a shuffled MCQ option set: one correct answer plus distinct distractors.
 * Distractors are taken from `distractors`, then `padPool` if more are needed.
 * Returns null when fewer than `min` total options can be assembled.
 */
function buildOptions({ correct, distractors = [], padPool = [], rng, min = 4, max = 4 }) {
  const taken = new Set([norm(correct)]);
  const chosen = [];
  for (const d of shuffle(uniqueStrings(distractors), rng)) {
    if (chosen.length >= max - 1) break;
    if (!taken.has(norm(d))) {
      taken.add(norm(d));
      chosen.push(d);
    }
  }
  for (const d of shuffle(uniqueStrings(padPool), rng)) {
    if (chosen.length >= max - 1) break;
    if (!taken.has(norm(d))) {
      taken.add(norm(d));
      chosen.push(d);
    }
  }
  if (chosen.length + 1 < min) return null;
  const options = shuffle([{ text: correct, correct: true }, ...chosen.map((t) => ({ text: t, correct: false }))], rng);
  return options.map((o, i) => ({ id: String(i + 1), text: o.text, correct: o.correct }));
}

function uniqueStrings(list) {
  const seen = new Set();
  const out = [];
  for (const s of list || []) {
    const v = typeof s === 'string' ? s.trim() : '';
    if (v && !seen.has(norm(v))) {
      seen.add(norm(v));
      out.push(v);
    }
  }
  return out;
}

function fillBlank(example, text) {
  return example.replace(BLANK_RE, text);
}

function hasBlank(example) {
  return BLANK_RE.test(example || '');
}

// ---- distractor pools from the wider bank ---------------------------------

function otherWords(entry, bank, { samePos = false } = {}) {
  return bank
    .filter((w) => w.id !== entry.id && (!samePos || w.pos === entry.pos))
    .filter((w) => norm(w.word) !== norm(entry.word));
}

function poolWords(entry, bank, opts) {
  // prefer same-theme words for plausibility, then everything else
  const others = otherWords(entry, bank, opts);
  const sameTheme = others.filter((w) => w.theme === entry.theme).map((w) => w.answer);
  const rest = others.filter((w) => w.theme !== entry.theme).map((w) => w.answer);
  return [...sameTheme, ...rest];
}

function poolMeanings(entry, bank) {
  const others = otherWords(entry, bank);
  const sameTheme = others.filter((w) => w.theme === entry.theme).map((w) => w.meaning);
  const rest = others.filter((w) => w.theme !== entry.theme).map((w) => w.meaning);
  return [...sameTheme, ...rest];
}

// ---- per task-type generators ---------------------------------------------

const GENERATORS = {
  meet_word(entry) {
    return {
      kind: 'teach',
      card: {
        word: entry.word,
        pos: entry.pos,
        meaning: entry.meaning,
        example: hasBlank(entry.example) ? fillBlank(entry.example, entry.answer) : entry.example,
        synonyms: entry.synonyms,
        connotation: entry.connotation,
        mnemonic: entry.mnemonic,
        wordFamily: entry.wordFamily.length
          ? entry.wordFamily.map((f) => `${f.word} (${f.pos})`).join(', ')
          : '',
      },
    };
  },

  meaning_match(entry, bank, rng) {
    const options = buildOptions({ correct: entry.meaning, distractors: poolMeanings(entry, bank), rng });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `What does **${entry.word}** mean?`,
      options,
      rationale: `“${entry.word}” means: ${entry.meaning}`,
    };
  },

  word_recall(entry, bank, rng) {
    const options = buildOptions({
      correct: entry.answer,
      distractors: entry.confusables,
      padPool: poolWords(entry, bank, { samePos: true }),
      rng,
    });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `Which word means: “${entry.meaning}”?`,
      options,
      rationale: `“${entry.answer}” means ${entry.meaning}`,
    };
  },

  synonym_match(entry, bank, rng) {
    if (!entry.synonyms.length) return null;
    const correct = entry.synonyms[0];
    const options = buildOptions({
      correct,
      distractors: entry.confusables,
      padPool: poolWords(entry, bank),
      rng,
    });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `Which word is closest in meaning to **${entry.word}**?`,
      options,
      rationale: `“${entry.word}” means ${entry.meaning}, so it is closest to “${correct}”.`,
    };
  },

  context_infer(entry, bank, rng) {
    if (!entry.example) return null;
    const sentence = hasBlank(entry.example)
      ? fillBlank(entry.example, `**${entry.answer}**`)
      : entry.example.replace(
          new RegExp(`\\b(${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i'),
          '**$1**',
        );
    const confusableMeanings = entry.confusables
      .map((c) => bank.find((w) => norm(w.word) === norm(c) || norm(w.answer) === norm(c)))
      .filter(Boolean)
      .map((w) => w.meaning);
    const options = buildOptions({
      correct: entry.meaning,
      distractors: confusableMeanings,
      padPool: poolMeanings(entry, bank),
      rng,
    });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `What does the bold word most likely mean?\n\n${sentence}`,
      options,
      rationale: `"${entry.word}" means: ${entry.meaning}. The sentence gives clues to its meaning.`,
    };
  },

  morphology_match(entry, bank, rng) {
    if (!entry.wordFamily.length) return null;
    const member = entry.wordFamily[Math.floor(rng() * entry.wordFamily.length)];
    const distractors = [
      ...entry.confusables,
      ...otherWords(entry, bank)
        .filter((w) => !entry.wordFamily.some((f) => norm(f.word) === norm(w.word)))
        .map((w) => w.word),
    ];
    const options = buildOptions({ correct: member.word, distractors, rng });
    if (!options) return null;
    const posLabel = member.pos !== 'other' ? ` (${member.pos})` : '';
    return {
      kind: 'mcq',
      prompt: `Which word belongs to the same word family as **${entry.word}**?`,
      options,
      rationale: `"${member.word}"${posLabel} and "${entry.word}" (${entry.pos}) are in the same word family.`,
    };
  },

  odd_one_out(entry, bank, rng) {
    // The odd word must be a genuine non-synonym, so exclude any confusable that
    // also appears among the synonyms.
    const synSet = new Set(entry.synonyms.map(norm));
    const odd = entry.confusables.find((c) => !synSet.has(norm(c)));
    if (!odd || entry.synonyms.length < 2) return null;
    // three "belong" words: the headword's synonyms (and the headword itself if needed)
    const belong = uniqueStrings([...entry.synonyms, entry.word]).filter((w) => norm(w) !== norm(odd)).slice(0, 3);
    if (belong.length < 3) return null;
    const options = shuffle([{ text: odd, correct: true }, ...belong.map((t) => ({ text: t, correct: false }))], rng).map(
      (o, i) => ({ id: String(i + 1), text: o.text, correct: o.correct })
    );
    return {
      kind: 'mcq',
      prompt: `Three of these words share a similar meaning. Which one does **not** belong?`,
      options,
      rationale: `“${belong.join('”, “')}” all relate to ${entry.meaning} — but “${odd}” does not.`,
    };
  },

  connotation_pick(entry) {
    const labelMap = { positive: 'Positive', negative: 'Negative', neutral: 'Neutral' };
    const options = ['positive', 'negative', 'neutral'].map((c, i) => ({
      id: String(i + 1),
      text: labelMap[c],
      correct: c === entry.connotation,
    }));
    return {
      kind: 'mcq',
      prompt: `What kind of feeling does the word **${entry.word}** give?`,
      options,
      rationale: `“${entry.word}” has a ${entry.connotation} connotation.`,
    };
  },

  nuance_pick(entry, bank, rng) {
    if (!hasBlank(entry.example) || !entry.confusables.length) return null;
    const options = buildOptions({ correct: entry.answer, distractors: entry.confusables, rng, min: 3 });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: entry.example,
      options,
      rationale: `These words are close, but “${entry.answer}” fits because it means ${entry.meaning}.`,
    };
  },

  collocation_pick(entry, bank, rng) {
    const phrase = entry.collocations.find((c) => norm(c).includes(norm(entry.word)));
    if (!phrase) return null;
    const re = new RegExp(entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const blanked = phrase.replace(re, BLANK_DISPLAY);
    const options = buildOptions({
      correct: entry.word,
      distractors: entry.confusables,
      padPool: poolWords(entry, bank, { samePos: true }),
      rng,
    });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `Which word fits this common phrase?\n\n“${blanked}”`,
      options,
      rationale: `“${phrase}” is the natural pairing — these words collocate.`,
    };
  },

  word_form_pick(entry, bank, rng) {
    // Ask for a part-of-speech form that only one family member has, so the
    // answer is unambiguous.
    const candidate = entry.wordFamily.find((f) => f.pos !== entry.pos && f.pos !== 'other');
    if (!candidate) return null;
    const sharesPos = entry.wordFamily.filter((f) => f.pos === candidate.pos).length;
    if (sharesPos !== 1) return null;
    const distractors = [
      entry.word,
      ...entry.wordFamily.filter((f) => f.word !== candidate.word).map((f) => f.word),
      ...entry.confusables,
    ];
    const options = buildOptions({ correct: candidate.word, distractors, rng });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `Which word is the **${candidate.pos}** form in the “${entry.word}” word family?`,
      options,
      rationale: `“${candidate.word}” is the ${candidate.pos}; “${entry.word}” is the ${entry.pos}.`,
    };
  },

  phrasal_verb_pick(entry, bank, rng) {
    if (!entry.isPhrasalVerb || !hasBlank(entry.example)) return null;
    const options = buildOptions({ correct: entry.answer, distractors: entry.confusables, rng, min: 3 });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: entry.example,
      options,
      rationale: `“${entry.answer}” means ${entry.meaning}.`,
    };
  },

  sentence_cloze(entry, bank, rng) {
    if (!hasBlank(entry.example)) return null;
    const options = buildOptions({
      correct: entry.answer,
      distractors: entry.confusables,
      padPool: poolWords(entry, bank, { samePos: true }),
      rng,
    });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: entry.example,
      options,
      rationale: `“${entry.answer}” best fits because it means ${entry.meaning}.`,
    };
  },

  cloze_synonym(entry, bank, rng) {
    if (!hasBlank(entry.example) || !entry.synonyms.length) return null;
    const correct = entry.synonyms[0];
    const sentence = fillBlank(entry.example, `__${entry.answer}__`); // __word__ = underline marker for the UI
    const options = buildOptions({ correct, distractors: entry.confusables, padPool: poolWords(entry, bank), rng });
    if (!options) return null;
    return {
      kind: 'mcq',
      prompt: `Choose the word closest in meaning to the underlined word.\n\n${sentence}`,
      options,
      rationale: `“${entry.answer}” means ${entry.meaning}, so it is closest to “${correct}”.`,
    };
  },
};

/**
 * Generate a single task for an entry + task type. Returns null when the task
 * does not apply or there are not enough distractors to make a fair question.
 */
export function generateTask(entry, taskTypeId, { bank = vocabularyWordBank, rng = makeRng(1) } = {}) {
  const taskType = TASK_TYPE_BY_ID[taskTypeId];
  if (!taskType) throw new Error(`Unknown task type: ${taskTypeId}`);
  if (!taskApplies(taskType, entry)) return null;
  const gen = GENERATORS[taskTypeId];
  if (!gen) return null;
  const body = gen(entry, bank, rng);
  if (!body) return null;
  return {
    id: `${entry.id}::${taskTypeId}`,
    taskType: taskTypeId,
    label: taskType.label,
    tier: taskType.tier,
    instruction: taskType.instruction,
    examSection: taskType.examSection,
    subskills: taskType.subskills,
    wordId: entry.id,
    word: entry.word,
    ...body,
    answer: body.kind === 'mcq' ? body.options.find((o) => o.correct)?.text : entry.answer,
  };
}

/** Every graded task that can be built for an entry, in ladder (tier) order. */
export function generateLadder(entry, { bank = vocabularyWordBank, rng = makeRng(1) } = {}) {
  return gradedLadder(entry)
    .map((t) => generateTask(entry, t.id, { bank, rng }))
    .filter(Boolean);
}

/**
 * The graded task-type ids that actually produce a question for this entry
 * (some rungs need ≥2 distractors and are skipped when the word lacks them),
 * in ladder (tier) order. The adaptive engine uses this as the authoritative
 * "ladder" for a word so progression never stalls on an un-buildable rung.
 */
export function generatableTaskTypes(entry, { bank = vocabularyWordBank } = {}) {
  return gradedLadder(entry)
    .filter((t) => generateTask(entry, t.id, { bank, rng: makeRng(7) }) != null)
    .map((t) => t.id);
}
