// ELPath Comprehension Cloze — client-side progress store.
// The engine state is plain JSON, persisted in localStorage namespaced per
// student — fully playable with no backend; a server store can replace this
// later behind the same load/save shape (mirrors vocabStore).
import { initClozeState } from '../../../../../shared/englishpath/cloze/index.js';

const STORAGE_KEY = 'tianos.englishpath.cloze.v1';

function keyFor(studentId) {
  return studentId ? `${STORAGE_KEY}.${studentId}` : STORAGE_KEY;
}

export function loadClozeState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return initClozeState();
  try {
    const raw = window.localStorage.getItem(keyFor(studentId));
    if (!raw) return initClozeState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.passages !== 'object') return initClozeState();
    return { passages: parsed.passages };
  } catch (_) {
    return initClozeState();
  }
}

export function saveClozeState(studentId, state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(keyFor(studentId), JSON.stringify(state));
  } catch (_) {
    /* quota / serialization issues are non-fatal for practice */
  }
}

export function resetClozeState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(keyFor(studentId));
  } catch (_) {
    /* ignore */
  }
}
