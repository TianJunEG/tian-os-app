// EnglishPath · Vocabulary Builder — domain model
// ----------------------------------------------------------------------------
// The P6 (PSLE) English paper has three vocabulary-heavy sections that students
// routinely lose marks on for one root reason: they do not know what the words
// mean. The distractors in those sections are almost always *near-synonyms* or
// *look/sound-alikes*, so a shallow "seen it once" knowledge of a word is not
// enough — the student has to know its precise sense, its feel (connotation),
// the words it pairs with (collocation) and the words it is easily confused
// with.
//
// This module models a single target word as a rich entry, and defines the
// scaffold of small tasks that takes a student from "never met this word" all
// the way up to the exam-form question. The adaptive engine sequences these
// tasks per word with spaced repetition; the generator turns an entry + a task
// type into a concrete, renderable exercise.
//
// Everything here is framework-agnostic and side-effect free so it can be unit
// tested on the backend and imported by the React UI later (the MathPath
// domains follow the same shared/-engine convention).

/**
 * The depth-of-knowledge sub-skills a strong vocabulary learner has for a word.
 * A word is only "exam ready" once the higher sub-skills are secure, not just
 * the surface meaning.
 */
export const VOCAB_SUBSKILLS = {
  MEANING: 'meaning', // knows the core, kid-friendly definition
  SYNONYM: 'synonym', // can match the word to a close synonym (Vocab Cloze)
  NUANCE: 'nuance', // discriminates near-synonyms by their precise sense
  CONNOTATION: 'connotation', // feels whether it is positive / negative / neutral
  COLLOCATION: 'collocation', // knows the words it naturally pairs with
  PHRASAL_VERB: 'phrasal_verb', // handles multi-word verbs (bring up, keep up with)
  WORD_FORM: 'word_form', // picks the right part-of-speech form (encroach / encroachment)
  CONFUSABLE: 'confusable', // tells apart look-alike / sound-alike words
};

export const VOCAB_SUBSKILL_LIST = Object.values(VOCAB_SUBSKILLS);

/** The exam sections each task ultimately builds toward. */
export const VOCAB_EXAM_SECTIONS = {
  VOCAB_MCQ: 'vocab_mcq', // Booklet A: pick the best word for a single-sentence blank
  VOCAB_CLOZE: 'vocab_cloze', // Section C: pick the word "closest in meaning" to an underlined word
  COMPREHENSION_CLOZE: 'comprehension_cloze', // Booklet B: open fill-in-the-blank (vocab-heavy)
};

export const CONNOTATIONS = ['positive', 'negative', 'neutral'];

/**
 * The scaffold ladder. Tasks are ordered by `tier` (1 = simplest encounter,
 * 5 = exam form). `kind: 'teach'` is a non-graded encounter card; everything
 * else is a multiple-choice exercise. `requires` lists the entry fields a task
 * needs — the generator returns null when an entry lacks the data, so the
 * engine simply skips inapplicable tasks for that word.
 */
export const TASK_TYPES = [
  {
    id: 'meet_word',
    label: 'Meet the word',
    tier: 1,
    kind: 'teach',
    subskills: [VOCAB_SUBSKILLS.MEANING],
    examSection: null,
    requires: ['meaning'],
    instruction: 'Read the word, what it means, and how it is used.',
  },
  {
    id: 'meaning_match',
    label: 'What does it mean?',
    tier: 1,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.MEANING],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['meaning'],
    instruction: 'Choose the meaning of the word in bold.',
  },
  {
    id: 'word_recall',
    label: 'Which word fits the meaning?',
    tier: 2,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.MEANING],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['meaning'],
    instruction: 'Choose the word that matches the meaning.',
  },
  {
    id: 'synonym_match',
    label: 'Closest in meaning',
    tier: 2,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.SYNONYM, VOCAB_SUBSKILLS.MEANING],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_CLOZE,
    requires: ['synonyms'],
    instruction: 'Choose the word closest in meaning to the word in bold.',
  },
  {
    id: 'odd_one_out',
    label: 'Odd one out',
    tier: 3,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.SYNONYM, VOCAB_SUBSKILLS.NUANCE],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_CLOZE,
    requires: ['synonyms'],
    instruction: 'Three words share a meaning. Choose the one that does NOT belong.',
  },
  {
    id: 'connotation_pick',
    label: 'Positive or negative?',
    tier: 3,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.CONNOTATION],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['connotation'],
    instruction: 'Does this word give a positive, negative or neutral feeling?',
  },
  {
    id: 'nuance_pick',
    label: 'Pick the precise word',
    tier: 4,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.NUANCE, VOCAB_SUBSKILLS.CONFUSABLE],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['example', 'confusables'],
    instruction: 'These words are close in meaning. Choose the one that fits the sentence best.',
  },
  {
    id: 'collocation_pick',
    label: 'Words that go together',
    tier: 4,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.COLLOCATION],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['collocations'],
    instruction: 'Choose the word that goes together with the others.',
  },
  {
    id: 'word_form_pick',
    label: 'Right form of the word',
    tier: 4,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.WORD_FORM],
    examSection: VOCAB_EXAM_SECTIONS.COMPREHENSION_CLOZE,
    requires: ['wordFamily'],
    instruction: 'Choose the correct form of the word for the sentence.',
  },
  {
    id: 'phrasal_verb_pick',
    label: 'Phrasal verb',
    tier: 4,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.PHRASAL_VERB, VOCAB_SUBSKILLS.MEANING],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['example', 'isPhrasalVerb'],
    instruction: 'Choose the phrasal verb that completes the sentence.',
  },
  {
    id: 'sentence_cloze',
    label: 'Exam: best word',
    tier: 5,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.MEANING, VOCAB_SUBSKILLS.NUANCE, VOCAB_SUBSKILLS.COLLOCATION],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_MCQ,
    requires: ['example'],
    instruction: 'Choose the word that best completes the sentence.',
  },
  {
    id: 'cloze_synonym',
    label: 'Exam: closest in meaning',
    tier: 5,
    kind: 'mcq',
    subskills: [VOCAB_SUBSKILLS.SYNONYM],
    examSection: VOCAB_EXAM_SECTIONS.VOCAB_CLOZE,
    requires: ['example', 'synonyms'],
    instruction: 'Choose the word closest in meaning to the underlined word.',
  },
];

export const TASK_TYPE_BY_ID = Object.fromEntries(TASK_TYPES.map((t) => [t.id, t]));

export const MAX_TIER = TASK_TYPES.reduce((m, t) => Math.max(m, t.tier), 0);

/** Human-facing description of each tier, for progress UIs. */
export const TIERS = [
  { tier: 1, name: 'Meet & recognise', summary: 'Meet the word and recognise its meaning.' },
  { tier: 2, name: 'Recall & match', summary: 'Recall the word and match it to a synonym.' },
  { tier: 3, name: 'Group & feel', summary: 'Sort by meaning and sense its positive/negative feel.' },
  { tier: 4, name: 'Use precisely', summary: 'Choose precisely between near-synonyms, collocations and forms.' },
  { tier: 5, name: 'Exam form', summary: 'Answer the question exactly as the paper asks it.' },
];

const REQUIRED_ENTRY_FIELDS = ['id', 'word', 'meaning'];

/**
 * Validate and fill in defaults for a raw word entry. Throws on missing
 * required fields so a malformed bank fails loudly at load time rather than
 * producing silently-broken exercises.
 */
export function normalizeWordEntry(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Vocabulary entry must be an object');
  }
  for (const field of REQUIRED_ENTRY_FIELDS) {
    if (!raw[field] || typeof raw[field] !== 'string') {
      throw new Error(`Vocabulary entry "${raw.id || raw.word || '?'}" is missing required field "${field}"`);
    }
  }
  const connotation = raw.connotation && CONNOTATIONS.includes(raw.connotation) ? raw.connotation : 'neutral';
  const wordFamily = (raw.wordFamily || []).map((f) =>
    typeof f === 'string' ? { word: f, pos: 'other' } : { word: f.word, pos: f.pos || 'other' }
  );
  return {
    id: raw.id,
    word: raw.word,
    pos: raw.pos || 'other',
    level: raw.level || 'P6',
    theme: raw.theme || 'general',
    cluster: raw.cluster || null,
    meaning: raw.meaning,
    // An exam-style sentence. The answer word is rendered as `____` where the
    // blank should appear (the generator inserts the blank token).
    example: raw.example || '',
    // The literal word/phrase that fills the example's blank (defaults to the
    // headword, but phrasal-verb entries differ, e.g. "bring up").
    answer: raw.answer || raw.word,
    synonyms: dedupeStrings(raw.synonyms),
    // The real exam distractors — near-synonyms / look-alikes that students
    // confuse this word with. These are the raw material for discrimination.
    confusables: dedupeStrings(raw.confusables),
    connotation,
    collocations: dedupeStrings(raw.collocations),
    wordFamily,
    isPhrasalVerb: Boolean(raw.isPhrasalVerb) || /\s/.test(raw.answer || ''),
    examTags: dedupeStrings(raw.examTags),
    mnemonic: raw.mnemonic || '',
    source: raw.source || '',
  };
}

function dedupeStrings(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const s = typeof item === 'string' ? item.trim() : '';
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

/** Which task types are actually applicable to a (normalized) entry. */
export function applicableTaskTypes(entry) {
  return TASK_TYPES.filter((task) => taskApplies(task, entry));
}

export function taskApplies(task, entry) {
  return task.requires.every((field) => {
    if (field === 'isPhrasalVerb') return entry.isPhrasalVerb === true;
    const value = entry[field];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

/** The graded (non-teach) task types applicable to an entry, in ladder order. */
export function gradedLadder(entry) {
  return applicableTaskTypes(entry)
    .filter((t) => t.kind !== 'teach')
    .sort((a, b) => a.tier - b.tier);
}
