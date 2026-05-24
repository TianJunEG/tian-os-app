// Per-list language metadata for the spelling app. English and Malay use the
// Latin alphabet (typed); Chinese is character-based and practised by
// handwriting (finger / stylus) with self-marking instead of typing.

export const LANGUAGES = [
  ['en', 'English'],
  ['ms', 'Bahasa Melayu'],
  ['zh', '中文 (Mandarin)']
];

const LABELS = Object.fromEntries(LANGUAGES);
// Short tag used on list cards.
const SHORT = { en: 'English', ms: 'Melayu', zh: '中文' };

export const langLabel = (code) => LABELS[code] || LABELS.en;
export const langShort = (code) => SHORT[code] || SHORT.en;

// Chinese answers are handwritten, not typed.
export const isHandwritten = (code) => code === 'zh';

// English-only because the auto-fill uses an English dictionary API.
export const supportsDictionary = (code) => (code || 'en') === 'en';

// Activities that don't translate to character-based Chinese: the letter games
// (word search, crossword, missing letters) and the typed passage dictation.
const BLOCKED_FOR_ZH = new Set(['dictation', 'missing', 'wordsearch', 'crossword']);

// Filters an activity list (objects with a `key`) down to those that make sense
// for the given language.
export const activitiesForLanguage = (activities, code) =>
  code === 'zh' ? activities.filter((a) => !BLOCKED_FOR_ZH.has(a.key)) : activities;

// Placeholder for the word input in the editor.
export const wordPlaceholder = (code) =>
  code === 'zh' ? '字 / 词' : code === 'ms' ? 'perkataan' : 'word';
