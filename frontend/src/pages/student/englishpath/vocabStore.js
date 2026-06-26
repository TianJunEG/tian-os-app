// EnglishPath Vocabulary — client-side progress store.
// The adaptive engine state is plain JSON, so we persist it in localStorage,
// namespaced per student. This makes the module fully playable with no backend;
// a server-backed store can replace this later behind the same load/save shape.
import { initState } from '../../../../../shared/englishpath/vocabulary/index.js';

const STORAGE_KEY = 'tianos.englishpath.vocab.v1';

function keyFor(studentId) {
  return studentId ? `${STORAGE_KEY}.${studentId}` : STORAGE_KEY;
}

export function loadVocabState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return initState();
  try {
    const raw = window.localStorage.getItem(keyFor(studentId));
    if (!raw) return initState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.words) return initState();
    return { ...initState(parsed.config), words: parsed.words };
  } catch (_) {
    return initState();
  }
}

export function saveVocabState(studentId, state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(keyFor(studentId), JSON.stringify(state));
  } catch (_) {
    /* quota / serialization issues are non-fatal for practice */
  }
}

export function resetVocabState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(keyFor(studentId));
  } catch (_) {
    /* ignore */
  }
}
